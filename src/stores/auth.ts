import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi } from '@/lib/api/auth'
import type { LoginRequest, LoginResponse } from '@/lib/schemas/auth.schema'

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
 * - Persist tokens to localStorage for cross-session persistence
 * - Restore tokens from localStorage on store initialization
 */
export const useAuthStore = defineStore('auth', () => {
  // Access token for API authentication, null when not logged in
  const accessToken = ref<string | null>(null)

  // Refresh token for token renewal flow
  const refreshToken = ref<string | null>(null)

  // User ID from login response
  const userId = ref<string | null>(null)

  // Token expiration timestamp in milliseconds
  const tokenExpiry = ref<number | null>(null)

  // Restore tokens from localStorage on store initialization
  const storedAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID)

  if (storedAccessToken) {
    accessToken.value = storedAccessToken
  }
  if (storedRefreshToken) {
    refreshToken.value = storedRefreshToken
  }
  if (storedUserId) {
    userId.value = storedUserId
  }

  /**
   * Computed property indicating whether user has valid authentication.
   * True when access token exists and hasn't expired.
   */
  const isAuthenticated = computed(() => {
    if (!accessToken.value) return false
    if (!tokenExpiry.value) return true // No expiry info means assume valid
    return Date.now() < tokenExpiry.value
  })

  /**
   * Stores authentication data from successful login response.
   * Persists tokens to localStorage for cross-session persistence.
   * Calculates expiry timestamp from expiresIn seconds.
   */
  function setAuth(response: LoginResponse): void {
    accessToken.value = response.accessToken
    refreshToken.value = response.refreshToken
    userId.value = response.userId
    // Convert expiresIn (seconds) to absolute timestamp (milliseconds)
    tokenExpiry.value = Date.now() + response.expiresIn * 1000

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken)
    localStorage.setItem(STORAGE_KEYS.USER_ID, response.userId)
  }

  /**
   * Clears all authentication state on logout or token invalidation.
   * Removes persisted tokens from localStorage.
   * Resets all refs to null, effectively ending the session.
   */
  function clearAuth(): void {
    accessToken.value = null
    refreshToken.value = null
    userId.value = null
    tokenExpiry.value = null

    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_ID)
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

  return {
    accessToken,
    refreshToken,
    userId,
    tokenExpiry,
    isAuthenticated,
    setAuth,
    clearAuth,
    login,
  }
})
