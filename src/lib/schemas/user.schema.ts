import { z } from 'zod'

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
