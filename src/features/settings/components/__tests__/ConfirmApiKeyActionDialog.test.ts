import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ConfirmApiKeyActionDialog from '../ConfirmApiKeyActionDialog.vue'
import type { ApiKey } from '@/lib/schemas/api-key.schema'

// ==========================================
// Hoisted Mock Variables
// ==========================================

const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
/** Mutable pending flag read by the passed mutation at assertion time */
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

const activeKey: ApiKey = {
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

const revokedKey: ApiKey = {
  id: 'key-uuid-789',
  name: 'Compromised Key',
  keyPrefix: 'cttak_i9j0k1l2',
  scopes: ['ADMIN'],
  lastUsedAt: '2026-07-15T08:30:00Z',
  expiresAt: null,
  revokedAt: '2026-07-20T00:00:00Z',
  createdAt: '2026-06-01T00:00:00Z',
  status: 'REVOKED',
}

/** Shared dialog config for a revoke action (one of the two consumers). */
function revokeProps() {
  return {
    mutation: { mutate: mockMutate, isPending: pendingState },
    title: 'Revoke API Key',
    description: 'After revocation, devices using this key can no longer sync data. This action cannot be undone.',
    confirmLabel: 'Revoke',
    pendingLabel: 'Revoking...',
    successTitle: 'API Key revoked',
    successDescription: (name: string) => `${name} can no longer be used to authenticate.`,
    errorTitle: 'Failed to revoke API key',
  }
}

/** Shared dialog config for a delete action (the other consumer). */
function deleteProps() {
  return {
    mutation: { mutate: mockMutate, isPending: pendingState },
    title: 'Delete API Key',
    description:
      'This permanently deletes the key. It cannot be recovered, and any audit references to it are removed.',
    confirmLabel: 'Delete permanently',
    pendingLabel: 'Deleting...',
    successTitle: 'API Key deleted',
    successDescription: (name: string) => `${name} has been permanently removed.`,
    errorTitle: 'Failed to delete API key',
  }
}

describe('ConfirmApiKeyActionDialog', () => {
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

  function createWrapper(props: Partial<ReturnType<typeof revokeProps>> = {}, apiKey: ApiKey = activeKey) {
    return mount(ConfirmApiKeyActionDialog, {
      props: { open: true, apiKey, ...revokeProps(), ...props },
    })
  }

  describe('shared shell', () => {
    it('renders the key name and prefix', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain(activeKey.name)
      // break-all prevents long space-less names from overflowing the dialog
      const nameEl = wrapper.findAll('p').find((p) => p.text().includes(activeKey.name))
      expect(nameEl?.classes()).toContain('break-all')
      expect(wrapper.text()).toContain(activeKey.keyPrefix)
    })

    it('cancel does not trigger the mutation', async () => {
      const wrapper = createWrapper()
      const cancelButton = wrapper.find('[data-testid="alert-dialog-cancel"]')

      await cancelButton.trigger('click')

      expect(mockMutate).not.toHaveBeenCalled()
    })

    it('calls mutate with the key id and success/error callbacks when confirmed', async () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('button')
      const confirmButton = buttons.find((b) => b.text().includes('Revoke'))

      await confirmButton!.trigger('click')

      expect(mockMutate).toHaveBeenCalledTimes(1)
      const [id, callbacks] = mockMutate.mock.calls[0] as [string, { onSuccess?: () => void; onError?: () => void }]
      expect(id).toBe(activeKey.id)
      expect(callbacks.onSuccess).toBeTypeOf('function')
      expect(callbacks.onError).toBeTypeOf('function')
    })

    it('disables the confirm button and shows a spinner while pending', () => {
      pendingState.value = true
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('button')
      const confirmButton = buttons.find((b) => b.text().includes('Revoking'))

      expect(confirmButton).toBeDefined()
      expect(confirmButton?.attributes('disabled')).toBeDefined()
    })

    it('closes the dialog and shows a success toast on success', async () => {
      mockMutate.mockImplementation((...args: unknown[]) => {
        const callbacks = args[1] as { onSuccess?: () => void }
        callbacks.onSuccess?.()
      })

      const wrapper = createWrapper()
      const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('Revoke'))
      await confirmButton!.trigger('click')

      expect(mockToastSuccess).toHaveBeenCalled()
      expect(mockToastSuccess).toHaveBeenCalledWith('API Key revoked', {
        description: 'MacBook Pro - IntelliJ IDEA can no longer be used to authenticate.',
      })
      expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    })

    it('keeps the dialog open and toasts the mapped error on failure', async () => {
      mockMutate.mockImplementation((...args: unknown[]) => {
        const callbacks = args[1] as { onError?: (error: unknown) => void }
        callbacks.onError?.({ data: { code: 'AUTH_010' } })
      })

      const wrapper = createWrapper()
      const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('Revoke'))
      await confirmButton!.trigger('click')

      expect(mockToastError).toHaveBeenCalled()
      expect(mockGetErrorMessage).toHaveBeenCalledWith({ data: { code: 'AUTH_010' } })
      expect(wrapper.emitted('update:open')).toBeUndefined()
    })

    it('does not double-mutate when confirmed twice while pending', async () => {
      mockMutate.mockImplementation(() => {
        // Simulate the mutation entering pending state after the first click.
        pendingState.value = true
      })

      const wrapper = createWrapper()
      const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('Revoke'))

      await confirmButton!.trigger('click')
      await confirmButton!.trigger('click')

      expect(mockMutate).toHaveBeenCalledTimes(1)
    })

    it('calls preventDefault on openAutoFocus so Cancel receives explicit focus', () => {
      createWrapper()

      expect(mockPreventDefault).toHaveBeenCalledTimes(1)
    })
  })

  describe('revoke configuration', () => {
    it('renders revoke-specific copy', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Revoke API Key')
      expect(wrapper.text()).toContain('can no longer sync data')
    })

    it('renders the description without a leading space and left-aligned', () => {
      const wrapper = createWrapper()

      // Multi-line {{ }} interpolation would condense into a leading space,
      // pushing the first line off the left edge (visible on narrow screens).
      const description = wrapper.find('[data-testid="alert-dialog-description"]')
      expect(description.text().startsWith('After')).toBe(true)
      expect(description.text().startsWith(' ')).toBe(false)

      // text-left overrides the mobile-centered header default so the
      // description stays left-aligned at every breakpoint.
      expect(wrapper.find('[data-testid="alert-dialog-header"]').classes()).toContain('text-left')
    })
  })

  describe('delete configuration', () => {
    it('renders delete-specific copy warning of permanence', () => {
      const wrapper = createWrapper(deleteProps(), revokedKey)
      expect(wrapper.text()).toContain('Delete API Key')
      expect(wrapper.text()).toContain('permanently deletes')
      expect(wrapper.text()).toContain('cannot be recovered')
    })

    it('sends the delete success toast with the key name', async () => {
      mockMutate.mockImplementation((...args: unknown[]) => {
        const callbacks = args[1] as { onSuccess?: () => void }
        callbacks.onSuccess?.()
      })

      const wrapper = createWrapper(deleteProps(), revokedKey)
      const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('Delete permanently'))
      await confirmButton!.trigger('click')

      expect(mockToastSuccess).toHaveBeenCalledWith('API Key deleted', {
        description: 'Compromised Key has been permanently removed.',
      })
      expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    })

    it('toasts the mapped error on delete failure (e.g. AUTH_023)', async () => {
      mockMutate.mockImplementation((...args: unknown[]) => {
        const callbacks = args[1] as { onError?: (error: unknown) => void }
        callbacks.onError?.({ data: { code: 'AUTH_023' } })
      })
      mockGetErrorMessage.mockImplementation(
        () => 'Only revoked API keys can be deleted. Revoke the key before removing it.',
      )

      const wrapper = createWrapper(deleteProps(), revokedKey)
      const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('Delete permanently'))
      await confirmButton!.trigger('click')

      expect(mockToastError).toHaveBeenCalled()
      expect(mockGetErrorMessage).toHaveBeenCalledWith({ data: { code: 'AUTH_023' } })
      expect(wrapper.emitted('update:open')).toBeUndefined()
    })
  })
})
