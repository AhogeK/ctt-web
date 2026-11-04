import { ref, computed, nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { i18n } from '@/i18n'
import {
  login as loginApi,
  loginWithTwoFactorCode,
  refresh as refreshApi,
  logoutAll,
  type LoginResult,
} from '@/lib/api/auth'
import { LoginChallengeSchema, type LoginChallenge, type LoginChallengeInput } from '@/lib/schemas/two-factor.schema'
import { extractErrorCode, getRetryAfterSeconds, isApiError } from '@/lib/utils/api-error'
import { fetchCurrentUser, type UserProfile } from '@/lib/api/user'
import { TERMS_EXPIRED_EVENT } from '@/lib/api/instance'
import type { LoginRequest, LoginResponse, AuthResponse } from '@/lib/schemas/auth.schema'
import { getOrCreateDeviceId } from '@/lib/utils/device'
import { queryClient } from '@/lib/query'
import router from '@/router'
import { RouteNames } from '@/router/route-names'

/**
 * Reads the payload of a JWT access token.
 *
 * Structure: header.payload.signature, with `exp` in seconds and `sub` carrying the account id.
 *
 * @param token - JWT access token
 * @returns The decoded payload, or null when the token is not a readable JWT
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    // JWT uses base64url: the two substituted characters make `atob` throw, and padding is stripped.
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded: unknown = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')))
    return typeof decoded === 'object' && decoded !== null ? (decoded as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/**
 * Decodes a JWT access token to extract the expiry timestamp.
 *
 * @param token - JWT access token
 * @returns Expiry timestamp in milliseconds, or null if decoding fails
 */
function decodeJwtExpiry(token: string): number | null {
  try {
    const decoded = decodeJwtPayload(token)
    if (!decoded) return null
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
  const decoded = decodeJwtPayload(token)
  return typeof decoded?.sub === 'string' ? decoded.sub : null
}

// Promise lock to prevent concurrent refresh requests (Thundering Herd)
let activeRefreshPromise: Promise<string> | null = null

/**
 * Bumped whenever the session is established or ended.
 *
 * A refresh that started under an older value must not write its tokens back: signing out while
 * one is in flight would otherwise restore the previous account's session in the same tab.
 */
let sessionEpoch = 0

// Promise lock to prevent concurrent profile fetch requests
let activeProfileFetchPromise: Promise<UserProfile | null> | null = null

// Timer ID for scheduled silent token refresh
let refreshTimerId: ReturnType<typeof setTimeout> | null = null

/** Lock name shared by every tab of this origin. */
const REFRESH_LOCK = 'ctt-refresh'

/**
 * Storage key for "this browser signed in at some point".
 *
 * Not a credential: a single flag, so a cookie-only visit can still be recognised as a returning
 * one after the access token was cleared or evicted. Removed with the session.
 */
const SESSION_HINT_KEY = 'ctt_session'

/**
 * Whether this browser may still hold a session.
 *
 * @returns true when a previous sign-in left its mark
 */
function hasSessionHint(): boolean {
  try {
    return globalThis.localStorage?.getItem(SESSION_HINT_KEY) === '1'
  } catch {
    return false
  }
}

/** Records that this browser now holds a session, so a cookie-only load can resume it. */
function rememberSessionHint(): void {
  try {
    globalThis.localStorage?.setItem(SESSION_HINT_KEY, '1')
  } catch {
    // Storage refused: the next load simply needs the access token instead.
  }
}

/** Drops the hint along with the session it describes. */
function forgetSessionHint(): void {
  try {
    globalThis.localStorage?.removeItem(SESSION_HINT_KEY)
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

/**
 * Whether a refusal is the server's rate limit rather than a dead session.
 *
 * @param error - the rejection from the refresh call
 * @returns true for `429`
 */
function isRateLimited(error: unknown): boolean {
  return isApiError(error) && error.statusCode === 429
}

/**
 * Runs a refresh with every tab of this origin taking turns.
 *
 * The refresh token is single use: if two tabs spend the same one, the server reads the second as a
 * replay (`AUTH_009`) and revokes all of the account's sessions. `navigator.locks` serializes them,
 * so the second tab waits and then refreshes with the cookie the first one rotated.
 *
 * @param work - the refresh request
 * @returns whatever the request produced
 */
function withRefreshLock<T>(work: () => Promise<T>): Promise<T> {
  const locks = globalThis.navigator?.locks
  // Without the API this degrades to one refresh at a time per tab; the risk it leaves is a second
  // tab spending an already-rotated token, which the server answers by ending the session.
  if (!locks) return work()
  return locks.request(REFRESH_LOCK, () => work())
}

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
  const userId = useStorage<string | null>(STORAGE_KEYS.USER_ID, null)

  // A copy of the refresh token used to live here. It is now only in an httpOnly cookie, so an
  // older build's leftovers are a script-readable credential with no owner: delete on sight.
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  } catch {
    // Storage refused; there is nothing to clean up either.
  }

  const tokenExpiry = ref<number | null>(null)

  /**
   * User profile fields populated by fetchUserProfile() after login.
   * Session-only state (NOT persisted to localStorage) — re-fetched on app init.
   * Avatar is derived client-side from displayName via `src/lib/utils/avatar.ts`
   * (stringToAvatarColor + getInitials) — backend never returns it.
   *
   * Fields: displayName, email, emailVerified, emailChangePending, hasPassword, createdAt,
   * lastLoginAt, termsVersion.
   */
  const displayName = ref<string | null>(null)
  const email = ref<string | null>(null)
  const emailVerified = ref(false)
  const emailChangePending = ref(false)
  const hasPassword = ref(false)
  const createdAt = ref<string | null>(null)
  const lastLoginAt = ref<string | null>(null)
  /** The terms version the account accepted; null until the profile is fetched. */
  const termsVersion = ref<string | null>(null)

  /**
   * Device identifier for login requests and server-side device binding.
   * Generated once via crypto.randomUUID() and persisted to localStorage.
   * NOT cleared on logout — represents physical device, not user session.
   */
  const deviceId = ref<string>(getOrCreateDeviceId())

  /**
   * The second-step challenge a password login is waiting on, or null.
   *
   * Memory-only on purpose: the token is single-use and lives five minutes, none of which a
   * reload can honour — persisting it would put a credential in storage where a stale tab could
   * replay it, and the server tells the client to start over once it is gone.
   */
  const pendingTwoFactor = ref<LoginChallenge | null>(null)

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
    sessionEpoch += 1
    rememberSessionHint()
    accessToken.value = response.accessToken
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
    rememberSessionHint()
    accessToken.value = response.accessToken
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
    sessionEpoch += 1
    forgetSessionHint()
    clearRefreshTimer()
    pendingTwoFactor.value = null
    accessToken.value = null
    userId.value = null
    tokenExpiry.value = null
    // Reset profile fields so AppHeader and other consumers don't display stale data after logout
    displayName.value = null
    email.value = null
    emailVerified.value = false
    emailChangePending.value = false
    hasPassword.value = false
    createdAt.value = null
    lastLoginAt.value = null
    termsVersion.value = null
    // Cached server data belongs to the session that fetched it, and the next sign-in on this
    // tab may be somebody else: without this, a different account is served the previous one's
    // panels until the entries go stale. Every teardown path runs through here — sign-out, a
    // terminal auth error, and account deletion — so this is the one place that has to remember.
    queryClient.clear()
  }

  /**
   * Fetches the authenticated user's profile from /api/v1/users/me and populates the store.
   *
   * Should be called once after login (or on app init if userId exists).
   * Silently fails on error — does not crash the app if profile fetch fails (e.g., transient
   * network issues). The interceptor handles 401 AUTH_002/AUTH_003 (token refresh) and
   * terminal auth codes (AUTH_004–009) before this catch block runs, so the errors that
   * reach here are typically non-auth-related (network failure, schema drift, 500).
   *
   * Uses Promise deduping to prevent multiple concurrent profile fetch requests
   * (mirrors the refreshAccessToken pattern with activeRefreshPromise). If a fetch
   * is already in flight, subsequent calls return the same pending promise.
   *
   * @returns Parsed UserProfile on success, or null if the request failed
   */
  async function fetchUserProfile(): Promise<UserProfile | null> {
    // Dedup: if a profile fetch is already in flight, reuse it
    if (activeProfileFetchPromise) {
      return activeProfileFetchPromise
    }

    activeProfileFetchPromise = (async () => {
      try {
        const profile = await fetchCurrentUser()
        applyProfile(profile)
        return profile
      } catch (error) {
        console.warn('[auth] Failed to fetch user profile:', error)
        return null
      } finally {
        activeProfileFetchPromise = null
      }
    })()

    return activeProfileFetchPromise
  }

  /**
   * Copies a profile into the store.
   *
   * The profile is the server's own view of the account, so every field it carries is copied
   * rather than re-derived — the display name in particular, which the header shows and the
   * avatar initials are derived from.
   *
   * @param profile - the profile as the server returned it
   */
  function applyProfile(profile: UserProfile): void {
    displayName.value = profile.displayName
    email.value = profile.email
    emailVerified.value = profile.emailVerified
    emailChangePending.value = profile.emailChangePending
    hasPassword.value = profile.hasPassword
    createdAt.value = profile.createdAt
    lastLoginAt.value = profile.lastLoginAt
    termsVersion.value = profile.termsVersion
  }

  /**
   * Performs login by calling API and storing auth data.
   * DeviceId is transparently injected from store state — caller only provides email + password.
   * Throws original error for caller to handle (e.g., toast notification).
   */
  async function login(credentials: Omit<LoginRequest, 'deviceId'>): Promise<LoginResult> {
    const payload: LoginRequest = {
      ...credentials,
      deviceId: deviceId.value,
    }
    const result = await loginApi(payload)
    if (result.status === 'two-factor') {
      pendingTwoFactor.value = result.challenge
      return result
    }
    await completeSignIn(result.response)
    return result
  }

  /**
   * Stores the tokens a finished sign-in produced and syncs the profile.
   *
   * Shared by the one-step and the two-step path, so both end in exactly the same state — a
   * second sign-in route that forgot the silent refresh or the profile fetch would be a bug that
   * only shows up on one of them.
   *
   * @param response - the login response carrying the tokens
   */
  async function completeSignIn(response: LoginResponse): Promise<void> {
    // A finished sign-in has nothing left to verify: drop the challenge here rather than in the
    // second-step caller, so a one-step login can never leave a dead one behind.
    pendingTwoFactor.value = null
    // Store tokens even when termsExpired is true so user is authenticated.
    // This allows navigation to dashboard while showing terms dialog.
    setAuth(response)
    if (response.termsExpired) {
      globalThis.dispatchEvent(new CustomEvent(TERMS_EXPIRED_EVENT))
    }
    // UseStorage writes localStorage asynchronously (next tick).
    // Wait one tick so the token is in localStorage before fetching the profile.
    await nextTick()
    void fetchUserProfile()
  }

  /**
   * Redeems the pending second-step challenge and signs in.
   *
   * AUTH_026 means the challenge itself is gone — expired, or already redeemed — so no code the
   * reader types can succeed; it is dropped here and the page sends them back to the password
   * form. A wrong code (AUTH_027) leaves the challenge in place: that one is retryable.
   *
   * @param code - the TOTP code, or an unused recovery code
   * @returns the login response of the completed sign-in
   */
  async function completeTwoFactorLogin(code: string): Promise<LoginResponse> {
    const challenge = pendingTwoFactor.value
    if (!challenge) {
      throw new Error('No two-factor challenge is pending')
    }

    try {
      const response = await loginWithTwoFactorCode({
        challengeToken: challenge.challengeToken,
        code,
      })
      await completeSignIn(response)
      return response
    } catch (error) {
      if (extractErrorCode(error) === 'AUTH_026') {
        pendingTwoFactor.value = null
      }
      throw error
    }
  }

  /**
   * Starts the second step from a challenge that arrived without a password login.
   *
   * The OAuth callback hands the challenge over in the URL fragment, so the page parses and
   * validates it, then parks it here before navigating - the same place the password flow keeps it.
   */
  function setTwoFactorChallenge(challenge: LoginChallengeInput): void {
    pendingTwoFactor.value = LoginChallengeSchema.parse(challenge)
  }

  /** Drops the pending challenge — used when the reader abandons the second step. */
  function clearTwoFactorChallenge(): void {
    pendingTwoFactor.value = null
  }

  /**
   * Completes OAuth login by storing tokens from the OAuth callback redirect.
   *
   * Unlike regular login, OAuth tokens arrive via URL query params (not API response).
   * JWT is decoded to extract userId and expiry since these aren't in the redirect params.
   *
   * @param params - OAuth tokens from callback redirect URL
   */
  function loginWithOAuth(params: { accessToken: string; termsExpired: boolean }): void {
    sessionEpoch += 1
    rememberSessionHint()
    accessToken.value = params.accessToken
    userId.value = decodeJwtUserId(params.accessToken)
    const expiryFromJwt = decodeJwtExpiry(params.accessToken)
    tokenExpiry.value = expiryFromJwt ?? Date.now() + 3600 * 1000
    scheduleSilentRefresh()

    if (params.termsExpired) {
      globalThis.dispatchEvent(new CustomEvent(TERMS_EXPIRED_EVENT))
    }
    // Same localStorage timing issue as login() — wait for sync.
    void nextTick().then(() => fetchUserProfile())
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
   * @throws The refresh failure itself: a dead cookie ends the session, a rate limit schedules a
   * retry and leaves it in place
   */
  async function refreshAccessToken(): Promise<string> {
    // If refresh is already in progress, wait for it: one request serves every caller in this tab.
    if (activeRefreshPromise) {
      return activeRefreshPromise
    }

    activeRefreshPromise = (async () => {
      const epoch = sessionEpoch
      try {
        // Serialized across tabs: the token is single use, and two tabs refreshing at once make the
        // server read the second one as a replay — which revokes every session the account has.
        const response = await withRefreshLock(() => refreshApi())

        // A refresh for an account this tab is no longer signed in as is a stale reply, not a token.
        const refreshedUserId = decodeJwtUserId(response.accessToken)
        if (userId.value && refreshedUserId && refreshedUserId !== userId.value) {
          clearAuth()
          throw new Error('Refresh returned a token for a different account')
        }

        // The session ended while the request was in flight: answering it would resurrect it.
        if (epoch === sessionEpoch) {
          accessToken.value = response.accessToken
          // Without this the store still reports the old expiry and bounces a valid session to login.
          tokenExpiry.value = decodeJwtExpiry(response.accessToken) ?? tokenExpiry.value
        }

        if (response.termsExpired) {
          globalThis.dispatchEvent(new CustomEvent(TERMS_EXPIRED_EVENT))
        }

        return response.accessToken
      } catch (error) {
        // A rate limit is not a dead session: keep it and try again once the window allows. The
        // server's wait is honoured when it sends one, and a minute is enough otherwise.
        if (isRateLimited(error)) {
          scheduleRefreshAfter(getRetryAfterSeconds(error) ?? 60)
          throw error
        }
        // Everything else means the cookie is gone, dead, or replayed: fail closed and sign out.
        clearAuth()
        throw error
      } finally {
        activeRefreshPromise = null
      }
    })()

    return activeRefreshPromise
  }

  /**
   * Retries a refresh after the server's rate-limit window instead of ending the session.
   *
   * @param seconds - the wait the server asked for
   */
  function scheduleRefreshAfter(seconds: number): void {
    clearRefreshTimer()
    refreshTimerId = setTimeout(
      () => {
        void refreshAccessToken()
          .then(() => scheduleSilentRefresh())
          .catch(() => {
            // The next failure decides: this path only carries the rate limit forward.
          })
      },
      Math.max(1, seconds) * 1000,
    )
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
    // The refresh token is an httpOnly cookie, so the page cannot inspect it. A stored access token
    // — or the hint left by a previous sign-in — is the evidence that this browser may hold one.
    if (!accessToken.value && !hasSessionHint()) {
      return false
    }

    try {
      await refreshAccessToken()
      return true
    } catch {
      // `refreshAccessToken` already ends the session for the dead-cookie cases. A throttled one
      // must keep it: clearing here would spend the reader's session on a rate limit, and with the
      // access token gone the next load would not even try.
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

    if (!accessToken.value) return
    if (!tokenExpiry.value) return

    const timeToExpiry = tokenExpiry.value - Date.now()
    if (timeToExpiry <= 0) return

    const FIVE_MINUTES = 5 * 60 * 1000
    const delay = timeToExpiry > FIVE_MINUTES ? timeToExpiry - FIVE_MINUTES : timeToExpiry / 4

    refreshTimerId = setTimeout(async () => {
      try {
        await refreshAccessToken()
        scheduleSilentRefresh()
      } catch (error) {
        // The rate-limited path already queued its own retry; cancelling the timer here would
        // delete it and leave the session with nothing scheduled.
        if (!isRateLimited(error)) clearRefreshTimer()
      }
    }, delay)
  }

  /**
   * Ends the session locally and sends the user to the sign-in page.
   *
   * This is the tail every sign-out path shares: `logout()` reaches it after revoking every
   * session on the server, and the security page reaches it after revoking only the session the
   * user pointed at. Clears the tokens, the profile and the cached server data, then confirms
   * the outcome — without the confirmation the page simply changes and the user cannot tell a
   * deliberate sign-out from a dropped session.
   */
  function signOutLocally(): void {
    clearAuth()
    toast.success(i18n.global.t('app.signedOut'))
    void router.push({ name: RouteNames.LOGIN })
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
      // Shown even when logoutAll failed — the fail-safe contract is that they ARE signed out
      // locally, and reporting the server error here would only add noise.
      signOutLocally()
    }
  }

  return {
    accessToken,
    userId,
    tokenExpiry,
    deviceId,
    displayName,
    email,
    emailVerified,
    emailChangePending,
    hasPassword,
    createdAt,
    lastLoginAt,
    termsVersion,
    isAuthenticated,
    applyProfile,
    setAuth,
    setAuthFromTermsAcceptance,
    clearAuth,
    login,
    completeSignIn,
    loginWithOAuth,
    refreshAccessToken,
    initializeAuth,
    scheduleSilentRefresh,
    logout,
    signOutLocally,
    pendingTwoFactor,
    completeTwoFactorLogin,
    setTwoFactorChallenge,
    clearTwoFactorChallenge,
    fetchUserProfile,
    /**
     * Test-only helper to reset module-scoped timer state.
     * Used in beforeEach to ensure clean timer state between tests.
     */
    __resetTimerForTesting: () => {
      refreshTimerId = null
    },
  }
})
