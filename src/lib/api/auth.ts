import { apiFetch } from './instance'
import { RestApiResponseSchema, type EmptyResponse } from '@/lib/schemas/api.schema'
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RegisterRequestSchema,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
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

  const response = await apiFetch<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: validatedRequest,
  })

  // Validate response structure to ensure type safety
  return LoginResponseSchema.parse(response)
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
 * Refreshes access token using refresh token.
 *
 * Endpoint: POST /api/v1/auth/refresh
 *
 * @returns Parsed response with new accessToken and optionally new refreshToken
 * @throws Zod validation error if response doesn't match expected schema
 * @param params
 */
export async function refresh(params: { refreshToken: string }): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>('/api/v1/auth/refresh', {
    method: 'POST',
    body: params,
  })

  // Validate response structure to ensure type safety
  return LoginResponseSchema.parse(response)
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
  // Validate and strip payload — removes confirmPassword and any extraneous fields
  const cleanPayload = RegisterRequestSchema.parse(data)

  const response = await apiFetch<unknown>('/api/v1/auth/register', {
    method: 'POST',
    body: cleanPayload,
  })

  return RestApiResponseSchema.parse(response)
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

  return RestApiResponseSchema.parse(response)
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

  return RestApiResponseSchema.parse(response)
}
