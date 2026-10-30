import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import LoginSessionsCard from '../LoginSessionsCard.vue'
import type { LoginSession } from '@/lib/api'

/**
 * The card folds identical clients, so the assertions are about three things: what stays visible
 * without asking (the current sign-in and one row per client), what appears when a client is
 * expanded (one line per sign-in, each revocable), and which request a revocation sends.
 */

const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'

const mockRevoke = vi.hoisted(() => vi.fn<(id: string) => Promise<void>>())
const mockRevokeMany = vi.hoisted(() => vi.fn<(ids: string[]) => Promise<unknown>>())
const mockSignOutLocally = vi.hoisted(() => vi.fn<() => void>())
const mockToastSuccess = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>())
const mockToastError = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>())

let sessionsValue: LoginSession[] = []
let isPendingValue = false
let isErrorValue = false
const revokePendingValue = ref(false)
const bulkPendingValue = ref(false)

vi.mock('../../composables/useLoginSessions', () => ({
  useLoginSessions: vi.fn<() => unknown>(() => ({
    sessions: ref(sessionsValue),
    isPending: ref(isPendingValue),
    isError: ref(isErrorValue),
    refetch: vi.fn<() => void>(),
  })),
  useRevokeLoginSession: vi.fn<() => unknown>(() => ({
    mutation: { mutateAsync: mockRevoke, isPending: revokePendingValue },
  })),
  useRevokeLoginSessions: vi.fn<() => unknown>(() => ({
    mutation: { mutateAsync: mockRevokeMany, isPending: bulkPendingValue },
  })),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<() => unknown>(() => ({
    signOutLocally: mockSignOutLocally,
  })),
}))

vi.mock('vue-sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
  formatDateTime: (value: string) => `at ${value}`,
  formatRelativeTime: (value: string) => `ago ${value}`,
}))

const mockGetRetryAfterSeconds = vi.hoisted(() => vi.fn<(error: unknown) => number | null>(() => null))

vi.mock('@/lib/utils/api-error', () => ({
  extractErrorCode: vi.fn<(error: unknown) => string | null>(() => null),
  mapApiErrorCode: vi.fn<(code: string) => string>(() => 'mapped'),
  isApiError: (error: unknown) => typeof (error as { statusCode?: unknown } | null)?.statusCode === 'number',
  getRetryAfterSeconds: mockGetRetryAfterSeconds,
}))

vi.mock('@/components/ui/button', () => ({
  Button: {
    props: ['disabled', 'variant'],
    template: '<button :disabled="disabled" v-bind="$attrs"><slot /></button>',
  },
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: { template: '<span v-bind="$attrs"><slot /></span>' },
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: { props: ['open'], template: '<div v-if="open" data-testid="dialog-root"><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<div><slot /></div>' },
  DialogFooter: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
}))

let sessionSeq = 0

function session(overrides: Partial<LoginSession> = {}): LoginSession {
  sessionSeq += 1
  return {
    id: `session-${sessionSeq}`,
    kind: 'WEB',
    deviceName: null,
    ideName: null,
    userAgent: CHROME_MAC,
    createdAt: '2026-07-01T00:00:00Z',
    lastUsedAt: '2026-07-09T10:30:00Z',
    expiresAt: '2026-08-09T10:30:00Z',
    current: false,
    ...overrides,
  }
}

const rowsOf = (wrapper: ReturnType<typeof mount>, testid: string) => wrapper.findAll(`[data-testid="${testid}"]`)

