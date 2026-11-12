"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import {
  WatchlistItem,
  FavoriteChannelItem,
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  fetchFavoriteChannels,
  addFavoriteChannel,
  removeFavoriteChannel,
  fetchSearchHistory,
  saveSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
  getLocalSearchHistory,
} from "../lib/userData";

interface UserDataContextType {
  // Watchlist
  watchlist: WatchlistItem[];
  isWatchlistLoading: boolean;
  isInWatchlist: (mediaType: string, mediaId: string | number) => boolean;
  isEpisodeInWatchlist: (
    seriesId: string | number,
    season: number,
    episode: number,
  ) => boolean;
  toggleWatchlist: (item: {
    mediaId: string | number;
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
  }) => Promise<boolean>;
  refreshWatchlist: () => Promise<void>;

  // Channel Favorites
  favoriteChannels: string[];
  isChannelFavorite: (channelId: string) => boolean;
  toggleFavoriteChannel: (
    channel:
      | {
          channelId: string;
          channelName?: string;
          channelLogo?: string;
          channelCountry?: string;
        }
      | string,
  ) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;

  // Search History
  searchHistory: string[];
  addSearchHistory: (query: string) => Promise<void>;
  removeSearchHistory: (query: string) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  refreshSearchHistory: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(
  undefined,
);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [favoriteChannels, setFavoriteChannels] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Staleness guards — track when each dataset was last successfully fetched.
  // Prevents redundant network calls on every pathname change.
  const WATCHLIST_STALE_MS = 45_000;  // 45 s
  const FAV_STALE_MS       = 60_000;  // 60 s
  const lastFetchRef = useRef<{ wl: number; fav: number }>(
    { wl: 0, fav: 0 }
  );

  // Safely populate cached client data after mount to prevent SSR hydration mismatch
  useEffect(() => {
    try {
      const cachedWl = localStorage.getItem("kino_watchlist_cache");
      if (cachedWl) setWatchlist(JSON.parse(cachedWl));
    } catch {}
    try {
      const cachedFav = localStorage.getItem("kino_favorite_channels");
      if (cachedFav) setFavoriteChannels(JSON.parse(cachedFav));
    } catch {}
    try {
      setSearchHistory(getLocalSearchHistory());
    } catch {}
  }, []);

  const refreshSearchHistory = useCallback(async () => {
    try {
      const items = await fetchSearchHistory();
      setSearchHistory(items);
    } catch {
      setSearchHistory(getLocalSearchHistory());
    }
  }, []);

  // Refresh all user data from PostgreSQL database
  const refreshWatchlist = useCallback(async () => {
    setIsWatchlistLoading(true);
    try {
      const items = await fetchWatchlist();
      setWatchlist(items);
      lastFetchRef.current.wl = Date.now();
    } catch (err) {
      console.error("[UserDataContext] refreshWatchlist failed:", err);
    } finally {
      setIsWatchlistLoading(false);
    }
  }, []);

  const refreshFavorites = useCallback(async () => {
    try {
      const favs = await fetchFavoriteChannels();
      setFavoriteChannels(favs);
      lastFetchRef.current.fav = Date.now();
    } catch (err) {
      console.error("[UserDataContext] refreshFavorites failed:", err);
    }
  }, []);

  const pathname = usePathname();

  // Route-aware synchronization: only fetch the user data actually needed for the active page
  useEffect(() => {
    if (isAuthLoading) return; // auth still resolving — wait

    if (!user) {
      // User signed out or never signed in — clear all state so stale data
      // from a previous session doesn't linger
      setWatchlist([]);
      setFavoriteChannels([]);
      // Reset staleness so next login re-fetches immediately
      lastFetchRef.current = { wl: 0, fav: 0 };
      return;
    }

    if (!pathname) return;

    const now = Date.now();
    const wlFresh  = now - lastFetchRef.current.wl  < WATCHLIST_STALE_MS;
    const favFresh = now - lastFetchRef.current.fav < FAV_STALE_MS;

    // 1. Live TV page: only favorites needed
    if (pathname === "/live-tv" || pathname.startsWith("/live-tv/")) {
      if (!favFresh) refreshFavorites();
      return;
    }

    // 2. Watchlist page: only watchlist needed
    if (pathname === "/watchlist") {
      if (!wlFresh) refreshWatchlist();
      return;
    }

    // 3. Home dashboard: watchlist
    if (pathname === "/" || pathname === "/dashboard") {
      if (!wlFresh) refreshWatchlist();
      return;
    }

    // 4. Movie / TV / Watch / Categories / Search: watchlist for bookmarking
    if (
      pathname.startsWith("/movie") ||
      pathname.startsWith("/tv") ||
      pathname.startsWith("/categories") ||
      pathname.startsWith("/category") ||
      pathname.startsWith("/search")
    ) {
      if (!wlFresh) refreshWatchlist();
      return;
    }
    // All other pages (account, settings, etc.) — no background fetches needed
  }, [
    isAuthLoading,
    user?.id,
    pathname,
    refreshWatchlist,
    refreshFavorites,
  ]);

  /* ========================================================
     📌 WATCHLIST METHODS
     ======================================================== */

  // O(1) lookup Set keyed as "mediaType:mediaId" — avoids full array scan on every render
  const watchlistSet = useMemo(() => {
    const s = new Set<string>();
    for (const item of watchlist) {
      s.add(`${item.mediaType}:${String(item.mediaId)}`);
    }
    return s;
  }, [watchlist]);

