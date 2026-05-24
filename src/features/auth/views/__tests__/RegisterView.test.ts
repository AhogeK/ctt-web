import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import RegisterView from '../RegisterView.vue'

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

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<object>()
  return {
    ...actual,
    useSessionStorage: vi.fn<() => { value: null }>(() => ({ value: null })),
  }
})

vi.mock('@/lib/api/auth', () => ({
  register: vi.fn<() => void>(),
}))

vi.mock('@/stores/auth', () => ({
  SESSION_STORAGE_KEYS: {
    PENDING_VERIFICATION_EMAIL: 'pending-verification-email',
  },
}))

vi.mock('@/composables/useCooldown', () => ({
  useCooldown: vi.fn<() => { countdown: { value: number }; start: (...args: unknown[]) => unknown }>(() => ({
    countdown: countdownState,
    start: mockStart,
  })),
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

function createRegisterFormStub() {
  return defineComponent({
    name: 'RegisterForm',
    props: {
      serverErrors: { type: Object, default: undefined },
      captchaSiteKey: { type: [String, null], default: null },
    },
    emits: ['submit'],
    setup(_: unknown, { expose }: { expose: (exposed: Record<string, unknown>) => void }) {
      expose({
        captchaRef: { reset: mockCaptchaReset },
      })
      return {}
    },
    template: '<div data-testid="register-form" />',
  })
}

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

describe('RegisterView - hCaptcha integration', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('captchaSiteKey passthrough', () => {
    it('passes captchaSiteKey from public config to RegisterForm', () => {
      const wrapper = mount(RegisterView, {
        global: { stubs: { RegisterForm: createRegisterFormStub() } },
      })

      const formStub = wrapper.findComponent({ name: 'RegisterForm' })
      expect(formStub.exists()).toBe(true)
      expect(formStub.props('captchaSiteKey')).toBe('10000000-ffff-ffff-ffff-000000000001')
    })

    it('passes null when captchaSiteKey is not in public config', () => {
      publicConfigData.value = { captchaSiteKey: null, termsVersion: '1.0' }

      const wrapper = mount(RegisterView, {
        global: { stubs: { RegisterForm: createRegisterFormStub() } },
      })

      const formStub = wrapper.findComponent({ name: 'RegisterForm' })
      expect(formStub.props('captchaSiteKey')).toBeNull()
    })
  })

  describe('Captcha ref reset', () => {
    it('resets captcha ref after successful register', () => {
      mount(RegisterView, {
        global: { stubs: { RegisterForm: createRegisterFormStub() } },
      })
      expect(mutationOnSuccess).toBeDefined()

      mutationOnSuccess!()

      expect(mockCaptchaReset).toHaveBeenCalledOnce()
    })

    it('resets captcha ref after failed register', () => {
      mockIsApiError.mockReturnValue(false)

      mount(RegisterView, {
        global: { stubs: { RegisterForm: createRegisterFormStub() } },
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

      mount(RegisterView, {
        global: { stubs: { RegisterForm: createRegisterFormStub() } },
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

      mount(RegisterView, {
        global: { stubs: { RegisterForm: createRegisterFormStub() } },
      })
      expect(mutationOnError).toBeDefined()

      const error = createApiError(400, 'SECURITY_007')
      mutationOnError!(error)

      expect(mockMapApiErrorCode).toHaveBeenCalledWith('SECURITY_007')
      expect(mockToastError).toHaveBeenCalledWith('Please complete the captcha verification.')
    })
  })
})
