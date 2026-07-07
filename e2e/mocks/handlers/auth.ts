/**
 * Authentication API contract reference.
 *
 * Documents the exact request/response shapes for ctt-server auth endpoints.
 * These shapes are consumed by:
 * - `e2e/utils/auth-helpers.ts` (page.route() mock implementations)
 * - `e2e/fixtures/auth.ts` (canonical test data)
 * - `src/lib/schemas/` (Zod runtime validators)
 *
 * This file previously contained MSW browser worker handlers (`http.post()`,
 * `HttpResponse.json()`). Those were removed because `setupWorker` requires
 * `navigator.serviceWorker` which only exists in a browser context —
 * Playwright's test runner runs in Node.js, making MSW browser workers
 * architecturally incompatible with Playwright E2E tests.
 *
 * The canonical mocking mechanism for Playwright E2E is `page.route()` /
 * `browserContext.route()` (Playwright's first-class API for network
 * interception). See `e2e/utils/auth-helpers.ts` for the working
 * implementations.
 */

import {
  TEST_USER_ID,
  TEST_ACCESS_TOKEN,
  TEST_REFRESH_TOKEN,
  TEST_ACCESS_TOKEN_EXPIRES_IN,
} from '../../fixtures/auth.js'

// ==========================================
// Envelope Shape
// ==========================================

/**
 * RestApiResponse<T> envelope: `{ success, message, data, timestamp, code? }`
 *
 * Matches `RestApiResponseSchema` in `src/lib/schemas/api.schema.ts`.
 * The `success` flag is `true` for success responses; `code` is omitted
 * on success and present on errors.
 */

/** ISO-8601 timestamp used as a deterministic `data.timestamp`. */
export const MOCK_TIMESTAMP = '2026-07-06T00:00:00.000Z'

/**
 * Wraps `data` into a `RestApiResponse<T>` envelope.
 */
export function restOk<T>(data: T, message = 'Success') {
  return {
    success: true,
    message,
    data,
    timestamp: MOCK_TIMESTAMP,
  }
}

// ==========================================
// Endpoint Contracts
// ==========================================

/**
 * `POST /api/v1/auth/login`
 *
 * Request: `{ email: string, password: string, deviceId?: string }`
 * Response: `RestApiResponse<LoginResponse>`
 *   - userId, accessToken, refreshToken, expiresIn, tokenType, termsExpired
 *
 * Failure: email === 'fail@example.com' → 401 AUTH_001
 */
export const LOGIN_SUCCESS_RESPONSE = restOk(
  {
    userId: TEST_USER_ID,
    accessToken: TEST_ACCESS_TOKEN,
    refreshToken: TEST_REFRESH_TOKEN,
    expiresIn: TEST_ACCESS_TOKEN_EXPIRES_IN,
    tokenType: 'Bearer',
    termsExpired: false,
  },
  'Login successful',
)

export const LOGIN_FAILURE_RESPONSE = {
  success: false,
  message: 'Authentication failed',
  data: null,
  timestamp: MOCK_TIMESTAMP,
  code: 'AUTH_001',
}

/**
 * `POST /api/v1/auth/refresh`
 *
 * Response: `RestApiResponse<LoginResponse>` (same shape as login)
 */
export const REFRESH_SUCCESS_RESPONSE = restOk(
  {
    userId: TEST_USER_ID,
    accessToken: TEST_ACCESS_TOKEN,
    refreshToken: TEST_REFRESH_TOKEN,
    expiresIn: TEST_ACCESS_TOKEN_EXPIRES_IN,
    tokenType: 'Bearer',
    termsExpired: false,
  },
  'Token refreshed',
)

/**
 * `POST /api/v1/auth/logout-all`
 *
 * Response: `RestApiResponse<{ success, message, timestamp }>`
 */
export const LOGOUT_ALL_RESPONSE = restOk(
  { success: true, message: 'All sessions revoked', timestamp: MOCK_TIMESTAMP },
  'All sessions revoked',
)

/**
 * `POST /api/v1/auth/register`
 *
 * Response: `RestApiResponse<EmptyResponse>` (`{ success, message, timestamp }`)
 */
export const REGISTER_RESPONSE = restOk(
  { success: true, message: 'User registered successfully', timestamp: MOCK_TIMESTAMP },
  'User registered successfully',
)

/**
 * `GET /api/v1/auth/verify-email?token=…`
 *
 * Response: `RestApiResponse<EmptyResponse>`
 */
export const VERIFY_EMAIL_RESPONSE = restOk(
  { success: true, message: 'Email verified successfully', timestamp: MOCK_TIMESTAMP },
  'Email verified successfully',
)

/**
 * `POST /api/v1/auth/resend-verification`
 *
 * Response: `RestApiResponse<{ success, message, timestamp, idempotentSkip }>`
 */
export const RESEND_VERIFICATION_RESPONSE = restOk(
  { success: true, message: 'Verification email sent', timestamp: MOCK_TIMESTAMP, idempotentSkip: false },
  'Verification email sent',
)

/**
 * `POST /api/v1/auth/forgot-password`
 *
 * Response: `RestApiResponse<EmptyResponse>` (always 200 — anti-enumeration)
 */
export const FORGOT_PASSWORD_RESPONSE = restOk(
  { success: true, message: 'If the email exists, a reset link will be sent', timestamp: MOCK_TIMESTAMP },
  'If the email exists, a reset link will be sent',
)

/**
 * `POST /api/v1/auth/password-reset/confirm`
 *
 * Response: `RestApiResponse<EmptyResponse>`
 */
export const PASSWORD_RESET_CONFIRM_RESPONSE = restOk(
  {
    success: true,
    message: 'Password has been reset successfully. All existing sessions have been terminated.',
    timestamp: MOCK_TIMESTAMP,
  },
  'Password has been reset successfully. All existing sessions have been terminated.',
)

/**
 * `GET /api/v1/config/public`
 *
 * Response: `RestApiResponse<{ termsVersion, captchaSiteKey }>`
 */
export const CONFIG_PUBLIC_RESPONSE = restOk(
  { termsVersion: '1', captchaSiteKey: null },
  'Success',
)

/**
 * `GET /api/v1/users/me`
 *
 * Response: `RestApiResponse<UserProfile>`
 *   - id, email, displayName, emailVerified, emailChangePending,
 *     hasPassword, createdAt, lastLoginAt (nullable), termsVersion
 */
export const USERS_ME_RESPONSE = restOk(
  {
    id: TEST_USER_ID,
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    emailChangePending: false,
    hasPassword: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: MOCK_TIMESTAMP,
    termsVersion: 'v1',
  },
  'Success',
)
