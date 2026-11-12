/**
 * Kino+ Client-side Authentication Library
 * Manages client tokens (synchronizing across localStorage and document.cookie),
 * OAuth redirect handling, user session polling, and API authentication.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider: "google" | string;
  createdAt?: string;
  lastLoginAt?: string;
  accountsCount?: number;
  activeSessionsCount?: number;
}

export const AUTH_STORAGE_KEY = "kino_plus_auth_token";
export const REFRESH_STORAGE_KEY = "kino_plus_refresh_token";
export const USER_STORAGE_KEY = "kino_plus_user";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Cookie management helpers for browser environment
 */
export function setClientCookie(name: string, value: string, days = 7): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

export function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match && match[1] ? decodeURIComponent(match[1]) : null;
}

export function deleteClientCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

/**
 * Synchronize authentication tokens across localStorage and cookies
 */
export function setClientTokens(
  accessToken: string | null,
  refreshToken: string | null,
): void {
  if (typeof window === "undefined") return;

  if (accessToken) {
    localStorage.setItem(AUTH_STORAGE_KEY, accessToken);
    setClientCookie(AUTH_STORAGE_KEY, accessToken, 7);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    deleteClientCookie(AUTH_STORAGE_KEY);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
    setClientCookie(REFRESH_STORAGE_KEY, refreshToken, 30);
  } else {
    localStorage.removeItem(REFRESH_STORAGE_KEY);
    deleteClientCookie(REFRESH_STORAGE_KEY);
  }
}

/**
 * Retrieve current client-side access token
 */
export function getClientAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(AUTH_STORAGE_KEY) || getClientCookie(AUTH_STORAGE_KEY)
  );
}

/**
 * Retrieve current client-side refresh token
 */
export function getClientRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(REFRESH_STORAGE_KEY) ||
    getClientCookie(REFRESH_STORAGE_KEY)
  );
}

/**
 * Retrieve cached client-side user
 */
export function getClientUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

/**
 * Cache client-side user
 */
export function setClientUser(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

/**
 * Clear all authentication state from client storage
 */
export function clearClientAuth(): void {
  setClientTokens(null, null);
  setClientUser(null);
}

/**
 * Dispatch a global event to signal that the server returned 401 (session revoked).
 * AuthContext listens for this and redirects the user to the landing page.
 */
export function dispatchUnauthorized(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("kino:unauthorized"));
}

/**
 * Check if client currently possesses an access token
 */
export function isClientAuthenticated(): boolean {
  return Boolean(getClientAccessToken());
}

/**
 * Redirect browser to backend Google OAuth initiation endpoint
 */
export function initiateGoogleLogin(): void {
  if (typeof window === "undefined") return;
  window.location.href = `${API_BASE_URL}/auth/google`;
}

/**
 * Fetch current authenticated user profile from Kino API
 */
export async function fetchCurrentUserClient(
  token?: string,
): Promise<User | null> {
  const activeToken = token || getClientAccessToken();
  if (!activeToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
        Accept: "application/json",
      },
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.user) {
        return data.data.user as User;
      }
    }

    return null;
  } catch (error) {
    console.error("[Auth Client] Error fetching current user:", error);
    return null;
  }
}

let refreshPromise: Promise<{
  accessToken: string;
  refreshToken?: string;
  user?: User;
} | null> | null = null;

/**
 * Refresh access token using existing refresh token.
 * Uses an in-flight promise mutex to prevent concurrent refresh requests.
 */
export async function refreshClientTokens(): Promise<{
  accessToken: string;
  refreshToken?: string;
  user?: User;
} | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const currentRefreshToken = getClientRefreshToken();

    try {
      // Always fire the refresh request. If we have a token in localStorage, include it in the
      // body. If not, the backend will fall back to the httpOnly "refreshToken" cookie.
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: currentRefreshToken
          ? JSON.stringify({ refreshToken: currentRefreshToken })
          : "{}",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const newAccessToken = data.data.accessToken || data.data.token;
          const newRefreshToken = data.data.refreshToken || currentRefreshToken;
          const user = data.data.user as User | undefined;

          setClientTokens(newAccessToken, newRefreshToken);
          if (user) {
            setClientUser(user);
          }

          // Broadcast token update to active listeners
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("kino:token-refreshed", {
                detail: {
                  accessToken: newAccessToken,
                  refreshToken: newRefreshToken,
                  user,
                },
              }),
            );
          }

          return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user,
          };
        }
      }

      // If refresh returned 401 or was rejected, session is truly invalid
      if (response.status === 401 || response.status === 403) {
        clearClientAuth();
        dispatchUnauthorized();
      }
      return null;
    } catch (error) {
      console.error("[Auth Client] Token refresh network error:", error);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Seamless fetch wrapper for authenticated API requests:
 * Injects Authorization header, credentials, and automatically refreshes token on 401.
 * Retries the original request once upon successful token refresh.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  retryOnAuth = true,
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const token = getClientAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  // If 401, attempt silent token refresh and retry
  if (response.status === 401 && retryOnAuth) {
    const refreshed = await refreshClientTokens();
    if (refreshed?.accessToken) {
      headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
      return authenticatedFetch(input, { ...init, headers }, false);
    }
  }

  return response;
}

/**
 * Perform logout on client and notify backend API
 */
/**
 * Fast JWT payload decoder to inspect claims and expiry without signature verification.
 * Safe to use in both Client and Server components.
 */
export function decodeJwtClaims<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload =
      typeof Buffer !== "undefined"
        ? Buffer.from(base64, "base64").toString("utf-8")
        : atob(base64); // browser fallback
    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired (or within the 60-second buffer before expiry).
 * Safe to use in both Client and Server components.
 */
export function isJwtExpired(token: string): boolean {
  const payload = decodeJwtClaims<{ exp?: number }>(token);
  if (!payload || !payload.exp) return false;
  // Consider expired if less than 60 seconds remaining
  return Date.now() >= payload.exp * 1000 - 60000;
}

export async function logoutClient(): Promise<void> {
  const activeToken = getClientAccessToken();
  const activeRefreshToken = getClientRefreshToken();

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: activeToken ? `Bearer ${activeToken}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: activeRefreshToken }),
      credentials: "include",
    });
  } catch (error) {
    console.warn("[Auth Client] Backend logout notification failed:", error);
  } finally {
    clearClientAuth();
  }
}
