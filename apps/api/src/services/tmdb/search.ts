import { fetchFromTMDB, mapTmdbResults } from './client';
import { SearchResultData } from './types';

const searchCache = new Map<string, { data: SearchResultData; timestamp: number }>();

export async function searchFromTMDB(query: string, page: number = 1): Promise<SearchResultData> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { results: [], totalResults: 0, totalPages: 0, page: 1 };
  }

  const cacheKey = `${cleanQuery.toLowerCase()}:${page}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 5) {
    return cached.data;
  }

  const data = await fetchFromTMDB('/search/multi', {
    query: cleanQuery,
    page,
    include_adult: 'false',
  });

  const rawResults = (data.results || []).filter(
    (item: any) =>
      (item.media_type === 'movie' || item.media_type === 'tv' || (!item.media_type && (item.title || item.name))) &&
      (item.poster_path || item.backdrop_path)
  );

  const movies = mapTmdbResults(rawResults);

  const resultData: SearchResultData = {
    results: movies,
    totalResults: data.total_results || movies.length,
    totalPages: data.total_pages || 1,
    page: data.page || page,
  };

  searchCache.set(cacheKey, { data: resultData, timestamp: Date.now() });
  return resultData;
}
