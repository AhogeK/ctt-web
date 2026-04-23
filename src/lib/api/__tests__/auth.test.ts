import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as authApi from '@/lib/api/auth'
import { apiFetch } from '@/lib/api/instance'

// Mock the apiFetch module
vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

describe('auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('sends POST request with validated credentials and returns tokens', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        accessToken: 'mock-access-token-xyz',
        refreshToken: 'mock-refresh-token-xyz',
        expiresIn: 3600,
        tokenType: 'Bearer',
      })

      const result = await authApi.login({
        email: 'user@example.com',
        password: 'SecurePass1!',
        deviceId: 'device-001',
      })

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email: 'user@example.com',
          password: 'SecurePass1!',
          deviceId: 'device-001',
        },
      })
      expect(result.userId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
      expect(result.accessToken).toBe('mock-access-token-xyz')
      expect(result.refreshToken).toBe('mock-refresh-token-xyz')
      expect(result.expiresIn).toBe(3600)
      expect(result.tokenType).toBe('Bearer')
    })

    it('defaults tokenType to Bearer when not provided', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 7200,
      })

      const result = await authApi.login({
        email: 'user@example.com',
        password: 'SecurePass1!',
        deviceId: 'device-001',
      })

      expect(result.tokenType).toBe('Bearer')
    })

    it('rejects invalid email format', async () => {
      await expect(
        authApi.login({
          email: 'not-an-email',
          password: 'SecurePass1!',
          deviceId: 'device-001',
        }),
      ).rejects.toThrow('Invalid email format')
    })

    it('rejects missing password', async () => {
      await expect(
        authApi.login({
          email: 'user@example.com',
          password: '',
          deviceId: 'device-001',
        }),
      ).rejects.toThrow('Password must be at least 8 characters')
    })

    it('rejects missing deviceId', async () => {
      await expect(
        authApi.login({
          email: 'user@example.com',
          password: 'SecurePass1!',
          deviceId: '',
        }),
      ).rejects.toThrow('Device ID is required')
    })

    it('propagates API error on invalid credentials', async () => {
      const apiError = new Error('Invalid email or password')
      vi.mocked(apiFetch).mockRejectedValue(apiError)

      await expect(
        authApi.login({
          email: 'user@example.com',
          password: 'WrongPassword1!',
          deviceId: 'device-001',
        }),
      ).rejects.toThrow('Invalid email or password')
    })

    it('propagates network error on connection failure', async () => {
      const networkError = new TypeError('Failed to fetch')
      vi.mocked(apiFetch).mockRejectedValue(networkError)

      await expect(
        authApi.login({
          email: 'user@example.com',
          password: 'SecurePass1!',
          deviceId: 'device-001',
        }),
      ).rejects.toThrow('Failed to fetch')
    })

    it('rejects response missing required fields', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        // accessToken missing — should fail Zod validation
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      })

      // Zod validation should fail with specific field error
      await expect(
        authApi.login({
          email: 'user@example.com',
          password: 'SecurePass1!',
          deviceId: 'device-001',
        }),
      ).rejects.toThrow(/accessToken|invalid/i)
    })
  })

  describe('register', () => {
    it('sends POST request with validated payload', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'User registered successfully',
        data: null,
        timestamp: '2026-04-11T10:00:00Z',
      })

      const result = await authApi.register({
        email: 'user@example.com',
        displayName: 'TestUser',
        password: 'SecurePass1!',
      })

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/register', {
        method: 'POST',
        body: {
          email: 'user@example.com',
          displayName: 'TestUser',
          password: 'SecurePass1!',
        },
      })
      expect(result.success).toBe(true)
      expect(result.message).toBe('User registered successfully')
    })

    it('strips confirmPassword from payload', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'OK',
        data: null,
        timestamp: '2026-04-11T10:00:00Z',
      })

      // Pass data with extra confirmPassword field
      const dataWithExtra: Record<string, unknown> = {
        email: 'user@example.com',
        displayName: 'TestUser',
        password: 'SecurePass1!',
        confirmPassword: 'SecurePass1!',
      }

      // Test Zod passthrough: extra fields should be stripped by schema parsing
      await authApi.register(dataWithExtra as Parameters<typeof authApi.register>[0])

      // Verify confirmPassword was stripped by Zod parsing
      const callArgs = vi.mocked(apiFetch).mock.calls[0]![1]
      expect(callArgs!.body).not.toHaveProperty('confirmPassword')
    })

    it('rejects invalid email format', async () => {
      await expect(
        authApi.register({
          email: 'not-an-email',
          displayName: 'TestUser',
          password: 'SecurePass1!',
        }),
      ).rejects.toThrow('Invalid email format')
    })

    it('rejects weak password', async () => {
      await expect(
        authApi.register({
          email: 'user@example.com',
          displayName: 'TestUser',
          password: 'weak',
        }),
      ).rejects.toThrow('Password must be at least 8 characters')
    })

    it('rejects display name with invalid characters', async () => {
      await expect(
        authApi.register({
          email: 'user@example.com',
          displayName: 'Test@User!',
          password: 'SecurePass1!',
        }),
      ).rejects.toThrow('Invalid display name format')
    })

    it('rejects display name that is too short', async () => {
      await expect(
        authApi.register({
          email: 'user@example.com',
          displayName: 'A',
          password: 'SecurePass1!',
        }),
      ).rejects.toThrow('Invalid display name format')
    })
  })

  describe('verifyEmail', () => {
    it('sends GET request with token as query param', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Email verified successfully',
        data: null,
        timestamp: '2026-04-11T10:00:00Z',
      })

      const result = await authApi.verifyEmail('abc-123-token')

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/verify-email', {
        method: 'GET',
        query: { token: 'abc-123-token' },
      })
      expect(result.success).toBe(true)
      expect(result.message).toBe('Email verified successfully')
    })

    it('sends GET request with empty token (backend validates)', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: false,
        message: 'Invalid token',
        data: null,
        timestamp: '2026-04-11T10:00:00Z',
      })

      const result = await authApi.verifyEmail('')

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/verify-email', {
        method: 'GET',
        query: { token: '' },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('resendVerification', () => {
    it('sends POST request with email in body', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Verification email sent',
        data: null,
        timestamp: '2026-04-11T10:00:00Z',
      })

      const result = await authApi.resendVerification('user@example.com')

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/resend-verification', {
        method: 'POST',
        body: { email: 'user@example.com' },
      })
      expect(result.success).toBe(true)
      expect(result.message).toBe('Verification email sent')
    })

    it('sends POST request with invalid email (backend validates)', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: false,
        message: 'Invalid email format',
        data: null,
        timestamp: '2026-04-11T10:00:00Z',
      })

      const result = await authApi.resendVerification('not-an-email')

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/resend-verification', {
        method: 'POST',
        body: { email: 'not-an-email' },
      })
      expect(result.success).toBe(false)
    })

    it('sends POST request with empty email (backend validates)', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: false,
        message: 'Email is required',
        data: null,
        timestamp: '2026-04-11T10:00:00Z',
      })

      const result = await authApi.resendVerification('')

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/resend-verification', {
        method: 'POST',
        body: { email: '' },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('refresh', () => {
    it('sends POST request with refreshToken and returns new tokens', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      })

      const result = await authApi.refresh({ refreshToken: 'old-refresh-token' })

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken: 'old-refresh-token' },
      })
      expect(result.accessToken).toBe('new-access-token')
      expect(result.refreshToken).toBe('new-refresh-token')
      expect(result.expiresIn).toBe(3600)
      expect(result.tokenType).toBe('Bearer')
    })

    it('defaults tokenType to Bearer when not provided', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 7200,
      })

      const result = await authApi.refresh({ refreshToken: 'old-refresh-token' })

      expect(result.tokenType).toBe('Bearer')
    })

    it('rejects response missing required fields', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        accessToken: 'new-access-token',
        expiresIn: 3600,
      })

      await expect(authApi.refresh({ refreshToken: 'old-refresh-token' })).rejects.toThrow(/refreshToken|invalid/i)
    })

    it('propagates API error on invalid refresh token', async () => {
      const apiError = new Error('Invalid refresh token')
      vi.mocked(apiFetch).mockRejectedValue(apiError)

      await expect(authApi.refresh({ refreshToken: 'invalid-token' })).rejects.toThrow('Invalid refresh token')
    })
  })

  describe('logoutAll', () => {
    it('sends POST request without body', async () => {
      vi.mocked(apiFetch).mockResolvedValue(undefined)

      await authApi.logoutAll()

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/logout-all', {
        method: 'POST',
      })
    })

    it('propagates API error on failure', async () => {
      const apiError = new Error('Unauthorized')
      vi.mocked(apiFetch).mockRejectedValue(apiError)

      await expect(authApi.logoutAll()).rejects.toThrow('Unauthorized')
    })

    it('propagates rate limit error (429)', async () => {
      const rateLimitError = new Error('Too many requests')
      vi.mocked(apiFetch).mockRejectedValue(rateLimitError)

      await expect(authApi.logoutAll()).rejects.toThrow('Too many requests')
    })
  })
})
