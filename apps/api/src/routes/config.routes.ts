import { Router } from 'express';
import { configController } from '../controllers/config.controller';
import { ensureAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

// Protected: Only authenticated users can receive the path configuration
router.get('/', ensureAuthenticated, configController.getPathConfig);
router.get('/paths', ensureAuthenticated, configController.getPathConfig);

export default router;
