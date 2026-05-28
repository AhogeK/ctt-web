import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref, type Component } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import RegisterForm from '../RegisterForm.vue'

// ==========================================
// Hoisted Mock Variables (must be before vi.mock)
// ==========================================

// Mutable form state (can't use ref in hoisted)
const checkboxState = vi.hoisted(() => ({ value: false }))
const formValuesState = vi.hoisted(() => ({
  value: {
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  } as Record<string, unknown>,
}))

// Mock functions
const mockHandleSubmit = vi.hoisted(() =>
  vi.fn<(callback: (values: Record<string, unknown>) => void) => (event?: Event) => void>(),
)
const mockSetFieldError = vi.hoisted(() => vi.fn<(field: string, message: string) => void>())
const mockCheckboxChange = vi.hoisted(() => vi.fn<(value: boolean) => void>())

// Mock Checkbox component (reka-ui wrapper)
const MockCheckbox = vi.hoisted(() => ({
  props: ['checked'],
  emits: ['update:modelValue'],
  template:
    '<input type="checkbox" data-testid="terms-checkbox" :checked="checked" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
}))

// Mock Button component
const MockButton = vi.hoisted(() => ({
  props: ['type', 'variant'],
  emits: ['click'],
  template: '<button :type="type || \'button\'" @click="$emit(\'click\', $event)"><slot /></button>',
}))

// ==========================================
// Mocks
// ==========================================

vi.mock('@vee-validate/zod', () => ({
  toTypedSchema: vi.fn<(schema: unknown) => unknown>((schema) => schema),
}))

vi.mock('vee-validate', () => ({
  useForm: vi.fn<
    () => {
      handleSubmit: (callback: (values: Record<string, unknown>) => void) => (event?: Event) => void
      setFieldError: (field: string, message: string) => void
      errors: { value: Record<string, unknown> }
      values: { value: Record<string, unknown> }
      defineField: () => void
    }
  >(() => ({
    handleSubmit: mockHandleSubmit.mockImplementation((callback: (values: Record<string, unknown>) => void) => {
      return (event?: Event) => {
        if (event) event.preventDefault()
        if (!formValuesState.value.agreedToTerms) {
          mockSetFieldError('agreedToTerms', 'You must agree to the Terms of Service')
          return
        }
        callback(formValuesState.value)
      }
    }),
    setFieldError: mockSetFieldError,
    errors: ref({}),
    values: formValuesState,
    defineField: vi.fn<() => void>(),
  })),
  useFieldValue: vi.fn<() => { value: string }>(() => ref('')),
}))

vi.mock('@/lib/schemas/auth.schema', () => ({
  RegisterFormSchema: {},
  RegisterRequestSchema: {},
  StrongPasswordSchema: {},
}))

vi.mock('@/components/ui/form', () => ({
  FormField: vi.fn<
    (
      props: Record<string, unknown>,
      ctx: {
        slots: { default?: (...args: unknown[]) => unknown }
        attrs: Record<string, unknown>
      },
    ) => unknown
  >((props, ctx) => {
    const fieldName = (ctx.attrs?.name ?? props?.name) as string | undefined
    if (fieldName === 'agreedToTerms') {
      return ctx.slots?.default?.({
        value: checkboxState.value,
        handleChange: mockCheckboxChange,
      })
    }
    return ctx.slots?.default?.({ componentField: { modelValue: '' } })
  }),
  FormItem: vi.fn<(_: unknown, ctx: { slots: { default?: () => unknown } }) => unknown>((_, ctx) =>
    ctx.slots?.default?.(),
  ),
  FormLabel: vi.fn<(_: unknown, ctx: { slots: { default?: () => unknown } }) => unknown>((_, ctx) =>
    ctx.slots?.default?.(),
  ),
  FormControl: vi.fn<(_: unknown, ctx: { slots: { default?: () => unknown } }) => unknown>((_, ctx) =>
    ctx.slots?.default?.(),
  ),
  FormMessage: vi.fn<() => void>(),
}))

vi.mock('@/components/ui/input', () => ({
  Input: vi.fn<() => void>(),
}))

