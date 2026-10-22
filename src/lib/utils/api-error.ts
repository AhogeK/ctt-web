/**
 * Shape of ofetch HTTP error response.
 *
 * ofetch throws an object with these properties when the server returns a non-2xx status.
 */
import { i18n } from '@/i18n'

export interface ApiError {
  statusCode: number
  statusMessage?: string
  message?: string
  error?: string
  data?: unknown
}

/**
 * Structured API error response from the backend.
 *
 * Matches the RestApiResponseSchema shape used across auth endpoints.
 */
export interface ApiErrorResponse {
  success: boolean
  message: string
  error?: string
}

/**
 * Check if an unknown error is an API error response from ofetch.
 *
 * ofetch throws objects with `statusCode` on non-2xx responses.
 * This type guard narrows `unknown` to `ApiError` safely.
 *
 * @param error - The error to check
 * @returns true if error has the shape of an ofetch HTTP error
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as ApiError).statusCode === 'number'
  )
}

/**
 * Extract the backend error code from an unknown error object.
 *
 * The backend wraps every error response with `{ code: string }` inside
 * the `data` field (e.g. ofetch throws with `.data.code === 'AUTH_018'`).
 * Callers use the code to short-circuit on known categories (e.g. AUTH_001
 * is handled by the global apiFetch interceptor) and to look up a
 * user-friendly message.
 *
 * Returns `undefined` if the error does not match the expected shape —
 * callers should treat that as "no code available" and apply the
 * default error path.
 *
 * @param error - The error to inspect
 * @returns The backend error code, or `undefined` when unavailable
 */
export function extractErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const data = (error as { data?: { code?: string } }).data
  return data?.code
}

/**
 * Map backend error codes to user-friendly messages.
 *
 * Covers known error codes from ctt-server auth endpoints.
 * Falls back to the code itself for unmapped codes.
 *
 * @param code - Backend error code (e.g. "USER_001", "invalid_credentials")
 * @returns Localized user-facing message
 */
export function mapApiErrorCode(code: string): string {
  const messages: Record<string, string> = {
    AUTH_001: 'api.errors.auth001',
    AUTH_002: 'api.errors.auth002',
    AUTH_003: 'api.errors.auth003',
    AUTH_004: 'api.errors.auth004',
    AUTH_005: 'api.errors.auth005',
    AUTH_006: 'api.errors.auth006',
    AUTH_007: 'api.errors.auth007',
    AUTH_008: 'api.errors.auth008',
    AUTH_009: 'api.errors.auth009',
    AUTH_010: 'api.errors.auth010',
    AUTH_019: 'api.errors.auth019',
    AUTH_024: 'api.errors.auth024',
    AUTH_023: 'api.errors.auth023',
    CSRF_001: 'api.errors.csrf001',
    SECURITY_006: 'api.errors.security006',
    SECURITY_007: 'api.errors.security007',
    MAIL_005: 'api.errors.mail005',
    MAIL_006: 'api.errors.mail006',
    invalid_credentials: 'api.errors.invalidcredentials',
    user_not_found: 'api.errors.usernotfound',
    email_not_verified: 'api.errors.emailnotverified',
    token_expired: 'api.errors.tokenexpired',
    token_invalid: 'api.errors.tokeninvalid',
    USER_001: 'api.errors.user001',
    USER_002: 'api.errors.user002',
    USER_007: 'api.errors.user007',
    USER_008: 'api.errors.user008',
    USER_009: 'api.errors.user009',
    USER_010: 'api.errors.user010',
    USER_011: 'api.errors.user011',
    USER_013: 'api.errors.user013',
    USER_014: 'api.errors.user014',
    AUTH_025: 'api.errors.auth025',
    USER_015: 'api.errors.user015',
    COMMON_002: 'api.errors.common002',
    COMMON_003: 'api.errors.common003',
    DEVICE_001: 'api.errors.device001',
    RATE_LIMIT_001: 'api.errors.ratelimit001',
    rate_limit_exceeded: 'api.errors.ratelimitexceeded',
    LEADERBOARD_001: 'api.errors.leaderboard001',
    LEADERBOARD_002: 'api.errors.leaderboard002',
    internal_error: 'api.errors.internalerror',
  }

  const key = messages[code]
  return key ? i18n.global.t(key) : code
}

