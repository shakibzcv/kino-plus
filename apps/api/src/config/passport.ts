import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ENV } from './env';
import { authService, DbUser } from '../services/auth.services';
import logger from '../logger/winston.logger';

export function configurePassport(): void {
  // Serialize user ID into session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from database
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authService.findUserById(id);
      done(null, user || null);
    } catch (err) {
      done(err, null);
    }
  });

  // Register GoogleStrategy
  if (ENV.GOOGLE.CLIENT_ID && ENV.GOOGLE.CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: ENV.GOOGLE.CLIENT_ID,
          clientSecret: ENV.GOOGLE.CLIENT_SECRET,
          callbackURL: ENV.GOOGLE.CALLBACK_URL,
          scope: ['profile', 'email'],
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: Profile,
          done: VerifyCallback
        ) => {
          try {
            const email = profile.emails?.[0]?.value || '';
            const avatar = profile.photos?.[0]?.value || '';
            const googleId = profile.id;

            // Upsert into users and accounts tables in Neon PostgreSQL
            const user: DbUser = await authService.upsertGoogleUser({
              googleId,
              email,
              name: profile.displayName || email.split('@')[0] || 'User',
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              avatar,
              accessToken,
              refreshToken,
            });

            logger.info(`[Passport] Google authentication successful for user ${user.email} (${user.id})`);
            return done(null, user);
          } catch (error) {
            logger.error(`[Passport] GoogleStrategy verify error: ${error}`);
            return done(error as Error, undefined);
          }
        }
      )
    );
  } else {
    logger.warn(
      '⚠️ Google OAuth credentials missing in .env (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). Google login requires these variables.'
    );
  }
}

export default passport;
