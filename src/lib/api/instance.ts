import { ofetch, type FetchOptions } from 'ofetch'
import { STORAGE_KEYS, useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'
import router from '@/router'
import { RouteNames } from '@/router/route-names'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/** Event dispatched on 401 responses that cannot be recovered. Auth guards listen for this to trigger logout. */
export const UNAUTHORIZED_EVENT = 'api:unauthorized'

let isTerminalAuthHandling = false

const TERMINAL_AUTH_CODES: Record<string, { route: string; message: string }> = {
  AUTH_007: { route: RouteNames.LOGIN, message: 'Session expired. Please log in again.' },
  AUTH_008: { route: RouteNames.LOGIN, message: 'Session revoked. Please log in again.' },
  AUTH_006: { route: RouteNames.VERIFY_EMAIL, message: 'Please verify your email address to continue.' },
  AUTH_004: { route: RouteNames.LOGIN, message: 'Account is locked. Please contact support.' },
  AUTH_005: { route: RouteNames.LOGIN, message: 'Account is disabled. Please contact support.' },
  AUTH_009: { route: RouteNames.LOGIN, message: 'Security alert: Suspicious activity detected. Please log in again.' },
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

/**
 * Pre-configured HTTP client with automatic Bearer token injection,
 * token refresh on 401 (AUTH_002/AUTH_003), and terminal auth error routing.
 *
 * - Reads access token from localStorage on every request
 * - On 401 with AUTH_002/AUTH_003: attempts token refresh, then retries
 * - On terminal auth errors (AUTH_004–009): clears auth, shows toast, redirects
 * - Falls back to dispatching UNAUTHORIZED_EVENT for unknown 401 codes
 */
export const apiFetch = ofetch.create({
  baseURL: BASE_URL,
  timeout: 30000,
  credentials: 'include',

  async onRequest({ options }) {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

    if (accessToken) {
      const headers = new Headers(options.headers)
      headers.set('Authorization', `Bearer ${accessToken}`)
      options.headers = headers
    }
  },

  // ofetch's FetchHook type doesn't capture the retry pattern (returning ofetch from onResponseError)
  // @ts-expect-error - return type mismatch when retrying request
  onResponseError: async (ctx: {
    response: { status: number; _data?: unknown }
    request: RequestInfo
    options: RequestInit
  }) => {
    const { response, request, options } = ctx
    const status = response.status
    const errorCode = getErrorCode(response._data)

    switch (status) {
      case 401:
        if (
          (errorCode === 'AUTH_002' || errorCode === 'AUTH_003') &&
          !(options as Record<string, unknown>).__authRetry
        ) {
          try {
            await useAuthStore().refreshAccessToken()
            return apiFetch(request, { ...options, __authRetry: true } as typeof options)
          } catch (refreshError) {
            const refreshErrData = (refreshError as { data?: unknown }).data
            const refreshErrCode = refreshErrData ? getErrorCode(refreshErrData) : null

            if (refreshErrCode === 'AUTH_003') {
              if (isTerminalAuthHandling) return
              isTerminalAuthHandling = true
              useAuthStore().clearAuth()
              toast.error('Session expired. Please log in again.')
              void router.push({ name: RouteNames.LOGIN }).finally(() => {
                isTerminalAuthHandling = false
              })
              return
            }

            if (refreshErrCode && TERMINAL_AUTH_CODES[refreshErrCode]) {
              handleTerminalAuthError(refreshErrCode)
              return
            }

            if (!refreshErrCode) {
              toast.error('Connection failed. Please check your network and try again.')
              return
            }
          }
        }

        if (errorCode && TERMINAL_AUTH_CODES[errorCode]) {
          handleTerminalAuthError(errorCode)
          return
        }

        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        globalThis.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
        break

      case 403:
        if (errorCode && TERMINAL_AUTH_CODES[errorCode]) {
          handleTerminalAuthError(errorCode)
          return
        }

        console.warn('Permission denied:', response._data)
        break

      case 404:
        console.warn('Resource not found:', response._data)
        break

      case 422:
        break

      default:
        if (status >= 500) {
          console.error('Server error:', response._data)
        }
        break
    }
  },
})

export type ApiFetchOptions = FetchOptions
