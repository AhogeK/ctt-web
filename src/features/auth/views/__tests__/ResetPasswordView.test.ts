import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ResetPasswordView from '../ResetPasswordView.vue'

// ==========================================
// Hoisted Mock Variables (must be before vi.mock)
// ==========================================

const mockPush = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockToastSuccess = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockToastError = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockToastInfo = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockStart = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockIsApiError = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())

const mockSetFieldError = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockHandleSubmit = vi.hoisted(() =>
  vi.fn<(callback: (values: Record<string, unknown>) => void) => (event?: Event) => void>(),
)

// Mutable state objects for refs (can't use ref in hoisted)
const routeQueryState = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))
const countdownState = vi.hoisted(() => ({ value: 0 }))
const isActiveState = vi.hoisted(() => ({ value: false }))

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
    query: routeQueryState.value,
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
    success: mockToastSuccess,
    error: mockToastError,
    info: mockToastInfo,
  },
}))

vi.mock('@tanstack/vue-query', () => ({
  useMutation: vi.fn<
    (options: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
      mutate: (...args: unknown[]) => unknown
      isPending: { value: boolean }
    }
  >((options: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
    mutationOnSuccess = options.onSuccess
    mutationOnError = options.onError
    return {
      mutate: mockMutate,
      isPending: ref(false),
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
  confirmPasswordReset: vi.fn<() => void>(),
}))

const mockMapApiErrorCode = vi.hoisted(() =>
  vi.fn<(code: string) => string>((code) => {
    if (code === 'AUTH_003') return 'This reset link has expired or already been used. Please request a new one.'
    if (code === 'PASSWORD_SAME_AS_OLD') return 'New password cannot be the same as your current password.'
    return code
  }),
)

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

vi.mock('@vee-validate/zod', () => ({
  toTypedSchema: vi.fn<(schema: unknown) => unknown>((schema) => schema),
}))

vi.mock('vee-validate', () => ({
  useForm: vi.fn<
    () => {
      handleSubmit: (callback: (values: Record<string, unknown>) => void) => (event?: Event) => void
      setFieldError: (...args: unknown[]) => unknown
      errors: { value: Record<string, unknown> }
      values: { value: { newPassword: string; confirmPassword: string } }
      defineField: () => void
    }
  >(() => ({
    handleSubmit: mockHandleSubmit.mockImplementation((callback: (values: Record<string, unknown>) => void) => {
      return (event?: Event) => {
        if (event) event.preventDefault()
        callback({ newPassword: 'TestPass123!', confirmPassword: 'TestPass123!' })
      }
    }),
    setFieldError: mockSetFieldError,
    errors: ref({}),
    values: ref({ newPassword: '', confirmPassword: '' }),
    defineField: vi.fn<() => void>(),
  })),
  useFieldValue: vi.fn<() => { value: string }>(() => ref('')),
}))

vi.mock('@/lib/schemas/auth.schema', () => ({
  ResetPasswordFormSchema: {},
  ResetPasswordRequestSchema: {},
  StrongPasswordSchema: {},
}))

vi.mock('@/components/ui/form', () => ({
  FormField: vi.fn<
    (
      _: unknown,
      ctx: { slots: { default?: (props: { componentField: { modelValue: string } }) => unknown } },
    ) => unknown
  >((_, { slots }) => slots?.default?.({ componentField: { modelValue: '' } })),
  FormItem: vi.fn<(_: unknown, ctx: { slots: { default?: () => unknown } }) => unknown>((_, { slots }) =>
    slots?.default?.(),
  ),
  FormLabel: vi.fn<(_: unknown, ctx: { slots: { default?: () => unknown } }) => unknown>((_, { slots }) =>
    slots?.default?.(),
  ),
  FormControl: vi.fn<(_: unknown, ctx: { slots: { default?: () => unknown } }) => unknown>((_, { slots }) =>
    slots?.default?.(),
  ),
  FormMessage: vi.fn<() => void>(),
}))

vi.mock('@/components/ui/input', () => ({
  Input: vi.fn<() => void>(),
}))

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn<(_: unknown, ctx: { slots: { default?: () => unknown } }) => unknown>((_, { slots }) =>
    slots?.default?.(),
  ),
}))

vi.mock('@/lib/utils', () => ({
  cn: vi.fn<(...args: unknown[]) => string>((...args) => args.filter(Boolean).join(' ')),
}))

