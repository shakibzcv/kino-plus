import { ENV } from '../../config/env';
import logger from '../../logger/winston.logger';
import { ApiError } from '../../utils/ApiError';
import { FormattedMovie } from './types';

export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const formatImageUrl = (
  path: string | null,
  size: 'w500' | 'w780' | 'w1280' | 'original' = 'w500'
): string | null => {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
};

export function mapTmdbResults(results: any[]): FormattedMovie[] {
  return (results || [])
    .filter((item) => item.poster_path)
    .map((item) => ({
      id: item.id,
      title: item.title || item.name || item.original_title || 'Featured Title',
      overview: item.overview || '',
      poster: formatImageUrl(item.poster_path, 'w500'),
      backdrop: formatImageUrl(item.backdrop_path, 'w1280'),
      rating: Math.round((item.vote_average || 0) * 10) / 10,
      releaseDate: item.release_date || item.first_air_date || '',
      mediaType: item.media_type || (item.name ? 'tv' : 'movie'),
      seasonCount: item.number_of_seasons,
      logo: item.logo || null,
    }));
}

const TMDB_CACHE_TTL_MS = 10 * 60 * 1000;
const TMDB_STALE_MAX_MS = 6 * 60 * 60 * 1000; // serve stale data for up to 6h if TMDB is failing
const TMDB_CACHE_MAX_ENTRIES = 800;
const TMDB_REQUEST_TIMEOUT_MS = 8000;

const tmdbCache = new Map<string, { data: any; fetchedAt: number }>();
const tmdbInflight = new Map<string, Promise<any>>();

export async function fetchFromTMDBUncached(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<any> {
  const apiKey = ENV.MOVIE_DB_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, 'TMDB API key is not configured on the server');
  }

  const queryParams = new URLSearchParams({
    api_key: apiKey,
    ...Object.entries(params).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {}),
  });

  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TMDB_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    logger.error(`[TMDB] Error ${response.status} from ${endpoint}: ${response.statusText}`);
    throw new ApiError(response.status, `TMDB API request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchFromTMDB(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<any> {
  const sortedParams = Object.entries(params)
    .map(([k, v]) => `${k}=${String(v)}`)
    .sort()
    .join('&');
  const key = `${endpoint}?${sortedParams}`;
  const now = Date.now();

  const cached = tmdbCache.get(key);
  if (cached && now - cached.fetchedAt < TMDB_CACHE_TTL_MS) {
    return cached.data;
  }

  // Single-flight: concurrent identical requests share one upstream call
  const pending = tmdbInflight.get(key);
  if (pending) return pending;

  const request = fetchFromTMDBUncached(endpoint, params)
    .then((data) => {
      if (tmdbCache.size >= TMDB_CACHE_MAX_ENTRIES) {
        const oldest = tmdbCache.keys().next().value;
        if (oldest !== undefined) tmdbCache.delete(oldest);
      }
      tmdbCache.delete(key);
      tmdbCache.set(key, { data, fetchedAt: Date.now() });
      return data;
    })
    .catch((err) => {
      if (cached && Date.now() - cached.fetchedAt < TMDB_STALE_MAX_MS) {
        logger.warn(`[TMDB] Serving stale cache for ${endpoint} after upstream failure`);
        return cached.data;
      }
      throw err;
    })
    .finally(() => {
      tmdbInflight.delete(key);
    });

  tmdbInflight.set(key, request);
  return request;
}

const logoCache = new Map<string, string | null>();

export async function fetchLogoFromTMDB(
  id: number | string,
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<string | null> {
  const cacheKey = `${mediaType}:${id}`;
  if (logoCache.has(cacheKey)) {
    return logoCache.get(cacheKey) || null;
  }

  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}/images`, {
      include_image_language: 'en,null',
    });
    const logos: any[] = data?.logos || [];
    if (!logos.length) {
      logoCache.set(cacheKey, null);
      return null;
    }

    const enLogos = logos.filter((l: any) => l.iso_639_1 === 'en');
    const candidates = enLogos.length > 0 ? enLogos : logos;

    candidates.sort((a: any, b: any) => {
      const scoreA = (a.vote_average || 0) * (a.vote_count || 1);
      const scoreB = (b.vote_average || 0) * (b.vote_count || 1);
      return scoreB - scoreA;
    });

    const best = candidates[0];
    const logoUrl = best?.file_path ? formatImageUrl(best.file_path, 'w500') : null;
    logoCache.set(cacheKey, logoUrl);
    return logoUrl;
  } catch (err) {
    logoCache.set(cacheKey, null);
    return null;
  }
}

export async function enrichMoviesWithLogos(
  movies: FormattedMovie[],
  limitCount = 14
): Promise<FormattedMovie[]> {
  const targetMovies = movies.slice(0, limitCount);
  await Promise.allSettled(
    targetMovies.map(async (m) => {
      if (!m.logo) {
        const type = m.mediaType === 'tv' ? 'tv' : 'movie';
        m.logo = await fetchLogoFromTMDB(m.id, type);
      }
    })
  );
  return movies;
}
