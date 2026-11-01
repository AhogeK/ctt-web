import { z } from 'zod'

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
})

export type LoginChallenge = z.infer<typeof LoginChallengeSchema>

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
