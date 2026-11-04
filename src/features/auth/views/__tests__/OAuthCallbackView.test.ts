import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import OAuthCallbackView from '../OAuthCallbackView.vue'

// ==========================================
// Hoisted Mock Variables (must be before vi.mock)
// ==========================================

const mockReplace = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockResolve = vi.hoisted(() =>
  vi.fn<(raw: string) => { meta: { requiresAuth: boolean } }>((raw) => ({
    // Unit-boundary stub: the resolver only reads meta.requiresAuth; the real
    // route table is exercised by the login/OAuth e2e specs.
    meta: { requiresAuth: !raw.startsWith('/auth') && raw !== '/' },
  })),
)
const mockToastError = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockLoginWithOAuth = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockSetTwoFactorChallenge = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
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
  useRouter: vi.fn<() => { replace: (...args: unknown[]) => unknown; resolve: (raw: string) => unknown }>(() => ({
    replace: mockReplace,
    resolve: mockResolve,
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
  useAuthStore: vi.fn<
    () => {
      loginWithOAuth: (...args: unknown[]) => unknown
      setTwoFactorChallenge: (...args: unknown[]) => unknown
    }
  >(() => ({
    loginWithOAuth: mockLoginWithOAuth,
    setTwoFactorChallenge: mockSetTwoFactorChallenge,
  })),
}))

