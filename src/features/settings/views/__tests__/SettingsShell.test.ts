import { describe, it, expect } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import SettingsShell from '../SettingsShell.vue'

/**
 * The shell owns one navigation entry per settings section and marks exactly
 * the active one. These assertions are behavioural: they mount the real
 * component against a real router, so a link pointing at the wrong name or an
 * aria-current applied to every row fails here rather than in review.
 */
const SECTION_ROUTES = [
  { path: '/settings/profile', name: 'settings-profile' },
  { path: '/settings/devices', name: 'settings-devices' },
  { path: '/settings/preferences', name: 'settings-preferences' },
  { path: '/settings/api-keys', name: 'settings-api-keys' },
]

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: SECTION_ROUTES.map((route) => ({ ...route, component: { template: '<div />' } })),
  })
}

async function mountAt(path: string) {
  const router = createTestRouter()
  await router.push(path)
  await router.isReady()
  const wrapper = mount(SettingsShell, { global: { plugins: [router] } })
  await nextTick()
  return { wrapper, router }
}

const navLinks = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('nav[aria-label="Settings sections"] a')

describe('SettingsShell', () => {
  it('renders one navigation entry per settings section, in IA order', async () => {
    const { wrapper } = await mountAt('/settings/profile')
    const links = navLinks(wrapper)

    expect(links).toHaveLength(4)
    expect(links.map((link) => link.find('span').text())).toEqual(['Profile', 'Devices', 'Preferences', 'API Keys'])
    expect(links.map((link) => link.attributes('href'))).toEqual([
      '/settings/profile',
      '/settings/devices',
      '/settings/preferences',
      '/settings/api-keys',
    ])

    wrapper.unmount()
  })

  it('marks exactly the active section with aria-current', async () => {
    const { wrapper, router } = await mountAt('/settings/devices')

    const currentAtDevices = navLinks(wrapper).filter((link) => link.attributes('aria-current') === 'page')
    expect(currentAtDevices).toHaveLength(1)
    expect(currentAtDevices[0]!.attributes('href')).toBe('/settings/devices')

    await router.push('/settings/api-keys')
    await nextTick()

    const currentAtKeys = navLinks(wrapper).filter((link) => link.attributes('aria-current') === 'page')
    expect(currentAtKeys).toHaveLength(1)
    expect(currentAtKeys[0]!.attributes('href')).toBe('/settings/api-keys')

    wrapper.unmount()
  })

  it('exposes the sub-navigation as a named landmark', async () => {
    const { wrapper } = await mountAt('/settings/profile')

    const nav = wrapper.find('nav[aria-label="Settings sections"]')
    expect(nav.exists()).toBe(true)
    // The rail is a list so assistive tech can announce its length.
    expect(nav.findAll('li')).toHaveLength(4)

    wrapper.unmount()
  })
})
