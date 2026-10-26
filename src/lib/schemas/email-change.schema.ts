import { z } from 'zod'
import { i18n } from '@/i18n'

const t = (key: string) => i18n.global.t(key)

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
  email: z.email({ error: () => t('settings.emailChange.invalidEmail') }).min(1, {
    error: () => t('settings.emailChange.emailRequired'),
  }),
  password: z.string().optional(),
})

export type EmailChangeForm = z.infer<typeof EmailChangeSchema>