  const isInWatchlist = useCallback(
    (mediaType: string, mediaId: string | number) => {
      return watchlistSet.has(`${mediaType}:${String(mediaId)}`);
    },
    [watchlistSet],
  );

  const isEpisodeInWatchlist = useCallback(
    (seriesId: string | number, season: number, episode: number) => {
      const sId = String(seriesId);
      const epKey = `${sId}_${season}_${episode}`;
      return watchlist.some(
        (w) =>
          w.mediaType === "episode" &&
          (String(w.mediaId) === epKey ||
            (String(w.seriesId || "").split("_")[0] === sId &&
              Number(w.seasonNumber) === Number(season) &&
              Number(w.episodeNumber) === Number(episode))),
      );
    },
    [watchlist],
  );

  const toggleWatchlist = useCallback(
    async (item: {
      mediaId: string | number;
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
    }): Promise<boolean> => {
      const isEp = item.mediaType === "episode";
      const idStr = isEp
        ? String(item.mediaId).includes("_")
          ? String(item.mediaId)
          : `${item.seriesId || item.mediaId}_${item.seasonNumber || 1}_${item.episodeNumber || 1}`
        : String(item.mediaId);

      const exists = watchlist.some((w) => {
        if (isEp) {
          return (
            w.mediaType === "episode" &&
            (String(w.mediaId) === idStr ||
              (item.seriesId &&
                String(w.seriesId) === String(item.seriesId) &&
                Number(w.seasonNumber) === Number(item.seasonNumber) &&
                Number(w.episodeNumber) === Number(item.episodeNumber)))
          );
        }
        return String(w.mediaId) === idStr && w.mediaType === item.mediaType;
      });

      if (exists) {
        // Optimistic removal
        setWatchlist((prev) =>
          prev.filter((w) => {
            if (isEp) {
              return !(
                w.mediaType === "episode" &&
                (String(w.mediaId) === idStr ||
                  (item.seriesId &&
                    String(w.seriesId) === String(item.seriesId) &&
                    Number(w.seasonNumber) === Number(item.seasonNumber) &&
                    Number(w.episodeNumber) === Number(item.episodeNumber)))
              );
            }
            return !(
              String(w.mediaId) === idStr && w.mediaType === item.mediaType
            );
          }),
        );
        await removeFromWatchlist(item.mediaType, idStr);
        return false;
      } else {
        // Optimistic addition
        const newItem: WatchlistItem = {
          mediaId: idStr,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          logoPath: item.logoPath || item.logo || null,
          logo: item.logoPath || item.logo || null,
          overview: item.overview,
          rating: item.rating,
          voteAverage: item.voteAverage,
          category: item.category || (Array.isArray(item.genres) ? item.genres.join(", ") : null),
          genres: item.genres || (item.category ? item.category.split(",").map((s: string) => s.trim()).filter(Boolean) : []),
          seasonNumber: item.seasonNumber,
          episodeNumber: item.episodeNumber,
          episodeTitle: item.episodeTitle,
          seriesId: item.seriesId,
          addedAt: new Date().toISOString(),
        };
        setWatchlist((prev) => [newItem, ...prev]);
        await addToWatchlist(newItem);
        return true;
      }
    },
    [watchlist],
  );

  /* ========================================================
     📺 FAVORITE CHANNELS METHODS
     ======================================================== */

  const isChannelFavorite = useCallback(
    (channelId: string) => {
      return favoriteChannels.includes(channelId);
    },
    [favoriteChannels],
  );

  const toggleFavoriteChannel = useCallback(
    async (
      channel:
        | {
            channelId: string;
            channelName?: string;
            channelLogo?: string;
            channelCountry?: string;
          }
        | string,
    ): Promise<boolean> => {
      const chId = typeof channel === "string" ? channel : channel.channelId;
      const isFav = favoriteChannels.includes(chId);

      if (isFav) {
        // Optimistic remove
        setFavoriteChannels((prev) => prev.filter((id) => id !== chId));
        await removeFavoriteChannel(chId);
        return false;
      } else {
        // Optimistic add
        setFavoriteChannels((prev) => [...prev, chId]);
        if (typeof channel === "string") {
          await addFavoriteChannel({ channelId: chId });
        } else {
          await addFavoriteChannel(channel);
        }
        return true;
      }
    },
    [favoriteChannels],
  );

  /* ========================================================
     🔍 SEARCH HISTORY METHODS
     ======================================================== */

  const addSearchHistoryItem = useCallback(async (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    setSearchHistory((prev) => [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 20));
    await saveSearchHistory(clean);
  }, []);

  const removeSearchHistoryItem = useCallback(async (q: string) => {
    const clean = q.trim();
    setSearchHistory((prev) => prev.filter((item) => item.toLowerCase() !== clean.toLowerCase()));
    await removeSearchHistory(clean);
  }, []);

  const clearAllSearchHistory = useCallback(async () => {
    setSearchHistory([]);
    await clearSearchHistory();
  }, []);

  return (
    <UserDataContext.Provider
      value={{
        watchlist,
        isWatchlistLoading,
        isInWatchlist,
        isEpisodeInWatchlist,
        toggleWatchlist,
        refreshWatchlist,
        favoriteChannels,
        isChannelFavorite,
        toggleFavoriteChannel,
        refreshFavorites,
        searchHistory,
        addSearchHistory: addSearchHistoryItem,
        removeSearchHistory: removeSearchHistoryItem,
        clearSearchHistory: clearAllSearchHistory,
        refreshSearchHistory,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export function useUserData(): UserDataContextType {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
}
