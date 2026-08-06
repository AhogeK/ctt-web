import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import CreateApiKeyDialog from '../CreateApiKeyDialog.vue'

// ==========================================
// Hoisted Mock Variables
// ==========================================

const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockResetForm = vi.hoisted(() => vi.fn<() => void>())
const mockHandleSubmit = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
/** Mutable pending flag read by the mocked composable at assertion time */
const pendingState = vi.hoisted(() => ({ value: false }))
const mockToastError = vi.hoisted(() => vi.fn<() => void>())
const mockGetRetryAfterSeconds = vi.hoisted(() => vi.fn<(error: unknown) => number | null>())

// ==========================================
// Mocks
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
    props: ['disabled'],
    template: '<button :disabled="disabled"><slot /></button>',
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

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: {
    props: ['checked'],
    emits: ['update:checked'],
    template:
      '<input type="checkbox" :checked="checked" @change="$emit(\'update:checked\', ($event.target as HTMLInputElement).checked)" />',
  },
}))

vi.mock('vue-sonner', () => ({
  toast: { error: mockToastError, success: vi.fn<() => void>() },
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
  getErrorMessage: vi.fn<(error: unknown) => string>((error: unknown) =>
    error instanceof Error ? error.message : 'An unexpected error occurred. Please try again later.',
  ),
  getRetryAfterSeconds: mockGetRetryAfterSeconds,
}))

vi.mock('vee-validate', () => ({
  useForm: vi.fn<() => unknown>(() => ({
    handleSubmit: mockHandleSubmit,
    defineField: vi.fn<(name: string) => unknown[]>((name: string) => [
      {
        value: ref(name === 'name' ? 'My Key' : undefined),
        onBlur: vi.fn<() => void>(),
        'onUpdate:modelValue': vi.fn<(value: unknown) => void>(),
      },
      {},
    ]),
    values: { name: 'My Key', scopes: ['READ', 'SYNC'], expiresAt: undefined },
    errors: ref({}),
    resetForm: mockResetForm,
    setFieldValue: vi.fn<() => void>(),
  })),
}))

vi.mock('@vee-validate/zod', () => ({
  toTypedSchema: vi.fn<(schema: unknown) => unknown>((schema) => schema),
}))

describe('CreateApiKeyDialog', () => {
  beforeEach(() => {
    pendingState.value = false
    mockMutate.mockReset()
    mockHandleSubmit.mockReset()
    mockResetForm.mockReset()
    mockGetRetryAfterSeconds.mockReset()
    mockGetRetryAfterSeconds.mockReturnValue(null)
    // Simulate form.handleSubmit wiring: capture the callback and invoke it
    // with form values when the submit handler is used.
    mockHandleSubmit.mockImplementation((...args: unknown[]) => {
      const cb = args[0] as (values: unknown) => void
      return (event: Event) => {
        event.preventDefault()
        cb({ name: 'My Key', scopes: ['READ', 'SYNC'], expiresAt: undefined })
      }
    })
  })

  function createWrapper(open = true) {
    return mount(CreateApiKeyDialog, {
      props: { open },
    })
  }

  it('renders the form fields', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Create API Key')
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Permissions')
    expect(wrapper.text()).toContain('Expiration')
  })

  it('submits form values through the create mutation', async () => {
    const wrapper = createWrapper()
    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockMutate).toHaveBeenCalledTimes(1)
    const [values, callbacks] = mockMutate.mock.calls[0] as [unknown, { onSuccess?: (r: unknown) => void }]
    expect(values).toEqual({ name: 'My Key', scopes: ['READ', 'SYNC'], expiresAt: undefined })
    expect(callbacks.onSuccess).toBeTypeOf('function')
  })

  it('emits success with the create response', async () => {
    const response = { rawKey: 'cttak_secret', apiKey: { id: 'uuid' } }
    mockMutate.mockImplementation((...args: unknown[]) => {
      const callbacks = args[1] as { onSuccess?: (r: unknown) => void }
      callbacks.onSuccess?.(response)
    })

    const wrapper = createWrapper()
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('success')?.at(-1)).toEqual([response])
  })

  it('shows the per-user limit banner on AUTH_014 and does not close', async () => {
    mockMutate.mockImplementation((...args: unknown[]) => {
      const callbacks = args[1] as { onError?: (e: unknown) => void }
      callbacks.onError?.({ data: { code: 'AUTH_014' } })
    })

    const wrapper = createWrapper()
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('You have reached the maximum of 20 API keys')
    expect(mockToastError).not.toHaveBeenCalled()
    expect(wrapper.emitted('success')).toBeUndefined()
  })

  it('shows a countdown toast on 429 RATE_LIMIT_001 when timing is available', async () => {
    mockMutate.mockImplementation((...args: unknown[]) => {
      const callbacks = args[1] as { onError?: (e: unknown) => void }
      callbacks.onError?.({ data: { code: 'RATE_LIMIT_001' } })
    })
    mockGetRetryAfterSeconds.mockReturnValue(60)
    mockToastError.mockClear()

    const wrapper = createWrapper()
    await wrapper.find('form').trigger('submit')

    expect(mockGetRetryAfterSeconds).toHaveBeenCalledTimes(1)
    expect(mockToastError).toHaveBeenCalledTimes(1)
    const [title, options] = mockToastError.mock.calls[0] as unknown as [string, { description: string }]
    expect(title).toBe('Failed to create API key')
    expect(options.description).toBe('Please try again in 60s.')
    expect(wrapper.text()).not.toContain('You have reached the maximum of 20 API keys')
  })

  it('falls back to the static mapped message on 429 without timing info', async () => {
    mockMutate.mockImplementation((...args: unknown[]) => {
      const callbacks = args[1] as { onError?: (e: unknown) => void }
      callbacks.onError?.({ data: { code: 'RATE_LIMIT_001' } })
    })
    mockToastError.mockClear()

    const wrapper = createWrapper()
    await wrapper.find('form').trigger('submit')

    expect(mockGetRetryAfterSeconds).toHaveBeenCalledTimes(1)
    expect(mockToastError).toHaveBeenCalledTimes(1)
    const [, options] = mockToastError.mock.calls[0] as unknown as [string, { description: string }]
    expect(options.description).not.toContain('Please try again in')
    expect(wrapper.text()).not.toContain('You have reached the maximum of 20 API keys')
  })

  it('emits update:open false via the cancel button', async () => {
    const wrapper = createWrapper()
    const cancelButton = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
    await cancelButton!.trigger('click')

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('disables the submit button while the mutation is pending', async () => {
    pendingState.value = true
    const wrapper = createWrapper()
    // Footer order: Cancel, then submit (last button).
    const submitButton = wrapper.findAll('button').at(-1)
    expect(submitButton?.attributes('disabled')).toBeDefined()
  })
})
