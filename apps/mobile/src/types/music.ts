export interface MusicTrack {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number; // duration in seconds
  durationFormatted?: string; // "3:45"
  coverUrl: string;
  genre: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface MusicPlayerState {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  queue: MusicTrack[];
  queueIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  favorites: string[];
  isFullPlayerOpen: boolean;
}
