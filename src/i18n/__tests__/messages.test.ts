import { describe, it, expect } from 'vite-plus/test'

import en from '../locales/en'
import zhCN from '../locales/zh-CN'

/**
 * Catalogue integrity.
 *
 * The structural type on `zh-CN.ts` already fails the build on a missing or
 * renamed key; these assertions catch what a type cannot see — keys that are
 * present but empty, and non-string leaves that would render as `[object Object]`.
 */
type Leaf = { path: string; value: string }

function leaves(node: unknown, prefix = ''): Leaf[] {
  if (typeof node === 'string') return [{ path: prefix, value: node }]
  if (!node || typeof node !== 'object') return []
  return Object.entries(node as Record<string, unknown>).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key),
  )
}

const enLeaves = leaves(en)
const zhLeaves = leaves(zhCN)

describe('i18n catalogues', () => {
  it('exposes the same key set in every language', () => {
    const enKeys = enLeaves.map((leaf) => leaf.path).sort()
    const zhKeys = zhLeaves.map((leaf) => leaf.path).sort()
    expect(zhKeys).toEqual(enKeys)
  })

  it('has no empty message', () => {
    const empty = [...enLeaves, ...zhLeaves].filter((leaf) => leaf.value.trim() === '')
    expect(empty).toEqual([])
  })

  it('keeps interpolation placeholders identical across languages', () => {
    const placeholders = (value: string) => (value.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).sort()
    const zhByPath = new Map(zhLeaves.map((leaf) => [leaf.path, leaf.value]))
    for (const leaf of enLeaves) {
      expect(placeholders(zhByPath.get(leaf.path) ?? '')).toEqual(placeholders(leaf.value))
    }
  })

  it('names every leaf with a lowercase dot path', () => {
    const malformed = enLeaves.filter((leaf) => !/^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/.test(leaf.path))
    expect(malformed).toEqual([])
  })
})
