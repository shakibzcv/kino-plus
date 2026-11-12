import { Router } from 'express';
import { userDataController } from '../controllers/user-data.controller';
import { ensureAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

// All user data endpoints require an active authenticated session
router.use(ensureAuthenticated);

/* ========================================================
   📌 WATCHLIST ENDPOINTS (MOVIES & TV SHOWS)
   ======================================================== */
router.get('/watchlist', (req, res, next) => userDataController.getWatchlist(req, res, next));
router.post('/watchlist', (req, res, next) => userDataController.addToWatchlist(req, res, next));
router.delete('/watchlist/:mediaType/:mediaId', (req, res, next) => userDataController.removeFromWatchlist(req, res, next));
router.delete('/watchlist/:mediaId', (req, res, next) => userDataController.removeFromWatchlist(req, res, next));
router.get('/watchlist/check/:mediaType/:mediaId', (req, res, next) => userDataController.checkInWatchlist(req, res, next));

/* ========================================================
   ▶️ CONTINUE WATCHING (MOVIES & TV) ENDPOINTS
   ======================================================== */
router.get('/continue-watching', (req, res, next) => userDataController.getContinueWatching(req, res, next));
router.post('/continue-watching', (req, res, next) => userDataController.saveContinueWatching(req, res, next));
router.delete('/continue-watching/:mediaType/:mediaId', (req, res, next) => userDataController.removeContinueWatching(req, res, next));

/* ========================================================
   🔍 SEARCH HISTORY ENDPOINTS
   ======================================================== */
router.get('/search-history', (req, res, next) => userDataController.getSearchHistory(req, res, next));
router.post('/search-history', (req, res, next) => userDataController.saveSearchHistory(req, res, next));
router.delete('/search-history/:query', (req, res, next) => userDataController.removeSearchHistory(req, res, next));
router.delete('/search-history', (req, res, next) => userDataController.clearSearchHistory(req, res, next));

/* ========================================================
   🗑️ DELETE ACCOUNT ENDPOINT
   ======================================================== */
router.delete('/account', (req, res, next) => userDataController.deleteAccount(req, res, next));

export default router;
