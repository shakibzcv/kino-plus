import {
  API_BASE_URL,
  getClientAccessToken,
  dispatchUnauthorized,
  authenticatedFetch,
} from "./auth.client";

export interface WatchlistItem {
  id?: number;
  mediaId: string;
  mediaType: "movie" | "tv" | "episode";
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  logoPath?: string | null;
  logo?: string | null;
  overview?: string | null;
  rating?: number | null;
  voteAverage?: number | null;
  category?: string | null;
  genres?: string[] | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string | null;
  seriesId?: string;
  addedAt?: string;
}

export interface FavoriteChannelItem {
  id?: number;
  channelId: string;
  channelName?: string | null;
  channelLogo?: string | null;
  channelCountry?: string | null;
  addedAt?: string;
}

/**
 * Returns a stable persistent client ID for guest sessions
 */
export function getClientUserId(): string {
  if (typeof window === "undefined") return "default_user";
  let id = localStorage.getItem("kino_client_user_id");
  if (!id) {
    id =
      "usr_" +
      Math.random().toString(36).substring(2, 11) +
      Date.now().toString(36);
    localStorage.setItem("kino_client_user_id", id);
  }
  return id;
}

function getRequestHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = getClientAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Returns true if the client currently holds an access token.
 * Use this to short-circuit fetch calls before firing a doomed 401.
 */
function hasToken(): boolean {
  return Boolean(getClientAccessToken());
}

/* ========================================================
   📺 LIVE TV CHANNELS FAVORITES (POSTGRESQL DATABASE)
   ======================================================== */

export async function fetchFavoriteChannels(): Promise<string[]> {
  // Don't fire if not authenticated
  if (!hasToken()) return [];
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/user/favorites`, {
      method: "GET",
      headers: getRequestHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data: FavoriteChannelItem[] = json.data || [];
    const ids = data.map((d) => d.channelId);

    // Sync to local cache
    if (typeof window !== "undefined") {
      localStorage.setItem("kino_favorite_channels", JSON.stringify(ids));
    }
    return ids;
  } catch (err) {
    console.warn("[UserData] fetchFavoriteChannels fallback to local:", err);
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("kino_favorite_channels");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}

export async function addFavoriteChannel(channel: {
  channelId: string;
  channelName?: string;
  channelLogo?: string;
  channelCountry?: string;
}): Promise<boolean> {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/user/favorites`, {
      method: "POST",
      headers: getRequestHeaders(),
      body: JSON.stringify(channel),
    });
    return res.ok;
  } catch (err) {
    console.error("[UserData] addFavoriteChannel error:", err);
    return false;
  }
}

export async function removeFavoriteChannel(
  channelId: string,
): Promise<boolean> {
  try {
    const res = await authenticatedFetch(
      `${API_BASE_URL}/user/favorites/${encodeURIComponent(channelId)}`,
      {
        method: "DELETE",
        headers: getRequestHeaders(),
      },
    );
    return res.ok;
  } catch (err) {
    console.error("[UserData] removeFavoriteChannel error:", err);
    return false;
  }
}

/* ========================================================
   📌 WATCHLIST (POSTGRESQL DATABASE)
   ======================================================== */

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  // Don't fire if not authenticated
  if (!hasToken()) return [];
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/user/watchlist`, {
      method: "GET",
      headers: getRequestHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const items: WatchlistItem[] = json.data || [];
    if (typeof window !== "undefined") {
      localStorage.setItem("kino_watchlist_cache", JSON.stringify(items));
    }
    return items;
  } catch (err) {
    console.warn("[UserData] fetchWatchlist fallback to cache:", err);
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("kino_watchlist_cache");
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}

export async function addToWatchlist(item: WatchlistItem): Promise<boolean> {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/user/watchlist`, {
      method: "POST",
      headers: getRequestHeaders(),
      body: JSON.stringify(item),
    });
    if (res.ok && typeof window !== "undefined") {
      // Optimistically update local cache
      try {
        const cached = localStorage.getItem("kino_watchlist_cache");
        const list: WatchlistItem[] = cached ? JSON.parse(cached) : [];
        const exists = list.some(
          (x) =>
            String(x.mediaId) === String(item.mediaId) &&
            x.mediaType === item.mediaType,
        );
        if (!exists) {
          list.unshift(item);
          localStorage.setItem("kino_watchlist_cache", JSON.stringify(list));
        }
      } catch {
        // ignore
      }
    }
    return res.ok;
  } catch (err) {
    console.error("[UserData] addToWatchlist error:", err);
    return false;
  }
}

export async function removeFromWatchlist(
  mediaType: string,
  mediaId: string,
): Promise<boolean> {
  try {
    const res = await authenticatedFetch(
      `${API_BASE_URL}/user/watchlist/${encodeURIComponent(mediaType)}/${encodeURIComponent(mediaId)}`,
      {
        method: "DELETE",
        headers: getRequestHeaders(),
      },
    );
    if (res.ok && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("kino_watchlist_cache");
        if (cached) {
          const list: WatchlistItem[] = JSON.parse(cached);
          const filtered = list.filter(
            (x) =>
              !(
                String(x.mediaId) === String(mediaId) &&
                x.mediaType === mediaType
              ),
          );
          localStorage.setItem(
            "kino_watchlist_cache",
            JSON.stringify(filtered),
          );
        }
      } catch {
        // ignore
      }
    }
    return res.ok;
  } catch (err) {
    console.error("[UserData] removeFromWatchlist error:", err);
    return false;
  }
}

