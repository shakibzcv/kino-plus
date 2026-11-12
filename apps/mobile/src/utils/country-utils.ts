import { LiveChannel } from '@/services/movies';
import { getApiBaseUrl } from '@/constants/api';

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Dhaka': 'BD',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Stockholm': 'SE',
  'Europe/Amsterdam': 'NL',
  'Europe/Warsaw': 'PL',
  'Europe/Kyiv': 'UA',
  'Europe/Kiev': 'UA',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Singapore': 'SG',
  'Asia/Bangkok': 'TH',
  'Asia/Jakarta': 'ID',
  'Asia/Karachi': 'PK',
  'Asia/Dubai': 'AE',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'America/Sao_Paulo': 'BR',
  'America/Mexico_City': 'MX',
  'America/Buenos_Aires': 'AR',
  'America/Santiago': 'CL',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'Asia/Riyadh': 'SA',
  'Europe/Istanbul': 'TR',
  'Africa/Cairo': 'EG',
  'Africa/Johannesburg': 'ZA',
};

const COUNTRY_NAMES: Record<string, string> = {
  BD: 'Bangladesh',
  US: 'United States',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  IN: 'India',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  SE: 'Sweden',
  BR: 'Brazil',
  IT: 'Italy',
  AU: 'Australia',
  MX: 'Mexico',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  TR: 'Turkey',
  NL: 'Netherlands',
  ID: 'Indonesia',
  PE: 'Peru',
  UA: 'Ukraine',
  RU: 'Russia',
  DO: 'Dominican Republic',
  JP: 'Japan',
  KR: 'South Korea',
  SG: 'Singapore',
  TH: 'Thailand',
  PK: 'Pakistan',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  EG: 'Egypt',
  ZA: 'South Africa',
};

const COUNTRY_LANGUAGES: Record<string, string> = {
  BD: 'Bengali',
  IN: 'Hindi / Regional',
  US: 'English',
  GB: 'English',
  UK: 'English',
  CA: 'English / French',
  AU: 'English',
  DE: 'German',
  FR: 'French',
  ES: 'Spanish',
  SE: 'Swedish',
  IT: 'Italian',
  BR: 'Portuguese',
  TR: 'Turkish',
  NL: 'Dutch',
  RU: 'Russian',
  UA: 'Ukrainian',
  ID: 'Indonesian',
  SA: 'Arabic',
  AE: 'Arabic',
  EG: 'Arabic',
  JP: 'Japanese',
  KR: 'Korean',
  CN: 'Chinese',
};

export function getCountryName(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (COUNTRY_NAMES[code]) return COUNTRY_NAMES[code];
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' });
    const name = dn.of(code);
    if (name) return name;
  } catch {}
  return code;
}

export function getChannelCountryCode(channel: LiveChannel): string | undefined {
  if (channel.country && channel.country.length === 2) {
    return channel.country.toUpperCase();
  }
  if (!channel.id) return undefined;
  const beforeAt = channel.id.split('@')[0];
  const parts = beforeAt ? beforeAt.split('.') : [];
  if (parts.length > 1) {
    const candidate = parts[parts.length - 1]?.toUpperCase();
    if (candidate && candidate.length === 2) {
      return candidate;
    }
  }
  return undefined;
}

export function detectCountryFromTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) return TIMEZONE_TO_COUNTRY[tz];
    if (tz?.startsWith('Asia/')) return 'BD';
    if (tz?.startsWith('America/')) return 'US';
    if (tz?.startsWith('Europe/')) return 'GB';
  } catch {}
  return 'US';
}

export function getCountryLanguage(countryCode: string): string {
  const code = countryCode.toUpperCase();
  return COUNTRY_LANGUAGES[code] || 'English';
}

// ---------------------------------------------------------------------------
// SINGLETON GEOLOCATION HELPER (DEDUPLICATED & IN-MEMORY CACHED)
// ---------------------------------------------------------------------------
let cachedGeoCountry: string | null = null;
let geoFetchPromise: Promise<string> | null = null;

export async function fetchUserGeoCountry(): Promise<string> {
  if (cachedGeoCountry) return cachedGeoCountry;
  if (geoFetchPromise) return geoFetchPromise;

  const promise = (async (): Promise<string> => {
    // 1. Try Express backend API endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${getApiBaseUrl()}/country`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const code = data?.country || data?.data?.country;
        if (typeof code === 'string' && code.trim().length === 2) {
          const upper = code.trim().toUpperCase();
          cachedGeoCountry = upper;
          return upper;
        }
      }
    } catch {}

    // 2. Direct external fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('https://api.country.is/', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data?.country && typeof data.country === 'string' && data.country.length === 2) {
          const upper = data.country.toUpperCase();
          cachedGeoCountry = upper;
          return upper;
        }
      }
    } catch {}

    // 3. Timezone heuristic fallback
    const fallback = detectCountryFromTimezone();
    cachedGeoCountry = fallback;
    return fallback;
  })();

  geoFetchPromise = promise;
  try {
    return await promise;
  } finally {
    geoFetchPromise = null;
  }
}


