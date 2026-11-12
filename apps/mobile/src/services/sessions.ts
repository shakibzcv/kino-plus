import { Ionicons } from '@expo/vector-icons';
import { getApiBaseUrl } from './api-config';
import { getServiceAuthToken, refreshTokensSilently } from './movies';
import { getSecureSession } from './secure-storage';

export interface DeviceSession {
  id: string;
  isCurrent: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
}

export interface DevicePresentation {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}

interface ApiEnvelope<T> {
  statusCode?: number;
  data?: T;
  message?: string;
  success?: boolean;
}

async function resolveAuthToken(): Promise<string | null> {
  const inMemory = getServiceAuthToken();
  if (inMemory) return inMemory;
  try {
    const session = await getSecureSession();
    return session.accessToken || null;
  } catch {
    return null;
  }
}

function authHeaders(token: string, extra?: Record<string, string>): HeadersInit {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

function readErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const record = payload as { message?: string; data?: { message?: string } };
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message;
    }
    if (typeof record.data?.message === 'string' && record.data.message.trim()) {
      return record.data.message;
    }
  }
  return fallback;
}

export function presentDevice(userAgent: string | null | undefined): DevicePresentation {
  const ua = (userAgent || '').trim();
  const lower = ua.toLowerCase();

  if (!ua) {
    return {
      title: 'Unknown device',
      subtitle: 'Kino+ session',
      icon: 'hardware-chip-outline',
      iconColor: '#94a3b8',
      iconBg: 'rgba(148, 163, 184, 0.16)',
    };
  }

  if (
    lower.includes('android tv') ||
    lower.includes('androidtv') ||
    lower.includes('smart-tv') ||
    lower.includes('smarttv') ||
    lower.includes('bravia') ||
    lower.includes('aftt') ||
    lower.includes('aftm')
  ) {
    return {
      title: 'Android TV',
      subtitle: 'Kino+ TV',
      icon: 'tv-outline',
      iconColor: '#818cf8',
      iconBg: 'rgba(129, 140, 248, 0.18)',
    };
  }

  if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios')) {
    return {
      title: 'iPhone',
      subtitle: 'Kino+ iOS',
      icon: 'phone-portrait-outline',
      iconColor: '#38bdf8',
      iconBg: 'rgba(56, 189, 248, 0.18)',
    };
  }

  if (lower.includes('okhttp') || lower.includes('expo') || lower.includes('react native') || lower.includes('android')) {
    return {
      title: 'Android phone',
      subtitle: 'Kino+ Android',
      icon: 'logo-android',
      iconColor: '#4ade80',
      iconBg: 'rgba(74, 222, 128, 0.16)',
    };
  }

  const chromeMatch = ua.match(/Chrome\/(\d+)/i);
  if (lower.includes('chrome') && !lower.includes('edg')) {
    return {
      title: chromeMatch ? `Chrome ${chromeMatch[1]}` : 'Chrome',
      subtitle: 'Kino+ Web',
      icon: 'logo-chrome',
      iconColor: '#fb7185',
      iconBg: 'rgba(251, 113, 133, 0.18)',
    };
  }

  if (lower.includes('edg')) {
    return {
      title: 'Microsoft Edge',
      subtitle: 'Kino+ Web',
      icon: 'desktop-outline',
      iconColor: '#60a5fa',
      iconBg: 'rgba(96, 165, 250, 0.18)',
    };
  }

  if (lower.includes('firefox')) {
    return {
      title: 'Firefox',
      subtitle: 'Kino+ Web',
      icon: 'globe-outline',
      iconColor: '#fb923c',
      iconBg: 'rgba(251, 146, 60, 0.18)',
    };
  }

  if (lower.includes('safari') && !lower.includes('chrome')) {
    return {
      title: 'Safari',
      subtitle: 'Kino+ Web',
      icon: 'compass-outline',
      iconColor: '#38bdf8',
      iconBg: 'rgba(56, 189, 248, 0.18)',
    };
  }

  if (lower.includes('electron') || lower.includes('desktop')) {
    return {
      title: 'Desktop',
      subtitle: 'Kino+ Desktop',
      icon: 'laptop-outline',
      iconColor: '#a78bfa',
      iconBg: 'rgba(167, 139, 250, 0.18)',
    };
  }

  return {
    title: ua.slice(0, 42),
    subtitle: 'Kino+ session',
    icon: 'desktop-outline',
    iconColor: '#94a3b8',
    iconBg: 'rgba(148, 163, 184, 0.16)',
  };
}

export function formatSessionMeta(session: DeviceSession): string {
  const location = session.ipAddress || 'Unknown location';
  const lastActive = session.lastActiveAt ? new Date(session.lastActiveAt) : null;
  if (!lastActive || Number.isNaN(lastActive.getTime())) {
    return location;
  }

  const ageMs = Date.now() - lastActive.getTime();
  if (ageMs < 5 * 60 * 1000) {
    return `${location} · online`;
  }

  const dateLabel = lastActive.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return `${location} · ${dateLabel}`;
}

