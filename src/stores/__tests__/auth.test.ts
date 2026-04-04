import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAuthStore } from '../auth'
import type { LoginResponse } from '@/lib/schemas/auth.schema'

describe('Auth Store', () => {
  beforeEach(() => {
    // Create fresh testing Pinia instance for each test with vi.fn spy
    setActivePinia(
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      }),
    )
    // Mock Date.now for consistent expiry testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isAuthenticated getter', () => {
    it('returns false when no access token is stored', () => {
      const store = useAuthStore()

      expect(store.accessToken).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('returns true when token exists and has not expired', () => {
      const store = useAuthStore()
      const mockResponse: LoginResponse = {
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        userId: 'user-123',
        expiresIn: 3600, // 1 hour
        tokenType: 'Bearer',
      }

      store.setAuth(mockResponse)

      expect(store.accessToken).toBe('valid-token')
      expect(store.isAuthenticated).toBe(true)
    })

    it('returns false when token has expired', () => {
      const store = useAuthStore()
      const mockResponse: LoginResponse = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        userId: 'user-123',
        expiresIn: 3600, // 1 hour from now
        tokenType: 'Bearer',
      }

      store.setAuth(mockResponse)

      // Advance time past expiry (1 hour + 1 second)
      vi.advanceTimersByTime(3601 * 1000)

      expect(store.isAuthenticated).toBe(false)
    })

    it('returns true when token exists but expiry is null', () => {
      const store = useAuthStore()

      // Manually set token without expiry (edge case)
      store.accessToken = 'token-with-no-expiry'
      store.tokenExpiry = null

      // Store assumes token is valid when no expiry info available
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('setAuth action', () => {
    it('stores all tokens and user ID from login response', () => {
      const store = useAuthStore()
      const mockResponse: LoginResponse = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        userId: 'user-uuid-789',
        expiresIn: 7200,
        tokenType: 'Bearer',
      }

      store.setAuth(mockResponse)

      expect(store.accessToken).toBe('access-token-123')
      expect(store.refreshToken).toBe('refresh-token-456')
      expect(store.userId).toBe('user-uuid-789')
    })

    it('calculates expiry timestamp correctly from expiresIn seconds', () => {
      const store = useAuthStore()
      const currentTime = Date.now()
      const expiresIn = 1800 // 30 minutes

      const mockResponse: LoginResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        userId: 'user-1',
        expiresIn,
        tokenType: 'Bearer',
      }

      store.setAuth(mockResponse)

      // Expiry should be currentTime + expiresIn * 1000 (converted to milliseconds)
      const expectedExpiry = currentTime + expiresIn * 1000
      expect(store.tokenExpiry).toBe(expectedExpiry)
    })

    it('overwrites previous auth state when called again', () => {
      const store = useAuthStore()

      // First login
      store.setAuth({
        accessToken: 'first-token',
        refreshToken: 'first-refresh',
        userId: 'first-user',
        expiresIn: 3600,
        tokenType: 'Bearer',
      })

      // Second login (different user/session)
      store.setAuth({
        accessToken: 'second-token',
        refreshToken: 'second-refresh',
        userId: 'second-user',
        expiresIn: 7200,
        tokenType: 'Bearer',
      })

      expect(store.accessToken).toBe('second-token')
      expect(store.refreshToken).toBe('second-refresh')
      expect(store.userId).toBe('second-user')
    })
  })

  describe('clearAuth action', () => {
    it('clears all authentication state', () => {
      const store = useAuthStore()

      // Set up initial auth state
      store.setAuth({
        accessToken: 'token-to-clear',
        refreshToken: 'refresh-to-clear',
        userId: 'user-to-clear',
        expiresIn: 3600,
        tokenType: 'Bearer',
      })

      // Verify state is set
      expect(store.accessToken).toBe('token-to-clear')
      expect(store.isAuthenticated).toBe(true)

      // Clear auth
      store.clearAuth()

      // Verify all state is null
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.userId).toBeNull()
      expect(store.tokenExpiry).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('can be called when state is already empty', () => {
      const store = useAuthStore()

      // State is already empty (initial state)
      expect(store.accessToken).toBeNull()

      // Clear auth should not throw
      store.clearAuth()

      // State remains empty
      expect(store.accessToken).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('state persistence across store instances', () => {
    it('maintains state when using same Pinia instance', () => {
      const store1 = useAuthStore()

      store1.setAuth({
        accessToken: 'shared-token',
        refreshToken: 'shared-refresh',
        userId: 'shared-user',
        expiresIn: 3600,
        tokenType: 'Bearer',
      })

      // Get another instance of the same store
      const store2 = useAuthStore()

      // Both instances share the same state
      expect(store2.accessToken).toBe('shared-token')
      expect(store2.isAuthenticated).toBe(true)
    })
  })
})
