import { z } from 'zod'

/**
 * One registered passkey, as the security page shows it.
 *
 * The server never returns credential material: only the row id, the reader's label and the facts
 * needed to tell two entries apart. `lastUsedAt` is present and null until the credential signs in.
 */
export const PasskeySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().min(1),
  lastUsedAt: z.string().nullable(),
  transports: z.array(z.string()),
  backupEligible: z.boolean(),
  backupState: z.boolean(),
})

export type Passkey = z.infer<typeof PasskeySchema>

/**
 * Options for `navigator.credentials.get()`.
 *
 * `allowCredentials` is deliberately absent: these are discoverable credentials, and the
 * authenticator — not the page — decides which account signs in. Only the fields the page reads
 * are described; anything richer is passed straight to the browser.
 */
export const PasskeyAssertionOptionsSchema = z.object({
  challenge: z.string().min(1),
  rpId: z.string().min(1),
  timeout: z.number().int().positive().optional(),
  userVerification: z.enum(['required', 'preferred', 'discouraged']).optional(),
  /**
   * The account's own credentials, when the server already knows who is signing in.
   *
   * Absent on the discoverable sign-in (nothing names the reader there); present on the second
   * step, where the challenge belongs to one account and a foreign credential must not answer it.
   */
  allowCredentials: z
    .array(
      z.object({
        type: z.literal('public-key'),
        id: z.string().min(1),
        transports: z.array(z.string()).optional(),
      }),
    )
    .optional(),
})

export type PasskeyAssertionOptions = z.infer<typeof PasskeyAssertionOptionsSchema>

/** Options for `navigator.credentials.create()`, narrowed to what the page inspects. */
export const PasskeyRegistrationOptionsSchema = z.object({
  challenge: z.string().min(1),
  rp: z.object({ id: z.string().min(1), name: z.string().min(1) }),
  user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    displayName: z.string().min(1),
  }),
  pubKeyCredParams: z.array(z.object({ type: z.literal('public-key'), alg: z.number().int() })).min(1),
  timeout: z.number().int().positive().optional(),
  attestation: z.string().optional(),
  /** Existing credentials the authenticator must not create a second copy of; ids are base64url. */
  excludeCredentials: z
    .array(
      z.object({
        type: z.literal('public-key'),
        id: z.string().min(1),
        transports: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  authenticatorSelection: z
    .object({
      // Constrained to what `AuthenticatorSelectionCriteria` accepts, so the value can be handed to
      // `credentials.create()` without a cast.
      residentKey: z.enum(['required', 'preferred', 'discouraged']).optional(),
      userVerification: z.enum(['required', 'preferred', 'discouraged']).optional(),
      requireResidentKey: z.boolean().optional(),
    })
    .optional(),
})

export type PasskeyRegistrationOptions = z.infer<typeof PasskeyRegistrationOptionsSchema>

/**
 * The credential as JSON, ready to POST back.
 *
 * The browser hands back `ArrayBuffer`s; the page converts them to base64url before sending,
 * because the server parses bytes out of JSON.
 */
export const PasskeyCredentialPayloadSchema = z.object({
  id: z.string().min(1),
  rawId: z.string().min(1),
  type: z.literal('public-key'),
  response: z.object({
    clientDataJSON: z.string().min(1),
    attestationObject: z.string().optional(),
    authenticatorData: z.string().optional(),
    signature: z.string().optional(),
    userHandle: z.string().nullable().optional(),
    transports: z.array(z.string()).optional(),
  }),
  clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
})

export type PasskeyCredentialPayload = z.infer<typeof PasskeyCredentialPayloadSchema>

/** Body for registering a credential; the label is optional and the server falls back to `Passkey`. */
export const PasskeyRegistrationRequestSchema = z.object({
  credential: PasskeyCredentialPayloadSchema,
  name: z.string().trim().max(64).optional(),
})

export type PasskeyRegistrationRequest = z.infer<typeof PasskeyRegistrationRequestSchema>

/** Body for renaming; the server trims and bounds the label the same way. */
export const PasskeyRenameRequestSchema = z.object({
  name: z
    .string({ error: () => '' })
    .trim()
    .min(1)
    .max(64),
})

export type PasskeyRenameRequest = z.infer<typeof PasskeyRenameRequestSchema>
