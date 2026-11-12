import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Look for .env in current working dir, apps/api/.env, or parent directories
const potentialEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'apps/api/.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env'),
];

for (const envPath of potentialEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MOVIE_DB_API_KEY: process.env.MOVIE_DB_API_KEY || '12931745b665fcd50426026656249276',
  SESSION_SECRET: process.env.SESSION_SECRET || 'kino-plus-dev-session-secret-change-in-production',
  JWT_SECRET: process.env.JWT_SECRET || 'kino-plus-dev-jwt-secret-change-in-production',
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    CALLBACK_URL:
      process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
  },
  DATABASE: {
    URL: process.env.DATABASE_URL || '',
  },
  STORAGE: {
    ENDPOINT: process.env.AWS_ENDPOINT_URL_S3 || '',
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    REGION: process.env.AWS_REGION || 'ap-southeast-1',
    BUCKET: process.env.AWS_BUCKET_NAME || 'kino-plus',
  },
};

export const {
  PORT,
  NODE_ENV,
  CLIENT_URL,
  MOVIE_DB_API_KEY,
  SESSION_SECRET,
  JWT_SECRET,
  GOOGLE,
  DATABASE,
  STORAGE,
} = ENV;
