import * as FileSystem from 'expo-file-system/legacy';
import {
  DownloadItem,
  DownloadQuality,
  DownloadSubtitle,
  StartDownloadParams,
} from '@/types/downloads';
import {
  deleteItemStorage,
  ensureItemDirectory,
  loadRegistry,
  saveRegistry,
} from './download-storage';

type DownloadListener = (items: DownloadItem[]) => void;

class DownloadManagerService {
  private items: Map<string, DownloadItem> = new Map();
  private listeners: Set<DownloadListener> = new Set();
  private isInitialized = false;
  private activeJobs: Map<string, { abortController?: AbortController; resumable?: FileSystem.DownloadResumable }> = new Map();
  private maxConcurrent = 1;
  private wifiOnly = true;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.isInitialized) return;
    try {
      const saved = await loadRegistry();
      for (const item of saved) {
        // If app crashed while downloading, mark as paused
        if (item.status === 'downloading' || item.status === 'fetching_sources' || item.status === 'queued') {
          item.status = 'paused';
        }
        this.items.set(item.id, item);
      }
      this.isInitialized = true;
      this.notifyListeners();
    } catch (err) {
      console.warn('[DownloadManager] Init error:', err);
    }
  }

  public subscribe(listener: DownloadListener): () => void {
    this.listeners.add(listener);
    listener(this.getAllItems());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const list = this.getAllItems();
    this.listeners.forEach((fn) => {
      try {
        fn(list);
      } catch (err) {
        console.error('[DownloadManager] Listener error:', err);
      }
    });
    // Persist registry changes asynchronously
    saveRegistry(list).catch(() => {});
  }

  public getAllItems(): DownloadItem[] {
    return Array.from(this.items.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public getItem(id: string): DownloadItem | undefined {
    return this.items.get(id);
  }

  public findItem(mediaId: string, seasonNumber?: number, episodeNumber?: number): DownloadItem | undefined {
    return Array.from(this.items.values()).find((item) => {
      if (String(item.mediaId) !== String(mediaId)) return false;
      if (item.mediaType === 'tv') {
        return item.seasonNumber === (seasonNumber || 1) && item.episodeNumber === (episodeNumber || 1);
      }
      return true;
    });
  }

  public setWifiOnly(val: boolean) {
    this.wifiOnly = val;
  }

  public getWifiOnly(): boolean {
    return this.wifiOnly;
  }

  public generateId(mediaType: 'movie' | 'tv', mediaId: string, season = 1, episode = 1): string {
    return mediaType === 'tv'
      ? `tv_${mediaId}_s${season}_e${episode}`
      : `movie_${mediaId}`;
  }

  /**
   * Request to start downloading a movie or episode
   */
  public async startDownload(params: StartDownloadParams): Promise<DownloadItem> {
    await this.init();

    const season = params.seasonNumber || 1;
    const episode = params.episodeNumber || 1;
    const id = this.generateId(params.mediaType, params.mediaId, season, episode);

    let item = this.items.get(id);
    if (!item) {
      const itemDir = await ensureItemDirectory(id);
      item = {
        id,
        mediaId: String(params.mediaId),
        mediaType: params.mediaType,
        title: params.title,
        posterPath: params.posterPath,
        backdropPath: params.backdropPath,
        overview: params.overview,
        releaseYear: params.releaseYear,
        duration: params.duration,
        seasonNumber: params.mediaType === 'tv' ? season : undefined,
        episodeNumber: params.mediaType === 'tv' ? episode : undefined,
        episodeTitle: params.episodeTitle,
        status: 'queued',
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        createdAt: Date.now(),
        format: 'hls',
        localVideoUri: '',
        localDirectory: itemDir,
        selectedQuality: params.preferredQuality || '720p',
      };
      this.items.set(id, item);
    } else {
      if (item.status === 'completed') return item;
      item.status = 'queued';
      item.errorReason = undefined;
    }

    this.notifyListeners();
    this.processQueue();
    return item;
  }

  /**
   * Pause an in-flight download
   */
  public async pauseDownload(id: string): Promise<void> {
    const item = this.items.get(id);
    if (!item) return;

    const job = this.activeJobs.get(id);
    if (job) {
      if (job.abortController) {
        job.abortController.abort();
      }
      if (job.resumable) {
        try {
          await job.resumable.pauseAsync();
        } catch {}
      }
      this.activeJobs.delete(id);
    }

    item.status = 'paused';
    item.downloadSpeed = undefined;
    this.notifyListeners();
    this.processQueue();
  }

  /**
   * Resume a paused download
   */
  public async resumeDownload(id: string): Promise<void> {
    const item = this.items.get(id);
    if (!item) return;

    item.status = 'queued';
    item.errorReason = undefined;
    this.notifyListeners();
    this.processQueue();
  }

  /**
   * Cancel and delete temporary files for an active download
   */
  public async cancelDownload(id: string): Promise<void> {
    await this.pauseDownload(id);
    await deleteItemStorage(id);
    this.items.delete(id);
    this.notifyListeners();
    this.processQueue();
  }

  /**
   * Delete a completed or failed download and free up disk space
   */
  public async deleteDownload(id: string): Promise<void> {
    await this.cancelDownload(id);
  }

  /**
   * Delete all downloads
   */
  public async deleteAllDownloads(): Promise<void> {
    for (const [id] of this.items) {
      await this.pauseDownload(id);
      await deleteItemStorage(id);
    }
    this.items.clear();
    this.notifyListeners();
  }

  /**
   * Process the download queue based on concurrency limit
   */
  private async processQueue() {
    const activeCount = this.activeJobs.size;
    if (activeCount >= this.maxConcurrent) return;

    const queuedItem = Array.from(this.items.values()).find((i) => i.status === 'queued');
    if (!queuedItem) return;

    this.runDownloadJob(queuedItem);
  }

  /**
   * Execute the actual download work for an item
   */
  private async runDownloadJob(item: DownloadItem) {
    const abortController = new AbortController();
    this.activeJobs.set(item.id, { abortController });

    item.status = 'failed';
    item.errorReason = 'Offline downloads are unavailable — no licensed source configured.';
    item.downloadSpeed = undefined;
    this.notifyListeners();

    this.activeJobs.delete(item.id);
    this.processQueue();
  }
}

export const downloadManager = new DownloadManagerService();
