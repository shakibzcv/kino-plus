/**
 * Tiny in-memory TTL cache for auth lookups.
 *
 * The auth middleware runs two DB queries per request; a single home-screen load issues ~14
 * requests. Caching a successful verification for a short window removes almost all of those
 * queries.
 *
 * Invalidation is scoped:
 *  - clearAuthCache(userId, token)  — evicts only the entries for that user/token (logout, rotation)
 *  - clearAuthCache()               — full wipe (admin / emergency use only)
 */
const AUTH_CACHE_TTL_MS = 30_000;
const AUTH_CACHE_MAX_ENTRIES = 2000;

const cache = new Map<string, { value: unknown; expiresAt: number }>();

export function getAuthCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setAuthCache(key: string, value: unknown): void {
  if (cache.size >= AUTH_CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
}

/**
 * Scoped invalidation — preferred over full wipe.
 * Pass the userId and/or accessToken that were just rotated/revoked.
 * Falls back to full wipe when called with no arguments.
 */
export function clearAuthCache(userId?: string, accessToken?: string): void {
  if (!userId && !accessToken) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (userId && key === `passport:${userId}`) { cache.delete(key); continue; }
    if (accessToken && key === `jwt:${accessToken}`) { cache.delete(key); continue; }
    if (userId && key.startsWith(`passport:${userId}`)) { cache.delete(key); continue; }
  }
}
