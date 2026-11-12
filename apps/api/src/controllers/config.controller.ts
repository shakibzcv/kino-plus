import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export interface PathConfigResponse {
  endpoints: {
    trending: string;
    watchlist: string;
    recommended: string;
    binge: string;
    categories: string;
    categoryMedia: string;
    newTrailers: string;
    trendingTrailers: string;
    horror: string;
    leavingSoon: string;
    anime: string;
    action: string;
    scifi: string;
    reality: string;
    dramas: string;
    details: string;
    search: string;
    continueWatching: string;
    providers: string;
  };
  routes: {
    trending: string;
    watchlist: string;
    recommended: string;
    binge: string;
    categories: string;
  };
  appRoutes: {
    home: string;
    categories: string;
    watchlist: string;
    search: string;
    settings: string;
  };
}

export const configController = {
  getPathConfig: asyncHandler(async (_req: Request, res: Response) => {
    const config: PathConfigResponse = {
      endpoints: {
        trending: '/movies/trending',
        watchlist: '/user/watchlist',
        recommended: '/movies/recommended',
        binge: '/movies/binge',
        categories: '/movies/categories',
        categoryMedia: '/movies/category/:category',
        newTrailers: '/movies/trailers/new',
        trendingTrailers: '/movies/trailers/trending',
        horror: '/movies/horror',
        leavingSoon: '/movies/leaving-soon',
        anime: '/movies/anime',
        action: '/movies/action',
        scifi: '/movies/scifi',
        reality: '/movies/reality',
        dramas: '/movies/dramas',
        details: '/movies/details/:id',
        search: '/movies/search',
        continueWatching: '/user/continue-watching',
        providers: '/providers',
      },
      routes: {
        trending: '/movies/trending',
        watchlist: '/user/watchlist',
        recommended: '/movies/recommended',
        binge: '/movies/binge',
        categories: '/movies/categories',
      },
      appRoutes: {
        home: '/',
        categories: '/categories',
        watchlist: '/watchlist',
        search: '/search',
        settings: '/settings',
      },
    };

    return res.status(200).json(
      new ApiResponse(200, config, 'Path configuration retrieved successfully')
    );
  }),
};

export default configController;
