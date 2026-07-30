import { z } from 'zod'

/**
 * Enum schema for API key scopes — matches ctt-server ApiKeyScope enum.
 */
export const ApiKeyScopeEnum = z.enum(['READ', 'WRITE', 'SYNC', 'ADMIN'])

/**
 * Enum schema for API key lifecycle status — matches ctt-server ApiKeyStatus enum.
 */
export const ApiKeyStatusEnum = z.enum(['ACTIVE', 'EXPIRED', 'REVOKED'])

/**
 * API key metadata schema — matches ctt-server ApiKeyResponse record.
 *
 * Server returns (ApiKeyResponse.java):
 * - id: UUID format identifier
 * - name: Human-readable label
 * - keyPrefix: Visible (non-secret) prefix (e.g. "cttak_a1b2c3d4")
 * - scopes: Permission scopes granted to the key
 * - lastUsedAt: Most recent auth timestamp (ISO 8601), null if never used
 * - expiresAt: Expiration timestamp (ISO 8601), null if never expires
 * - revokedAt: Revocation timestamp (ISO 8601), null if not revoked
 * - createdAt: Creation timestamp (ISO 8601)
 * - status: Derived status: ACTIVE, REVOKED, or EXPIRED
 */
export const ApiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  keyPrefix: z.string(),
  scopes: z.array(ApiKeyScopeEnum),
  lastUsedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
  createdAt: z.string(),
  status: ApiKeyStatusEnum,
})

/**
 * Wrapper for the list response payload — server wraps keys in an object.
 *
 * Server returns: { "keys": [ApiKeyResponse, ...] }
 */
export const ApiKeysPayloadSchema = z.object({
  keys: z.array(ApiKeySchema),
})

/**
 * Request schema for creating a new API key — matches ctt-server CreateApiKeyRequest.
 *
 * Server expects:
 * - name: NotBlank, max 100 characters
 * - scopes: NotEmpty, at least one scope
 * - expiresAt: Optional Future timestamp (ISO 8601 with offset)
 */
export const CreateApiKeyRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
  scopes: z.array(ApiKeyScopeEnum).min(1, 'At least one scope is required'),
  expiresAt: z.string().optional(),
})

/**
 * Response schema for the create endpoint — matches ctt-server CreateApiKeyResponse record.
 *
 * Server returns: { "rawKey": "...", "apiKey": ApiKeyResponse }
 */
export const CreateApiKeyResponseSchema = z.object({
  rawKey: z.string(),
  apiKey: ApiKeySchema,
})

// ==========================================
// Inferred types
// ==========================================

export type ApiKey = z.infer<typeof ApiKeySchema>
export type ApiKeyScope = z.infer<typeof ApiKeyScopeEnum>
export type ApiKeyStatus = z.infer<typeof ApiKeyStatusEnum>
export type ApiKeysPayload = z.infer<typeof ApiKeysPayloadSchema>
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>
export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>
