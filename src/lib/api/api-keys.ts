import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import {
  ApiKeysPayloadSchema,
  CreateApiKeyResponseSchema,
  type ApiKey,
  type CreateApiKeyRequest,
  type CreateApiKeyResponse,
} from '@/lib/schemas/api-key.schema'

/**
 * Fetches all API keys for the authenticated user.
 *
 * Endpoint: GET /api/v1/auth/api-keys
 *
 * Server returns: RestApiResponse<ApiKeysResponse> where ApiKeysResponse = { keys: ApiKeyResponse[] }
 *   {
 *     "success": true,
 *     "data": { "keys": [ApiKeyResponse, ...] },
 *     "timestamp": "2026-07-09T10:30:00Z"
 *   }
 *
 * @returns Array of API key metadata (raw secret never included)
 * @throws Error if request fails (401 unauthorized, network error)
 */
export async function listApiKeys(): Promise<ApiKey[]> {
  const response = await apiFetch<unknown>('/api/v1/auth/api-keys', {
    method: 'GET',
  })

  const wrapped = RestApiResponseSchema.parse(response)
  const payload = ApiKeysPayloadSchema.parse(wrapped.data)
  return payload.keys
}

/**
 * Creates a new API key for the authenticated user.
 *
 * Endpoint: POST /api/v1/auth/api-keys (rate limited to 10/hour/user)
 *
 * Server returns: RestApiResponse<CreateApiKeyResponse> where
 * CreateApiKeyResponse = { rawKey, apiKey }. The rawKey is returned exactly
 * once; the server persists only its SHA-256 hash and it cannot be retrieved
 * again. Callers must surface it to the user immediately.
 *
 * Known error codes:
 * - 409 AUTH_024: per-user active key limit (20) reached
 * - 429 RATE_LIMIT_001: creation rate limit exceeded
 *
 * @param data - Create request (name, scopes, optional expiresAt)
 * @returns Create response containing the one-time rawKey and key metadata
 * @throws Error if request fails or is rejected by validation
 */
export async function createApiKey(data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
  const response = await apiFetch<unknown>('/api/v1/auth/api-keys', {
    method: 'POST',
    body: data,
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return CreateApiKeyResponseSchema.parse(wrapped.data)
}

/**
 * Revokes (soft-deletes) an API key for the authenticated user.
 *
 * Endpoint: DELETE /api/v1/auth/api-keys/{id} (requires WRITE scope)
 *
 * Server returns HTTP 204 No Content with an EMPTY body on success.
 * The operation is idempotent: revoking an already-revoked key still
 * returns 204 (no error). For this reason the response is NOT parsed
 * with RestApiResponseSchema - a 204 has no body, so ofetch resolves
 * with null/undefined, and any schema parse would fail.
 *
 * BOLA protection: if the key does not exist OR belongs to another user,
 * the server returns 401 with code AUTH_010 ("API key invalid"). Both
 * cases are intentionally identical to prevent UUID enumeration. The
 * interceptor does NOT treat AUTH_010 as a session failure - the error
 * propagates to the caller, which should use `getErrorMessage` to
 * surface the mapped "API key not found or no longer accessible"
 * message (`getErrorMessage` maps AUTH_010 via `mapApiErrorCode`).
 *
 * @param id - UUID of the API key to revoke
 * @throws {{ statusCode: number, data?: { code?: string } }} ofetch HTTP error
 *   (ApiError shape from `@/lib/utils/api-error`) with `data.code === 'AUTH_010'`
 *   if the key does not exist or is not owned by the current user
 */
export async function revokeApiKey(id: string): Promise<void> {
  await apiFetch<unknown>(`/api/v1/auth/api-keys/${id}`, {
    method: 'DELETE',
  })
}

/**
 * Permanently deletes an API key for the authenticated user.
 *
 * Endpoint: DELETE /api/v1/auth/api-keys/{id}/delete
 *
 * Server returns HTTP 204 No Content with an EMPTY body on success.
 * The key is physically removed from storage and disappears from the
 * list; the operation is NOT reversible. Like revokeApiKey, the 204
 * response is not parsed with RestApiResponseSchema (no body).
 *
 * Safety: ACTIVE keys (not revoked, not expired) are rejected with 409
 * AUTH_023 ("Active API keys must be revoked before they can be deleted")
 * so an accidental delete cannot take down a credential still in use.
 * REVOKED and EXPIRED keys delete directly — an expired key can no longer
 * authenticate, so no revoke round trip is required (backend v0.42.0).
 *
 * BOLA protection mirrors revokeApiKey: a missing, foreign, or already
 * deleted key returns 401 AUTH_010, indistinguishable from each other.
 *
 * @param id - UUID of the REVOKED or EXPIRED API key to delete
 * @throws {{ statusCode: number, data?: { code?: string } }} ofetch HTTP error
 *   with `data.code === 'AUTH_010'` if the key does not exist / is not owned
 *   / was already deleted, or `data.code === 'AUTH_023'` (409) if the key is
 *   still active
 */
export async function deleteApiKey(id: string): Promise<void> {
  await apiFetch<unknown>(`/api/v1/auth/api-keys/${id}/delete`, {
    method: 'DELETE',
  })
}
