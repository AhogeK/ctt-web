/**
 * Locale state shared by the i18n instance, the formatters and the switchers.
 *
 * Deliberately free of vue-i18n imports: the formatters in `lib/utils` read the
 * active locale without depending on the message catalogue, so there is no
 * import cycle between the i18n instance and the formatting layer.
 */
import { ref } from 'vue'

export const SUPPORTED_LOCALES = ['en', 'zh-CN'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'en'

/** localStorage key — the same preference model the theme store uses (`theme-appearance`). */
export const LOCALE_STORAGE_KEY = 'ctt.locale'

/**
 * The active locale, mirrored from the i18n instance.
 *
 * Formatters read this ref, so switching languages re-renders every formatted
 * date without threading a locale argument through each call site.
 */
export const currentLocale = ref<AppLocale>(DEFAULT_LOCALE)

/**
 * Narrow an arbitrary language tag to a supported locale.
 *
 * Region variants collapse onto the catalogue we ship: `zh-TW`, `zh-Hans` and
 * `zh` all resolve to `zh-CN`. Anything outside the supported set falls back to
 * the source language rather than leaving the interface in a mixed state.
 */
export function normalizeLocale(tag: string | null | undefined): AppLocale {
  const value = (tag ?? '').trim().toLowerCase()
  if (value.startsWith('zh')) return 'zh-CN'
  if (value.startsWith('en')) return 'en'
  return DEFAULT_LOCALE
}

/** The stored preference, or null when the visitor has never chosen a language. */
export function storedLocale(): AppLocale | null {
  try {
    const raw = globalThis.localStorage.getItem(LOCALE_STORAGE_KEY)
    return raw ? normalizeLocale(raw) : null
  } catch {
    // Storage can be unavailable (private mode, blocked cookies): no preference.
    return null
  }
}

/**
 * Resolve the locale to start with: stored preference first, then the browser's
 * language list, then English.
 *
 * A stored value always wins — the switcher is an explicit choice, while the
 * browser list is a guess the visitor must be able to override.
 */
export function detectInitialLocale(): AppLocale {
  const stored = storedLocale()
  if (stored) return stored

  const languages = globalThis.navigator?.languages ?? []
  for (const language of languages) {
    const value = language.toLowerCase()
    if (value.startsWith('zh')) return 'zh-CN'
    if (value.startsWith('en')) return 'en'
  }
  return normalizeLocale(globalThis.navigator?.language)
}

/** Persist an explicit choice. A storage failure must not block the switch itself. */
export function persistLocale(locale: AppLocale): void {
  try {
    globalThis.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // In-memory locale still applies for this visit.
  }
}

/**
 * Mirror the locale onto `<html lang>`.
 *
 * Assistive technology and the browser's own language-dependent behaviour
 * (hyphenation, spellcheck, some screen readers' pronunciation) read this
 * attribute, not the vue-i18n instance.
 */
export function applyDocumentLang(locale: AppLocale): void {
  globalThis.document?.documentElement?.setAttribute('lang', locale)
}