export const SESSIONS_PAGE_SIZE = 10;

export interface DeviceSessionsPage {
  current: DeviceSession | null;
  sessions: DeviceSession[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export async function fetchDeviceSessionsPage(
  page = 1,
  limit = SESSIONS_PAGE_SIZE,
  retryOnAuth = true
): Promise<DeviceSessionsPage> {
  const empty: DeviceSessionsPage = {
    current: null,
    sessions: [],
    page,
    limit,
    total: 0,
    hasMore: false,
  };

  const token = await resolveAuthToken();
  if (!token) return empty;

  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const res = await fetch(`${getApiBaseUrl()}/auth/sessions?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders(token),
    });

    if (res.status === 401 && retryOnAuth) {
      const refreshed = await refreshTokensSilently();
      if (refreshed) {
        return fetchDeviceSessionsPage(page, limit, false);
      }
    }

    if (!res.ok) return empty;
    const json = (await res.json()) as ApiEnvelope<Partial<DeviceSessionsPage>>;
    return {
      current: json.data?.current ?? null,
      sessions: json.data?.sessions || [],
      page: json.data?.page || page,
      limit: json.data?.limit || limit,
      total: json.data?.total || 0,
      hasMore: Boolean(json.data?.hasMore),
    };
  } catch (err) {
    console.warn('[Sessions] fetchDeviceSessionsPage error:', err);
    return empty;
  }
}

export async function revokeDeviceSession(
  sessionId: string,
  retryOnAuth = true
): Promise<{ ok: boolean; message: string }> {
  const token = await resolveAuthToken();
  if (!token) return { ok: false, message: 'You need to be signed in.' };

  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });

    if (res.status === 401 && retryOnAuth) {
      const refreshed = await refreshTokensSilently();
      if (refreshed) {
        return revokeDeviceSession(sessionId, false);
      }
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, message: readErrorMessage(json, 'Could not terminate this session.') };
    }
    return { ok: true, message: 'Session terminated' };
  } catch (err) {
    console.warn('[Sessions] revokeDeviceSession error:', err);
    return { ok: false, message: 'Could not reach the server.' };
  }
}

export async function revokeOtherDeviceSessions(
  retryOnAuth = true
): Promise<{ ok: boolean; message: string; revokedCount?: number }> {
  const token = await resolveAuthToken();
  if (!token) return { ok: false, message: 'You need to be signed in.' };

  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/sessions/revoke-others`, {
      method: 'POST',
      headers: authHeaders(token),
    });

    if (res.status === 401 && retryOnAuth) {
      const refreshed = await refreshTokensSilently();
      if (refreshed) {
        return revokeOtherDeviceSessions(false);
      }
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, message: readErrorMessage(json, 'Could not terminate other sessions.') };
    }
    return {
      ok: true,
      message: 'All other sessions have been terminated',
      revokedCount: json?.data?.revokedCount,
    };
  } catch (err) {
    console.warn('[Sessions] revokeOtherDeviceSessions error:', err);
    return { ok: false, message: 'Could not reach the server.' };
  }
}

export function parseTvPairingCode(raw: string): string | null {
  const value = (raw || '').trim();
  if (!value) return null;

  const queryMatch = value.match(/[?&]code=([^&]+)/i);
  if (queryMatch?.[1]) {
    try {
      return decodeURIComponent(queryMatch[1]).replace(/\s/g, '').toUpperCase();
    } catch {
      return queryMatch[1].replace(/\s/g, '').toUpperCase();
    }
  }

  const compact = value.replace(/\s/g, '').toUpperCase();
  const dashed = compact.match(/KP-[A-Z0-9]{3}-[A-Z0-9]{3}/);
  if (dashed) return dashed[0];

  const plain = compact.match(/KP[A-Z0-9]{6}/);
  if (plain) {
    const body = plain[0].slice(2);
    return `KP-${body.slice(0, 3)}-${body.slice(3)}`;
  }

  return null;
}

export async function activateTvDevice(
  code: string,
  user?: { id?: string; email?: string | null; name?: string | null } | null,
  retryOnAuth = true
): Promise<{ ok: boolean; message: string }> {
  const token = await resolveAuthToken();
  const clean = code.trim().toUpperCase();
  if (clean.length < 5) {
    return { ok: false, message: 'Enter the pairing code shown on your TV.' };
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/tv/device-activate`, {
      method: 'POST',
      headers: token ? authHeaders(token) : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: clean,
        email: user?.email,
        name: user?.name,
        user,
      }),
    });

    if (res.status === 401 && retryOnAuth) {
      const refreshed = await refreshTokensSilently();
      if (refreshed) {
        return activateTvDevice(code, user, false);
      }
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, message: readErrorMessage(json, 'Could not pair this TV.') };
    }
    return { ok: true, message: json?.message || 'Your Android TV is now connected.' };
  } catch (err) {
    console.warn('[Sessions] activateTvDevice error:', err);
    return { ok: false, message: 'Could not reach the server.' };
  }
}
