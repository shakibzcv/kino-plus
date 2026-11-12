import { Image as ExpoImage } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { cache } from './cache';

export interface CacheSizeInfo {
  bytes: number;
  formatted: string;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0.0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 0.1) return '< 0.1 MB';
  return `${mb.toFixed(1)} MB`;
}

/**
 * Calculates the total size of cached files on disk and in-memory cache entries.
 */
export async function getLocalCacheSize(): Promise<CacheSizeInfo> {
  let totalBytes = 0;

  // 1. In-memory cache size estimation
  try {
    totalBytes += cache.getEstimatedSizeBytes();
  } catch {}

  // 2. On-disk cache directory (ExpoImage and temporary network assets)
  if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);

      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(cacheDir);

        for (const file of files) {
          try {
            const filePath = `${cacheDir}${file}`;
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            if (fileInfo.exists && !fileInfo.isDirectory && typeof fileInfo.size === 'number') {
              totalBytes += fileInfo.size;
            }
          } catch {
            // Ignore individual file errors (e.g. locked files)
          }
        }
      }
    } catch (err) {
      console.warn('[CacheManager] Error calculating disk cache size:', err);
    }
  }

  return {
    bytes: totalBytes,
    formatted: formatBytes(totalBytes),
  };
}

/**
 * Purges both disk and memory caches:
 * 1. expo-image disk cache
 * 2. expo-image memory cache
 * 3. FileSystem.cacheDirectory contents
 * 4. In-memory movie and category API cache
 */
export async function clearLocalCache(): Promise<{ freedBytes: number; formattedFreed: string }> {
  const initial = await getLocalCacheSize();

  // 1. Clear ExpoImage disk and memory caches
  try {
    await ExpoImage.clearDiskCache();
  } catch (err) {
    console.warn('[CacheManager] Error clearing ExpoImage disk cache:', err);
  }

  try {
    await ExpoImage.clearMemoryCache();
  } catch (err) {
    console.warn('[CacheManager] Error clearing ExpoImage memory cache:', err);
  }

  // 2. Clear FileSystem.cacheDirectory temporary files
  if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(cacheDir);
        for (const file of files) {
          try {
            await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
          } catch {
            // Skip files that cannot be deleted
          }
        }
      }
    } catch (err) {
      console.warn('[CacheManager] Error clearing cache directory:', err);
    }
  }

  // 3. Clear in-memory API data cache
  try {
    cache.clear();
  } catch (err) {
    console.warn('[CacheManager] Error clearing in-memory cache:', err);
  }

  const after = await getLocalCacheSize();
  const freedBytes = Math.max(initial.bytes - after.bytes, initial.bytes);

  return {
    freedBytes,
    formattedFreed: formatBytes(freedBytes),
  };
}
