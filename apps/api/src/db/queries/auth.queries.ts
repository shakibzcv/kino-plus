import { db } from '../../config/database';
import type { QueryResult } from 'pg';

// ─── User queries ─────────────────────────────────────────────────────────────

export const findUserById = (id: string) =>
  db.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);

export const findUserByEmail = (email: string) =>
  db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);

export const findUserByProvider = (provider: string, providerAccountId: string) =>
  db.query(
    `SELECT u.* FROM users u
     INNER JOIN accounts a ON a.user_id = u.id
     WHERE a.provider = $1 AND a.provider_account_id = $2
     LIMIT 1`,
    [provider, providerAccountId]
  );

export const updateUser = (
  id: string,
  name: string | undefined,
  avatar: string | undefined,
  firstName: string | undefined,
  lastName: string | undefined
) =>
  db.query(
    `UPDATE users
     SET name        = COALESCE($1, name),
         avatar      = COALESCE($2, avatar),
         first_name  = COALESCE($3, first_name),
         last_name   = COALESCE($4, last_name),
         updated_at  = CURRENT_TIMESTAMP,
         last_login_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING *`,
    [name, avatar, firstName, lastName, id]
  );

export const insertUser = (
  id: string,
  email: string,
  name: string,
  firstName: string | undefined,
  lastName: string | undefined,
  avatar: string | undefined
) =>
  db.query(
    `INSERT INTO users (id, email, name, first_name, last_name, avatar, provider)
     VALUES ($1, $2, $3, $4, $5, $6, 'google')
     RETURNING *`,
    [id, email, name, firstName, lastName, avatar]
  );

// ─── Account queries ──────────────────────────────────────────────────────────

export const upsertGoogleAccount = (
  accountId: string,
  userId: string,
  googleId: string,
  refreshToken: string | null,
  accessToken: string | null,
  expiresAt: number | null,
  scope: string | null,
  idToken: string | null
): Promise<QueryResult> =>
  db.query(
    `INSERT INTO accounts (
       id, user_id, type, provider, provider_account_id,
       refresh_token, access_token, expires_at, token_type, scope, id_token
     )
     VALUES ($1, $2, 'oauth', 'google', $3, $4, $5, $6, 'Bearer', $7, $8)
     ON CONFLICT (provider, provider_account_id)
     DO UPDATE SET
       access_token  = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, accounts.refresh_token),
       expires_at    = EXCLUDED.expires_at,
       id_token      = EXCLUDED.id_token,
       scope         = EXCLUDED.scope,
       updated_at    = CURRENT_TIMESTAMP`,
    [accountId, userId, googleId, refreshToken, accessToken, expiresAt, scope, idToken]
  );

export const getUserAccounts = (userId: string) =>
  db.query(
    `SELECT id, user_id, type, provider, provider_account_id, created_at, updated_at
     FROM accounts
     WHERE user_id = $1`,
    [userId]
  );
