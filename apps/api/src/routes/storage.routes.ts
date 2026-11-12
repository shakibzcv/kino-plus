import { Router } from 'express';
import {
  getStorageStatus,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  uploadFile,
  deleteFile,
} from '../controllers/storage.controller';
import { ensureAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

// Public: storage health / status
router.get('/status', getStorageStatus);

// Protected: all other storage operations require authentication
router.use(ensureAuthenticated);
router.post('/presigned-download', getPresignedDownloadUrl);
router.post('/presigned-upload', getPresignedUploadUrl);
router.post('/upload', uploadFile);
router.delete('/delete', deleteFile);

export default router;
