import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import { ApiKeysPayloadSchema, type ApiKey } from '@/lib/schemas/api-key.schema'

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
