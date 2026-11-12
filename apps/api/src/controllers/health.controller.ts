import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { testDatabaseConnection } from '../config/database';
import { testStorageConnection } from '../services/storage';
import { ENV } from '../config/env';

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const dbHealth = await testDatabaseConnection();
  const storageHealth = await testStorageConnection();

  const isHealthy = dbHealth.connected;

  return res.status(isHealthy ? 200 : 503).json(
    new ApiResponse(
      isHealthy ? 200 : 503,
      {
        status: isHealthy ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          connected: dbHealth.connected,
          latencyMs: dbHealth.latencyMs,
          version: dbHealth.version,
          error: dbHealth.error,
        },
        storage: {
          connected: storageHealth.connected,
          bucket: ENV.STORAGE.BUCKET,
          region: ENV.STORAGE.REGION,
          latencyMs: storageHealth.latencyMs,
          error: storageHealth.error,
        },
      },
      isHealthy ? 'API services and database are healthy' : 'API service degraded: Database issue'
    )
  );
});

export default { getHealth };
