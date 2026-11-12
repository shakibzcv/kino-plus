import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './auth-context';
import {
  WatchlistItem,
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
} from '@/services/user-data';
import { invalidateUserCache } from '@/services/movies';

interface UserDataContextType {
  // Watchlist
  watchlist: WatchlistItem[];
  isWatchlistLoading: boolean;
  isInWatchlist: (mediaType: string, mediaId: string | number) => boolean;
  toggleWatchlist: (item: {
    mediaId: string | number;
    mediaType: 'movie' | 'tv';
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
  }) => Promise<boolean>;
  removeFromWatchlist: (mediaType: string, mediaId: string | number) => Promise<void>;
  refreshWatchlist: () => Promise<void>;

  // Channel Favorites
  favoriteChannels: string[];
  isChannelFavorite: (channelId: string) => boolean;
  toggleFavoriteChannel: (channel: {
    channelId: string;
    channelName?: string;
    channelLogo?: string;
    channelCountry?: string;
  } | string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;

  // Search History
  searchHistory: string[];
  addSearchHistory: (query: string) => Promise<void>;
  removeSearchHistory: (query: string) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  refreshSearchHistory: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authToken, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id || user?.email || undefined;

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);

  const [favoriteChannels, setFavoriteChannels] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const lastFetchedUserKeyRef = useRef<string | null>(null);

  // Initial load of local search history on mount
  useEffect(() => {
    getLocalSearchHistory().then((local) => {
      if (local && local.length > 0) setSearchHistory(local);
    });
  }, []);

  const refreshSearchHistory = useCallback(async () => {
    try {
      const items = await fetchSearchHistory(userId, authToken);
      setSearchHistory(items);
    } catch {
      const local = await getLocalSearchHistory();
      setSearchHistory(local);
    }
  }, [userId, authToken]);

  const refreshWatchlist = useCallback(async () => {
    if (!userId || !authToken) return;
    setIsWatchlistLoading(true);
    try {
      const items = await fetchWatchlist(userId, authToken);
      setWatchlist(items);
    } catch (err) {
      console.warn('[UserDataContext] refreshWatchlist failed:', err);
    } finally {
      setIsWatchlistLoading(false);
    }
  }, [userId, authToken]);

  const refreshFavorites = useCallback(async () => {
    if (!userId || !authToken) return;
    try {
      const favs = await fetchFavoriteChannels(userId, authToken);
      setFavoriteChannels(favs);
    } catch (err) {
      console.warn('[UserDataContext] refreshFavorites failed:', err);
    }
  }, [userId, authToken]);

