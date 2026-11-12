import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { userDataService } from '../services/user-data.services';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

// ─── Server-side rate gate for continue-watching saves ────────────────────────
// Prevents the DB from being hit more than once every 30s per user+media+episode.
// Keys expire automatically when the window passes; no cleanup needed for a small
// number of concurrent users.
const _cwLastSave = new Map<string, number>();
const CW_MIN_INTERVAL_MS = 30_000; // 30 seconds

export function getUserId(req: Request): string {
  if (req.user && (req.user as any).id) {
    return (req.user as any).id;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
      if (decoded?.id) return String(decoded.id);
    } catch {
      // ignore token verification error
    }
  }
  const customId = req.headers['x-user-id'] as string;
  if (customId && typeof customId === 'string' && customId.trim()) {
    return customId.trim();
  }
  return 'default_user';
}

export class UserDataController {
  /* ========================================================
     📌 WATCHLIST HANDLERS (MOVIES & TV SHOWS)
     ======================================================== */

  async getWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const items = await userDataService.getWatchlist(userId);
      res.status(200).json(new ApiResponse(200, items, 'Watchlist retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  async addToWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const {
        mediaId,
        mediaType,
        title,
        posterPath,
        backdropPath,
        logoPath,
        logo,
        overview,
        rating,
        voteAverage,
        category,
        genres,
        seasonNumber,
        episodeNumber,
        episodeTitle,
        seriesId,
      } = req.body;

      if (!mediaId || !mediaType || !title) {
        throw new ApiError(400, 'mediaId, mediaType, and title are required');
      }

      const item = await userDataService.addToWatchlist({
        userId,
        mediaId: String(mediaId),
        mediaType,
        title,
        posterPath,
        backdropPath,
        logoPath: logoPath || logo || undefined,
        logo: logoPath || logo || undefined,
        overview,
        rating: rating != null ? parseFloat(rating) : (voteAverage != null ? parseFloat(voteAverage) : undefined),
        voteAverage: voteAverage != null ? parseFloat(voteAverage) : (rating != null ? parseFloat(rating) : undefined),
        category: category || (Array.isArray(genres) ? genres.join(', ') : genres) || undefined,
        genres: Array.isArray(genres) ? genres : undefined,
        seasonNumber: seasonNumber ? Number(seasonNumber) : undefined,
        episodeNumber: episodeNumber ? Number(episodeNumber) : undefined,
        episodeTitle,
        seriesId: seriesId ? String(seriesId) : undefined,
      });

      res.status(201).json(new ApiResponse(201, item, 'Item added to watchlist'));
    } catch (err) {
      next(err);
    }
  }

  async removeFromWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const { mediaType, mediaId } = req.params;

      if (!mediaType && !mediaId) {
        throw new ApiError(400, 'mediaId parameter is required');
      }

      const removed = mediaId
        ? await userDataService.removeFromWatchlist(userId, String(mediaType), String(mediaId))
        : await userDataService.removeFromWatchlist(userId, String(mediaType));

      res.status(200).json(new ApiResponse(200, { removed }, 'Item removed from watchlist'));
    } catch (err) {
      next(err);
    }
  }

  async checkInWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const { mediaType, mediaId } = req.params;

      const inWatchlist = await userDataService.isInWatchlist(userId, String(mediaType), String(mediaId));
      res.status(200).json(new ApiResponse(200, { inWatchlist }, 'Watchlist status checked'));
    } catch (err) {
      next(err);
    }
  }

  /* ========================================================
     ▶️ CONTINUE WATCHING HANDLERS (MOVIES & TV SHOWS)
     ======================================================== */

  async getContinueWatching(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const items = await userDataService.getContinueWatching(userId);
      res.status(200).json(new ApiResponse(200, items, 'Continue watching retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  async saveContinueWatching(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const {
        mediaId,
        mediaType,
        title,
        posterPath,
        backdropPath,
        logoPath,
        logo,
        overview,
        description,
        rating,
        voteAverage,
        category,
        genres,
        seasonNumber,
        episodeNumber,
        episodeTitle,
        progressPercentage,
        playbackPosition,
        duration,
      } = req.body;

      if (!mediaId || !mediaType || !title) {
        throw new ApiError(400, 'mediaId, mediaType, and title are required');
      }

      // ── Rate gate: skip DB write if the same entry was saved < 30 s ago ────
      const rateKey = `${userId}|${mediaId}|${mediaType}|${seasonNumber || 1}|${episodeNumber || 1}`;
      const now = Date.now();
      const lastSave = _cwLastSave.get(rateKey);
      if (lastSave && now - lastSave < CW_MIN_INTERVAL_MS) {
        // Return 200 so the client thinks it succeeded — just skip the DB work
        res.status(200).json(new ApiResponse(200, null, 'Rate limited — skipped'));
        return;
      }
      _cwLastSave.set(rateKey, now);
      // ── Proceed with DB upsert ───────────────────────────────────────────────

      const item = await userDataService.saveContinueWatching({
        userId,
        mediaId: String(mediaId),
        mediaType,
        title,
        posterPath,
        backdropPath,
        logoPath: logoPath || logo || undefined,
        logo: logoPath || logo || undefined,
        overview: overview || description || undefined,
        description: overview || description || undefined,
        rating: rating != null ? parseFloat(rating) : (voteAverage != null ? parseFloat(voteAverage) : undefined),
        voteAverage: voteAverage != null ? parseFloat(voteAverage) : (rating != null ? parseFloat(rating) : undefined),
        category: category || (Array.isArray(genres) ? genres.join(', ') : genres) || undefined,
        genres: Array.isArray(genres) ? genres : undefined,
        seasonNumber: seasonNumber ? parseInt(seasonNumber, 10) : 1,
        episodeNumber: episodeNumber ? parseInt(episodeNumber, 10) : 1,
        episodeTitle,
        progressPercentage: progressPercentage ? parseInt(progressPercentage, 10) : 0,
        playbackPosition: playbackPosition ? parseInt(playbackPosition, 10) : 0,
        duration: duration ? parseInt(duration, 10) : 0,
      });

      res.status(200).json(new ApiResponse(200, item, 'Continue watching progress saved'));
    } catch (err) {
      next(err);
    }
  }

  async removeContinueWatching(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const { mediaType, mediaId } = req.params;

      if (!mediaType || !mediaId) {
        throw new ApiError(400, 'mediaType and mediaId parameters are required');
      }

      const removed = await userDataService.removeContinueWatching(userId, String(mediaType), String(mediaId));
      res.status(200).json(new ApiResponse(200, { removed }, 'Removed from continue watching'));
    } catch (err) {
      next(err);
    }
  }

  /* ========================================================
     🔍 SEARCH HISTORY HANDLERS
     ======================================================== */

  async getSearchHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
      const history = await userDataService.getSearchHistory(userId, limit);
      res.status(200).json(new ApiResponse(200, history, 'Search history retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  async saveSearchHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const { query } = req.body;

      if (!query || typeof query !== 'string' || !query.trim()) {
        throw new ApiError(400, 'query is required');
      }

      const item = await userDataService.saveSearchHistory(userId, query);
      res.status(201).json(new ApiResponse(201, item, 'Search query saved to history'));
    } catch (err) {
      next(err);
    }
  }

  async removeSearchHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const queryParam = req.params.query || req.query.query || req.body?.query;

      if (!queryParam || typeof queryParam !== 'string' || !queryParam.trim()) {
        throw new ApiError(400, 'query parameter is required to remove specific history');
      }

      const removed = await userDataService.removeSearchHistory(userId, queryParam);
      res.status(200).json(new ApiResponse(200, { removed }, 'Search history item removed'));
    } catch (err) {
      next(err);
    }
  }

  async clearSearchHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const cleared = await userDataService.clearSearchHistory(userId);
      res.status(200).json(new ApiResponse(200, { cleared }, 'Search history cleared successfully'));
    } catch (err) {
      next(err);
    }
  }

  /* ========================================================
     🗑️ DELETE ACCOUNT HANDLER
     ======================================================== */

  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);

      const deleted = await userDataService.deleteAccount(userId);
      if (deleted) {
        res.status(200).json(new ApiResponse(200, { deleted }, 'Account deleted successfully'));
      } else {
        throw new ApiError(500, 'Failed to delete account');
      }
    } catch (err) {
      next(err);
    }
  }
}

export const userDataController = new UserDataController();
export default userDataController;
