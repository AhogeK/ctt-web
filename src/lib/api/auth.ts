import { apiFetch } from './instance'
import {
  LoginRequestSchema,
  LoginResponseSchema,
  type LoginRequest,
  type LoginResponse,
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
