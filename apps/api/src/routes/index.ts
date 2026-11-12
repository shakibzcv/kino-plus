import { Router } from 'express';
import authRouter from './auth.routes';
import moviesRouter from './movies.routes';
import storageRouter from './storage.routes';
import userDataRouter from './user-data.routes';
import configRouter from './config.routes';
import countryRouter from './country.routes';
import healthRouter from './health.routes';

const router = Router();

// Root — deny fingerprinting
router.get('/', (_req, res) => {
  return res.status(403).send('Access Denied!');
});

// ─── Health check ────────────────────────────────────────────────────────────
router.use('/health', healthRouter);

// ─── No auth required ────────────────────────────────────────────────────────
router.use('/country', countryRouter);

// ─── Auth (no auth required) ────────────────────────────────────────────────
router.use('/auth', authRouter);

// ─── Protected (auth required) ───────────────────────────────────────────────
router.use('/config', configRouter);
router.use('/movies', moviesRouter);
router.use('/storage', storageRouter);
router.use('/user', userDataRouter);

export default router;
export { router };
