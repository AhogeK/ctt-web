import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import SetPasswordDialog from '../SetPasswordDialog.vue'

// ==========================================
// Hoisted Mock Variables (plain values only — no imports)
// ==========================================

const mockSetPassword = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>())
const mockChangePassword = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>())
const mockResetForm = vi.hoisted(() => vi.fn<() => void>())
const mockSetFieldError = vi.hoisted(() => vi.fn<(field: string, message: string) => void>())
let isPendingValue = false
const isChangePendingValue = false

// ==========================================
// Mocks
// ==========================================

vi.mock('@/features/settings/composables/useSetPassword', () => ({
  useSetPassword: vi.fn<() => unknown>(() => ({
    mutation: {
      mutate: mockSetPassword,
      isPending: ref(isPendingValue),
    },
    changePasswordMutation: {
      mutate: mockChangePassword,
      isPending: ref(isChangePendingValue),
    },
    SET_PASSWORD_ERROR_CODES: { ALREADY_HAS_PASSWORD: 'USER_015', INVALID_FORMAT: 'COMMON_003' },
    isDialogOpen: ref(false),
  })),
}))

vi.mock('@/components/ui/button', () => ({
  Button: { template: '<button><slot /></button>' },
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: {
    props: ['open'],
    template: '<div data-testid="dialog-root"><slot /></div>',
  },
  DialogContent: { template: '<div data-testid="dialog-content"><slot /></div>' },
  DialogDescription: { template: '<div data-testid="dialog-description"><slot /></div>' },
  DialogFooter: { template: '<div data-testid="dialog-footer"><slot /></div>' },
  DialogHeader: { template: '<div data-testid="dialog-header"><slot /></div>' },
  DialogTitle: { template: '<div data-testid="dialog-title"><slot /></div>' },
}))

vi.mock('@/components/ui/input', () => ({
  Input: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}))

vi.mock('@/components/ui/form', () => ({
  FormField: {
    props: ['name'],
    template:
      '<div><slot v-bind="{ componentField: { value: \'\', onInput: () => {}, onChange: () => {}, onBlur: () => {} } }" /></div>',
  },
  FormItem: { template: '<div><slot /></div>' },
  FormLabel: { template: '<label><slot /></label>' },
  FormControl: { template: '<div><slot /></div>' },
  FormMessage: { template: '<p data-slot="form-message"><slot /></p>' },
}))

