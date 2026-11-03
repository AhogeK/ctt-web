import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import SecurityView from '../SecurityView.vue'

const freshness = vi.hoisted(() => ({ isKnown: true, isFresh: true }))
const mockSignOutLocally = vi.hoisted(() => vi.fn<() => void>())
const mockReplace = vi.hoisted(() => vi.fn<() => void>())

// Keep the real exports: the stubbed cards are still imported, and some of them reach for router
// helpers this test does not care about.
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ replace: mockReplace }),
}))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ signOutLocally: mockSignOutLocally }) }))
vi.mock('@/router/route-names', () => ({ RouteNames: { LOGIN: 'login' } }))
vi.mock('../../composables/useRecentAuthentication', () => ({
  useRecentAuthentication: () => ({
    isKnown: ref(freshness.isKnown),
    isFresh: ref(freshness.isFresh),
  }),
}))

function mountView() {
  return mount(SecurityView, {
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

  it('clears the session so the next sign-in is recent enough', async () => {
    freshness.isFresh = false
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
