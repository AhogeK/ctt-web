import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { login as loginApi, refresh as refreshApi, logoutAll } from '@/lib/api/auth'
import { TERMS_EXPIRED_EVENT } from '@/lib/api/instance'
import type { LoginRequest, LoginResponse, AuthResponse } from '@/lib/schemas/auth.schema'
import { getOrCreateDeviceId } from '@/lib/utils/device'
import router from '@/router'
import { RouteNames } from '@/router/route-names'

/**
 * Decodes a JWT access token to extract the expiry timestamp.
 * JWT structure: header.payload.signature
 * Payload contains 'exp' field (Unix timestamp in seconds).
 *
 * @param token - JWT access token
 * @returns Expiry timestamp in milliseconds, or null if decoding fails
 */
function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload))
    if (typeof decoded.exp !== 'number') return null
    return decoded.exp * 1000 // Convert seconds to milliseconds
  } catch {
    return null
  }
}

/**
 * Decodes a JWT access token to extract the user ID.
 * JWT payload contains 'sub' field with the user ID (UUID format).
 *
 * @param token - JWT access token
 * @returns User ID string, or null if decoding fails
 */
function decodeJwtUserId(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload))
    if (typeof decoded.sub !== 'string') return null
    return decoded.sub
  } catch {
    return null
  }
}

// Promise lock to prevent concurrent refresh requests (Thundering Herd)
let activeRefreshPromise: Promise<string> | null = null

// Timer ID for scheduled silent token refresh
let refreshTimerId: ReturnType<typeof setTimeout> | null = null

/**
 * Clears the scheduled silent refresh timer if one exists.
 * Called on logout, before scheduling a new timer, or when manually stopping refresh.
 */
export function clearRefreshTimer(): void {
  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId)
    refreshTimerId = null
  }
}

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
 * Session-scoped storage keys (cleared when tab closes)
 * Used for temporary data that shouldn't persist across sessions
 */
