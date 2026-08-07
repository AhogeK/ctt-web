import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount, flushPromises } from '@vue/test-utils'
import EmailChangeDialog from '../EmailChangeDialog.vue'

/**
 * Integration test: real vee-validate + real ui/form + real ui/input chain.
 *
 * The unit suite (EmailChangeDialog.test.ts) mocks useForm/ui-form, so it
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

const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const pendingState = vi.hoisted(() => ({ value: false }))

// ==========================================
// Mocks (side-effect and reka-ui boundaries only)
// ==========================================

vi.mock('@/features/settings/composables/useEmailChange', () => ({
  useEmailChange: vi.fn<() => unknown>(() => ({
    requestMutation: {
      mutate: mockMutate,
      isPending: pendingState,
    },
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
  values: { email: string; password?: string }
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

describe('EmailChangeDialog (real form integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pendingState.value = false
  })

  it('does not submit when the email is empty and shows the schema error', async () => {
    const wrapper = mount(EmailChangeDialog, {
      props: { open: true },
      attachTo: document.body,
    })
    await flushPromises()

    await submitViaSetupState(wrapper)

    expect(mockMutate).not.toHaveBeenCalled()
    // z.email rejects empty strings with the format message before min(1).
    expect(wrapper.text()).toContain('Invalid email format')
    wrapper.unmount()
  })

  it('syncs a typed email into the vee-validate model and submits it without a password', async () => {
    const wrapper = mount(EmailChangeDialog, {
      props: { open: true },
      attachTo: document.body,
    })
    await flushPromises()

    // Real binding path: type into the real Input (v-bind="componentField").
    const emailInput = wrapper.find('#new-email')
    await emailInput.setValue('new@example.com')
    await emailInput.trigger('blur')
    await flushPromises()

    expect(exposedForm(wrapper).values.email).toBe('new@example.com')

    await submitViaSetupState(wrapper)

    expect(mockMutate).toHaveBeenCalledTimes(1)
    // First submission always sends an empty password; the backend answers
    // USER_013 when password verification is required (handled via onError).
    expect(mockMutate).toHaveBeenCalledWith(
      { newEmail: 'new@example.com', password: '' },
      expect.objectContaining({ onError: expect.any(Function) }),
    )
    wrapper.unmount()
  })

  it('syncs the password field when shown after USER_013 and includes it in the submit', async () => {
    const wrapper = mount(EmailChangeDialog, {
      props: { open: true },
      attachTo: document.body,
    })
    await flushPromises()

    const emailInput = wrapper.find('#new-email')
    await emailInput.setValue('new@example.com')
    await emailInput.trigger('blur')
    await flushPromises()

    // Simulate the backend USER_013 response that reveals the password field.
    const vm = wrapper.vm as unknown as { showPasswordField: boolean }
    vm.showPasswordField = true
    await wrapper.vm.$nextTick()

    const passwordInput = wrapper.find('#current-password')
    await passwordInput.setValue('CurrentPass123!')
    await passwordInput.trigger('blur')
    await flushPromises()

    expect(exposedForm(wrapper).values.password).toBe('CurrentPass123!')

    await submitViaSetupState(wrapper)

    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(mockMutate).toHaveBeenCalledWith({
      newEmail: 'new@example.com',
      password: 'CurrentPass123!',
    })
    wrapper.unmount()
  })
})
