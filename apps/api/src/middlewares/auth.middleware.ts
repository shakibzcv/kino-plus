import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { authService } from '../services/auth.services';
import { ApiError } from '../utils/ApiError';
import { getAuthCache, setAuthCache } from '../utils/authCache';
import * as sessionQ from '../db/queries/sessions.queries';

export async function ensureAuthenticated(req: Request, _res: Response, next: NextFunction): Promise<void> {
  // 1. Check Passport session authentication
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    const passportUser = req.user as { id: string };
    const sessionKey = `passport:${passportUser.id}`;
    if (getAuthCache<boolean>(sessionKey)) return next();
    const sessionValid = await hasLiveSession(passportUser.id);
    if (sessionValid) {
      setAuthCache(sessionKey, true);
      return next();
    }
    // Session was deleted — force logout
    req.logout(() => {});
    return next(new ApiError(401, 'Your session has been revoked. Please sign in again.'));
  }

  // 2. Check JWT token in Authorization header or Cookies
  let token: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1] || null;
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:kino_plus_auth_token|token)=([^;]+)/);
    if (match && match[1]) {
      token = decodeURIComponent(match[1].trim());
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
        id: string;
        email: string;
        name?: string;
      };

      const cachedUser = getAuthCache<NonNullable<typeof req.user>>(`jwt:${token}`);
      if (cachedUser) {
        req.user = cachedUser;
        return next();
      }

      // Verify user still exists
      const user = await authService.findUserById(decoded.id);
      if (!user) {
        return next(new ApiError(401, 'User account no longer exists. Please sign in again.'));
      }

      // Verify a live session exists in the DB for this access token (or user has an active session)
      const sessionExists = await hasLiveSessionForToken(token);
      if (!sessionExists) {
        const userHasLiveSession = await hasLiveSession(decoded.id);
        if (!userHasLiveSession) {
          return next(new ApiError(401, 'Session has been revoked. Please sign in again.'));
        }
      }

      setAuthCache(`jwt:${token}`, user);
      req.user = user;
      return next();
    } catch {
      return next(new ApiError(401, 'Invalid or expired access token'));
    }
  }

  return next(new ApiError(401, 'Authentication required. Please sign in via Google.'));
}

async function hasLiveSession(userId: string): Promise<boolean> {
  try {
    const res = await sessionQ.hasLiveSession(userId);
    return (res.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

async function hasLiveSessionForToken(accessToken: string): Promise<boolean> {
  try {
    const res = await sessionQ.hasLiveSessionForToken(accessToken);
    return (res.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}
