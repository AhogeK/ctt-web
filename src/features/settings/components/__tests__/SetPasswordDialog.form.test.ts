import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount, flushPromises } from '@vue/test-utils'
import SetPasswordDialog from '../SetPasswordDialog.vue'

/**
 * Integration test: real vee-validate + real ui/form + real ui/input chain.
 *
 * The unit suite (SetPasswordDialog.test.ts) mocks useForm/ui-form, so it
 * cannot catch broken field bindings — the exact class of regression that
 * made this dialog unusable in production (defineField + passive Input never
 * synced the model, masked by mocks stubbing `onUpdate:modelValue`). This file
 * mocks only external side effects and exercises the real validation path:
 * typing into the real Input must reach the vee-validate model, schema errors
 * must surface, and the mutation must receive the model value on submit.
 *
 * Note: jsdom does not propagate trigger('submit') through vee-validate's
 * handleSubmit; per project convention (LoginForm.test.ts) the submit
 * handler is invoked directly via setup state.
 */

// ==========================================
// Hoisted Mock Variables
// ==========================================

const mockSetPassword = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const pendingState = vi.hoisted(() => ({ value: false }))

// ==========================================
// Mocks (side-effect and reka-ui boundaries only)
// ==========================================

vi.mock('@/features/settings/composables/useSetPassword', () => ({
  useSetPassword: vi.fn<() => unknown>(() => ({
    mutation: {
      mutate: mockSetPassword,
      isPending: pendingState,
    },
    SET_PASSWORD_ERROR_CODES: { ALREADY_HAS_PASSWORD: 'USER_015', INVALID_FORMAT: 'COMMON_003' },
  })),
}))

vi.mock('@/components/ui/button', () => ({
  Button: {
    props: ['disabled', 'variant', 'size'],
    template: '<button :disabled="disabled" v-bind="$attrs"><slot /></button>',
  },
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

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

vi.mock('@/lib/utils/api-error', () => ({
  extractErrorCode: vi.fn<(error: unknown) => string | null>(() => null),
}))

// ==========================================
// Helpers
// ==========================================

interface ExposedForm {
  values: { newPassword: string; confirmPassword: string }
  errors: { value: Record<string, string> }
}

function exposedForm(wrapper: ReturnType<typeof mount>): ExposedForm {
  return (wrapper.vm as unknown as { form: ExposedForm }).form
}

async function submitViaSetupState(wrapper: ReturnType<typeof mount>): Promise<void> {
  const onSubmit = (wrapper.vm as unknown as { $: { setupState: { onSubmit: () => Promise<void> } } }).$.setupState
    .onSubmit
  await onSubmit()
  await flushPromises()
}

// ==========================================
// Tests
// ==========================================

describe('SetPasswordDialog (real form integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pendingState.value = false
  })

  it('does not submit when the new password is empty and shows the schema error', async () => {
    const wrapper = mount(SetPasswordDialog, {
      props: { open: true },
      attachTo: document.body,
    })
    await flushPromises()

    await submitViaSetupState(wrapper)

    expect(mockSetPassword).not.toHaveBeenCalled()
    // StrongPasswordSchema rejects empty/undefined with the Zod default
    // "Invalid input" message (no custom required message is set).
    expect(wrapper.text()).toContain('Invalid input')
    wrapper.unmount()
  })

  it('syncs typed passwords into the vee-validate model and submits the new password', async () => {
    const wrapper = mount(SetPasswordDialog, {
      props: { open: true },
      attachTo: document.body,
    })
    await flushPromises()

    // Real binding path: type into the real Inputs (v-bind="componentField").
    const newPasswordInput = wrapper.find('#new-password')
    await newPasswordInput.setValue('SecurePass123!')
    await newPasswordInput.trigger('blur')
    await flushPromises()

    const confirmInput = wrapper.find('#confirm-password')
    await confirmInput.setValue('SecurePass123!')
    await confirmInput.trigger('blur')
    await flushPromises()

    expect(exposedForm(wrapper).values.newPassword).toBe('SecurePass123!')
    expect(exposedForm(wrapper).values.confirmPassword).toBe('SecurePass123!')

    await submitViaSetupState(wrapper)

    expect(mockSetPassword).toHaveBeenCalledTimes(1)
    expect(mockSetPassword).toHaveBeenCalledWith('SecurePass123!', expect.anything())
    wrapper.unmount()
  })

  it('shows the mismatch error when confirm password differs', async () => {
    const wrapper = mount(SetPasswordDialog, {
      props: { open: true },
      attachTo: document.body,
    })
    await flushPromises()

    const newPasswordInput = wrapper.find('#new-password')
    await newPasswordInput.setValue('SecurePass123!')
    await newPasswordInput.trigger('blur')
    await flushPromises()

    const confirmInput = wrapper.find('#confirm-password')
    await confirmInput.setValue('DifferentPass456!')
    await confirmInput.trigger('blur')
    await flushPromises()

    await submitViaSetupState(wrapper)

    expect(mockSetPassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Passwords do not match')
    wrapper.unmount()
  })
})
