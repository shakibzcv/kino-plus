import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { type User } from '@react-native-google-signin/google-signin';
import {
  signInWithGoogle as googleSignInService,
  signInSilently as googleSignInSilentlyService,
  signOutGoogle as googleSignOutService,
  type GoogleAuthResult,
} from '@/services/google-auth';
import { syncGoogleAuthWithBackend, notifyBackendLogout } from '@/services/api-client';
import {
  saveSecureSession,
  getSecureSession,
  clearSecureSession,
  setGuestSession,
  getGuestSession,
} from '@/services/secure-storage';
import {
  setServiceAuthToken,
  refreshTokensSilently,
  onMobileSessionExpired,
  onMobileTokenRefreshed,
  warmAuthToken,
} from '@/services/movies';
import { getApiBaseUrl } from '@/constants/api';

export type AuthUser = User['user'];

interface AuthContextValue {
  user: AuthUser | null;
  idToken: string | null;
  authToken: string | null;
  isLoading: boolean;
  isGoogleSigningIn: boolean;
  isGuest: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<GoogleAuthResult>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Restore authenticated session on app launch from SecureStore (Android Keystore / iOS Keychain)
  // If user is authenticated, they immediately bypass onboarding and land directly on the Home screen.
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        // 0. On Web: Check if returning from Google OAuth redirect with tokens in URL
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.search) {
          const params = new URLSearchParams(window.location.search);
          const urlToken = params.get('token');
          const urlRefreshToken = params.get('refreshToken');
          if (urlToken) {
            setAuthToken(urlToken);
            setServiceAuthToken(urlToken);

            try {
              const meRes = await fetch(`${getApiBaseUrl()}/auth/me`, {
                headers: {
                  Accept: 'application/json',
                  Authorization: `Bearer ${urlToken}`,
                },
              });
              if (meRes.ok) {
                const meJson = await meRes.json();
                const fetchedUser = meJson?.data?.user;
                if (fetchedUser && isMounted) {
                  setUser(fetchedUser);
                  await saveSecureSession({
                    accessToken: urlToken,
                    refreshToken: urlRefreshToken || null,
                    user: fetchedUser,
                  });
                }
              }
            } catch (meErr) {
              console.warn('[AuthContext] Error fetching profile from url token:', meErr);
            }

            try {
              window.history.replaceState({}, document.title, window.location.pathname);
            } catch {}
          }
        }

        // 0a. Warm in-memory auth token immediately so API calls never hit Keystore per-request
        await warmAuthToken();

        // 1. Fast restore from Expo SecureStore
        const stored = await getSecureSession();
        if (stored.user && isMounted) {
          setUser(stored.user);
          if (stored.accessToken) {
            setAuthToken(stored.accessToken);
            setServiceAuthToken(stored.accessToken);
          }
        }

        // 2. Silent Google Sign-In verification to refresh token and backend session on native
        let refreshedSuccessfully = false;
        try {
          const silentResult = await googleSignInSilentlyService();
          if (silentResult.success && silentResult.user) {
            const activeUser = silentResult.user;
            if (isMounted) {
              setUser(activeUser);
              if (silentResult.idToken) setIdToken(silentResult.idToken);
            }

            // Sync with backend to refresh Kino JWT access token
            const backendRes = await syncGoogleAuthWithBackend(
              activeUser,
              silentResult.idToken
            );

            const newAccessToken = backendRes?.data?.token || backendRes?.data?.accessToken;
            const newRefreshToken = backendRes?.data?.refreshToken;

            if (newAccessToken && isMounted) {
              setAuthToken(newAccessToken);
              setServiceAuthToken(newAccessToken);
              refreshedSuccessfully = true;
            }

            // Update SecureStore with fresh tokens
            await saveSecureSession({
              accessToken: newAccessToken || stored.accessToken,
              refreshToken: newRefreshToken || stored.refreshToken,
              user: activeUser,
            });
          }
        } catch (silentErr) {
          console.warn('[AuthContext] Silent sign-in check notice:', silentErr);
        }

        // 3. Fallback: If silent Google sign-in didn't refresh tokens, but we have a stored user or refresh token,
        // sync with the backend to ensure a live session exists in PostgreSQL
        if (!refreshedSuccessfully && stored.user) {
          try {
            const syncRes = await syncGoogleAuthWithBackend(stored.user);
            const freshAccessToken = syncRes?.data?.token || syncRes?.data?.accessToken;
            const freshRefreshToken = syncRes?.data?.refreshToken;
            if (freshAccessToken && isMounted) {
              setAuthToken(freshAccessToken);
              setServiceAuthToken(freshAccessToken);
              await saveSecureSession({
                accessToken: freshAccessToken,
                refreshToken: freshRefreshToken || stored.refreshToken,
                user: stored.user,
              });
            }
          } catch (syncErr) {
            console.warn('[AuthContext] Background sync with stored user notice:', syncErr);
          }
        } else if (!stored.user && !refreshedSuccessfully) {
          const guestActive = await getGuestSession();
          if (isMounted) {
            setUser(null);
            setAuthToken(null);
            setServiceAuthToken(null);
            setIsGuest(guestActive);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Session restore notice:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const continueAsGuest = useCallback(async (): Promise<void> => {
    setIsGuest(true);
    await setGuestSession(true);
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<GoogleAuthResult> => {
    setIsGoogleSigningIn(true);
    setError(null);

    try {
      const result = await googleSignInService();
      if (result.success && result.user) {
        const activeUser = result.user;
        setUser(activeUser);
        setIsGuest(false);
        await setGuestSession(false);
        if (result.idToken) {
          setIdToken(result.idToken);
        }

        // Sync with backend API to obtain Kino JWT tokens and register session in DB
        let accessToken: string | null = null;
        let refreshToken: string | null = null;
        try {
          const syncRes = await syncGoogleAuthWithBackend(activeUser, result.idToken);
          accessToken = syncRes?.data?.token || syncRes?.data?.accessToken || null;
          refreshToken = syncRes?.data?.refreshToken || null;
          if (accessToken) {
            setAuthToken(accessToken);
            setServiceAuthToken(accessToken);
          }
        } catch (syncErr) {
          console.warn('[AuthContext] Backend sync warning:', syncErr);
        }

        // Securely persist tokens in Android Keystore / iOS Keychain
        await saveSecureSession({
          accessToken,
          refreshToken,
          user: activeUser,
        });
      } else if (result.error && !result.cancelled) {
        setError(result.error);
      }
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign in failed.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsGoogleSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      setServiceAuthToken(null);
      // 1. Notify backend
      await notifyBackendLogout(user);
      // 2. Sign out Google SDK
      await googleSignOutService();
      // 3. Wipe Expo SecureStore
      await clearSecureSession();
      await setGuestSession(false);

      setUser(null);
      setIdToken(null);
      setAuthToken(null);
      setIsGuest(false);
      setError(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 1. Automatically handle session expiry or revocation from background requests
  useEffect(() => {
    const unsubscribe = onMobileSessionExpired(() => {
      console.warn('[AuthContext] Session expired or revoked from backend. Signing out...');
      signOut();
    });
    return () => {
      unsubscribe();
    };
  }, [signOut]);

  // 2. Synchronize in-memory auth token when rotated silently by any service
  useEffect(() => {
    const unsubscribe = onMobileTokenRefreshed((newToken: string) => {
      setAuthToken(newToken);
      setServiceAuthToken(newToken);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // 3. Proactively refresh tokens every 50 minutes (tokens expire in 2 hours)
  useEffect(() => {
    if (!authToken && !user) return;

    const interval = setInterval(async () => {
      try {
        console.info('[AuthContext] Proactively refreshing mobile session token...');
        const freshToken = await refreshTokensSilently();
        if (freshToken) {
          setAuthToken(freshToken);
          setServiceAuthToken(freshToken);
        }
      } catch (err) {
        console.warn('[AuthContext] Proactive token refresh error:', err);
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authToken, user]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      idToken,
      authToken,
      isLoading,
      isGoogleSigningIn,
      isGuest,
      error,
      signInWithGoogle,
      continueAsGuest,
      signOut,
      clearError,
    }),
    [
      user,
      idToken,
      authToken,
      isLoading,
      isGoogleSigningIn,
      isGuest,
      error,
      signInWithGoogle,
      continueAsGuest,
      signOut,
      clearError,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
