export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
}

export interface FormattedSeason {
  id: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  poster: string | null;
}

export interface FormattedEpisode {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  still: string | null;
  runtime: number;
  airDate: string;
  rating: number;
}

export interface ExtraVideo {
  id: string;
  key: string;
  name: string;
  site?: string;
  type?: string;
  thumbnail: string;
}

export interface MediaDetails {
  id: number | string;
  title: string;
  tagline?: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  voteCount?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  certification?: string;
  releaseDate: string;
  releaseYear?: string;
  runtime?: string;
  genres: string[];
  director?: string;
  cast: CastMember[];
  trailers?: ExtraVideo[];
  recommendations: MediaItem[];
  castWorks?: MediaItem[];
  studioWorks?: MediaItem[];
  studioName?: string;
  mediaType: "movie" | "tv";
  logo?: string | null;
  seasons?: FormattedSeason[];
}

export interface MediaItem {
  id: number | string;
  title: string;
  overview?: string;
  poster?: string | null;
  backdrop?: string | null;
  rating?: number;
  releaseDate?: string;
  mediaType?: "movie" | "tv";
  seasonCount?: number;
  logo?: string | null;
  genres?: string[];
}

export interface ContinueWatchingItem {
  id?: number;
  mediaId: string;
  mediaType: "movie" | "tv";
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  logo?: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  progressPercentage?: number;
  playbackPosition?: number;
  duration?: number;
}

export interface TrailerItem {
  id: string | number;
  title: string;
  subtitle: string;
  thumbnail: string;
  youtubeKey?: string;
  duration?: string;
  linkUrl?: string;
  isHighlight?: boolean;
}

export interface WatchlistItem {
  id?: number;
  mediaId: string;
  mediaType: "movie" | "tv" | "episode";
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  logo?: string | null;
  rating?: number | null;
  voteAverage?: number | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string | null;
  seriesId?: string;
}

export interface SessionItem {
  id: string;
  isCurrent: boolean;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tv" | "browser";
  browser?: string;
  os?: string;
  ipAddress: string;
  location?: string;
  lastActiveAt: string;
  createdAt: string;
}

export interface SeasonRatingsData {
  seasonNumber: number;
  name: string;
  averageRating: number;
  episodes: {
    episodeNumber: number;
    name: string;
    rating: number;
    voteCount: number;
    airDate?: string;
  }[];
}

export interface SeriesRatingsGraphData {
  id: number;
  title: string;
  poster?: string | null;
  backdrop?: string | null;
  totalSeasons: number;
  maxEpisodes: number;
  overallAverage: number;
  seasons: SeasonRatingsData[];
}

export interface WatchProviderItem {
  id: number;
  name: string;
  logo: string | null;
  category: "stream" | "rent" | "buy";
  countries: string[];
  regionLabel: string;
}

export interface WatchProvidersResponse {
  link: string;
  streaming: WatchProviderItem[];
  stores: WatchProviderItem[];
}
