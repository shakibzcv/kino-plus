import { query } from '../../config/database';

// ─── Watchlist (Movies & TV Series) ────────────────────────────────────────────

export const getWatchlist = (userId: string) =>
  query(
    `SELECT id, user_id, media_id, media_type, title, poster_path, backdrop_path,
            COALESCE(logo, logo_path) AS logo, COALESCE(logo, logo_path) AS logo_path,
            overview, rating, vote_average,
            category, season_number, episode_number, episode_title, series_id, added_at
     FROM user_watchlist
     WHERE user_id = $1
     ORDER BY added_at DESC`,
    [userId]
  );

export const upsertWatchlistItem = (
  userId: string,
  mediaId: string,
  mediaType: string,
  title: string,
  posterPath: string | null,
  backdropPath: string | null,
  logo: string | null,
  overview: string | null,
  rating: number | null,
  voteAverage: number | null,
  category: string | null,
  seasonNumber: number | null,
  episodeNumber: number | null,
  episodeTitle: string | null,
  seriesId: string | null
) =>
  query(
    `INSERT INTO user_watchlist (
       user_id, media_id, media_type, title, poster_path, backdrop_path, logo, logo_path, overview, rating, vote_average,
       category, season_number, episode_number, episode_title, series_id, added_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, media_id, media_type)
     DO UPDATE SET
       title          = EXCLUDED.title,
       poster_path    = COALESCE(EXCLUDED.poster_path,    user_watchlist.poster_path),
       backdrop_path  = COALESCE(EXCLUDED.backdrop_path,  user_watchlist.backdrop_path),
       logo           = COALESCE(EXCLUDED.logo,           user_watchlist.logo),
       logo_path      = COALESCE(EXCLUDED.logo_path,      user_watchlist.logo_path),
       overview       = COALESCE(EXCLUDED.overview,       user_watchlist.overview),
       rating         = COALESCE(EXCLUDED.rating,         user_watchlist.rating),
       vote_average   = COALESCE(EXCLUDED.vote_average,   user_watchlist.vote_average),
       category       = COALESCE(EXCLUDED.category,       user_watchlist.category),
       season_number  = COALESCE(EXCLUDED.season_number,  user_watchlist.season_number),
       episode_number = COALESCE(EXCLUDED.episode_number, user_watchlist.episode_number),
       episode_title  = COALESCE(EXCLUDED.episode_title,  user_watchlist.episode_title),
       series_id      = COALESCE(EXCLUDED.series_id,      user_watchlist.series_id),
       added_at       = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, mediaId, mediaType, title, posterPath, backdropPath, logo, logo, overview, rating, voteAverage, category, seasonNumber, episodeNumber, episodeTitle, seriesId]
  );

export const deleteWatchlistItem = (userId: string, mediaType: string, mediaId: string) =>
  query(
    `DELETE FROM user_watchlist WHERE user_id = $1 AND media_type = $2 AND media_id = $3`,
    [userId, mediaType, mediaId]
  );

export const deleteWatchlistItemById = (userId: string, mediaId: string) =>
  query(`DELETE FROM user_watchlist WHERE user_id = $1 AND media_id = $2`, [userId, mediaId]);

export const isInWatchlist = (userId: string, mediaType: string, mediaId: string) =>
  query(
    `SELECT id FROM user_watchlist WHERE user_id = $1 AND media_type = $2 AND media_id = $3 LIMIT 1`,
    [userId, mediaType, mediaId]
  );

// ─── Continue Watching (Movies & TV Series) ───────────────────────────────────

export const getContinueWatching = (userId: string) =>
  query(
    `SELECT id, user_id, media_id, media_type, title, poster_path, backdrop_path,
            COALESCE(logo, logo_path) AS logo, COALESCE(logo, logo_path) AS logo_path,
            overview, rating, vote_average, category,
            season_number, episode_number, episode_title, progress_percentage,
            playback_position, duration, updated_at
     FROM user_continue_watching
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 25`,
    [userId]
  );

export const upsertContinueWatching = (
  userId: string,
  mediaId: string,
  mediaType: string,
  title: string,
  posterPath: string | null,
  backdropPath: string | null,
  logo: string | null,
  overview: string | null,
  rating: number | null,
  voteAverage: number | null,
  category: string | null,
  seasonNumber: number,
  episodeNumber: number,
  episodeTitle: string | null,
  progressPercentage: number,
  playbackPosition: number,
  duration: number
) =>
  query(
    `INSERT INTO user_continue_watching (
       user_id, media_id, media_type, title, poster_path, backdrop_path,
       logo, logo_path, overview, rating, vote_average, category,
       season_number, episode_number, episode_title, progress_percentage,
       playback_position, duration, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, media_id, season_number, episode_number)
     DO UPDATE SET
       title              = EXCLUDED.title,
       poster_path        = COALESCE(EXCLUDED.poster_path,       user_continue_watching.poster_path),
       backdrop_path      = COALESCE(EXCLUDED.backdrop_path,     user_continue_watching.backdrop_path),
       logo               = COALESCE(EXCLUDED.logo,              user_continue_watching.logo),
       logo_path          = COALESCE(EXCLUDED.logo_path,         user_continue_watching.logo_path),
       overview           = COALESCE(EXCLUDED.overview,          user_continue_watching.overview),
       rating             = COALESCE(EXCLUDED.rating,            user_continue_watching.rating),
       vote_average       = COALESCE(EXCLUDED.vote_average,      user_continue_watching.vote_average),
       category           = COALESCE(EXCLUDED.category,          user_continue_watching.category),
       episode_title      = COALESCE(EXCLUDED.episode_title,     user_continue_watching.episode_title),
       progress_percentage = EXCLUDED.progress_percentage,
       playback_position  = EXCLUDED.playback_position,
       duration           = EXCLUDED.duration,
       updated_at         = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, mediaId, mediaType, title, posterPath, backdropPath, logo, logo, overview, rating, voteAverage, category, seasonNumber, episodeNumber, episodeTitle, progressPercentage, playbackPosition, duration]
  );

