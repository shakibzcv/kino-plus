import { fetchFromTMDB, formatImageUrl } from './client';

export interface WatchProviderItem {
  id: number;
  name: string;
  logo: string | null;
  category: 'stream' | 'rent' | 'buy';
  countries: string[];
  regionLabel: string;
}

export interface WatchProvidersResponse {
  link: string;
  streaming: WatchProviderItem[];
  stores: WatchProviderItem[];
}

function getRegionLabel(countries: string[]): string {
  if (countries.length >= 25) {
    return 'Worldwide';
  }
  if (countries.length > 3) {
    return `${countries.slice(0, 2).join(', ')} +${countries.length - 2}`;
  }
  return countries.join(', ');
}

export async function fetchWatchProviders(
  id: string,
  mediaType: 'movie' | 'tv',
): Promise<WatchProvidersResponse | null> {
  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}/watch/providers`);
    const results: Record<string, any> = data?.results || {};

    let justWatchLink = '';
    const streamMap = new Map<number, WatchProviderItem>();
    const storeMap = new Map<number, WatchProviderItem>();

    for (const [country, countryData] of Object.entries(results)) {
      if (!justWatchLink && countryData?.link) {
        justWatchLink = countryData.link;
      }
      if (country === 'US' && countryData?.link) {
        justWatchLink = countryData.link;
      }

      // 1. Subscription & Free Streams
      const streamList = [
        ...(countryData?.flatrate || []),
        ...(countryData?.free || []),
        ...(countryData?.ads || []),
      ];

      for (const p of streamList) {
        if (!p?.provider_id) continue;
        if (!streamMap.has(p.provider_id)) {
          streamMap.set(p.provider_id, {
            id: p.provider_id,
            name: p.provider_name,
            logo: p.logo_path ? formatImageUrl(p.logo_path, 'w500') : null,
            category: 'stream',
            countries: [country],
            regionLabel: '',
          });
        } else {
          const entry = streamMap.get(p.provider_id)!;
          if (!entry.countries.includes(country)) {
            entry.countries.push(country);
          }
        }
      }

      // 2. Rent & Buy Digital Stores
      const storeList = [
        ...(countryData?.rent || []).map((p: any) => ({ ...p, cat: 'rent' })),
        ...(countryData?.buy || []).map((p: any) => ({ ...p, cat: 'buy' })),
      ];

      for (const p of storeList) {
        if (!p?.provider_id) continue;
        if (!storeMap.has(p.provider_id)) {
          storeMap.set(p.provider_id, {
            id: p.provider_id,
            name: p.provider_name,
            logo: p.logo_path ? formatImageUrl(p.logo_path, 'w500') : null,
            category: (p.cat as any) || 'rent',
            countries: [country],
            regionLabel: '',
          });
        } else {
          const entry = storeMap.get(p.provider_id)!;
          if (!entry.countries.includes(country)) {
            entry.countries.push(country);
          }
        }
      }
    }

    const sortFn = (a: WatchProviderItem, b: WatchProviderItem) =>
      b.countries.length - a.countries.length;

    const streaming = Array.from(streamMap.values())
      .map((p) => ({ ...p, regionLabel: getRegionLabel(p.countries) }))
      .sort(sortFn);

    const stores = Array.from(storeMap.values())
      .map((p) => ({ ...p, regionLabel: getRegionLabel(p.countries) }))
      .sort(sortFn);

    return {
      link: justWatchLink,
      streaming,
      stores,
    };
  } catch {
    return null;
  }
}