describe('LoginSessionsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The cooldown outlives a mount on purpose, so a case that trips the limit would otherwise
    // leave the next one with a disabled action.
    sessionStorage.clear()
    sessionSeq = 0
    mockRevoke.mockResolvedValue(undefined)
    mockRevokeMany.mockResolvedValue({ revoked: 0, skipped: [] })
    mockGetRetryAfterSeconds.mockReturnValue(null)
    isPendingValue = false
    isErrorValue = false
    revokePendingValue.value = false
    bulkPendingValue.value = false
    sessionsValue = []
  })

  describe('what is visible without asking', () => {
    it('shows the current sign-in on its own row', () => {
      sessionsValue = [session({ current: true })]
      const wrapper = mount(LoginSessionsCard)

      const current = wrapper.find('[data-current="true"]')
      expect(current.exists()).toBe(true)
      expect(current.text()).toContain('Chrome · macOS')
      expect(current.text()).toContain('This session')
      expect(current.text()).toContain('Sign out')
    })

    it('folds the other sign-ins into one row per client', () => {
      sessionsValue = [
        session({ current: true }),
        session(),
        session(),
        session(),
        session({ userAgent: FIREFOX_LINUX }),
      ]
      const wrapper = mount(LoginSessionsCard)

      // One row for the current sign-in, one per client — not one per sign-in.
      expect(rowsOf(wrapper, 'login-session-row')).toHaveLength(1)
      const groups = rowsOf(wrapper, 'login-session-group')
      expect(groups).toHaveLength(2)
      expect(groups[0]!.text()).toContain('Chrome · macOS')
      expect(groups[0]!.text()).toContain('3 sign-ins')
      expect(groups[1]!.text()).toContain('Firefox · Linux')
      expect(rowsOf(wrapper, 'login-session-child')).toHaveLength(0)
    })

    it('folds clients that are not adjacent in the server order', () => {
      sessionsValue = [session(), session({ userAgent: FIREFOX_LINUX }), session()]
      const wrapper = mount(LoginSessionsCard)

      const groups = rowsOf(wrapper, 'login-session-group')
      expect(groups).toHaveLength(2)
      expect(groups[0]!.text()).toContain('2 sign-ins')
      expect(groups[1]!.text()).toContain('Firefox · Linux')
    })

    it('gives a client with a single sign-in a direct revoke instead of an expander', () => {
      sessionsValue = [
        session({ kind: 'PLUGIN', deviceName: 'workstation', ideName: 'IntelliJ IDEA', userAgent: null }),
      ]
      const wrapper = mount(LoginSessionsCard)

      const groups = rowsOf(wrapper, 'login-session-group')
      expect(groups).toHaveLength(1)
      expect(groups[0]!.text()).toContain('workstation')
      expect(groups[0]!.text()).toContain('IntelliJ IDEA')
      expect(rowsOf(wrapper, 'login-session-toggle')).toHaveLength(0)
      expect(groups[0]!.find('[data-testid="login-session-revoke"]').exists()).toBe(true)
    })

    it('names a browser row from its agent string, not from the raw header', () => {
      sessionsValue = [session()]
      const wrapper = mount(LoginSessionsCard)

      expect(wrapper.text()).toContain('Chrome · macOS')
      expect(wrapper.text()).not.toContain('Mozilla/5.0')
    })

    it('falls back to "Unnamed client" when there is no agent string at all', () => {
      sessionsValue = [session({ userAgent: null })]
      const wrapper = mount(LoginSessionsCard)

      expect(wrapper.text()).toContain('Unnamed client')
    })

    it('shows the agent string when nothing in it is recognised, so two such clients stay apart', () => {
      sessionsValue = [session({ userAgent: 'curl/8.4.0' }), session({ userAgent: 'python-requests/2.31' })]
      const wrapper = mount(LoginSessionsCard)

      const groups = rowsOf(wrapper, 'login-session-group')
      expect(groups).toHaveLength(2)
      expect(groups[0]!.text()).toContain('curl/8.4.0')
      expect(groups[1]!.text()).toContain('python-requests/2.31')
    })

    it('explains why old sign-ins are still listed, once folding is in play', () => {
      sessionsValue = [session(), session()]
      const folded = mount(LoginSessionsCard)
      expect(folded.text()).toContain('clearing cookies without signing out')

      sessionsValue = [session()]
      const single = mount(LoginSessionsCard)
      expect(single.text()).not.toContain('clearing cookies without signing out')
    })
  })

  describe('expanding a client', () => {
    it('reveals one line per sign-in, each revocable', async () => {
      sessionsValue = [session(), session(), session()]
      const wrapper = mount(LoginSessionsCard)

      await rowsOf(wrapper, 'login-session-toggle')[0]!.trigger('click')

      expect(rowsOf(wrapper, 'login-session-child')).toHaveLength(3)
      const childRevokes = rowsOf(wrapper, 'login-session-child').map((row) =>
        row.find('[data-testid="login-session-revoke"]').exists(),
      )
      expect(childRevokes).toEqual([true, true, true])
    })

    it('collapses again', async () => {
      sessionsValue = [session(), session()]
      const wrapper = mount(LoginSessionsCard)

      await rowsOf(wrapper, 'login-session-toggle')[0]!.trigger('click')
      expect(rowsOf(wrapper, 'login-session-child')).toHaveLength(2)

      await rowsOf(wrapper, 'login-session-toggle')[0]!.trigger('click')
      expect(rowsOf(wrapper, 'login-session-child')).toHaveLength(0)
    })

    it('revokes the individual sign-in the user pointed at', async () => {
      const first = session({ id: 'older-one' })
      sessionsValue = [session({ id: 'newest' }), first]
      const wrapper = mount(LoginSessionsCard)

      await rowsOf(wrapper, 'login-session-toggle')[0]!.trigger('click')
      await rowsOf(wrapper, 'login-session-child')[1]!.find('[data-testid="login-session-revoke"]').trigger('click')
      expect(wrapper.find('[data-testid="dialog-root"]').exists()).toBe(true)

      await wrapper.find('[data-testid="login-session-confirm"]').trigger('click')
      await flushPromises()

      expect(mockRevoke).toHaveBeenCalledWith('older-one')
      expect(mockSignOutLocally).not.toHaveBeenCalled()
      wrapper.unmount()
    })
  })

  describe('when the revocation fails', () => {
    it('stays quiet on a 401, which the interceptor has already handled', async () => {
      sessionsValue = [session({ kind: 'PLUGIN', deviceName: 'workstation', userAgent: null })]
      mockRevoke.mockRejectedValue({ statusCode: 401, data: { code: 'AUTH_003' } })
      const wrapper = mount(LoginSessionsCard)

      await wrapper.find('[data-testid="login-session-revoke"]').trigger('click')
      await wrapper.find('[data-testid="login-session-confirm"]').trigger('click')
      await flushPromises()

      // Its message table belongs to the reset-link flow; a toast here would show that copy on
      // top of a redirect that is already under way.
      expect(mockToastError).not.toHaveBeenCalled()
      wrapper.unmount()
    })
  })

  describe("ending a client's sign-ins at once", () => {
    it('offers the batch action only where there is more than one sign-in', () => {
      sessionsValue = [session(), session(), session({ kind: 'PLUGIN', deviceName: 'workstation', userAgent: null })]
      const wrapper = mount(LoginSessionsCard)

      const groups = rowsOf(wrapper, 'login-session-group')
      expect(groups[0]!.find('[data-testid="login-session-bulk"]').exists()).toBe(true)
      expect(groups[1]!.find('[data-testid="login-session-bulk"]').exists()).toBe(false)
    })

    it('ends them in one call and says what was left alone', async () => {
      const first = session({ id: 'a' })
      const second = session({ id: 'b' })
      sessionsValue = [first, second]
      mockRevokeMany.mockResolvedValue({ revoked: 1, skipped: ['b'] })
      const wrapper = mount(LoginSessionsCard)

      await wrapper.find('[data-testid="login-session-bulk"]').trigger('click')
      expect(wrapper.find('[data-testid="login-session-bulk-confirm"]').exists()).toBe(true)

      await wrapper.find('[data-testid="login-session-bulk-confirm"]').trigger('click')
      await flushPromises()

      expect(mockRevokeMany).toHaveBeenCalledTimes(1)
      expect(mockRevokeMany).toHaveBeenCalledWith(['a', 'b'])
      // The skipped id is not called out by name or reason — only the count, which is all the
      // server is willing to say.
      expect(mockToastSuccess).toHaveBeenCalledWith('Sign-ins revoked: 1', {
        description: '1 already inactive',
      })
      wrapper.unmount()
    })

    it('keeps the dialog open while the call is running, so it can say so', async () => {
      sessionsValue = [session(), session()]
      // A call that never settles: the dialog must not vanish and leave the reader with no sign
      // that anything is happening.
      mockRevokeMany.mockReturnValue(new Promise(() => {}))
      const wrapper = mount(LoginSessionsCard)

      await wrapper.find('[data-testid="login-session-bulk"]').trigger('click')
      // What vue-query does the moment the mutation starts; the mock carries that flag itself.
      bulkPendingValue.value = true
      await wrapper.find('[data-testid="login-session-bulk-confirm"]').trigger('click')
      await flushPromises()

      const confirm = wrapper.find('[data-testid="login-session-bulk-confirm"]')
      expect(confirm.exists()).toBe(true)
      expect(confirm.text()).toContain('Revoking…')
      wrapper.unmount()
    })

    it('disables the batch action for exactly as long as the server says', async () => {
      sessionsValue = [session(), session()]
      // A fixed-window limiter reports the counter's remaining lifetime, so the wait is 30s here,
      // not the whole window.
      mockGetRetryAfterSeconds.mockReturnValue(30)
      mockRevokeMany.mockRejectedValue({ statusCode: 429, data: { code: 'RATE_LIMIT_001' } })
      const wrapper = mount(LoginSessionsCard)

      await wrapper.find('[data-testid="login-session-bulk"]').trigger('click')
      await wrapper.find('[data-testid="login-session-bulk-confirm"]').trigger('click')
      await flushPromises()

      expect(mockToastError).toHaveBeenCalledTimes(1)
      const bulk = wrapper.find('[data-testid="login-session-bulk"]')
      expect(bulk.attributes('disabled')).toBeDefined()
      expect(bulk.text()).toContain('Retry in 1 min')
      wrapper.unmount()
    })

    it('falls back to the window length when the refusal carries no hint', async () => {
      sessionsValue = [session(), session()]
      mockGetRetryAfterSeconds.mockReturnValue(null)
      mockRevokeMany.mockRejectedValue({ statusCode: 429, data: { code: 'RATE_LIMIT_001' } })
      const wrapper = mount(LoginSessionsCard)

      await wrapper.find('[data-testid="login-session-bulk"]').trigger('click')
      await wrapper.find('[data-testid="login-session-bulk-confirm"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-testid="login-session-bulk"]').text()).toContain('Retry in 60 min')
      wrapper.unmount()
    })
  })

  describe('revoking the current sign-in', () => {
    it('signs out locally afterwards', async () => {
      sessionsValue = [session({ current: true })]
      const wrapper = mount(LoginSessionsCard)

      await wrapper.find('[data-testid="login-session-revoke"]').trigger('click')
      await wrapper.find('[data-testid="login-session-confirm"]').trigger('click')
      await flushPromises()

      expect(mockRevoke).toHaveBeenCalledTimes(1)
      expect(mockSignOutLocally).toHaveBeenCalledTimes(1)
      wrapper.unmount()
    })
  })
})
