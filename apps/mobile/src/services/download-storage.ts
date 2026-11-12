import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { DownloadItem, StorageInfo } from '@/types/downloads';

const REGISTRY_FILE = 'downloads_registry.json';
const DOWNLOADS_DIR = 'kino_downloads/';

function getBaseDir(): string {
  if (Platform.OS === 'web') {
    return 'kino_downloads/';
  }
  const docDir = FileSystem.documentDirectory || '';
  return docDir.endsWith('/') ? `${docDir}${DOWNLOADS_DIR}` : `${docDir}/${DOWNLOADS_DIR}`;
}

export function getItemDirectory(itemId: string): string {
  const cleanId = itemId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${getBaseDir()}${cleanId}/`;
}

export function getRegistryPath(): string {
  return `${getBaseDir()}${REGISTRY_FILE}`;
}

/**
 * Ensures the base download directory exists
 */
export async function ensureBaseDirectory(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const baseDir = getBaseDir();
    const info = await FileSystem.getInfoAsync(baseDir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
    }
  } catch (err) {
    console.warn('[DownloadStorage] Failed to ensure base directory:', err);
  }
}

/**
 * Ensures a directory for a specific download item exists
 */
export async function ensureItemDirectory(itemId: string): Promise<string> {
  const dir = getItemDirectory(itemId);
  if (Platform.OS === 'web') return dir;

  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  } catch (err) {
    console.warn(`[DownloadStorage] Failed to ensure directory for ${itemId}:`, err);
  }
  return dir;
}

/**
 * Load the downloaded items registry from disk
 */
export async function loadRegistry(): Promise<DownloadItem[]> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('kino_downloads_registry');
        return raw ? JSON.parse(raw) : [];
      }
    } catch {}
    return [];
  }

  try {
    await ensureBaseDirectory();
    const path = getRegistryPath();
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return [];

    const content = await FileSystem.readAsStringAsync(path);
    if (!content) return [];
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[DownloadStorage] Error loading downloads registry:', err);
    return [];
  }
}

/**
 * Save the downloaded items registry to disk
 */
export async function saveRegistry(items: DownloadItem[]): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('kino_downloads_registry', JSON.stringify(items));
      }
    } catch {}
    return;
  }

  try {
    await ensureBaseDirectory();
    const path = getRegistryPath();
    await FileSystem.writeAsStringAsync(path, JSON.stringify(items));
  } catch (err) {
    console.error('[DownloadStorage] Error saving downloads registry:', err);
  }
}

/**
 * Delete all files and directory for a specific download item
 */
export async function deleteItemStorage(itemId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const dir = getItemDirectory(itemId);
    const info = await FileSystem.getInfoAsync(dir);
    if (info.exists) {
      await FileSystem.deleteAsync(dir, { idempotent: true });
    }
  } catch (err) {
    console.warn(`[DownloadStorage] Error deleting storage for ${itemId}:`, err);
  }
}

/**
 * Clears the entire downloads directory
 */
export async function clearAllDownloadsStorage(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('kino_downloads_registry');
      }
    } catch {}
    return;
  }

  try {
    const baseDir = getBaseDir();
    const info = await FileSystem.getInfoAsync(baseDir);
    if (info.exists) {
      await FileSystem.deleteAsync(baseDir, { idempotent: true });
    }
    await ensureBaseDirectory();
    await saveRegistry([]);
  } catch (err) {
    console.error('[DownloadStorage] Error clearing all downloads storage:', err);
  }
}

/**
 * Calculates disk space used by downloads and free device storage
 */
export async function getStorageInfo(items: DownloadItem[]): Promise<StorageInfo> {
  let usedByDownloadsBytes = 0;
  for (const item of items) {
    if (item.downloadedBytes > 0) {
      usedByDownloadsBytes += item.downloadedBytes;
    }
  }

  let freeDiskBytes = 10 * 1024 * 1024 * 1024; // Default fallback: 10 GB
  let totalDiskBytes = 64 * 1024 * 1024 * 1024; // Default fallback: 64 GB

  if (Platform.OS !== 'web') {
    try {
      if (typeof FileSystem.getFreeDiskStorageAsync === 'function') {
        const free = await FileSystem.getFreeDiskStorageAsync();
        if (typeof free === 'number' && free > 0) freeDiskBytes = free;
      }
      if (typeof FileSystem.getTotalDiskCapacityAsync === 'function') {
        const total = await FileSystem.getTotalDiskCapacityAsync();
        if (typeof total === 'number' && total > 0) totalDiskBytes = total;
      }
    } catch {
      // Disk query unavailable on some devices/emulators
    }
  }

  return {
    totalDiskBytes,
    freeDiskBytes,
    usedByDownloadsBytes,
  };
}
