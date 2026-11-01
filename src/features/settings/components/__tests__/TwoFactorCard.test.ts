import { describe, expect, it, vi, beforeEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import TwoFactorCard from '../TwoFactorCard.vue'

const mockRefetch = vi.fn<() => void>()
const mockReplace = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockSignOutLocally = vi.hoisted(() => vi.fn<() => void>())

vi.mock('vue-router', () => ({ useRouter: () => ({ replace: mockReplace }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ signOutLocally: mockSignOutLocally }) }))
vi.mock('@/router/route-names', () => ({ RouteNames: { LOGIN: 'login' } }))
// The real composable hands back TanStack refs, so the fake has to as well: a plain object would
// make `status.value` undefined and quietly disable every computed in the card.
const statusState = vi.hoisted(() => ({
  data: undefined as unknown,
  isPending: false,
  isError: false,
}))

vi.mock('../../composables/useTwoFactor', async () => {
  const { ref } = await import('vue')
  return {
    useTwoFactorStatus: () => ({
      data: ref(statusState.data),
      isPending: ref(statusState.isPending),
      isError: ref(statusState.isError),
      refetch: mockRefetch,
    }),
    // The dialogs the card renders import these too; a partial mock would leave them undefined.
    useStartTwoFactorSetup: () => ({
      mutation: { mutateAsync: vi.fn<() => Promise<unknown>>(), isPending: ref(false) },
    }),
    useConfirmTwoFactorSetup: () => ({
      mutation: { mutateAsync: vi.fn<() => Promise<unknown>>(), isPending: ref(false) },
    }),
    useDisableTwoFactor: () => ({ mutation: { mutateAsync: vi.fn<() => Promise<unknown>>(), isPending: ref(false) } }),
    useRegenerateRecoveryCodes: () => ({
      mutation: { mutateAsync: vi.fn<() => Promise<unknown>>(), isPending: ref(false) },
    }),
  }
})

function setStatus(data: unknown, extra: { isPending?: boolean; isError?: boolean } = {}) {
  statusState.data = data
  statusState.isPending = extra.isPending ?? false
  statusState.isError = extra.isError ?? false
}

const ENABLED = {
  enabled: true,
  confirmedAt: '2026-11-01T10:00:00Z',
  recoveryCodesRemaining: 9,
  hasPassword: true,
  recentAuthentication: true,
}

const DISABLED = { ...ENABLED, enabled: false, confirmedAt: null, recoveryCodesRemaining: 0 }

describe('TwoFactorCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setStatus(DISABLED)
  })

  it('offers the switch when the account has no second factor', () => {
    const wrapper = mount(TwoFactorCard)

    expect(wrapper.get('[data-testid="two-factor-state"]').text()).toContain('Off')
    expect(wrapper.get('[data-testid="two-factor-enable"]').text()).toContain('Turn on')
    expect(wrapper.find('[data-testid="two-factor-disable"]').exists()).toBe(false)
  })

  it('shows what is on and how many codes are left once enabled', () => {
    setStatus(ENABLED)
    const wrapper = mount(TwoFactorCard)

    expect(wrapper.get('[data-testid="two-factor-state"]').text()).toContain('On')
    expect(wrapper.text()).toContain('9 recovery codes left')
    expect(wrapper.find('[data-testid="two-factor-disable"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="two-factor-regenerate"]').exists()).toBe(true)
  })

  it('still reports the remaining codes when the server omits the confirmation date', () => {
    setStatus({ ...ENABLED, confirmedAt: null })
    const wrapper = mount(TwoFactorCard)

    expect(wrapper.text()).toContain('9 recovery codes left')
    expect(wrapper.text()).not.toContain('On since')
  })

  it('blocks the switch when an OAuth-only session is too old to prove itself', () => {
    setStatus({ ...DISABLED, hasPassword: false, recentAuthentication: false })
    const wrapper = mount(TwoFactorCard)

    expect(wrapper.get('[data-testid="two-factor-enable"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('recent sign-in')
    // A dead end is not an answer: the card offers the one action that unblocks it.
    expect(wrapper.find('[data-testid="two-factor-sign-in-again"]').exists()).toBe(true)
  })

  it('says "code" when a single recovery code is left', async () => {
    setStatus({ ...ENABLED, recoveryCodesRemaining: 1 })
    const wrapper = mount(TwoFactorCard)

    expect(wrapper.get('[data-testid="two-factor-meta"]').text()).toContain('1 recovery code left')
  })

  it('offers a re-setup entry that starts from the confirm dialog', async () => {
    setStatus(ENABLED)
    const wrapper = mount(TwoFactorCard)

    await wrapper.get('[data-testid="two-factor-reset"]').trigger('click')

    const dialog = wrapper.findComponent({ name: 'TwoFactorConfirmDialog' })
    expect(dialog.props('mode')).toBe('reset')
    expect(dialog.props('open')).toBe(true)
  })

  it('signs the reader out so the next session is recent enough to set the factor up', async () => {
    setStatus({ ...DISABLED, hasPassword: false, recentAuthentication: false })
    const wrapper = mount(TwoFactorCard)

    await wrapper.get('[data-testid="two-factor-sign-in-again"]').trigger('click')

    expect(mockSignOutLocally).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith({ name: 'login', query: { redirect: '/settings/security' } })
  })

  it('offers a retry instead of an empty card when the status could not be read', async () => {
    setStatus(undefined, { isError: true })
    const wrapper = mount(TwoFactorCard)

    await wrapper.get('[data-testid="two-factor-retry"]').trigger('click')
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('opens the setup dialog from the switch', async () => {
    const wrapper = mount(TwoFactorCard, {
      global: { stubs: { TwoFactorSetupDialog: { template: '<div data-testid="setup-dialog" />' } } },
    })

    await wrapper.get('[data-testid="two-factor-enable"]').trigger('click')

    expect(wrapper.find('[data-testid="setup-dialog"]').exists()).toBe(true)
  })
})