vi.mock('@/features/auth/components/PasswordStrengthMeter.vue', () => ({
  default: {
    props: ['password'],
    template: '<div data-testid="password-strength-meter">PasswordStrengthMeter</div>',
  },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

vi.mock('@/lib/utils/api-error', () => ({
  extractErrorCode: vi.fn<(error: unknown) => string | null>((error: unknown) => {
    if (error && typeof error === 'object' && 'data' in error) {
      const data = (error as { data?: { code?: string } }).data
      return data?.code ?? null
    }
    return null
  }),
  mapApiErrorCode: vi.fn<(code: string) => string>((code: string) => {
    const messages: Record<string, string> = {
      USER_015: 'You already have a password set. Please use the change password option instead.',
      COMMON_003: 'Invalid input. Please check your entries and try again.',
    }
    return messages[code] ?? code
  }),
}))

// Mock vee-validate to bypass validation and capture callbacks
const mockHandleSubmit = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())

vi.mock('vee-validate', () => ({
  useForm: vi.fn<() => unknown>(() => ({
    handleSubmit: mockHandleSubmit,
    values: ref({ newPassword: '', confirmPassword: '' }),
    errors: ref({}),
    resetForm: mockResetForm,
    setFieldError: mockSetFieldError,
  })),
}))

vi.mock('@vee-validate/zod', () => ({
  toTypedSchema: vi.fn<(schema: unknown) => unknown>((schema) => schema),
}))

// ==========================================
// Helpers
// ==========================================

function resetMocks(): void {
  vi.clearAllMocks()
  isPendingValue = false
}

// ==========================================
// Tests
// ==========================================

describe('SetPasswordDialog', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('dialog open/close', () => {
    it('renders dialog content when open is true', () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      expect(wrapper.find('[data-testid="dialog-content"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Set Password')
    })

    it('always renders the FormMessage placeholder so errors do not shift the layout', () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      expect(wrapper.find('[data-slot="form-message"]').exists()).toBe(true)
    })

    it('emits update:open with false when close is triggered', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const cancelButton = wrapper.findAll('button').find((b) => b.text().includes('Cancel'))
      expect(cancelButton).toBeDefined()
      await cancelButton!.trigger('click')

      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    it('resets form and error state when dialog closes', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const cancelButton = wrapper.findAll('button').find((b) => b.text().includes('Cancel'))
      await cancelButton!.trigger('click')

      expect(mockResetForm).toHaveBeenCalled()
    })

    it('resets form when dialog reopens', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      await wrapper.setProps({ open: false })
      await wrapper.setProps({ open: true })

      expect(mockResetForm).toHaveBeenCalled()
    })
  })

  describe('password inputs', () => {
    it('shows new password input with correct id', () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const passwordInput = wrapper.find('#new-password')
      expect(passwordInput.exists()).toBe(true)
    })

    it('new password input has type password', () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const passwordInput = wrapper.find('#new-password')
      expect(passwordInput.attributes('type')).toBe('password')
    })

    it('new password input has correct placeholder', () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const passwordInput = wrapper.find('#new-password')
      expect(passwordInput.attributes('placeholder')).toBe('8-64 characters, printable ASCII only')
    })

    it('shows confirm password input with correct id', () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const confirmInput = wrapper.find('#confirm-password')
      expect(confirmInput.exists()).toBe(true)
    })

    it('confirm password input has type password', () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const confirmInput = wrapper.find('#confirm-password')
      expect(confirmInput.attributes('type')).toBe('password')
    })

    it('confirm password input has correct placeholder', () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const confirmInput = wrapper.find('#confirm-password')
      expect(confirmInput.attributes('placeholder')).toBe('Re-enter your password')
    })

    it('renders PasswordStrengthMeter for new password', () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const meter = wrapper.find('[data-testid="password-strength-meter"]')
      expect(meter.exists()).toBe(true)
    })

    it('toggles new password visibility with the show-password button', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const passwordInput = wrapper.find('#new-password')
      expect(passwordInput.attributes('type')).toBe('password')

      const toggle = wrapper.find('button[aria-label="Show new password"]')
      expect(toggle.exists()).toBe(true)
      await toggle.trigger('click')

      expect(passwordInput.attributes('type')).toBe('text')
      await wrapper.find('button[aria-label="Hide new password"]').trigger('click')
      expect(passwordInput.attributes('type')).toBe('password')
    })

    it('toggles current password visibility in change mode', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true, hasPassword: true },
      })

      const currentInput = wrapper.find('#current-password')
      expect(currentInput.attributes('type')).toBe('password')

      await wrapper.find('button[aria-label="Show current password"]').trigger('click')
      expect(currentInput.attributes('type')).toBe('text')
    })
  })

  describe('error handling', () => {
    // form.handleSubmit is mocked; the component calls handleSubmit(callback),
    // so invoking the captured callback runs the real submit logic.
    const triggerSubmit = () => {
      const submitCallback = mockHandleSubmit.mock.calls[0]![0] as (values: unknown) => void
      submitCallback({ newPassword: 'NewPass123!', confirmPassword: 'NewPass123!', currentPassword: 'OldPass123!' })
    }

    it('maps USER_014 to the currentPassword field on change-mode submit error', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true, hasPassword: true },
      })

      triggerSubmit()
      await wrapper.vm.$nextTick()

      const [, options] = mockChangePassword.mock.calls[0] as unknown as [
        unknown,
        { onError: (error: unknown) => void },
      ]
      options.onError({ data: { code: 'USER_014' } })

      expect(mockSetFieldError).toHaveBeenCalledWith('currentPassword', 'Current password is incorrect.')
    })

    it('maps PASSWORD_SAME_AS_OLD to the newPassword field on change-mode submit error', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true, hasPassword: true },
      })

      triggerSubmit()
      await wrapper.vm.$nextTick()

      const [, options] = mockChangePassword.mock.calls[0] as unknown as [
        unknown,
        { onError: (error: unknown) => void },
      ]
      options.onError({ data: { code: 'PASSWORD_SAME_AS_OLD' } })

      expect(mockSetFieldError).toHaveBeenCalledWith(
        'newPassword',
        'New password cannot be the same as your current password.',
      )
    })

    it('maps COMMON_003 to the newPassword field on set-mode submit error', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      triggerSubmit()
      await wrapper.vm.$nextTick()

      const [, options] = mockSetPassword.mock.calls[0] as unknown as [unknown, { onError: (error: unknown) => void }]
      options.onError({ data: { code: 'COMMON_003' } })

      expect(mockSetFieldError).toHaveBeenCalledWith(
        'newPassword',
        'Password does not meet requirements. Please check and try again.',
      )
    })

    it('maps USER_015 to the newPassword field on set-mode submit error', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      triggerSubmit()
      await wrapper.vm.$nextTick()

      const [, options] = mockSetPassword.mock.calls[0] as unknown as [unknown, { onError: (error: unknown) => void }]
      options.onError({ data: { code: 'USER_015' } })

      expect(mockSetFieldError).toHaveBeenCalledWith(
        'newPassword',
        'You already have a password set. Please use the change password option instead.',
      )
    })

    it('clears field errors when dialog reopens', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      await wrapper.setProps({ open: false })
      await wrapper.setProps({ open: true })

      expect(mockResetForm).toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('disables submit button when mutation is pending', () => {
      isPendingValue = true
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const submitButton = wrapper.findAll('button').find((b) => b.text().includes('Setting'))
      expect(submitButton).toBeDefined()
      expect(submitButton!.attributes('disabled')).toBeDefined()
    })

    it('disables cancel button when mutation is pending', () => {
      isPendingValue = true
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const cancelButton = wrapper.findAll('button').find((b) => b.text().includes('Cancel'))
      expect(cancelButton).toBeDefined()
      expect(cancelButton!.attributes('disabled')).toBeDefined()
    })

    it('shows Setting Password... text on submit button when pending', () => {
      isPendingValue = true
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      expect(wrapper.text()).toContain('Setting Password...')
    })

    it('shows Set Password text when not pending', () => {
      isPendingValue = false
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      expect(wrapper.text()).toContain('Set Password')
      expect(wrapper.text()).not.toContain('Setting...')
    })

    it('shows spinner SVG when pending', () => {
      isPendingValue = true
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })
  })

  describe('dialog description', () => {
    it('shows sign in info', () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      expect(wrapper.text()).toContain('Create a password for your account')
    })
  })
})
