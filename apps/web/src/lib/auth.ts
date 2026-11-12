import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  User,
  AUTH_STORAGE_KEY,
  REFRESH_STORAGE_KEY,
  API_BASE_URL,
} from "./auth.client";

export type { User };

/**
 * Fast JWT payload decoder to inspect claims and expiry without signature verification
 */
export function decodeJwtClaims<T = Record<string, unknown>>(
  token: string,
): T | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isJwtExpired(token: string): boolean {
  const payload = decodeJwtClaims<{ exp?: number }>(token);
  if (!payload || !payload.exp) return false;
  // Consider expired if less than 15 seconds remaining
  return Date.now() >= payload.exp * 1000 - 15000;
}

/**
 * Retrieve access token from server request cookies
 */
export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_STORAGE_KEY)?.value;
  return token || null;
}

/**
 * Retrieve refresh token from server request cookies
 */
export async function getServerRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(REFRESH_STORAGE_KEY)?.value;
  return token || null;
}

/**
 * Fetch authenticated user details on the server from Kino API
 */
export async function getServerUser(): Promise<User | null> {
  const token = await getServerToken();
  if (!token || isJwtExpired(token)) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.user) {
        return data.data.user as User;
      }
    }

    return null;
  } catch (error) {
    console.error(
      "[Auth Server] Error fetching current user on server:",
      error,
    );
    return null;
  }
}

/**
 * Fast server-side authentication check
 */
export async function isServerAuthenticated(): Promise<boolean> {
  const token = await getServerToken();
  if (!token) return false;
  return !isJwtExpired(token);
}

/**
 * Require authentication on Server Components or Server Actions.
 * Immediately redirects unauthenticated requests to the landing page.
 */
export async function requireServerAuth(redirectTo = "/"): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}
