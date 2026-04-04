import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi } from '@/lib/api/auth'
import type { LoginRequest, LoginResponse } from '@/lib/schemas/auth.schema'

/**
 * Authentication store for managing JWT tokens and user session state.
 *
 * Responsibilities:
 * - Store access/refresh tokens from login response
 * - Track authentication status via token presence
 * - Provide token access for API request interceptor
 * - Handle logout by clearing all auth state
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
