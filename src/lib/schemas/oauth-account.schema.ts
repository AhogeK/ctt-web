import { z } from 'zod'

/**
 * OAuth account binding schema for a single third-party provider.
 *
 * Mirrors ctt-server OAuthAccountBinding DTO (1e333dd). Sensitive fields
 * (accessToken, refreshToken, providerUserId) are intentionally excluded
 * to keep tokens from leaking into the client bundle or session logs.
 *
 * Server returns (OAuthAccountBinding.java):
 * - provider: OAuth provider identifier (e.g., "github")
 * - providerLogin: User's login handle on the provider (nullable)
 * - providerEmail: User's email on the provider (nullable)
 * - createdAt: Binding creation timestamp (ISO 8601)
 * - updatedAt: Last refresh or update timestamp (ISO 8601)
 *
 * provider is a free-form string at the transport layer (matching the
 * server-side OAuthProvider.getValue() lowercase serialization). UI layer
 * is responsible for mapping known providers to icons/labels via a
 * switch/case — do not hardcode the only supported value.
 */
export const OAuthAccountBindingSchema = z.object({
  // Provider identifier (lowercase, e.g. "github"). Future providers
  // (google, gitlab) will be added server-side without a schema bump.
  provider: z.string().min(1, 'Provider is required'),
  // Login handle on the provider side (nullable per server contract).
  // .default(null): backend omits null fields (Jackson non_null), so these
  // keys arrive as undefined — nullable() alone would throw.
  providerLogin: z.string().nullable().default(null),
  // Email on the provider side (nullable per server contract).
  providerEmail: z.string().nullable().default(null),
  // Binding creation timestamp in ISO 8601 format.
  createdAt: z.iso.datetime(),
  // Last refresh/update timestamp in ISO 8601 format.
  updatedAt: z.iso.datetime(),
})

/**
 * Inner data schema for the GET /api/v1/auth/oauth/accounts endpoint.
 *
 * Wraps the list of OAuth account bindings. Returned inside the
 * RestApiResponse envelope (see api.schema.ts), so this schema validates
 * only the `data` field payload.
 */
export const OAuthAccountsResponseDataSchema = z.object({
  // All OAuth account bindings for the current user. Empty array when
  // the user has no bindings.
  accounts: z.array(OAuthAccountBindingSchema),
})

// Export inferred types for use in API layer and components
export type OAuthAccountBinding = z.infer<typeof OAuthAccountBindingSchema>
export type OAuthAccountsResponseData = z.infer<typeof OAuthAccountsResponseDataSchema>
