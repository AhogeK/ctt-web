import type { AppLocale } from '../locale'

/**
 * Each locale's own name, as its speakers write it.
 *
 * Language pickers name languages natively in both catalogues — a Chinese reader looking
 * for English still scans for "English", not for a translated label. Living beside the
 * catalogues keeps the CJK glyphs out of source modules, and typing the record by
 * `AppLocale` means a new locale cannot be added without a name.
 */
export const LANGUAGE_NAMES: Record<AppLocale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
}

/**
 * One-glyph codes for square controls.
 *
 * A 32px square cannot hold a language name, so the trigger shows the code and the
 * dropdown carries the full names. The Chinese code is one character by nature; the
 * Latin one is the language's own ISO code, which readers already recognise.
 */
export const LANGUAGE_CODES: Record<AppLocale, string> = {
  en: 'EN',
  'zh-CN': '中',
}
