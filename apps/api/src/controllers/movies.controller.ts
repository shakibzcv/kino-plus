import { Request, Response } from 'express';
import {
  fetchTrendingFromTMDB,
  fetchWatchlistedFromTMDB,
  fetchRecommendedFromTMDB,
  fetchBingeWorthyFromTMDB,
  fetchTrendingTrailersFromTMDB,
  fetchNewTrailersFromTMDB,
  fetchHorrorFromTMDB,
  fetchLeavingSoonFromTMDB,
  fetchAnimeFromTMDB,
  fetchAnimeActionFromTMDB,
  fetchAnimeTopRatedFromTMDB,
  fetchAnimeFantasyFromTMDB,
  fetchAnimeComedyFromTMDB,
  fetchAnimeMoviesFromTMDB,
  fetchActionFromTMDB,
  fetchSciFiFromTMDB,
  fetchRealityFromTMDB,
  fetchDramasFromTMDB,
  fetchMediaDetails,
  fetchCategoriesFromTMDB,
  fetchMediaByCategory,
  fetchLogoFromTMDB,
  fetchTvSeasonEpisodes,
  fetchTvSeriesRatings,
  searchFromTMDB,
  fetchWatchProviders,
} from '../services/tmdb';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const moviesController = {
  getCategories: asyncHandler(async (_req: Request, res: Response) => {
    const data = await fetchCategoriesFromTMDB();
    return res.status(200).json(new ApiResponse(200, data, 'Categories retrieved successfully'));
  }),

  getByCategory: asyncHandler(async (req: Request, res: Response) => {
    const rawCategory = req.params.category || 'action';
    const category = Array.isArray(rawCategory) ? rawCategory[0]! : rawCategory;
    const mediaType = (req.query.mediaType as 'all' | 'movie' | 'tv') || 'all';
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchMediaByCategory(category, mediaType, page);
    return res.status(200).json(new ApiResponse(200, data, `Media for category '${category}' retrieved successfully`));
  }),

  getMovieLogo: asyncHandler(async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const type = (req.query.type as 'movie' | 'tv') || 'movie';
    if (!id) {
      throw new ApiError(400, 'Movie or Show ID is required');
    }
    const logo = await fetchLogoFromTMDB(id, type);
    return res.status(200).json(new ApiResponse(200, { logo }, 'Logo retrieved successfully'));
  }),

  getMovieDetails: asyncHandler(async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const type = (req.query.type as 'movie' | 'tv') || undefined;
    if (!id) {
      throw new ApiError(400, 'Movie or Show ID is required');
    }
    const data = await fetchMediaDetails(id, type);
    return res.status(200).json(new ApiResponse(200, data, 'Media details retrieved successfully'));
  }),

  getTvSeasonEpisodes: asyncHandler(async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const rawSeason = req.params.season;
    const season = parseInt(Array.isArray(rawSeason) ? rawSeason[0] : rawSeason, 10) || 1;
    if (!id) {
      throw new ApiError(400, 'TV show ID is required');
    }
    const data = await fetchTvSeasonEpisodes(id, season);
    return res.status(200).json(new ApiResponse(200, data, `Season ${season} episodes retrieved`));
  }),

  getTvSeriesRatings: asyncHandler(async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
      throw new ApiError(400, 'TV show ID is required');
    }
    const data = await fetchTvSeriesRatings(id);
    if (!data) {
      throw new ApiError(404, 'Series ratings not found');
    }
    return res.status(200).json(new ApiResponse(200, data, 'Series ratings graph retrieved'));
  }),

  getTrending: asyncHandler(async (req: Request, res: Response) => {
    const timeWindow = (req.query.timeWindow as 'day' | 'week') || 'day';
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchTrendingFromTMDB(timeWindow, page);
    return res.status(200).json(new ApiResponse(200, data, 'Trending movies retrieved'));
  }),

  getWatchlisted: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchWatchlistedFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Watchlisted movies retrieved'));
  }),

  getRecommended: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchRecommendedFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Recommended movies retrieved'));
  }),

  getBingeWorthy: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchBingeWorthyFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Binge-worthy shows retrieved'));
  }),

  getTrendingTrailers: asyncHandler(async (_req: Request, res: Response) => {
    const data = await fetchTrendingTrailersFromTMDB();
    return res.status(200).json(new ApiResponse(200, data, 'Trending trailers retrieved'));
  }),

  getNewTrailers: asyncHandler(async (_req: Request, res: Response) => {
    const data = await fetchNewTrailersFromTMDB();
    return res.status(200).json(new ApiResponse(200, data, 'New trailers retrieved'));
  }),

  getHorror: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchHorrorFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Horror movies retrieved'));
  }),

  getLeavingSoon: asyncHandler(async (_req: Request, res: Response) => {
    const data = await fetchLeavingSoonFromTMDB();
    return res.status(200).json(new ApiResponse(200, data, 'Leaving soon titles retrieved'));
  }),

  getAnime: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchAnimeFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Anime shows retrieved'));
  }),

  getAnimeAction: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchAnimeActionFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Action anime retrieved'));
  }),

  getAnimeTopRated: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchAnimeTopRatedFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Top rated anime retrieved'));
  }),

  getAnimeFantasy: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchAnimeFantasyFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Fantasy anime retrieved'));
  }),

  getAnimeComedy: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchAnimeComedyFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Comedy anime retrieved'));
  }),

  getAnimeMovies: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchAnimeMoviesFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Anime movies retrieved'));
  }),

  getAction: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchActionFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Action movies retrieved'));
  }),

  getSciFi: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchSciFiFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Sci-Fi movies retrieved'));
  }),

  getReality: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchRealityFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Reality shows retrieved'));
  }),

  getDramas: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const data = await fetchDramasFromTMDB(page);
    return res.status(200).json(new ApiResponse(200, data, 'Dramas retrieved'));
  }),

  searchMedia: asyncHandler(async (req: Request, res: Response) => {
    const rawQuery = (req.query.q as string) || (req.query.query as string) || '';
    const query = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
    const page = parseInt(req.query.page as string, 10) || 1;

    if (!query || !query.trim()) {
      return res.status(200).json(
        new ApiResponse(
          200,
          { results: [], totalResults: 0, totalPages: 0, page: 1 },
          'Empty search query'
        )
      );
    }

    const cleanQuery = query.trim();
    const tmdbData = await searchFromTMDB(cleanQuery, page);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          results: tmdbData.results,
          totalResults: tmdbData.totalResults,
          totalPages: tmdbData.totalPages,
          page: tmdbData.page,
        },
        `Search results for '${cleanQuery}' retrieved`
      )
    );
  }),

  getWatchProviders: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const type = (req.query.type as string) === 'tv' ? 'tv' : 'movie';

    if (!id) {
      throw new ApiError(400, 'Media ID is required');
    }

    const providers = await fetchWatchProviders(String(id), type);
    return res.status(200).json(
      new ApiResponse(200, providers, 'Watch providers retrieved successfully')
    );
  }),
};

export default moviesController;
