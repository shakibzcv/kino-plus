export interface TrendingMovie {
  id: number | string;
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
  recommendations: TrendingMovie[];
  castWorks: TrendingMovie[];
  studioWorks: TrendingMovie[];
  studioName?: string;
  mediaType: "movie" | "tv";
  logo?: string | null;
  seasons?: FormattedSeason[];
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

export interface TrailerItem {
  id: string | number;
  title: string;
  subtitle: string;
  thumbnail: string;
  isHighlight?: boolean;
  linkUrl?: string;
}

export const BROWSE_CATEGORIES = [
  "Action",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "Horror",
  "Music",
  "Mystery",
  "Reality",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western",
  "Adventure",
];

export interface CategoryItem {
  id: string;
  name: string;
  emoji?: string;
  bg?: string;
  gradient?: string;
  description?: string;
}

export interface PathConfigData {
  endpoints: {
    trending: string;
    watchlist: string;
    recommended: string;
    binge: string;
    categories: string;
    categoryMedia: string;
    newTrailers: string;
    trendingTrailers: string;
    horror: string;
    leavingSoon: string;
    anime: string;
    action: string;
    scifi: string;
    reality: string;
    dramas: string;
    details: string;
    search: string;
    continueWatching: string;
    favorites: string;
    channels: string;
    whatsOn: string;
  };
  routes: {
    trending: string;
    watchlist: string;
    recommended: string;
    binge: string;
    categories: string;
  };
  appRoutes: {
    home: string;
    liveTv: string;
    categories: string;
    watchlist: string;
    search: string;
    settings: string;
  };
}

export interface CategoryMediaResponse {
  items: TrendingMovie[];
  totalPages: number;
  category: string;
  mediaType: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

import { authenticatedFetch } from "./auth.client";

async function fetchFromApi<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await authenticatedFetch(url);

    if (!response.ok) {
      console.error(
        `[API Error] Request to ${endpoint} failed with HTTP ${response.status}`,
      );
      throw new Error("Internal Server Error");
    }

    const json = await response.json();
    if (!json.success || json.data === undefined) {
      console.error(
        `[API Error] Request to ${endpoint} returned error payload:`,
        json,
      );
      throw new Error("Internal Server Error");
    }

    return json.data as T;
  } catch (err: any) {
    if (err?.message !== "Internal Server Error") {
      console.error(`[API Network Error] ${endpoint}:`, err);
    }
    throw new Error("Internal Server Error");
  }
}

// Fetch categories from the Express API
export async function getCategories(): Promise<CategoryItem[]> {
  return fetchFromApi<CategoryItem[]>("/movies/categories");
}

// Fetch media for a specific category from the Express API
export async function getMediaByCategory(
  category: string,
  mediaType: "all" | "movie" | "tv" = "all",
  page: number = 1,
): Promise<CategoryMediaResponse> {
  return fetchFromApi<CategoryMediaResponse>(
    `/movies/category/${encodeURIComponent(category)}?mediaType=${mediaType}&page=${page}`,
  );
}

// 1. Trending Movies
export async function getTrendingMovies(
  timeWindow: "day" | "week" = "day",
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(
    `/movies/trending?timeWindow=${timeWindow}&page=${page}`,
  );
}

// 2. Most Watchlisted This Week
export async function getMostWatchlisted(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/watchlisted?page=${page}`);
}

// 3. Recommended For You
export async function getRecommendedMovies(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/recommended?page=${page}`);
}

// 4. Binge-Worthy Shows
export async function getBingeWorthyShows(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/binge?page=${page}`);
}

// 5. Trending Trailers
export async function getTrendingTrailers(): Promise<TrailerItem[]> {
  return fetchFromApi<TrailerItem[]>("/movies/trailers/trending");
}

// 6. New Trailers
export async function getNewTrailers(): Promise<TrailerItem[]> {
  return fetchFromApi<TrailerItem[]>("/movies/trailers/new");
}

// 7. Spine-Chilling Horror Debuts
export async function getHorrorMovies(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/horror?page=${page}`);
}

// 8. Leaving Soon
export async function getLeavingSoonMovies(): Promise<TrailerItem[]> {
  return fetchFromApi<TrailerItem[]>("/movies/leaving-soon");
}

// 9. Anime Hits & Animation
export async function getAnimeShows(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/anime?page=${page}`);
}

export async function getAnimeAction(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/anime/action?page=${page}`);
}

export async function getAnimeTopRated(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/anime/top-rated?page=${page}`);
}

export async function getAnimeFantasy(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/anime/fantasy?page=${page}`);
}

