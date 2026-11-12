import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { authService, DbUser } from '../services/auth.services';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import logger from '../logger/winston.logger';
import * as sessionQ from '../db/queries/sessions.queries';

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1] || null;
  }
  return null;
}

export const authController = {
  // 1. Mobile Google Auth endpoint
  mobileGoogleLogin: asyncHandler(async (req: Request, res: Response) => {
    const { user: rawUser, idToken, accessToken: googleAccessToken } = req.body;

    if (!rawUser?.email && !rawUser?.id) {
      throw new ApiError(400, 'Invalid Google user payload');
    }

    const email = rawUser.email || '';
    const googleId = rawUser.id || '';

    const user: DbUser = await authService.upsertGoogleUser({
      googleId,
      email,
      name: rawUser.name || email.split('@')[0],
      firstName: rawUser.givenName || rawUser.firstName,
      lastName: rawUser.familyName || rawUser.lastName,
      avatar: rawUser.photo || rawUser.avatar || '',
      accessToken: googleAccessToken,
      idToken,
    });

    const tokens = authService.generateTokens(user);

    const ipAddress = (req.ip || req.socket.remoteAddress || '').slice(0, 64);
    const userAgent = req.headers['user-agent'] || 'Mobile App';
    await authService.createSession({
      userId: user.id,
      sessionToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      ipAddress,
      userAgent,
    });

    logger.info(`[Auth] Mobile Google Sign-In: ${user.email} (${user.id})`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user,
          token: tokens.accessToken,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        },
        'Mobile Google login authenticated successfully'
      )
    );
  }),

  // 2. Initiate Google OAuth (Web/Browser/Desktop)
  googleLogin: (req: Request, res: Response, next: NextFunction) => {
    if (!ENV.GOOGLE.CLIENT_ID || !ENV.GOOGLE.CLIENT_SECRET) {
      return next(
        new ApiError(500, 'Google OAuth credentials not configured in server environment (.env).')
      );
    }
    const client = ((req.query.client as string) || '').trim().toLowerCase();
    const state = client ? JSON.stringify({ client }) : undefined;
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      accessType: 'offline',
      prompt: 'consent',
      state,
    })(req, res, next);
  },

  // 3. Google OAuth Callback (Web/Browser/Desktop)
  googleCallback: (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', async (err: Error | null, user: DbUser | false) => {
      if (err) {
        logger.error(`[Auth] Google OAuth callback error: ${err.message}`);
        return next(err);
      }
      if (!user) {
        return res.redirect(`${ENV.CLIENT_URL}/login?error=auth_failed`);
      }

      req.logIn(user, async (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }

        const tokens = authService.generateTokens(user);

        const ipAddress = (req.ip || req.socket.remoteAddress || '').slice(0, 64);
        const userAgent = req.headers['user-agent'] || 'Web Browser';
        try {
          await authService.createSession({
            userId: user.id,
            sessionToken: tokens.refreshToken,
            accessToken: tokens.accessToken,
            ipAddress,
            userAgent,
          });
        } catch (sessionErr: any) {
          logger.error(`[Auth] Failed to create session: ${sessionErr.message}`);
        }

        logger.info(`[Auth] Google login authenticated: ${user.email} (${user.id})`);

        let clientType: string = 'web';
        if (req.query.state && typeof req.query.state === 'string') {
          try {
            const parsed = JSON.parse(req.query.state);
            if (parsed.client) clientType = parsed.client;
          } catch {}
        }

        res.cookie('token', tokens.accessToken, {
          httpOnly: false,
          secure: ENV.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
        });
        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: ENV.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000,
          sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        const redirectUrl =
          clientType === 'desktop'
            ? `${ENV.CLIENT_URL}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&client=desktop`
            : `${ENV.CLIENT_URL}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;

        return res.redirect(redirectUrl);
      });
    })(req, res, next);
  },

  // 4. Token Refresh
  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken =
      req.body?.refreshToken ||
      req.cookies?.refreshToken ||
      req.headers['x-refresh-token'];

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    const ipAddress = (req.ip || req.socket.remoteAddress || '').slice(0, 64);
    const userAgent = req.headers['user-agent'] || 'API Client';

    const { user, tokens } = await authService.refreshSession(
      refreshToken,
      ipAddress,
      userAgent
    );

    res.cookie('token', tokens.accessToken, {
      httpOnly: false,
      secure: ENV.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user,
          token: tokens.accessToken,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        },
        'Tokens refreshed successfully'
      )
    );
  }),

  // 5. Current User Profile
  getMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const accounts = await authService.getUserAccounts(req.user.id);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: req.user,
          accounts: accounts.map((acc) => ({
            id: acc.id,
            provider: acc.provider,
            providerAccountId: acc.provider_account_id,
            createdAt: acc.created_at,
          })),
        },
        'Profile retrieved successfully'
      )
    );
  }),

  // 6. Logout
  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken =
      req.body?.refreshToken ||
      req.cookies?.refreshToken ||
      req.headers['x-refresh-token'];

    if (refreshToken) {
      try {
        await authService.deleteSession(refreshToken);
      } catch (err: any) {
        logger.warn(`[Auth] Session token deletion failed: ${err.message}`);
      }
    }

    if (req.user) {
      const bearerToken = getBearerToken(req);
      if (bearerToken) {
        try {
          await sessionQ.deleteSessionsByUserId(req.user.id);
        } catch {}
      }
    }

    req.logout?.(() => {});

    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.clearCookie('connect.sid');

    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  }),

  // 7. List Active Sessions
  listSessions: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const currentAccessToken = getBearerToken(req);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const data = await authService.getUserSessionsForClient(
      req.user.id,
      currentAccessToken,
      page,
      limit
    );

    return res.status(200).json(new ApiResponse(200, data, 'Active sessions retrieved successfully'));
  }),

  // 8. Revoke Specific Session
  revokeSession: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const rawId = req.params.id;
    const sessionId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!sessionId) {
      throw new ApiError(400, 'Session ID is required');
    }

    const currentAccessToken = getBearerToken(req);
    const result = await authService.deleteSessionById(
      req.user.id,
      sessionId,
      currentAccessToken
    );

    if (result === 'current') {
      throw new ApiError(400, 'Cannot revoke your current session here. Please use logout instead.');
    }
    if (result === 'missing') {
      throw new ApiError(404, 'Session not found or already revoked');
    }

    return res.status(200).json(new ApiResponse(200, null, 'Session revoked successfully'));
  }),

  // 9. Revoke All Other Sessions
  revokeOtherSessions: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const currentAccessToken = getBearerToken(req);
    if (!currentAccessToken) {
      throw new ApiError(400, 'Cannot revoke other sessions without a valid Bearer token for current session');
    }

    const count = await authService.deleteOtherSessions(req.user.id, currentAccessToken);

    return res.status(200).json(
      new ApiResponse(200, { revokedCount: count }, `Revoked ${count} other active session(s)`)
    );
  }),

  // 10. Status
  getStatus: asyncHandler(async (_req: Request, res: Response) => {
    const isConfigured = Boolean(ENV.GOOGLE.CLIENT_ID && ENV.GOOGLE.CLIENT_SECRET);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          googleAuthAvailable: isConfigured,
          databaseConfigured: Boolean(ENV.DATABASE.URL),
          storageConfigured: Boolean(ENV.STORAGE.ACCESS_KEY_ID && ENV.STORAGE.SECRET_ACCESS_KEY),
        },
        'Auth service configuration status'
      )
    );
  }),
};

export default authController;

