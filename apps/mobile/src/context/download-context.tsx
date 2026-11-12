import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  DownloadItem,
  StartDownloadParams,
  StorageInfo,
} from '@/types/downloads';
import { downloadManager } from '@/services/download-manager';
import { getStorageInfo } from '@/services/download-storage';

interface DownloadContextType {
  downloads: DownloadItem[];
  storageInfo: StorageInfo;
  wifiOnly: boolean;
  setWifiOnly: (val: boolean) => void;
  startDownload: (params: StartDownloadParams) => Promise<DownloadItem>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<void>;
  cancelDownload: (id: string) => Promise<void>;
  deleteDownload: (id: string) => Promise<void>;
  deleteAllDownloads: () => Promise<void>;
  getItem: (id: string) => DownloadItem | undefined;
  findItem: (mediaId: string, seasonNumber?: number, episodeNumber?: number) => DownloadItem | undefined;
  isDownloaded: (mediaId: string, seasonNumber?: number, episodeNumber?: number) => boolean;
  isDownloading: (mediaId: string, seasonNumber?: number, episodeNumber?: number) => boolean;
}

const DownloadContext = createContext<DownloadContextType | null>(null);

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    totalDiskBytes: 64 * 1024 * 1024 * 1024,
    freeDiskBytes: 15 * 1024 * 1024 * 1024,
    usedByDownloadsBytes: 0,
  });
  const [wifiOnly, setWifiOnlyState] = useState<boolean>(() => downloadManager.getWifiOnly());

  // Subscribe to download manager updates
  useEffect(() => {
    const unsubscribe = downloadManager.subscribe((items) => {
      setDownloads([...items]);
      getStorageInfo(items).then(setStorageInfo);
    });
    return () => unsubscribe();
  }, []);

  const setWifiOnly = useCallback((val: boolean) => {
    downloadManager.setWifiOnly(val);
    setWifiOnlyState(val);
  }, []);

  const startDownload = useCallback(async (params: StartDownloadParams) => {
    return await downloadManager.startDownload(params);
  }, []);

  const pauseDownload = useCallback(async (id: string) => {
    await downloadManager.pauseDownload(id);
  }, []);

  const resumeDownload = useCallback(async (id: string) => {
    await downloadManager.resumeDownload(id);
  }, []);

  const cancelDownload = useCallback(async (id: string) => {
    await downloadManager.cancelDownload(id);
  }, []);

  const deleteDownload = useCallback(async (id: string) => {
    await downloadManager.deleteDownload(id);
  }, []);

  const deleteAllDownloads = useCallback(async () => {
    await downloadManager.deleteAllDownloads();
  }, []);

  const getItem = useCallback((id: string) => {
    return downloadManager.getItem(id);
  }, []);

  const findItem = useCallback((mediaId: string, seasonNumber?: number, episodeNumber?: number) => {
    return downloadManager.findItem(mediaId, seasonNumber, episodeNumber);
  }, []);

  const isDownloaded = useCallback((mediaId: string, seasonNumber?: number, episodeNumber?: number) => {
    const item = downloadManager.findItem(mediaId, seasonNumber, episodeNumber);
    return item?.status === 'completed';
  }, []);

  const isDownloading = useCallback((mediaId: string, seasonNumber?: number, episodeNumber?: number) => {
    const item = downloadManager.findItem(mediaId, seasonNumber, episodeNumber);
    return item?.status === 'downloading' || item?.status === 'queued' || item?.status === 'fetching_sources';
  }, []);

  const value = useMemo(
    () => ({
      downloads,
      storageInfo,
      wifiOnly,
      setWifiOnly,
      startDownload,
      pauseDownload,
      resumeDownload,
      cancelDownload,
      deleteDownload,
      deleteAllDownloads,
      getItem,
      findItem,
      isDownloaded,
      isDownloading,
    }),
    [
      downloads,
      storageInfo,
      wifiOnly,
      setWifiOnly,
      startDownload,
      pauseDownload,
      resumeDownload,
      cancelDownload,
      deleteDownload,
      deleteAllDownloads,
      getItem,
      findItem,
      isDownloaded,
      isDownloading,
    ]
  );

  return <DownloadContext.Provider value={value}>{children}</DownloadContext.Provider>;
}

export function useDownloads() {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownloads must be used within a DownloadProvider');
  }
  return context;
}
