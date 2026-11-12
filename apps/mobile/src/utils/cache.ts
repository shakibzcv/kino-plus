// Simple in-memory cache with TTL (time-to-live) support
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getEstimatedSizeBytes(): number {
    let bytes = 0;
    try {
      for (const [key, entry] of this.cache.entries()) {
        bytes += key.length * 2;
        if (entry.data) {
          bytes += JSON.stringify(entry.data).length * 2;
        }
      }
    } catch {
      bytes += this.cache.size * 512;
    }
    return bytes;
  }

  size(): number {
    return this.cache.size;
  }

  // Clear expired entries
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Cache invalidation for user-specific data
  invalidateUserSpecific(): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes('user') || key.includes('favorites') || key.includes('continue-watching')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Export singleton instance
export const cache = new Cache();

// Cache keys helpers
export const CacheKeys = {
  CATEGORIES: 'categories',
  MOST_WATCHLISTED: 'most-watchlisted',
  RECOMMENDED: 'recommended',
  TRENDING_TRAILERS: 'trending-trailers',
  HORROR_MOVIES: 'horror-movies',
  LEAVING_SOON: 'leaving-soon',
  ANIME_SHOWS: 'anime-shows',
  BINGE_SHOWS: 'binge-shows',
  ACTION_MOVIES: 'action-movies',
  NEW_TRAILERS: 'new-trailers',
  REALITY_SHOWS: 'reality-shows',
  SCIFI_MOVIES: 'scifi-movies',
  DRAMAS: 'award-winning-dramas',
  LIVE_CHANNELS: 'live-channels',
  CATEGORY_MEDIA: (category: string) => `category-${category}`,
  SEARCH_RESULTS: (query: string) => `search-${query}`,
  MEDIA_DETAILS: (id: string | number) => `details-${id}`,
  RADIO_STATIONS: 'radio-stations',
  RADIO_TAGS: 'radio-tags',
  RADIO_COUNTRIES: 'radio-countries',
};

// TTL configurations (in milliseconds)
export const CacheTTL = {
  SHORT: 3 * 60 * 1000,        // 3 minutes
  MEDIUM: 10 * 60 * 1000,      // 10 minutes
  LONG: 30 * 60 * 1000,        // 30 minutes
  VERY_LONG: 60 * 60 * 1000,   // 60 minutes
};
