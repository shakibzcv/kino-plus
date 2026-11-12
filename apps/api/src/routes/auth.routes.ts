import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { ensureAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

// 1. Google OAuth Authentication flow
router.post('/mobile/google', authController.mobileGoogleLogin);
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

// 2. Token Refresh
router.post('/refresh', authController.refreshToken);

// 3. Current User Profile (Protected)
router.get('/me', ensureAuthenticated, authController.getMe);
router.get('/current-user', ensureAuthenticated, authController.getMe);

// 4. Logout (Protected or with refresh token)
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

// 4b. Device / session management (Protected)
router.get('/sessions', ensureAuthenticated, authController.listSessions);
router.post('/sessions/revoke-others', ensureAuthenticated, authController.revokeOtherSessions);
router.delete('/sessions/:id', ensureAuthenticated, authController.revokeSession);

// 5. Configuration status
router.get('/status', authController.getStatus);

export default router;
