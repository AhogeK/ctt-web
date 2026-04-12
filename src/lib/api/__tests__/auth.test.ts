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
})
