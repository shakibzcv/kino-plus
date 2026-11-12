import logger from '../logger/winston.logger';
import * as q from '../db/queries/user-data.queries';

export interface WatchlistItem {
  id?: number;
  userId: string;
  mediaId: string;
  mediaType: 'movie' | 'tv' | 'episode';
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  logoPath?: string | null;
  logo?: string | null;
  overview?: string | null;
  rating?: number | null;
  voteAverage?: number | null;
  category?: string | null;
  genres?: string[] | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  episodeTitle?: string | null;
  seriesId?: string | null;
  addedAt?: string;
}

export interface ContinueWatchingItem {
  id?: number;
  userId: string;
  mediaId: string;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  logoPath?: string | null;
  logo?: string | null;
  overview?: string | null;
  description?: string | null;
  rating?: number | null;
  voteAverage?: number | null;
  category?: string | null;
  genres?: string[] | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string | null;
  progressPercentage?: number;
  playbackPosition?: number;
  duration?: number;
  updatedAt?: string;
}

export interface SearchHistoryItem {
  id?: number;
  userId: string;
  query: string;
  searchedAt?: string;
}

export class UserDataService {
  /* ========================================================
     📌 WATCHLIST OPERATIONS
     ======================================================== */

  async getWatchlist(userId: string): Promise<WatchlistItem[]> {
    try {
      const res = await q.getWatchlist(userId);
      return res.rows.map((row) => {
        const logo = row.logo || row.logo_path || null;
        return {
          id: row.id,
          userId: row.user_id,
          mediaId: row.media_id,
          mediaType: row.media_type,
          title: row.title,
          posterPath: row.poster_path,
          backdropPath: row.backdrop_path,
          logoPath: logo,
          logo: logo,
          overview: row.overview,
          rating: row.rating ? parseFloat(row.rating) : null,
          voteAverage: row.vote_average ? parseFloat(row.vote_average) : (row.rating ? parseFloat(row.rating) : null),
          category: row.category || null,
          genres: row.category ? row.category.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          seasonNumber: row.season_number ?? null,
          episodeNumber: row.episode_number ?? null,
          episodeTitle: row.episode_title ?? null,
          seriesId: row.series_id ?? null,
          addedAt: row.added_at,
        };
      });
    } catch (error: any) {
      logger.error(`[UserDataService] getWatchlist error: ${error.message}`);
      return [];
    }
  }

  async addToWatchlist(item: WatchlistItem): Promise<WatchlistItem | null> {
    try {
      const categoryVal = item.category || (Array.isArray(item.genres) ? item.genres.join(', ') : null) || null;
      const logoVal = item.logoPath || item.logo || null;

      const res = await q.upsertWatchlistItem(
        item.userId, item.mediaId, item.mediaType, item.title,
        item.posterPath || null, item.backdropPath || null, logoVal,
        item.overview || null, item.rating || null,
        item.voteAverage || item.rating || null, categoryVal,
        item.seasonNumber ?? null, item.episodeNumber ?? null,
        item.episodeTitle || null, item.seriesId || null
      );
      const row = res.rows[0];
      const logo = row.logo || row.logo_path || null;
      return {
        id: row.id,
        userId: row.user_id,
        mediaId: row.media_id,
        mediaType: row.media_type,
        title: row.title,
        posterPath: row.poster_path,
        backdropPath: row.backdrop_path,
        logoPath: logo,
        logo: logo,
        overview: row.overview,
        rating: row.rating ? parseFloat(row.rating) : null,
        voteAverage: row.vote_average ? parseFloat(row.vote_average) : null,
        category: row.category || null,
        genres: row.category ? row.category.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        seasonNumber: row.season_number ?? null,
        episodeNumber: row.episode_number ?? null,
        episodeTitle: row.episode_title ?? null,
        seriesId: row.series_id ?? null,
        addedAt: row.added_at,
      };
    } catch (error: any) {
      logger.error(`[UserDataService] addToWatchlist error: ${error.message}`);
      return null;
    }
  }

  async removeFromWatchlist(userId: string, mediaType: string, mediaId?: string): Promise<boolean> {
    try {
      let res;
      if (mediaId) {
        res = await q.deleteWatchlistItem(userId, mediaType, mediaId);
      } else {
        res = await q.deleteWatchlistItemById(userId, mediaType);
      }
      return (res.rowCount ?? 0) > 0;
    } catch (error: any) {
      logger.error(`[UserDataService] removeFromWatchlist error: ${error.message}`);
      return false;
    }
  }

  async isInWatchlist(userId: string, mediaType: string, mediaId: string): Promise<boolean> {
    try {
      const res = await q.isInWatchlist(userId, mediaType, mediaId);
      return res.rows.length > 0;
    } catch (error: any) {
      logger.error(`[UserDataService] isInWatchlist error: ${error.message}`);
      return false;
    }
  }

  /* ========================================================
     ▶️ CONTINUE WATCHING OPERATIONS
     ======================================================== */

