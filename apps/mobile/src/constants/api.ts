import Constants from 'expo-constants';

/**
 * Resolves the API Base URL dynamically.
 * Prioritizes:
 * 1. EXPO_PUBLIC_API_URL environment variable
 * 2. Host IP extracted dynamically from Expo Metro development server (e.g. Constants.expoConfig?.hostUri)
 * 3. Default fallback http://192.168.0.100:5000
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
      (Constants as any).manifest?.debuggerHost;

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5000`;
      }
    }
  } catch { }

  return 'http://192.168.0.100:5000';
}

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  movies: {
    trending: '/movies/trending',
    watchlisted: '/movies/watchlisted',
    recommended: '/movies/recommended',
    binge: '/movies/binge',
    trendingTrailers: '/movies/trailers/trending',
    newTrailers: '/movies/trailers/new',
    horror: '/movies/horror',
    leavingSoon: '/movies/leaving-soon',
    anime: '/movies/anime',
    action: '/movies/action',
    scifi: '/movies/scifi',
    reality: '/movies/reality',
    dramas: '/movies/dramas',
    categories: '/movies/categories',
    category: (cat: string) => `/movies/category/${encodeURIComponent(cat)}`,
    details: (id: string | number) => `/movies/details/${id}`,
  },
  user: {
    watchlist: '/user/watchlist',
    continueWatching: '/user/continue-watching',
    favorites: '/user/favorites',
  },
  auth: {
    mobileGoogleAuth: '/api/auth/mobile/google',
    logout: '/api/auth/logout',
  },
  config: {
    base: '/config',
    paths: '/config/paths',
  },
} as const;
