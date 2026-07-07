import { http, HttpResponse } from 'msw'
import {
  TEST_USER_ID,
  TEST_ACCESS_TOKEN,
  TEST_REFRESH_TOKEN,
  TEST_ACCESS_TOKEN_EXPIRES_IN,
} from '../../fixtures/auth.js'

/**
 * MSW request handlers for authentication and user profile endpoints.
 *
 * Each endpoint mirrors the contract documented in ctt-server and the Zod
 * schemas in `src/lib/schemas/`. Handlers return REST-wrapped responses
 * (`RestApiResponse<T>` = `{ success, message, data, timestamp, code? }`)
 * so that the existing `RestApiResponseSchema` / `EmptyResponseDataSchema`
 * parsers in `src/lib/schemas/api.schema.ts` accept the mocked data
 * without modification.
 *
 * The handlers are intentionally permissive — they accept any payload
 * shape and always succeed. Tests that need to exercise failure paths
 * should compose additional handlers via `http.post(...)` overrides.
 */

// ==========================================
// Shared Constants
// ==========================================

/** ISO-8601 timestamp used as a deterministic `data.timestamp`. */
const MOCK_TIMESTAMP = '2026-07-06T00:00:00.000Z'

// ==========================================
// Response Builders
// ==========================================

/**
 * Wraps `data` into a `RestApiResponse<T>` envelope that matches
 * `RestApiResponseSchema` (`{ success, message, data, timestamp, code? }`).
 *
 * The `success` flag is hard-coded to `true` and `code` is omitted; both
 * fields are optional in the schema and the absence of `code` is the
 * documented "success" indicator.
 */
function restOk<T>(data: T, message = 'Success') {
  return {
    success: true,
    message,
    data,
    timestamp: MOCK_TIMESTAMP,
  }
}

// ==========================================
// Handlers
// ==========================================

/**
 * `POST /api/v1/auth/login`
 *
 * Returns a `RestApiResponse<LoginResponse>` that satisfies both
 * `RestApiResponseSchema` (outer envelope) and `LoginResponseSchema`
 * (inner data: userId, accessToken, refreshToken, expiresIn, tokenType,
 * termsExpired).
 *
 * Failure path: any payload whose `email` === 'fail@example.com' is
 * rejected with 401 AUTH_001 so login error handling can be exercised
 * without a separate handler override.
 */
const loginHandler = http.post('/api/v1/auth/login', async ({ request }) => {
  const body = (await request.json().catch(() => null)) as { email?: string } | null

  if (body?.email === 'fail@example.com') {
    return HttpResponse.json(
      {
        success: false,
        message: 'Authentication failed',
        data: null,
        timestamp: MOCK_TIMESTAMP,
        code: 'AUTH_001',
      },
      { status: 401 },
    )
  }

  return HttpResponse.json(
    restOk(
      {
        userId: TEST_USER_ID,
        accessToken: TEST_ACCESS_TOKEN,
        refreshToken: TEST_REFRESH_TOKEN,
        expiresIn: TEST_ACCESS_TOKEN_EXPIRES_IN,
        tokenType: 'Bearer',
        termsExpired: false,
      },
      'Login successful',
    ),
  )
})

/**
 * `POST /api/v1/auth/refresh`
 *
 * Returns a fresh `LoginResponse`. Tests that need to confirm a
 * rotated refresh token can compare `refreshToken` between successive
 * calls.
 */
const refreshHandler = http.post('/api/v1/auth/refresh', async () => {
  return HttpResponse.json(
    restOk(
      {
        userId: TEST_USER_ID,
        accessToken: TEST_ACCESS_TOKEN,
        refreshToken: TEST_REFRESH_TOKEN,
        expiresIn: TEST_ACCESS_TOKEN_EXPIRES_IN,
        tokenType: 'Bearer',
        termsExpired: false,
      },
      'Token refreshed',
    ),
  )
})

/**
 * `POST /api/v1/auth/logout-all`
 *
 * Revokes all sessions. Returns an empty data payload — the frontend
 * `logoutAll()` wrapper only checks that the request resolves.
 */
const logoutAllHandler = http.post('/api/v1/auth/logout-all', () => {
  return HttpResponse.json(
    restOk(
      {
        success: true,
        message: 'All sessions revoked',
        timestamp: MOCK_TIMESTAMP,
      },
      'All sessions revoked',
    ),
  )
})

