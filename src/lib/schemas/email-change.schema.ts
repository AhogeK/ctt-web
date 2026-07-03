import { z } from 'zod'

/**
 * Email change form schema.
 *
 * Used by EmailChangeDialog for frontend validation.
 * Password is optional — only required when the backend returns
 * USER_013 error (password verification required for email change).
 *
 * Backend endpoint: POST /api/v1/users/me/email-change
 */
export const EmailChangeSchema = z.object({
  email: z.email('Invalid email format').min(1, 'Email is required'),
  password: z.string().optional(),
})

export type EmailChangeForm = z.infer<typeof EmailChangeSchema>
