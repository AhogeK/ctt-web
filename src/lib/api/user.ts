import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import { UserProfileSchema, type UserProfile } from '@/lib/schemas/user.schema'
import { encodeBase64 } from '@/lib/utils'

export type { UserProfile } from '@/lib/schemas/user.schema'

/**
 * Fetch the current authenticated user's profile.
 *
 * Endpoint: GET /api/v1/users/me
 * Auth: Bearer JWT (auto-injected by apiFetch interceptor)
 *
 * @returns Parsed user profile data
 * @throws Zod validation error if response doesn't match expected schema
 * @throws 401 with AUTH_002/AUTH_003 is handled by apiFetch interceptor (token refresh + retry)
 * @throws 401 with terminal auth codes (AUTH_004–009) is handled by apiFetch interceptor
 */
export async function fetchCurrentUser(): Promise<UserProfile> {
  const response = await apiFetch<unknown>('/api/v1/users/me', {
    method: 'GET',
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return UserProfileSchema.parse(wrapped.data)
}

/**
 * Set password for OAuth users who don't have one yet.
 *
 * Endpoint: POST /api/v1/users/me/password/set
 * Auth: Bearer JWT (auto-injected by apiFetch interceptor)
 *
 * @param newPassword - The new password to set (8-64 printable ASCII chars)
 * @returns Parsed response (empty data on success)
 * @throws 409 with USER_015 if user already has a password
 * @throws 400 with COMMON_003 if password format is invalid
 */
export async function setPassword(newPassword: string): Promise<void> {
  const response = await apiFetch<unknown>('/api/v1/users/me/password/set', {
    method: 'POST',
    body: { newPassword: encodeBase64(newPassword) },
  })

  RestApiResponseSchema.parse(response)
}