/**
 * `POST /api/v1/auth/register`
 *
 * Returns an `EmptyResponse` shape (`success, message, timestamp`) which
 * matches `EmptyResponseDataSchema` exactly.
 */
const registerHandler = http.post('/api/v1/auth/register', async () => {
  return HttpResponse.json(
    restOk(
      {
        success: true,
        message: 'User registered successfully',
        timestamp: MOCK_TIMESTAMP,
      },
      'User registered successfully',
    ),
  )
})

/**
 * `GET /api/v1/auth/verify-email?token=…`
 *
 * Accepts the verification token as a query parameter (matching the
 * `EmailVerificationController` contract) and returns an `EmptyResponse`.
 */
const verifyEmailHandler = http.get('/api/v1/auth/verify-email', () => {
  return HttpResponse.json(
    restOk(
      {
        success: true,
        message: 'Email verified successfully',
        timestamp: MOCK_TIMESTAMP,
      },
      'Email verified successfully',
    ),
  )
})

/**
 * `POST /api/v1/auth/resend-verification`
 *
 * Returns an `EmptyResponse`. Mirrors the documented idempotent behaviour
 * by including `idempotentSkip: false` so consumers that key off the
 * field don't crash.
 */
const resendVerificationHandler = http.post('/api/v1/auth/resend-verification', () => {
  return HttpResponse.json(
    restOk(
      {
        success: true,
        message: 'Verification email sent',
        timestamp: MOCK_TIMESTAMP,
        idempotentSkip: false,
      },
      'Verification email sent',
    ),
  )
})

/**
 * `POST /api/v1/auth/forgot-password`
 *
 * Returns an `EmptyResponse`. The backend always returns 200 OK due to
 * anti-enumeration protection; the mock mirrors that.
 */
const forgotPasswordHandler = http.post('/api/v1/auth/forgot-password', () => {
  return HttpResponse.json(
    restOk(
      {
        success: true,
        message: 'If the email exists, a reset link will be sent',
        timestamp: MOCK_TIMESTAMP,
      },
      'If the email exists, a reset link will be sent',
    ),
  )
})

/**
 * `POST /api/v1/auth/password-reset/confirm`
 *
 * Returns an `EmptyResponse`. Real backend response is identical in
 * shape to `forgot-password`; the message differs.
 */
const passwordResetConfirmHandler = http.post(
  '/api/v1/auth/password-reset/confirm',
  () => {
    return HttpResponse.json(
      restOk(
        {
          success: true,
          message:
            'Password has been reset successfully. All existing sessions have been terminated.',
          timestamp: MOCK_TIMESTAMP,
        },
        'Password has been reset successfully. All existing sessions have been terminated.',
      ),
    )
  },
)

/**
 * `GET /api/v1/config/public`
 *
 * Returns the public app configuration consumed by `publicConfigLoader`
 * (`src/lib/api/config.ts`). Mirrors the `PublicConfig` shape with
 * `termsVersion: '1'` (the value the auth forms compare against) and
 * `captchaSiteKey: null` so hCaptcha degrades gracefully and forms
 * submit without the widget.
 */
const configPublicHandler = http.get('/api/v1/config/public', () => {
  return HttpResponse.json(
    restOk(
      {
        termsVersion: '1',
        captchaSiteKey: null,
      },
      'Success',
    ),
  )
})

/**
 * `GET /api/v1/users/me`
 *
 * Returns the `UserProfile` shape required by `UserProfileSchema`:
 * id, email, displayName, emailVerified, emailChangePending, hasPassword,
 * createdAt, lastLoginAt (nullable), termsVersion.
 */
const meHandler = http.get('/api/v1/users/me', () => {
  return HttpResponse.json(
    restOk(
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
    ),
  )
})

/**
 * Exported list of authentication-related handlers.
 *
 * Order is not significant — MSW matches by method+URL — but endpoints
 * are listed in the same order as the task description for readability.
 */
export const authHandlers = [
  configPublicHandler,
  loginHandler,
  refreshHandler,
  logoutAllHandler,
  registerHandler,
  verifyEmailHandler,
  resendVerificationHandler,
  forgotPasswordHandler,
  passwordResetConfirmHandler,
  meHandler,
]
