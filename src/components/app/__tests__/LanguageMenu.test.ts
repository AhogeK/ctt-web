import { describe, it, expect, beforeEach, afterEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LanguageMenu from '../LanguageMenu.vue'
import { currentLocale, initI18n, setLocale } from '@/i18n'

describe('LanguageMenu', () => {
  beforeEach(async () => {
    await initI18n()
    await setLocale('en')
  })

  afterEach(async () => {
    await setLocale('en')
  })

  it('names the active language on the trigger', async () => {
    const wrapper = mount(LanguageMenu)
    expect(wrapper.get('[data-testid="language-current"]').text()).toBe('EN')

    await setLocale('zh-CN')
    await nextTick()
    expect(wrapper.get('[data-testid="language-current"]').text()).toBe('中')
  })

  it('publishes the choice through the same writer the rest of the app uses', async () => {
    await setLocale('zh-CN')
    expect(currentLocale.value).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(localStorage.getItem('ctt.locale')).toBe('zh-CN')
  })
})
