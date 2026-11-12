import {
  SeriesRatingsGraphData,
  MediaItem,
  WatchlistItem,
  SessionItem,
  MediaDetails,
  FormattedEpisode,
  TrailerItem,
  WatchProvidersResponse,
} from "../types";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export function getDesktopAuthToken(): string | null {
  return localStorage.getItem("kino_desktop_token");
}

export function getDesktopRefreshToken(): string | null {
  return localStorage.getItem("kino_desktop_refresh_token");
}

let desktopRefreshPromise: Promise<string | null> | null = null;

export async function refreshDesktopTokens(): Promise<string | null> {
  if (desktopRefreshPromise) return desktopRefreshPromise;

  desktopRefreshPromise = (async () => {
    try {
      const refreshToken = getDesktopRefreshToken();
      if (!refreshToken) {
        localStorage.removeItem("kino_desktop_token");
        localStorage.removeItem("kino_desktop_refresh_token");
        localStorage.removeItem("kino_desktop_user");
        window.dispatchEvent(new CustomEvent("kino:desktop-unauthorized"));
        return null;
      }

      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        localStorage.removeItem("kino_desktop_token");
        localStorage.removeItem("kino_desktop_refresh_token");
        localStorage.removeItem("kino_desktop_user");
        window.dispatchEvent(new CustomEvent("kino:desktop-unauthorized"));
        return null;
      }

      const json = await res.json();
      const newToken = json?.data?.accessToken || json?.data?.token;
      const newRefreshToken = json?.data?.refreshToken || refreshToken;

      if (newToken) {
        localStorage.setItem("kino_desktop_token", newToken);
        if (newRefreshToken) {
          localStorage.setItem("kino_desktop_refresh_token", newRefreshToken);
        }
        return newToken;
      }

      return null;
    } catch {
      return null;
    } finally {
      desktopRefreshPromise = null;
    }
  })();

  return desktopRefreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOnAuth = true,
): Promise<T> {
  const token = getDesktopAuthToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && retryOnAuth) {
    const refreshedToken = await refreshDesktopTokens();
    if (refreshedToken) {
      return request<T>(endpoint, options, false);
    }
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

// ==========================================
// User Data APIs (Watchlist)
// ==========================================

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  try {
    return await request<WatchlistItem[]>("/user/watchlist");
  } catch {
    return [];
  }
}

