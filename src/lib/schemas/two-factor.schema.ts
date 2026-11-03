import { z } from 'zod'
import { i18n } from '@/i18n'

/** Validation copy resolves through the global instance: this module runs outside a component. */
const t = i18n.global.t

/**
 * The second-step challenge a password login answers with when TOTP is enabled.
 *
 * The server returns it as a `202` whose envelope carries only this object: no access token, no
 * refresh token, and no auth cookie. A client that treats every 2xx as "signed in" would sail on
 * with nothing to show for it, so this shape is the discriminator that makes the branch explicit
 * rather than a lucky guess on a missing token.
 */
export const LoginChallengeSchema = z.object({
  twoFactorRequired: z.literal(true),
  challengeToken: z.string().min(1),
  /** How long the challenge may still be redeemed, in seconds. */
  expiresIn: z.number().int().positive(),
  /**
   * How many passkeys could answer this step.
   *
   * Always present; zero means the page must not offer the alternative, because the account has
   * nothing to answer with and the only way on is the code.
   */
  passkeyCount: z.number().int().nonnegative().default(0),
})

export type LoginChallenge = z.infer<typeof LoginChallengeSchema>

/**
 * What a caller may hand in.
 *
 * `passkeyCount` has a default, so a caller that only knows the token can omit it; the parsed value
 * always carries a number, which is what the page reads.
 */
export type LoginChallengeInput = z.input<typeof LoginChallengeSchema>

/**
 * Request body for the second step — `POST /api/v1/auth/login/2fa`.
 *
 * `code` accepts a TOTP code or an unused recovery code. The server normalises case, spaces and
 * hyphens, so the client sends what the reader typed; trimming here only stops a blank submit.
 */
export const LoginTwoFactorRequestSchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().trim().min(1),
})

export type LoginTwoFactorRequest = z.infer<typeof LoginTwoFactorRequestSchema>

/**
 * Whether the account currently needs a second factor, and how it would prove itself.
 *
 * `hasPassword` decides which reauthentication the setup asks for: a password account proves the
 * password, an OAuth-only account relies on how recently the session was created.
 */
export const TwoFactorStatusSchema = z.object({
  enabled: z.boolean(),
  confirmedAt: z.string().nullable().default(null),
  recoveryCodesRemaining: z.number().int().nonnegative(),
  hasPassword: z.boolean(),
  recentAuthentication: z.boolean(),
})

export type TwoFactorStatus = z.infer<typeof TwoFactorStatusSchema>

/**
 * Unconfirmed setup material.
 *
 * The secret is shown only until it is confirmed, so it travels in this response and nowhere else.
 */
export const StartTotpSetupResponseSchema = z.object({
  secret: z.string().min(1),
  otpauthUri: z.string().min(1),
  digits: z.number().int().positive(),
  period: z.number().int().positive(),
  issuer: z.string().min(1),
  expiresAt: z.string(),
})

export type StartTotpSetupResponse = z.infer<typeof StartTotpSetupResponseSchema>

/** Ten single-use codes, returned exactly once: on confirmation and on regeneration. */
export const RecoveryCodesSchema = z.object({
  recoveryCodes: z.array(z.string().min(1)).length(10),
})

export type RecoveryCodes = z.infer<typeof RecoveryCodesSchema>

/**
 * One second-factor credential, never both.
 *
 * The server treats `code` and `recoveryCode` as mutually exclusive, so the form does too: a
 * request carrying both would be ambiguous about which one is being spent.
 */
export const TwoFactorCredentialSchema = z
  .object({
    code: z.string().trim().min(1).optional(),
    recoveryCode: z.string().trim().min(1).optional(),
  })
  .refine((value) => Boolean(value.code) || Boolean(value.recoveryCode), {
    error: () => t('settings.twoFactor.credentialRequired'),
  })
  .refine((value) => !(value.code && value.recoveryCode), {
    error: () => t('settings.twoFactor.oneCredentialOnly'),
  })

export type TwoFactorCredential = z.infer<typeof TwoFactorCredentialSchema>
