import { z } from 'zod'
import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import {
  DeleteAccountRequestSchema,
  LoginSessionSchema,
  UpdateProfileRequestSchema,
  UserProfileSchema,
  type LoginSession,
  type UserProfile,
} from '@/lib/schemas/user.schema'
import { encodeBase64 } from '@/lib/utils'

export type { LoginSession, UserProfile } from '@/lib/schemas/user.schema'

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

/**
 * Changes the display name of the authenticated user.
 *
 * Endpoint: PATCH /api/v1/users/me
 * Auth: Bearer JWT (auto-injected by apiFetch interceptor)
 *
 * The server writes the name and then reads the profile back, so the response carries the
 * persisted state — a client syncs its local state from that response and needs no second
 * request. Submitting the name the user already has is a no-op on the server and still returns
 * the profile, so the success path needs no special case.
 *
 * @param displayName - the new display name; validated against the same rule the registration
 *   form uses, which is the rule the server applies
 * @returns the profile as it is now persisted
 * @throws Zod validation error if the name is one the server would reject
 * @throws 403 with AUTH_022 if the account is deactivated
 * @throws 403 with AUTH_020 if the request was made with an API key that lacks the WRITE scope
 */
export async function updateDisplayName(displayName: string): Promise<UserProfile> {
  const body = UpdateProfileRequestSchema.parse({ displayName })
  const response = await apiFetch<unknown>('/api/v1/users/me', {
    method: 'PATCH',
    body,
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return UserProfileSchema.parse(wrapped.data)
}

/**
 * Lists the login sessions of the authenticated user.
 *
 * Endpoint: GET /api/v1/users/me/sessions?limit=
 * Auth: Bearer JWT (auto-injected by apiFetch interceptor)
 *
 * The server sorts the list by last use and does not paginate it, so the client asks for the
 * whole set in one request and renders it in the order it arrived — re-ordering it here would
 * hide the server's notion of "most recent".
 *
 * @param limit - how many sessions to ask for; the server clamps it to 1..100
 * @returns the sessions, newest use first
 * @throws Zod validation error if a session does not match the expected shape
 */
export async function fetchLoginSessions(limit = 100): Promise<LoginSession[]> {
  const response = await apiFetch<unknown>('/api/v1/users/me/sessions', {
    method: 'GET',
    query: { limit },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return z.array(LoginSessionSchema).parse(wrapped.data)
}

/**
 * Revokes one login session of the authenticated user.
 *
 * Endpoint: DELETE /api/v1/users/me/sessions/{sessionId}
 * Auth: Bearer JWT (auto-injected by apiFetch interceptor)
 *
 * The server answers 204 with no body, so there is nothing to parse. Revoking the session the
 * caller is using ends that session — the client treats it as a sign-out.
 *
 * @param sessionId - the session to revoke, as listed by {@link fetchLoginSessions}
 * @throws 404 with COMMON_002 if the session does not exist or belongs to another user
 */
export async function revokeLoginSession(sessionId: string): Promise<void> {
  await apiFetch<unknown>(`/api/v1/users/me/sessions/${sessionId}`, {
    method: 'DELETE',
  })
}

/**
 * Downloads the caller's own data as a JSON document.
 *
 * Endpoint: GET /api/v1/users/me/export?timezoneOffset=
 * Auth: Bearer JWT (auto-injected by apiFetch interceptor)
 *
 * The document is **not parsed**: it is handed back as a blob so it can be written to disk
 * byte for byte, which keeps the session list in it exactly as the plugin exports it. The server
 * measures the caller's timezone from the offset it is given and writes the timestamps in local
 * time, so the offset is not optional.
 *
 * The response is a stream of one JSON document, which the server sets as an attachment; the
 * file name comes from that header, with a name of our own when the server sends none.
 *
 * @returns the document and the file name to save it under
 * @throws 400 with COMMON_003 if the timezone offset is outside ±720 minutes
 * @throws 429 with RATE_LIMIT_001 after three exports in an hour
 */
export async function downloadUserExport(): Promise<{ blob: Blob; filename: string }> {
  let filename: string | null = null

  // Both type arguments: with only the payload type given, ofetch's response type falls back
  // to its "json" default and refuses the option below.
  const blob = await apiFetch<Blob, 'blob'>('/api/v1/users/me/export', {
    method: 'GET',
    query: { timezoneOffset: -new Date().getTimezoneOffset() },
    responseType: 'blob',
    onResponse({ response }) {
      filename = attachmentFileName(response.headers.get('Content-Disposition'))
    },
  })

  return { blob, filename: filename ?? fallbackExportFileName() }
}

/**
 * Reads the file name out of a `Content-Disposition` header.
 *
 * @param header - the header value, or null when the response carries none
 * @returns the file name, or null when the header names no file
 */
function attachmentFileName(header: string | null): string | null {
  if (!header) return null
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header)
  return match ? decodeURIComponent(match[1]!.trim()) : null
}

/** The name to save an export under when the server sends none. */
function fallbackExportFileName(): string {
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  return `ctt-export-${stamp}.json`
}
