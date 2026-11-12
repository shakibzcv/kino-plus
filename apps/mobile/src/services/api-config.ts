/**
 * Re-exports the API Base URL and Endpoints from the centralized constants/api.ts module.
 * The URL is primarily read from .env via EXPO_PUBLIC_API_URL.
 */
export { getApiBaseUrl, API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
