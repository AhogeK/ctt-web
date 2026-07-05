import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AppHeader from '../AppHeader.vue'

/**
 * Mock the auth store at module level. Both AppHeader and UserAvatar call
 * useAuthStore(), so a single module mock covers both consumers without
 * having to wire up the real Pinia store (which transitively imports the
 * router, useStorage, and the auth API client).
 *
 * displayName and email are exposed as nullable refs so individual tests
 * can drive the AppHeader dropdown label / tooltip behavior across:
 * - profile not yet loaded (both null) → "User" fallback
 * - profile loaded (displayName set, email possibly empty) → real name shown
 */
const mockUserId = ref<string | null>('test-user-id')
const mockDisplayName = ref<string | null>(null)
const mockEmail = ref<string | null>(null)
const mockLogout = vi.fn<() => Promise<void>>(() => Promise.resolve())

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    get userId() {
      return mockUserId.value
    },
    get displayName() {
      return mockDisplayName.value
    },
    get email() {
      return mockEmail.value
    },
    logout: mockLogout,
  }),
}))

vi.mock('@lucide/vue', () => ({
  Sun: { name: 'Sun', template: '<svg data-testid="icon-sun" />' },
  Moon: { name: 'Moon', template: '<svg data-testid="icon-moon" />' },
  Monitor: { name: 'Monitor', template: '<svg data-testid="icon-monitor" />' },
}))

// Defensive stub: AppHeader itself does not import vue-router, but Reka UI
// (used by the Tooltip / DropdownMenu wrappers) may transitively touch it.
// Stubbing keeps the mount isolated from the real router instance.
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn<(...args: unknown[]) => unknown>() }),
  useRoute: () => ({ query: {} }),
  RouterLink: { template: '<a><slot /></a>' },
}))

/**
 * Build a mount wrapper for AppHeader.
 *
 * - Slot-bearing wrappers (Tooltip*, DropdownMenu*, DropdownMenuTrigger)
 *   keep their slots so the UserAvatar stub inside the trigger renders
 *   with data-testid="user-avatar".
 * - DropdownMenuLabel and TooltipContent render their slots so tests can
 *   assert on the displayed displayName / email / tooltip copy.
 * - DropdownMenuContent keeps a portal-like default (slot-free, mirror of
 *   the closed-state) since the test only inspects the label markup.
 * - DropdownMenuItem is slot-free; the "no old-style Logout button" test
 *   asserts that no top-level header button claims "logout".
 */
const mountAppHeader = () =>
  mount(AppHeader, {
    global: {
      stubs: {
        Tooltip: { template: '<div><slot /></div>' },
        TooltipProvider: { template: '<div><slot /></div>' },
        TooltipTrigger: { props: ['asChild'], template: '<div><slot /></div>' },
        TooltipContent: { template: '<span data-testid="tooltip-content"><slot /></span>' },
        DropdownMenu: { template: '<div><slot /></div>' },
        DropdownMenuTrigger: {
          props: ['asChild'],
          template: '<button data-testid="user-menu-trigger"><slot /></button>',
        },
        DropdownMenuContent: {
          props: ['align'],
          template: '<div data-testid="dropdown-content"><slot /></div>',
        },
        DropdownMenuItem: { props: ['disabled'], template: '<button />' },
        DropdownMenuLabel: { template: '<div data-testid="dropdown-label"><slot /></div>' },
        DropdownMenuSeparator: { template: '<hr />' },
        UserAvatar: { template: '<div data-testid="user-avatar" />' },
      },
    },
  })

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserId.value = 'test-user-id'
    mockDisplayName.value = null
    mockEmail.value = null
  })

  it('renders UserAvatar in the right side', () => {
    const wrapper = mountAppHeader()

    const avatar = wrapper.find('[data-testid="user-avatar"]')
    expect(avatar.exists()).toBe(true)

    wrapper.unmount()
  })

  it('does NOT render an old-style Logout button in the header', () => {
    const wrapper = mountAppHeader()

    // After the refactor, the Logout action moved into a DropdownMenu item.
    // The dropdown content is stubbed slot-free (mimicking the closed-state
    // portal) so the header markup in the default render must not expose a
    // top-level "logout" button to the user.
    const logoutButton = wrapper.findAll('button').find((b) => b.text().toLowerCase().includes('logout'))
    expect(logoutButton).toBeUndefined()

    wrapper.unmount()
  })

  it('falls back to "User" in the dropdown label when displayName is null', () => {
    mockUserId.value = 'test-user-id'
    mockDisplayName.value = null
    mockEmail.value = null

    const wrapper = mountAppHeader()

    const label = wrapper.find('[data-testid="dropdown-label"]')
    expect(label.exists()).toBe(true)
    expect(label.text()).toContain('User')
    expect(label.text()).not.toContain('@')

    wrapper.unmount()
  })

  it('renders displayName and email inside the dropdown label when both are set', () => {
    mockUserId.value = 'test-user-id'
    mockDisplayName.value = 'Alice'
    mockEmail.value = 'alice@example.com'

    const wrapper = mountAppHeader()

    const label = wrapper.find('[data-testid="dropdown-label"]')
    expect(label.exists()).toBe(true)
    expect(label.text()).toContain('Alice')
    expect(label.text()).toContain('alice@example.com')

    wrapper.unmount()
  })

  it('uses displayName for the avatar tooltip text', () => {
    mockUserId.value = 'test-user-id'
    mockDisplayName.value = 'Alice'

    const wrapper = mountAppHeader()

    const tooltip = wrapper.find('[data-testid="tooltip-content"]')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toBe('Alice')

    wrapper.unmount()
  })

  it('hides tooltip when displayName is null (no redundant "User" tooltip)', () => {
    mockUserId.value = 'test-user-id'
    mockDisplayName.value = null

    const wrapper = mountAppHeader()

    const tooltip = wrapper.find('[data-testid="tooltip-content"]')
    expect(tooltip.exists()).toBe(false)

    wrapper.unmount()
  })
})
