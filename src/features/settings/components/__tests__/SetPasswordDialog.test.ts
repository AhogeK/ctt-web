import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import SetPasswordDialog from '../SetPasswordDialog.vue'

// ==========================================
// Hoisted Mock Variables (plain values only — no imports)
// ==========================================

const mockSetPassword = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>())
const mockResetForm = vi.hoisted(() => vi.fn<() => void>())
let isPendingValue = false

// ==========================================
// Mocks
// ==========================================

vi.mock('@/features/settings/composables/useSetPassword', () => ({
  useSetPassword: vi.fn<() => unknown>(() => ({
    mutation: {
      mutate: mockSetPassword,
      isPending: ref(isPendingValue),
    },
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

vi.mock('@/components/ui/label', () => ({
  Label: { template: '<label><slot /></label>' },
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
    defineField: vi.fn<(name: string) => unknown[]>((name: string) => {
      return [
        {
          value: ref(name === 'newPassword' ? 'SecurePass123!' : ''),
          onBlur: vi.fn<() => void>(),
          'onUpdate:modelValue': vi.fn<(value: string) => void>(),
        },
        {},
      ]
    }),
    errors: ref({}),
    resetForm: mockResetForm,
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
  })

  describe('error handling', () => {
    it('shows error message when errorMessage ref is set', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const vm = wrapper.vm as unknown as { errorMessage: string | null }
      vm.errorMessage = 'You already have a password set.'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('You already have a password set.')
    })

    it('hides error message when errorMessage is null', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const vm = wrapper.vm as unknown as { errorMessage: string | null }
      vm.errorMessage = 'Some error'
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Some error')

      vm.errorMessage = null
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('Some error')
    })

    it('clears error message when dialog reopens', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const vm = wrapper.vm as unknown as { errorMessage: string | null }
      vm.errorMessage = 'You already have a password set.'
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('You already have a password set.')

      await wrapper.setProps({ open: false })
      await wrapper.setProps({ open: true })

      expect(wrapper.text()).not.toContain('You already have a password set.')
    })

    it('error message is displayed in destructive style container', async () => {
      const wrapper = mount(SetPasswordDialog, {
        props: { open: true },
      })

      const vm = wrapper.vm as unknown as { errorMessage: string | null }
      vm.errorMessage = 'Test error'
      await wrapper.vm.$nextTick()

      const errorContainer = wrapper.find('.bg-destructive\\/10')
      expect(errorContainer.exists()).toBe(true)
      expect(errorContainer.text()).toContain('Test error')
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
