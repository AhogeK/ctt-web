import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import { setPassword } from '@/lib/api/user'
import { apiFetch } from '@/lib/api/instance'

vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

const BASE_WRAPPER = {
  success: true,
  message: 'Operation successful',
  timestamp: '2026-06-28T12:00:00Z',
}

const EMPTY_DATA = {
  success: true,
  message: 'Operation successful',
  timestamp: '2026-06-28T12:00:00Z',
}

describe('setPassword API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends POST request to /api/v1/users/me/password/set with base64-encoded body', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ...BASE_WRAPPER,
      data: EMPTY_DATA,
    })

    await setPassword('newSecurePassword123!')

    expect(apiFetch).toHaveBeenCalledTimes(1)
    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/password/set', {
      method: 'POST',
      body: { newPassword: 'bmV3U2VjdXJlUGFzc3dvcmQxMjMh' },
    })
  })

  it('returns parsed empty response on success', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ...BASE_WRAPPER,
      data: EMPTY_DATA,
    })

    const result = await setPassword('newSecurePassword123!')

    expect(result).toBeUndefined()
  })

  it('rejects response with invalid wrapper (missing success flag)', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      message: 'Operation successful',
      timestamp: '2026-06-28T12:00:00Z',
      data: EMPTY_DATA,
    })

    await expect(setPassword('test')).rejects.toThrow('success')
  })

  it('succeeds even with missing timestamp in inner data (only wrapper validated)', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ...BASE_WRAPPER,
      data: {
        success: true,
        message: 'Operation successful',
        // timestamp missing in inner data — user.ts only validates the wrapper
      },
    })

    await expect(setPassword('test')).resolves.toBeUndefined()
  })

  it('propagates network error on connection failure', async () => {
    const networkError = new TypeError('Failed to fetch')
    vi.mocked(apiFetch).mockRejectedValue(networkError)

    await expect(setPassword('test')).rejects.toThrow('Failed to fetch')
  })

  it('propagates 401 error (not authenticated)', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      Object.assign(new Error('Unauthorized'), {
        statusCode: 401,
        data: { code: 'AUTH_001' },
      }),
    )

    await expect(setPassword('test')).rejects.toThrow('Unauthorized')
  })

  it('propagates 404 error (user not found)', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      Object.assign(new Error('Not Found'), {
        statusCode: 404,
        data: { code: 'USER_004' },
      }),
    )

    await expect(setPassword('test')).rejects.toThrow('Not Found')
  })

  it('propagates 409 error (password same as current)', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      Object.assign(new Error('Conflict'), {
        statusCode: 409,
        data: { code: 'USER_015' },
      }),
    )

    await expect(setPassword('sameAsOld')).rejects.toThrow('Conflict')
  })

  it('propagates 400 error (invalid input)', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      Object.assign(new Error('Bad Request'), {
        statusCode: 400,
        data: { code: 'COMMON_003' },
      }),
    )

    await expect(setPassword('short')).rejects.toThrow('Bad Request')
  })

  it('propagates 429 error (rate limited)', async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      Object.assign(new Error('Too Many Requests'), {
        statusCode: 429,
        data: { code: 'RATE_LIMIT_001' },
      }),
    )

    await expect(setPassword('test')).rejects.toThrow('Too Many Requests')
  })
})
