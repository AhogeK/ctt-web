import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore, STORAGE_KEYS } from '../auth'
import * as authApi from '@/lib/api/auth'
import type { LoginResponse } from '@/lib/schemas/auth.schema'

/**
 * Mock the auth APIs to avoid actual HTTP requests during tests.
 */
vi.mock('@/lib/api/auth', () => ({
  login: vi.fn<() => Promise<LoginResponse>>(),
  refresh: vi.fn<() => Promise<LoginResponse>>(),
}))

describe('Auth Store', () => {
  let store: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    store = useAuthStore()
  })

  /**
   * Tests for store initialization behavior.
   */
  describe('initialization', () => {
    it('initializes with null values when no stored data', () => {
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.userId).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('restores tokens from localStorage on initialization', () => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'test-token')
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'test-refresh')
      localStorage.setItem(STORAGE_KEYS.USER_ID, 'user-123')

      // Create new store instance to trigger initialization
      setActivePinia(createPinia())
      const newStore = useAuthStore()

      expect(newStore.accessToken).toBe('test-token')
      expect(newStore.refreshToken).toBe('test-refresh')
      expect(newStore.userId).toBe('user-123')
    })
  })

  /**
   * Tests for setAuth action behavior.
   */
  describe('setAuth', () => {
    it('stores auth data from login response', () => {
      const mockResponse = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        userId: 'user-456',
        expiresIn: 3600,
        tokenType: 'Bearer',
      }

      store.setAuth(mockResponse)

      expect(store.accessToken).toBe('new-token')
      expect(store.refreshToken).toBe('new-refresh')
      expect(store.userId).toBe('user-456')
      expect(store.tokenExpiry).toBeDefined()
    })

    it('calculates token expiry correctly', () => {
      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        userId: 'user',
        expiresIn: 3600, // 1 hour
        tokenType: 'Bearer',
      }

      const beforeExpiry = Date.now()
      store.setAuth(mockResponse)
      const afterExpiry = Date.now() + 3600 * 1000

      expect(store.tokenExpiry).toBeGreaterThan(beforeExpiry)
      expect(store.tokenExpiry).toBeLessThanOrEqual(afterExpiry)
    })
  })

  /**
   * Tests for clearAuth action behavior.
   */
  describe('clearAuth', () => {
    it('clears all auth state', () => {
      store.setAuth({
        accessToken: 'token',
        refreshToken: 'refresh',
        userId: 'user',
        expiresIn: 3600,
        tokenType: 'Bearer',
      })

      store.clearAuth()

      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.userId).toBeNull()
      expect(store.tokenExpiry).toBeNull()
    })

    it('removes tokens from localStorage', () => {
      store.setAuth({
        accessToken: 'token',
        refreshToken: 'refresh',
        userId: 'user',
        expiresIn: 3600,
        tokenType: 'Bearer',
      })

      store.clearAuth()

      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.userId).toBeNull()
    })
  })

  /**
   * Tests for isAuthenticated computed property.
   */
  describe('isAuthenticated', () => {
    it('returns false when no token', () => {
      expect(store.isAuthenticated).toBe(false)
    })

    it('returns true when token exists and not expired', () => {
      store.setAuth({
        accessToken: 'token',
        refreshToken: 'refresh',
        userId: 'user',
        expiresIn: 3600,
        tokenType: 'Bearer',
      })

      expect(store.isAuthenticated).toBe(true)
    })

    it('returns false when token is expired', () => {
      store.setAuth({
        accessToken: 'token',
        refreshToken: 'refresh',
        userId: 'user',
        expiresIn: 0, // Expired
        tokenType: 'Bearer',
      })

      expect(store.isAuthenticated).toBe(false)
    })
  })

  /**
   * Tests for login action behavior.
   */
  describe('login', () => {
    it('calls login API and stores auth data', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
        deviceId: 'device-1',
      }
      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        userId: 'user',
        expiresIn: 3600,
        tokenType: 'Bearer',
      }

      vi.mocked(authApi.login).mockResolvedValue(mockResponse)

      const result = await store.login(mockCredentials)

      expect(authApi.login).toHaveBeenCalledWith(mockCredentials)
      expect(result).toStrictEqual(mockResponse)
      expect(store.accessToken).toBe('token')
    })

    it('throws error when login API fails', async () => {
      const mockError = new Error('Invalid credentials')
      vi.mocked(authApi.login).mockRejectedValue(mockError)

      await expect(
        store.login({ email: 'test@example.com', password: 'wrong', deviceId: 'device-1' }),
      ).rejects.toThrow('Invalid credentials')
    })
  })

  /**
   * Tests for refreshAccessToken action behavior.
   * Covers token refresh, concurrency deduping, error handling, and lock management.
   */
  describe('refreshAccessToken', () => {
    beforeEach(() => {
      localStorage.clear()
      vi.clearAllMocks()
      vi.useRealTimers()
    })

    it('refreshes token successfully and updates auth state', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        userId: 'user-123',
        expiresIn: 3600,
        tokenType: 'Bearer',
      }

      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'old-refresh-token')
      setActivePinia(createPinia())
      const store = useAuthStore()

      vi.mocked(authApi.refresh).mockResolvedValue(mockResponse)

      const newToken = await store.refreshAccessToken()

      expect(authApi.refresh).toHaveBeenCalledWith({ refreshToken: 'old-refresh-token' })
      expect(newToken).toBe('new-access-token')
      expect(store.accessToken).toBe('new-access-token')
      expect(store.refreshToken).toBe('new-refresh-token')
    })

    it('deduplicates concurrent refresh requests (Thundering Herd)', async () => {
      vi.useFakeTimers()
      const mockResponse = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        userId: 'user',
        expiresIn: 3600,
        tokenType: 'Bearer',
      }

      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token')
      setActivePinia(createPinia())
      const store = useAuthStore()

      vi.mocked(authApi.refresh).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockResponse), 100)
          }),
      )

      const promise1 = store.refreshAccessToken()
      const promise2 = store.refreshAccessToken()

      await vi.runAllTimersAsync()

      const [result1, result2] = await Promise.all([promise1, promise2])

      expect(authApi.refresh).toHaveBeenCalledTimes(1)
      expect(result1).toBe('new-token')
      expect(result2).toBe('new-token')
    })

    it('clears auth state when no refresh token available', async () => {
      localStorage.clear()
      setActivePinia(createPinia())
      const store = useAuthStore()

      await expect(store.refreshAccessToken()).rejects.toThrow('No refresh token available')
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.userId).toBeNull()
    })

    it('clears auth state when refresh API fails', async () => {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'invalid-token')
      setActivePinia(createPinia())
      const store = useAuthStore()

      vi.mocked(authApi.refresh).mockRejectedValue(new Error('Token expired'))

      await expect(store.refreshAccessToken()).rejects.toThrow('Token expired')
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.userId).toBeNull()
    })

    it('uses fallback refresh token when response lacks new refresh token', async () => {
      const mockResponse = {
        accessToken: 'new-access',
        refreshToken: '', // Empty string triggers fallback
        userId: 'user',
        expiresIn: 3600,
        tokenType: 'Bearer',
      }

      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'existing-refresh')
      setActivePinia(createPinia())
      const store = useAuthStore()

      vi.mocked(authApi.refresh).mockResolvedValue(mockResponse)

      await store.refreshAccessToken()

      expect(store.refreshToken).toBe('existing-refresh')
    })

    it('releases lock after successful refresh', async () => {
      const mockResponse = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        userId: 'user',
        expiresIn: 3600,
        tokenType: 'Bearer',
      }

      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh')
      setActivePinia(createPinia())
      const store = useAuthStore()

      vi.mocked(authApi.refresh).mockResolvedValue(mockResponse)

      await store.refreshAccessToken()

      vi.mocked(authApi.refresh).mockResolvedValue({
        ...mockResponse,
        accessToken: 'another-new-token',
      })
      await store.refreshAccessToken()

      expect(authApi.refresh).toHaveBeenCalledTimes(2)
    })

    it('releases lock after failed refresh allowing retry', async () => {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'invalid')
      setActivePinia(createPinia())
      const store = useAuthStore()

      vi.mocked(authApi.refresh).mockRejectedValueOnce(new Error('Failed'))

      await expect(store.refreshAccessToken()).rejects.toThrow('Failed')

      vi.mocked(authApi.refresh).mockResolvedValueOnce({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        userId: 'user',
        expiresIn: 3600,
        tokenType: 'Bearer',
      })

      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'valid-refresh')
      setActivePinia(createPinia())
      const retryStore = useAuthStore()

      await retryStore.refreshAccessToken()

      expect(authApi.refresh).toHaveBeenCalledTimes(2)
    })
  })
})