export async function getAnimeComedy(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/anime/comedy?page=${page}`);
}

export async function getAnimeMovies(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/anime/movies?page=${page}`);
}

export async function getMoviesByCategory(
  category: string,
  page: number = 1,
): Promise<TrendingMovie[]> {
  const res = await getMediaByCategory(category, "movie", page);
  return (res.items || []).map((item) => ({ ...item, mediaType: "movie" }));
}

export async function getTvByCategory(
  category: string,
  page: number = 1,
): Promise<TrendingMovie[]> {
  const res = await getMediaByCategory(category, "tv", page);
  return (res.items || []).map((item) => ({ ...item, mediaType: "tv" }));
}

// 10. High-Octane Action Blockbusters
export async function getActionMovies(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/action?page=${page}`);
}

// 11. Sci-Fi & Cyberpunk Visions
export async function getSciFiMovies(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/scifi?page=${page}`);
}

// 12. Reality & Lifestyle TV
export async function getRealityShows(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/reality?page=${page}`);
}

// 13. Critically Acclaimed Dramas
export async function getAwardWinningDramas(
  page: number = 1,
): Promise<TrendingMovie[]> {
  return fetchFromApi<TrendingMovie[]>(`/movies/dramas?page=${page}`);
}

// 14. Full Media Details (Movie / Show Details with Credits, Videos, Recommendations)
export async function getMediaDetails(
  id: string | number,
  type?: "movie" | "tv",
): Promise<MediaDetails> {
  const query = type ? `?type=${type}` : "";
  return fetchFromApi<MediaDetails>(`/movies/details/${id}${query}`);
}

// 15. Movie / Show Logo Retrieval (Title Treatment Graphic)
export async function getMediaLogo(
  id: string | number,
  type: "movie" | "tv" = "movie",
): Promise<string | null> {
  try {
    const res = await fetchFromApi<{ logo: string | null }>(
      `/movies/${id}/logo?type=${type}`,
    );
    return res?.logo || null;
  } catch (err) {
    return null;
  }
}

// 16. TV Season Episodes Retrieval
export async function getTvSeasonEpisodes(
  id: string | number,
  season: number = 1,
): Promise<FormattedEpisode[]> {
  try {
    return await fetchFromApi<FormattedEpisode[]>(
      `/movies/tv/${id}/season/${season}`,
    );
  } catch (err) {
    console.error(
      `[API Error] Failed to fetch episodes for show ${id} season ${season}:`,
      err,
    );
    return [];
  }
}

// 17. TV Series Full Episode Ratings Graph
export async function getTvSeriesRatings(
  id: string | number,
): Promise<SeriesRatingsGraphData | null> {
  try {
    return await fetchFromApi<SeriesRatingsGraphData>(`/movies/tv/${id}/ratings`);
  } catch (err) {
    console.error(`[API Error] Failed to fetch ratings graph for show ${id}:`, err);
    return null;
  }
}

// 18. Watch Providers (JustWatch via TMDB)
export async function getWatchProviders(
  id: string | number,
  mediaType: "movie" | "tv",
): Promise<WatchProvidersResponse | null> {
  try {
    const res = await fetchFromApi<WatchProvidersResponse | null>(
      `/movies/${id}/watch-providers?type=${mediaType}`,
    );
    return res;
  } catch (err) {
    console.error(`[API Error] Failed to fetch watch providers for ${id}:`, err);
    return null;
  }
}

export interface SearchMediaResponse {
  results: TrendingMovie[];
  channels: any[];
  totalResults: number;
  totalPages: number;
  page: number;
}

// 17. Search Movies, TV Shows, and Live Channels
export async function searchMedia(
  query: string,
  page: number = 1,
): Promise<SearchMediaResponse> {
  const clean = query.trim();
  if (!clean) {
    return {
      results: [],
      channels: [],
      totalResults: 0,
      totalPages: 0,
      page: 1,
    };
  }
  try {
    return await fetchFromApi<SearchMediaResponse>(
      `/movies/search?q=${encodeURIComponent(clean)}&page=${page}`,
    );
  } catch (err) {
    console.error(`[API Error] Search failed for '${clean}':`, err);
    return {
      results: [],
      channels: [],
      totalResults: 0,
      totalPages: 0,
      page: 1,
    };
  }
}

// 18. Authenticated Path Configuration
export async function fetchPathConfig(
  token?: string,
): Promise<PathConfigData | null> {
  const url = `${API_BASE_URL}/config`;
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        return json.data as PathConfigData;
      }
    }
  } catch (err) {
    console.warn("[Config] Failed to fetch path config from backend:", err);
  }
  return null;
}
