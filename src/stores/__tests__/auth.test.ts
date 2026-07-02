import { describe, it, expect, beforeEach, vi, afterEach } from 'vite-plus/test'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useAuthStore, STORAGE_KEYS, clearRefreshTimer } from '../auth'
import * as authApi from '@/lib/api/auth'
import * as userApi from '@/lib/api/user'
import type { LoginResponse } from '@/lib/schemas/auth.schema'
import type { UserProfile } from '@/lib/schemas/user.schema'

/**
 * Mock the auth APIs to avoid actual HTTP requests during tests.
 */
vi.mock('@/lib/api/auth', () => ({
  login: vi.fn<() => Promise<LoginResponse>>(),
  refresh: vi.fn<() => Promise<LoginResponse>>(),
  logoutAll: vi.fn<() => Promise<void>>(),
  refreshAccessToken: vi.fn<() => Promise<string>>(),
}))

/**
 * Mock the user APIs to avoid actual HTTP requests during tests.
 */
vi.mock('@/lib/api/user', () => ({
  fetchCurrentUser: vi.fn<() => Promise<UserProfile>>(),
}))

/**
 * Mock the router module to avoid circular dependency and actual navigation.
 */
vi.mock('@/router', () => ({
  default: {
    push: vi.fn<() => Promise<void>>(),
  },
}))

/**
 * Mock VueUse's useStorage to prevent timer creation during tests.
 */
