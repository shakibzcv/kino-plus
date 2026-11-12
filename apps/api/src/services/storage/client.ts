// ─── S3 / R2 Client ──────────────────────────────────────────────────────────
// When you're ready to wire up real storage, install the AWS SDK:
//   pnpm --filter api add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
//
// Then uncomment the block below and delete the placeholder export.
//
// import { S3Client } from '@aws-sdk/client-s3';
// import { ENV } from '../../config/env';
//
// export const s3 = new S3Client({
//   region: ENV.STORAGE.REGION,
//   endpoint: ENV.STORAGE.ENDPOINT || undefined,
//   credentials: {
//     accessKeyId: ENV.STORAGE.ACCESS_KEY_ID,
//     secretAccessKey: ENV.STORAGE.SECRET_ACCESS_KEY,
//   },
//   forcePathStyle: Boolean(ENV.STORAGE.ENDPOINT), // required for Cloudflare R2
// });

/** Placeholder — replace with the real S3Client instance above. */
export const s3 = null as unknown as import('@aws-sdk/client-s3').S3Client;
