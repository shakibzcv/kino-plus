import { Pool, QueryResult, QueryResultRow } from 'pg';
import { ENV } from './env';
import logger from '../logger/winston.logger';

let pool: Pool | null = null;
let schemaInitialized = false;

/**
 * Returns the singleton PostgreSQL Pool instance.
 */
export function getDatabasePool(): Pool {
  if (!pool) {
    let connectionString = ENV.DATABASE.URL;

    if (!connectionString) {
      logger.warn('[Database] DATABASE_URL is not configured in .env. Database operations will fail.');
    }

    // Suppress pg v9 / pg-connection-string v3 security alias deprecation warning by normalizing sslmode
    if (connectionString.includes('sslmode=require') && !connectionString.includes('uselibpqcompat')) {
      connectionString = connectionString.replace('sslmode=require', 'sslmode=verify-full');
    }

    const isSsl =
      connectionString.includes('sslmode=verify-full') ||
      connectionString.includes('sslmode=require') ||
      connectionString.includes('neon.tech');

    pool = new Pool({
      connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('connect', () => {
      logger.info('[Database] Connected to PostgreSQL database pool (Neon)');
    });

    pool.on('error', (err: Error) => {
      logger.error(`[Database] Unexpected error on idle PostgreSQL client: ${err.message}`);
    });
  }

  return pool;
}

/**
 * Execute a SQL query using the connection pool.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const currentPool = getDatabasePool();
  try {
    const result = await currentPool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug(
      `[Database] Query executed: ${text.substring(0, 60)}... | Duration: ${duration}ms | Rows: ${result.rowCount}`
    );
    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    logger.error(
      `[Database] Query error: ${error.message} | Query: ${text} | Duration: ${duration}ms`
    );
    throw error;
  }
}

/**
 * Tests the PostgreSQL connection and returns status + latency.
 */
export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  version?: string;
  latencyMs?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const result = await query('SELECT version() AS version, NOW() AS current_time');
    const latencyMs = Date.now() - start;
    const version = result.rows[0]?.version || 'Unknown';
    logger.info(`[Database] Neon PostgreSQL connection verified successfully (${latencyMs}ms)`);
    return {
      connected: true,
      version,
      latencyMs,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    logger.error(`[Database] Connection test failed: ${error.message}`);
    return {
      connected: false,
      latencyMs,
      error: error.message,
    };
  }
}

/**
 * Initialize core database tables: users, accounts, sessions, watchlist, continue watching, search history, device codes.
 */
export async function initializeDatabaseSchema(): Promise<void> {
  if (schemaInitialized) return;
  schemaInitialized = true;
  try {
    // 1. Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(128) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        first_name VARCHAR(128),
        last_name VARCHAR(128),
        avatar TEXT,
        provider VARCHAR(64) DEFAULT 'google',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Accounts Table
    await query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(64) NOT NULL DEFAULT 'oauth',
        provider VARCHAR(64) NOT NULL,
        provider_account_id VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at BIGINT,
        token_type VARCHAR(64) DEFAULT 'Bearer',
        scope TEXT,
        id_token TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(provider, provider_account_id)
      );
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    `);

    // 3. Sessions Table
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token TEXT UNIQUE NOT NULL,
        access_token TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address VARCHAR(64),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON sessions(access_token);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `);

    // 4. Watchlist Table (Movies & TV Series)
    await query(`
      CREATE TABLE IF NOT EXISTS user_watchlist (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        media_id VARCHAR(64) NOT NULL,
        media_type VARCHAR(32) NOT NULL,
        title VARCHAR(255) NOT NULL,
        poster_path TEXT,
        backdrop_path TEXT,
        overview TEXT,
        rating NUMERIC(3, 1),
        vote_average NUMERIC(3, 1),
        logo TEXT,
        logo_path TEXT,
        category TEXT,
        season_number INT,
        episode_number INT,
        episode_title VARCHAR(255),
        series_id VARCHAR(64),
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, media_id, media_type)
      );
      CREATE INDEX IF NOT EXISTS idx_watchlist_user ON user_watchlist(user_id, added_at DESC);
    `);

    // 5. Continue Watching (Movies & TV Shows) Table
    await query(`
      CREATE TABLE IF NOT EXISTS user_continue_watching (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        media_id VARCHAR(64) NOT NULL,
        media_type VARCHAR(32) NOT NULL,
        title VARCHAR(255) NOT NULL,
        poster_path TEXT,
        backdrop_path TEXT,
        logo TEXT,
        logo_path TEXT,
        overview TEXT,
        rating NUMERIC(3, 1),
        vote_average NUMERIC(3, 1),
        category TEXT,
        season_number INT DEFAULT 1,
        episode_number INT DEFAULT 1,
        episode_title VARCHAR(255),
        progress_percentage INT DEFAULT 0,
        playback_position INT DEFAULT 0,
        duration INT DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, media_id, season_number, episode_number)
      );
      CREATE INDEX IF NOT EXISTS idx_continue_watching_user ON user_continue_watching(user_id, updated_at DESC);
    `);

    // 6. User Search History Table
    await query(`
      CREATE TABLE IF NOT EXISTS user_search_history (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        query VARCHAR(255) NOT NULL,
        searched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, query)
      );
      CREATE INDEX IF NOT EXISTS idx_search_history_user ON user_search_history(user_id, searched_at DESC);
    `);

    logger.info('[Database] Database tables (users, accounts, sessions, watchlist, continue_watching, search_history) initialized with CASCADE delete');
  } catch (error: any) {
    logger.warn(`[Database] Schema initialization warning: ${error.message}`);
  }
}

/**
 * Closes the database connection pool gracefully.
 */
export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('[Database] Connection pool closed');
  }
}

export const db = {
  getPool: getDatabasePool,
  query,
  testConnection: testDatabaseConnection,
  initSchema: initializeDatabaseSchema,
  close: closeDatabasePool,
};

export default db;
