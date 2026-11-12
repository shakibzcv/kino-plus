import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';

let cachedDefaultCountry = 'US';

export const countryController = {
  detectCountry: asyncHandler(async (req: Request, res: Response) => {
    // 1. Edge CDN geolocation headers (Vercel, Cloudflare, Fly, etc.)
    const edgeCountry =
      req.headers['x-vercel-ip-country'] ||
      req.headers['cf-ipcountry'] ||
      req.headers['x-country-code'];

    if (typeof edgeCountry === 'string' && edgeCountry.trim().length === 2) {
      const code = edgeCountry.trim().toUpperCase();
      return res.status(200).json({
        statusCode: 200,
        data: { country: code, source: 'edge-header' },
        country: code,
        source: 'edge-header',
        success: true,
      });
    }

    // 2. Fetch from api.country.is
    try {
      const response = await fetch('https://api.country.is/', {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = (await response.json()) as { country?: string };
        if (data?.country && typeof data.country === 'string' && data.country.length === 2) {
          cachedDefaultCountry = data.country.toUpperCase();
          return res.status(200).json({
            statusCode: 200,
            data: { country: cachedDefaultCountry, source: 'server-fetch' },
            country: cachedDefaultCountry,
            source: 'server-fetch',
            success: true,
          });
        }
      }
    } catch {
      // Fallback
    }

    // 3. Fallback
    return res.status(200).json({
      statusCode: 200,
      data: { country: cachedDefaultCountry, source: 'default' },
      country: cachedDefaultCountry,
      source: 'default',
      success: true,
    });
  }),
};

export default countryController;