  // Synchronize user data when auth has resolved
  useEffect(() => {
    if (isAuthLoading) return;

    if (!userId || !authToken) {
      lastFetchedUserKeyRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWatchlist((prev) => (prev.length === 0 ? prev : []));
      setFavoriteChannels((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    // Prevent duplicate fetch stampede if user and token are unchanged
    const sessionKey = `${userId}_${authToken}`;
    if (lastFetchedUserKeyRef.current === sessionKey) return;
    lastFetchedUserKeyRef.current = sessionKey;

    refreshWatchlist();
    refreshFavorites();
    refreshSearchHistory();
  }, [isAuthLoading, userId, authToken, refreshWatchlist, refreshFavorites, refreshSearchHistory]);

  /* ========================================================
     📌 WATCHLIST METHODS
     ======================================================== */

  // O(1) lookup Set keyed as 'mediaType:mediaId' — avoids full array scan on every render
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
    [watchlistSet]
  );

  const toggleWatchlist = useCallback(
    async (item: {
      mediaId: string | number;
      mediaType: 'movie' | 'tv';
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
    }): Promise<boolean> => {
      const idStr = String(item.mediaId);
      const exists = watchlistSet.has(`${item.mediaType}:${idStr}`);

      if (exists) {
        setWatchlist((prev) =>
          prev.filter((w) => !(String(w.mediaId) === idStr && w.mediaType === item.mediaType))
        );
        await removeFromWatchlist(item.mediaType, idStr, userId, authToken);
        // Invalidate cache since watchlist changed
        invalidateUserCache();
        return false;
      } else {
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
          category: item.category || (Array.isArray(item.genres) ? item.genres.join(', ') : null),
          genres: item.genres || (item.category ? item.category.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
          addedAt: new Date().toISOString(),
        };
        setWatchlist((prev) => [newItem, ...prev]);
        await addToWatchlist(newItem, userId, authToken);
        // Invalidate cache since watchlist changed
        invalidateUserCache();
        return true;
      }
    },
    [watchlistSet, userId, authToken]
  );

  const removeWatchlistItem = useCallback(
    async (mediaType: string, mediaId: string | number) => {
      const idStr = String(mediaId);
      setWatchlist((prev) =>
        prev.filter((w) => !(String(w.mediaId) === idStr && w.mediaType === mediaType))
      );
      await removeFromWatchlist(mediaType, idStr, userId, authToken);
    },
    [userId, authToken]
  );

  /* ========================================================
     📺 FAVORITE CHANNELS METHODS
     ======================================================== */

  const isChannelFavorite = useCallback(
    (channelId: string) => {
      return favoriteChannels.includes(channelId);
    },
    [favoriteChannels]
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
        | string
    ): Promise<boolean> => {
      const chId = typeof channel === 'string' ? channel : channel.channelId;
      const isFav = favoriteChannels.includes(chId);

      if (isFav) {
        setFavoriteChannels((prev) => prev.filter((id) => id !== chId));
        await removeFavoriteChannel(chId, userId, authToken);
        // Invalidate cache since favorites changed
        invalidateUserCache();
        return false;
      } else {
        setFavoriteChannels((prev) => [...prev, chId]);
        if (typeof channel === 'string') {
          await addFavoriteChannel({ channelId: chId }, userId, authToken);
        } else {
          await addFavoriteChannel(channel, userId, authToken);
        }
        // Invalidate cache since favorites changed
        invalidateUserCache();
        return true;
      }
    },
    [favoriteChannels, userId, authToken]
  );

  /* ========================================================
     🔍 SEARCH HISTORY METHODS
     ======================================================== */

  const addSearchHistory = useCallback(
    async (q: string) => {
      const clean = q.trim();
      if (!clean) return;
      setSearchHistory((prev) => [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 20));
      await saveSearchHistory(clean, userId, authToken);
    },
    [userId, authToken]
  );

  const removeSearchHistoryItem = useCallback(
    async (q: string) => {
      const clean = q.trim();
      setSearchHistory((prev) => prev.filter((item) => item.toLowerCase() !== clean.toLowerCase()));
      await removeSearchHistory(clean, userId, authToken);
    },
    [userId, authToken]
  );

  const clearAllSearchHistory = useCallback(async () => {
    setSearchHistory([]);
    await clearSearchHistory(userId, authToken);
  }, [userId, authToken]);

  const contextValue = useMemo<UserDataContextType>(
    () => ({
      watchlist,
      isWatchlistLoading,
      isInWatchlist,
      toggleWatchlist,
      removeFromWatchlist: removeWatchlistItem,
      refreshWatchlist,
      favoriteChannels,
      isChannelFavorite,
      toggleFavoriteChannel,
      refreshFavorites,
      searchHistory,
      addSearchHistory,
      removeSearchHistory: removeSearchHistoryItem,
      clearSearchHistory: clearAllSearchHistory,
      refreshSearchHistory,
    }),
    [
      watchlist,
      isWatchlistLoading,
      isInWatchlist,
      toggleWatchlist,
      removeWatchlistItem,
      refreshWatchlist,
      favoriteChannels,
      isChannelFavorite,
      toggleFavoriteChannel,
      refreshFavorites,
      searchHistory,
      addSearchHistory,
      removeSearchHistoryItem,
      clearAllSearchHistory,
      refreshSearchHistory,
    ]
  );

  return (
    <UserDataContext.Provider value={contextValue}>
      {children}
    </UserDataContext.Provider>
  );
};

export function useUserData(): UserDataContextType {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}
