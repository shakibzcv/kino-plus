import { db } from '../../config/database';

// ─── Session queries ──────────────────────────────────────────────────────────

export const insertSession = (
  sessionId: string,
  userId: string,
  sessionToken: string,
  accessToken: string,
  expiresAt: Date,
  ipAddress: string | null,
  userAgent: string | null
) =>
  db.query(
    `INSERT INTO sessions (id, user_id, session_token, access_token, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [sessionId, userId, sessionToken, accessToken, expiresAt, ipAddress, userAgent]
  );

export const findSessionByRefreshToken = (sessionToken: string) =>
  db.query(
    `SELECT * FROM sessions
     WHERE session_token = $1 AND expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [sessionToken]
  );

export const updateSession = (
  newSessionToken: string,
  newAccessToken: string,
  expiresAt: Date,
  ipAddress: string | null,
  userAgent: string | null,
  sessionId: string
) =>
  db.query(
    `UPDATE sessions
     SET session_token = $1,
         access_token  = $2,
         expires_at    = $3,
         ip_address    = COALESCE($4, ip_address),
         user_agent    = COALESCE($5, user_agent),
         updated_at    = CURRENT_TIMESTAMP
     WHERE id = $6`,
    [newSessionToken, newAccessToken, expiresAt, ipAddress, userAgent, sessionId]
  );

export const deleteSessionByToken = (sessionToken: string) =>
  db.query('DELETE FROM sessions WHERE session_token = $1', [sessionToken]);

export const deleteSessionsByUserId = (userId: string) =>
  db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);

export const deleteSessionById = (sessionId: string, userId: string) =>
  db.query('DELETE FROM sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);

export const deleteOtherSessions = (userId: string, currentAccessToken: string) =>
  db.query(
    `DELETE FROM sessions
     WHERE user_id = $1 AND (access_token IS DISTINCT FROM $2)`,
    [userId, currentAccessToken]
  );

export const getActiveUserSessions = (userId: string) =>
  db.query(
    `SELECT id, user_id, expires_at, ip_address, user_agent, created_at, updated_at
     FROM sessions
     WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
     ORDER BY updated_at DESC`,
    [userId]
  );

export const getCurrentSessionByAccessToken = (userId: string, accessToken: string) =>
  db.query(
    `SELECT id, user_id, expires_at, ip_address, user_agent, created_at, updated_at,
            TRUE AS is_current
     FROM sessions
     WHERE user_id = $1
       AND access_token = $2
       AND expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [userId, accessToken]
  );

export const countOtherSessions = (userId: string, currentAccessToken: string) =>
  db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM sessions
     WHERE user_id = $1
       AND expires_at > CURRENT_TIMESTAMP
       AND (access_token IS DISTINCT FROM $2)`,
    [userId, currentAccessToken]
  );

export const getOtherSessions = (
  userId: string,
  currentAccessToken: string,
  limit: number,
  offset: number
) =>
  db.query(
    `SELECT id, user_id, expires_at, ip_address, user_agent, created_at, updated_at,
            FALSE AS is_current
     FROM sessions
     WHERE user_id = $1
       AND expires_at > CURRENT_TIMESTAMP
       AND (access_token IS DISTINCT FROM $2)
     ORDER BY updated_at DESC
     LIMIT $3 OFFSET $4`,
    [userId, currentAccessToken, limit, offset]
  );

export const findSessionIdByCurrentToken = (
  sessionId: string,
  userId: string,
  accessToken: string
) =>
  db.query(
    `SELECT id FROM sessions
     WHERE id = $1 AND user_id = $2 AND access_token = $3
     LIMIT 1`,
    [sessionId, userId, accessToken]
  );

/** Used by auth middleware: checks any live session exists for user. */
export const hasLiveSession = (userId: string) =>
  db.query(
    `SELECT 1 FROM sessions
     WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [userId]
  );

/** Used by auth middleware: checks the specific access token has a live session. */
export const hasLiveSessionForToken = (accessToken: string) =>
  db.query(
    `SELECT 1 FROM sessions
     WHERE access_token = $1 AND expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [accessToken]
  );
