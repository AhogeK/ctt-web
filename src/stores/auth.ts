import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { login as loginApi, refresh as refreshApi } from '@/lib/api/auth'
import type { LoginRequest, LoginResponse } from '@/lib/schemas/auth.schema'

// Promise lock to prevent concurrent refresh requests (Thundering Herd)
let activeRefreshPromise: Promise<string> | null = null

/**
 * localStorage key constants for auth token persistence.
 * Exported for use by API instance to avoid circular dependency with this store.
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ctt_access_token',
  REFRESH_TOKEN: 'ctt_refresh_token',
  USER_ID: 'ctt_user_id',
} as const

/**
 * Authentication store for managing JWT tokens and user session state.
 *
 * Responsibilities:
 * - Store access/refresh tokens from login response
 * - Track authentication status via token presence
 * - Provide token access for API request interceptor
 * - Handle logout by clearing all auth state
 * - Persist tokens to localStorage automatically via useStorage
 */
export const useAuthStore = defineStore('auth', () => {
  const accessToken = useStorage<string | null>(STORAGE_KEYS.ACCESS_TOKEN, null)
  const refreshToken = useStorage<string | null>(STORAGE_KEYS.REFRESH_TOKEN, null)
  const userId = useStorage<string | null>(STORAGE_KEYS.USER_ID, null)

  const tokenExpiry = ref<number | null>(null)

  const isAuthenticated = computed(() => {
    if (!accessToken.value) return false
    if (!tokenExpiry.value) return true // No expiry info means assume valid
    return Date.now() < tokenExpiry.value
  })

  /**
   * Stores authentication data from successful login response.
   * useStorage automatically persists tokens to localStorage.
   * Calculates expiry timestamp from expiresIn seconds.
   */
  function setAuth(response: LoginResponse): void {
    accessToken.value = response.accessToken
    refreshToken.value = response.refreshToken
    userId.value = response.userId
    // Convert expiresIn (seconds) to absolute timestamp (milliseconds)
    tokenExpiry.value = Date.now() + response.expiresIn * 1000
  }

  /**
   * Clears all authentication state on logout or token invalidation.
   * Setting useStorage refs to null automatically removes from localStorage.
   * Resets all refs to null, effectively ending the session.
   */
  function clearAuth(): void {
    accessToken.value = null
    refreshToken.value = null
    userId.value = null
    tokenExpiry.value = null
  }

  /**
   * Performs login by calling API and storing auth data.
   * Throws original error for caller to handle (e.g., toast notification).
   */
  async function login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await loginApi(credentials)
    setAuth(response)
    return response
  }

  /**
   * Refreshes access token using refresh token with concurrency control.
   *
   * Uses Promise deduping pattern to prevent multiple concurrent refresh requests
   * when multiple 401 responses occur simultaneously (Thundering Herd problem).
   *
   * Example: If 3 API calls fail with 401 at the same time, only 1 refresh request
   * is sent to the server. All 3 callers wait for the same promise and receive
   * the same new access token.
   *
   * @returns Promise resolving to the new access token
   * @throws Error if no refresh token available or refresh API fails
   */
  async function refreshAccessToken(): Promise<string> {
    // Guard 1: No refresh token available, clear auth state
    if (!refreshToken.value) {
      clearAuth()
      throw new Error('No refresh token available')
    }

    // Guard 2: If refresh is already in progress, wait for it to complete
    // This prevents concurrent refresh requests (Thundering Herd)
    if (activeRefreshPromise) {
      return activeRefreshPromise
    }

    // Create the refresh promise and store it as a lock
    activeRefreshPromise = (async () => {
      try {
        // Safe to capture here because activeRefreshPromise lock prevents concurrent modifications
        const currentRefreshToken = refreshToken.value!
        const response = await refreshApi({ refreshToken: currentRefreshToken })

        accessToken.value = response.accessToken
        refreshToken.value = response.refreshToken || currentRefreshToken

        return response.accessToken
      } catch (error) {
        // Refresh failed (token expired, blacklisted, or network error)
        // Security: Fail fast and force re-login rather than retrying
        clearAuth()
        throw error
      } finally {
        // Always release the lock after request completes
        activeRefreshPromise = null
      }
    })()

    return activeRefreshPromise
  }

  return {
    accessToken,
    refreshToken,
    userId,
    tokenExpiry,
    isAuthenticated,
    setAuth,
    clearAuth,
    login,
    refreshAccessToken,
  }
})
