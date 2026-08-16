import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount, flushPromises } from '@vue/test-utils'
import CreateApiKeyDialog from '../CreateApiKeyDialog.vue'

/**
 * Integration test: real vee-validate + real ui/form + real ui/input chain.
 *
 * The unit suite (CreateApiKeyDialog.test.ts) mocks useForm/ui-form, so it
 * cannot catch broken field bindings — the exact class of regression that
 * shipped in v0.12.0 (defineField + passive Input never synced the model).
 * This file mocks only external side effects (mutation, toast, reka-ui
 * wrappers) and exercises the real validation path:
 *   1. typing into the real Input must reach the vee-validate model (binding),
 *   2. schema errors must surface through FormMessage,
 *   3. the mutation receives the model values on a valid submit.
 *
 * Note: jsdom does not propagate trigger('submit') through vee-validate's
 * handleSubmit; per project convention (LoginForm.test.ts) the submit
 * handler is invoked directly via setup state.
 */

// ==========================================
// Hoisted Mock Variables
// ==========================================

const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockToastError = vi.hoisted(() => vi.fn<() => void>())
const pendingState = vi.hoisted(() => ({ value: false }))

// ==========================================
// Mocks (side-effect and reka-ui boundaries only)
// ==========================================

vi.mock('@/composables/useApiKeys', () => ({
  useCreateApiKey: vi.fn<() => unknown>(() => ({
    mutation: {
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

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: {
    props: ['checked'],
    emits: ['update:checked'],
    // Runtime-compiled template: TS `as` casts are not allowed in mock
    // strings (SyntaxError: Unexpected identifier). Target inference via
    // $event.target.checked works because $emit reifies the event.
    template: '<input type="checkbox" :checked="checked" @change="$emit(\'update:checked\', $event.target.checked)" />',
  },
}))

vi.mock('@/components/ui/label', () => ({
  Label: { template: '<label><slot /></label>' },
}))

vi.mock('vue-sonner', () => ({
  toast: { error: mockToastError, success: vi.fn<() => void>() },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

vi.mock('@/lib/utils/api-error', () => ({
  extractErrorCode: vi.fn<(error: unknown) => string | null>(() => null),
  getErrorMessage: vi.fn<(error: unknown) => string>(() => 'An unexpected error occurred. Please try again later.'),
  getRetryAfterSeconds: vi.fn<(error: unknown) => number | null>(() => null),
}))

// ==========================================
// Helpers
// ==========================================

interface ExposedForm {
  setFieldValue: (name: string, value: unknown) => Promise<void>
  values: { name: string; scopes: string[] }
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

describe('CreateApiKeyDialog (real form integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pendingState.value = false
  })

  it('does not submit when the name is empty and shows the schema error', async () => {
    const wrapper = mount(CreateApiKeyDialog, {
      props: { open: true },
      attachTo: document.body,
    })
    await flushPromises()

    await submitViaSetupState(wrapper)

    expect(mockMutate).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Name is required')
    wrapper.unmount()
  })

  it('syncs a typed name into the vee-validate model and submits it', async () => {
    const wrapper = mount(CreateApiKeyDialog, {
      props: { open: true },
      attachTo: document.body,
    })
    await flushPromises()

    // Real binding path: type into the real Input (v-bind="componentField").
    const nameInput = wrapper.find('#api-key-name')
    await nameInput.setValue('MacBook Pro - IntelliJ IDEA')
    await nameInput.trigger('blur')
    await flushPromises()

    expect(exposedForm(wrapper).values.name).toBe('MacBook Pro - IntelliJ IDEA')

    await submitViaSetupState(wrapper)

    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'MacBook Pro - IntelliJ IDEA', scopes: ['READ', 'SYNC'] }),
      expect.anything(),
    )
    wrapper.unmount()
  })

  it('emits success with the create response when the mutation succeeds', async () => {
    mockMutate.mockImplementation((...args: unknown[]) => {
      const options = args[1] as { onSuccess?: (r: unknown) => void }
      options.onSuccess?.({
        rawKey: 'cttak_raw_secret_once',
        apiKey: { id: 'key-9', name: 'Integration Key', keyPrefix: 'cttak_ab12cd34' },
      })
      return undefined
    })
    const wrapper = mount(CreateApiKeyDialog, {
      props: { open: true },
      attachTo: document.body,
    })
    await flushPromises()

    await wrapper.find('#api-key-name').setValue('Integration Key')
    await wrapper.find('#api-key-name').trigger('blur')
    await flushPromises()

    await submitViaSetupState(wrapper)

    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.emitted('success')![0]![0]).toEqual(expect.objectContaining({ rawKey: 'cttak_raw_secret_once' }))
    wrapper.unmount()
  })

  it('keeps scopes defined when toggling Custom -> Recommended (unregister regression)', async () => {
    const wrapper = mount(CreateApiKeyDialog, {
      props: { open: true },
      attachTo: document.body,
    })
    await flushPromises()

    // Real vee-validate path: mounting the scopes FormField in Custom mode
    // registers the field; unmounting it (switch back to Recommended) used to
    // unregister it, leaving form.values.scopes undefined and crashing the
    // submit-button binding (Cannot read properties of undefined 'length').
    await wrapper.find('#api-key-name').setValue('Toggle Key')
    await wrapper.find('#api-key-name').trigger('blur')
    await flushPromises()

    const customButton = wrapper.findAll('button').find((b) => b.text().includes('Custom'))!
    const recommendedButton = wrapper.findAll('button').find((b) => b.text().includes('JetBrains plugin'))!
    await customButton.trigger('click')
    await flushPromises()
    await recommendedButton.trigger('click')
    await flushPromises()

    // Regression: values.scopes must still be defined and renderable.
    expect(exposedForm(wrapper).values.scopes).toEqual(['READ', 'SYNC'])
    expect(wrapper.text()).toContain('Create API Key')

    await submitViaSetupState(wrapper)
    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({ scopes: ['READ', 'SYNC'] }), expect.anything())
    wrapper.unmount()
  })
})
