import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import EmailChangeDialog from '../EmailChangeDialog.vue'

// ==========================================
// Hoisted Mock Variables (plain values only — no imports)
// ==========================================

const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>())
const mockResetForm = vi.hoisted(() => vi.fn<() => void>())
let isPendingValue = false

// ==========================================
// Mocks
// ==========================================

vi.mock('@/features/settings/composables/useEmailChange', () => ({
  useEmailChange: vi.fn<() => unknown>(() => ({
    requestMutation: {
      mutate: mockMutate,
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

vi.mock('@/components/ui/form', () => ({
  FormField: {
    props: ['name'],
    template:
      '<div><slot v-bind="{ componentField: { value: \'\', onInput: () => {}, onChange: () => {}, onBlur: () => {} } }" /></div>',
  },
  FormItem: { template: '<div><slot /></div>' },
  FormLabel: { template: '<label><slot /></label>' },
  FormControl: { template: '<div><slot /></div>' },
  FormMessage: { template: '<p><slot /></p>' },
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
}))

// Mock vee-validate to bypass validation and capture callbacks
const mockHandleSubmit = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())

vi.mock('vee-validate', () => ({
  useForm: vi.fn<() => unknown>(() => ({
    handleSubmit: mockHandleSubmit,
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

describe('EmailChangeDialog', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('dialog open/close', () => {
    it('renders dialog content when open is true', () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      expect(wrapper.find('[data-testid="dialog-content"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Change Email')
    })

    it('emits update:open with false when close is triggered', async () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      const cancelButton = wrapper.findAll('button').find((b) => b.text().includes('Cancel'))
      expect(cancelButton).toBeDefined()
      await cancelButton!.trigger('click')

      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    it('displays current email in description when provided', () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true, currentEmail: 'current@example.com' },
      })

      expect(wrapper.text()).toContain('current@example.com')
    })

    it('does not display current email section when not provided', () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      expect(wrapper.text()).not.toContain('currently:')
    })

    it('resets form and error state when dialog closes', async () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      const cancelButton = wrapper.findAll('button').find((b) => b.text().includes('Cancel'))
      await cancelButton!.trigger('click')

      expect(mockResetForm).toHaveBeenCalled()
    })
  })

  describe('email input', () => {
    it('shows email input field with correct id', () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      const emailInput = wrapper.find('#new-email')
      expect(emailInput.exists()).toBe(true)
    })

    it('email input has type email', () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      const emailInput = wrapper.find('#new-email')
      expect(emailInput.attributes('type')).toBe('email')
    })

    it('email input has correct placeholder', () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      const emailInput = wrapper.find('#new-email')
      expect(emailInput.attributes('placeholder')).toBe('you@example.com')
    })
  })

  describe('password field visibility', () => {
    it('does not show password field initially', () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      expect(wrapper.find('#current-password').exists()).toBe(false)
    })

    it('shows password field when showPasswordField is true', async () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      // Access component internal state to simulate USER_013 response
      const vm = wrapper.vm as unknown as { showPasswordField: boolean }
      vm.showPasswordField = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('#current-password').exists()).toBe(true)
      expect(wrapper.find('#current-password').attributes('type')).toBe('password')
    })

    it('resets password field visibility when dialog reopens', async () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      // Simulate USER_013 showing password field
      const vm = wrapper.vm as unknown as { showPasswordField: boolean }
      vm.showPasswordField = true
      await wrapper.vm.$nextTick()
      expect(wrapper.find('#current-password').exists()).toBe(true)

      // Close and reopen dialog
      await wrapper.setProps({ open: false })
      await wrapper.setProps({ open: true })

      expect(wrapper.find('#current-password').exists()).toBe(false)
    })

    it('password input has correct placeholder', async () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      const vm = wrapper.vm as unknown as { showPasswordField: boolean }
      vm.showPasswordField = true
      await wrapper.vm.$nextTick()

      const passwordInput = wrapper.find('#current-password')
      expect(passwordInput.attributes('placeholder')).toBe('Enter your current password')
    })
  })

  describe('error handling', () => {
    it('shows error message when errorMessage ref is set', async () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      const vm = wrapper.vm as unknown as { errorMessage: string | null }
      vm.errorMessage = 'Password verification required. Please enter your current password.'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Password verification required')
    })

    it('hides error message when errorMessage is null', async () => {
      const wrapper = mount(EmailChangeDialog, {
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
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      const vm = wrapper.vm as unknown as { errorMessage: string | null }
      vm.errorMessage = 'Password verification required'
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Password verification required')

      await wrapper.setProps({ open: false })
      await wrapper.setProps({ open: true })

      expect(wrapper.text()).not.toContain('Password verification required')
    })

    it('error message is displayed in destructive style container', async () => {
      const wrapper = mount(EmailChangeDialog, {
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
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      const submitButton = wrapper.findAll('button').find((b) => b.text().includes('Sending'))
      expect(submitButton).toBeDefined()
      expect(submitButton!.attributes('disabled')).toBeDefined()
    })

    it('disables cancel button when mutation is pending', () => {
      isPendingValue = true
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      const cancelButton = wrapper.findAll('button').find((b) => b.text().includes('Cancel'))
      expect(cancelButton).toBeDefined()
      expect(cancelButton!.attributes('disabled')).toBeDefined()
    })

    it('shows Sending... text on submit button when pending', () => {
      isPendingValue = true
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      expect(wrapper.text()).toContain('Sending...')
    })

    it('shows Change Email text when not pending', () => {
      isPendingValue = false
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      expect(wrapper.text()).toContain('Change Email')
      expect(wrapper.text()).not.toContain('Sending...')
    })

    it('shows spinner SVG when pending', () => {
      isPendingValue = true
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })
  })

  describe('dialog description', () => {
    it('shows verification link info', () => {
      const wrapper = mount(EmailChangeDialog, {
        props: { open: true },
      })

      expect(wrapper.text()).toContain('A verification link will be sent to confirm the change')
    })
  })
})
