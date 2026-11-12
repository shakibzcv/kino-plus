import compression from 'compression';
import cors from 'cors';
import express, { Express } from 'express';
import session from 'express-session';
import passport from 'passport';
import { ENV } from './config/env';
import { configurePassport } from './config/passport';
import morganMiddleware from './logger/morgan.logger';
import router from './routes';
import { errorHandler } from './middlewares/error.middleware';
import './types/user';

export function createApp(): Express {
  const app = express();

  // 1. Initialize Passport.js strategy
  configurePassport();

  // 1b. gzip JSON responses (home sections are large lists; big win on slow networks)
  app.use(compression());

  // 2. CORS configuration (supports credentials for sessions & cross-origin cookies)
  app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          origin.startsWith('http://localhost') ||
          origin.startsWith('http://192.168.') ||
          origin.startsWith('http://10.') ||
          origin.startsWith('http://127.0.0.1') ||
          origin === ENV.CLIENT_URL
        ) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-user-id'],
    })
  );

  // 3. Body Parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 4. HTTP Request Logger (Morgan -> Winston)
  app.use(morganMiddleware);

  // 5. Session middleware for Passport
  app.use(
    session({
      secret: ENV.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: ENV.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
      },
    })
  );

  // 6. Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // 7. Routes (supporting both /api and root prefixes)
  app.use('/api', router);
  app.use('/', router);

  // 8. Central Error Handling Middleware (must be registered after routes)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
