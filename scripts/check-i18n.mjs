#!/usr/bin/env node
/**
 * check-i18n — the guard every migration batch runs against.
 *
 * Rules:
 *  1. No Chinese literal in application source (`src/**`, excluding the
 *     catalogue, test fixtures and the Chinese terms page, which is legal
 *     content rather than UI copy).
 *  2. The English and Chinese catalogues expose exactly the same key set.
 *  3. Dates go through the shared formatters — a direct
 *     `toLocale*String('en-US')` pins the interface to English regardless of
 *     the chosen language.
 *
 * Usage: `pnpm check:i18n` (exit code 1 on any violation).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(root, 'src')
const LOCALES = join(SRC, 'i18n', 'locales')

/** Files that legitimately contain Chinese: legal content, not interface copy. */
const ALLOWLIST = new Set([join(SRC, 'features', 'auth', 'content', 'terms-zh.ts')])

const CJK = /[\u4e00-\u9fff]/
const DIRECT_EN_US = /\.toLocale(?:Date|Time)?String\(\s*['"`]en-US['"`]/

/** Walk `src` for source files, skipping tests and the catalogue itself. */
function collectSourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue
      collectSourceFiles(full, out)
      continue
    }
    if (!/\.(ts|vue)$/.test(entry)) continue
    if (full === LOCALES || full.startsWith(`${LOCALES}/`)) continue
    if (ALLOWLIST.has(full)) continue
    out.push(full)
  }
  return out
}

/**
 * Strip comments before scanning: a Chinese character in a comment is a code
 * style problem, not a missing translation, and the style check owns that.
 */
function stripComments(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length
}

const errors = []
const files = collectSourceFiles(SRC)

for (const file of files) {
  const raw = readFileSync(file, 'utf8')
  const source = stripComments(raw)

  const cjk = CJK.exec(source)
  if (cjk) {
    errors.push(`Chinese literal in ${relative(root, file)}:${lineOf(source, cjk.index)} — move it into src/i18n/locales/`)
  }

  const direct = DIRECT_EN_US.exec(source)
  if (direct) {
    errors.push(
      `Hard-coded en-US formatting in ${relative(root, file)}:${lineOf(source, direct.index)} — use formatMonthShort / formatWeekdayShort`,
    )
  }
}

/** Flatten a nested catalogue into dot paths. */
function leaves(node, prefix = '', out = []) {
  if (typeof node === 'string') {
    out.push(prefix)
    return out
  }
  if (node && typeof node === 'object') {
    for (const [key, child] of Object.entries(node)) leaves(child, prefix ? `${prefix}.${key}` : key, out)
  }
  return out
}

const enModule = await import(pathToFileURL(join(LOCALES, 'en.ts')).href)
const zhModule = await import(pathToFileURL(join(LOCALES, 'zh-CN.ts')).href)
const enKeys = new Set(leaves(enModule.default))
const zhKeys = new Set(leaves(zhModule.default))

for (const key of enKeys) if (!zhKeys.has(key)) errors.push(`Missing Chinese message for "${key}"`)
for (const key of zhKeys) if (!enKeys.has(key)) errors.push(`Chinese message "${key}" has no English source`)

if (!existsSync(join(LOCALES, 'en.ts'))) errors.push('src/i18n/locales/en.ts is missing')

if (errors.length > 0) {
  console.error(`check-i18n: ${errors.length} problem(s)`)
  for (const error of errors) console.error(`  ✗ ${error}`)
  process.exit(1)
}

console.log(`check-i18n: clean (${files.length} files scanned, ${enKeys.size} keys aligned)`)
