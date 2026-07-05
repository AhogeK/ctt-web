import { describe, it, expect, vi, beforeEach, afterEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createTestingPinia } from '@pinia/testing'
import AppSidebar from '../AppSidebar.vue'

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>()
  return {
    ...actual,
    useStorage: vi.fn<(key: string, defaultValue: unknown) => unknown>((_key, defaultValue) => defaultValue),
    useLocalStorage: vi.fn<(key: string, defaultValue: unknown) => unknown>((_key, defaultValue) => defaultValue),
  }
})

vi.mock('@/components/ui/sidebar', () => ({
  Sidebar: { name: 'Sidebar', template: '<div data-slot="sidebar"><slot /></div>' },
  SidebarContent: { name: 'SidebarContent', template: '<div data-slot="sidebar-content"><slot /></div>' },
  SidebarHeader: { name: 'SidebarHeader', template: '<div data-slot="sidebar-header"><slot /></div>' },
  SidebarFooter: { name: 'SidebarFooter', template: '<div data-slot="sidebar-footer"><slot /></div>' },
  SidebarMenu: { name: 'SidebarMenu', template: '<ul data-slot="sidebar-menu"><slot /></ul>' },
  SidebarMenuButton: {
    name: 'SidebarMenuButton',
    props: ['asChild', 'size'],
    template: '<li data-slot="sidebar-menu-button"><slot /></li>',
  },
  SidebarMenuItem: { name: 'SidebarMenuItem', template: '<li data-slot="sidebar-menu-item"><slot /></li>' },
  SidebarGroup: { name: 'SidebarGroup', template: '<div data-slot="sidebar-group"><slot /></div>' },
  SidebarGroupLabel: { name: 'SidebarGroupLabel', template: '<span data-slot="sidebar-group-label"><slot /></span>' },
  SidebarGroupContent: {
    name: 'SidebarGroupContent',
    template: '<div data-slot="sidebar-group-content"><slot /></div>',
  },
  useSidebar: () => ({
    state: ref('expanded'),
    open: ref(true),
    openMobile: ref(false),
    isMobile: ref(false),
    toggleSidebar: vi.fn<() => void>(),
    setOpen: vi.fn<() => void>(),
    setOpenMobile: vi.fn<() => void>(),
  }),
  SidebarTrigger: { name: 'SidebarTrigger', template: '<button data-slot="sidebar-trigger" />' },
}))

vi.mock('@lucide/vue', () => ({
  LayoutDashboard: { name: 'LayoutDashboard', template: '<span data-icon="layout-dashboard" />' },
  Settings: { name: 'Settings', template: '<span data-icon="settings" />' },
  Monitor: { name: 'Monitor', template: '<span data-icon="monitor" />' },
  User: { name: 'User', template: '<span data-icon="user" />' },
}))

const createTestRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/devices', name: 'devices', component: { template: '<div>Devices</div>' } },
      { path: '/settings/profile', name: 'settings-profile', component: { template: '<div>Settings</div>' } },
    ],
  })
}

const createWrapper = () => {
  const router = createTestRouter()

  const wrapper = mount(AppSidebar, {
    global: {
      plugins: [router, createTestingPinia({ createSpy: vi.fn })],
      stubs: {
        RouterLink: false,
      },
    },
  })

  return { wrapper, router }
}

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('mounting', () => {
    it('mounts successfully without errors', () => {
      const { wrapper } = createWrapper()

      expect(wrapper.exists()).toBe(true)

      wrapper.unmount()
    })
  })

  describe('navigation links', () => {
    it('renders navigation links', () => {
      const { wrapper } = createWrapper()

      const dashboardLink = wrapper.find('a[href="/dashboard"]')
      expect(dashboardLink.exists()).toBe(true)
      expect(dashboardLink.text()).toContain('Dashboard')

      const devicesLink = wrapper.find('a[href="/devices"]')
      expect(devicesLink.exists()).toBe(true)
      expect(devicesLink.text()).toContain('Devices')

      const settingsLink = wrapper.find('a[href="/settings/profile"]')
      expect(settingsLink.exists()).toBe(true)
      expect(settingsLink.text()).toContain('Profile')

      wrapper.unmount()
    })
  })

  describe('sidebar structure', () => {
    it('renders header branding with PluginIcon', () => {
      const { wrapper } = createWrapper()

      const sidebarHeader = wrapper.find('[data-slot="sidebar-header"]')
      expect(sidebarHeader.exists()).toBe(true)
      // v0.10.4 replaced brand text with PluginIcon component
      const pluginIcon = sidebarHeader.find('[role="img"][aria-label="Code Time Tracker"]')
      expect(pluginIcon.exists()).toBe(true)

      wrapper.unmount()
    })

    it('renders sidebar content', () => {
      const { wrapper } = createWrapper()

      const sidebarContent = wrapper.find('[data-slot="sidebar-content"]')
      expect(sidebarContent.exists()).toBe(true)

      wrapper.unmount()
    })

    it('renders copyright line in sidebar footer', () => {
      const { wrapper } = createWrapper()

      const sidebarFooter = wrapper.find('[data-slot="sidebar-footer"]')
      expect(sidebarFooter.exists()).toBe(true)
      expect(sidebarFooter.text()).toContain('© 2026 AhogeK')

      wrapper.unmount()
    })

    it('does not render a Logout button (removed in v0.8.42 UI cleanup)', () => {
      const { wrapper } = createWrapper()
      expect(wrapper.text()).not.toContain('Logout')
      wrapper.unmount()
    })
  })
})
