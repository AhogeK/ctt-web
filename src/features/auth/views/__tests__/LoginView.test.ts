import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import LoginView from '../LoginView.vue'

// ==========================================
// Hoisted Mock Variables (must be before vi.mock)
// ==========================================

const mockPush = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockToastError = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockStart = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockIsApiError = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockMapApiErrorCode = vi.hoisted(() => vi.fn<(code: string) => string>((code) => code))
const mockCaptchaReset = vi.hoisted(() => vi.fn<() => void>())
const mockResend = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())

const countdownState = vi.hoisted(() => ({ value: 0 }))
const isPendingRef = vi.hoisted(() => ({ __v_isRef: true, value: false }))
const publicConfigData = vi.hoisted(() => ({
  value: { captchaSiteKey: '10000000-ffff-ffff-ffff-000000000001' as string | null, termsVersion: '1.0' },
}))

let mutationOnSuccess: (() => void) | undefined
let mutationOnError: ((error: unknown) => void) | undefined

// ==========================================
// Mocks
// ==========================================

vi.mock('vue-router', () => ({
  useRouter: vi.fn<() => { push: (...args: unknown[]) => unknown }>(() => ({
    push: mockPush,
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
    (options: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
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

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<() => { login: () => void }>(() => ({
    login: vi.fn<() => void>(),
  })),
}))

vi.mock('@/composables/useCooldown', () => ({
  useCooldown: vi.fn<() => { countdown: { value: number }; start: (...args: unknown[]) => unknown }>(() => ({
    countdown: countdownState,
    start: mockStart,
  })),
}))

vi.mock('../composables/useResendVerification', () => ({
  useResendVerification: vi.fn<() => { resend: unknown; countdown: { value: number }; isPending: { value: boolean } }>(
    () => ({
      resend: mockResend,
      countdown: { value: 0 },
      isPending: { value: false },
    }),
  ),
}))

vi.mock('@/composables/usePublicConfig', () => ({
  usePublicConfig: vi.fn<() => { data: unknown; isLoading: { value: boolean }; error: { value: null } }>(() => ({
    data: publicConfigData,
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

function createLoginFormStub() {
  return defineComponent({
    name: 'LoginForm',
    props: {
      loading: { type: [Boolean, Object], default: false },
      captchaSiteKey: { type: [String, null], default: null },
    },
    emits: ['submit'],
    setup(_: unknown, { expose }: { expose: (exposed: Record<string, unknown>) => void }) {
      expose({
        form: { setFieldError: vi.fn<() => void>() },
        captchaRef: { reset: mockCaptchaReset },
      })
      return {}
    },
    template: '<div data-testid="login-form"><span data-testid="captcha-site-key">{{ captchaSiteKey }}</span></div>',
  })
}

vi.mock('@/components/ui/dialog', () => ({
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<div><slot /></div>' },
  DialogFooter: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
}))

vi.mock('@/components/ui/button', () => ({
  Button: { template: '<button><slot /></button>' },
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
  isPendingRef.value = false
  publicConfigData.value = { captchaSiteKey: '10000000-ffff-ffff-ffff-000000000001', termsVersion: '1.0' }
  mutationOnSuccess = undefined
  mutationOnError = undefined
  mockMutate.mockClear()
  mockPush.mockClear()
  mockToastError.mockClear()
  mockStart.mockClear()
  mockCaptchaReset.mockClear()
  mockIsApiError.mockReset()
  mockMapApiErrorCode.mockReset().mockImplementation((code) => code)
}

// ==========================================
// Tests
// ==========================================

describe('LoginView - hCaptcha integration', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('captchaSiteKey passthrough', () => {
    it('passes captchaSiteKey from public config to LoginForm', () => {
      const wrapper = mount(LoginView, {
        global: { stubs: { LoginForm: createLoginFormStub() } },
      })

      const formStub = wrapper.findComponent({ name: 'LoginForm' })
      expect(formStub.exists()).toBe(true)
      expect(formStub.props('captchaSiteKey')).toBe('10000000-ffff-ffff-ffff-000000000001')
    })

    it('passes null when captchaSiteKey is not in public config', () => {
      publicConfigData.value = { captchaSiteKey: null, termsVersion: '1.0' }

      const wrapper = mount(LoginView, {
        global: { stubs: { LoginForm: createLoginFormStub() } },
      })

      const formStub = wrapper.findComponent({ name: 'LoginForm' })
      expect(formStub.props('captchaSiteKey')).toBeNull()
    })
  })

  describe('Captcha ref reset', () => {
    it('resets captcha ref after successful login', () => {
      mount(LoginView, {
        global: { stubs: { LoginForm: createLoginFormStub() } },
      })
      expect(mutationOnSuccess).toBeDefined()

      mutationOnSuccess!()

      expect(mockCaptchaReset).toHaveBeenCalledOnce()
    })

    it('resets captcha ref after failed login', () => {
      mockIsApiError.mockReturnValue(false)

      mount(LoginView, {
        global: { stubs: { LoginForm: createLoginFormStub() } },
      })
      expect(mutationOnError).toBeDefined()

      mutationOnError!(new Error('test error'))

      expect(mockCaptchaReset).toHaveBeenCalledOnce()
    })
  })

  describe('SECURITY error messages', () => {
    it('displays error message for SECURITY_006 (captcha verification failed)', () => {
      mockIsApiError.mockReturnValue(true)
      mockMapApiErrorCode.mockReturnValue('Captcha verification failed. Please try again.')

      mount(LoginView, {
        global: { stubs: { LoginForm: createLoginFormStub() } },
      })
      expect(mutationOnError).toBeDefined()

      const error = createApiError(400, 'SECURITY_006')
      mutationOnError!(error)

      expect(mockMapApiErrorCode).toHaveBeenCalledWith('SECURITY_006')
      expect(mockToastError).toHaveBeenCalledWith('Captcha verification failed. Please try again.')
    })

    it('displays error message for SECURITY_007 (missing captcha token)', () => {
      mockIsApiError.mockReturnValue(true)
      mockMapApiErrorCode.mockReturnValue('Please complete the captcha verification.')

      mount(LoginView, {
        global: { stubs: { LoginForm: createLoginFormStub() } },
      })
      expect(mutationOnError).toBeDefined()

      const error = createApiError(400, 'SECURITY_007')
      mutationOnError!(error)

      expect(mockMapApiErrorCode).toHaveBeenCalledWith('SECURITY_007')
      expect(mockToastError).toHaveBeenCalledWith('Please complete the captcha verification.')
    })
  })
})
