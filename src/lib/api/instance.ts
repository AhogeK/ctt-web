import { ofetch, type FetchOptions } from 'ofetch'
import { STORAGE_KEYS, useAuthStore } from '@/stores/auth'
import { injectCsrfHeader } from '@/lib/utils/csrf'
import { toast } from 'vue-sonner'
import router from '@/router'
import { RouteNames } from '@/router/route-names'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Extended fetch options with internal retry flag.
 * Used to prevent infinite refresh loops in the interceptor.
 */
export interface ApiFetchOptions extends FetchOptions {
  __authRetry?: boolean
}

/** Event dispatched on 401 responses that cannot be recovered. Auth guards listen for this to trigger logout. */
export const UNAUTHORIZED_EVENT = 'api:unauthorized'

/** Event dispatched when terms of service need re-acceptance. App.vue listens to show TermsDialog. */
export const TERMS_EXPIRED_EVENT = 'api:terms-expired'

const CSRF_ERROR_CODES = new Set(['CSRF_001'])

let isTerminalAuthHandling = false

/**
 * Auth error codes that cannot be recovered via token refresh and require user intervention.
 *
 * Unlike retryable codes (AUTH_002: Token expired, AUTH_003: Token invalid) which trigger
 * automatic token refresh, these terminal errors require explicit user action:
 * - AUTH_003/AUTH_007/AUTH_008/AUTH_009: Session invalidated → re-login required
 * - AUTH_006: Email not verified → verification flow required
 * - AUTH_004/AUTH_005: Account locked/suspended → support contact required
 *
 * Maps each code to a target route and user-friendly toast message for graceful degradation.
 *
 * @see ctt-server ErrorCode enum for server-side definitions
 */
const TERMINAL_AUTH_CODES: Record<string, { route: string; message: string }> = {
  AUTH_003: { route: RouteNames.LOGIN, message: 'Session expired. Please log in again.' },
  AUTH_007: { route: RouteNames.LOGIN, message: 'Session expired. Please log in again.' },
  AUTH_008: { route: RouteNames.LOGIN, message: 'Session revoked. Please log in again.' },
  AUTH_006: { route: RouteNames.VERIFY_EMAIL, message: 'Please verify your email address to continue.' },
  AUTH_004: { route: RouteNames.LOGIN, message: 'Account is locked. Please contact support.' },
  AUTH_005: { route: RouteNames.LOGIN, message: 'Account is disabled. Please contact support.' },
  AUTH_009: { route: RouteNames.LOGIN, message: 'Security alert: Suspicious activity detected. Please log in again.' },
}

/**
 * Represents a queued request blocked by TERMS_EXPIRED (403 with TERMS_EXPIRED code).
 *
 * When the server rejects a request due to outdated terms acceptance, the request is
 * suspended in this queue rather than failing immediately. After the user accepts the
 * new terms via TermsDialog, all queued requests are replayed automatically via
 * resolveTermsQueue(). If the user declines, all requests are rejected via rejectTermsQueue().
 *
 * This ensures seamless UX - users don't lose in-flight requests during the terms update flow.
 */
interface PendingTermsRequest {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  request: RequestInfo
  options: ApiFetchOptions
}

let isWaitingForTerms = false
const pendingTermsQueue: PendingTermsRequest[] = []

function processTermsQueue(error: Error | null): void {
  for (const p of pendingTermsQueue) {
    if (error) {
      p.reject(error)
    } else {
      // Replay the request
      p.resolve(apiFetch(p.request, p.options))
    }
  }
  pendingTermsQueue.length = 0
}

function getErrorCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null

  // GlobalExceptionHandler returns flat ErrorResponse with code at top level
  if ('code' in data) {
    const code = (data as Record<string, unknown>).code
    if (typeof code === 'string') return code
  }

  // JwtAuthenticationFilter returns wrapped RestApiResponse with code in data.data
  if ('data' in data) {
    const nested = (data as Record<string, unknown>).data
    if (nested && typeof nested === 'object' && 'code' in nested) {
      const code = (nested as Record<string, unknown>).code
      if (typeof code === 'string') return code
    }
  }

  return null
}

function handleTerminalAuthError(errorCode: string): void {
  if (isTerminalAuthHandling) return

  const config = TERMINAL_AUTH_CODES[errorCode]
  if (!config) return

  isTerminalAuthHandling = true

  useAuthStore().clearAuth()
  toast.error(config.message)

  const currentPath = router.currentRoute.value.fullPath
  const redirectPath =
    config.route === RouteNames.LOGIN
      ? `/auth/login?redirect=${encodeURIComponent(currentPath)}`
      : { name: config.route }

  void router.push(redirectPath as Parameters<typeof router.push>[0]).finally(() => {
    isTerminalAuthHandling = false
  })
}

