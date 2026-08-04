import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref, defineComponent } from 'vue'
import RevokeApiKeyDialog from '../RevokeApiKeyDialog.vue'
import type { ApiKey } from '@/lib/schemas/api-key.schema'

// ==========================================
// Hoisted Mock Variables
// ==========================================

const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
/** Mutable pending flag read by the mocked composable at assertion time */
const pendingState = vi.hoisted(() => ({ value: false }))
const mockToastSuccess = vi.hoisted(() => vi.fn<() => void>())
const mockToastError = vi.hoisted(() => vi.fn<() => void>())
const mockGetErrorMessage = vi.hoisted(() => vi.fn<(error: unknown) => string>())
/** Captures the preventDefault call made by handleOpenAutoFocus when the
 * AlertDialogContent stub emits openAutoFocus on mount. */
const mockPreventDefault = vi.hoisted(() => vi.fn<() => void>())

// ==========================================
// Mocks
// ==========================================

vi.mock('@/composables/useApiKeys', () => ({
  useRevokeApiKey: vi.fn<() => unknown>(() => ({
    mutation: {
      mutate: mockMutate,
      isPending: pendingState,
      isError: ref(false),
      error: ref(null),
    },
  })),
}))

vi.mock('@/components/ui/button', () => ({
  Button: {
    props: ['variant', 'disabled'],
    template: '<button :disabled="disabled" :data-variant="variant"><slot /></button>',
  },
}))

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: {
    props: ['open'],
    emits: ['update:open'],
    template: '<div data-testid="alert-dialog-root"><slot /></div>',
  },
  AlertDialogContent: defineComponent({
    emits: ['openAutoFocus'],
    mounted() {
      this.$emit('openAutoFocus', { preventDefault: mockPreventDefault })
    },
    template: '<div data-testid="alert-dialog-content"><slot /></div>',
  }),
  AlertDialogDescription: { template: '<div data-testid="alert-dialog-description"><slot /></div>' },
  AlertDialogFooter: { template: '<div data-testid="alert-dialog-footer"><slot /></div>' },
  AlertDialogHeader: { template: '<div data-testid="alert-dialog-header"><slot /></div>' },
  AlertDialogTitle: { template: '<div data-testid="alert-dialog-title"><slot /></div>' },
  AlertDialogCancel: {
    props: ['disabled'],
    template: '<button data-testid="alert-dialog-cancel" :disabled="disabled"><slot /></button>',
  },
}))

vi.mock('vue-sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

vi.mock('@/lib/utils/api-error', () => ({
  getErrorMessage: mockGetErrorMessage,
}))

// ==========================================
// Test Data
// ==========================================

const sampleKey: ApiKey = {
  id: 'key-uuid-123',
  name: 'MacBook Pro - IntelliJ IDEA',
  keyPrefix: 'cttak_a1b2c3d4',
  scopes: ['READ', 'SYNC'],
  lastUsedAt: '2026-08-01T10:00:00Z',
  expiresAt: null,
  revokedAt: null,
  createdAt: '2026-07-01T10:00:00Z',
  status: 'ACTIVE',
}

describe('RevokeApiKeyDialog', () => {
  beforeEach(() => {
    pendingState.value = false
    mockMutate.mockReset()
    mockToastSuccess.mockReset()
    mockToastError.mockReset()
    mockGetErrorMessage.mockReset()
    mockPreventDefault.mockReset()
    mockGetErrorMessage.mockImplementation((error: unknown) =>
      error && typeof error === 'object' && 'data' in error
        ? 'API key not found or no longer accessible.'
        : 'An unexpected error occurred. Please try again later.',
    )
  })

  function createWrapper(open = true) {
    return mount(RevokeApiKeyDialog, {
      props: { open, apiKey: sampleKey },
    })
  }

  it('renders the key name and prefix', () => {
    const wrapper = createWrapper()

    expect(wrapper.text()).toContain('Revoke API Key')
    expect(wrapper.text()).toContain(sampleKey.name)
    expect(wrapper.text()).toContain(sampleKey.keyPrefix)
  })

  it('cancel does not trigger the revoke mutation', async () => {
    const wrapper = createWrapper()
    const cancelButton = wrapper.find('[data-testid="alert-dialog-cancel"]')

    await cancelButton.trigger('click')

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('calls mutate with the key id when revoke is confirmed', async () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    const revokeButton = buttons.find((b) => b.text().includes('Revoke'))

    await revokeButton!.trigger('click')

    expect(mockMutate).toHaveBeenCalledTimes(1)
    const [id, callbacks] = mockMutate.mock.calls[0] as [string, { onSuccess?: () => void; onError?: () => void }]
    expect(id).toBe(sampleKey.id)
    expect(callbacks.onSuccess).toBeTypeOf('function')
    expect(callbacks.onError).toBeTypeOf('function')
  })

  it('disables the revoke button and shows a spinner while pending', async () => {
    pendingState.value = true
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    const revokeButton = buttons.find((b) => b.text().includes('Revoking'))

    expect(revokeButton).toBeDefined()
    expect(revokeButton?.attributes('disabled')).toBeDefined()
  })

  it('closes the dialog and shows a success toast on revoke success', async () => {
    mockMutate.mockImplementation((...args: unknown[]) => {
      const callbacks = args[1] as { onSuccess?: () => void }
      callbacks.onSuccess?.()
    })

    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    const revokeButton = buttons.find((b) => b.text().includes('Revoke'))

    await revokeButton!.trigger('click')

    expect(mockToastSuccess).toHaveBeenCalled()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('keeps the dialog open and toasts the AUTH_010 generic message on error', async () => {
    mockMutate.mockImplementation((...args: unknown[]) => {
      const callbacks = args[1] as { onError?: (error: unknown) => void }
      callbacks.onError?.({ data: { code: 'AUTH_010' } })
    })

    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    const revokeButton = buttons.find((b) => b.text().includes('Revoke'))

    await revokeButton!.trigger('click')

    expect(mockToastError).toHaveBeenCalled()
    expect(mockGetErrorMessage).toHaveBeenCalledWith({ data: { code: 'AUTH_010' } })
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })

  it('does not double-mutate when the revoke button is clicked twice while pending', async () => {
    mockMutate.mockImplementation(() => {
      // Simulate the mutation entering pending state after the first click.
      pendingState.value = true
    })

    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    const revokeButton = buttons.find((b) => b.text().includes('Revoke'))

    await revokeButton!.trigger('click')
    await revokeButton!.trigger('click')

    expect(mockMutate).toHaveBeenCalledTimes(1)
  })

  it('calls preventDefault on openAutoFocus so Cancel receives explicit focus', () => {
    createWrapper()

    expect(mockPreventDefault).toHaveBeenCalledTimes(1)
  })
})
