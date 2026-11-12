import {
  fetchFromTMDB,
  mapTmdbResults,
  enrichMoviesWithLogos,
  formatImageUrl,
} from './client';
import { FormattedMovie, FormattedTrailer } from './types';

export async function fetchTrendingFromTMDB(
  timeWindow: 'day' | 'week' = 'day',
  page: number = 1
): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB(`/trending/all/${timeWindow}`, { page });
  const movies = mapTmdbResults(data.results).slice(0, 14);
  return enrichMoviesWithLogos(movies);
}

export async function fetchWatchlistedFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/trending/all/week', { page });
  const movies = mapTmdbResults(data.results).slice(0, 14);
  return enrichMoviesWithLogos(movies);
}

export async function fetchRecommendedFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/movie/top_rated', { page });
  const movies = mapTmdbResults(data.results).slice(0, 14);
  return enrichMoviesWithLogos(movies);
}

export async function fetchBingeWorthyFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/tv/popular', { page });
  const movies = (data.results || [])
    .filter((item: any) => item.poster_path)
    .slice(0, 14)
    .map((item: any) => ({
      id: item.id,
      title: item.name || item.original_name || 'Popular Show',
      overview: item.overview || '',
      poster: formatImageUrl(item.poster_path, 'w500'),
      backdrop: formatImageUrl(item.backdrop_path, 'w1280'),
      rating: Math.round((item.vote_average || 0) * 10) / 10,
      releaseDate: item.first_air_date || '',
      mediaType: 'tv',
      seasonCount: item.number_of_seasons || undefined,
    }));
  return enrichMoviesWithLogos(movies);
}

export async function fetchTrendingTrailersFromTMDB(): Promise<FormattedTrailer[]> {
  const data = await fetchFromTMDB('/movie/now_playing', { page: 1 });
  const movies = (data.results || []).slice(0, 6);

  const trailerItems: FormattedTrailer[] = [];
  for (const m of movies) {
    if (!m.backdrop_path) continue;
    trailerItems.push({
      id: m.id,
      title: m.title,
      subtitle: `Official Trailer • In Theaters ${m.release_date?.slice(0, 4) || '2026'}`,
      thumbnail: formatImageUrl(m.backdrop_path, 'w1280') || '',
      isHighlight: m.vote_average > 7.5,
    });
  }
  return trailerItems;
}

export async function fetchNewTrailersFromTMDB(): Promise<FormattedTrailer[]> {
  const data = await fetchFromTMDB('/movie/upcoming', { page: 1 });
  const movies = (data.results || []).slice(0, 6);

  const trailerItems: FormattedTrailer[] = [];
  for (const m of movies) {
    if (!m.backdrop_path) continue;
    trailerItems.push({
      id: m.id,
      title: m.title,
      subtitle: `New Release • Arriving ${m.release_date?.slice(0, 4) || 'Soon'}`,
      thumbnail: formatImageUrl(m.backdrop_path, 'w1280') || '',
      isHighlight: m.vote_average > 7.2,
    });
  }
  return trailerItems;
}

export async function fetchHorrorFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/discover/movie', {
    with_genres: 27,
    sort_by: 'popularity.desc',
    page,
  });
  const movies = mapTmdbResults(data.results).slice(0, 14);
  return enrichMoviesWithLogos(movies);
}

export async function fetchLeavingSoonFromTMDB(): Promise<FormattedTrailer[]> {
  const data = await fetchFromTMDB('/movie/popular', { page: 2 });
  const movies = (data.results || []).slice(0, 6);

  return movies.map((m: any, index: number) => ({
    id: m.id,
    title: m.title,
    subtitle: `Expires in ${index * 3 + 2} days • Watch Before It Leaves`,
    thumbnail: formatImageUrl(m.backdrop_path, 'w1280') || '',
    isHighlight: true,
  }));
}

export async function fetchAnimeFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/discover/tv', {
    with_genres: 16,
    with_original_language: 'ja',
    sort_by: 'popularity.desc',
    page,
  });
  const movies = (data.results || [])
    .filter((item: any) => item.poster_path)
    .slice(0, 14)
    .map((item: any) => ({
      id: item.id,
      title: item.name || item.original_name || 'Anime Hit',
      overview: item.overview || '',
      poster: formatImageUrl(item.poster_path, 'w500'),
      backdrop: formatImageUrl(item.backdrop_path, 'w1280'),
      rating: Math.round((item.vote_average || 0) * 10) / 10,
      releaseDate: item.first_air_date || '',
      mediaType: 'tv',
      seasonCount: item.number_of_seasons || undefined,
    }));
  return enrichMoviesWithLogos(movies);
}

export async function fetchAnimeActionFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/discover/tv', {
    with_genres: '16,10759',
    with_original_language: 'ja',
    sort_by: 'popularity.desc',
    page,
  });
  const movies = (data.results || [])
    .filter((item: any) => item.poster_path)
    .slice(0, 14)
    .map((item: any) => ({
      id: item.id,
      title: item.name || item.original_name || 'Action Anime',
      overview: item.overview || '',
      poster: formatImageUrl(item.poster_path, 'w500'),
      backdrop: formatImageUrl(item.backdrop_path, 'w1280'),
      rating: Math.round((item.vote_average || 0) * 10) / 10,
      releaseDate: item.first_air_date || '',
      mediaType: 'tv',
      seasonCount: item.number_of_seasons || undefined,
    }));
  return enrichMoviesWithLogos(movies);
}

export async function fetchAnimeTopRatedFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/discover/tv', {
    with_genres: 16,
    with_original_language: 'ja',
    sort_by: 'vote_average.desc',
    'vote_count.gte': 250,
    page,
  });
  const movies = (data.results || [])
    .filter((item: any) => item.poster_path)
    .slice(0, 14)
    .map((item: any) => ({
      id: item.id,
      title: item.name || item.original_name || 'Top Anime',
      overview: item.overview || '',
      poster: formatImageUrl(item.poster_path, 'w500'),
      backdrop: formatImageUrl(item.backdrop_path, 'w1280'),
      rating: Math.round((item.vote_average || 0) * 10) / 10,
      releaseDate: item.first_air_date || '',
      mediaType: 'tv',
      seasonCount: item.number_of_seasons || undefined,
    }));
  return enrichMoviesWithLogos(movies);
}

export async function fetchAnimeFantasyFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/discover/tv', {
    with_genres: '16,10765',
    with_original_language: 'ja',
    sort_by: 'popularity.desc',
    page,
  });
  const movies = (data.results || [])
    .filter((item: any) => item.poster_path)
    .slice(0, 14)
    .map((item: any) => ({
      id: item.id,
      title: item.name || item.original_name || 'Fantasy Anime',
      overview: item.overview || '',
      poster: formatImageUrl(item.poster_path, 'w500'),
      backdrop: formatImageUrl(item.backdrop_path, 'w1280'),
      rating: Math.round((item.vote_average || 0) * 10) / 10,
      releaseDate: item.first_air_date || '',
      mediaType: 'tv',
      seasonCount: item.number_of_seasons || undefined,
    }));
  return enrichMoviesWithLogos(movies);
}

export async function fetchAnimeComedyFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/discover/tv', {
    with_genres: '16,35',
    with_original_language: 'ja',
    sort_by: 'popularity.desc',
    page,
  });
  const movies = (data.results || [])
    .filter((item: any) => item.poster_path)
    .slice(0, 14)
    .map((item: any) => ({
      id: item.id,
      title: item.name || item.original_name || 'Comedy Anime',
      overview: item.overview || '',
      poster: formatImageUrl(item.poster_path, 'w500'),
      backdrop: formatImageUrl(item.backdrop_path, 'w1280'),
      rating: Math.round((item.vote_average || 0) * 10) / 10,
      releaseDate: item.first_air_date || '',
      mediaType: 'tv',
      seasonCount: item.number_of_seasons || undefined,
    }));
  return enrichMoviesWithLogos(movies);
}

export async function fetchAnimeMoviesFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/discover/movie', {
    with_genres: 16,
    with_original_language: 'ja',
    sort_by: 'popularity.desc',
    page,
  });
  const movies = (data.results || [])
    .filter((item: any) => item.poster_path)
    .slice(0, 14)
    .map((item: any) => ({
      id: item.id,
      title: item.title || item.original_title || 'Anime Movie',
      overview: item.overview || '',
      poster: formatImageUrl(item.poster_path, 'w500'),
      backdrop: formatImageUrl(item.backdrop_path, 'w1280'),
      rating: Math.round((item.vote_average || 0) * 10) / 10,
      releaseDate: item.release_date || '',
      mediaType: 'movie',
    }));
  return enrichMoviesWithLogos(movies);
}

export async function fetchActionFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/discover/movie', {
    with_genres: 28,
    sort_by: 'popularity.desc',
    page,
  });
  const movies = mapTmdbResults(data.results).slice(0, 14);
  return enrichMoviesWithLogos(movies);
}

export async function fetchSciFiFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/discover/movie', {
    with_genres: 878,
    sort_by: 'popularity.desc',
    page,
  });
  const movies = mapTmdbResults(data.results).slice(0, 14);
  return enrichMoviesWithLogos(movies);
}

export async function fetchRealityFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/discover/tv', {
    with_genres: 10764,
    sort_by: 'popularity.desc',
    page,
  });
  const movies = (data.results || [])
    .filter((item: any) => item.poster_path)
    .slice(0, 14)
    .map((item: any) => ({
      id: item.id,
      title: item.name || item.original_name || 'Reality TV',
      overview: item.overview || '',
      poster: formatImageUrl(item.poster_path, 'w500'),
      backdrop: formatImageUrl(item.backdrop_path, 'w1280'),
      rating: Math.round((item.vote_average || 0) * 10) / 10,
      releaseDate: item.first_air_date || '',
      mediaType: 'tv',
      seasonCount: item.number_of_seasons || undefined,
    }));
  return enrichMoviesWithLogos(movies);
}

export async function fetchDramasFromTMDB(page: number = 1): Promise<FormattedMovie[]> {
  const data = await fetchFromTMDB('/discover/movie', {
    with_genres: 18,
    sort_by: 'vote_average.desc',
    'vote_count.gte': 2000,
    page,
  });
  const movies = mapTmdbResults(data.results).slice(0, 14);
  return enrichMoviesWithLogos(movies);
}