async function handle401Error(
  errorCode: string | null,
  request: RequestInfo,
  options: ApiFetchOptions,
): Promise<Response | undefined> {
  const isRetryable = errorCode === 'AUTH_002' || errorCode === 'AUTH_003'
  const hasRetryFlag = options?.__authRetry

  if (isRetryable && !hasRetryFlag) {
    return await attemptTokenRefresh(request, options)
  }

  if (errorCode && TERMINAL_AUTH_CODES[errorCode]) {
    handleTerminalAuthError(errorCode)
    return undefined
  }

  // AUTH_010 and USER_014 are resource-level 401s: the user IS authenticated,
  // but the requested operation failed a business check (AUTH_010: API key does
  // not exist / belongs to another user; USER_014: current password is
  // incorrect on password change). Unlike a session-level 401, these must NOT
  // clear the access token or dispatch UNAUTHORIZED_EVENT (which would log the
  // user out). Return undefined so ofetch throws the original error to the
  // caller, which surfaces the mapped message via getErrorMessage.
  if (errorCode === 'AUTH_010' || errorCode === 'USER_014') {
    return undefined
  }

  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  globalThis.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
  return undefined
}

async function attemptTokenRefresh(request: RequestInfo, options: ApiFetchOptions): Promise<Response | undefined> {
  try {
    await useAuthStore().refreshAccessToken()
    // __authRetry is an internal flag to prevent infinite refresh loops
    return apiFetch(request, { ...options, __authRetry: true } as Record<string, unknown>) as unknown as
      | Response
      | undefined
  } catch (refreshError) {
    const refreshErrData = (refreshError as { data?: unknown }).data
    const refreshErrCode = refreshErrData ? getErrorCode(refreshErrData) : null

    if (refreshErrCode === 'AUTH_003') {
      handleTerminalAuthError('AUTH_003')
      throw refreshError
    }

    if (refreshErrCode && TERMINAL_AUTH_CODES[refreshErrCode]) {
      handleTerminalAuthError(refreshErrCode)
      return undefined
    }

    if (!refreshErrCode) {
      throw refreshError
    }

    return undefined
  }
}

/**
 * Pre-configured HTTP client with automatic Bearer token injection,
 * token refresh on 401 (AUTH_002/AUTH_003), and terminal auth error routing.
 *
 * - Reads access token from localStorage on every request
 * - On 401 with AUTH_002/AUTH_003: attempts token refresh, then retries
 * - On terminal auth errors (AUTH_004–009): clears auth, shows toast, redirects
 * - On 403 with CSRF code: shows toast and reloads page to obtain fresh CSRF token
 * - Falls back to dispatching UNAUTHORIZED_EVENT for unknown 401 codes
 */
export const apiFetch = ofetch.create({
  baseURL: BASE_URL,
  timeout: 30000,
  credentials: 'include',

  async onRequest({ options }) {
    const headers = new Headers(options.headers)

    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    const method = (options.method ?? 'GET').toString()
    injectCsrfHeader(headers, method)

    options.headers = headers
  },

  // ofetch's FetchHook type doesn't capture the retry pattern (returning ofetch from onResponseError)
  // @ts-expect-error - return type mismatch when retrying request
  onResponseError: async (ctx: {
    response: { status: number; _data?: unknown }
    request: RequestInfo
    options: ApiFetchOptions
  }) => {
    const { response, request, options } = ctx
    const errorCode = getErrorCode(response._data)

    if (response.status === 401) {
      return handle401Error(errorCode, request, options)
    }

    if (response.status === 403) {
      if (errorCode === 'AUTH_019' || errorCode === 'USER_008') {
        // Queue this request for replay after terms acceptance
        const pending = new Promise((resolve, reject) => {
          pendingTermsQueue.push({ resolve, reject, request, options })
        })

        // Only dispatch event on first TERMS_EXPIRED (avoid multiple dialogs)
        if (!isWaitingForTerms) {
          isWaitingForTerms = true
          globalThis.dispatchEvent(new CustomEvent(TERMS_EXPIRED_EVENT))
        }

        return pending
      }

      if (errorCode && CSRF_ERROR_CODES.has(errorCode)) {
        toast.error('Your session has expired. Refreshing...')
        window.location.reload()
        return
      }

      if (errorCode && TERMINAL_AUTH_CODES[errorCode]) {
        handleTerminalAuthError(errorCode)
        return
      }
      console.warn('Permission denied:', response._data)
      return
    }

    if (response.status === 404) {
      console.warn('Resource not found:', response._data)
      return
    }

    if (response.status >= 500) {
      console.error('Server error:', response._data)
    }
  },
})

/**
 * Resolves all pending TERMS_EXPIRED requests by replaying them.
 * Called by TermsDialog after successful terms acceptance.
 */
export function resolveTermsQueue(): void {
  isWaitingForTerms = false
  processTermsQueue(null)
}

/**
 * Rejects all pending TERMS_EXPIRED requests.
 * Called by TermsDialog when user rejects or closes the dialog.
 */
export function rejectTermsQueue(): void {
  isWaitingForTerms = false
  const error = new Error('Terms acceptance required')
  processTermsQueue(error)
}
