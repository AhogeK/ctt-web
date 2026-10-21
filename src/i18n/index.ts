/**
 * i18n instance, catalogue loading and the locale switcher entry points.
 *
 * Structure:
 * - English is bundled. It is the source language and the fallback, so a
 *   missing key resolves without a network round-trip.
 * - Chinese is a separate chunk, loaded the first time it is needed, so
 *   visitors on the default locale never download it.
 * - `initI18n` resolves the starting locale, loads its catalogue and mirrors it
 *   onto `<html lang>` before the app mounts — the first paint is already in
 *   the right language, with no flash of the wrong one.
 */
import { createI18n } from 'vue-i18n'

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  applyDocumentLang,
  currentLocale,
  detectInitialLocale,
  normalizeLocale,
  persistLocale,
  type AppLocale,
} from './locale'
import en from './locales/en'

export { currentLocale, SUPPORTED_LOCALES } from './locale'
export { LANGUAGE_CODES, LANGUAGE_NAMES } from './locales/language-names'
export type { AppLocale } from './locale'

const loaders: Record<Exclude<AppLocale, 'en'>, () => Promise<{ default: Record<string, unknown> }>> = {
  'zh-CN': () => import('./locales/zh-CN'),
}

/**
 * Build an i18n instance.
 *
 * A factory rather than a bare singleton so tests can mount components against
 * an isolated instance without inheriting another test's locale. The return
 * type is inferred: an explicit `I18n` annotation widens it to the legacy
 * union, where `.global.locale` is `string | WritableComputedRef` and cannot
 * be assigned.
 */
export function createI18nInstance() {
  return createI18n({
    legacy: false,
    // `DEFAULT_LOCALE` alone narrows the inferred locale type to `'en'`, which
    // makes every later switch to another catalogue a type error; the annotation
    // gives the instance the full supported set.
    locale: DEFAULT_LOCALE as AppLocale,
    fallbackLocale: DEFAULT_LOCALE,
    // The Chinese catalogue is a separate chunk (`loadMessages` fills it in on
    // demand). Registering an empty slot here keeps the instance's locale type
    // the full supported set instead of narrowing it to the keys that happen to
    // be bundled at construction time.
    messages: { en, 'zh-CN': {} },
    // Missing/fallback keys resolve to English either way; only development
    // builds warn, so a production console stays clean while a missing
    // translation is still visible to whoever migrates the next batch.
    missingWarn: import.meta.env.DEV,
    fallbackWarn: import.meta.env.DEV,
  })
}

/** The instance type, derived from the factory so both stay in step. */
export type AppI18n = ReturnType<typeof createI18nInstance>

/** The application instance: `main.ts` installs it, `initI18n` completes its locale. */
export const i18n = createI18nInstance()

const loaded = new Set<AppLocale>(['en'])

async function loadMessages(locale: AppLocale, instance: AppI18n): Promise<void> {
  if (loaded.has(locale)) return
  const loader = loaders[locale as Exclude<AppLocale, 'en'>]
  if (!loader) return
  const module = await loader()
  instance.global.setLocaleMessage(locale, module.default)
  loaded.add(locale)
}

/**
 * Resolve the initial locale (stored preference > browser), load its catalogue
 * and mirror it onto the instance, the formatters and `<html lang>`.
 *
 * Async because the Chinese catalogue is a separate chunk; `main.ts` awaits it
 * before mounting, which is what keeps the first frame from flashing English at
 * a visitor whose preference is Chinese.
 */
export async function initI18n(): Promise<void> {
  const locale = detectInitialLocale()
  await loadMessages(locale, i18n)
  i18n.global.locale.value = locale
  currentLocale.value = locale
  applyDocumentLang(locale)
}

/**
 * Switch the interface language: load the catalogue, publish the locale to the
 * instance, the formatters and `<html lang>`, then persist the choice.
 *
 * Accepts any tag — callers hand it DOM values (radio values, storage events),
 * and `normalizeLocale` is what narrows them onto the shipped catalogues.
 */
export async function setLocale(locale: string): Promise<void> {
  const normalized = normalizeLocale(locale)
  await loadMessages(normalized, i18n)
  i18n.global.locale.value = normalized
  currentLocale.value = normalized
  applyDocumentLang(normalized)
  persistLocale(normalized)
}

/**
 * Follow a language chosen in another tab.
 *
 * `storage` events fire only in *other* documents, so this cannot echo the
 * change back into the tab that made it.
 */
export function syncLocaleAcrossTabs(): void {
  globalThis.addEventListener?.('storage', (event) => {
    if (event.key !== LOCALE_STORAGE_KEY || !event.newValue) return
    void setLocale(event.newValue)
  })
}
