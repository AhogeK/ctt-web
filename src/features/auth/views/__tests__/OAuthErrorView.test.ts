import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import OAuthErrorView from '../OAuthErrorView.vue'

// ==========================================
// Hoisted Mock Variables (must be before vi.mock)
// ==========================================

const mockReplace = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockQuery = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))

// ==========================================
// Mocks
// ==========================================

vi.mock('vue-router', () => ({
  useRouter: vi.fn<() => { replace: (...args: unknown[]) => unknown }>(() => ({
    replace: mockReplace,
  })),
  useRoute: vi.fn<() => { query: Record<string, unknown> }>(() => ({
    get query() {
      return mockQuery.value
    },
  })),
}))

vi.mock('@/router/route-names', () => ({
  RouteNames: {
    HOME: 'home',
    HOME_INDEX: 'home-index',
    NOT_FOUND: 'not-found',
    AUTH_LAYOUT: 'auth-layout',
    LOGIN: 'login',
    REGISTER: 'register',
    REGISTER_SUCCESS: 'register-success',
    VERIFY_EMAIL: 'verify-email',
    FORGOT_PASSWORD: 'forgot-password',
    RESET_PASSWORD: 'reset-password',
    CHANGE_EMAIL: 'change-email',
    OAUTH_CALLBACK: 'oauth-callback',
    OAUTH_ERROR: 'oauth-error',
    DASHBOARD: 'dashboard',
    DASHBOARD_HOME: 'dashboard-home',
    DEVICES: 'devices',
    DEVICES_LIST: 'devices-list',
    SETTINGS: 'settings',
    SETTINGS_PROFILE: 'settings-profile',
    SETTINGS_API_KEYS: 'settings-api-keys',
    SETTINGS_DEVICES: 'settings-devices',
    LEADERBOARD: 'leaderboard',
  },
}))

vi.mock('@/components/ui/button', () => ({
  Button: { template: '<button><slot /></button>' },
}))

vi.mock('@/lib/utils', () => ({
  cn: vi.fn<(...args: unknown[]) => string>((...args: unknown[]) => args.filter(Boolean).join(' ')),
}))

// ==========================================
// Helper Functions
// ==========================================

function mountWithQuery(query: Record<string, unknown> = {}) {
  mockQuery.value = query
  return mount(OAuthErrorView)
}

function resetMocks() {
  vi.clearAllMocks()
  mockQuery.value = {}
  mockReplace.mockClear()
}

// ==========================================
// Tests
// ==========================================

describe('OAuthErrorView', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('Error code mapping', () => {
    it('shows mapped message for known error code AUTH_013', () => {
      const wrapper = mountWithQuery({ code: 'AUTH_013' })

      expect(wrapper.text()).toContain('Authorization session expired. Please try again.')
    })

    it('shows mapped message for known error code AUTH_015', () => {
      const wrapper = mountWithQuery({ code: 'AUTH_015' })

      expect(wrapper.text()).toContain('GitHub authorization failed. Please try again.')
    })

    it('shows mapped message for known error code OAUTH_PROVIDER_ERROR', () => {
      const wrapper = mountWithQuery({ code: 'OAUTH_PROVIDER_ERROR' })

      expect(wrapper.text()).toContain('GitHub authorization was cancelled or failed.')
    })

    it('shows default fallback message for unknown error code', () => {
      const wrapper = mountWithQuery({ code: 'UNKNOWN_CODE' })

      expect(wrapper.text()).toContain('An unexpected error occurred. Please try again.')
    })

    it('shows default fallback message when code query param is missing', () => {
      const wrapper = mountWithQuery({})

      expect(wrapper.text()).toContain('An unexpected error occurred. Please try again.')
    })

    it('renders the error code in the UI', () => {
      const wrapper = mountWithQuery({ code: 'AUTH_013' })

      expect(wrapper.text()).toContain('Error code: AUTH_013')
    })

    it('renders UNKNOWN_ERROR when code query param is missing', () => {
      const wrapper = mountWithQuery({})

      expect(wrapper.text()).toContain('Error code: UNKNOWN_ERROR')
    })
  })

  describe('Sign in failed heading', () => {
    it('always shows the "Sign in failed" heading regardless of error code', () => {
      const knownWrapper = mountWithQuery({ code: 'AUTH_013' })
      const unknownWrapper = mountWithQuery({ code: 'UNKNOWN' })
      const emptyWrapper = mountWithQuery({})

      expect(knownWrapper.text()).toContain('Sign in failed')
      expect(unknownWrapper.text()).toContain('Sign in failed')
      expect(emptyWrapper.text()).toContain('Sign in failed')
    })
  })

  describe('Try again button', () => {
    it('calls router.replace with LOGIN route when clicked', async () => {
      const wrapper = mountWithQuery({ code: 'AUTH_013' })

      const buttons = wrapper.findAll('button')
      const retryButton = buttons.find((b) => b.text() === 'Try again')
      expect(retryButton).toBeDefined()

      await retryButton!.trigger('click')

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith({ name: 'login' })
    })
  })

  describe('Back to home button', () => {
    it('calls router.replace with HOME route when clicked', async () => {
      const wrapper = mountWithQuery({ code: 'AUTH_013' })

      const buttons = wrapper.findAll('button')
      const homeButton = buttons.find((b) => b.text() === 'Back to home')
      expect(homeButton).toBeDefined()

      await homeButton!.trigger('click')

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith({ name: 'home' })
    })
  })
})