vi.mock('../components/PasswordStrengthMeter.vue', () => ({
  default: vi.fn<() => void>(),
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
  routeQueryState.value = {}
  countdownState.value = 0
  isActiveState.value = false
  mutationOnSuccess = undefined
  mutationOnError = undefined
  mockMutate.mockClear()
  mockPush.mockClear()
  mockToastSuccess.mockClear()
  mockToastError.mockClear()
  mockToastInfo.mockClear()
  mockStart.mockClear()
  mockSetFieldError.mockClear()
  mockIsApiError.mockReset()
}

// ==========================================
// Tests
// ==========================================

describe('ResetPasswordView', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('Success flow', () => {
    it('shows success toast and redirects to login on successful password reset', async () => {
      routeQueryState.value = { token: 'valid-reset-token' }
      mount(ResetPasswordView)
      expect(mutationOnSuccess).toBeDefined()
      mutationOnSuccess!()
      expect(mockToastSuccess).toHaveBeenCalledWith('Password reset successful. All devices have been logged out.')
      expect(mockPush).toHaveBeenCalledWith({ name: 'login' })
    })
  })

  describe('AUTH_003 (401) error - invalid/expired token', () => {
    it('shows error toast and redirects to forgot-password', async () => {
      routeQueryState.value = { token: 'expired-token' }
      mockIsApiError.mockReturnValue(true)
      mount(ResetPasswordView)
      expect(mutationOnError).toBeDefined()
      const error = createApiError(401, 'AUTH_003')
      mutationOnError!(error)
      expect(mockIsApiError).toHaveBeenCalledWith(error)
      expect(mockMapApiErrorCode).toHaveBeenCalledWith('AUTH_003')
      expect(mockToastError).toHaveBeenCalledWith(
        'This reset link has expired or already been used. Please request a new one.',
      )
      expect(mockPush).toHaveBeenCalledWith({ name: 'forgot-password' })
    })
  })

  describe('PASSWORD_SAME_AS_OLD (409) error', () => {
    it('sets field error on newPassword field', async () => {
      routeQueryState.value = { token: 'valid-token' }
      mockIsApiError.mockReturnValue(true)
      mount(ResetPasswordView)
      expect(mutationOnError).toBeDefined()
      const error = createApiError(409, 'PASSWORD_SAME_AS_OLD')
      mutationOnError!(error)
      expect(mockIsApiError).toHaveBeenCalledWith(error)
      expect(mockMapApiErrorCode).toHaveBeenCalledWith('PASSWORD_SAME_AS_OLD')
      expect(mockSetFieldError).toHaveBeenCalledWith(
        'newPassword',
        'New password cannot be the same as your current password.',
      )
    })
  })

  describe('429 rate limit error', () => {
    it('starts cooldown and shows rate limit toast', async () => {
      routeQueryState.value = { token: 'valid-token' }
      countdownState.value = 60
      mockIsApiError.mockReturnValue(true)
      mount(ResetPasswordView)
      expect(mutationOnError).toBeDefined()
      const error = createApiError(429)
      mutationOnError!(error)
      expect(mockIsApiError).toHaveBeenCalledWith(error)
      expect(mockStart).toHaveBeenCalled()
      expect(mockToastError).toHaveBeenCalledWith('Too many requests', {
        description: 'Try again in 60s',
      })
    })
  })

  describe('Generic API error', () => {
    it('shows generic error toast for unknown error codes', async () => {
      routeQueryState.value = { token: 'valid-token' }
      mockIsApiError.mockReturnValue(true)
      mount(ResetPasswordView)
      expect(mutationOnError).toBeDefined()
      const error = createApiError(500, 'SOME_UNKNOWN_CODE')
      mutationOnError!(error)
      expect(mockIsApiError).toHaveBeenCalledWith(error)
      expect(mockToastError).toHaveBeenCalledWith('Password reset failed. Please try again later.')
    })
  })

  describe('Non-API error', () => {
    it('shows generic error toast for non-API errors', async () => {
      routeQueryState.value = { token: 'valid-token' }
      mockIsApiError.mockReturnValue(false)
      mount(ResetPasswordView)
      expect(mutationOnError).toBeDefined()
      const error = new Error('Network error')
      mutationOnError!(error)
      expect(mockIsApiError).toHaveBeenCalledWith(error)
      expect(mockToastError).toHaveBeenCalledWith('Password reset failed. Please try again later.')
    })
  })

  describe('No token in URL', () => {
    it('shows invalid reset link error state when token is missing', async () => {
      routeQueryState.value = {}
      const wrapper = mount(ResetPasswordView)
      expect(wrapper.text()).toContain('Invalid Reset Link')
      expect(wrapper.text()).toContain('This password reset link is invalid or has expired')
      expect(wrapper.text()).toContain('Request New Reset Link')
      expect(wrapper.text()).toContain('Back to sign in')
    })
  })

  describe('Submit without token', () => {
    it('shows error toast and does not call mutate when token is empty', async () => {
      routeQueryState.value = { token: '' }
      mount(ResetPasswordView)
      const onSubmitHandler = mockHandleSubmit.mock.results[0]?.value
      if (onSubmitHandler) onSubmitHandler()
      expect(mockToastError).toHaveBeenCalledWith('Invalid reset link', {
        description: 'Please request a new password reset email.',
      })
      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  describe('COMMON_002 and RATE_LIMIT_001 errors', () => {
    it('shows generic error toast for COMMON_002 error', async () => {
      routeQueryState.value = { token: 'valid-token' }
      mockIsApiError.mockReturnValue(true)
      mount(ResetPasswordView)
      const error = createApiError(400, 'COMMON_002')
      mutationOnError!(error)
      expect(mockToastError).toHaveBeenCalledWith('Password reset failed. Please try again later.')
    })

    it('shows generic error toast for RATE_LIMIT_001 error', async () => {
      routeQueryState.value = { token: 'valid-token' }
      mockIsApiError.mockReturnValue(true)
      mount(ResetPasswordView)
      const error = createApiError(400, 'RATE_LIMIT_001')
      mutationOnError!(error)
      expect(mockToastError).toHaveBeenCalledWith('Password reset failed. Please try again later.')
    })
  })
})