/**
 * Convert any error to a user-friendly message string.
 *
 * Handles three error categories:
 * 1. API errors (ofetch HTTP errors) - extracts message or maps error code
 * 2. Error instances - uses error.message
 * 3. Unknown errors - returns a generic fallback message
 *
 * @param error - The error to convert
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const data = error.data as { code?: string; message?: string } | undefined
    if (data?.code) {
      return mapApiErrorCode(data.code)
    }
    if (data?.message) {
      return data.message
    }
    return i18n.global.t('api.errors.internalerror')
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred. Please try again later.'
}

/**
 * Read the HTTP `Retry-After` response header (RFC 7231) from an ofetch error.
 *
 * The header may be either a delta-seconds integer or an HTTP-date. Past
 * dates and unparseable values fall through to `null` so the caller can try
 * the next source. The function is fully defensive: any unexpected shape or
 * throwing getter resolves to `null`.
 *
 * @param error - The error thrown by ofetch (or any unknown value)
 * @returns Whole seconds to wait, or `null` when unavailable/invalid
 */
function readRetryAfterHeader(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null
  const response = (error as { response?: unknown }).response
  if (!response || typeof response !== 'object') return null
  const headers = (response as { headers?: unknown }).headers
  if (!headers || typeof headers !== 'object') return null
  const get = (headers as { get?: unknown }).get
  if (typeof get !== 'function') return null

  let raw: unknown
  try {
    raw = (get as (name: string) => unknown).call(headers, 'retry-after')
  } catch {
    return null
  }
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (trimmed === '') return null

  // delta-seconds per RFC 7231 (non-negative integer). Already a whole number,
  // so floor is a no-op; guard against 0 since a zero countdown is meaningless.
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed)
    return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : null
  }

  // HTTP-date fallback. Round UP the remaining time so we never tell the user
  // to retry before the server actually allows it.
  const dateMs = Date.parse(trimmed)
  if (Number.isNaN(dateMs)) return null
  const remainingMs = dateMs - Date.now()
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : null
}

/**
 * Read a `retryAfter` ISO-8601 Instant from the parsed error body.
 *
 * Some ctt-server endpoints embed `retryAfter` (an Instant such as
 * `"2026-08-07T10:00:00Z"`) inside the `data` payload. ofetch exposes the
 * parsed body at `error.data`, so this reads `error.data.retryAfter`.
 * Past instants and unparseable values fall through to `null`.
 *
 * @param error - The error thrown by ofetch (or any unknown value)
 * @returns Whole seconds to wait, or `null` when unavailable/invalid
 */
function readBodyRetryAfter(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null
  const data = (error as { data?: unknown }).data
  if (!data || typeof data !== 'object') return null
  const raw = (data as { retryAfter?: unknown }).retryAfter
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const ms = Date.parse(trimmed)
  if (Number.isNaN(ms)) return null
  const remainingMs = ms - Date.now()
  if (remainingMs <= 0) return null
  return Math.ceil(remainingMs / 1000)
}

/**
 * Extract the seconds remaining before a rate-limited request should be retried.
 *
 * Used to render a countdown on 429 responses. Sources are checked in priority
 * order and the first usable value wins:
 *
 * 1. HTTP `Retry-After` response header (RFC 7231) - either a delta-seconds
 *    integer or an HTTP-date. Past dates and unparseable values fall through.
 * 2. `retryAfter` field on the parsed error body (ISO-8601 Instant, e.g.
 *    `"2026-08-07T10:00:00Z"`) - the remaining seconds until that instant,
 *    rounded up. Past instants fall through.
 * 3. `null` when neither source yields a usable value.
 *
 * The function is fully defensive: any unexpected shape (non-object error,
 * missing response, malformed header, throwing getter) resolves to `null`
 * rather than throwing. Callers should treat `null` as "no timing info; use
 * the static mapped message".
 *
 * @param error - The error thrown by ofetch (or any unknown value)
 * @returns Whole seconds to wait, or `null` when unavailable/invalid
 */
export function getRetryAfterSeconds(error: unknown): number | null {
  const headerSeconds = readRetryAfterHeader(error)
  if (headerSeconds !== null) return headerSeconds
  return readBodyRetryAfter(error)
}
