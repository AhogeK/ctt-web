import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import { UserProfileSchema, type UserProfile } from '@/lib/schemas/user.schema'

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
