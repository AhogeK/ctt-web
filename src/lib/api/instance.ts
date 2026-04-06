import { ofetch, type FetchOptions } from 'ofetch'
import { toast } from 'vue-sonner'

/**
 * Base API URL from environment variable, fallback to '/api' for proxy setup.
 * VITE_API_BASE_URL is typically set in .env files for different environments.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Custom event name dispatched when a 401 Unauthorized response is received.
 * Allows external listeners (e.g., main.ts) to handle authentication failures
 * without direct coupling to this module.
 *
 * Usage:
 * ```ts
 * globalThis.addEventListener(UNAUTHORIZED_EVENT, () => {
 *   // Handle unauthorized (e.g., redirect to login)
 * })
 * ```
 */
export const UNAUTHORIZED_EVENT = 'api:unauthorized'

/**
 * Centralized ofetch instance for all API requests.
 *
 * Configuration:
 * - Base URL: Environment-configured API endpoint
 * - Timeout: 30 seconds to prevent hanging requests
 * - Credentials: 'include' for CORS cookie handling
 * - Request interceptor: Auto-injects Authorization header from localStorage
 * - Response error interceptor: Global error handling with toast notifications
 *
 * Note: Token is read from localStorage to avoid circular dependency with Pinia store.
 * Auth store persists token to localStorage, and this module reads it directly.
 */
export const apiFetch = ofetch.create({
  baseURL: BASE_URL,
  timeout: 30000,
  credentials: 'include',

  /**
   * Request interceptor that injects Authorization header for authenticated requests.
   * Reads token directly from localStorage to avoid circular dependency with auth store.
   */
  async onRequest({ options }) {
    const accessToken = localStorage.getItem('access_token')

    if (accessToken) {
      const headers = new Headers(options.headers)
      headers.set('Authorization', `Bearer ${accessToken}`)
      options.headers = headers
    }
  },

  /**
   * Response error interceptor for global error handling.
   *
   * Error handling strategy:
   * - 401: Clear token, show toast, dispatch UNAUTHORIZED_EVENT for external handling
   * - 403: Show permission denied toast
   * - 404: Console warning only (let components handle missing resources)
   * - 422: Skip handling (let form validation components handle validation errors)
   * - 500+: Show server error toast
   *
   * @param response - The HTTP error response
   */
  async onResponseError({ response }) {
    const status = response.status

    switch (status) {
      case 401:
        localStorage.removeItem('access_token')
        toast.error('Authentication expired. Please log in again.')
        globalThis.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
        break

      case 403:
        toast.error('Permission denied. You do not have access to this resource.')
        break

      case 404:
        console.warn('Resource not found:', response._data)
        break

      case 422:
        break

      default:
        if (status >= 500) {
          toast.error('Server error. Please try again later.')
        }
        break
    }
  },
})

/**
 * Type helper for API response parsing with Zod schemas.
 * Provides type inference for parsed response data.
 */
export type ApiFetchOptions = FetchOptions
