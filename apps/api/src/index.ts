import { app } from './app';
import { ENV } from './config/env';
import { db } from './config/database';
import { testStorageConnection } from './services/storage';
import logger from './logger/winston.logger';

export const startServer = async () => {
  try {
    // 1. Test database connection & initialize schema
    if (ENV.DATABASE.URL) {
      const dbStatus = await db.testConnection();
      if (dbStatus.connected) {
        await db.initSchema();
      } else {
        logger.warn(`[Database] Could not connect to Neon PostgreSQL: ${dbStatus.error}`);
      }
    } else {
      logger.warn('[Database] DATABASE_URL not set in environment.');
    }

    // 2. Test S3 storage connection
    if (ENV.STORAGE.ACCESS_KEY_ID && ENV.STORAGE.SECRET_ACCESS_KEY) {
      const storageStatus = await testStorageConnection();
      if (storageStatus.connected) {
        logger.info(`[Storage] Neon/AWS S3 storage ready (bucket: ${ENV.STORAGE.BUCKET})`);
      } else {
        logger.warn(`[Storage] Storage check warning: ${storageStatus.error}`);
      }
    }

    // 3. Start HTTP server
    const server = app.listen(ENV.PORT, () => {
      logger.info(`🚀 Kino Plus API server running on http://localhost:${ENV.PORT}`);
      logger.info(`🔑 Google Auth Endpoint: http://localhost:${ENV.PORT}/auth/google`);
      logger.info(`🩺 Health Check: http://localhost:${ENV.PORT}/health`);
      logger.info(`📦 Storage Endpoint: http://localhost:${ENV.PORT}/storage/status`);
      logger.info(`🎬 Trending Movies: http://localhost:${ENV.PORT}/movies/trending`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await db.close();
        logger.info('HTTP server closed & database pool terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error(`Failed to start server: ${String(error)}`);
    process.exit(1);
  }
};

startServer();
