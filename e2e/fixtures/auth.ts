/**
 * Shared test fixtures for authentication-related E2E tests.
 *
 * Each fixture mirrors the exact request/response shape that
 * `ctt-server` returns, so assertions and Zod parsers in
 * `src/lib/schemas/auth.schema.ts` and `src/lib/schemas/user.schema.ts`
 * accept them without modification.
 *
 * Reuse the same identifiers across fixtures — the canonical test
 * user (`TEST_USER_ID`) and the canonical email (`TEST_USER_EMAIL`)
 * are imported by handler modules to keep handler responses in sync
 * with what tests expect.
 */

// ==========================================
// Identifiers
// ==========================================

/**
 * Stable UUID for the canonical test user. Mirrors the value returned
 * by the default `/auth/login` and `/users/me` handlers so that a
 * session opened by login resolves to the same identity on the
 * profile endpoint.
 */
export const TEST_USER_ID = '11111111-1111-4111-8111-111111111111'

/** Canonical email address used for the default test user. */
export const TEST_USER_EMAIL = 'test@example.com'

/**
 * Email address that the default `/auth/login` handler rejects with
 * 401 AUTH_001. Tests that exercise the failure path post this value
 * and assert that the login form surfaces the "Invalid credentials"
 * error.
 */
export const INVALID_CREDENTIALS_EMAIL = 'fail@example.com'

/** Canonical display name for the default test user. */
export const TEST_USER_DISPLAY_NAME = 'Test User'

/** Stable tokens returned by the default login/refresh handlers. */
export const TEST_ACCESS_TOKEN = 'mock-access-token-eyJhbGciOiJIUzI1NiJ9.payload.signature'
export const TEST_REFRESH_TOKEN = 'mock-refresh-token-d4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9'

/** Access-token lifetime in seconds — matches `ACCESS_TOKEN_EXPIRES_IN_SECONDS` in handlers/auth.ts. */
export const TEST_ACCESS_TOKEN_EXPIRES_IN = 3600

// ==========================================
// Credentials
// ==========================================

/**
 * Credentials for the default test user. Use these in E2E tests that
 * need to drive the login form to a successful state.
 *
 * Note: the value of `password` is the **plaintext** entered by the
 * user. The frontend `login()` wrapper (`src/lib/api/auth.ts`)
 * base64-encodes the password before posting; the mock handler
 * accepts any payload so tests don't need to pre-encode.
 */
export const TEST_USER_CREDENTIALS = {
  email: TEST_USER_EMAIL,
  password: 'Password123!',
  deviceId: 'test-device-001',
} as const

/**
 * Credentials guaranteed to fail. The default `/auth/login` handler
 * short-circuits on this email and returns 401 AUTH_001.
 */
export const INVALID_CREDENTIALS = {
  email: INVALID_CREDENTIALS_EMAIL,
  password: 'wrong-password',
  deviceId: 'test-device-001',
} as const

// ==========================================
// Registration Payload
// ==========================================

/**
 * Default payload for `POST /api/v1/auth/register`.
 *
 * `termsVersion` is required by the backend but is injected by the
 * frontend `RegisterView` from `publicConfig` — tests should provide
 * the value their app config is expected to return.
 */
export const TEST_REGISTER_PAYLOAD = {
  email: 'newuser@example.com',
  displayName: 'New User',
  password: 'Password123!',
  termsVersion: 'v1',
} as const

// ==========================================
// Expected Responses
// ==========================================

/**
 * Canonical test user object. Composed from the identifier primitives above
 * so E2E helpers (`mockAuthApis`, `loginViaForm`, …) can reference a
 * single source of truth. Field shape mirrors the user-facing parts of
 * `LoginResponse` + `UserProfileResponse`.
 */
export const TEST_USER = {
  id: TEST_USER_ID,
  email: TEST_USER_EMAIL,
  displayName: TEST_USER_DISPLAY_NAME,
  emailVerified: true,
  hasPassword: true,
  termsVersion: 'v1',
} as const

/**
 * Canonical token set returned by `POST /api/v1/auth/login` and
 * `POST /api/v1/auth/refresh`. Field order matches the ctt-server
 * `LoginResponse` record. Shared by all auth E2E helpers.
 */
export const TEST_TOKENS = {
  userId: TEST_USER_ID,
  accessToken: TEST_ACCESS_TOKEN,
  refreshToken: TEST_REFRESH_TOKEN,
  expiresIn: TEST_ACCESS_TOKEN_EXPIRES_IN,
  tokenType: 'Bearer' as const,
  termsExpired: false,
} as const

/**
 * Expected success body returned by `POST /api/v1/auth/login` and
 * `POST /api/v1/auth/refresh`. Field order matches the ctt-server
 * `LoginResponse` record.
 */
export const TEST_LOGIN_RESPONSE = TEST_TOKENS

/**
 * Expected success body returned by `GET /api/v1/users/me`. Field
 * order matches the ctt-server `UserProfileResponse` record and the
 * frontend `UserProfileSchema`.
 */
export const TEST_USER_PROFILE = {
  id: TEST_USER_ID,
  email: TEST_USER_EMAIL,
  displayName: TEST_USER_DISPLAY_NAME,
  emailVerified: true,
  emailChangePending: false,
  hasPassword: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '2026-07-06T00:00:00.000Z',
  termsVersion: 'v1',
} as const

/**
 * Expected `EmptyResponse` shape returned by registration, password
 * reset, and email verification endpoints. Mirrors
 * `EmptyResponseDataSchema` in `src/lib/schemas/api.schema.ts`.
 */
export const TEST_EMPTY_RESPONSE = {
  success: true,
  message: 'Success',
  timestamp: '2026-07-06T00:00:00.000Z',
} as const
