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
    AUTH_019: 'Terms of service have been updated. Please review and accept the new terms to continue.',

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
