// ─── Storage Service ──────────────────────────────────────────────────────────
// All functions are stubs. When you're ready to add real storage:
//
//  1. Install the AWS SDK (see client.ts).
//  2. Uncomment / fill in each function body.
//  3. The routes, controller, and ENV config are already wired up and waiting.
//
// Supported back-ends (via ENV):
//   • AWS S3          – set AWS_* env vars
//   • Cloudflare R2   – set AWS_ENDPOINT_URL_S3 to your R2 endpoint
//   • Any S3-compatible service (MinIO, Backblaze B2, etc.)

import logger from '../../logger/winston.logger';
import { ENV } from '../../config/env';
import type {
  UploadFileOptions,
  PresignedUrlOptions,
  PresignedUploadResult,
  StorageStatus,
} from './types';

export type { UploadFileOptions, PresignedUrlOptions, PresignedUploadResult, StorageStatus };

// ─── Connection Health ────────────────────────────────────────────────────────

/**
 * Verifies that the storage credentials and bucket are reachable.
 * Returns { connected: true } when storage is properly configured.
 */
export async function testStorageConnection(): Promise<StorageStatus> {
  if (!ENV.STORAGE.ACCESS_KEY_ID || !ENV.STORAGE.SECRET_ACCESS_KEY) {
    return { connected: false, error: 'Storage credentials not configured in environment.' };
  }

  // TODO: Replace with a real HeadBucketCommand check once the S3 SDK is installed.
  // const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
  // const { s3 } = await import('./client');
  // await s3.send(new HeadBucketCommand({ Bucket: ENV.STORAGE.BUCKET }));

  logger.warn('[Storage] testStorageConnection is a stub — no real check performed.');
  return { connected: true, bucket: ENV.STORAGE.BUCKET };
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Uploads a file buffer directly to storage.
 * @returns The public or internal key of the uploaded object.
 */
export async function uploadFile(options: UploadFileOptions): Promise<{ key: string }> {
  // TODO: Implement with PutObjectCommand.
  // const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  // const { s3 } = await import('./client');
  // await s3.send(new PutObjectCommand({
  //   Bucket: options.bucket ?? ENV.STORAGE.BUCKET,
  //   Key: options.key,
  //   Body: options.body,
  //   ContentType: options.contentType,
  // }));
  throw new Error('[Storage] uploadFile is not yet implemented.');
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Deletes an object from storage by key.
 */
export async function deleteFile(key: string, bucket?: string): Promise<void> {
  // TODO: Implement with DeleteObjectCommand.
  // const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  // const { s3 } = await import('./client');
  // await s3.send(new DeleteObjectCommand({ Bucket: bucket ?? ENV.STORAGE.BUCKET, Key: key }));
  throw new Error('[Storage] deleteFile is not yet implemented.');
}

// ─── Presigned URLs ───────────────────────────────────────────────────────────

/**
 * Generates a presigned URL that allows a client to download an object directly
 * from storage without passing through the API server.
 */
export async function getPresignedDownloadUrl(options: PresignedUrlOptions): Promise<string> {
  // TODO: Implement with getSignedUrl + GetObjectCommand.
  // const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  // const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  // const { s3 } = await import('./client');
  // return getSignedUrl(s3, new GetObjectCommand({
  //   Bucket: options.bucket ?? ENV.STORAGE.BUCKET,
  //   Key: options.key,
  // }), { expiresIn: options.expiresIn ?? 3600 });
  throw new Error('[Storage] getPresignedDownloadUrl is not yet implemented.');
}

/**
 * Generates a presigned URL that allows a client to upload a file directly to
 * storage without passing through the API server (client-side upload).
 */
export async function getPresignedUploadUrl(
  options: PresignedUrlOptions & { contentType?: string },
): Promise<PresignedUploadResult> {
  // TODO: Implement with getSignedUrl + PutObjectCommand.
  // const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  // const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  // const { s3 } = await import('./client');
  // const expiresIn = options.expiresIn ?? 3600;
  // const url = await getSignedUrl(s3, new PutObjectCommand({
  //   Bucket: options.bucket ?? ENV.STORAGE.BUCKET,
  //   Key: options.key,
  //   ContentType: options.contentType,
  // }), { expiresIn });
  // return { url, key: options.key, expiresIn };
  throw new Error('[Storage] getPresignedUploadUrl is not yet implemented.');
}
