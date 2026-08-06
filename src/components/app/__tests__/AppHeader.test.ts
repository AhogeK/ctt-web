import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AppHeader from '../AppHeader.vue'
import { RouteNames } from '@/router/route-names'

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

/**
 * Mock the theme store at module level. AppHeader reads `mode` and `isDark`
 * for the Appearance submenu trigger label and the radio group's checked
 * item, then calls `setTheme` on user selection.
 *
 * Both `mode` and `isDark` are exposed as refs so individual tests can drive
 * either input without spinning up Pinia (which transitively pulls in
 * @vueuse/core's localStorage / matchMedia bindings).
 */
const mockThemeMode = ref<'light' | 'dark' | 'auto'>('auto')
const mockIsDark = ref<boolean>(false)
const mockSetTheme = vi.fn<(mode: 'light' | 'dark' | 'auto') => void>()

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({
    get mode() {
      return mockThemeMode.value
    },
    get isDark() {
      return mockIsDark.value
    },
    setTheme: mockSetTheme,
  }),
}))

/**
 * Mock the sidebar module at module level. AppHeader calls useSidebar()
 * to get isMobile for conditional SidebarTrigger rendering.
 */
vi.mock('@/components/ui/sidebar', () => ({
  useSidebar: () => ({
    state: ref('expanded'),
    open: ref(true),
    openMobile: ref(false),
    isMobile: ref(false),
    toggleSidebar: vi.fn<() => void>(),
    setOpen: vi.fn<() => void>(),
    setOpenMobile: vi.fn<() => void>(),
  }),
  SidebarTrigger: { name: 'SidebarTrigger', template: '<button data-testid="sidebar-trigger" />' },
}))

vi.mock('@lucide/vue', () => ({
  Sun: { name: 'Sun', template: '<svg data-testid="icon-sun" />' },
  Moon: { name: 'Moon', template: '<svg data-testid="icon-moon" />' },
  Monitor: { name: 'Monitor', template: '<svg data-testid="icon-monitor" />' },
  Settings: { name: 'Settings', template: '<svg data-testid="icon-settings" />' },
  LogOut: { name: 'LogOut', template: '<svg data-testid="icon-logout" />' },
  Loader2: { name: 'Loader2', template: '<svg data-testid="icon-loader" />' },
}))

const mockRouterPush = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
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
type StubOverrides = Record<string, unknown>

