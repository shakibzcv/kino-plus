import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from './api-config';
import { getServiceAuthToken, refreshTokensSilently } from './movies';
import { getSecureSession } from './secure-storage';

export interface WatchlistItem {
  id?: number;
  mediaId: string;
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
  addedAt?: string;
}

function getRequestHeaders(userId?: string, token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-user-id': userId || 'default_user',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function resolveAuthToken(explicitToken?: string | null): Promise<string | null> {
  if (explicitToken) return explicitToken;
  const inMemory = getServiceAuthToken();
  if (inMemory) return inMemory;
  try {
    const session = await getSecureSession();
    return session.accessToken || null;
  } catch {
    return null;
  }
}

async function authenticatedUserDataFetch(
  endpoint: string,
  options: RequestInit = {},
  userId?: string,
  explicitToken?: string | null,
  retryOnAuth = true
): Promise<Response | null> {
  const token = await resolveAuthToken(explicitToken);
  if (!token) return null;

  const url = `${getApiBaseUrl()}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getRequestHeaders(userId, token),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 && retryOnAuth) {
    console.warn(`[UserData Mobile] ${endpoint} returned 401. Refreshing token silently...`);
    const refreshedToken = await refreshTokensSilently();
    if (refreshedToken) {
      return authenticatedUserDataFetch(endpoint, options, userId, refreshedToken, false);
    }
  }

  return response;
}

/* ========================================================
   📌 WATCHLIST (POSTGRESQL / BACKEND API)
   ======================================================== */

export async function fetchWatchlist(userId?: string, token?: string | null): Promise<WatchlistItem[]> {
  try {
    const res = await authenticatedUserDataFetch('/user/watchlist', { method: 'GET' }, userId, token);
    if (!res || !res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('[UserData Mobile] fetchWatchlist error:', err);
    return [];
  }
}

export async function addToWatchlist(
  item: WatchlistItem,
  userId?: string,
  token?: string | null
): Promise<boolean> {
  try {
    const res = await authenticatedUserDataFetch(
      '/user/watchlist',
      {
        method: 'POST',
        body: JSON.stringify(item),
      },
      userId,
      token
    );
    return Boolean(res && res.ok);
  } catch (err) {
    console.error('[UserData Mobile] addToWatchlist error:', err);
    return false;
  }
}

export async function removeFromWatchlist(
  mediaType: string,
  mediaId: string,
  userId?: string,
  token?: string | null
): Promise<boolean> {
  try {
    const res = await authenticatedUserDataFetch(
      `/user/watchlist/${encodeURIComponent(mediaType)}/${encodeURIComponent(mediaId)}`,
      { method: 'DELETE' },
      userId,
      token
    );
    return Boolean(res && res.ok);
  } catch (err) {
    console.error('[UserData Mobile] removeFromWatchlist error:', err);
    return false;
  }
}

/* ========================================================
   📺 FAVORITE CHANNELS (POSTGRESQL / BACKEND API)
   ======================================================== */

export interface FavoriteChannelItem {
  id?: number;
  channelId: string;
  channelName?: string | null;
  channelLogo?: string | null;
  channelCountry?: string | null;
  addedAt?: string;
}

export async function fetchFavoriteChannels(
  userId?: string,
  token?: string | null
): Promise<string[]> {
  try {
    const res = await authenticatedUserDataFetch(
      '/user/favorites',
      { method: 'GET' },
      userId,
      token
    );
    if (!res || !res.ok) return [];
    const json = await res.json();
    const data: FavoriteChannelItem[] = json.data || [];
    return data.map((d) => d.channelId);
  } catch (err) {
    console.warn('[UserData Mobile] fetchFavoriteChannels error:', err);
    return [];
  }
}

export async function addFavoriteChannel(
  channel: {
    channelId: string;
    channelName?: string;
    channelLogo?: string;
    channelCountry?: string;
  },
  userId?: string,
  token?: string | null
): Promise<boolean> {
  try {
    const res = await authenticatedUserDataFetch(
      '/user/favorites',
      {
        method: 'POST',
        body: JSON.stringify(channel),
      },
      userId,
      token
    );
    return Boolean(res && res.ok);
  } catch (err) {
    console.error('[UserData Mobile] addFavoriteChannel error:', err);
    return false;
  }
}

export async function removeFavoriteChannel(
  channelId: string,
  userId?: string,
  token?: string | null
): Promise<boolean> {
  try {
    const res = await authenticatedUserDataFetch(
      `/user/favorites/${encodeURIComponent(channelId)}`,
      { method: 'DELETE' },
      userId,
      token
    );
    return Boolean(res && res.ok);
  } catch (err) {
    console.error('[UserData Mobile] removeFavoriteChannel error:', err);
    return false;
  }
}

/* ========================================================
   🗑️ DELETE ACCOUNT (POSTGRESQL / BACKEND API)
   ======================================================== */

export async function deleteAccount(
  userId?: string,
  token?: string | null
): Promise<boolean> {
  try {
    const res = await authenticatedUserDataFetch(
      '/user/account',
      { method: 'DELETE' },
      userId,
      token
    );
    return Boolean(res && res.ok);
  } catch (err) {
    console.error('[UserData Mobile] deleteAccount error:', err);
    return false;
  }
}

/* ========================================================
   🔍 SEARCH HISTORY (LOCAL SECURESTORE + BACKEND API)
   ======================================================== */

const LOCAL_SEARCH_HISTORY_KEY = 'kino_search_history';

export interface SearchHistoryItem {
  id?: number;
  query: string;
  searchedAt?: string;
}

export async function getLocalSearchHistory(): Promise<string[]> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(LOCAL_SEARCH_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
      }
      return [];
    }
    const raw = await SecureStore.getItemAsync(LOCAL_SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveLocalSearchHistory(queries: string[]): Promise<void> {
  try {
    const serialized = JSON.stringify(queries.slice(0, 20));
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LOCAL_SEARCH_HISTORY_KEY, serialized);
      }
      return;
    }
    await SecureStore.setItemAsync(LOCAL_SEARCH_HISTORY_KEY, serialized);
  } catch {}
}

export async function fetchSearchHistory(
  userId?: string,
  token?: string | null
): Promise<string[]> {
  const localList = await getLocalSearchHistory();
  try {
    const res = await authenticatedUserDataFetch(
      '/user/search-history?limit=10',
      { method: 'GET' },
      userId,
      token
    );
    if (!res || !res.ok) return localList;
    const json = await res.json();
    const serverItems: SearchHistoryItem[] = json.data || [];
    const serverQueries = serverItems.map((item) => item.query);

    const combined = Array.from(new Set([...serverQueries, ...localList]));
    await saveLocalSearchHistory(combined);
    return combined;
  } catch (err) {
    return localList;
  }
}

export async function saveSearchHistory(
  query: string,
  userId?: string,
  token?: string | null
): Promise<string[]> {
  const clean = query.trim();
  if (!clean) return await getLocalSearchHistory();

  const local = await getLocalSearchHistory();
  const updated = [clean, ...local.filter((q) => q.toLowerCase() !== clean.toLowerCase())].slice(0, 20);
  await saveLocalSearchHistory(updated);

  try {
    await authenticatedUserDataFetch(
      '/user/search-history',
      {
        method: 'POST',
        body: JSON.stringify({ query: clean }),
      },
      userId,
      token
    );
  } catch {}

  return updated;
}

export async function removeSearchHistory(
  query: string,
  userId?: string,
  token?: string | null
): Promise<string[]> {
  const clean = query.trim();
  const local = await getLocalSearchHistory();
  const updated = local.filter((q) => q.toLowerCase() !== clean.toLowerCase());
  await saveLocalSearchHistory(updated);

  try {
    await authenticatedUserDataFetch(
      `/user/search-history/${encodeURIComponent(clean)}`,
      { method: 'DELETE' },
      userId,
      token
    );
  } catch {}

  return updated;
}

export async function clearSearchHistory(
  userId?: string,
  token?: string | null
): Promise<void> {
  await saveLocalSearchHistory([]);

  try {
    await authenticatedUserDataFetch(
      '/user/search-history',
      { method: 'DELETE' },
      userId,
      token
    );
  } catch {}
}
