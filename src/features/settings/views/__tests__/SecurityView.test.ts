import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import SecurityView from '../SecurityView.vue'
import { mountWithQuery } from '@/test/mount-with-query'

const freshness = vi.hoisted(() => ({ isKnown: true, isFresh: true }))
const mockSignOutLocally = vi.hoisted(() => vi.fn<() => void>())
const mockRevokeSession = vi.hoisted(() => vi.fn<(id: string) => Promise<void>>())
const mockSessions = vi.hoisted(() => ({
  value: [{ id: 'session-1', current: true }] as Array<{ id: string; current: boolean }>,
}))
const mockReplace = vi.hoisted(() => vi.fn<() => void>())

// Keep the real exports: the stubbed cards are still imported, and some of them reach for router
// helpers this test does not care about.
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ replace: mockReplace }),
}))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ signOutLocally: mockSignOutLocally }) }))
vi.mock('@/router/route-names', () => ({ RouteNames: { LOGIN: 'login' } }))
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  revokeLoginSession: mockRevokeSession,
}))
vi.mock('../../composables/useLoginSessions', () => ({
  useLoginSessions: () => ({ sessions: ref(mockSessions.value), isPending: ref(false), isError: ref(false) }),
}))
vi.mock('../../composables/useRecentAuthentication', () => ({
  useRecentAuthentication: () => ({
    isKnown: ref(freshness.isKnown),
    isFresh: ref(freshness.isFresh),
  }),
}))

function mountView() {
  return mountWithQuery(SecurityView, {
    global: {
      stubs: {
        TwoFactorCard: true,
        PasskeyCard: true,
        LoginSessionsCard: true,
        DataExportCard: true,
      },
    },
  })
}

describe('SecurityView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    freshness.isKnown = true
    freshness.isFresh = true
  })

  it('says nothing while the session is fresh enough to change sign-in methods', () => {
    const wrapper = mountView()

    expect(wrapper.find('[data-testid="security-needs-reauth"]').exists()).toBe(false)
  })

  it('says it once for the whole page when the session is too old', () => {
    freshness.isFresh = false
    const wrapper = mountView()

    // One sentence above the cards: each card used to repeat it in its own words.
    expect(wrapper.findAll('[data-testid="security-needs-reauth"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('recent sign-in')
  })

  it('ends this session on the server, not only in the browser', async () => {
    freshness.isFresh = false
    mockRevokeSession.mockResolvedValue(undefined)
    const wrapper = mountView()

    await wrapper.get('[data-testid="security-sign-in-again"]').trigger('click')

    // A browser-only clear would leave a refresh token that keeps working.
    expect(mockRevokeSession).toHaveBeenCalledWith('session-1')
    expect(mockSignOutLocally).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith({ name: 'login', query: { redirect: '/settings/security' } })
  })

  it('still signs out locally when the server refuses to end the session', async () => {
    freshness.isFresh = false
    mockRevokeSession.mockRejectedValue(new Error('offline'))
    const wrapper = mountView()

    await wrapper.get('[data-testid="security-sign-in-again"]').trigger('click')

    expect(mockSignOutLocally).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith({ name: 'login', query: { redirect: '/settings/security' } })
  })

  it('waits for the answer instead of guessing while the status is unknown', () => {
    freshness.isKnown = false
    freshness.isFresh = false
    const wrapper = mountView()

    // A flash of "sign in again" before the status arrives would be worse than saying nothing.
    expect(wrapper.find('[data-testid="security-needs-reauth"]').exists()).toBe(false)
  })
})
