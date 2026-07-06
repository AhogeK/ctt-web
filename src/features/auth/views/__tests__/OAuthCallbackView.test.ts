import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import OAuthCallbackView from '../OAuthCallbackView.vue'

// ==========================================
// Hoisted Mock Variables (must be before vi.mock)
// ==========================================

const mockReplace = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockToastError = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockLoginWithOAuth = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockHistoryReplaceState = vi.hoisted(() =>
  vi.fn<(state: unknown, title: string, url?: string | URL | null) => void>(),
)

// Mutable state objects for refs (can't use ref in hoisted)
const routeQueryState = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))
const routePathState = vi.hoisted(() => ({ value: '/oauth/callback' }))

// ==========================================
// Mocks
// ==========================================

vi.mock('vue-router', () => ({
  useRouter: vi.fn<() => { replace: (...args: unknown[]) => unknown }>(() => ({
    replace: mockReplace,
  })),
  useRoute: vi.fn<() => { query: Record<string, unknown>; path: string }>(() => ({
    query: routeQueryState.value,
    path: routePathState.value,
  })),
  createRouter: vi.fn<() => { install: () => void; onError: () => void }>(() => ({
    install: vi.fn<() => void>(),
    onError: vi.fn<() => void>(),
  })),
  createWebHistory: vi.fn<() => void>(),
  RouterLink: vi.fn<() => void>(),
}))

vi.mock('@/router', () => ({
  default: {
    push: vi.fn<() => void>(),
    currentRoute: { value: { fullPath: '/' } },
  },
}))

vi.mock('vue-sonner', () => ({
  toast: {
    error: mockToastError,
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<() => { loginWithOAuth: (...args: unknown[]) => unknown }>(() => ({
    loginWithOAuth: mockLoginWithOAuth,
  })),
}))

vi.mock('@/router/route-names', () => ({
  RouteNames: {
    HOME: 'home',
    NOT_FOUND: 'not-found',
    AUTH_LAYOUT: 'auth-layout',
    LOGIN: 'login',
    REGISTER: 'register',
    OAUTH_CALLBACK: 'oauth-callback',
    DASHBOARD: 'dashboard',
    DASHBOARD_HOME: 'dashboard-home',
    DEVICES: 'devices',
    SETTINGS: 'settings',
  },
}))

// ==========================================
// Helper Functions
// ==========================================

function setQuery(query: Record<string, unknown>): void {
  routeQueryState.value = query
}

function resetMocks(): void {
  vi.clearAllMocks()
  routeQueryState.value = {}
  routePathState.value = '/oauth/callback'
}

// ==========================================
// Tests
// ==========================================

describe('OAuthCallbackView', () => {
  beforeEach(() => {
    resetMocks()

    // Restore history.replaceState default mock (vi.clearAllMocks clears it)
    vi.spyOn(window.history, 'replaceState').mockImplementation(mockHistoryReplaceState)
  })

  describe('Happy path', () => {
    it('calls loginWithOAuth and redirects to dashboard when accessToken + refreshToken present', async () => {
      setQuery({ accessToken: 'access-123', refreshToken: 'refresh-456' })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockLoginWithOAuth).toHaveBeenCalledTimes(1)
      expect(mockLoginWithOAuth).toHaveBeenCalledWith({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        termsExpired: false,
      })
      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith({ name: 'dashboard' })
      expect(mockHistoryReplaceState).toHaveBeenCalledTimes(1)
      expect(mockHistoryReplaceState).toHaveBeenCalledWith(null, '', '/oauth/callback')
    })
  })

  describe('Missing tokens', () => {
    it('shows toast error and redirects to login when accessToken is missing', async () => {
      setQuery({ refreshToken: 'refresh-456' })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockToastError).toHaveBeenCalledTimes(1)
      expect(mockToastError).toHaveBeenCalledWith('OAuth login failed', {
        description: 'Missing authentication tokens',
      })
      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith({ name: 'login' })
      expect(mockLoginWithOAuth).not.toHaveBeenCalled()
      expect(mockHistoryReplaceState).not.toHaveBeenCalled()
    })

    it('shows toast error and redirects to login when refreshToken is missing', async () => {
      setQuery({ accessToken: 'access-123' })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockToastError).toHaveBeenCalledTimes(1)
      expect(mockToastError).toHaveBeenCalledWith('OAuth login failed', {
        description: 'Missing authentication tokens',
      })
      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith({ name: 'login' })
      expect(mockLoginWithOAuth).not.toHaveBeenCalled()
      expect(mockHistoryReplaceState).not.toHaveBeenCalled()
    })

    it('shows toast error and redirects to login when both tokens are missing', async () => {
      setQuery({})

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockToastError).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith({ name: 'login' })
      expect(mockLoginWithOAuth).not.toHaveBeenCalled()
    })
  })

  describe('Terms expired', () => {
    it('does NOT redirect to dashboard when termsExpired=true (App.vue handles it)', async () => {
      setQuery({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        termsExpired: 'true',
      })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockLoginWithOAuth).toHaveBeenCalledWith({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        termsExpired: true,
      })
      expect(mockReplace).not.toHaveBeenCalled()
      expect(mockHistoryReplaceState).toHaveBeenCalledTimes(1)
    })

    it('treats termsExpired=false as falsy (redirects normally)', async () => {
      setQuery({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        termsExpired: 'false',
      })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockLoginWithOAuth).toHaveBeenCalledWith({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        termsExpired: false,
      })
      expect(mockReplace).toHaveBeenCalledWith({ name: 'dashboard' })
    })
  })

  describe('Safe redirect', () => {
    it('redirects to relative path when redirect=/settings is safe', async () => {
      setQuery({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        redirect: '/settings',
      })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/settings')
    })

    it('redirects to nested safe path (e.g. /devices/123)', async () => {
      setQuery({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        redirect: '/devices/123',
      })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockReplace).toHaveBeenCalledWith('/devices/123')
    })
  })

  describe('Unsafe redirect (open redirect protection)', () => {
    it('rejects absolute https URL and falls back to dashboard', async () => {
      setQuery({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        redirect: 'https://evil.com/phish',
      })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith({ name: 'dashboard' })
      expect(mockReplace).not.toHaveBeenCalledWith('https://evil.com/phish')
    })

    it('rejects absolute http URL and falls back to dashboard', async () => {
      setQuery({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        redirect: 'http://evil.com',
      })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockReplace).toHaveBeenCalledWith({ name: 'dashboard' })
    })

    it('rejects protocol-relative URL (//evil.com) and falls back to dashboard', async () => {
      setQuery({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        redirect: '//evil.com',
      })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockReplace).toHaveBeenCalledWith({ name: 'dashboard' })
    })

    it('rejects relative path that does not start with /', async () => {
      setQuery({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        redirect: 'settings',
      })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockReplace).toHaveBeenCalledWith({ name: 'dashboard' })
    })

    it('falls back to dashboard when redirect is absent', async () => {
      setQuery({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
      })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockReplace).toHaveBeenCalledWith({ name: 'dashboard' })
    })
  })

  describe('URL cleanup', () => {
    it('calls history.replaceState to remove query params after success', async () => {
      setQuery({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        redirect: '/settings',
      })
      routePathState.value = '/oauth/callback'

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockHistoryReplaceState).toHaveBeenCalledTimes(1)
      expect(mockHistoryReplaceState).toHaveBeenCalledWith(null, '', '/oauth/callback')
    })

    it('does NOT call history.replaceState when tokens are missing', async () => {
      setQuery({ redirect: '/settings' })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockHistoryReplaceState).not.toHaveBeenCalled()
    })
  })
})
