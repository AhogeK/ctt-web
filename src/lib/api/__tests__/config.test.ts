import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import { ofetch } from 'ofetch'
import * as configApi from '@/lib/api/config'

vi.mock('ofetch', () => ({
  ofetch: vi.fn<() => Promise<unknown>>(),
}))

describe('config API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPublicConfig', () => {
    it('fetches and parses public config with termsVersion', async () => {
      vi.mocked(ofetch).mockResolvedValue({
        success: true,
        message: 'Public config retrieved successfully',
        data: {
          termsVersion: '1.0.0',
          captchaSiteKey: null,
        },
        timestamp: '2024-01-01T00:00:00Z',
      })

      const result = await configApi.getPublicConfig()

      expect(ofetch).toHaveBeenCalled()
      expect(result.termsVersion).toBe('1.0.0')
      expect(result.captchaSiteKey).toBeNull()
    })

    it('fetches config with captchaSiteKey as a string', async () => {
      vi.mocked(ofetch).mockResolvedValue({
        success: true,
        message: 'Public config retrieved successfully',
        data: {
          termsVersion: '1.0.0',
          captchaSiteKey: '10000000-ffff-ffff-ffff-000000000001',
        },
        timestamp: '2024-01-01T00:00:00Z',
      })

      const result = await configApi.getPublicConfig()

      expect(result.captchaSiteKey).toBe('10000000-ffff-ffff-ffff-000000000001')
    })

    it('fetches config with updated terms version', async () => {
      vi.mocked(ofetch).mockResolvedValue({
        success: true,
        message: 'Public config retrieved successfully',
        data: {
          termsVersion: '2.0.0',
          captchaSiteKey: null,
        },
        timestamp: '2024-01-01T00:00:00Z',
      })

      const result = await configApi.getPublicConfig()

      expect(result.termsVersion).toBe('2.0.0')
    })

    it('rejects response missing captchaSiteKey', async () => {
      vi.mocked(ofetch).mockResolvedValue({
        success: true,
        message: 'Public config retrieved successfully',
        data: {
          termsVersion: '1.0.0',
        },
        timestamp: '2024-01-01T00:00:00Z',
      })

      await expect(configApi.getPublicConfig()).rejects.toThrow(expect.objectContaining({ name: 'ZodError' }))
    })

    it('rejects response missing termsVersion', async () => {
      vi.mocked(ofetch).mockResolvedValue({
        success: true,
        message: 'Public config retrieved successfully',
        data: {},
        timestamp: '2024-01-01T00:00:00Z',
      })

      await expect(configApi.getPublicConfig()).rejects.toThrow(expect.objectContaining({ name: 'ZodError' }))
    })

    it('rejects response with invalid termsVersion type', async () => {
      vi.mocked(ofetch).mockResolvedValue({
        success: true,
        message: 'Public config retrieved successfully',
        data: {
          termsVersion: 123,
        },
        timestamp: '2024-01-01T00:00:00Z',
      })

      await expect(configApi.getPublicConfig()).rejects.toThrow(expect.objectContaining({ name: 'ZodError' }))
    })

    it('propagates network error on connection failure', async () => {
      const networkError = new TypeError('Failed to fetch')
      vi.mocked(ofetch).mockRejectedValue(networkError)

      await expect(configApi.getPublicConfig()).rejects.toThrow('Failed to fetch')
    })

    it('propagates server error (500)', async () => {
      const serverError = new Error('Internal Server Error')
      vi.mocked(ofetch).mockRejectedValue(serverError)

      await expect(configApi.getPublicConfig()).rejects.toThrow('Internal Server Error')
    })

    it('propagates service unavailable error (503)', async () => {
      const serviceError = new Error('Service Unavailable')
      vi.mocked(ofetch).mockRejectedValue(serviceError)

      await expect(configApi.getPublicConfig()).rejects.toThrow('Service Unavailable')
    })
  })
})
