import { Router } from 'express';
import { moviesController } from '../controllers/movies.controller';
import { ensureAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

// All movie/content endpoints require an active authenticated session
router.use(ensureAuthenticated);

// Content lists/details come from TMDB and change slowly: allow a short private client cache.
router.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
  }
  next();
});

// Categories discovery & media filtering
router.get('/categories', moviesController.getCategories);
router.get('/category/:category', moviesController.getByCategory);

// Modular thematic endpoints
router.get('/trending', moviesController.getTrending);
router.get('/watchlisted', moviesController.getWatchlisted);
router.get('/recommended', moviesController.getRecommended);
router.get('/binge', moviesController.getBingeWorthy);
router.get('/trailers/trending', moviesController.getTrendingTrailers);
router.get('/trailers/new', moviesController.getNewTrailers);
router.get('/horror', moviesController.getHorror);
router.get('/leaving-soon', moviesController.getLeavingSoon);
router.get('/anime/action', moviesController.getAnimeAction);
router.get('/anime/top-rated', moviesController.getAnimeTopRated);
router.get('/anime/fantasy', moviesController.getAnimeFantasy);
router.get('/anime/comedy', moviesController.getAnimeComedy);
router.get('/anime/movies', moviesController.getAnimeMovies);
router.get('/anime', moviesController.getAnime);
router.get('/action', moviesController.getAction);
router.get('/scifi', moviesController.getSciFi);
router.get('/reality', moviesController.getReality);
router.get('/dramas', moviesController.getDramas);
router.get('/search', moviesController.searchMedia);
router.get('/details/:id', moviesController.getMovieDetails);
router.get('/tv/:id/ratings', moviesController.getTvSeriesRatings);
router.get('/tv/:id/season/:season', moviesController.getTvSeasonEpisodes);
router.get('/:id/logo', moviesController.getMovieLogo);
router.get('/:id/watch-providers', moviesController.getWatchProviders);
router.get('/:id', moviesController.getMovieDetails);

export default router;