vi.mock('@/router/route-names', () => ({
  RouteNames: {
    LANDING: 'landing',
    NOT_FOUND: 'not-found',
    AUTH_LAYOUT: 'auth-layout',
    LOGIN: 'login',
    LOGIN_TWO_FACTOR: 'login-two-factor',
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
  sessionStorage.clear()
  // A real hand-off comes back into the tab that left for the provider; the view refuses it otherwise.
  sessionStorage.setItem('ctt.oauth-flow', '1')
}

// ==========================================
// Tests
// ==========================================

describe('OAuthCallbackView', () => {
  beforeEach(() => {
    resetMocks()

    // Restore history.replaceState default mock (vi.clearAllMocks clears it). It also clears the
    // fragment like the real one, so a wipe that runs before the challenge is read is caught.
    vi.spyOn(window.history, 'replaceState').mockImplementation((...args: Parameters<History['replaceState']>) => {
      mockHistoryReplaceState(...args)
      window.location.hash = ''
    })
  })

  describe('A hand-off this tab never started', () => {
    it('refuses tokens from a link and sends the reader back to the sign-in page', async () => {
      setQuery({ accessToken: 'attacker-access', refreshToken: 'attacker-refresh' })
      sessionStorage.clear()

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      // Accepting them would silently switch the reader into whoever sent the link.
      expect(mockLoginWithOAuth).not.toHaveBeenCalled()
      expect(mockReplace).toHaveBeenCalledWith({ name: 'login' })
      // The tokens never stay in the address bar either.
      expect(mockHistoryReplaceState).toHaveBeenCalledWith(null, '', '/oauth/callback')
      expect(mockToastError).toHaveBeenCalledTimes(1)
    })

    it('refuses a second-step fragment that arrived without an in-app start', async () => {
      setQuery({ twoFactorRequired: 'true' })
      sessionStorage.clear()
      window.location.hash = '#challengeToken=abc&expiresIn=300'

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockSetTwoFactorChallenge).not.toHaveBeenCalled()
      expect(mockReplace).toHaveBeenCalledWith({ name: 'login' })
      window.location.hash = ''
    })
  })

  describe('Happy path', () => {
    it('calls loginWithOAuth and redirects to dashboard when accessToken + refreshToken present', async () => {
      setQuery({ accessToken: 'access-123' })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockLoginWithOAuth).toHaveBeenCalledTimes(1)
      expect(mockLoginWithOAuth).toHaveBeenCalledWith({
        accessToken: 'access-123',
        termsExpired: false,
      })
      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith({ name: 'dashboard' })
      expect(mockHistoryReplaceState).toHaveBeenCalledTimes(1)
      expect(mockHistoryReplaceState).toHaveBeenCalledWith(null, '', '/oauth/callback')
    })
  })

  describe('Two-factor challenge', () => {
    it('carries how many passkeys could answer the step', async () => {
      setQuery({ twoFactorRequired: 'true' })
      window.location.hash = '#challengeToken=challenge-token&expiresIn=300&passkeyCount=2'

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      // The count decides whether the second step offers the passkey alternative at all.
      expect(mockSetTwoFactorChallenge).toHaveBeenCalledWith(expect.objectContaining({ passkeyCount: 2 }))

      window.location.hash = ''
    })

    it('parks the challenge from the fragment and forwards to the second step', async () => {
      setQuery({ twoFactorRequired: 'true' })
      window.location.hash = '#challengeToken=challenge-token&expiresIn=300'

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockSetTwoFactorChallenge).toHaveBeenCalledWith({
        twoFactorRequired: true,
        challengeToken: 'challenge-token',
        expiresIn: 300,
        // Absent from this fragment, so the step offers no passkey alternative.
        passkeyCount: 0,
      })
      expect(mockLoginWithOAuth).not.toHaveBeenCalled()
      expect(mockReplace).toHaveBeenCalledWith({ name: 'login-two-factor' })
      // A fragment is a credential: it must leave the address bar before the page navigates.
      expect(mockHistoryReplaceState).toHaveBeenCalledWith(null, '', '/oauth/callback')

      window.location.hash = ''
    })

    it('treats a fragment without a lifetime as an unusable challenge', async () => {
      setQuery({ twoFactorRequired: 'true' })
      window.location.hash = '#challengeToken=challenge-token'

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      // A missing lifetime parses to 0; the page must not hand that to the schema and throw.
      expect(mockSetTwoFactorChallenge).not.toHaveBeenCalled()
      expect(mockToastError).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith({ name: 'login' })

      window.location.hash = ''
    })

    it('carries the destination of the original sign-in into the second step', async () => {
      sessionStorage.setItem('oauth_redirect', '/settings/api-keys')
      setQuery({ twoFactorRequired: 'true' })
      window.location.hash = '#challengeToken=challenge-token&expiresIn=300'

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockReplace).toHaveBeenCalledWith({
        name: 'login-two-factor',
        query: { redirect: '/settings/api-keys' },
      })
      // The key is single-use: leaving it behind would steer a later sign-in elsewhere.
      expect(sessionStorage.getItem('oauth_redirect')).toBeNull()

      window.location.hash = ''
    })

    it('sends the reader back to sign-in when the fragment carries no challenge', async () => {
      setQuery({ twoFactorRequired: 'true' })
      window.location.hash = '#expiresIn=300'

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockSetTwoFactorChallenge).not.toHaveBeenCalled()
      expect(mockToastError).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith({ name: 'login' })

      window.location.hash = ''
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
      // The query comes off the URL before the tokens are even read.
      expect(mockHistoryReplaceState).toHaveBeenCalledTimes(1)
    })

    it('signs the reader in from the access token alone, the cookie carrying the rest', async () => {
      setQuery({ accessToken: 'access-123' })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      // Nothing else is required: the refresh token arrived as an httpOnly cookie on the same
      // response, which is why the URL of this flow never carries one.
      expect(mockLoginWithOAuth).toHaveBeenCalledWith({ accessToken: 'access-123', termsExpired: false })
      expect(mockToastError).not.toHaveBeenCalled()
      expect(mockReplace).toHaveBeenCalledWith({ name: 'dashboard' })
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

    it('redirects to nested safe path (e.g. /settings/devices)', async () => {
      setQuery({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        redirect: '/settings/devices',
      })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockReplace).toHaveBeenCalledWith('/settings/devices')
    })

    it('falls back to the dashboard when the redirect points at a public page', async () => {
      setQuery({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        redirect: '/',
      })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      expect(mockReplace).toHaveBeenCalledWith({ name: 'dashboard' })
      expect(mockReplace).not.toHaveBeenCalledWith('/')
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

    it('still wipes the query when tokens are missing', async () => {
      setQuery({ redirect: '/settings' })

      const wrapper = mount(OAuthCallbackView)
      await wrapper.vm.$nextTick()

      // Whatever the callback URL carries comes off it first: history keeps a query for later readers.
      expect(mockHistoryReplaceState).toHaveBeenCalledTimes(1)
      expect(mockHistoryReplaceState).toHaveBeenCalledWith(null, '', '/oauth/callback')
    })
  })
})
