import { describe, it, expect, beforeEach, afterEach } from 'vite-plus/test'

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  applyDocumentLang,
  currentLocale,
  detectInitialLocale,
  normalizeLocale,
  storedLocale,
  persistLocale,
} from '../locale'
import { i18n, initI18n, setLocale, syncLocaleAcrossTabs } from '../index'

/** Point the browser language list at the given tags (jsdom's navigator is read-only). */
function stubBrowserLanguages(languages: string[]): void {
  Object.defineProperty(globalThis.navigator, 'languages', { value: languages, configurable: true })
}

beforeEach(() => {
  localStorage.clear()
  currentLocale.value = DEFAULT_LOCALE
  document.documentElement.setAttribute('lang', 'en')
})

afterEach(async () => {
  await setLocale('en')
})

describe('locale resolution', () => {
  it('collapses every Chinese variant onto the catalogue we ship', () => {
    expect(normalizeLocale('zh')).toBe('zh-CN')
    expect(normalizeLocale('zh-CN')).toBe('zh-CN')
    expect(normalizeLocale('zh-TW')).toBe('zh-CN')
    expect(normalizeLocale('zh-Hans')).toBe('zh-CN')
  })

  it('keeps English and falls back to the source language for anything else', () => {
    expect(normalizeLocale('en-US')).toBe('en')
    expect(normalizeLocale('fr-FR')).toBe('en')
    expect(normalizeLocale('')).toBe('en')
    expect(normalizeLocale(null)).toBe('en')
  })

  it('round-trips an explicit choice through storage', () => {
    expect(storedLocale()).toBeNull()
    persistLocale('zh-CN')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('zh-CN')
    expect(storedLocale()).toBe('zh-CN')
  })

  it('normalizes an unsupported stored value instead of trusting it', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'xx-YY')
    expect(storedLocale()).toBe('en')
  })

  it('prefers the stored choice over the browser languages', () => {
    stubBrowserLanguages(['zh-CN', 'en-US'])
    persistLocale('en')
    expect(detectInitialLocale()).toBe('en')
  })

  it('follows the browser when nothing is stored', () => {
    stubBrowserLanguages(['zh-CN', 'en-US'])
    expect(detectInitialLocale()).toBe('zh-CN')

    stubBrowserLanguages(['fr-FR', 'en-GB'])
    expect(detectInitialLocale()).toBe('en')
  })

  it('mirrors the locale onto <html lang>', () => {
    applyDocumentLang('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
  })
})

describe('locale switching', () => {
  it('loads the Chinese catalogue, persists the choice and updates the document', async () => {
    await setLocale('zh-CN')

    expect(currentLocale.value).toBe('zh-CN')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
    // Proves the lazily imported chunk actually reached the instance.
    expect(i18n.global.t('nav.dashboard')).toBe('统计看板')
  })

  it('switches back to English', async () => {
    await setLocale('zh-CN')
    await setLocale('en')

    expect(currentLocale.value).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(i18n.global.t('nav.dashboard')).toBe('Dashboard')
  })

  it('resolves an unsupported tag to the default instead of failing', async () => {
    await setLocale('de-DE')
    expect(currentLocale.value).toBe('en')
  })

  it('init resolves the stored preference before the app mounts', async () => {
    persistLocale('zh-CN')
    await initI18n()

    expect(currentLocale.value).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(i18n.global.t('nav.settings')).toBe('设置')
  })

  it('follows a language chosen in another tab', async () => {
    syncLocaleAcrossTabs()

    globalThis.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: 'zh-CN' }))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(currentLocale.value).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
  })

  it('ignores storage events for unrelated keys', async () => {
    syncLocaleAcrossTabs()

    globalThis.dispatchEvent(new StorageEvent('storage', { key: 'theme-appearance', newValue: 'zh-CN' }))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(currentLocale.value).toBe('en')
  })
})
