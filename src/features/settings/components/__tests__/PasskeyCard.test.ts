import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import PasskeyCard from '../PasskeyCard.vue'

const listState = vi.hoisted(() => ({ data: [] as unknown[], isPending: false, isError: false }))
const mockRegister = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockRename = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockDelete = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockRefetch = vi.hoisted(() => vi.fn<() => void>())
const mockSignOutLocally = vi.hoisted(() => vi.fn<() => void>())
const mockReplace = vi.hoisted(() => vi.fn<() => void>())

vi.mock('vue-router', () => ({ useRouter: () => ({ replace: mockReplace }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ signOutLocally: mockSignOutLocally }) }))
vi.mock('@/router/route-names', () => ({ RouteNames: { LOGIN: 'login' } }))

// The card tells a dismissed prompt apart from a failure by the error class, so the mock has to
// carry a real one.
class FakeCeremonyCancelled extends Error {}
vi.mock('../../composables/usePasskeys', () => ({
  PasskeyCeremonyCancelled: FakeCeremonyCancelled,
  usePasskeys: () => ({
    data: ref(listState.data),
    isPending: ref(listState.isPending),
    isError: ref(listState.isError),
    refetch: mockRefetch,
  }),
  useRegisterPasskey: () => ({ mutate: mockRegister, isPending: ref(false) }),
  useRenamePasskey: () => ({ mutate: mockRename, isPending: ref(false) }),
  useDeletePasskey: () => ({ mutate: mockDelete, isPending: ref(false) }),
}))

// The real dialogs teleport their content; the card's job is what it renders and which call it
// makes, so the shell is enough here.
// The card reads the page's freshness answer instead of keeping its own copy of it; the switch lets
// a test say what that answer is.
const freshness = vi.hoisted(() => ({ isFresh: true }))
vi.mock('../../composables/useRecentAuthentication', () => ({
  useRecentAuthentication: () => ({ isKnown: ref(true), isFresh: ref(freshness.isFresh) }),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<p><slot /></p>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<h2><slot /></h2>' },
  DialogFooter: { template: '<div><slot /></div>' },
}))

const PASSKEY = {
  id: 'row-1',
  name: 'MacBook Pro',
  createdAt: '2026-11-03T10:00:00Z',
  lastUsedAt: null,
  transports: ['internal'],
  backupEligible: true,
  backupState: false,
}

function apiError(code: string) {
  return { statusCode: 403, statusMessage: 'Forbidden', message: code, data: { code } }
}

describe('PasskeyCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom ships no Web Authentication API; the card hides itself without it, which is the
    // behaviour a browser without passkeys gets. The tests are about the card, so it is stubbed in.
    Object.defineProperty(globalThis, 'PublicKeyCredential', {
      configurable: true,
      writable: true,
      value: class {},
    })
    listState.data = []
    listState.isPending = false
    listState.isError = false
    freshness.isFresh = true
  })

  it('invites the reader to add one when the account has none', () => {
    const wrapper = mount(PasskeyCard)

    expect(wrapper.text()).toContain('No passkeys yet')
    expect(wrapper.find('[data-testid="passkey-row"]').exists()).toBe(false)
  })

  it('shows a credential that has never been used', () => {
    listState.data = [PASSKEY]
    const wrapper = mount(PasskeyCard)

    expect(wrapper.text()).toContain('MacBook Pro')
    expect(wrapper.text()).toContain('Never used')
    // Eligible but not yet synced: neither "this device" nor "synced" would be true.
    expect(wrapper.text()).toContain('Can sync')
  })

  it('offers no way to add one while the page says the session is old', () => {
    freshness.isFresh = false
    const wrapper = mount(PasskeyCard)

    // The page's notice explains the state; the card's part is to stop offering an action that
    // cannot succeed from here.
    expect(wrapper.get('[data-testid="passkey-add"]').attributes('disabled')).toBeDefined()

    freshness.isFresh = true
  })

  it('closes the dialog when the server still refuses for an old session', async () => {
    mockRegister.mockImplementation((...args: unknown[]) => {
      ;(args[1] as { onError: (error: unknown) => void }).onError(apiError('AUTH_031'))
    })
    const wrapper = mount(PasskeyCard)

    await wrapper.get('[data-testid="passkey-add"]').trigger('click')
    await wrapper.get('[data-testid="passkey-name"]').setValue('Work laptop')
    await wrapper.get('[data-testid="passkey-name-submit"]').trigger('click')
    await flushPromises()

    // The page owns the "sign in again" sentence; here the dialog closes without an error of its own.
    expect(wrapper.findComponent({ name: 'PasskeyNameDialog' }).props('open')).toBe(false)
    expect(wrapper.text()).not.toContain('Sign in again')
  })

  it('keeps the dialog and states the reason when the attempt itself failed', async () => {
    mockRegister.mockImplementation((...args: unknown[]) => {
      ;(args[1] as { onError: (error: unknown) => void }).onError(apiError('AUTH_033'))
    })
    const wrapper = mount(PasskeyCard)

    await wrapper.get('[data-testid="passkey-add"]').trigger('click')
    await wrapper.get('[data-testid="passkey-name"]').setValue('Work laptop')
    await wrapper.get('[data-testid="passkey-name-submit"]').trigger('click')
    await flushPromises()

    const dialog = wrapper.findComponent({ name: 'PasskeyNameDialog' })
    expect(dialog.props('open')).toBe(true)
    expect(dialog.props('errorMessage')).toContain('passkey could not be verified')
  })

  it('says why the last way in cannot be removed', async () => {
    listState.data = [PASSKEY]
    mockDelete.mockImplementation((...args: unknown[]) => {
      ;(args[1] as { onError: (error: unknown) => void }).onError(apiError('AUTH_018'))
    })
    const wrapper = mount(PasskeyCard)

    await wrapper.get('[data-testid="passkey-remove"]').trigger('click')
    await wrapper.get('[data-testid="passkey-remove-confirm"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="passkey-last-path"]').exists()).toBe(true)
    // The generic failure row stays out of the way: two messages for one refusal would be noise.
    expect(wrapper.find('[data-testid="passkey-failure"]').exists()).toBe(false)
  })

  it('translates any other refusal into a sentence instead of a code', async () => {
    listState.data = [PASSKEY]
    mockDelete.mockImplementation((...args: unknown[]) => {
      ;(args[1] as { onError: (error: unknown) => void }).onError(apiError('AUTH_033'))
    })
    const wrapper = mount(PasskeyCard)

    await wrapper.get('[data-testid="passkey-remove"]').trigger('click')
    await wrapper.get('[data-testid="passkey-remove-confirm"]').trigger('click')
    await flushPromises()

    const failure = wrapper.get('[data-testid="passkey-failure"]')
    expect(failure.text()).toContain('passkey could not be verified')
    expect(failure.text()).not.toContain('AUTH_033')
  })
})
