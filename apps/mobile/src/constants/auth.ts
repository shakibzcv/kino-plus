import { getApiBaseUrl } from './api';

/**
 * Google OAuth and Backend API Configuration constants for Kino+ Mobile
 *
 * Client IDs configured for Google Cloud Project 37729706552:
 * - Web Client ID (backend / offline access / token verification):
 *   37729706552-2q9plbq8v83h54qqj3a014jbpm4r00aj.apps.googleusercontent.com
 * - Android Client ID (Native Android package com.kino.mobile):
 *   37729706552-et5et3c75uf9gomo8f2g0cnd40acmt9e.apps.googleusercontent.com
 * - iOS Client ID (Native iOS bundle com.kino.mobile):
 *   37729706552-db8995ff7jbotp2vojbprgfvlic51ka0.apps.googleusercontent.com
 */
export const GOOGLE_AUTH_CONFIG = {
  webClientId: '37729706552-2q9plbq8v83h54qqj3a014jbpm4r00aj.apps.googleusercontent.com',
  androidClientId: '37729706552-et5et3c75uf9gomo8f2g0cnd40acmt9e.apps.googleusercontent.com',
  iosClientId: '37729706552-db8995ff7jbotp2vojbprgfvlic51ka0.apps.googleusercontent.com',
  iosUrlScheme: 'com.googleusercontent.apps.37729706552-db8995ff7jbotp2vojbprgfvlic51ka0',
  scopes: ['profile', 'email'],
  offlineAccess: true,
} as const;

export const API_CONFIG = {
  get baseUrl() {
    return getApiBaseUrl();
  },
  endpoints: {
    mobileGoogleAuth: '/api/auth/mobile/google',
    logout: '/api/auth/logout',
  },
} as const;
