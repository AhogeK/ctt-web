import { ofetch, type FetchOptions } from 'ofetch'
import { useAuthStore } from '@/stores/auth'

/**
 * Base API URL from environment variable, fallback to '/api' for proxy setup.
 * VITE_API_BASE_URL is typically set in .env files for different environments.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Centralized ofetch instance for all API requests.
 *
 * Configuration:
 * - Base URL: Environment-configured API endpoint
 * - Timeout: 30 seconds to prevent hanging requests
 * - Credentials: 'include' for CORS cookie handling
 * - Request interceptor: Auto-injects Authorization header when token exists
 *
 * Note: Auth store is accessed lazily inside interceptor to avoid
 * Pinia initialization timing issues (store must be created after Pinia setup).
 */
export const apiFetch = ofetch.create({
  baseURL: BASE_URL,
  timeout: 30000,
  credentials: 'include',

  /**
   * Request interceptor that injects Authorization header for authenticated requests.
   * Gets auth store lazily to avoid Pinia initialization timing issues.
   */
  async onRequest({ options }) {
    // Get store lazily - Pinia must be initialized before store access
    const authStore = useAuthStore()

    // Only add Authorization header if access token exists
    if (authStore.accessToken) {
      const headers = new Headers(options.headers)
      headers.set('Authorization', `Bearer ${authStore.accessToken}`)
      options.headers = headers
    }
  },
})

/**
 * Type helper for API response parsing with Zod schemas.
 * Provides type inference for parsed response data.
 */
export type ApiFetchOptions = FetchOptions
