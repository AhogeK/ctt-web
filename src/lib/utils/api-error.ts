/**
 * Shape of ofetch HTTP error response.
 *
 * ofetch throws an object with these properties when the server returns a non-2xx status.
 */
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
 * @returns Human-readable message in English
 */
export function mapApiErrorCode(code: string): string {
  const messages: Record<string, string> = {
    // Auth errors (backend error codes)
    AUTH_001: 'Invalid email or password. Please check your credentials.',
    AUTH_002: 'Session expired. Please sign in again.',
    AUTH_003: 'This reset link is invalid or has expired. Please request a new one.',
    AUTH_004: 'Account locked due to too many failed attempts.',
    AUTH_005: 'Account suspended. Please contact support.',
    AUTH_006: 'Please verify your email before signing in.',
    AUTH_007: 'Refresh token expired. Please sign in again.',
    AUTH_008: 'Refresh token revoked. Please sign in again.',
    AUTH_009: 'Refresh token reuse detected. Please sign in again.',
    AUTH_010: 'API key not found or no longer accessible.',
    AUTH_019: 'Terms of service have been updated. Please review and accept the new terms to continue.',
    AUTH_014: 'You have reached the maximum of 20 API keys. Revoke an unused key before creating a new one.',

    // CSRF errors
    CSRF_001: 'Your session has expired. The page will refresh automatically.',

    // Security / CAPTCHA errors
    SECURITY_006: 'Captcha verification failed. Please try again.',
    SECURITY_007: 'Please complete the captcha verification.',

    MAIL_005: 'Verification link has expired. Please request a new one.',
    MAIL_006: 'Invalid verification link. Please check your email for the correct link.',

    // Auth errors (legacy string keys for backward compatibility)
    invalid_credentials: 'Invalid email or password. Please check your credentials.',
    user_not_found: 'No account found with this email address.',
    email_not_verified: 'Please verify your email before signing in.',
    token_expired: 'This link has expired. Please request a new one.',
    token_invalid: 'This link is invalid or has already been used.',

    // User errors (USER_XXX from ctt-server)
    USER_001: 'This email is already registered. Please sign in or use a different email.',
    USER_002: 'This email has already been verified. Please proceed to login.',
    USER_007: 'This email has already been verified. Please proceed to login.',
    USER_008: 'Terms of service have been updated. Please review and accept the new terms to continue.',
    USER_009: 'An email change request is already pending. Please check your email or cancel the existing request.',
    USER_010: 'The email change request has expired. Please request a new one.',
    USER_011: 'Invalid email change request. Please try again.',
    USER_013: 'Password verification required. Please provide your current password.',
    USER_014: 'Incorrect password. Please try again.',
    USER_015: 'You already have a password set. Please use the change password option instead.',

    // Password reset errors
    PASSWORD_SAME_AS_OLD: 'New password cannot be the same as your current password.',

    // Common errors
    COMMON_002: 'Too many requests. Please wait a moment before trying again.',
    COMMON_003: 'Invalid input. Please check your entries and try again.',

    // Rate limiting
    RATE_LIMIT_001: 'Too many requests. Please wait a moment before trying again.',
    rate_limit_exceeded: 'Too many requests. Please wait a moment before trying again.',

    // Leaderboard errors (LEADERBOARD_XXX from ctt-server)
    LEADERBOARD_001: 'The leaderboard is currently unavailable. Please try again later.',
    LEADERBOARD_002: 'You are not ranked on the leaderboard yet. Start tracking your coding time to appear.',

    // Generic
    internal_error: 'An unexpected error occurred. Please try again later.',
  }

  return messages[code] ?? code
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
    return 'An unexpected error occurred. Please try again later.'
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
