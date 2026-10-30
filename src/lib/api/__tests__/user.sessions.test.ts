import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import * as userApi from '@/lib/api/user'
import { apiFetch } from '@/lib/api/instance'

vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

const SESSION = {
  id: '22222222-2222-4222-8222-222222222222',
  kind: 'WEB',
  deviceName: null,
  ideName: null,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  createdAt: '2026-07-01T00:00:00Z',
  lastUsedAt: '2026-07-09T10:30:00Z',
  expiresAt: '2026-08-09T10:30:00Z',
  current: true,
}

describe('login sessions API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchLoginSessions', () => {
    it('asks for the whole list in one request and unwraps the array', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'OK',
        timestamp: '2026-07-09T10:30:00Z',
        data: [SESSION],
      })

      const result = await userApi.fetchLoginSessions()

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/sessions', {
        method: 'GET',
        query: { limit: 100 },
      })
      expect(result).toHaveLength(1)
      expect(result[0]!.current).toBe(true)
    })

    it('keeps a session whose fields are null, so "never refreshed" stays distinguishable', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'OK',
        timestamp: '2026-07-09T10:30:00Z',
        data: [{ ...SESSION, lastUsedAt: null, userAgent: null }],
      })

      const result = await userApi.fetchLoginSessions()

      expect(result[0]!.lastUsedAt).toBeNull()
      expect(result[0]!.userAgent).toBeNull()
    })
  })

  describe('revokeLoginSession', () => {
    it('deletes the session by id and expects no body back', async () => {
      vi.mocked(apiFetch).mockResolvedValue(undefined)

      await userApi.revokeLoginSession(SESSION.id)

      expect(apiFetch).toHaveBeenCalledWith(`/api/v1/users/me/sessions/${SESSION.id}`, {
        method: 'DELETE',
      })
    })
  })

  describe('revokeLoginSessions', () => {
    const ids = ['11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333']

    it('posts every id in one call and reports both counts', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'OK',
        timestamp: '2026-07-09T10:30:00Z',
        data: { revoked: 1, skipped: [ids[1]] },
      })

      const result = await userApi.revokeLoginSessions(ids)

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/sessions/revoke', {
        method: 'POST',
        body: { sessionIds: ids },
      })
      expect(result).toEqual({ revoked: 1, skipped: [ids[1]] })
    })

    it('answers with an empty skip list when the server omits it', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'OK',
        timestamp: '2026-07-09T10:30:00Z',
        data: { revoked: 2 },
      })

      await expect(userApi.revokeLoginSessions(ids)).resolves.toEqual({ revoked: 2, skipped: [] })
    })

    it('refuses an empty batch before it reaches the network', async () => {
      const failure = await userApi.revokeLoginSessions([]).catch((error: unknown) => error)

      expect(failure).toBeInstanceOf(Error)
      expect(apiFetch).not.toHaveBeenCalled()
    })
  })
})
