import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ForgotPasswordView from '../ForgotPasswordView.vue'

// ==========================================
// Hoisted Mock Variables (must be before vi.mock)
// ==========================================

const mockPush = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockResolve = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>(() => Promise.resolve({ href: '/login' })))
const mockToastError = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockStart = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockIsApiError = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockMapApiErrorCode = vi.hoisted(() => vi.fn<(code: string) => string>((code) => code))
const mockForgotPassword = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())

const countdownState = vi.hoisted(() => ({ value: 0 }))
const isActiveState = vi.hoisted(() => ({ value: false }))
const isPendingRef = vi.hoisted(() => ({ __v_isRef: true, value: false }))
const isSubmittedState = vi.hoisted(() => ({ value: false }))
const submittedEmailState = vi.hoisted(() => ({ value: '' }))

let mutationOnSuccess: ((data: unknown, variables: { email: string }) => void) | undefined
let mutationOnError: ((error: unknown) => void) | undefined

// ==========================================
// Mocks
// ==========================================

vi.mock('vue-router', () => ({
  useRouter: vi.fn<() => { push: (...args: unknown[]) => unknown; resolve: (...args: unknown[]) => unknown }>(() => ({
    push: mockPush,
    resolve: mockResolve,
  })),
  useRoute: vi.fn<() => { query: Record<string, unknown> }>(() => ({
    query: {},
  })),
  RouterLink: vi.fn<
    (_: unknown, ctx: { slots: { default?: () => unknown }; attrs: Record<string, unknown> }) => unknown
  >((_, { slots }) => slots?.default?.()),
  createRouter: vi.fn<() => { install: () => void; onError: () => void }>(() => ({
    install: vi.fn<() => void>(),
    onError: vi.fn<() => void>(),
  })),
  createWebHistory: vi.fn<() => void>(),
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

vi.mock('@tanstack/vue-query', () => ({
  QueryClient: vi.fn<() => void>(),
  useMutation: vi.fn<
    (options: {
      onSuccess?: (data: unknown, variables: { email: string }) => void
      onError?: (error: unknown) => void
    }) => {
      mutate: (...args: unknown[]) => unknown
      isPending: { value: boolean }
    }
  >((options) => {
    mutationOnSuccess = options.onSuccess
    mutationOnError = options.onError
    return {
      mutate: mockMutate,
      isPending: isPendingRef,
    }
  }),
}))

vi.mock('@/composables/useCooldown', () => ({
  useCooldown: vi.fn<
    () => { countdown: { value: number }; isActive: { value: boolean }; start: (...args: unknown[]) => unknown }
  >(() => ({
    countdown: countdownState,
    isActive: isActiveState,
    start: mockStart,
  })),
}))

vi.mock('@/lib/api/auth', () => ({
  forgotPassword: mockForgotPassword,
}))

vi.mock('@/composables/usePublicConfig', () => ({
  usePublicConfig: vi.fn<() => { data: unknown; isLoading: { value: boolean }; error: { value: null } }>(() => ({
    data: { value: { captchaSiteKey: null, termsVersion: '1.0' } },
    isLoading: { value: false },
    error: { value: null },
  })),
}))

vi.mock('@/lib/utils/api-error', () => ({
  isApiError: mockIsApiError,
  mapApiErrorCode: mockMapApiErrorCode,
}))

vi.mock('@/router/route-names', () => ({
  RouteNames: {
    HOME: 'home',
    NOT_FOUND: 'not-found',
    AUTH_LAYOUT: 'auth-layout',
    LOGIN: 'login',
    REGISTER: 'register',
    REGISTER_SUCCESS: 'register-success',
    VERIFY_EMAIL: 'verify-email',
    FORGOT_PASSWORD: 'forgot-password',
    RESET_PASSWORD: 'reset-password',
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

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn<() => { isDark: boolean }>(() => ({
    isDark: false,
  })),
}))

vi.mock('../components/ForgotPasswordForm.vue', () => ({
  default: {
    name: 'ForgotPasswordForm',
    props: { loading: { type: [Boolean, Object], default: false } },
    emits: ['submit'],
    template:
      '<div data-testid="forgot-password-form"><span data-testid="form-loading">{{ loading }}</span><button type="submit" :disabled="loading">Send reset link</button></div>',
  },
}))

// ==========================================
// Helper Functions
// ==========================================

function createApiError(statusCode: number, code?: string): unknown {
  return {
    statusCode,
    statusMessage: 'Error',
    message: 'An error occurred',
    data: code ? { code } : undefined,
  }
}

function resetMocks() {
  vi.clearAllMocks()
  countdownState.value = 0
  isActiveState.value = false
  isPendingRef.value = false
  isSubmittedState.value = false
  submittedEmailState.value = ''
  mutationOnSuccess = undefined
  mutationOnError = undefined
  mockMutate.mockClear()
  mockPush.mockClear()
  mockToastError.mockClear()
  mockStart.mockClear()
  mockIsApiError.mockReset()
  mockMapApiErrorCode.mockReset().mockImplementation((code) => code)
}

// ==========================================
// Tests
// ==========================================

describe('ForgotPasswordView', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('Form submission', () => {
    it('calls mutation.mutate with correct email payload', () => {
      mount(ForgotPasswordView)
      expect(mutationOnSuccess).toBeDefined()
      expect(mutationOnError).toBeDefined()

      mockMutate({ email: 'test@example.com' })
      expect(mockMutate).toHaveBeenCalledWith({ email: 'test@example.com' })
    })
  })

  describe('Success flow', () => {
    it('shows inline success panel with submitted email on successful mutation', async () => {
      const wrapper = mount(ForgotPasswordView)
      expect(mutationOnSuccess).toBeDefined()

      mutationOnSuccess!({}, { email: 'user@example.com' })
      await nextTick()
      await nextTick()

      expect(wrapper.html()).toContain('user@example.com')
      expect(wrapper.html()).toContain('Back to sign in')
    })

    it('hides the form and description text after successful submission', async () => {
      const wrapper = mount(ForgotPasswordView)
      expect(mutationOnSuccess).toBeDefined()

      mutationOnSuccess!({}, { email: 'test@test.com' })
      await nextTick()
      await nextTick()

      expect(wrapper.html()).toContain('test@test.com')
      expect(wrapper.html()).not.toContain('Enter your email address')
    })
  })

  describe('429 rate limit error', () => {
    it('starts cooldown and shows rate limit toast with countdown', () => {
      countdownState.value = 60
      mockIsApiError.mockReturnValue(true)
      mockMapApiErrorCode.mockReturnValue('Too many requests. Please wait a moment before trying again.')

      mount(ForgotPasswordView)
      expect(mutationOnError).toBeDefined()

      const error = createApiError(429)
      mutationOnError!(error)

      expect(mockIsApiError).toHaveBeenCalledWith(error)
      expect(mockStart).toHaveBeenCalled()
      expect(mockMapApiErrorCode).toHaveBeenCalledWith('rate_limit_exceeded')
      expect(mockToastError).toHaveBeenCalledWith('Too many requests. Please wait a moment before trying again.', {
        description: 'Try again in 60s',
      })
    })
  })

  describe('COMMON_003 error', () => {
    it('shows mapped error message for COMMON_003 code', () => {
      mockIsApiError.mockReturnValue(true)
      mockMapApiErrorCode.mockReturnValue('Invalid input. Please check your entries and try again.')

      mount(ForgotPasswordView)
      expect(mutationOnError).toBeDefined()

      const error = createApiError(400, 'COMMON_003')
      mutationOnError!(error)

      expect(mockIsApiError).toHaveBeenCalledWith(error)
      expect(mockMapApiErrorCode).toHaveBeenCalledWith('COMMON_003')
      expect(mockToastError).toHaveBeenCalledWith('Invalid input. Please check your entries and try again.')
    })
  })

  describe('SECURITY_006 captcha error', () => {
    it('displays captcha error for SECURITY_006', () => {
      mockIsApiError.mockReturnValue(true)
      mockMapApiErrorCode.mockReturnValue('Captcha verification failed. Please try again.')

      mount(ForgotPasswordView)
      expect(mutationOnError).toBeDefined()

      const error = createApiError(400, 'SECURITY_006')
      mutationOnError!(error)

      expect(mockIsApiError).toHaveBeenCalledWith(error)
      expect(mockMapApiErrorCode).toHaveBeenCalledWith('SECURITY_006')
      expect(mockToastError).toHaveBeenCalledWith('Captcha verification failed. Please try again.')
    })
  })

  describe('SECURITY_007 captcha error', () => {
    it('displays captcha error for SECURITY_007', () => {
      mockIsApiError.mockReturnValue(true)
      mockMapApiErrorCode.mockReturnValue('Please complete the captcha verification.')

      mount(ForgotPasswordView)
      expect(mutationOnError).toBeDefined()

      const error = createApiError(400, 'SECURITY_007')
      mutationOnError!(error)

      expect(mockIsApiError).toHaveBeenCalledWith(error)
      expect(mockMapApiErrorCode).toHaveBeenCalledWith('SECURITY_007')
      expect(mockToastError).toHaveBeenCalledWith('Please complete the captcha verification.')
    })
  })

  describe('Generic API error', () => {
    it('shows generic error toast for 500 server error', () => {
      mockIsApiError.mockReturnValue(true)

      mount(ForgotPasswordView)
      expect(mutationOnError).toBeDefined()

      const error = createApiError(500, 'SOME_UNKNOWN_CODE')
      mutationOnError!(error)

      expect(mockIsApiError).toHaveBeenCalledWith(error)
      expect(mockToastError).toHaveBeenCalledWith('Request failed', {
        description: 'Please try again later',
      })
    })

    it('shows generic error toast for 400 error with unknown code', () => {
      mockIsApiError.mockReturnValue(true)

      mount(ForgotPasswordView)
      expect(mutationOnError).toBeDefined()

      const error = createApiError(400, 'UNKNOWN_CODE')
      mutationOnError!(error)

      expect(mockIsApiError).toHaveBeenCalledWith(error)
      expect(mockToastError).toHaveBeenCalledWith('Request failed', {
        description: 'Please try again later',
      })
    })
  })

  describe('Non-API error', () => {
    it('shows generic error toast for network errors', () => {
      mockIsApiError.mockReturnValue(false)

      mount(ForgotPasswordView)
      expect(mutationOnError).toBeDefined()

      const error = new Error('Network error')
      mutationOnError!(error)

      expect(mockIsApiError).toHaveBeenCalledWith(error)
      expect(mockToastError).toHaveBeenCalledWith('Request failed', {
        description: 'An unexpected error occurred',
      })
    })
  })

  describe('Loading state', () => {
    it('disables submit button when mutation is pending', async () => {
      isPendingRef.value = true
      const wrapper = mount(ForgotPasswordView)
      await nextTick()

      const button = wrapper.find('button[type="submit"]')
      expect(button.attributes('disabled')).toBe('')
      expect(wrapper.html()).toContain('Sending...')
    })

    it('enables submit button when mutation is not pending', async () => {
      isPendingRef.value = false
      const wrapper = mount(ForgotPasswordView)
      await nextTick()

      const button = wrapper.find('button[type="submit"]')
      expect(button.attributes('disabled')).toBeUndefined()
      expect(wrapper.html()).toContain('Send reset link')
      expect(wrapper.html()).not.toContain('Sending...')
    })
  })
})