vi.mock('@/components/ui/button', () => ({
  Button: MockButton,
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: MockCheckbox,
}))

vi.mock('@/lib/utils', () => ({
  cn: vi.fn<(...args: unknown[]) => string>((...args) => args.filter(Boolean).join(' ')),
}))

vi.mock('../PasswordStrengthMeter.vue', () => ({
  default: vi.fn<() => void>(),
}))

vi.mock('../TermsDialog.vue', () => ({
  default: {
    props: ['open'],
    template: '<div data-testid="terms-dialog" v-if="open">Terms Dialog Open</div>',
  },
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: vi.fn<(props: { open?: boolean }, ctx: { slots: { default?: () => unknown } }) => unknown>((props, ctx) => {
    if (!props?.open) return undefined
    return ctx.slots?.default?.()
  }),
  DialogContent: vi.fn<(_: unknown, ctx: { slots: { default?: () => unknown } }) => unknown>((_, ctx) =>
    ctx.slots?.default?.(),
  ),
  DialogDescription: vi.fn<(_: unknown, ctx: { slots: { default?: () => unknown } }) => unknown>((_, ctx) =>
    ctx.slots?.default?.(),
  ),
  DialogFooter: vi.fn<(_: unknown, ctx: { slots: { default?: () => unknown } }) => unknown>((_, ctx) =>
    ctx.slots?.default?.(),
  ),
  DialogHeader: vi.fn<(_: unknown, ctx: { slots: { default?: () => unknown } }) => unknown>((_, ctx) =>
    ctx.slots?.default?.(),
  ),
  DialogTitle: vi.fn<(_: unknown, ctx: { slots: { default?: () => unknown } }) => unknown>((_, ctx) =>
    ctx.slots?.default?.(),
  ),
}))

vi.mock('@/features/auth/content', () => ({
  termsContent: {
    language: 'en',
    lastUpdated: '2026-05-02',
    version: '1.0.0',
    sections: [
      { id: 'acceptance', title: '1. Acceptance of Terms', content: 'By accessing...' },
      {
        id: 'description-of-service',
        title: '2. Description of Service',
        content: 'Code Time Tracker...',
      },
    ],
    disclaimer: 'This document is a template...',
  },
}))

vi.mock('lucide-vue-next', () => ({
  Eye: vi.fn<() => void>(),
  EyeOff: vi.fn<() => void>(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<() => { setAuthFromTermsAcceptance: (response: unknown) => void }>(() => ({
    setAuthFromTermsAcceptance: vi.fn<(response: unknown) => void>(),
  })),
}))

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn<() => { isDark: boolean }>(() => ({
    isDark: false,
  })),
}))

vi.mock('@/lib/api/instance', () => ({
  rejectTermsQueue: vi.fn<() => void>(),
  resolveTermsQueue: vi.fn<() => void>(),
  TERMS_EXPIRED_EVENT: 'api:terms-expired',
}))

vi.mock('@/lib/api/config', () => ({
  getPublicConfig: vi.fn<() => Promise<{ termsVersion: string }>>().mockResolvedValue({ termsVersion: '1.0.0' }),
}))

// ==========================================
// Helper Functions
// ==========================================

function resetMocks() {
  vi.clearAllMocks()
  checkboxState.value = false
  formValuesState.value = {
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  }
  // Restore default handleSubmit implementation
  mockHandleSubmit.mockImplementation((callback: (values: Record<string, unknown>) => void) => {
    return (event?: Event) => {
      if (event) event.preventDefault()
      if (!formValuesState.value.agreedToTerms) {
        mockSetFieldError('agreedToTerms', 'You must agree to the Terms of Service')
        return
      }
      callback(formValuesState.value)
    }
  })
  mockSetFieldError.mockClear()
  mockCheckboxChange.mockImplementation((val: boolean) => {
    checkboxState.value = val
    formValuesState.value.agreedToTerms = val
  })
}

// ==========================================
// Tests
// ==========================================

