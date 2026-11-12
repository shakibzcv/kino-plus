import { getApiBaseUrl } from './api-config';
import { getSecureSession, saveSecureSession, clearSecureSession } from './secure-storage';
import { syncGoogleAuthWithBackend } from './api-client';
import { cache, CacheKeys, CacheTTL } from '@/utils/cache';

export interface TrendingMovie {
  id: number | string;
  title: string;
  overview?: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  releaseDate?: string;
  mediaType: string;
  category?: string;
  seasonCount?: number;
  provider?: string;
  logo?: string | null;
}

export interface TrailerItem {
  id: string | number;
  title: string;
  subtitle?: string;
  thumbnail: string;
  isHighlight?: boolean;
  linkUrl?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  emoji?: string;
  bg?: string;
  gradient?: string;
  description?: string;
}

export interface LiveChannel {
  id: string;
  name: string;
  category: string;
  region?: string;
  currentProgram?: string;
  timeSlot?: string;
  viewers?: string;
  logoColor?: string;
  initials?: string;
  logoUrl?: string;
  streamUrl?: string;
  backupStreamUrl?: string;
  resolution?: string;
  country?: string;
  description?: string;
  language?: string;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profilePath?: string | null;
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
  id: number | string;
  title: string;
  tagline?: string;
  overview?: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  voteCount?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  certification?: string;
  releaseDate?: string;
  releaseYear?: string;
  runtime?: number | string;
  genres?: ({ id: number; name: string } | string)[];
  director?: string;
  creator?: string;
  credits?: {
    cast: CastMember[];
    crew?: any[];
  };
  similar?: TrendingMovie[];
  recommendations?: TrendingMovie[];
  castWorks?: TrendingMovie[];
  studioWorks?: TrendingMovie[];
  studioName?: string;
  mediaType?: string;
  seasons?: FormattedSeason[];
  logo?: string | null;
  videos?: {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
  }[];
  trailers?: {
    id: string;
    key: string;
    name: string;
    type: string;
    thumbnail: string;
  }[];
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

export interface SearchMediaResponse {
  results: TrendingMovie[];
  channels: any[];
  totalResults: number;
  totalPages: number;
  page: number;
}

// --- AUTH TOKEN MANAGEMENT & SILENT REFRESH ---

let inMemoryAuthToken: string | null = null;

export function setServiceAuthToken(token: string | null): void {
  inMemoryAuthToken = token;
}

export function getServiceAuthToken(): string | null {
  return inMemoryAuthToken;
}

type SessionExpiredListener = () => void;
type TokenRefreshedListener = (token: string) => void;

const sessionExpiredListeners = new Set<SessionExpiredListener>();
const tokenRefreshedListeners = new Set<TokenRefreshedListener>();

export function onMobileSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export function onMobileTokenRefreshed(listener: TokenRefreshedListener): () => void {
  tokenRefreshedListeners.add(listener);
  return () => {
    tokenRefreshedListeners.delete(listener);
  };
}

export function notifySessionExpired(): void {
  sessionExpiredListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('[Auth] Error in sessionExpired listener:', e);
    }
  });
}

