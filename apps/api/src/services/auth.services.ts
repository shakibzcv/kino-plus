import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import logger from '../logger/winston.logger';
import { ApiError } from '../utils/ApiError';
import { clearAuthCache } from '../utils/authCache';
import * as authQ from '../db/queries/auth.queries';
import * as sessionQ from '../db/queries/sessions.queries';

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  provider: string;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date;
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends DbUser {}
  }
}

export interface DbAccount {
  id: string;
  user_id: string;
  type: string;
  provider: string;
  provider_account_id: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbSession {
  id: string;
  user_id: string;
  session_token: string;
  access_token: string | null;
  expires_at: Date;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ClientSession {
  id: string;
  user_id: string;
  expires_at: Date;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  updated_at: Date;
  is_current: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

// In-memory 30-second grace cache to protect concurrent requests/tabs against race conditions during refresh
const refreshGraceCache = new Map<string, { user: DbUser; tokens: AuthTokens; expiresAt: number }>();

export const authService = {
  // ==========================================
  // USER METHODS
  // ==========================================

  async findUserById(id: string): Promise<DbUser | null> {
    const res = await authQ.findUserById(id);
    return (res.rows[0] as DbUser) || null;
  },

  async findUserByEmail(email: string): Promise<DbUser | null> {
    const res = await authQ.findUserByEmail(email);
    return (res.rows[0] as DbUser) || null;
  },

  async findUserByProvider(provider: string, providerAccountId: string): Promise<DbUser | null> {
    const res = await authQ.findUserByProvider(provider, providerAccountId);
    return (res.rows[0] as DbUser) || null;
  },

  async upsertGoogleUser(data: {
    googleId: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    scope?: string;
  }): Promise<DbUser> {
    const {
      googleId,
      email,
      name = email.split('@')[0],
      firstName,
      lastName,
      avatar,
      accessToken,
      refreshToken,
      idToken,
      expiresAt,
      scope,
    } = data;

    let user = await this.findUserByProvider('google', googleId);
    if (!user && email) {
      user = await this.findUserByEmail(email);
    }

    if (user) {
      const updateRes = await authQ.updateUser(user.id, name, avatar, firstName, lastName);
      user = updateRes.rows[0] as DbUser;
    } else {
      const newUserId = `usr_${crypto.randomBytes(12).toString('hex')}`;
      const insertRes = await authQ.insertUser(newUserId, email, name, firstName, lastName, avatar);
      user = insertRes.rows[0] as DbUser;
    }

    const accountId = `acc_${crypto.randomBytes(12).toString('hex')}`;
    await authQ.upsertGoogleAccount(
      accountId, user.id, googleId,
      refreshToken || null, accessToken || null, expiresAt || null, scope || null, idToken || null
    );

    return user;
  },

  // ==========================================
  // TOKEN & SESSION MANAGEMENT
  // ==========================================

  generateTokens(user: { id: string; email: string; name?: string | null }): AuthTokens {
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name || '',
      },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = `kino_rf_${crypto.randomBytes(32).toString('hex')}`;

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  },

  async createSession(data: {
    userId: string;
    sessionToken: string;
    accessToken: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<DbSession> {
    const { userId, sessionToken, accessToken, ipAddress, userAgent } = data;
    const sessionId = `ses_${crypto.randomBytes(12).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const res = await sessionQ.insertSession(
      sessionId, userId, sessionToken, accessToken, expiresAt, ipAddress || null, userAgent || null
    );

    return res.rows[0] as DbSession;
  },

  async refreshSession(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: DbUser; tokens: AuthTokens }> {
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    // 1. Check in-memory 30-second grace cache to absorb concurrent refresh calls across tabs
    const graceEntry = refreshGraceCache.get(refreshToken);
    if (graceEntry && graceEntry.expiresAt > Date.now()) {
      return { user: graceEntry.user, tokens: graceEntry.tokens };
    }

    const sessionRes = await sessionQ.findSessionByRefreshToken(refreshToken);

    const session = sessionRes.rows[0] as DbSession | undefined;
    if (!session) {
      throw new ApiError(401, 'Invalid or expired session. Please sign in again.');
    }

    const user = await this.findUserById(session.user_id);
    if (!user) {
      throw new ApiError(401, 'User associated with session not found.');
    }

    const tokens = this.generateTokens(user);

    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await sessionQ.updateSession(
      tokens.refreshToken, tokens.accessToken, newExpiresAt,
      ipAddress || null, userAgent || null, session.id
    );
    clearAuthCache(user.id, session.access_token ?? undefined);

    // Save previous refreshToken in grace cache for 30 seconds
    refreshGraceCache.set(refreshToken, {
      user,
      tokens,
      expiresAt: Date.now() + 30000,
    });

    // Cleanup expired grace entries periodically
    if (refreshGraceCache.size > 200) {
      const now = Date.now();
      for (const [key, value] of refreshGraceCache.entries()) {
        if (value.expiresAt <= now) refreshGraceCache.delete(key);
      }
    }

    return { user, tokens };
  },

  async deleteSession(sessionToken: string): Promise<void> {
    const sessionRes = await sessionQ.findSessionByRefreshToken(sessionToken).catch(() => ({ rows: [] }));
    const row = sessionRes.rows[0] as { user_id?: string; access_token?: string } | undefined;
    await sessionQ.deleteSessionByToken(sessionToken);
    clearAuthCache(row?.user_id, row?.access_token ?? undefined);
  },

  async deleteUserSessions(userId: string): Promise<void> {
    await sessionQ.deleteSessionsByUserId(userId);
    clearAuthCache(userId);
  },

  async getUserAccounts(userId: string): Promise<DbAccount[]> {
    const res = await authQ.getUserAccounts(userId);
    return res.rows as DbAccount[];
  },

  async getUserSessions(userId: string): Promise<DbSession[]> {
    const res = await sessionQ.getActiveUserSessions(userId);
    return res.rows as DbSession[];
  },

  async getUserSessionsForClient(
    userId: string,
    currentAccessToken?: string | null,
    page = 1,
    limit = 10
  ): Promise<{ current: ClientSession | null; sessions: ClientSession[]; totalOther: number; page: number; limit: number }> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    const offset = (safePage - 1) * safeLimit;

    const currentRes = currentAccessToken
      ? await sessionQ.getCurrentSessionByAccessToken(userId, currentAccessToken)
      : { rows: [] as ClientSession[] };

    const countRes = await sessionQ.countOtherSessions(userId, currentAccessToken || '');
    const othersRes = await sessionQ.getOtherSessions(userId, currentAccessToken || '', safeLimit, offset);

    return {
      current: currentRes.rows[0]
        ? { ...(currentRes.rows[0] as ClientSession), is_current: true }
        : null,
      sessions: (othersRes.rows as ClientSession[]).map((row) => ({ ...row, is_current: false })),
      totalOther: parseInt(countRes.rows[0]?.count || '0', 10),
      page: safePage,
      limit: safeLimit,
    };
  },

  async deleteSessionById(
    userId: string,
    sessionId: string,
    currentAccessToken?: string | null
  ): Promise<'deleted' | 'current' | 'missing'> {
    if (currentAccessToken) {
      const current = await sessionQ.findSessionIdByCurrentToken(sessionId, userId, currentAccessToken);
      if ((current.rowCount ?? 0) > 0) {
        return 'current';
      }
    }

    const res = await sessionQ.deleteSessionById(sessionId, userId);
    clearAuthCache(userId);
    return (res.rowCount ?? 0) > 0 ? 'deleted' : 'missing';
  },

  async deleteOtherSessions(userId: string, currentAccessToken: string): Promise<number> {
    const res = await sessionQ.deleteOtherSessions(userId, currentAccessToken);
    clearAuthCache(userId);
    return res.rowCount ?? 0;
  },
};
