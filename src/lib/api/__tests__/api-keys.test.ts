import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import * as apiKeysApi from '@/lib/api/api-keys'
import { apiFetch } from '@/lib/api/instance'

vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

describe('api-keys API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listApiKeys', () => {
    it('sends GET request to /api/v1/auth/api-keys and returns parsed keys', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'OK',
        timestamp: '2026-07-09T10:30:00Z',
        data: {
          keys: [
            {
              id: 'key-1',
              name: 'Test Key',
              keyPrefix: 'cttak_a1b2c3d4',
              scopes: ['READ'],
              lastUsedAt: null,
              expiresAt: null,
              revokedAt: null,
              createdAt: '2026-07-01T00:00:00Z',
              status: 'ACTIVE',
            },
          ],
        },
      })

      const result = await apiKeysApi.listApiKeys()

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/api-keys', { method: 'GET' })
      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('key-1')
    })
  })

  describe('revokeApiKey', () => {
    it('sends DELETE request to /api/v1/auth/api-keys/{id}', async () => {
      vi.mocked(apiFetch).mockResolvedValue(undefined)

      await apiKeysApi.revokeApiKey('key-uuid-123')

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/api-keys/key-uuid-123', {
        method: 'DELETE',
      })
    })

    it('resolves void on 204 No Content (empty body)', async () => {
      // 204 responses have no body - ofetch resolves with null/undefined.
      // revokeApiKey must NOT attempt to parse this with RestApiResponseSchema.
      vi.mocked(apiFetch).mockResolvedValue(null)

      const result = await apiKeysApi.revokeApiKey('key-uuid-123')

      expect(result).toBeUndefined()
    })

    it('resolves void when ofetch returns undefined (204 empty body)', async () => {
      vi.mocked(apiFetch).mockResolvedValue(undefined)

      const result = await apiKeysApi.revokeApiKey('key-uuid-456')

      expect(result).toBeUndefined()
    })

    it('does not attempt envelope parsing on the response', async () => {
      // The 204 response has no body. If revokeApiKey tried to parse it
      // with RestApiResponseSchema, it would throw a ZodError on null.
      // We verify by passing null (the real 204 shape) and asserting
      // no throw - the function returns void cleanly.
      vi.mocked(apiFetch).mockResolvedValue(null)

      await expect(apiKeysApi.revokeApiKey('key-uuid-789')).resolves.toBeUndefined()
    })

    it('propagates AUTH_010 error from ofetch without catching', async () => {
      const auth010Error = {
        statusCode: 401,
        data: { code: 'AUTH_010', message: 'API key invalid' },
      }
      vi.mocked(apiFetch).mockRejectedValue(auth010Error)

      await expect(apiKeysApi.revokeApiKey('nonexistent-or-foreign-key')).rejects.toEqual(auth010Error)
    })

    it('encodes the key id into the URL path without query params', async () => {
      vi.mocked(apiFetch).mockResolvedValue(undefined)

      await apiKeysApi.revokeApiKey('a1b2c3d4-e5f6-7890-abcd-ef1234567890')

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/api-keys/a1b2c3d4-e5f6-7890-abcd-ef1234567890', {
        method: 'DELETE',
      })
    })
  })
})
