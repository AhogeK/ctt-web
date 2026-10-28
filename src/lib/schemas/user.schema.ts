import { z } from 'zod'
import { REGEX_DISPLAY_NAME } from './auth.schema'

/**
 * User profile response schema aligned with ctt-server UserProfileResponse DTO.
 *
 * Endpoint: GET /api/v1/users/me
 * Auth: Bearer JWT
 *
 * Server-side fields (UserProfileResponse.java):
 * - id: UUID, unique user identifier
 * - email: Email address (server normalizes to lowercase)
 * - displayName: User-chosen display name (matches @Pattern regex)
 * - emailVerified: Whether the user's email has been verified
 * - emailChangePending: Whether the user has a pending email change request
 * - hasPassword: Whether the user has a password set (true for email/password users, false for OAuth-only users)
 * - createdAt: Account creation timestamp (ISO 8601)
 * - lastLoginAt: Last successful login timestamp (ISO 8601), nullable on first login
 * - termsVersion: Terms of service version accepted by the user
 *
 * The avatar is NOT included in the server response — it is generated client-side
 * from displayName via `src/lib/utils/avatar.ts` (stringToAvatarColor + getInitials).
 */
export const UserProfileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string().min(1, 'Display name must not be empty'),
  emailVerified: z.boolean(),
  emailChangePending: z.boolean().default(false),
  hasPassword: z.boolean().default(false),
  createdAt: z.iso.datetime(),
  lastLoginAt: z.iso.datetime().nullable().default(null),
  termsVersion: z.string(),
})

export type UserProfile = z.infer<typeof UserProfileSchema>

/**
 * Request body for {@link updateDisplayName} — `PATCH /api/v1/users/me`.
 *
 * The name is validated with the **same** rule the registration form uses, because the server
 * applies the same one: `@NotBlank` plus the shared display-name pattern (2–50 characters, CJK,
 * ASCII letters, digits, underscore, hyphen). A name the server would reject never leaves the
 * browser.
 */
export const UpdateProfileRequestSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name must not be empty')
    .regex(REGEX_DISPLAY_NAME, 'Display name has an unsupported character or length'),
})

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>

/**
 * One login session of the current user — `GET /api/v1/users/me/sessions`.
 *
 * A session is one **login**, not one refresh: the server groups everything one login produced
 * under a single session id. `kind` is `WEB` for a browser session and `PLUGIN` for the tracker.
 * `deviceName` and `ideName` are filled in only for the device-bound kind, and `userAgent` only
 * for a browser session — the server sends the keys either way, so a missing device and an
 * unrecognised field stay distinguishable. `lastUsedAt` is null for a session that was never
 * refreshed, and `current` marks the session the calling token belongs to (always false for a
 * request made with an API key).
 */
export const LoginSessionSchema = z.object({
  id: z.uuid(),
  kind: z.enum(['WEB', 'PLUGIN']),
  deviceName: z.string().nullable().default(null),
  ideName: z.string().nullable().default(null),
  userAgent: z.string().nullable().default(null),
  createdAt: z.iso.datetime(),
  lastUsedAt: z.iso.datetime().nullable().default(null),
  expiresAt: z.iso.datetime().nullable().default(null),
  current: z.boolean(),
})

export type LoginSession = z.infer<typeof LoginSessionSchema>

/**
 * Request body for {@link deleteAccount} — `DELETE /api/v1/users/me`.
 *
 * The body is **required**: the controller declares `@Valid @RequestBody`, so omitting it fails
 * deserialisation before any password logic runs. `{}` is therefore the correct payload for an
 * account that has no password, not an empty request.
 *
 * `password` uses the same **base64** form as every other password this client sends (login,
 * register, reset, email change, set/change): the encoding is a transport convention, not a
 * security measure — real transport security is TLS — and the server treats the value as opaque,
 * so the two ends only have to agree on it. It stays optional because an OAuth-only account has
 * no password to compare: the server skips the check entirely when its stored hash is absent.
 */
export const DeleteAccountRequestSchema = z.object({
  // Server bound is `@Size(max=100)`; a base64 password of the maximum accepted length fits.
  password: z.string().max(100).optional(),
})

export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequestSchema>
