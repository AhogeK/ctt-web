import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import * as emailApi from '@/lib/api/email'
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

describe('email API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // fetchEmailStatus
  // ---------------------------------------------------------------------------
  describe('fetchEmailStatus', () => {
    it('sends GET request to /api/v1/users/me/email/status', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: {
          email: 'user@example.com',
          emailVerified: true,
          emailChangePending: false,
          pendingNewEmail: null,
        },
      })

      await emailApi.fetchEmailStatus()

      expect(apiFetch).toHaveBeenCalledTimes(1)
      expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/email/status', {
        method: 'GET',
      })
    })

    it('returns parsed email status with verified email and no pending change', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: {
          email: 'user@example.com',
          emailVerified: true,
          emailChangePending: false,
          pendingNewEmail: null,
        },
      })

      const result = await emailApi.fetchEmailStatus()

      expect(result).toEqual({
        email: 'user@example.com',
        emailVerified: true,
        emailChangePending: false,
        pendingNewEmail: null,
      })
    })

    it('returns parsed email status with pending email change', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: {
          email: 'user@example.com',
          emailVerified: true,
          emailChangePending: true,
          pendingNewEmail: 'new@example.com',
        },
      })

      const result = await emailApi.fetchEmailStatus()

      expect(result.emailChangePending).toBe(true)
      expect(result.pendingNewEmail).toBe('new@example.com')
    })

    it('rejects response missing the success flag', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        message: 'Operation successful',
        timestamp: '2026-06-28T12:00:00Z',
        data: {
          email: 'user@example.com',
          emailVerified: true,
          emailChangePending: false,
          pendingNewEmail: null,
        },
      })

      await expect(emailApi.fetchEmailStatus()).rejects.toThrow('success')
    })

    it('rejects response with invalid email format', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: {
          email: 'not-an-email',
          emailVerified: true,
          emailChangePending: false,
          pendingNewEmail: null,
        },
      })

      await expect(emailApi.fetchEmailStatus()).rejects.toThrow(/email|invalid/i)
    })

    it('rejects response with missing emailVerified field', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: {
          email: 'user@example.com',
          // emailVerified missing
          emailChangePending: false,
          pendingNewEmail: null,
        },
      })

      await expect(emailApi.fetchEmailStatus()).rejects.toThrow(/emailVerified|invalid/i)
    })

    it('propagates network error on connection failure', async () => {
      const networkError = new TypeError('Failed to fetch')
      vi.mocked(apiFetch).mockRejectedValue(networkError)

      await expect(emailApi.fetchEmailStatus()).rejects.toThrow('Failed to fetch')
    })

    it('propagates 401 error so useQuery can surface it to global interceptor', async () => {
      const unauthorizedError = Object.assign(new Error('Unauthorized'), {
        statusCode: 401,
        data: { code: 'AUTH_002' },
      })
      vi.mocked(apiFetch).mockRejectedValue(unauthorizedError)

      await expect(emailApi.fetchEmailStatus()).rejects.toBe(unauthorizedError)
    })
  })

  // ---------------------------------------------------------------------------
  // requestEmailChange
  // ---------------------------------------------------------------------------
  describe('requestEmailChange', () => {
    it('sends POST request to /api/v1/users/me/email/change-request with body', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: EMPTY_DATA,
      })

      await emailApi.requestEmailChange({
        newEmail: 'new@example.com',
        password: 'currentPassword123',
      })

      expect(apiFetch).toHaveBeenCalledTimes(1)
      expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/email/change-request', {
        method: 'POST',
        body: {
          newEmail: 'new@example.com',
          password: 'Y3VycmVudFBhc3N3b3JkMTIz',
        },
      })
    })

    it('returns parsed empty response on success', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: EMPTY_DATA,
      })

      const result = await emailApi.requestEmailChange({
        newEmail: 'new@example.com',
        password: 'currentPassword123',
      })

      expect(result).toEqual(EMPTY_DATA)
    })

    it('rejects response with invalid wrapper (missing success flag)', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        message: 'Operation successful',
        timestamp: '2026-06-28T12:00:00Z',
        data: EMPTY_DATA,
      })

      await expect(emailApi.requestEmailChange({ newEmail: 'new@example.com', password: 'pass' })).rejects.toThrow(
        'success',
      )
    })

    it('rejects response with invalid inner data (missing timestamp)', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: {
          success: true,
          message: 'Operation successful',
          // timestamp missing in inner data
        },
      })

      await expect(emailApi.requestEmailChange({ newEmail: 'new@example.com', password: 'pass' })).rejects.toThrow(
        /timestamp|invalid/i,
      )
    })

    it('propagates network error on connection failure', async () => {
      const networkError = new TypeError('Failed to fetch')
      vi.mocked(apiFetch).mockRejectedValue(networkError)

      await expect(emailApi.requestEmailChange({ newEmail: 'new@example.com', password: 'pass' })).rejects.toThrow(
        'Failed to fetch',
      )
    })

    it('propagates 401 error (no JWT)', async () => {
      vi.mocked(apiFetch).mockRejectedValue(
        Object.assign(new Error('Unauthorized'), {
          statusCode: 401,
          data: { code: 'AUTH_002' },
        }),
      )

      await expect(emailApi.requestEmailChange({ newEmail: 'new@example.com', password: 'pass' })).rejects.toThrow(
        'Unauthorized',
      )
    })

    it('propagates 400 error (invalid email or password)', async () => {
      vi.mocked(apiFetch).mockRejectedValue(
        Object.assign(new Error('Bad Request'), {
          statusCode: 400,
          data: { code: 'USER_001', message: 'Invalid email format' },
        }),
      )

      await expect(emailApi.requestEmailChange({ newEmail: 'invalid', password: 'pass' })).rejects.toThrow(
        'Bad Request',
      )
    })
  })

  // ---------------------------------------------------------------------------
  // confirmEmailChange
  // ---------------------------------------------------------------------------
  describe('confirmEmailChange', () => {
    it('sends POST request to /api/v1/users/me/email/change-confirm with token', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: EMPTY_DATA,
      })

      await emailApi.confirmEmailChange({ token: 'verification-token-abc123' })

      expect(apiFetch).toHaveBeenCalledTimes(1)
      expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/email/change-confirm', {
        method: 'POST',
        body: { token: 'verification-token-abc123' },
      })
    })

    it('returns parsed empty response on success', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: EMPTY_DATA,
      })

      const result = await emailApi.confirmEmailChange({ token: 'verification-token-abc123' })

      expect(result).toEqual(EMPTY_DATA)
    })

    it('rejects response with invalid wrapper (missing success flag)', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        message: 'Operation successful',
        timestamp: '2026-06-28T12:00:00Z',
        data: EMPTY_DATA,
      })

      await expect(emailApi.confirmEmailChange({ token: 'verification-token-abc123' })).rejects.toThrow('success')
    })

    it('rejects response with invalid inner data (missing message)', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: {
          success: true,
          timestamp: '2026-06-28T12:00:00Z',
          // message missing in inner data
        },
      })

      await expect(emailApi.confirmEmailChange({ token: 'verification-token-abc123' })).rejects.toThrow(
        /message|invalid/i,
      )
    })

    it('propagates network error on connection failure', async () => {
      const networkError = new TypeError('Failed to fetch')
      vi.mocked(apiFetch).mockRejectedValue(networkError)

      await expect(emailApi.confirmEmailChange({ token: 'verification-token-abc123' })).rejects.toThrow(
        'Failed to fetch',
      )
    })

    it('propagates 401 error (no JWT)', async () => {
      vi.mocked(apiFetch).mockRejectedValue(
        Object.assign(new Error('Unauthorized'), {
          statusCode: 401,
          data: { code: 'AUTH_002' },
        }),
      )

      await expect(emailApi.confirmEmailChange({ token: 'verification-token-abc123' })).rejects.toThrow('Unauthorized')
    })

    it('propagates 400 error (invalid or expired token)', async () => {
      vi.mocked(apiFetch).mockRejectedValue(
        Object.assign(new Error('Bad Request'), {
          statusCode: 400,
          data: { code: 'USER_002', message: 'Token expired' },
        }),
      )

      await expect(emailApi.confirmEmailChange({ token: 'expired-token' })).rejects.toThrow('Bad Request')
    })
  })

  // ---------------------------------------------------------------------------
  // cancelEmailChange
  // ---------------------------------------------------------------------------
  describe('cancelEmailChange', () => {
    it('sends DELETE request to /api/v1/users/me/email/change-request', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: EMPTY_DATA,
      })

      await emailApi.cancelEmailChange()

      expect(apiFetch).toHaveBeenCalledTimes(1)
      expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/email/change-request', {
        method: 'DELETE',
      })
    })

    it('returns parsed empty response on success', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: EMPTY_DATA,
      })

      const result = await emailApi.cancelEmailChange()

      expect(result).toEqual(EMPTY_DATA)
    })

    it('rejects response with invalid wrapper (missing success flag)', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        message: 'Operation successful',
        timestamp: '2026-06-28T12:00:00Z',
        data: EMPTY_DATA,
      })

      await expect(emailApi.cancelEmailChange()).rejects.toThrow('success')
    })

    it('rejects response with invalid inner data (missing success field)', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: {
          message: 'Operation successful',
          timestamp: '2026-06-28T12:00:00Z',
          // success missing in inner data
        },
      })

      await expect(emailApi.cancelEmailChange()).rejects.toThrow(/success|invalid/i)
    })

    it('propagates network error on connection failure', async () => {
      const networkError = new TypeError('Failed to fetch')
      vi.mocked(apiFetch).mockRejectedValue(networkError)

      await expect(emailApi.cancelEmailChange()).rejects.toThrow('Failed to fetch')
    })

    it('propagates 401 error (no JWT)', async () => {
      vi.mocked(apiFetch).mockRejectedValue(
        Object.assign(new Error('Unauthorized'), {
          statusCode: 401,
          data: { code: 'AUTH_002' },
        }),
      )

      await expect(emailApi.cancelEmailChange()).rejects.toThrow('Unauthorized')
    })

    it('propagates 404 error (no pending request)', async () => {
      vi.mocked(apiFetch).mockRejectedValue(
        Object.assign(new Error('Not Found'), {
          statusCode: 404,
          data: { code: 'USER_003', message: 'No pending email change' },
        }),
      )

      await expect(emailApi.cancelEmailChange()).rejects.toThrow('Not Found')
    })
  })

  // ---------------------------------------------------------------------------
  // resendEmailChangeVerification
  // ---------------------------------------------------------------------------
  describe('resendEmailChangeVerification', () => {
    it('sends POST request to /api/v1/users/me/email/resend-verification', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: EMPTY_DATA,
      })

      await emailApi.resendEmailChangeVerification()

      expect(apiFetch).toHaveBeenCalledTimes(1)
      expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/email/resend-verification', {
        method: 'POST',
      })
    })

    it('returns parsed empty response on success', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: EMPTY_DATA,
      })

      const result = await emailApi.resendEmailChangeVerification()

      expect(result).toEqual(EMPTY_DATA)
    })

    it('returns parsed empty response with idempotentSkip flag', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: {
          ...EMPTY_DATA,
          idempotentSkip: true,
        },
      })

      const result = await emailApi.resendEmailChangeVerification()

      expect(result.idempotentSkip).toBe(true)
    })

    it('rejects response with invalid wrapper (missing success flag)', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        message: 'Operation successful',
        timestamp: '2026-06-28T12:00:00Z',
        data: EMPTY_DATA,
      })

      await expect(emailApi.resendEmailChangeVerification()).rejects.toThrow('success')
    })

    it('rejects response with invalid inner data (invalid timestamp)', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        ...BASE_WRAPPER,
        data: {
          success: true,
          message: 'Operation successful',
          timestamp: 'not-a-datetime',
        },
      })

      await expect(emailApi.resendEmailChangeVerification()).rejects.toThrow(/timestamp|invalid/i)
    })

    it('propagates network error on connection failure', async () => {
      const networkError = new TypeError('Failed to fetch')
      vi.mocked(apiFetch).mockRejectedValue(networkError)

      await expect(emailApi.resendEmailChangeVerification()).rejects.toThrow('Failed to fetch')
    })

    it('propagates 401 error (no JWT)', async () => {
      vi.mocked(apiFetch).mockRejectedValue(
        Object.assign(new Error('Unauthorized'), {
          statusCode: 401,
          data: { code: 'AUTH_002' },
        }),
      )

      await expect(emailApi.resendEmailChangeVerification()).rejects.toThrow('Unauthorized')
    })

    it('propagates 429 error (rate limited)', async () => {
      vi.mocked(apiFetch).mockRejectedValue(
        Object.assign(new Error('Too Many Requests'), {
          statusCode: 429,
          data: { code: 'RATE_LIMIT', message: 'Please wait before requesting again' },
        }),
      )

      await expect(emailApi.resendEmailChangeVerification()).rejects.toThrow('Too Many Requests')
    })
  })
})
