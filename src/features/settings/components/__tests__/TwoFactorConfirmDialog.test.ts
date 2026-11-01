import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { flushPromises, mount } from '@vue/test-utils'
import TwoFactorConfirmDialog from '../TwoFactorConfirmDialog.vue'

const mockDisable = vi.hoisted(() => vi.fn<(credential: unknown) => Promise<unknown>>())
const mockRegenerate = vi.hoisted(() => vi.fn<(credential: unknown) => Promise<unknown>>())
const mockToastSuccess = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>())

// The real composables expose TanStack Query's `isPending`, which is true for as long as the
// request runs; the mock flips its own ref around the same promise so the button can be checked.
vi.mock('../../composables/useTwoFactor', async () => {
  const { ref } = await import('vue')
  const disablePending = ref(false)
  const regeneratePending = ref(false)
  return {
    useDisableTwoFactor: () => ({
      mutation: {
        isPending: disablePending,
        mutateAsync: async (credential: unknown) => {
          disablePending.value = true
          try {
            return await mockDisable(credential)
          } finally {
            disablePending.value = false
          }
        },
      },
    }),
    useRegenerateRecoveryCodes: () => ({
      mutation: {
        isPending: regeneratePending,
        mutateAsync: async (credential: unknown) => {
          regeneratePending.value = true
          try {
            return await mockRegenerate(credential)
          } finally {
            regeneratePending.value = false
          }
        },
      },
    }),
  }
})

vi.mock('vue-sonner', () => ({ toast: { success: mockToastSuccess, error: vi.fn<() => void>() } }))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { name: 'DialogContent', props: ['showCloseButton'], template: '<div><slot /></div>' },
  DialogDescription: { template: '<p><slot /></p>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<h2><slot /></h2>' },
  DialogFooter: { template: '<div><slot /></div>' },
}))

const CODES = Array.from({ length: 10 }, (_, index) => `CODE-${index}`)

function mountDialog(mode: 'disable' | 'regenerate' | 'reset') {
  return mount(TwoFactorConfirmDialog, {
    props: { open: true, mode, 'onUpdate:open': () => {} },
  })
}

describe('TwoFactorConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends a six-digit value as a TOTP code and closes when the server agrees', async () => {
    mockDisable.mockResolvedValue(undefined)
    const wrapper = mountDialog('disable')

    await wrapper.get('[data-testid="two-factor-credential"]').setValue('123456')
    await wrapper.get('[data-testid="two-factor-confirm-submit"]').trigger('click')
    await flushPromises()

    expect(mockDisable).toHaveBeenCalledWith({ code: '123456' })
    expect(mockToastSuccess).toHaveBeenCalledTimes(1)
    // Closing is the observable outcome now that the dialog no longer emits a `done` event.
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })

  it('sends anything else as a recovery code', async () => {
    mockDisable.mockResolvedValue(undefined)
    const wrapper = mountDialog('disable')

    await wrapper.get('[data-testid="two-factor-credential"]').setValue('KYQV-BATK-MZVK-MMXO')
    await wrapper.get('[data-testid="two-factor-confirm-submit"]').trigger('click')
    await flushPromises()

    expect(mockDisable).toHaveBeenCalledWith({ recoveryCode: 'KYQV-BATK-MZVK-MMXO' })
  })

  it('keeps the dialog open and says so when the credential is refused', async () => {
    mockDisable.mockRejectedValue(Object.assign(new Error('nope'), { statusCode: 401, data: { code: 'AUTH_027' } }))
    const wrapper = mountDialog('disable')

    await wrapper.get('[data-testid="two-factor-credential"]').setValue('000000')
    await wrapper.get('[data-testid="two-factor-confirm-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('not right')
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })

  it('shows the replacement codes after a regeneration, and only then', async () => {
    mockRegenerate.mockResolvedValue(CODES)
    const wrapper = mountDialog('regenerate')

    await wrapper.get('[data-testid="two-factor-credential"]').setValue('123456')
    await wrapper.get('[data-testid="two-factor-confirm-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[data-testid="recovery-code"]')).toHaveLength(10)
    expect(wrapper.find('[data-testid="two-factor-confirm-submit"]').exists()).toBe(false)
    // The one-time batch must not be dismissable by the close button while it is on screen.
    expect(wrapper.findComponent({ name: 'DialogContent' }).props('showCloseButton')).toBe(false)
  })

  it('keeps a reset from being submitted twice while the disable request is open', async () => {
    let settle: () => void = () => {}
    mockDisable.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve
        }),
    )
    const wrapper = mountDialog('reset')

    await wrapper.get('[data-testid="two-factor-credential"]').setValue('123456')
    await wrapper.get('[data-testid="two-factor-confirm-submit"]').trigger('click')
    await flushPromises()

    // A reset runs the disable request, so that is the mutation whose progress the button follows.
    expect(wrapper.get('[data-testid="two-factor-confirm-submit"]').attributes('disabled')).toBeDefined()

    settle()
    await flushPromises()
  })

  it('does not hand over when the reader closed the dialog before the answer arrived', async () => {
    let settle: () => void = () => {}
    mockDisable.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve
        }),
    )
    const wrapper = mountDialog('reset')

    await wrapper.get('[data-testid="two-factor-credential"]').setValue('123456')
    await wrapper.get('[data-testid="two-factor-confirm-submit"]').trigger('click')
    await flushPromises()

    await wrapper.setProps({ open: false })
    settle()
    await flushPromises()

    expect(wrapper.emitted('reset')).toBeUndefined()
  })

  it('hands a reset over to the setup wizard without claiming the factor is still off', async () => {
    mockDisable.mockResolvedValue(undefined)
    const wrapper = mountDialog('reset')

    await wrapper.get('[data-testid="two-factor-credential"]').setValue('123456')
    await wrapper.get('[data-testid="two-factor-confirm-submit"]').trigger('click')
    await flushPromises()

    expect(mockDisable).toHaveBeenCalledWith({ code: '123456' })
    expect(wrapper.emitted('reset')).toHaveLength(1)
    // No "turned off" toast: a reset immediately turns it back on.
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it('refuses an empty credential before it reaches the network', async () => {
    const wrapper = mountDialog('disable')

    await wrapper.get('[data-testid="two-factor-confirm-submit"]').trigger('click')
    await flushPromises()

    expect(mockDisable).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text().length).toBeGreaterThan(0)
  })
})
