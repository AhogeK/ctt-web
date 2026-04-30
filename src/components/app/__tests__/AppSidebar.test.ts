import { describe, it, expect, vi, beforeEach, afterEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createTestingPinia } from '@pinia/testing'
import { h, type VNode } from 'vue'
import AppSidebar from '../AppSidebar.vue'

const mockLogout = vi.fn<() => Promise<void>>()
const mockAuthStore = { logout: mockLogout }

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<() => typeof mockAuthStore>(() => mockAuthStore),
}))

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
}))

vi.mock('@/components/ui/button', () => ({
  Button: {
    name: 'Button',
    props: ['variant', 'disabled'],
    render(this: {
      disabled: boolean
      $slots: Record<string, unknown>
      $attrs: Record<string, unknown>
      $emit: (event: string, ...args: unknown[]) => void
    }): VNode {
      const { onClick: _onClick, ...restAttrs } = this.$attrs
      return h(
        'button',
        {
          ...restAttrs,
          ...(this.disabled ? { disabled: true } : {}),
          'data-slot': 'button',
          onClick: (event: Event) => {
            this.$emit('click', event)
          },
        },
        (this.$slots as Record<string, () => VNode>).default?.(),
      )
    },
  },
}))

vi.mock('lucide-vue-next', () => ({
  LayoutDashboard: { name: 'LayoutDashboard', template: '<span data-icon="layout-dashboard" />' },
  Settings: { name: 'Settings', template: '<span data-icon="settings" />' },
  Monitor: { name: 'Monitor', template: '<span data-icon="monitor" />' },
  LogOut: { name: 'LogOut', template: '<span data-icon="logout" />' },
  Loader2: { name: 'Loader2', template: '<span data-icon="loader2" />' },
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
    mockLogout.mockReset()
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

  describe('logout button', () => {
    it('renders logout button with correct text', () => {
      const { wrapper } = createWrapper()

      const button = wrapper.find('button[data-slot="button"]')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Logout')

      wrapper.unmount()
    })

    it('button is not disabled by default', () => {
      const { wrapper } = createWrapper()

      const button = wrapper.find('button[data-slot="button"]')
      expect(button.attributes('disabled')).toBeUndefined()

      wrapper.unmount()
    })

    it('LogOut icon visible', () => {
      const { wrapper } = createWrapper()

      const logOutIcon = wrapper.find('[data-icon="logout"]')
      expect(logOutIcon.exists()).toBe(true)

      wrapper.unmount()
    })

    it('clicking calls authStore.logout()', async () => {
      const { wrapper } = createWrapper()

      const button = wrapper.find('button[data-slot="button"]')
      await button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockLogout).toHaveBeenCalled()

      wrapper.unmount()
    })

    it('shows loading state during logout', async () => {
      let resolveLogout: () => void = () => {}
      const logoutPromise = new Promise<void>((resolve) => {
        resolveLogout = resolve
      })
      mockLogout.mockReturnValue(logoutPromise)

      const { wrapper } = createWrapper()
      const button = wrapper.find('button[data-slot="button"]')

      await button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(button.attributes('disabled')).toBeDefined()
      expect(wrapper.find('[data-icon="loader2"]').exists()).toBe(true)
      expect(wrapper.find('[data-icon="logout"]').exists()).toBe(false)
      expect(button.text()).toContain('Logging out...')

      resolveLogout()
      await vi.waitFor(() => {
        expect(button.attributes('disabled')).toBeUndefined()
      })

      expect(wrapper.find('[data-icon="loader2"]').exists()).toBe(false)
      expect(wrapper.find('[data-icon="logout"]').exists()).toBe(true)
      expect(button.text()).toContain('Logout')

      wrapper.unmount()
    })

    it('resets loading state after logout fails', async () => {
      mockLogout.mockImplementation(() => Promise.reject(new Error('Network error')).catch(() => {}))

      const { wrapper } = createWrapper()
      const button = wrapper.find('button[data-slot="button"]')

      await button.trigger('click')

      await vi.waitFor(() => {
        expect(button.attributes('disabled')).toBeUndefined()
      })

      expect(wrapper.find('[data-icon="loader2"]').exists()).toBe(false)
      expect(wrapper.find('[data-icon="logout"]').exists()).toBe(true)
      expect(button.text()).toContain('Logout')

      wrapper.unmount()
    })

    it('prevents double-click during logout', async () => {
      let resolveLogout: () => void = () => {}
      const logoutPromise = new Promise<void>((resolve) => {
        resolveLogout = resolve
      })
      mockLogout.mockReturnValue(logoutPromise)

      const { wrapper } = createWrapper()
      const button = wrapper.find('button[data-slot="button"]')

      await button.trigger('click')
      await wrapper.vm.$nextTick()

      await button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockLogout).toHaveBeenCalledTimes(1)

      resolveLogout()
      await vi.waitFor(() => {
        expect(button.attributes('disabled')).toBeUndefined()
      })

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
    it('renders header branding', () => {
      const { wrapper } = createWrapper()

      const sidebarHeader = wrapper.find('[data-slot="sidebar-header"]')
      expect(sidebarHeader.exists()).toBe(true)
      expect(sidebarHeader.text()).toContain('CTT')

      wrapper.unmount()
    })

    it('renders sidebar content', () => {
      const { wrapper } = createWrapper()

      const sidebarContent = wrapper.find('[data-slot="sidebar-content"]')
      expect(sidebarContent.exists()).toBe(true)

      wrapper.unmount()
    })
  })
})