const mountAppHeader = (overrides: { stubs?: StubOverrides } = {}) =>
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
        DropdownMenuSub: { template: '<div data-testid="dropdown-sub"><slot /></div>' },
        DropdownMenuSubTrigger: { template: '<div data-testid="dropdown-sub-trigger"><slot /></div>' },
        DropdownMenuSubContent: { template: '<div data-testid="dropdown-sub-content"><slot /></div>' },
        DropdownMenuRadioGroup: {
          props: ['modelValue'],
          template: '<div data-testid="dropdown-radio-group" :data-value="modelValue"><slot /></div>',
        },
        DropdownMenuRadioItem: {
          props: ['value'],
          template: '<div data-testid="dropdown-radio-item" :data-value="value"><slot /></div>',
        },
        UserAvatar: { template: '<div data-testid="user-avatar" />' },
        ...overrides.stubs,
      },
    },
  })

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserId.value = 'test-user-id'
    mockDisplayName.value = null
    mockEmail.value = null
    mockThemeMode.value = 'auto'
    mockIsDark.value = false
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

  it('renders the Appearance submenu trigger in the avatar dropdown', () => {
    const wrapper = mountAppHeader()

    const trigger = wrapper.find('[data-testid="dropdown-sub-trigger"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.text()).toContain('Appearance')

    // Default theme is 'auto' + isDark=false, so the trigger should show
    // the Monitor icon and the "System (Light)" current-state label on
    // the right side (Perplexity-style: visible without opening the submenu).
    expect(trigger.find('[data-testid="icon-monitor"]').exists()).toBe(true)
    expect(trigger.find('[data-testid="appearance-current"]').text()).toBe('System (Light)')

    wrapper.unmount()
  })

  it('renders Light/Dark/System radio items inside the Appearance submenu', () => {
    const wrapper = mountAppHeader()

    const items = wrapper.findAll('[data-testid="dropdown-radio-item"]')
    const values = items.map((el) => el.attributes('data-value')).sort((a, b) => String(a).localeCompare(String(b)))
    expect(values).toEqual(['auto', 'dark', 'light'])

    const subContent = wrapper.find('[data-testid="dropdown-sub-content"]')
    expect(subContent.text()).toContain('Light')
    expect(subContent.text()).toContain('Dark')
    expect(subContent.text()).toContain('System')

    expect(subContent.find('[data-testid="icon-sun"]').exists()).toBe(true)
    expect(subContent.find('[data-testid="icon-moon"]').exists()).toBe(true)
    expect(subContent.find('[data-testid="icon-monitor"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('binds the Appearance radio group to the current theme mode', () => {
    mockThemeMode.value = 'dark'
    const wrapper = mountAppHeader()

    const radioGroup = wrapper.find('[data-testid="dropdown-radio-group"]')
    expect(radioGroup.attributes('data-value')).toBe('dark')

    const trigger = wrapper.find('[data-testid="dropdown-sub-trigger"]')
    expect(trigger.find('[data-testid="icon-moon"]').exists()).toBe(true)
    // mode='dark' (explicit) → label is just "Dark", no parenthetical
    expect(trigger.find('[data-testid="appearance-current"]').text()).toBe('Dark')

    wrapper.unmount()
  })

  it('shows "System (Dark)" on the Appearance trigger when mode=auto + system prefers dark', () => {
    mockThemeMode.value = 'auto'
    mockIsDark.value = true
    const wrapper = mountAppHeader()

    const trigger = wrapper.find('[data-testid="dropdown-sub-trigger"]')
    expect(trigger.find('[data-testid="icon-monitor"]').exists()).toBe(true)
    expect(trigger.find('[data-testid="appearance-current"]').text()).toBe('System (Dark)')

    wrapper.unmount()
  })

  it('shows "Light" on the Appearance trigger when mode=light is explicitly selected', () => {
    mockThemeMode.value = 'light'
    const wrapper = mountAppHeader()

    const trigger = wrapper.find('[data-testid="dropdown-sub-trigger"]')
    expect(trigger.find('[data-testid="icon-sun"]').exists()).toBe(true)
    expect(trigger.find('[data-testid="appearance-current"]').text()).toBe('Light')

    wrapper.unmount()
  })

  it('renders a Settings item in the avatar dropdown', () => {
    const wrapper = mountAppHeader({
      stubs: {
        DropdownMenuItem: {
          props: ['disabled'],
          template: '<button data-testid="dropdown-menu-item"><slot /></button>',
        },
      },
    })

    const items = wrapper.findAll('[data-testid="dropdown-menu-item"]')
    const settingsItem = items.find((el) => el.text().includes('Settings'))
    expect(settingsItem).toBeDefined()
    expect(settingsItem!.find('[data-testid="icon-settings"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('navigates to the API keys settings route when the Settings item is selected', async () => {
    const wrapper = mountAppHeader({
      stubs: {
        DropdownMenuItem: {
          props: ['disabled'],
          template: '<button data-testid="dropdown-menu-item" @click="$emit(\'select\', $event)"><slot /></button>',
        },
      },
    })

    const settingsItem = wrapper
      .findAll('[data-testid="dropdown-menu-item"]')
      .find((el) => el.text().includes('Settings'))
    expect(settingsItem).toBeDefined()

    await settingsItem!.trigger('click')

    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    expect(mockRouterPush).toHaveBeenCalledWith({ name: RouteNames.SETTINGS_API_KEYS })

    wrapper.unmount()
  })
})
