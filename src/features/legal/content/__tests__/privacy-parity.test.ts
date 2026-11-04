import { describe, expect, it } from 'vitest'
import { privacyContent as en } from '../privacy-en'
import { privacyContent as zh } from '../privacy-zh'

/**
 * Source files, as the bundler sees them.
 *
 * Reading through Vite rather than the filesystem keeps this test looking at exactly the files the
 * build compiles — a `process.cwd()` walk drifts the moment the test runner's root changes.
 */
const SOURCES = import.meta.glob('/src/**/*.{ts,vue}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * `ctt`-prefixed literals that are not storage.
 *
 * The scan errs on the side of reporting too much: a missing key makes the notice wrong, a spurious
 * one is a one-line fix here. The cross-tab refresh lock is the only name in this shape today.
 */
const NOT_STORAGE = new Set(['ctt-refresh'])

/** Keys the code can write: a literal in a storage call, or one held in a constant passed to it. */
function writtenKeys(): Set<string> {
  const keys = new Set<string>()
  const quoted = /'([A-Za-z0-9][\w.:-]{2,})'/g
  const storage = /localStorage|sessionStorage|useStorage|useSessionStorage|document\.cookie/
  // Keys accessed through a literal in the call itself, whatever their name looks like.
  const callSite = /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*'([^']+)'/g
  // Key constants are often declared in a helper the write site only imports (`sidebar_state`), so
  // their declaration is read even from files that never touch storage themselves.
  const keyConstant = /(?:const|let)\s+\w*(?:_KEY|_COOKIE_NAME|_STORAGE_KEY)\s*=\s*'([^']+)'/g

  for (const [file, text] of Object.entries(SOURCES)) {
    if (file.includes('__tests__') || file.includes('/i18n/locales/') || file.includes('/legal/content/')) continue
    // Only files that touch storage are interesting; every other file is full of unrelated literals.
    for (const match of text.matchAll(keyConstant)) keys.add(match[1]!)
    if (!storage.test(text)) continue
    for (const match of text.matchAll(callSite)) keys.add(match[1]!)
    for (const match of text.matchAll(quoted)) {
      const value = match[1]!
      // This project's storage keys carry the `ctt` prefix, joined by a dot, dash or underscore —
      // the hyphen last, or the character class turns into a range that excludes it. Cookie names
      // are the known exceptions.
      if (/^(ctt[._-]|vueuse-color-scheme$|theme-appearance$|XSRF-TOKEN$)/.test(value)) keys.add(value)
    }
  }
  return new Set([...keys].filter((key) => !NOT_STORAGE.has(key)))
}

/**
 * The two catalogues are edited by hand, in different languages, and a notice that lists storage in
 * one language but not the other is wrong for half its readers. These are the invariants that keep
 * them telling the same story.
 */
describe('privacy notice parity', () => {
  it('lists the same storage keys in both languages', () => {
    expect(zh.storage.map((item) => item.name)).toEqual(en.storage.map((item) => item.name))
  })

  it('agrees on which entries need consent', () => {
    expect(zh.storage.map((item) => item.essential)).toEqual(en.storage.map((item) => item.essential))
  })

  it('carries the same sections, in the same order', () => {
    expect(zh.sections.map((section) => section.id)).toEqual(en.sections.map((section) => section.id))
  })

  it('lists every key the source can write', () => {
    const keys = writtenKeys()
    // `ctt_user_id, ctt_session` is one row covering two keys, so the comparison is per token.
    const listed = new Set(en.storage.flatMap((item) => item.name.split(',').map((part) => part.trim())))
    const missing = [...keys].filter((key) => !listed.has(key))

    // A scan that reads nothing would make the next assertion trivially true.
    expect(keys.size).toBeGreaterThan(5)
    // A key that exists in code but not on this page makes the notice wrong for every reader.
    expect(missing).toEqual([])
  })

  it('states that consent is not asked for, and why', () => {
    const copy = en.sections.find((section) => section.id === 'no-tracking')?.paragraphs.join(' ') ?? ''
    expect(copy).toMatch(/consent banner/)
    expect(copy).toMatch(/opt-in|switched off/i)
  })
})
