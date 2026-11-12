import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { type User } from '@react-native-google-signin/google-signin';

const ACCESS_TOKEN_KEY = 'kino_auth_access_token';
const REFRESH_TOKEN_KEY = 'kino_auth_refresh_token';
const USER_KEY = 'kino_auth_user';

export interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: User['user'] | null;
}

/**
 * Save access token, refresh token, and user profile securely in Android Keystore / iOS Keychain.
 */
export async function saveSecureSession(session: {
  accessToken?: string | null;
  refreshToken?: string | null;
  user?: User['user'] | null;
}): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        if (session.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
        if (session.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
        if (session.user) localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      }
      return;
    }

    if (session.accessToken) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken);
    }
    if (session.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken);
    }
    if (session.user) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user));
    }
  } catch (error) {
    console.warn('[SecureStorage] Error saving session:', error);
  }
}

/**
 * Retrieve saved session from SecureStore.
 */
export async function getSecureSession(): Promise<StoredSession> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const userRaw = localStorage.getItem(USER_KEY);
        let user: User['user'] | null = null;
        if (userRaw) {
          try {
            user = JSON.parse(userRaw);
          } catch {}
        }
        return { accessToken, refreshToken, user };
      }
      return { accessToken: null, refreshToken: null, user: null };
    }

    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    const userRaw = await SecureStore.getItemAsync(USER_KEY);
    let user: User['user'] | null = null;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw);
      } catch {}
    }

    return { accessToken, refreshToken, user };
  } catch (error) {
    console.warn('[SecureStorage] Error reading session:', error);
    return { accessToken: null, refreshToken: null, user: null };
  }
}

/**
 * Clear all saved tokens and user info from SecureStore.
 */
export async function clearSecureSession(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      return;
    }

    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.warn('[SecureStorage] Error clearing session:', error);
  }
}

const GUEST_KEY = 'kino_is_guest';

export async function setGuestSession(isGuest: boolean): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        if (isGuest) localStorage.setItem(GUEST_KEY, 'true');
        else localStorage.removeItem(GUEST_KEY);
      }
      return;
    }
    if (isGuest) {
      await SecureStore.setItemAsync(GUEST_KEY, 'true');
    } else {
      await SecureStore.deleteItemAsync(GUEST_KEY);
    }
  } catch (error) {
    console.warn('[SecureStorage] Error setting guest session:', error);
  }
}

export async function getGuestSession(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(GUEST_KEY) === 'true';
      }
      return false;
    }
    const val = await SecureStore.getItemAsync(GUEST_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