  async getContinueWatching(userId: string): Promise<ContinueWatchingItem[]> {
    try {
      const res = await q.getContinueWatching(userId);
      return res.rows.map((row) => {
        const logo = row.logo || row.logo_path || null;
        return {
          id: row.id,
          userId: row.user_id,
          mediaId: row.media_id,
          mediaType: row.media_type,
          title: row.title,
          posterPath: row.poster_path,
          backdropPath: row.backdrop_path,
          logoPath: logo,
          logo: logo,
          overview: row.overview || null,
          description: row.overview || null,
          rating: row.rating ? parseFloat(row.rating) : null,
          voteAverage: row.vote_average ? parseFloat(row.vote_average) : (row.rating ? parseFloat(row.rating) : null),
          category: row.category || null,
          genres: row.category ? row.category.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          seasonNumber: row.season_number,
          episodeNumber: row.episode_number,
          episodeTitle: row.episode_title,
          progressPercentage: row.progress_percentage,
          playbackPosition: row.playback_position,
          duration: row.duration,
          updatedAt: row.updated_at,
        };
      });
    } catch (error: any) {
      logger.error(`[UserDataService] getContinueWatching error: ${error.message}`);
      return [];
    }
  }

  async saveContinueWatching(item: ContinueWatchingItem): Promise<ContinueWatchingItem | null> {
    try {
      const season = item.seasonNumber || 1;
      const episode = item.episodeNumber || 1;
      const logoVal = item.logoPath || item.logo || null;
      const overviewVal = item.overview || item.description || null;
      const ratingVal = item.rating != null ? item.rating : (item.voteAverage != null ? item.voteAverage : null);
      const voteAverageVal = item.voteAverage != null ? item.voteAverage : ratingVal;
      const categoryVal = item.category || (Array.isArray(item.genres) ? item.genres.join(', ') : null) || null;

      const res = await q.upsertContinueWatching(
        item.userId, item.mediaId, item.mediaType, item.title,
        item.posterPath || null, item.backdropPath || null, logoVal,
        overviewVal, ratingVal, voteAverageVal, categoryVal,
        season, episode, item.episodeTitle || null,
        item.progressPercentage || 0, item.playbackPosition || 0, item.duration || 0
      );
      const row = res.rows[0];
      const logo = row.logo || row.logo_path || null;
      return {
        id: row.id,
        userId: row.user_id,
        mediaId: row.media_id,
        mediaType: row.media_type,
        title: row.title,
        posterPath: row.poster_path,
        backdropPath: row.backdrop_path,
        logoPath: logo,
        logo: logo,
        overview: row.overview || null,
        description: row.overview || null,
        rating: row.rating ? parseFloat(row.rating) : null,
        voteAverage: row.vote_average ? parseFloat(row.vote_average) : (row.rating ? parseFloat(row.rating) : null),
        category: row.category || null,
        genres: row.category ? row.category.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        seasonNumber: row.season_number,
        episodeNumber: row.episode_number,
        episodeTitle: row.episode_title,
        progressPercentage: row.progress_percentage,
        playbackPosition: row.playback_position,
        duration: row.duration,
        updatedAt: row.updated_at,
      };
    } catch (error: any) {
      logger.error(`[UserDataService] saveContinueWatching error: ${error.message}`);
      return null;
    }
  }

  async removeContinueWatching(userId: string, mediaType: string, mediaId: string): Promise<boolean> {
    try {
      const res = await q.deleteContinueWatching(userId, mediaType, mediaId);
      return (res.rowCount ?? 0) > 0;
    } catch (error: any) {
      logger.error(`[UserDataService] removeContinueWatching error: ${error.message}`);
      return false;
    }
  }

  /* ========================================================
     🔍 SEARCH HISTORY OPERATIONS
     ======================================================== */

  async getSearchHistory(userId: string, limit = 10): Promise<SearchHistoryItem[]> {
    try {
      const res = await q.getSearchHistory(userId, limit);

      return res.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        query: row.query,
        searchedAt: row.searched_at,
      }));
    } catch (error: any) {
      logger.error(`[UserDataService] getSearchHistory error: ${error.message}`);
      return [];
    }
  }

  async saveSearchHistory(userId: string, queryText: string): Promise<SearchHistoryItem | null> {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) return null;

    try {
      const res = await q.upsertSearchHistory(userId, cleanQuery);

      const row = res.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        query: row.query,
        searchedAt: row.searched_at,
      };
    } catch (error: any) {
      logger.error(`[UserDataService] saveSearchHistory error: ${error.message}`);
      return null;
    }
  }

  async removeSearchHistory(userId: string, queryText: string): Promise<boolean> {
    try {
      const res = await q.deleteSearchHistoryItem(userId, queryText.trim());
      return (res.rowCount ?? 0) > 0;
    } catch (error: any) {
      logger.error(`[UserDataService] removeSearchHistory error: ${error.message}`);
      return false;
    }
  }

  async clearSearchHistory(userId: string): Promise<boolean> {
    try {
      await q.clearSearchHistory(userId);
      return true;
    } catch (error: any) {
      logger.error(`[UserDataService] clearSearchHistory error: ${error.message}`);
      return false;
    }
  }

  /* ========================================================
     🗑️ DELETE ACCOUNT OPERATION (CASCADE PURGE)
     ======================================================== */

  async deleteAccount(userId: string): Promise<boolean> {
    try {
      await q.deleteAllUserData(userId);
      await q.deleteUser(userId);

      logger.info(`[UserDataService] Account and all linked data completely purged for user: ${userId}`);
      return true;
    } catch (error: any) {
      logger.error(`[UserDataService] deleteAccount error: ${error.message}`);
      return false;
    }
  }
}

export const userDataService = new UserDataService();
export default userDataService;
