// ─── Storage Service Types ────────────────────────────────────────────────────
// Add / extend these interfaces when implementing real storage support.

export interface UploadFileOptions {
  /** S3/R2 object key (path inside the bucket) */
  key: string;
  /** Raw file content */
  body: Buffer;
  /** MIME type, e.g. "image/jpeg" */
  contentType?: string;
  /** Override the default bucket from ENV */
  bucket?: string;
}

export interface PresignedUrlOptions {
  key: string;
  /** Seconds until the URL expires (default: 3600) */
  expiresIn?: number;
  bucket?: string;
}

export interface PresignedUploadResult {
  url: string;
  key: string;
  expiresIn: number;
}

export interface StorageStatus {
  connected: boolean;
  bucket?: string;
  /** Round-trip latency in ms (populated once real connection checks are implemented) */
  latencyMs?: number;
  error?: string;
}
