import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import * as userApi from '@/lib/api/user'
import { apiFetch } from '@/lib/api/instance'

// Mock the apiFetch module
vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

describe('user API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchCurrentUser', () => {
    it('sends GET request to /api/v1/users/me and returns parsed UserProfile', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Operation successful',
        timestamp: '2026-07-01T09:15:00Z',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          displayName: 'John Doe',
          emailVerified: true,
          createdAt: '2026-01-15T10:30:00Z',
          lastLoginAt: '2026-07-01T09:15:00Z',
          termsVersion: '1.0.0',
        },
      })

      const result = await userApi.fetchCurrentUser()

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me', {
        method: 'GET',
      })
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(result.email).toBe('user@example.com')
      expect(result.displayName).toBe('John Doe')
      expect(result.emailVerified).toBe(true)
      expect(result.createdAt).toBe('2026-01-15T10:30:00Z')
      expect(result.lastLoginAt).toBe('2026-07-01T09:15:00Z')
      expect(result.termsVersion).toBe('1.0.0')
    })

    it('accepts null lastLoginAt in response', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Operation successful',
        timestamp: '2026-07-01T09:15:00Z',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          displayName: 'John Doe',
          emailVerified: false,
          createdAt: '2026-01-15T10:30:00Z',
          lastLoginAt: null,
          termsVersion: '1.0.0',
        },
      })

      const result = await userApi.fetchCurrentUser()

      expect(result.lastLoginAt).toBeNull()
    })

    it('rejects response missing required field (email) with Zod error', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Operation successful',
        timestamp: '2026-07-01T09:15:00Z',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          // email missing — should fail Zod validation
          displayName: 'John Doe',
          emailVerified: true,
          createdAt: '2026-01-15T10:30:00Z',
          lastLoginAt: '2026-07-01T09:15:00Z',
          termsVersion: '1.0.0',
        },
      })

      await expect(userApi.fetchCurrentUser()).rejects.toThrow(/email|invalid/i)
    })

    it('rejects response with invalid UUID for id', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Operation successful',
        timestamp: '2026-07-01T09:15:00Z',
        data: {
          id: 'not-a-uuid',
          email: 'user@example.com',
          displayName: 'John Doe',
          emailVerified: true,
          createdAt: '2026-01-15T10:30:00Z',
          lastLoginAt: '2026-07-01T09:15:00Z',
          termsVersion: '1.0.0',
        },
      })

      await expect(userApi.fetchCurrentUser()).rejects.toThrow(/invalid/i)
    })

    it('rejects response with invalid datetime for createdAt', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Operation successful',
        timestamp: '2026-07-01T09:15:00Z',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          displayName: 'John Doe',
          emailVerified: true,
          createdAt: 'not-a-datetime',
          lastLoginAt: null,
          termsVersion: '1.0.0',
        },
      })

      await expect(userApi.fetchCurrentUser()).rejects.toThrow(/invalid/i)
    })

    it('propagates 401 error (interceptor handles token refresh / terminal codes)', async () => {
      const authError = new Error('AUTH_002: Access token expired')
      vi.mocked(apiFetch).mockRejectedValue(authError)

      // fetchCurrentUser must not swallow auth errors — interceptor owns the recovery logic.
      // The store caller wraps fetchCurrentUser in try/catch and silently degrades if needed.
      await expect(userApi.fetchCurrentUser()).rejects.toThrow('AUTH_002: Access token expired')
    })

    it('propagates terminal 401 error (AUTH_003)', async () => {
      const terminalAuthError = new Error('AUTH_003: Token invalid')
      vi.mocked(apiFetch).mockRejectedValue(terminalAuthError)

      await expect(userApi.fetchCurrentUser()).rejects.toThrow('AUTH_003: Token invalid')
    })

    it('propagates network error on connection failure', async () => {
      const networkError = new TypeError('Failed to fetch')
      vi.mocked(apiFetch).mockRejectedValue(networkError)

      await expect(userApi.fetchCurrentUser()).rejects.toThrow('Failed to fetch')
    })

    it('propagates server error (500)', async () => {
      const serverError = new Error('Internal Server Error')
      vi.mocked(apiFetch).mockRejectedValue(serverError)

      await expect(userApi.fetchCurrentUser()).rejects.toThrow('Internal Server Error')
    })

    it('does not send body or query parameters', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        message: 'Operation successful',
        timestamp: '2026-07-01T09:15:00Z',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          displayName: 'John Doe',
          emailVerified: true,
          createdAt: '2026-01-15T10:30:00Z',
          lastLoginAt: null,
          termsVersion: '1.0.0',
        },
      })

      await userApi.fetchCurrentUser()

      const callArgs = vi.mocked(apiFetch).mock.calls[0]!
      expect(callArgs[0]).toBe('/api/v1/users/me')
      expect(callArgs[1]).toEqual({ method: 'GET' })
      // No body / no query sent — GET-only endpoint
      expect(callArgs[1]).not.toHaveProperty('body')
      expect(callArgs[1]).not.toHaveProperty('query')
    })
  })
})
