import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
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
/**
 * Mutable form values shared by the useForm mock, the FormField scopes slot
 * and the handleSubmit callback, so checkbox toggles flow into the payload.
 * Plain object box: vi.hoisted runs before imports resolve.
 */
const mockFormValues = vi.hoisted(() => ({
  value: { name: 'My Key', scopes: ['READ', 'SYNC'], expiresAt: undefined },
}))

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

vi.mock('@/components/ui/form', () => ({
  FormField: {
    props: ['name'],
    setup(props: { name: string }, { slots }: { slots: { default?: (ctx: Record<string, unknown>) => unknown[] } }) {
      return () => {
        if (props.name === 'scopes') {
          return slots.default!({
            value: mockFormValues.value.scopes,
            handleChange: (next: unknown) => {
              mockFormValues.value = { ...mockFormValues.value, scopes: next as string[] }
            },
          })
        }
        return slots.default!({
          componentField: { value: '', onInput: () => {}, onChange: () => {}, onBlur: () => {} },
        })
      }
    },
  },
  FormItem: { template: '<div><slot /></div>' },
  FormLabel: { template: '<label><slot /></label>' },
  FormControl: { template: '<div><slot /></div>' },
  FormMessage: { template: '<p data-slot="form-message"><slot /></p>' },
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    // Mirrors reka-ui's controlled API: modelValue drives the native checked
    // attribute and changes emit update:modelValue. No `as` in template.
    template:
      '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
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
    // vee-validate values are accessed object-style in templates (form.values.name)
    values: mockFormValues.value,
    errors: ref({}),
    resetForm: mockResetForm,
    setFieldValue: vi.fn<(field: string, value: unknown) => void>((field, value) => {
      mockFormValues.value = { ...mockFormValues.value, [field]: value }
    }),
  })),
}))

vi.mock('@vee-validate/zod', () => ({
  toTypedSchema: vi.fn<(schema: unknown) => unknown>((schema) => schema),
}))