describe('RegisterForm - TermsCheckbox Integration', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('1. Checkbox renders in register form', () => {
    it('renders checkbox element with agreement text', () => {
      const wrapper = mount(RegisterForm)
      const checkbox = wrapper.find('input[type="checkbox"]')
      expect(checkbox.exists()).toBe(true)
      expect(wrapper.text()).toContain('I agree to the')
      expect(wrapper.text()).toContain('Terms of Service')
    })
  })

  describe('2. "Terms of Service" link text is visible', () => {
    it('renders Terms of Service as a clickable link with underline styling', () => {
      const wrapper = mount(RegisterForm)
      const buttons = wrapper.findAll('button')
      const termsLink = buttons.find((b) => b.text().includes('Terms of Service'))
      expect(termsLink).toBeDefined()
      expect(termsLink!.text()).toContain('Terms of Service')
      expect(termsLink!.classes()).toContain('underline')
    })
  })

  describe('3. Clicking link opens TermsDialog', () => {
    it('shows TermsDialog when Terms of Service link is clicked', async () => {
      const wrapper = mount(RegisterForm)
      const buttons = wrapper.findAll('button')
      const termsLink = buttons.find((b) => b.text().includes('Terms of Service'))
      expect(termsLink).toBeDefined()

      await termsLink!.trigger('click')
      await wrapper.vm.$nextTick()

      const dialog = wrapper.find('[data-testid="terms-dialog"]')
      expect(dialog.exists()).toBe(true)
    })
  })

  describe('4. Form validation rejects submission when checkbox unchecked', () => {
    it('shows validation error when checkbox is not checked', async () => {
      const wrapper = mount(RegisterForm)

      formValuesState.value = {
        email: 'test@example.com',
        displayName: 'TestUser',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        agreedToTerms: false,
      }

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(mockSetFieldError).toHaveBeenCalledWith('agreedToTerms', 'You must agree to the Terms of Service')
      expect(wrapper.emitted('submit')).toBeUndefined()
    })
  })

  describe('5. Form validation accepts submission when checked', () => {
    it('emits submit event with correct data when checkbox is checked', async () => {
      const wrapper = mount(RegisterForm)

      formValuesState.value = {
        email: 'test@example.com',
        displayName: 'TestUser',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        agreedToTerms: true,
      }

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      const emitted = wrapper.emitted('submit')
      expect(emitted).toBeDefined()
      expect(emitted?.[0]?.[0]).toEqual({
        email: 'test@example.com',
        displayName: 'TestUser',
        password: 'TestPass123!',
      })
    })
  })

  describe('6. Checkbox state toggles correctly', () => {
    it('toggles checkbox state on click', async () => {
      const wrapper = mount(RegisterForm)
      const checkbox = wrapper.find('input[type="checkbox"]')

      // Initially unchecked
      expect((checkbox.element as HTMLInputElement).checked).toBe(false)

      // Click to check
      await checkbox.setValue(true)
      await wrapper.vm.$nextTick()
      expect(checkboxState.value).toBe(true)

      // Click to uncheck
      await checkbox.setValue(false)
      await wrapper.vm.$nextTick()
      expect(checkboxState.value).toBe(false)
    })
  })
})

describe('TermsDialog', () => {
  let RealTermsDialog: Component

  beforeAll(async () => {
    const mod = await vi.importActual<{ default: Component }>('../TermsDialog.vue')
    RealTermsDialog = mod.default
  })

  describe('7. Dialog displays content (section headers visible)', () => {
    it('renders section titles when dialog is open', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const wrapper = mount(RealTermsDialog, {
        props: { open: true },
        global: { plugins: [[VueQueryPlugin, { queryClient }]] },
      })
      expect(wrapper.text()).toContain('1. Acceptance of Terms')
      expect(wrapper.text()).toContain('2. Description of Service')
    })
  })

  describe('8. Dialog closes when close button clicked', () => {
    it('emits update:open with false when close button is clicked', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const wrapper = mount(RealTermsDialog, {
        props: { open: true },
        global: { plugins: [[VueQueryPlugin, { queryClient }]] },
      })
      const closeButton = wrapper.findAll('button').find((b) => b.text().includes('Decline'))
      expect(closeButton).toBeDefined()

      await closeButton!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })
  })
})
