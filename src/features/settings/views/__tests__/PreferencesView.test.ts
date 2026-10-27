import { describe, it, expect, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createPinia } from 'pinia'
import PreferencesView from '../PreferencesView.vue'
import { useThemeStore } from '@/stores/theme'
import { currentLocale, setLocale } from '@/i18n'
import { flushPromises } from '@vue/test-utils'

/**
 * The theme store reads both VueUse primitives; plain refs keep jsdom's
 * storage and the system-preference media query out of the picture. useDark
 * reports "not dark", so `auto` resolves to System (Light) and the assertions
 * cannot accidentally pass on a dark test runner.
 */
vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>()
  return {
    ...actual,
    useDark: vi.fn<(options?: unknown) => unknown>(() => ref(false)),
    useStorage: vi.fn<(key: string, defaultValue: unknown) => unknown>((_key, defaultValue) => ref(defaultValue)),
  }
})

function mountView() {
  // The singleton, not a fresh instance: `setLocale` publishes to the application
  // instance, and a component mounted against another one would keep rendering
  // the old language — exactly what these tests exist to prevent.
  const wrapper = mount(PreferencesView, { global: { plugins: [createPinia()] } })
  const store = useThemeStore()
  return { wrapper, store }
}

const themeRadios = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('input[name="theme"]')

describe('PreferencesView', () => {
  it('renders the three theme modes as one named radio group', () => {
    const { wrapper } = mountView()

    const radios = themeRadios(wrapper)
    expect(radios).toHaveLength(3)
    expect(radios.map((radio) => radio.attributes('value'))).toEqual(['auto', 'light', 'dark'])

    // The group carries a programmatic label: a fieldset with a legend.
    const fieldset = wrapper.find('fieldset')
    expect(fieldset.exists()).toBe(true)
    expect(fieldset.find('legend').text()).toBe('Theme')

    wrapper.unmount()
  })

  it('marks the selected surface of every group, not only the inputs', async () => {
    const { wrapper } = mountView()
    // Each group contributes one label per option: theme (3), language (2), motion (3).
    const states = () => wrapper.findAll('label').map((label) => label.attributes('data-state'))

    expect(states()).toEqual([
      'checked',
      'unchecked',
      'unchecked',
      'checked',
      'unchecked',
      'checked',
      'unchecked',
      'unchecked',
    ])

    await themeRadios(wrapper)[2]!.setValue(true)

    expect(states()).toEqual([
      'unchecked',
      'unchecked',
      'checked',
      'checked',
      'unchecked',
      'checked',
      'unchecked',
      'unchecked',
    ])

    wrapper.unmount()
  })

  it('checks the stored mode and reports the resolved system theme', () => {
    const { wrapper } = mountView()

    expect((themeRadios(wrapper)[0]!.element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.text()).toContain('Current: System (Light)')

    wrapper.unmount()
  })

  it('selecting a mode applies it through the store (the single mutator)', async () => {
    const { wrapper, store } = mountView()

    await themeRadios(wrapper)[2]!.setValue(true)

    expect(store.mode).toBe('dark')
    expect((themeRadios(wrapper)[2]!.element as HTMLInputElement).checked).toBe(true)
    expect((themeRadios(wrapper)[0]!.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.text()).toContain('Current: Dark')

    wrapper.unmount()
  })

  it('returning to System restores the auto mode', async () => {
    const { wrapper, store } = mountView()

    await themeRadios(wrapper)[2]!.setValue(true)
    await themeRadios(wrapper)[0]!.setValue(true)

    expect(store.mode).toBe('auto')
    expect(wrapper.text()).toContain('Current: System (Light)')

    wrapper.unmount()
  })

  it('renders each preference as its own labelled group', () => {
    const { wrapper } = mountView()

    const fieldsets = wrapper.findAll('fieldset')
    expect(fieldsets.map((fieldset) => fieldset.find('legend').text())).toEqual(['Theme', 'Language', 'Motion'])
    expect(wrapper.findAll('input[name="language"]')).toHaveLength(2)
    expect(wrapper.findAll('input[name="motion"]')).toHaveLength(3)

    wrapper.unmount()
  })

  it('writes the motion choice through the motion store and reports what it resolves to', async () => {
    const { wrapper } = mountView()
    const { useMotionStore } = await import('@/stores/motion')
    const motion = useMotionStore()

    // Default is "Follow system"; the mocked media query reports no reduce request.
    expect(motion.preference).toBe('system')
    expect(wrapper.text()).toContain('Current: Full motion')

    await wrapper.findAll('input[name="motion"]')[1]!.setValue(true)

    expect(motion.preference).toBe('reduce')
    expect(document.documentElement.getAttribute('data-motion')).toBe('reduce')
    expect(wrapper.text()).toContain('Current: Reduce motion')

    document.documentElement.removeAttribute('data-motion')
    wrapper.unmount()
  })

  it('switches the interface language through the locale module', async () => {
    const { wrapper } = mountView()

    await wrapper.findAll('input[name="language"]')[1]!.setValue(true)

    // `setLocale` awaits the lazily imported catalogue, so the ref settles on a
    // later task than the change event itself.
    await vi.waitFor(() => expect(currentLocale.value).toBe('zh-CN'))
    await flushPromises()

    expect(document.documentElement.lang).toBe('zh-CN')
    expect(wrapper.text()).toContain('偏好设置')
    expect(wrapper.text()).toContain('简体中文')

    await setLocale('en')
    wrapper.unmount()
  })
})
