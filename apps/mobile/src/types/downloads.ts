export type DownloadStatus =
  | 'idle'
  | 'queued'
  | 'fetching_sources'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelling';

export type DownloadQuality = '1080p' | '720p' | '480p' | 'auto';

export interface DownloadSubtitle {
  code: string;
  label: string;
  lang: string;
  url?: string;
  localPath: string; // file://...
}

export interface DownloadItem {
  id: string; // e.g., movie_123 or tv_456_s1_e2
  mediaId: string;
  mediaType: 'movie' | 'tv';
  title: string;
  episodeTitle?: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  posterPath?: string | null;
  backdropPath?: string | null;
  overview?: string | null;
  releaseYear?: string;
  duration?: number; // In seconds or minutes

  // Progress & State
  status: DownloadStatus;
  progress: number; // 0 to 100
  downloadedBytes: number;
  totalBytes: number; // Estimated or exact
  downloadSpeed?: string; // e.g. "2.4 MB/s"
  createdAt: number;
  completedAt?: number;
  errorReason?: string;

  // Storage & Playback
  format: 'mp4' | 'hls';
  localVideoUri: string; // file://...
  localDirectory: string; // Directory containing segments/video
  selectedQuality?: DownloadQuality;
  selectedServer?: string;
  subtitles?: DownloadSubtitle[];
}

export interface StorageInfo {
  totalDiskBytes: number;
  freeDiskBytes: number;
  usedByDownloadsBytes: number;
}

export interface StartDownloadParams {
  mediaId: string;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  overview?: string | null;
  releaseYear?: string;
  duration?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string | null;
  preferredQuality?: DownloadQuality;
}