export const deleteContinueWatching = (userId: string, mediaType: string, mediaId: string) =>
  query(
    `DELETE FROM user_continue_watching WHERE user_id = $1 AND media_type = $2 AND media_id = $3`,
    [userId, mediaType, mediaId]
  );

// ─── Search History ───────────────────────────────────────────────────────────

export const getSearchHistory = (userId: string, limit: number) =>
  query(
    `SELECT id, user_id, query, searched_at
     FROM user_search_history
     WHERE user_id = $1
     ORDER BY searched_at DESC
     LIMIT $2`,
    [userId, limit]
  );

export const upsertSearchHistory = (userId: string, queryText: string) =>
  query(
    `INSERT INTO user_search_history (user_id, query, searched_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, query)
     DO UPDATE SET searched_at = CURRENT_TIMESTAMP
     RETURNING id, user_id, query, searched_at`,
    [userId, queryText]
  );

export const deleteSearchHistoryItem = (userId: string, queryOrId: string) =>
  query(
    `DELETE FROM user_search_history WHERE user_id = $1 AND (query = $2 OR id::text = $2)`,
    [userId, queryOrId]
  );

export const clearSearchHistory = (userId: string) =>
  query(`DELETE FROM user_search_history WHERE user_id = $1`, [userId]);

// ─── Account Deletion (Purge across tables) ───────────────────────────────────

export const deleteAllUserData = (userId: string) =>
  Promise.all([
    query(`DELETE FROM user_watchlist          WHERE user_id = $1`, [userId]),
    query(`DELETE FROM user_continue_watching  WHERE user_id = $1`, [userId]),
    query(`DELETE FROM user_search_history     WHERE user_id = $1`, [userId]),
    query(`DELETE FROM sessions                WHERE user_id = $1`, [userId]),
    query(`DELETE FROM accounts                WHERE user_id = $1`, [userId]),
  ]);

export const deleteUser = (userId: string) =>
  query(`DELETE FROM users WHERE id = $1`, [userId]);
