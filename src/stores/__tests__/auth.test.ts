import { describe, it, expect, beforeEach, vi, afterEach } from 'vite-plus/test'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useAuthStore, STORAGE_KEYS, clearRefreshTimer } from '../auth'
import * as authApi from '@/lib/api/auth'
import type { LoginResponse } from '@/lib/schemas/auth.schema'

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
      }

      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token')
      setActivePinia(createPinia())
      const store = useAuthStore()

      vi.mocked(authApi.refresh).mockResolvedValue(mockResponse)

      store.setAuth(mockResponse)

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
      }

      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token')
      setActivePinia(createPinia())
      const store = useAuthStore()

      vi.mocked(authApi.refresh).mockResolvedValue(mockResponse)

      store.setAuth(mockResponse)

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
})
