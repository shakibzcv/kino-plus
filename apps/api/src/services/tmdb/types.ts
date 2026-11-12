export interface FormattedMovie {
  id: number;
  title: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  releaseDate: string;
  mediaType: string;
  seasonCount?: number;
  provider?: string;
  logo?: string | null;
}

export interface FormattedTrailer {
  id: string | number;
  title: string;
  subtitle: string;
  thumbnail: string;
  isHighlight?: boolean;
  linkUrl?: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
}

export interface ExtraVideo {
  id: string;
  key: string;
  name: string;
  type: string;
  thumbnail: string;
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

export interface MediaDetails {
  id: number;
  title: string;
  tagline?: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  voteCount?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  certification: string;
  releaseDate: string;
  releaseYear: string;
  runtime: string;
  genres: string[];
  director?: string;
  cast: CastMember[];
  trailers: ExtraVideo[];
  recommendations: FormattedMovie[];
  castWorks: FormattedMovie[];
  studioWorks: FormattedMovie[];
  studioName?: string;
  mediaType: 'movie' | 'tv';
  logo?: string | null;
  seasons?: FormattedSeason[];
}

export interface SearchResultData {
  results: FormattedMovie[];
  totalResults: number;
  totalPages: number;
  page: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  emoji?: string;
  bg?: string;
  gradient?: string;
  description?: string;
  movieGenreId?: number;
  tvGenreId?: number;
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
