import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import * as userApi from '@/lib/api/user'
import { apiFetch } from '@/lib/api/instance'

vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

const PROFILE = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'ada@example.com',
  displayName: 'Ada',
  emailVerified: true,
  emailChangePending: false,
  hasPassword: true,
  createdAt: '2026-07-01T00:00:00Z',
  lastLoginAt: null,
  termsVersion: '1.0',
}

describe('updateDisplayName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends PATCH with the new name and returns the re-read profile', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      success: true,
      message: 'OK',
      timestamp: '2026-07-09T10:30:00Z',
      data: { ...PROFILE, displayName: 'AdaLovelace' },
    })

    const result = await userApi.updateDisplayName('AdaLovelace')

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me', {
      method: 'PATCH',
      body: { displayName: 'AdaLovelace' },
    })
    expect(result.displayName).toBe('AdaLovelace')
  })

  it('rejects a name the server would reject, before the request is sent', async () => {
    await expect(userApi.updateDisplayName('x')).rejects.toThrow('regex')
    expect(apiFetch).not.toHaveBeenCalled()
  })
})
