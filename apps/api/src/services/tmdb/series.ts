import logger from '../../logger/winston.logger';
import { fetchFromTMDB, formatImageUrl } from './client';
import {
  FormattedEpisode,
  SeasonRatingsData,
  SeriesRatingsGraphData,
} from './types';

export async function fetchTvSeasonEpisodes(
  tvId: string | number,
  seasonNumber: number
): Promise<FormattedEpisode[]> {
  try {
    const data = await fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}`);
    const episodes: any[] = data.episodes || [];
    return episodes.map((ep: any) => ({
      id: ep.id,
      episodeNumber: ep.episode_number,
      seasonNumber: ep.season_number,
      name: ep.name || `Episode ${ep.episode_number}`,
      overview: ep.overview || '',
      still: formatImageUrl(ep.still_path, 'w500'),
      runtime: ep.runtime || 0,
      airDate: ep.air_date || '',
      rating: Math.round((ep.vote_average || 0) * 10) / 10,
    }));
  } catch (err: any) {
    logger.error(`[TMDB] Error fetching TV season ${seasonNumber} for show ${tvId}: ${err?.message}`);
    return [];
  }
}

export async function fetchTvSeriesRatings(
  tvId: string | number
): Promise<SeriesRatingsGraphData | null> {
  try {
    const show = await fetchFromTMDB(`/tv/${tvId}`);
    if (!show || !show.id) return null;

    const validSeasons = (show.seasons || []).filter(
      (s: any) => s.season_number > 0
    );

    const seasonsData: SeasonRatingsData[] = await Promise.all(
      validSeasons.map(async (s: any) => {
        try {
          const seasonDetail = await fetchFromTMDB(`/tv/${tvId}/season/${s.season_number}`);
          const episodes = (seasonDetail.episodes || []).map((ep: any) => ({
            episodeNumber: ep.episode_number,
            name: ep.name || `Episode ${ep.episode_number}`,
            rating: Math.round((ep.vote_average || 0) * 10) / 10,
            voteCount: ep.vote_count || 0,
            airDate: ep.air_date || '',
          }));

          const ratedEpisodes = episodes.filter((ep: any) => ep.rating > 0);
          const averageRating =
            ratedEpisodes.length > 0
              ? Math.round(
                  (ratedEpisodes.reduce((acc: number, curr: any) => acc + curr.rating, 0) /
                    ratedEpisodes.length) *
                    10
                ) / 10
              : 0;

          return {
            seasonNumber: s.season_number,
            name: s.name || `Season ${s.season_number}`,
            averageRating,
            episodes,
          };
        } catch (seasonErr: any) {
          logger.warn(`[TMDB] Error fetching season ${s.season_number} for series ${tvId}: ${seasonErr?.message}`);
          return {
            seasonNumber: s.season_number,
            name: s.name || `Season ${s.season_number}`,
            averageRating: 0,
            episodes: [],
          };
        }
      })
    );

    const maxEpisodes = seasonsData.reduce(
      (max, s) => Math.max(max, s.episodes.length),
      0
    );

    const allRatedEpisodes = seasonsData.flatMap((s) =>
      s.episodes.filter((ep) => ep.rating > 0)
    );
    const overallAverage =
      allRatedEpisodes.length > 0
        ? Math.round(
            (allRatedEpisodes.reduce((acc, ep) => acc + ep.rating, 0) /
              allRatedEpisodes.length) *
              10
          ) / 10
        : Math.round((show.vote_average || 0) * 10) / 10;

    return {
      id: show.id,
      title: show.name || show.original_name || 'Series',
      poster: formatImageUrl(show.poster_path, 'w500'),
      backdrop: formatImageUrl(show.backdrop_path, 'w1280'),
      totalSeasons: seasonsData.length,
      maxEpisodes,
      overallAverage,
      seasons: seasonsData,
    };
  } catch (err: any) {
    logger.error(`[TMDB] Error fetching TV series ratings for ${tvId}: ${err?.message}`);
    return null;
  }
}
