import { apiFetch } from './instance'
import { RestApiResponseSchema, EmptyResponseDataSchema, type EmptyResponse } from '@/lib/schemas/api.schema'
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RegisterRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  GitHubAuthorizeResponseSchema,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type ForgotPasswordRequest,
  type ResetPasswordRequest,
  type GitHubAuthorizeResponse,
} from '@/lib/schemas/auth.schema'

/**
 * Authenticates user with email, password, and device ID.
 *
 * Endpoint: POST /api/v1/auth/login
 *
 * @param credentials - Login credentials containing email, password, and deviceId
 * @returns Parsed login response with accessToken, refreshToken, userId, and expiresIn
 * @throws Zod validation error if response doesn't match expected schema
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  // Validate request payload before sending
  const validatedRequest = LoginRequestSchema.parse(credentials)

  const response = await apiFetch<unknown>('/api/v1/auth/login', {
    method: 'POST',
    body: validatedRequest,
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return LoginResponseSchema.parse(wrapped.data)
}

/**
 * Logs out user by invalidating the refresh token on server.
 *
 * Endpoint: POST /api/v1/auth/logout
 *
 * @param refreshToken - The refresh token to invalidate
 * @throws Error if logout request fails
 */
export async function logout(refreshToken: string): Promise<void> {
  await apiFetch('/api/v1/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  })
}

/**
 * Logs out user from all devices by invalidating all refresh tokens.
 *
 * Endpoint: POST /api/v1/auth/logout-all
 * Rate limited: 5 requests per minute per user (enforced by backend).
 * On rate limit exceeded, backend returns 429 with retryAfter header.
 *
 * No request body required — user ID is extracted from JWT by backend.
 * Authentication: relies on interceptor to inject Bearer token.
 *
 * @throws Error if logout-all request fails (including 429 rate limit)
 */
export async function logoutAll(): Promise<void> {
  await apiFetch('/api/v1/auth/logout-all', {
    method: 'POST',
  })
}

/**
 * Refreshes access token using refresh token.
 *
 * Endpoint: POST /api/v1/auth/refresh
 *
 * @param params - Object containing the refresh token to use
 * @returns Parsed response with new accessToken and optionally new refreshToken
 * @throws Zod validation error if response doesn't match expected schema
 */
export async function refresh(params: { refreshToken: string }): Promise<LoginResponse> {
  // __authRetry prevents infinite refresh loops in the interceptor
  const response = await apiFetch<unknown>('/api/v1/auth/refresh', {
    method: 'POST',
    body: params,
    __authRetry: true,
  } as Record<string, unknown>)

  const wrapped = RestApiResponseSchema.parse(response)
  return LoginResponseSchema.parse(wrapped.data)
}

/**
 * Registers a new user account.
 *
 * Endpoint: POST /api/v1/auth/register
 *
 * The request payload is validated against RegisterRequestSchema before sending,
 * which strips any extraneous fields (e.g., confirmPassword) and ensures only
 * API-contract fields are transmitted.
 *
 * @param data - Registration payload containing email, displayName, and password
 * @returns Parsed API response with success status and message
 * @throws Zod validation error if request or response doesn't match expected schema
 */
export async function register(data: RegisterRequest): Promise<EmptyResponse> {
  const cleanPayload = RegisterRequestSchema.parse(data)

  const response = await apiFetch<unknown>('/api/v1/auth/register', {
    method: 'POST',
    body: cleanPayload,
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return EmptyResponseDataSchema.parse(wrapped.data)
}

/**
 * Verifies user email address with the provided token.
 *
 * Endpoint: GET /api/v1/auth/verify-email?token=xxx
 *
 * Note: Backend uses GET with query parameter (not POST). The token is extracted
 * from the email verification link and passed as a query parameter.
 *
 * @param token - Email verification token from the verification email link
 * @returns Parsed API response with success status and message
 * @throws Zod validation error if response doesn't match expected schema
 */
export async function verifyEmail(token: string): Promise<EmptyResponse> {
  const response = await apiFetch<unknown>('/api/v1/auth/verify-email', {
    method: 'GET',
    query: { token },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return EmptyResponseDataSchema.parse(wrapped.data)
}

/**
 * Resends the email verification message to the specified address.
 *
 * Endpoint: POST /api/v1/auth/resend-verification
 * Rate limited: 3 requests per minute per email (enforced by backend).
 *
 * @param email - The email address to resend verification to
 * @returns Parsed API response with success status and message
 * @throws Zod validation error if request or response doesn't match expected schema
 */
export async function resendVerification(email: string): Promise<EmptyResponse> {
  const response = await apiFetch<unknown>('/api/v1/auth/resend-verification', {
    method: 'POST',
    body: { email },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return EmptyResponseDataSchema.parse(wrapped.data)
}

/**
 * Requests a password reset email for the given address.
 *
 * Endpoint: POST /api/v1/auth/forgot-password
 * Rate limited: 3 requests per 10 minutes per email, 30 per hour per IP.
 *
 * Anti-enumeration: Backend always returns 200 OK regardless of whether the
 * email exists in the database. This prevents attackers from determining which
 * emails are registered.
 *
 * @param data - Object containing the email address to send the password reset link to
 * @throws Zod validation error if request doesn't match expected schema
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<EmptyResponse> {
  const cleanPayload = ForgotPasswordRequestSchema.parse(data)

  const response = await apiFetch<unknown>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: cleanPayload,
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return EmptyResponseDataSchema.parse(wrapped.data)
}

/**
 * Confirms and executes a password reset using the token from the email link.
 *
 * Endpoint: POST /api/v1/auth/password-reset/confirm
 * Rate limited: 15 requests per 10 minutes per IP.
 *
 * On success, all existing sessions for the user are terminated.
 *
 * @param data - Reset payload containing token and newPassword
 * @throws Zod validation error if request payload doesn't match expected schema
 */
export async function confirmPasswordReset(data: ResetPasswordRequest): Promise<void> {
  const cleanPayload = ResetPasswordRequestSchema.parse(data)
  await apiFetch('/api/v1/auth/password-reset/confirm', {
    method: 'POST',
    body: cleanPayload,
  })
}

/**
 * Accepts the latest terms of service.
 *
 * Endpoint: POST /api/v1/terms/accept
 *
 * @returns Parsed auth response with new access token and refresh token
 * @throws Zod validation error if response doesn't match expected schema
 */
export async function acceptTerms(): Promise<LoginResponse> {
  const response = await apiFetch<unknown>('/api/v1/auth/terms/accept', {
    method: 'POST',
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return LoginResponseSchema.parse(wrapped.data)
}

/**
 * Gets the GitHub OAuth authorization URL.
 *
 * Endpoint: GET /api/v1/auth/oauth/github/authorize
 *
 * Public endpoint — no authentication required.
 * Rate limited: 30 requests per hour per IP.
 *
 * The returned authUrl contains a one-time state parameter for CSRF protection.
 * Frontend should redirect the user to this URL immediately — do not cache.
 *
 * @returns Object containing the GitHub authorization URL
 * @throws Zod validation error if response doesn't match expected schema
 */
export async function getGitHubAuthorizeUrl(): Promise<GitHubAuthorizeResponse> {
  const response = await apiFetch<unknown>('/api/v1/auth/oauth/github/authorize', {
    method: 'GET',
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return GitHubAuthorizeResponseSchema.parse(wrapped.data)
}