vi.mock('@vueuse/core', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useStorage: vi.fn<any>((key: string, defaultValue: unknown) => {
    const storedValue = localStorage.getItem(key)
    let parsedValue = defaultValue
    if (storedValue) {
      try {
        parsedValue = JSON.parse(storedValue)
      } catch {
        parsedValue = storedValue
      }
    }
    const refValue = ref(parsedValue)
    return refValue
  }),
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
        tokenType: 'Bearer' as const,
        termsExpired: false,
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
        tokenType: 'Bearer' as const,
        termsExpired: false,
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
        termsExpired: false,
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
        termsExpired: false,
      })

      store.clearAuth()

      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.userId).toBeNull()
    })
  })

  /**
   * Tests for clearRefreshTimer timer cleanup behavior.
   * Covers clearing pending timer and cleanup on logout.
   */
  describe('clearRefreshTimer', () => {
    beforeEach(() => {
      localStorage.clear()
      vi.clearAllMocks()
      vi.useFakeTimers()
      vi.clearAllTimers()
      setActivePinia(createPinia())
      useAuthStore().__resetTimerForTesting()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('clears pending refresh timer', async () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
      const expiresIn = 3600
      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        userId: 'user',
        expiresIn,
        tokenType: 'Bearer' as const,
        termsExpired: false,
      }

      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token')
      setActivePinia(createPinia())
      const store = useAuthStore()

      vi.mocked(authApi.refresh).mockResolvedValue(mockResponse)

      store.setAuth({ ...mockResponse, termsExpired: false })

      // Timer should be scheduled
      expect(setTimeoutSpy).toHaveBeenCalled()

      clearRefreshTimer()

      // clearTimeout should be called
      expect(clearTimeoutSpy).toHaveBeenCalled()

      // Advance time past scheduled refresh time
      vi.advanceTimersByTime(expiresIn * 1000)

      // Refresh should NOT be called after timer cleared
      expect(authApi.refresh).not.toHaveBeenCalled()

      setTimeoutSpy.mockRestore()
      clearTimeoutSpy.mockRestore()
    })

    it('handles clearing when no timer scheduled', () => {
      localStorage.clear()
      setActivePinia(createPinia())

      const timerCountBefore = vi.getTimerCount()

      expect(() => clearRefreshTimer()).not.toThrow()
      expect(vi.getTimerCount()).toBe(timerCountBefore)
    })

    it('timer cleanup on logout when clearRefreshTimer called', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
      const expiresIn = 3600
      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        userId: 'user',
        expiresIn,
        tokenType: 'Bearer' as const,
        termsExpired: false,
      }

      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token')
      setActivePinia(createPinia())
      const store = useAuthStore()

      vi.mocked(authApi.refresh).mockResolvedValue(mockResponse)

      store.setAuth({ ...mockResponse, termsExpired: false })

      // Timer should be scheduled
      expect(setTimeoutSpy).toHaveBeenCalled()

      store.clearAuth()

      // clearRefreshTimer should be called on logout
      expect(clearTimeoutSpy).toHaveBeenCalled()

      // Advance time past scheduled refresh
      vi.advanceTimersByTime(expiresIn * 1000)

      // No refresh should happen after logout
      expect(authApi.refresh).not.toHaveBeenCalled()

      setTimeoutSpy.mockRestore()
      clearTimeoutSpy.mockRestore()
    })
  })

  describe('initializeAuth', () => {
    it('returns false when no refresh token exists', async () => {
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      setActivePinia(createPinia())
      store = useAuthStore()

      const result = await store.initializeAuth()

      expect(result).toBe(false)
    })

    it('returns true when refresh succeeds', async () => {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'valid-refresh-token')
      setActivePinia(createPinia())
      store = useAuthStore()

      vi.mocked(authApi.refresh).mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        userId: 'user-id',
        expiresIn: 3600,
        tokenType: 'Bearer',
        termsExpired: false,
      })

      const result = await store.initializeAuth()

      expect(result).toBe(true)
      expect(store.accessToken).toBe('new-access-token')
      expect(store.refreshToken).toBe('new-refresh-token')
    })

    it('returns false and clears auth when refresh fails', async () => {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'invalid-refresh-token')
      setActivePinia(createPinia())
      store = useAuthStore()

      vi.mocked(authApi.refresh).mockRejectedValue(new Error('AUTH_003'))

      const result = await store.initializeAuth()

      expect(result).toBe(false)
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.userId).toBeNull()
    })
  })

  describe('fetchUserProfile', () => {
    it('populates displayName, email, emailVerified, lastLoginAt on success', async () => {
      const mockProfile: UserProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'alice@example.com',
        displayName: 'Alice',
        emailVerified: true,
        createdAt: '2026-01-15T10:30:00Z',
        lastLoginAt: '2026-07-01T09:15:00Z',
        termsVersion: '1.0.0',
      }
      vi.mocked(userApi.fetchCurrentUser).mockResolvedValue(mockProfile)

      const result = await store.fetchUserProfile()

      expect(result).toEqual(mockProfile)
      expect(store.displayName).toBe('Alice')
      expect(store.email).toBe('alice@example.com')
      expect(store.emailVerified).toBe(true)
      expect(store.lastLoginAt).toBe('2026-07-01T09:15:00Z')
    })

    it('returns null and warns on API failure', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.mocked(userApi.fetchCurrentUser).mockRejectedValue(new Error('Network error'))

      const result = await store.fetchUserProfile()

      expect(result).toBeNull()
      expect(store.displayName).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })

    it('deduplicates concurrent calls (Promise lock)', async () => {
      const mockProfile: UserProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'bob@example.com',
        displayName: 'Bob',
        emailVerified: false,
        createdAt: '2026-01-15T10:30:00Z',
        lastLoginAt: null,
        termsVersion: '1.0.0',
      }
      // Reset call counter so prior tests in this describe block don't inflate it
      vi.mocked(userApi.fetchCurrentUser).mockClear()
      // Simulate slow fetch
      let resolveProfile!: (v: UserProfile) => void
      vi.mocked(userApi.fetchCurrentUser).mockReturnValue(
        new Promise((resolve) => {
          resolveProfile = resolve
        }),
      )

      const promise1 = store.fetchUserProfile()
      const promise2 = store.fetchUserProfile()
      expect(userApi.fetchCurrentUser).toHaveBeenCalledTimes(1) // only ONE network call

      resolveProfile(mockProfile)
      await Promise.all([promise1, promise2])

      expect(store.displayName).toBe('Bob')
    })
  })

  describe('login', () => {
    it('calls login API with credentials and deviceId', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        userId: 'user-id',
        expiresIn: 3600,
        tokenType: 'Bearer',
        termsExpired: false,
      })

      const result = await store.login({
        email: 'user@example.com',
        password: 'SecurePass1!',
      })

      expect(authApi.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'SecurePass1!',
        deviceId: store.deviceId,
      })
      expect(result.accessToken).toBe('test-access-token')
      expect(store.accessToken).toBe('test-access-token')
    })

    it('sets auth state on successful login', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        userId: 'new-user-id',
        expiresIn: 7200,
        tokenType: 'Bearer',
        termsExpired: false,
      })

      await store.login({
        email: 'user@example.com',
        password: 'SecurePass1!',
      })

      expect(store.accessToken).toBe('new-access-token')
      expect(store.refreshToken).toBe('new-refresh-token')
      expect(store.userId).toBe('new-user-id')
      expect(store.isAuthenticated).toBe(true)
    })

    it('dispatches TERMS_EXPIRED_EVENT when termsExpired is true', async () => {
      const dispatchEventSpy = vi.spyOn(globalThis, 'dispatchEvent').mockImplementation(vi.fn())

      vi.mocked(authApi.login).mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        userId: 'user-id',
        expiresIn: 3600,
        tokenType: 'Bearer',
        termsExpired: true,
      })

      const result = await store.login({
        email: 'user@example.com',
        password: 'SecurePass1!',
      })

      expect(dispatchEventSpy).toHaveBeenCalled()
      const dispatchedEvent = dispatchEventSpy.mock.calls[0]![0] as CustomEvent
      expect(dispatchedEvent.type).toBe('api:terms-expired')

      expect(result.termsExpired).toBe(true)
      expect(store.accessToken).toBe('test-access-token')

      dispatchEventSpy.mockRestore()
    })

    it('sets auth state even when termsExpired is true (user is authenticated)', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        userId: 'user-id',
        expiresIn: 3600,
        tokenType: 'Bearer',
        termsExpired: true,
      })

      await store.login({
        email: 'user@example.com',
        password: 'SecurePass1!',
      })

      expect(store.accessToken).toBe('test-access-token')
      expect(store.refreshToken).toBe('test-refresh-token')
      expect(store.userId).toBe('user-id')
      expect(store.isAuthenticated).toBe(true)
    })

    it('returns response with termsExpired flag', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        userId: 'user-id',
        expiresIn: 3600,
        tokenType: 'Bearer',
        termsExpired: true,
      })

      const result = await store.login({
        email: 'user@example.com',
        password: 'SecurePass1!',
      })

      expect(result.termsExpired).toBe(true)
    })

    it('propagates login API error', async () => {
      const loginError = new Error('Invalid credentials')
      vi.mocked(authApi.login).mockRejectedValue(loginError)

      await expect(
        store.login({
          email: 'user@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow('Invalid credentials')
    })

    it('propagates network error on connection failure', async () => {
      const networkError = new TypeError('Failed to fetch')
      vi.mocked(authApi.login).mockRejectedValue(networkError)

      await expect(
        store.login({
          email: 'user@example.com',
          password: 'SecurePass1!',
        }),
      ).rejects.toThrow('Failed to fetch')
    })
  })
})
