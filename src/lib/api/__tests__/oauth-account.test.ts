import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import * as oauthAccountApi from '@/lib/api/oauth-account'
import { apiFetch } from '@/lib/api/instance'

vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

describe('oauth-account API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchLinkedOAuthAccounts', () => {
    it('sends GET request to /api/v1/auth/oauth/accounts', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Operation successful',
        timestamp: '2026-06-28T12:00:00Z',
        data: { accounts: [] },
      })

      await oauthAccountApi.fetchLinkedOAuthAccounts()

      expect(apiFetch).toHaveBeenCalledTimes(1)
      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/oauth/accounts', {
        method: 'GET',
      })
    })

    it('returns parsed data with a single GitHub binding', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Operation successful',
        timestamp: '2026-06-28T12:00:00Z',
        data: {
          accounts: [
            {
              provider: 'github',
              providerLogin: 'octocat',
              providerEmail: 'octocat@example.com',
              createdAt: '2026-04-22T10:00:00Z',
              updatedAt: '2026-06-28T12:00:00Z',
            },
          ],
        },
      })

      const result = await oauthAccountApi.fetchLinkedOAuthAccounts()

      expect(result.accounts).toHaveLength(1)
      expect(result.accounts[0]).toEqual({
        provider: 'github',
        providerLogin: 'octocat',
        providerEmail: 'octocat@example.com',
        createdAt: '2026-04-22T10:00:00Z',
        updatedAt: '2026-06-28T12:00:00Z',
      })
    })

    it('returns parsed data with an empty accounts list', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Operation successful',
        timestamp: '2026-06-28T12:00:00Z',
        data: { accounts: [] },
      })

      const result = await oauthAccountApi.fetchLinkedOAuthAccounts()

      expect(result.accounts).toEqual([])
    })

    it('rejects response missing the success flag (wrapper parse fails)', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        // success field missing — Zod will reject at wrapper level
        message: 'Operation successful',
        timestamp: '2026-06-28T12:00:00Z',
        data: { accounts: [] },
      })

      await expect(oauthAccountApi.fetchLinkedOAuthAccounts()).rejects.toThrow('success')
    })

    it('rejects response with missing data field', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Operation successful',
        timestamp: '2026-06-28T12:00:00Z',
        // data field missing — RestApiResponseSchema allows it via
        // .unknown().nullable().optional() but inner schema will fail.
      })

      await expect(oauthAccountApi.fetchLinkedOAuthAccounts()).rejects.toThrow(/accounts|invalid/i)
    })

    it('rejects response with binding missing required createdAt', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Operation successful',
        timestamp: '2026-06-28T12:00:00Z',
        data: {
          accounts: [
            {
              provider: 'github',
              providerLogin: 'octocat',
              providerEmail: 'octocat@example.com',
              // createdAt missing
              updatedAt: '2026-06-28T12:00:00Z',
            },
          ],
        },
      })

      await expect(oauthAccountApi.fetchLinkedOAuthAccounts()).rejects.toThrow(/createdAt|invalid/i)
    })

    it('propagates network error on connection failure', async () => {
      const networkError = new TypeError('Failed to fetch')
      vi.mocked(apiFetch).mockRejectedValue(networkError)

      await expect(oauthAccountApi.fetchLinkedOAuthAccounts()).rejects.toThrow('Failed to fetch')
    })

    it('propagates 401 error so useQuery can surface it to global interceptor', async () => {
      // The 401 path is handled inside apiFetch's onResponseError
      // (AUTH_002 → refresh retry, terminal codes → logout). When the
      // refresh path exhausts, ofetch throws; we want callers to see
      // the same shape so useQuery can fall into its error state.
      const unauthorizedError = Object.assign(new Error('Unauthorized'), {
        statusCode: 401,
        data: { code: 'AUTH_002' },
      })
      vi.mocked(apiFetch).mockRejectedValue(unauthorizedError)

      await expect(oauthAccountApi.fetchLinkedOAuthAccounts()).rejects.toBe(unauthorizedError)
    })

    it('accepts binding with null providerLogin and null providerEmail', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Operation successful',
        timestamp: '2026-06-28T12:00:00Z',
        data: {
          accounts: [
            {
              provider: 'github',
              providerLogin: null,
              providerEmail: null,
              createdAt: '2026-04-22T10:00:00Z',
              updatedAt: '2026-06-28T12:00:00Z',
            },
          ],
        },
      })

      const result = await oauthAccountApi.fetchLinkedOAuthAccounts()

      expect(result.accounts[0]?.providerLogin).toBeNull()
      expect(result.accounts[0]?.providerEmail).toBeNull()
    })

    it('forwards AbortSignal to apiFetch when provided', async () => {
      const controller = new AbortController()
      vi.mocked(apiFetch).mockResolvedValueOnce({
        success: true,
        message: 'Operation successful',
        data: { accounts: [] },
        timestamp: '2026-06-28T12:00:00Z',
      })

      await oauthAccountApi.fetchLinkedOAuthAccounts(controller.signal)

      expect(apiFetch).toHaveBeenCalledWith(
        '/api/v1/auth/oauth/accounts',
        expect.objectContaining({ signal: controller.signal }),
      )
    })

    it('accepts no signal (signal is optional, backward compatible)', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        success: true,
        message: 'Operation successful',
        data: { accounts: [] },
        timestamp: '2026-06-28T12:00:00Z',
      })

      await expect(oauthAccountApi.fetchLinkedOAuthAccounts()).resolves.toBeDefined()
    })
  })
})