describe('CreateApiKeyDialog', () => {
  /**
   * jsdom does not implement HTMLInputElement.showPicker; install a
   * configurable mock so click behavior is observable. Returns the spy plus
   * a restore fn that puts the original prototype property back.
   */
  function installShowPickerMock(impl?: () => void) {
    const showPicker = vi.fn<() => void>(impl)
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'showPicker')
    Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {
      configurable: true,
      value: showPicker,
    })
    return {
      showPicker,
      restore: () => {
        if (descriptor) {
          Object.defineProperty(HTMLInputElement.prototype, 'showPicker', descriptor)
        } else {
          delete (HTMLInputElement.prototype as { showPicker?: unknown }).showPicker
        }
      },
    }
  }

  beforeEach(() => {
    pendingState.value = false
    mockMutate.mockReset()
    mockHandleSubmit.mockReset()
    mockResetForm.mockReset()
    mockGetRetryAfterSeconds.mockReset()
    mockGetRetryAfterSeconds.mockReturnValue(null)
    // Simulate form.handleSubmit wiring: capture the callback and invoke it
    // with the current mockFormValues so payload assertions see live toggles.
    mockHandleSubmit.mockImplementation((...args: unknown[]) => {
      const cb = args[0] as (values: unknown) => void
      return (event: Event) => {
        event.preventDefault()
        cb(mockFormValues.value)
      }
    })
  })

  function createWrapper(open = true, attachTo?: HTMLElement) {
    return mount(CreateApiKeyDialog, {
      props: { open },
      ...(attachTo ? { attachTo } : {}),
    })
  }

  it('renders the form fields', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Create API Key')
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Permissions')
    expect(wrapper.text()).toContain('Expiration')
  })

  it('shows a live character counter next to the Name label', () => {
    const wrapper = createWrapper()
    // maxlength truncates pasted text silently; the counter makes the 100-char
    // limit visible ("6/100" for the mock's 'My Key').
    expect(wrapper.text()).toContain('6/100')
  })

  it('shows a one-line purpose description next to every Custom-mode scope', async () => {
    const wrapper = createWrapper()
    const customButton = wrapper.findAll('button').find((b) => b.text().trim() === 'Custom')!
    await customButton.trigger('click')

    // Always-visible descriptions (GitHub PAT style) — decision-critical at
    // checkbox time and touch-device safe, unlike hover-only tooltips.
    expect(wrapper.text()).toContain('Read-only access')
    expect(wrapper.text()).toContain('Manage API keys & devices')
    expect(wrapper.text()).toContain('Bidirectional data sync')
    expect(wrapper.text()).toContain('Full admin access (supersedes all)')
  })

  it('always renders the FormMessage placeholder so errors do not shift the layout', () => {
    const wrapper = createWrapper()
    // Regression: the Name field must not gate FormMessage behind v-if — the
    // component's min-h wrapper reserves space, so "Name is required" appearing
    // cannot push the scopes section down.
    expect(wrapper.find('[data-slot="form-message"]').exists()).toBe(true)
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

  it('submits the live scopes after unchecking a Custom-mode checkbox', async () => {
    const wrapper = createWrapper()
    // Switch to Custom mode, then uncheck READ via the checkbox change event.
    const customButton = wrapper.findAll('button').find((b) => b.text().trim() === 'Custom')!
    await customButton.trigger('click')
    const readCheckbox = wrapper.find('input[type="checkbox"]')
    await readCheckbox.setValue(false)
    await readCheckbox.trigger('change')

    await wrapper.find('form').trigger('submit')

    const [values] = mockMutate.mock.calls[0] as [unknown]
    expect((values as { scopes: string[] }).scopes).not.toContain('READ')
    expect((values as { scopes: string[] }).scopes).toEqual(['SYNC'])
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

  it('shows the per-user limit banner on AUTH_024 and does not close', async () => {
    mockMutate.mockImplementation((...args: unknown[]) => {
      const callbacks = args[1] as { onError?: (e: unknown) => void }
      callbacks.onError?.({ data: { code: 'AUTH_024' } })
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

  it('opens the native date picker when the date field text is clicked', async () => {
    const { showPicker, restore } = installShowPickerMock()
    try {
      const wrapper = createWrapper()
      // Switch to Custom date so the date input appears.
      const customDateButton = wrapper.findAll('button').find((b) => b.text().trim() === 'Custom date')!
      await customDateButton.trigger('click')

      // Clicking the mm/dd/yyyy area must open the picker, not only the
      // calendar indicator icon.
      await wrapper.find('input[type="date"]').trigger('click')

      expect(showPicker).toHaveBeenCalledTimes(1)
    } finally {
      restore()
    }
  })

  it('does not crash when the date picker is already open', async () => {
    const { showPicker, restore } = installShowPickerMock(() => {
      // Browsers throw InvalidStateError when showPicker() is called while
      // the picker is already showing (e.g. rapid double-click on the icon).
      throw new DOMException('Picker already showing', 'InvalidStateError')
    })
    try {
      const wrapper = createWrapper()
      const customDateButton = wrapper.findAll('button').find((b) => b.text().trim() === 'Custom date')!
      await customDateButton.trigger('click')

      const dateInput = wrapper.find('input[type="date"]')
      await dateInput.trigger('click')
      await dateInput.trigger('click')

      expect(showPicker).toHaveBeenCalledTimes(2)
    } finally {
      restore()
    }
  })

  it('prevents segment text selection on mousedown and shows simulated focus', async () => {
    const { showPicker, restore } = installShowPickerMock()
    try {
      // attachTo: focus assertions need the element mounted into the document.
      const wrapper = createWrapper(true, document.body)
      const customDateButton = wrapper.findAll('button').find((b) => b.text().trim() === 'Custom date')!
      await customDateButton.trigger('click')

      const dateInput = wrapper.find('input[type="date"]')
      // mousedown's default would select the clicked segment ("dd"); the
      // handler prevents that and fakes focus styling instead. It must NOT
      // refocus the field — focusing a date input makes Chrome auto-select
      // its first segment ("mm").
      const mousedownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
      dateInput.element.dispatchEvent(mousedownEvent)
      await nextTick()

      expect(mousedownEvent.defaultPrevented).toBe(true)
      expect(document.activeElement).not.toBe(dateInput.element)
      // Simulated focus: the same visual tokens as a focused input appear.
      expect(dateInput.classes()).toContain('ring-primary/20')
      expect(showPicker).not.toHaveBeenCalled() // picker opens on click, not mousedown

      // Choosing a date commits the value and clears the simulated focus.
      await dateInput.setValue('2026-09-01')
      await dateInput.trigger('change')
      await nextTick()
      expect(dateInput.classes()).not.toContain('ring-primary/20')
    } finally {
      restore()
    }
  })
})
