import { ApiError } from '../../utils/ApiError';
import {
  fetchFromTMDB,
  fetchLogoFromTMDB,
  formatImageUrl,
  mapTmdbResults,
  enrichMoviesWithLogos,
} from './client';
import {
  CastMember,
  ExtraVideo,
  FormattedMovie,
  FormattedSeason,
  MediaDetails,
} from './types';

export async function fetchMediaDetails(
  id: string | number,
  preferredType?: 'movie' | 'tv'
): Promise<MediaDetails> {
  let data: any = null;
  let resolvedType: 'movie' | 'tv' = preferredType || 'movie';

  if (preferredType) {
    try {
      data = await fetchFromTMDB(`/${preferredType}/${id}`, {
        append_to_response:
          preferredType === 'movie'
            ? 'credits,videos,recommendations,similar,release_dates,content_ratings'
            : 'credits,videos,recommendations,similar,content_ratings',
      });
      resolvedType = preferredType;
    } catch {
      throw new ApiError(404, `${preferredType === 'tv' ? 'Series' : 'Movie'} not found`);
    }
  } else {
    const [movieResult, tvResult] = await Promise.allSettled([
      fetchFromTMDB(`/movie/${id}`, {
        append_to_response:
          'credits,videos,recommendations,similar,release_dates,content_ratings',
      }),
      fetchFromTMDB(`/tv/${id}`, {
        append_to_response: 'credits,videos,recommendations,similar,content_ratings',
      }),
    ]);

    const movieData = movieResult.status === 'fulfilled' ? movieResult.value : null;
    const tvData = tvResult.status === 'fulfilled' ? tvResult.value : null;

    if (movieData && tvData) {
      const movieScore =
        (movieData.popularity || 0) * Math.log10((movieData.vote_count || 0) + 10);
      const tvScore =
        (tvData.popularity || 0) * Math.log10((tvData.vote_count || 0) + 10);
      if (tvScore > movieScore) {
        data = tvData;
        resolvedType = 'tv';
      } else {
        data = movieData;
        resolvedType = 'movie';
      }
    } else if (tvData) {
      data = tvData;
      resolvedType = 'tv';
    } else if (movieData) {
      data = movieData;
      resolvedType = 'movie';
    } else {
      throw new ApiError(404, `Media not found for ID ${id}`);
    }
  }

  const isMovie = resolvedType === 'movie';
  const title = data.title || data.name || data.original_title || 'Featured Title';
  const rawRating = data.vote_average || 7.0;
  const rating = Math.round(rawRating * 10) / 10;
  const releaseDate = data.release_date || data.first_air_date || '';
  const releaseYear = releaseDate ? releaseDate.slice(0, 4) : '2026';

  let seasons: FormattedSeason[] | undefined = undefined;
  if (!isMovie && Array.isArray(data.seasons)) {
    seasons = data.seasons
      .filter((s: any) => s.season_number > 0)
      .map((s: any) => ({
        id: s.id,
        seasonNumber: s.season_number,
        name: s.name || `Season ${s.season_number}`,
        episodeCount: s.episode_count || 0,
        poster: formatImageUrl(s.poster_path, 'w500'),
      }));
  }

  let runtime = '1h 45m';
  if (isMovie && data.runtime) {
    const hours = Math.floor(data.runtime / 60);
    const mins = data.runtime % 60;
    runtime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  } else if (!isMovie) {
    const numSeasons = data.number_of_seasons || (seasons ? seasons.length : 1);
    runtime = `${numSeasons} ${numSeasons === 1 ? 'Season' : 'Seasons'}`;
  }

  let certification = 'PG-13';
  if (isMovie && data.release_dates?.results) {
    const usRelease = data.release_dates.results.find((r: any) => r.iso_3166_1 === 'US');
    const usCert = usRelease?.release_dates?.find(
      (d: any) => d.certification && d.certification.trim()
    )?.certification;
    if (usCert) certification = usCert;
  } else if (!isMovie && data.content_ratings?.results) {
    const usRating = data.content_ratings.results.find((r: any) => r.iso_3166_1 === 'US')?.rating;
    if (usRating) certification = usRating;
  }

  let director = '';
  if (isMovie && data.credits?.crew) {
    const dir = data.credits.crew.find((c: any) => c.job === 'Director');
    if (dir) director = dir.name;
  } else if (!isMovie) {
    if (data.created_by && data.created_by.length > 0) {
      director = data.created_by.map((c: any) => c.name).join(', ');
    } else if (data.credits?.crew) {
      const dir = data.credits.crew.find(
        (c: any) => c.job === 'Executive Producer' || c.job === 'Director'
      );
      if (dir) director = dir.name;
    }
  }

  const cast: CastMember[] = (data.credits?.cast || []).slice(0, 18).map((c: any) => ({
    id: c.id,
    name: c.name,
    character: c.character || 'Cast',
    profileUrl: formatImageUrl(c.profile_path, 'w500'),
  }));

  const trailers: ExtraVideo[] = (data.videos?.results || [])
    .filter((v: any) => v.site === 'YouTube' && v.key)
    .slice(0, 10)
    .map((v: any) => ({
      id: v.id,
      key: v.key,
      name: v.name || 'Official Trailer',
      type: v.type || 'Trailer',
      thumbnail: `https://img.youtube.com/vi/${v.key}/hqdefault.jpg`,
    }));

  const rawRecs = [...(data.recommendations?.results || []), ...(data.similar?.results || [])];
  const recommendations = await enrichMoviesWithLogos(mapTmdbResults(rawRecs).slice(0, 14));

  let castWorks: FormattedMovie[] = [];
  const leadActorId = cast[0]?.id;
  if (leadActorId) {
    try {
      const actorData = await fetchFromTMDB(
        `/person/${leadActorId}/${isMovie ? 'movie_credits' : 'tv_credits'}`
      );
      castWorks = mapTmdbResults(actorData.cast || []).filter((m) => m.id !== data.id).slice(0, 14);
    } catch {
      castWorks = recommendations.slice(0, 10);
    }
  }
  if (castWorks.length === 0) {
    castWorks = recommendations.slice(0, 10);
  }

  let studioWorks: FormattedMovie[] = [];
  const studio = data.production_companies?.[0];
  const studioName = studio?.name || 'Studio';
  if (studio?.id) {
    try {
      const studioData = await fetchFromTMDB(`/discover/${isMovie ? 'movie' : 'tv'}`, {
        with_companies: studio.id,
        sort_by: 'popularity.desc',
      });
      studioWorks = mapTmdbResults(studioData.results || []).filter((m) => m.id !== data.id).slice(0, 14);
    } catch {
      studioWorks = recommendations.slice(2, 12);
    }
  }
  if (studioWorks.length === 0) {
    studioWorks = recommendations.slice(2, 12);
  }

  const logo = await fetchLogoFromTMDB(data.id, resolvedType);

  return {
    id: data.id,
    title,
    tagline: data.tagline || '',
    overview: data.overview || '',
    poster: formatImageUrl(data.poster_path, 'w500'),
    backdrop:
      formatImageUrl(data.backdrop_path, 'original') ||
      formatImageUrl(data.backdrop_path, 'w1280'),
    rating,
    voteCount: data.vote_count || 0,
    numberOfSeasons: data.number_of_seasons || (seasons ? seasons.length : undefined),
    numberOfEpisodes: data.number_of_episodes || undefined,
    certification,
    releaseDate,
    releaseYear,
    runtime,
    genres: (data.genres || []).map((g: any) => g.name),
    director: director || undefined,
    cast,
    trailers,
    recommendations,
    castWorks,
    studioWorks,
    studioName,
    mediaType: resolvedType,
    logo,
    seasons,
  };
}
