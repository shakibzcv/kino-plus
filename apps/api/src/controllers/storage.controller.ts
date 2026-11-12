import { Request, Response } from 'express';
import {
  testStorageConnection,
  uploadFile as uploadToStorage,
  deleteFile as deleteFromStorage,
  getPresignedDownloadUrl as generateDownloadUrl,
  getPresignedUploadUrl as generateUploadUrl,
} from '../services/storage';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

// ─── Status ───────────────────────────────────────────────────────────────────

export const getStorageStatus = asyncHandler(async (_req: Request, res: Response) => {
  const status = await testStorageConnection();
  return res.status(200).json(
    new ApiResponse(200, status, status.connected ? 'Storage service connected' : 'Storage service not configured'),
  );
});

// ─── Presigned URLs ───────────────────────────────────────────────────────────

export const getPresignedDownloadUrl = asyncHandler(async (req: Request, res: Response) => {
  const { key, expiresIn, bucket } = req.body as { key?: string; expiresIn?: number; bucket?: string };
  if (!key) throw new ApiError(400, 'Storage key is required');

  const url = await generateDownloadUrl({ key, expiresIn, bucket });
  return res.status(200).json(
    new ApiResponse(200, { url, key, expiresIn: expiresIn ?? 3600 }, 'Presigned download URL generated'),
  );
});

export const getPresignedUploadUrl = asyncHandler(async (req: Request, res: Response) => {
  const { key, expiresIn, contentType, bucket } = req.body as {
    key?: string; expiresIn?: number; contentType?: string; bucket?: string;
  };
  if (!key) throw new ApiError(400, 'Storage key is required');

  const result = await generateUploadUrl({ key, expiresIn, contentType, bucket });
  return res.status(200).json(
    new ApiResponse(200, result, 'Presigned upload URL generated'),
  );
});

// ─── Direct Upload / Delete ───────────────────────────────────────────────────

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  const { key, body, contentType, bucket } = req.body as {
    key?: string; body?: unknown; contentType?: string; bucket?: string;
  };
  if (!key || !body) throw new ApiError(400, 'Storage key and body are required');

  const fileBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body as string);
  const result = await uploadToStorage({ key, body: fileBuffer, contentType, bucket });
  return res.status(200).json(
    new ApiResponse(200, result, 'File uploaded to storage successfully'),
  );
});

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const key = (req.query.key as string | undefined) ?? (req.body as { key?: string })?.key;
  const bucket = (req.query.bucket as string | undefined) ?? (req.body as { bucket?: string })?.bucket;
  if (!key) throw new ApiError(400, 'Storage key is required');

  await deleteFromStorage(key, bucket);
  return res.status(200).json(
    new ApiResponse(200, { key, deleted: true }, 'File deleted from storage'),
  );
});

export default { getStorageStatus, getPresignedDownloadUrl, getPresignedUploadUrl, uploadFile, deleteFile };
