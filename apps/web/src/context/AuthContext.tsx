"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User,
  setClientTokens,
  getClientAccessToken,
  getClientRefreshToken,
  clearClientAuth,
  initiateGoogleLogin,
  fetchCurrentUserClient,
  refreshClientTokens,
  logoutClient,
  getClientUser,
  setClientUser,
  isJwtExpired,
} from "../lib/auth.client";

export type { User };

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  fetchCurrentUser: (authToken?: string) => Promise<User | null>;
  refreshTokens: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  initialToken?: string | null;
}> = ({ children, initialToken = null }) => {
  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<User | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialToken);

  // Perform session refresh with the backend
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const result = await refreshClientTokens();
      if (result) {
        setToken(result.accessToken);
        if (result.refreshToken) setRefreshToken(result.refreshToken);
        if (result.user) {
          setUser(result.user);
          setClientUser(result.user);
        }
        return true;
      }
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      clearClientAuth();
      return false;
    } catch (err) {
      console.error("[AuthContext] Token refresh failed:", err);
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      clearClientAuth();
      return false;
    }
  }, []);

  const fetchCurrentUser = useCallback(
    async (authToken?: string): Promise<User | null> => {
      const activeToken = authToken || token || getClientAccessToken();
      if (!activeToken) {
        setUser(null);
        return null;
      }

      try {
        const currentUser = await fetchCurrentUserClient(activeToken);
        if (currentUser) {
          setUser(currentUser);
          setClientUser(currentUser);
          return currentUser;
        }

        // If fetch failed, attempt refresh
        const refreshed = await refreshSession();
        if (refreshed) {
          const freshToken = getClientAccessToken();
          if (freshToken) {
            const retryUser = await fetchCurrentUserClient(freshToken);
            if (retryUser) {
              setUser(retryUser);
              setClientUser(retryUser);
              return retryUser;
            }
          }
        }

        setUser(null);
        setToken(null);
        setRefreshToken(null);
        clearClientAuth();
        return null;
      } catch (err) {
        console.error("[AuthContext] Failed to fetch current user:", err);
        return null;
      }
    },
    [token, refreshSession],
  );

  // Listen for any 401 dispatched from anywhere in the app (tmdb.ts, userData.ts, etc.)
  // When a session is revoked, immediately clear auth state and redirect to the landing page.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      clearClientAuth();
      // Only redirect if not already on the landing page
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.href = "/";
      } else if (typeof window !== "undefined") {
        // Already on landing page — force a reload so auth screen is shown cleanly
        window.location.reload();
      }
    };

      window.addEventListener("kino:unauthorized", handleUnauthorized);

    const handleTokenRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent<{
        accessToken: string;
        refreshToken?: string;
        user?: User;
      }>;
      if (customEvent.detail?.accessToken) {
        setToken(customEvent.detail.accessToken);
      }
      if (customEvent.detail?.refreshToken) {
        setRefreshToken(customEvent.detail.refreshToken);
      }
      if (customEvent.detail?.user) {
        setUser(customEvent.detail.user);
      }
    };

    window.addEventListener("kino:token-refreshed", handleTokenRefreshed);
    return () => {
      window.removeEventListener("kino:unauthorized", handleUnauthorized);
      window.removeEventListener("kino:token-refreshed", handleTokenRefreshed);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load cached user from client storage safely after mount (prevents SSR hydration mismatch)
    const cachedUser = getClientUser();
    if (cachedUser) {
      setUser(cachedUser);
    }

    // 1. Check for token and refreshToken in URL query parameters (Google OAuth redirect)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlRefreshToken = params.get("refreshToken");

    if (urlToken) {
      setToken(urlToken);
      if (urlRefreshToken) {
        setRefreshToken(urlRefreshToken);
      }
      setClientTokens(urlToken, urlRefreshToken);

      // Clean query params from URL without reloading
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("token");
      newUrl.searchParams.delete("refreshToken");
      newUrl.searchParams.delete("userId");
      newUrl.searchParams.delete("auth_required");
      window.history.replaceState(
        {},
        document.title,
        newUrl.pathname + newUrl.search,
      );

      fetchCurrentUser(urlToken).finally(() => {
        setIsLoading(false);
      });
      return;
    }

    // 2. Check for token in storage (localStorage or cookies)
    const savedToken = getClientAccessToken();
    const savedRefreshToken = getClientRefreshToken();

    if (savedRefreshToken) {
      setRefreshToken(savedRefreshToken);
    }

    if (savedToken && !isJwtExpired(savedToken)) {
      setToken(savedToken);
      // Ensure cookies are also set if token only existed in localStorage
      setClientTokens(savedToken, savedRefreshToken);
      fetchCurrentUser(savedToken).finally(() => {
        setIsLoading(false);
      });
    } else if (savedToken && isJwtExpired(savedToken)) {
      // Token exists but is expired — silently refresh using refresh token / httpOnly cookie
      refreshSession().finally(() => {
        setIsLoading(false);
      });
    } else if (savedRefreshToken) {
      // No access token at all, but we have a refresh token
      refreshSession().finally(() => {
        setIsLoading(false);
      });
    } else {
      // Try a cookie-based refresh before giving up (handles httpOnly cookie fallback)
      refreshSession().finally(() => {
        setIsLoading(false);
      });
    }
  }, [fetchCurrentUser, refreshSession]);

  // Proactive background refresh every 6 hours (7-day tokens don't need frequent refresh)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const interval = setInterval(() => {
      refreshSession();
    }, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshSession]);

  // Refresh immediately when tab becomes visible again (handles computer sleep/wake)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const currentToken = getClientAccessToken();
        if (!currentToken || isJwtExpired(currentToken)) {
          refreshSession();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [refreshSession]);

  const loginWithGoogle = () => {
    initiateGoogleLogin();
  };

  const logout = async () => {
    try {
      await logoutClient();
    } catch (err) {
      console.error("[AuthContext] Logout request failed:", err);
    } finally {
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      clearClientAuth();
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      } else {
        window.location.reload();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isLoading,
        isAuthenticated: Boolean(user || token || initialToken),
        loginWithGoogle,
        logout,
        fetchCurrentUser,
        refreshTokens: refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