export const SESSION_STORAGE_KEYS = {
  PENDING_VERIFICATION_EMAIL: 'ctt_pending_verification_email',
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

  /**
   * Device identifier for login requests and server-side device binding.
   * Generated once via crypto.randomUUID() and persisted to localStorage.
   * NOT cleared on logout — represents physical device, not user session.
   */
  const deviceId = ref<string>(getOrCreateDeviceId())

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
    tokenExpiry.value = Date.now() + response.expiresIn * 1000
    scheduleSilentRefresh()
  }

  /**
   * Stores authentication data from terms acceptance response.
   * AuthResponse lacks userId and expiresIn, so we:
   * - Keep existing userId from localStorage
   * - Decode JWT to extract expiry, or use 1-hour default
   */
  function setAuthFromTermsAcceptance(response: AuthResponse): void {
    accessToken.value = response.accessToken
    refreshToken.value = response.refreshToken
    // userId is already stored from initial login, keep it
    // Decode JWT to get expiry, fallback to 1 hour if decoding fails
    const expiryFromJwt = decodeJwtExpiry(response.accessToken)
    tokenExpiry.value = expiryFromJwt ?? Date.now() + 3600 * 1000
    scheduleSilentRefresh()
  }

  /**
   * Clears all authentication state on logout or token invalidation.
   * Setting useStorage refs to null automatically removes from localStorage.
   * Resets all refs to null, effectively ending the session.
   */
  function clearAuth(): void {
    clearRefreshTimer()
    accessToken.value = null
    refreshToken.value = null
    userId.value = null
    tokenExpiry.value = null
  }

  /**
   * Performs login by calling API and storing auth data.
   * DeviceId is transparently injected from store state — caller only provides email + password.
   * Throws original error for caller to handle (e.g., toast notification).
   */
  async function login(credentials: Omit<LoginRequest, 'deviceId'>): Promise<LoginResponse> {
    const payload: LoginRequest = {
      ...credentials,
      deviceId: deviceId.value,
    }
    const response = await loginApi(payload)
    // Store tokens even when termsExpired is true so user is authenticated
    // This allows navigation to dashboard while showing terms dialog
    setAuth(response)
    if (response.termsExpired) {
      globalThis.dispatchEvent(new CustomEvent(TERMS_EXPIRED_EVENT))
    }
    return response
  }

  /**
   * Completes OAuth login by storing tokens from the OAuth callback redirect.
   *
   * Unlike regular login, OAuth tokens arrive via URL query params (not API response).
   * JWT is decoded to extract userId and expiry since these aren't in the redirect params.
   *
   * @param params - OAuth tokens from callback redirect URL
   */
  function loginWithOAuth(params: { accessToken: string; refreshToken: string; termsExpired: boolean }): void {
    accessToken.value = params.accessToken
    refreshToken.value = params.refreshToken
    userId.value = decodeJwtUserId(params.accessToken)
    const expiryFromJwt = decodeJwtExpiry(params.accessToken)
    tokenExpiry.value = expiryFromJwt ?? Date.now() + 3600 * 1000
    scheduleSilentRefresh()

    if (params.termsExpired) {
      globalThis.dispatchEvent(new CustomEvent(TERMS_EXPIRED_EVENT))
    }
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

        if (response.termsExpired) {
          globalThis.dispatchEvent(new CustomEvent(TERMS_EXPIRED_EVENT))
        }

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

  /**
   * Initializes authentication state on app startup.
   *
   * Professional standard: validates tokens via refresh endpoint on page load.
   * If refresh fails (AUTH_003), clears auth state and returns false.
   * If refresh succeeds, schedules silent refresh and returns true.
   *
   * This ensures users with expired tokens are redirected to login immediately,
   * preventing them from accessing protected routes with invalid tokens.
   *
   * @returns Promise<boolean> - true if authenticated, false if should redirect to login
   */
  async function initializeAuth(): Promise<boolean> {
    if (!refreshToken.value) {
      return false
    }

    try {
      await refreshAccessToken()
      return true
    } catch {
      clearAuth()
      return false
    }
  }

  /**
   * Schedules a silent token refresh before the current token expires.
   *
   * Timing strategy:
   * - If token expires in >5min: refresh 5min before expiry
   * - If token expires in <=5min: refresh at 1/4 of remaining time
   *
   * This ensures the token is refreshed proactively, avoiding 401 errors
   * during user activity while not refreshing too aggressively.
   */
  function scheduleSilentRefresh(): void {
    clearRefreshTimer()

    if (!refreshToken.value) return
    if (!tokenExpiry.value) return

    const timeToExpiry = tokenExpiry.value - Date.now()
    if (timeToExpiry <= 0) return

    const FIVE_MINUTES = 5 * 60 * 1000
    const delay = timeToExpiry > FIVE_MINUTES ? timeToExpiry - FIVE_MINUTES : timeToExpiry / 4

    refreshTimerId = setTimeout(async () => {
      try {
        await refreshAccessToken()
        scheduleSilentRefresh()
      } catch {
        clearRefreshTimer()
      }
    }, delay)
  }

  /**
   * Performs logout by invalidating all refresh tokens on server and clearing local state.
   *
   * Flow:
   * 1. Clear refresh timer to prevent background refresh attempts
   * 2. Call logoutAll API to invalidate all server-side tokens
   * 3. Clear local auth state (tokens, expiry, user ID)
   * 4. Redirect to login page
   *
   * Fail-safe: Even if logoutAll API fails (network error, server down),
   * local state is cleared and user is redirected. This ensures user can always
   * log out locally even if server is unreachable.
   */
  async function logout(): Promise<void> {
    try {
      clearRefreshTimer()
      await logoutAll()
    } catch {
      // Fail-safe: ignore API errors, still clear local state
      // User can always log out locally even if server is unreachable
    } finally {
      clearAuth()
      void router.push({ name: RouteNames.LOGIN })
    }
  }

  return {
    accessToken,
    refreshToken,
    userId,
    tokenExpiry,
    deviceId,
    isAuthenticated,
    setAuth,
    setAuthFromTermsAcceptance,
    clearAuth,
    login,
    loginWithOAuth,
    refreshAccessToken,
    initializeAuth,
    scheduleSilentRefresh,
    logout,
    /**
     * Test-only helper to reset module-scoped timer state.
     * Used in beforeEach to ensure clean timer state between tests.
     */
    __resetTimerForTesting: () => {
      refreshTimerId = null
    },
  }
})