export async function checkInWatchlist(
  mediaType: string,
  mediaId: string,
): Promise<boolean> {
  try {
    const res = await authenticatedFetch(
      `${API_BASE_URL}/user/watchlist/check/${encodeURIComponent(mediaType)}/${encodeURIComponent(mediaId)}`,
      {
        method: "GET",
        headers: getRequestHeaders(),
      },
    );
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json.data?.inWatchlist);
  } catch {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("kino_watchlist_cache");
        if (cached) {
          const list: WatchlistItem[] = JSON.parse(cached);
          return list.some(
            (x) =>
              String(x.mediaId) === String(mediaId) &&
              x.mediaType === mediaType,
          );
        }
      } catch {
        // ignore
      }
    }
    return false;
  }
}

/* ========================================================
   🔍 SEARCH HISTORY (LOCALSTORAGE + BACKEND API)
   ======================================================== */

const LOCAL_SEARCH_HISTORY_KEY = "kino_search_history";

export interface SearchHistoryItem {
  id?: number;
  query: string;
  searchedAt?: string;
}

export function getLocalSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalSearchHistory(queries: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_SEARCH_HISTORY_KEY, JSON.stringify(queries.slice(0, 20)));
  } catch {}
}

export async function fetchSearchHistory(): Promise<string[]> {
  const localList = getLocalSearchHistory();
  const token = getClientAccessToken();
  if (!token) return localList;

  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/user/search-history?limit=10`, {
      method: "GET",
      headers: getRequestHeaders(),
    });
    if (!res.ok) return localList;
    const json = await res.json();
    const serverItems: SearchHistoryItem[] = json.data || [];
    const serverQueries = serverItems.map((item) => item.query);

    const combined = Array.from(new Set([...serverQueries, ...localList]));
    saveLocalSearchHistory(combined);
    return combined;
  } catch {
    return localList;
  }
}

export async function saveSearchHistory(query: string): Promise<string[]> {
  const clean = query.trim();
  if (!clean) return getLocalSearchHistory();

  const local = getLocalSearchHistory();
  const updated = [clean, ...local.filter((q) => q.toLowerCase() !== clean.toLowerCase())].slice(0, 20);
  saveLocalSearchHistory(updated);

  const token = getClientAccessToken();
  if (token) {
    try {
      await authenticatedFetch(`${API_BASE_URL}/user/search-history`, {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({ query: clean }),
      });
    } catch {}
  }

  return updated;
}

export async function removeSearchHistory(query: string): Promise<string[]> {
  const clean = query.trim();
  const local = getLocalSearchHistory();
  const updated = local.filter((q) => q.toLowerCase() !== clean.toLowerCase());
  saveLocalSearchHistory(updated);

  const token = getClientAccessToken();
  if (token) {
    try {
      await authenticatedFetch(`${API_BASE_URL}/user/search-history/${encodeURIComponent(clean)}`, {
        method: "DELETE",
        headers: getRequestHeaders(),
      });
    } catch {}
  }

  return updated;
}

export async function clearSearchHistory(): Promise<void> {
  saveLocalSearchHistory([]);

  const token = getClientAccessToken();
  if (token) {
    try {
      await authenticatedFetch(`${API_BASE_URL}/user/search-history`, {
        method: "DELETE",
        headers: getRequestHeaders(),
      });
    } catch {}
  }
}

/* ========================================================
   📺 RECENT CHANNELS (LIVE TV CONTINUE WATCHING DB)
   ======================================================== */

export interface ServerRecentChannelItem {
  id?: number;
  userId?: string;
  channelId: string;
  channelName?: string | null;
  channelLogo?: string | null;
  channelCountry?: string | null;
  category?: string | null;
  streamUrl?: string | null;
  lastWatchedAt?: string;
}

export async function fetchRecentChannelsFromDb(): Promise<ServerRecentChannelItem[]> {
  const token = getClientAccessToken();
  if (!token) return [];

  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/user/recent-channels?limit=20`, {
      method: "GET",
      headers: getRequestHeaders(),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function saveRecentChannelToDb(channel: {
  id: string;
  name?: string;
  logoUrl?: string;
  country?: string;
  category?: string;
  streamUrl?: string;
}): Promise<void> {
  const token = getClientAccessToken();
  if (!token) return;

  try {
    await authenticatedFetch(`${API_BASE_URL}/user/recent-channels`, {
      method: "POST",
      headers: getRequestHeaders(),
      body: JSON.stringify({
        channelId: channel.id,
        channelName: channel.name,
        channelLogo: channel.logoUrl,
        channelCountry: channel.country,
        category: channel.category,
        streamUrl: channel.streamUrl,
      }),
    });
  } catch {}
}

export async function removeRecentChannelFromDb(channelId: string): Promise<void> {
  const token = getClientAccessToken();
  if (!token) return;

  try {
    await authenticatedFetch(`${API_BASE_URL}/user/recent-channels/${encodeURIComponent(channelId)}`, {
      method: "DELETE",
      headers: getRequestHeaders(),
    });
  } catch {}
}

export async function clearRecentChannelsFromDb(): Promise<void> {
  const token = getClientAccessToken();
  if (!token) return;

  try {
    await authenticatedFetch(`${API_BASE_URL}/user/recent-channels`, {
      method: "DELETE",
      headers: getRequestHeaders(),
    });
  } catch {}
}

/* ========================================================
   🎵 RECENT MUSIC (MUSIC CONTINUE LISTENING DB)
   ======================================================== */

export interface ServerRecentMusicItem {
  id?: number;
  userId?: string;
  trackId: string;
  videoId?: string | null;
  title: string;
  artist?: string | null;
  album?: string | null;
  coverUrl?: string | null;
  duration?: number;
  durationFormatted?: string | null;
  genre?: string | null;
  lastListenedAt?: string;
}

export async function fetchRecentMusicFromDb(): Promise<ServerRecentMusicItem[]> {
  const token = getClientAccessToken();
  if (!token) return [];

  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/user/recent-music?limit=30`, {
      method: "GET",
      headers: getRequestHeaders(),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function saveRecentMusicToDb(track: {
  id: string;
  videoId?: string;
  title: string;
  artist?: string;
  album?: string;
  coverUrl?: string;
  duration?: number;
  durationFormatted?: string;
  genre?: string;
}): Promise<void> {
  const token = getClientAccessToken();
  if (!token) return;

  try {
    await authenticatedFetch(`${API_BASE_URL}/user/recent-music`, {
      method: "POST",
      headers: getRequestHeaders(),
      body: JSON.stringify({
        trackId: track.id,
        videoId: track.videoId,
        title: track.title,
        artist: track.artist,
        album: track.album,
        coverUrl: track.coverUrl,
        duration: track.duration,
        durationFormatted: track.durationFormatted,
        genre: track.genre,
      }),
    });
  } catch {}
}

export async function removeRecentMusicFromDb(trackId: string): Promise<void> {
  const token = getClientAccessToken();
  if (!token) return;

  try {
    await authenticatedFetch(`${API_BASE_URL}/user/recent-music/${encodeURIComponent(trackId)}`, {
      method: "DELETE",
      headers: getRequestHeaders(),
    });
  } catch {}
}

export async function clearRecentMusicFromDb(): Promise<void> {
  const token = getClientAccessToken();
  if (!token) return;

  try {
    await authenticatedFetch(`${API_BASE_URL}/user/recent-music`, {
      method: "DELETE",
      headers: getRequestHeaders(),
    });
  } catch {}
}

/* ========================================================
   📻 RECENT RADIO (RADIO CONTINUE LISTENING DB)
   ======================================================== */

export interface ServerRecentRadioItem {
  id?: number;
  userId?: string;
  stationUuid: string;
  name: string;
  urlResolved?: string | null;
  favicon?: string | null;
  country?: string | null;
  tags?: string | null;
  lastListenedAt?: string;
}

export async function fetchRecentRadioFromDb(): Promise<ServerRecentRadioItem[]> {
  const token = getClientAccessToken();
  if (!token) return [];

  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/user/recent-radio?limit=20`, {
      method: "GET",
      headers: getRequestHeaders(),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function saveRecentRadioToDb(station: {
  stationuuid: string;
  name: string;
  url_resolved?: string;
  favicon?: string;
  country?: string;
  tags?: string;
}): Promise<void> {
  const token = getClientAccessToken();
  if (!token) return;

  try {
    await authenticatedFetch(`${API_BASE_URL}/user/recent-radio`, {
      method: "POST",
      headers: getRequestHeaders(),
      body: JSON.stringify({
        stationUuid: station.stationuuid,
        name: station.name,
        urlResolved: station.url_resolved,
        favicon: station.favicon,
        country: station.country,
        tags: station.tags,
      }),
    });
  } catch {}
}

export async function removeRecentRadioFromDb(stationUuid: string): Promise<void> {
  const token = getClientAccessToken();
  if (!token) return;

  try {
    await authenticatedFetch(`${API_BASE_URL}/user/recent-radio/${encodeURIComponent(stationUuid)}`, {
      method: "DELETE",
      headers: getRequestHeaders(),
    });
  } catch {}
}

export async function clearRecentRadioFromDb(): Promise<void> {
  const token = getClientAccessToken();
  if (!token) return;

  try {
    await authenticatedFetch(`${API_BASE_URL}/user/recent-radio`, {
      method: "DELETE",
      headers: getRequestHeaders(),
    });
  } catch {}
}

/* ========================================================
   🗑️ DELETE ACCOUNT (PURGES ALL USER DATA ACROSS DB)
   ======================================================== */

export async function deleteUserAccount(): Promise<boolean> {
  const token = getClientAccessToken();
  if (!token) return false;

  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/user/account`, {
      method: "DELETE",
      headers: getRequestHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}