export async function toggleWatchlist(item: {
  mediaId: string;
  mediaType: "movie" | "tv";
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  logo?: string | null;
  rating?: number | null;
}): Promise<boolean> {
  try {
    const watchlist = await fetchWatchlist();
    const exists = watchlist.some((w) => String(w.mediaId) === String(item.mediaId));

    if (exists) {
      await request(`/user/watchlist/${item.mediaType}/${item.mediaId}`, { method: "DELETE" });
      return false;
    } else {
      await request("/user/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      return true;
    }
  } catch (err) {
    console.error("Failed to toggle watchlist:", err);
    return false;
  }
}

export async function fetchSearchHistory(): Promise<string[]> {
  try {
    const data = await request<any[]>("/user/search-history");
    return (data || []).map((row) => (typeof row === "string" ? row : row.query || ""));
  } catch {
    return [];
  }
}

export async function saveSearchHistory(query: string): Promise<void> {
  try {
    await request("/user/search-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
  } catch (err) {
    console.error("Failed to save search history:", err);
  }
}

export async function deleteUserAccount(): Promise<boolean> {
  try {
    await request("/user/account", { method: "DELETE" });
    return true;
  } catch (err) {
    console.error("Failed to delete user account:", err);
    return false;
  }
}

// ==========================================
// Sessions APIs
// ==========================================

export function parseUserAgent(ua?: string | null): {
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tv" | "browser";
} {
  const lower = (ua || "").toLowerCase();
  if (!lower) {
    return { deviceName: "Windows PC / Desktop App", deviceType: "desktop" };
  }
  if (
    lower.includes("android tv") ||
    lower.includes("smart-tv") ||
    lower.includes("bravia") ||
    lower.includes("firetv")
  ) {
    return { deviceName: "Android TV", deviceType: "tv" };
  }
  if (lower.includes("iphone") || lower.includes("ipad")) {
    return {
      deviceName: lower.includes("ipad") ? "iPad" : "iPhone",
      deviceType: "mobile",
    };
  }
  if (lower.includes("android")) {
    return { deviceName: "Android Device", deviceType: "mobile" };
  }
  if (lower.includes("macintosh") || lower.includes("mac os")) {
    return { deviceName: "Mac / Safari", deviceType: "desktop" };
  }
  if (lower.includes("windows")) {
    return { deviceName: "Windows PC", deviceType: "desktop" };
  }
  return { deviceName: "Web Browser", deviceType: "browser" };
}

export async function fetchUserSessions(
  page: number = 1,
  limit: number = 3,
): Promise<{
  sessions: SessionItem[];
  total: number;
}> {
  try {
    const res = await request<any>(`/auth/sessions?page=${page}&limit=${limit}`);

    const apiData = res?.data || res;
    if (apiData && (apiData.sessions?.length > 0 || apiData.current)) {
      const list: SessionItem[] = [];

      if (apiData.current && page === 1) {
        const { deviceName, deviceType } = parseUserAgent(apiData.current.userAgent);
        list.push({
          id: apiData.current.id,
          isCurrent: true,
          deviceName: `${deviceName} (This Device)`,
          deviceType,
          ipAddress: apiData.current.ipAddress || "Localhost",
          location: "Current active session",
          lastActiveAt: "Active now",
          createdAt: new Date(apiData.current.createdAt || Date.now()).toLocaleDateString(),
        });
      }

      for (const s of apiData.sessions || []) {
        const { deviceName, deviceType } = parseUserAgent(s.userAgent);
        list.push({
          id: s.id,
          isCurrent: false,
          deviceName,
          deviceType,
          ipAddress: s.ipAddress || "Unknown IP",
          location: "Authorized Device",
          lastActiveAt: s.lastActiveAt
            ? new Date(s.lastActiveAt).toLocaleString()
            : "Recently active",
          createdAt: s.createdAt
            ? new Date(s.createdAt).toLocaleDateString()
            : "",
        });
      }

      return {
        sessions: list,
        total: (apiData.total || 0) + (apiData.current ? 1 : 0),
      };
    }
  } catch (err) {
    console.warn("fetchUserSessions fallback:", err);
  }

  return {
    sessions: [
      {
        id: "curr-session-1",
        isCurrent: true,
        deviceName: "Windows PC (This Device)",
        deviceType: "desktop",
        ipAddress: "127.0.0.1",
        location: "Current active session",
        lastActiveAt: "Active now",
        createdAt: new Date().toLocaleDateString(),
      },
    ],
    total: 1,
  };
}

export async function revokeSession(id: string): Promise<boolean> {
  try {
    await request(`/auth/sessions/${id}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

export async function revokeOtherSessions(): Promise<boolean> {
  try {
    await request("/auth/sessions/revoke-others", { method: "POST" });
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// Movies, TV Shows & Anime Catalog APIs
// ==========================================

export async function fetchTrendingMovies(): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>("/movies/trending");
  } catch {
    return [];
  }
}

export async function fetchPopularMovies(page: number = 1): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>(`/movies/popular?page=${page}`);
  } catch {
    return [];
  }
}

export async function fetchTopRatedMovies(page: number = 1): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>(`/movies/top-rated?page=${page}`);
  } catch {
    return [];
  }
}

export async function fetchRecommendedMovies(): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>("/movies/recommended");
  } catch {
    return [];
  }
}

export async function fetchBingeShows(): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>("/movies/binge");
  } catch {
    return [];
  }
}

export async function fetchPopularTvShows(page: number = 1): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>(`/movies/tv/popular?page=${page}`);
  } catch {
    return [];
  }
}

export async function fetchAiringTodayTvShows(page: number = 1): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>(`/movies/tv/airing-today?page=${page}`);
  } catch {
    return [];
  }
}

export async function fetchTopRatedTvShows(page: number = 1): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>(`/movies/tv/top-rated?page=${page}`);
  } catch {
    return [];
  }
}

export async function fetchActionMovies(): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>("/movies/action");
  } catch {
    return [];
  }
}

export async function fetchSciFiMovies(): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>("/movies/scifi");
  } catch {
    return [];
  }
}

export async function fetchHorrorMovies(): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>("/movies/horror");
  } catch {
    return [];
  }
}

// Anime APIs
export async function fetchAnimeShows(page: number = 1): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>(`/movies/anime?page=${page}`);
  } catch {
    return [];
  }
}

export async function fetchAnimeAction(page: number = 1): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>(`/movies/anime/action?page=${page}`);
  } catch {
    return [];
  }
}

export async function fetchAnimeMovies(page: number = 1): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>(`/movies/anime/movies?page=${page}`);
  } catch {
    return [];
  }
}

export async function fetchAnimeTopRated(page: number = 1): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>(`/movies/anime/top-rated?page=${page}`);
  } catch {
    return [];
  }
}

export async function fetchAnimeFantasy(page: number = 1): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>(`/movies/anime/fantasy?page=${page}`);
  } catch {
    return [];
  }
}

export async function fetchAnimeComedy(page: number = 1): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>(`/movies/anime/comedy?page=${page}`);
  } catch {
    return [];
  }
}

export async function fetchCategories(): Promise<{ name: string; id: number }[]> {
  try {
    return await request<{ name: string; id: number }[]>("/movies/categories");
  } catch {
    return [
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
      { id: 16, name: "Animation" },
      { id: 35, name: "Comedy" },
      { id: 80, name: "Crime" },
      { id: 99, name: "Documentary" },
      { id: 18, name: "Drama" },
      { id: 10751, name: "Family" },
      { id: 14, name: "Fantasy" },
      { id: 27, name: "Horror" },
      { id: 878, name: "Sci-Fi" },
      { id: 53, name: "Thriller" },
    ];
  }
}

export async function fetchMediaByCategory(
  category: string,
  mediaType: "all" | "movie" | "tv" = "all",
  page: number = 1,
): Promise<MediaItem[]> {
  try {
    const data = await request<any>(
      `/movies/category/${encodeURIComponent(category)}?mediaType=${mediaType}&page=${page}`,
    );
    return data?.items || (Array.isArray(data) ? data : []);
  } catch {
    return [];
  }
}

export async function fetchMoviesByCategory(
  category: string,
  page: number = 1,
): Promise<MediaItem[]> {
  const items = await fetchMediaByCategory(category, "movie", page);
  return items.map((item) => ({ ...item, mediaType: "movie" as const }));
}

export async function fetchTvByCategory(
  category: string,
  page: number = 1,
): Promise<MediaItem[]> {
  const items = await fetchMediaByCategory(category, "tv", page);
  return items.map((item) => ({ ...item, mediaType: "tv" as const }));
}

export async function fetchMostWatchlisted(): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>("/movies/watchlisted");
  } catch {
    return [];
  }
}

export async function fetchRealityShows(): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>("/movies/reality");
  } catch {
    return [];
  }
}

export async function fetchAwardWinningDramas(): Promise<MediaItem[]> {
  try {
    return await request<MediaItem[]>("/movies/dramas");
  } catch {
    return [];
  }
}

export async function fetchTrendingTrailers(): Promise<TrailerItem[]> {
  try {
    return await request<TrailerItem[]>("/movies/trailers/trending");
  } catch {
    return [];
  }
}

export async function fetchNewTrailers(): Promise<TrailerItem[]> {
  try {
    return await request<TrailerItem[]>("/movies/trailers/new");
  } catch {
    return [];
  }
}

export async function fetchLeavingSoonMovies(): Promise<TrailerItem[]> {
  try {
    return await request<TrailerItem[]>("/movies/leaving-soon");
  } catch {
    return [];
  }
}

export async function fetchMediaDetails(
  id: string | number,
  type: "movie" | "tv" = "movie",
): Promise<MediaDetails | null> {
  try {
    return await request<MediaDetails>(`/movies/details/${id}?type=${type}`);
  } catch (err) {
    console.error("Failed to fetch media details:", err);
    return null;
  }
}

export async function fetchTvSeasonEpisodes(
  id: string | number,
  season: number = 1,
): Promise<FormattedEpisode[]> {
  try {
    return await request<FormattedEpisode[]>(`/movies/tv/${id}/season/${season}`);
  } catch (err) {
    console.error("Failed to fetch season episodes:", err);
    return [];
  }
}

export async function fetchMediaLogo(
  id: string | number,
  type: "movie" | "tv" = "movie",
): Promise<string | null> {
  try {
    const res = await request<{ logo: string | null }>(
      `/movies/${id}/logo?type=${type}`,
    );
    return res?.logo || null;
  } catch {
    return null;
  }
}

export async function fetchTvSeriesRatings(
  tvId: string | number
): Promise<SeriesRatingsGraphData | null> {
  try {
    return await request<SeriesRatingsGraphData>(`/movies/tv/${tvId}/ratings`);
  } catch (err) {
    console.error(`[API] Error fetching series ratings for ${tvId}:`, err);
    return null;
  }
}

export async function fetchWatchProviders(
  id: string | number,
  mediaType: "movie" | "tv",
): Promise<WatchProvidersResponse | null> {
  try {
    return await request<WatchProvidersResponse | null>(
      `/movies/${id}/watch-providers?type=${mediaType}`,
    );
  } catch (err) {
    console.error(`[API] Error fetching watch providers for ${id}:`, err);
    return null;
  }
}