export function notifyTokenRefreshed(token: string): void {
  tokenRefreshedListeners.forEach((listener) => {
    try {
      listener(token);
    } catch (e) {
      console.warn('[Auth] Error in tokenRefreshed listener:', e);
    }
  });
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshTokensSilently(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const session = await getSecureSession();

      // 1. Try refreshing with refreshToken via /auth/refresh
      if (session.refreshToken) {
        const url = `${getApiBaseUrl()}/auth/refresh`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
        if (res.ok) {
          const json = await res.json();
          const newAccessToken = json?.data?.token || json?.data?.accessToken;
          const newRefreshToken = json?.data?.refreshToken;
          if (newAccessToken) {
            inMemoryAuthToken = newAccessToken;
            await saveSecureSession({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken || session.refreshToken,
              user: json?.data?.user || session.user,
            });
            notifyTokenRefreshed(newAccessToken);
            return newAccessToken;
          }
        } else if (res.status === 401 || res.status === 403) {
          console.warn(`[API Auth] Session expired or revoked on server (HTTP ${res.status}). Wiping session...`);
          inMemoryAuthToken = null;
          await clearSecureSession();
          notifySessionExpired();
          return null;
        }
      }

      // 2. Fallback: If we have session.user and no explicit refresh rejection, sync with backend
      if (!session.refreshToken && session.user) {
        const syncRes = await syncGoogleAuthWithBackend(session.user);
        const newAccessToken = syncRes?.data?.token || syncRes?.data?.accessToken;
        const newRefreshToken = syncRes?.data?.refreshToken;
        if (newAccessToken) {
          inMemoryAuthToken = newAccessToken;
          await saveSecureSession({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: session.user,
          });
          notifyTokenRefreshed(newAccessToken);
          return newAccessToken;
        }
      }

      // If session had tokens but couldn't be refreshed, invalidate session
      if (session.accessToken || session.refreshToken) {
        inMemoryAuthToken = null;
        await clearSecureSession();
        notifySessionExpired();
      }

      return null;
    } catch (err) {
      console.warn('[API Auth] Failed to refresh tokens:', err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

/**
 * Warm the in-memory auth token from SecureStore ONCE at app startup.
 * Call this from AuthProvider after restoring session so individual
 * API calls never need to do Keystore disk I/O themselves.
 */
export async function warmAuthToken(): Promise<void> {
  if (inMemoryAuthToken) return;
  try {
    const session = await getSecureSession();
    if (session.accessToken) {
      inMemoryAuthToken = session.accessToken;
    }
  } catch {
    // Non-fatal — individual requests will fall back gracefully
  }
}

// ─── Unified internal fetch helper ──────────────────────────────────────────
// Single implementation used by both plain-data and x-total-count paths.
// returnMeta=true reads the x-total-count response header.
async function _fetch<T>(
  endpoint: string,
  returnMeta: false,
  retryOnAuth?: boolean
): Promise<T>;
async function _fetch<T>(
  endpoint: string,
  returnMeta: true,
  retryOnAuth?: boolean
): Promise<{ data: T; totalCount: number }>;
async function _fetch<T>(
  endpoint: string,
  returnMeta: boolean,
  retryOnAuth = true
): Promise<T | { data: T; totalCount: number }> {
  const url = `${getApiBaseUrl()}${endpoint}`;
  try {
    // Use warmed in-memory token; never hit Keystore per-request
    const token = inMemoryAuthToken;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { signal: controller.signal, headers });
    clearTimeout(timeoutId);

    if (response.status === 401 && retryOnAuth) {
      console.warn(`[API] ${endpoint} returned 401. Attempting token refresh...`);
      const refreshedToken = await refreshTokensSilently();
      if (refreshedToken) return _fetch<T>(endpoint, returnMeta as any, false);
    }

    if (!response.ok) {
      console.warn(`[API] ${endpoint} returned ${response.status}`);
      throw new Error(`Internal Server Error: HTTP ${response.status}`);
    }

    const json = await response.json();
    if (!json.success || json.data === undefined) {
      throw new Error('Internal Server Error: Invalid response payload');
    }

    if (returnMeta) {
      const totalHeader = response.headers.get('x-total-count');
      const totalCount = totalHeader ? parseInt(totalHeader, 10) : 0;
      return { data: json.data as T, totalCount };
    }

    return json.data as T;
  } catch (err: any) {
    console.warn(`[API] Failed to fetch ${endpoint}:`, err);
    throw new Error(err?.message || 'Internal Server Error');
  }
}

const fetchFromApi = <T>(endpoint: string, retryOnAuth = true) =>
  _fetch<T>(endpoint, false, retryOnAuth);

const fetchFromApiWithMeta = <T>(endpoint: string, retryOnAuth = true) =>
  _fetch<T>(endpoint, true, retryOnAuth);

// --- PUBLIC SERVICE METHODS MATCHING APPS/WEB (NO FALLBACKS) -------------------

export async function getMostWatchlisted(): Promise<TrendingMovie[]> {
  const cacheKey = CacheKeys.MOST_WATCHLISTED;
  const cached = cache.get<TrendingMovie[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFromApi<TrendingMovie[]>('/movies/watchlisted');
  cache.set(cacheKey, data, CacheTTL.MEDIUM);
  return data;
}

export async function getRecommendedMovies(): Promise<TrendingMovie[]> {
  const cacheKey = CacheKeys.RECOMMENDED;
  const cached = cache.get<TrendingMovie[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFromApi<TrendingMovie[]>('/movies/recommended');
  cache.set(cacheKey, data, CacheTTL.MEDIUM);
  return data;
}

export function getTrendingTrailers(): Promise<TrailerItem[]> {
  const cacheKey = CacheKeys.TRENDING_TRAILERS;
  const cached = cache.get<TrailerItem[]>(cacheKey);
  if (cached) return Promise.resolve(cached);

  return fetchFromApi<TrailerItem[]>('/movies/trailers/trending').then(data => {
    cache.set(cacheKey, data, CacheTTL.SHORT);
    return data;
  });
}

export async function getHorrorMovies(): Promise<TrendingMovie[]> {
  const cacheKey = CacheKeys.HORROR_MOVIES;
  const cached = cache.get<TrendingMovie[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFromApi<TrendingMovie[]>('/movies/horror');
  cache.set(cacheKey, data, CacheTTL.MEDIUM);
  return data;
}

export async function getLeavingSoonMovies(): Promise<TrailerItem[]> {
  const cacheKey = CacheKeys.LEAVING_SOON;
  const cached = cache.get<TrailerItem[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFromApi<TrailerItem[]>('/movies/leaving-soon');
  cache.set(cacheKey, data, CacheTTL.SHORT);
  return data;
}

export async function getAnimeShows(): Promise<TrendingMovie[]> {
  const cacheKey = CacheKeys.ANIME_SHOWS;
  const cached = cache.get<TrendingMovie[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFromApi<TrendingMovie[]>('/movies/anime');
  cache.set(cacheKey, data, CacheTTL.MEDIUM);
  return data;
}

export async function getBingeWorthyShows(): Promise<TrendingMovie[]> {
  const cacheKey = CacheKeys.BINGE_SHOWS;
  const cached = cache.get<TrendingMovie[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFromApi<TrendingMovie[]>('/movies/binge');
  cache.set(cacheKey, data, CacheTTL.MEDIUM);
  return data;
}

export async function getActionMovies(): Promise<TrendingMovie[]> {
  const cacheKey = CacheKeys.ACTION_MOVIES;
  const cached = cache.get<TrendingMovie[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFromApi<TrendingMovie[]>('/movies/action');
  cache.set(cacheKey, data, CacheTTL.MEDIUM);
  return data;
}

export function getNewTrailers(): Promise<TrailerItem[]> {
  const cacheKey = CacheKeys.NEW_TRAILERS;
  const cached = cache.get<TrailerItem[]>(cacheKey);
  if (cached) return Promise.resolve(cached);

  return fetchFromApi<TrailerItem[]>('/movies/trailers/new').then(data => {
    cache.set(cacheKey, data, CacheTTL.SHORT);
    return data;
  });
}

export async function getRealityShows(): Promise<TrendingMovie[]> {
  const cacheKey = CacheKeys.REALITY_SHOWS;
  const cached = cache.get<TrendingMovie[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFromApi<TrendingMovie[]>('/movies/reality');
  cache.set(cacheKey, data, CacheTTL.MEDIUM);
  return data;
}

export async function getSciFiMovies(): Promise<TrendingMovie[]> {
  const cacheKey = CacheKeys.SCIFI_MOVIES;
  const cached = cache.get<TrendingMovie[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFromApi<TrendingMovie[]>('/movies/scifi');
  cache.set(cacheKey, data, CacheTTL.MEDIUM);
  return data;
}

export async function getAwardWinningDramas(): Promise<TrendingMovie[]> {
  const cacheKey = CacheKeys.DRAMAS;
  const cached = cache.get<TrendingMovie[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFromApi<TrendingMovie[]>('/movies/dramas');
  cache.set(cacheKey, data, CacheTTL.MEDIUM);
  return data;
}

/**
 * Fetch categories dynamically from the Express API backend
 */
export async function getCategories(): Promise<CategoryItem[]> {
  const cacheKey = CacheKeys.CATEGORIES;
  const cached = cache.get<CategoryItem[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFromApi<CategoryItem[]>('/movies/categories');
  cache.set(cacheKey, data, CacheTTL.LONG);
  return data;
}

/**
 * Fetch media items belonging to a specific category from the Express API
 */
export async function getCategoryMedia(
  category: string,
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  page: number = 1
): Promise<{ items: TrendingMovie[]; totalPages: number; category: string }> {
  const cacheKey = `${CacheKeys.CATEGORY_MEDIA(category)}-${mediaType}-${page}`;
  const cached = cache.get<{ items: TrendingMovie[]; totalPages: number; category: string }>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchFromApi<{ items: TrendingMovie[]; totalPages: number; category: string }>(
      `/movies/category/${encodeURIComponent(category)}?mediaType=${mediaType}&page=${page}`
    );
    cache.set(cacheKey, data, CacheTTL.MEDIUM);
    return data;
  } catch (err) {
    console.warn(`[API] Failed to fetch media for category ${category}:`, err);
    return { items: [], totalPages: 1, category };
  }
}

/**
 * Fetch movies by category (matching web and desktop)
 */
export async function getMoviesByCategory(
  category: string,
  page: number = 1
): Promise<TrendingMovie[]> {
  const res = await getCategoryMedia(category, 'movie', page);
  return (res.items || []).map((item) => ({ ...item, mediaType: 'movie' }));
}

/**
 * Fetch TV shows by category (matching web and desktop)
 */
export async function getTvByCategory(
  category: string,
  page: number = 1
): Promise<TrendingMovie[]> {
  const res = await getCategoryMedia(category, 'tv', page);
  return (res.items || []).map((item) => ({ ...item, mediaType: 'tv' }));
}

/**
 * Invalidate only user-specific cache entries (favorites, continue-watching).
 * Does NOT wipe global content caches (MOST_WATCHLISTED, RECOMMENDED) — those
 * are the same for all users and do not need to be refetched on every toggle.
 */
export function invalidateUserCache(): void {
  cache.invalidateUserSpecific();
}

/**
 * Refresh a specific cache entry by forcing a new API call
 */
export async function refreshCategories(): Promise<CategoryItem[]> {
  cache.delete(CacheKeys.CATEGORIES);
  return getCategories();
}

export async function refreshMostWatchlisted(): Promise<TrendingMovie[]> {
  cache.delete(CacheKeys.MOST_WATCHLISTED);
  return getMostWatchlisted();
}

export async function refreshRecommended(): Promise<TrendingMovie[]> {
  cache.delete(CacheKeys.RECOMMENDED);
  return getRecommendedMovies();
}

/**
 * Fetch authenticated path configuration from the Express API
 */
export async function fetchPathConfig(
  authTokenOrUserId?: string
): Promise<PathConfigData | null> {
  try {
    let token: string | null = authTokenOrUserId || inMemoryAuthToken;
    if (!token) {
      const session = await getSecureSession();
      token = session.accessToken || null;
    }
    const url = `${getApiBaseUrl()}/config`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      if (token.startsWith('ey') || token.includes('.')) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['x-user-id'] = token;
      }
    }

    let response = await fetch(url, { headers });
    if (response.status === 401) {
      const refreshed = await refreshTokensSilently();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${refreshed}`;
        delete headers['x-user-id'];
        response = await fetch(url, { headers });
      }
    }
    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        return json.data as PathConfigData;
      }
    }
  } catch (err) {
    console.warn('[API] Could not fetch path config from backend:', err);
  }
  return null;
}

export interface LiveChannelsWithMetaResult {
  channels: LiveChannel[];
  totalCount: number;
}

/**
 * Fetch live TV channels dynamically from the Express API along with total available count
 */
export async function getLiveChannelsWithMeta(options?: {
  category?: string;
  search?: string;
  limit?: number;
  page?: number;
  country?: string;
  ids?: string[];
}): Promise<LiveChannelsWithMetaResult> {
  const params = new URLSearchParams();
  if (options?.ids && options.ids.length > 0) params.append('ids', options.ids.join(','));
  if (options?.category && options.category !== 'All Channels') params.append('category', options.category);
  if (options?.search && options.search.trim()) params.append('search', options.search.trim());
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.page) params.append('page', String(options.page));
  if (options?.country) params.append('country', options.country);
  const queryStr = params.toString() ? `?${params.toString()}` : '';

  // Create cache key based on query parameters
  const cacheKey = `${CacheKeys.LIVE_CHANNELS}-meta-${queryStr}`;

  // Only cache if it's not a search (search results shouldn't be cached)
  const isSearch = options?.search && options.search.trim();
  if (!isSearch) {
    const cached = cache.get<LiveChannelsWithMetaResult>(cacheKey);
    if (cached) return cached;
  }

  const { data, totalCount } = await fetchFromApiWithMeta<LiveChannel[]>(`/channels${queryStr}`);
  let resolvedTotal = totalCount;
  if (!resolvedTotal || isNaN(resolvedTotal)) {
    resolvedTotal = data.length;
  }

  const result: LiveChannelsWithMetaResult = {
    channels: data,
    totalCount: resolvedTotal,
  };

  // Only cache if it's not a search
  if (!isSearch) {
    cache.set(cacheKey, result, CacheTTL.MEDIUM);
  }

  return result;
}

/**
 * Fetch live TV channels dynamically from the Express API
 */
export async function getLiveChannels(options?: {
  category?: string;
  search?: string;
  limit?: number;
  page?: number;
  country?: string;
  ids?: string[];
}): Promise<LiveChannel[]> {
  const { channels } = await getLiveChannelsWithMeta(options);
  return channels;
}

/**
 * Fetch total and per-category channel counts from the Express API
 */
export async function getLiveChannelCounts(): Promise<{
  total: number;
  categories: Record<string, number>;
}> {
  try {
    const data = await fetchFromApi<{
      total: number;
      categories: Record<string, number>;
    }>('/channels/counts');
    return data;
  } catch (err) {
    console.warn('[Movies API] Failed to fetch channel counts:', err);
    return {
      total: 0,
      categories: {},
    };
  }
}

/**
 * Fetch movie or TV show details from the Express API
 */
export async function getMediaDetails(
  id: string | number,
  type?: 'movie' | 'tv'
): Promise<MediaDetails | null> {
  const cacheKey = `${CacheKeys.MEDIA_DETAILS(id)}-${type || 'any'}`;
  const cached = cache.get<MediaDetails>(cacheKey);
  if (cached) return cached;

  const query = type ? `?type=${type}` : '';
  try {
    const data = await fetchFromApi<MediaDetails>(`/movies/details/${id}${query}`);
    if (data) {
      cache.set(cacheKey, data, CacheTTL.LONG);
    }
    return data;
  } catch (err) {
    console.warn(`[API] Failed to fetch details for ${id}:`, err);
    return null;
  }
}

/**
 * Search movies, TV shows, and live channels
 */
export async function searchMedia(query: string, page: number = 1): Promise<SearchMediaResponse> {
  const clean = query.trim();
  if (!clean) {
    return { results: [], channels: [], totalResults: 0, totalPages: 0, page: 1 };
  }

  const cacheKey = `${CacheKeys.SEARCH_RESULTS(clean.toLowerCase())}-${page}`;
  const cached = cache.get<SearchMediaResponse>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchFromApi<SearchMediaResponse>(
      `/movies/search?q=${encodeURIComponent(clean)}&page=${page}`
    );
    if (data && data.results && data.results.length > 0) {
      cache.set(cacheKey, data, CacheTTL.SHORT);
    }
    return data;
  } catch (err) {
    console.warn(`[API] Search failed for '${clean}':`, err);
    return { results: [], channels: [], totalResults: 0, totalPages: 0, page: 1 };
  }
}

/**
 * Fetch TV season episodes
 */
export async function getTvSeasonEpisodes(
  id: string | number,
  season: number = 1
): Promise<FormattedEpisode[]> {
  const cacheKey = `tv-episodes-${id}-s${season}`;
  const cached = cache.get<FormattedEpisode[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchFromApi<FormattedEpisode[]>(`/movies/tv/${id}/season/${season}`);
    if (data && data.length > 0) {
      cache.set(cacheKey, data, CacheTTL.LONG);
    }
    return data;
  } catch (err) {
    console.warn(`[API] Failed to fetch episodes for show ${id} season ${season}:`, err);
    return [];
  }
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

/**
 * Fetch TV series episode ratings graph
 */
export async function getTvSeriesRatings(
  id: string | number
): Promise<SeriesRatingsGraphData | null> {
  const cacheKey = `tv-ratings-graph-${id}`;
  const cached = cache.get<SeriesRatingsGraphData>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchFromApi<SeriesRatingsGraphData>(`/movies/tv/${id}/ratings`);
    if (data && data.seasons && data.seasons.length > 0) {
      cache.set(cacheKey, data, CacheTTL.LONG);
    }
    return data;
  } catch (err) {
    console.warn(`[API] Failed to fetch ratings graph for show ${id}:`, err);
    return null;
  }
}

export interface WatchProviderItem {
  id: number;
  name: string;
  logo: string | null;
  category: 'stream' | 'rent' | 'buy';
  countries: string[];
  regionLabel: string;
}

export interface WatchProvidersResponse {
  link: string;
  streaming: WatchProviderItem[];
  stores: WatchProviderItem[];
}

/**
 * Fetch legal streaming availability (JustWatch via TMDB)
 */
export async function getWatchProviders(
  id: string | number,
  mediaType: "movie" | "tv"
): Promise<WatchProvidersResponse | null> {
  const cacheKey = `watch-providers-${mediaType}-${id}`;
  const cached = cache.get<WatchProvidersResponse>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchFromApi<WatchProvidersResponse>(
      `/movies/${id}/watch-providers?type=${mediaType}`
    );
    if (data) {
      cache.set(cacheKey, data, CacheTTL.MEDIUM);
    }
    return data;
  } catch (err) {
    console.warn(`[API] Failed to fetch watch providers for ${id}:`, err);
    return null;
  }
}

