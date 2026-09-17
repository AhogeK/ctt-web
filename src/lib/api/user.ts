import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import { DeleteAccountRequestSchema, UserProfileSchema, type UserProfile } from '@/lib/schemas/user.schema'
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

/**
 * Change password for users who already have one.
 *
 * Endpoint: POST /api/v1/users/me/password/change
 * Auth: Bearer JWT (auto-injected by apiFetch interceptor)
 *
 * Both password fields are base64-encoded before sending, matching the
 * transport convention used by setPassword, register, and login.
 *
 * @param data.currentPassword - The user's current password (required)
 * @param data.newPassword - The new password to set (8-64 printable ASCII chars)
 * @returns Parsed response (empty data on success)
 * @throws 401 with USER_014 if current password is incorrect
 * @throws 409 with PASSWORD_SAME_AS_OLD if new password is identical to current
 * @throws 400 with COMMON_003 if new password format is invalid
 */
export async function changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
  const response = await apiFetch<unknown>('/api/v1/users/me/password/change', {
    method: 'POST',
    body: {
      currentPassword: encodeBase64(data.currentPassword),
      newPassword: encodeBase64(data.newPassword),
    },
  })

  RestApiResponseSchema.parse(response)
}

/**
 * Deletes the authenticated user's own account.
 *
 * Endpoint: `DELETE /api/v1/users/me`
 * Authentication: a **web session** only — an API key is rejected with 403 `AUTH_025`, so that a
 * key leaked from the device it was issued for cannot destroy the account.
 *
 * @param password - the account's current password, or `null` for an account that has none
 *   (OAuth-only). A password is still *sent* as a base64 body rather than omitted, because the
 *   body itself is mandatory; `{}` is the payload the server expects for the passwordless case.
 * @returns nothing — the response carries an empty payload
 */
export async function deleteAccount(password: string | null): Promise<void> {
  const body = DeleteAccountRequestSchema.parse(password === null ? {} : { password: encodeBase64(password) })
  const response = await apiFetch<unknown>('/api/v1/users/me', {
    method: 'DELETE',
    body,
  })
  RestApiResponseSchema.parse(response)
}
