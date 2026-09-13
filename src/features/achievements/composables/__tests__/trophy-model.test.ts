import { describe, expect, it } from 'vite-plus/test'
import type { Achievement } from '@/lib/schemas/stats.schema'
import { achievement as badge } from '../../__tests__/fixtures'
import { TROPHY_FAMILIES, buildTrophies, byNextWin, tierProgress, trophyTotals } from '../trophy-model'

/**
 * The server repeats one progress value across a family's tiers (measured against
 * a real account). These fixtures mirror that, because the grouping only makes
 * sense under it.
 */
function familySamples(): Achievement[] {
  return [
    badge({ code: 'STREAK_3', target: 3, progress: 7, unlocked: true, unlockedAt: '2026-09-01T00:00:00Z' }),
    badge({ code: 'STREAK_7', target: 7, progress: 7, unlocked: true, unlockedAt: '2026-09-02T00:00:00Z' }),
    badge({ code: 'STREAK_30', target: 30, progress: 7 }),
  ]
}

describe('buildTrophies', () => {
  it('groups a family into one trophy carrying its whole ladder', () => {
    const trophies = buildTrophies(familySamples())

    expect(trophies).toHaveLength(1)
    const streak = trophies[0]!
    expect(streak.key).toBe('streak')
    expect(streak.tiers.map((t) => t.code)).toEqual(['STREAK_3', 'STREAK_7', 'STREAK_30'])
    expect(streak.earned).toBe(2)
    expect(streak.total).toBe(3)
    // One measured value for the family, not one per rung.
    expect(streak.progress).toBe(7)
  })

  it('reads thresholds from the payload rather than duplicating them', () => {
    // A rebalanced server threshold must flow through without a frontend change.
    const rebalanced = familySamples().map((b) => (b.code === 'STREAK_7' ? { ...b, target: 5 } : b))
    const streak = buildTrophies(rebalanced)[0]!
    expect(streak.tiers.find((t) => t.code === 'STREAK_7')!.target).toBe(5)
  })

  it('keeps an unclaimed code visible as its own single-tier trophy', () => {
    // The future-proofing requirement: a badge shipped server-side must appear
    // without a frontend change, never be silently dropped.
    const trophies = buildTrophies([
      ...familySamples(),
      badge({ code: 'STREAK_365', displayName: '365-Day Streak', target: 365, progress: 7 }),
    ])

    const unknown = trophies.find((t) => t.key === 'STREAK_365')
    expect(unknown).toBeDefined()
    expect(unknown!.total).toBe(1)
    // It has only the server's own copy to label itself with.
    expect(unknown!.label).toBe('365-Day Streak')
    expect(unknown!.art).toBe('generic')
  })

  it('declares a family that the response omits as no trophy', () => {
    // Seven declarations exist; a response with one family's badges yields one
    // trophy — the rest must not appear as empty ladders.
    const trophies = buildTrophies(familySamples())
    expect(trophies.map((t) => t.key)).toEqual(['streak'])
    expect(TROPHY_FAMILIES.length).toBeGreaterThan(trophies.length)
  })

  it('orders declared families by declaration, then unknown codes after', () => {
    const trophies = buildTrophies([
      badge({ code: 'NIGHT_OWL_10', target: 10, progress: 8 }),
      badge({ code: 'STREAK_3', target: 3, progress: 7 }),
      badge({ code: 'MYSTERY_1', displayName: 'Mystery', target: 1 }),
    ])
    expect(trophies.map((t) => t.key)).toEqual(['streak', 'nightOwl', 'MYSTERY_1'])
  })

  it('returns nothing for an empty response', () => {
    expect(buildTrophies([])).toEqual([])
  })

  it('collapses a repeated unclaimed code into one trophy', () => {
    // Keys are codes for unclaimed badges, so a duplicate would be a duplicate
    // Vue key — two cards where the user should see one.
    const trophies = buildTrophies([
      badge({ code: 'MYSTERY_1', displayName: 'Mystery', target: 1 }),
      badge({ code: 'MYSTERY_1', target: 1 }),
    ])
    expect(trophies).toHaveLength(1)
    expect(trophies[0]!.key).toBe('MYSTERY_1')
  })

  it('gives every trophy a unique key', () => {
    const trophies = buildTrophies([
      ...familySamples(),
      badge({ code: 'MYSTERY_1', displayName: 'Mystery', target: 1 }),
      badge({ code: 'MYSTERY_1', target: 1 }),
      badge({ code: 'PERFECT_MONTH', target: 1 }),
    ])
    const keys = trophies.map((t) => t.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('tierProgress', () => {
  it('measures between the current and next threshold, not against the next alone', () => {
    // 7 days with tiers 3/7/30: the reader has just cleared 7 and is 0% into 7→30.
    const streak = buildTrophies(familySamples())[0]!
    expect(tierProgress(streak)).toBe(0)
  })

  it('reports partial travel through the current span', () => {
    const badges = [
      badge({ code: 'STREAK_3', target: 3, progress: 18, unlocked: true }),
      badge({ code: 'STREAK_7', target: 7, progress: 18, unlocked: true }),
      badge({ code: 'STREAK_30', target: 30, progress: 18 }),
    ]
    const streak = buildTrophies(badges)[0]!
    // (18 - 7) / (30 - 7)
    expect(tierProgress(streak)).toBeCloseTo(11 / 23, 5)
  })

  it('treats a completed ladder as fully progressed', () => {
    const all = familySamples().map((b) => ({ ...b, unlocked: true }))
    const streak = buildTrophies(all)[0]!
    expect(streak.maxed).toBe(true)
    expect(tierProgress(streak)).toBe(1)
  })

  it('clamps to 1 when progress overshoots the next threshold', () => {
    // Unlock state lags progress by design (the server inserts the row on read),
    // so progress can exceed the next rung without it being marked unlocked.
    const badges = [
      badge({ code: 'STREAK_3', target: 3, progress: 999, unlocked: true }),
      badge({ code: 'STREAK_7', target: 7, progress: 999 }),
      badge({ code: 'STREAK_30', target: 30, progress: 999 }),
    ]
    expect(tierProgress(buildTrophies(badges)[0]!)).toBe(1)
  })
})

describe('trophyTotals', () => {
  it('counts tiers, not trophies', () => {
    const trophies = buildTrophies([
      badge({ code: 'STREAK_3', target: 3, unlocked: true }),
      badge({ code: 'STREAK_7', target: 7 }),
      badge({ code: 'STREAK_30', target: 30 }),
      badge({ code: 'PERFECT_MONTH', target: 1, unlocked: true }),
    ])
    expect(trophyTotals(trophies)).toEqual({ earned: 2, total: 4 })
  })
})

describe('byNextWin', () => {
  it('puts maxed trophies last and the closest to its next rung first', () => {
    const trophies = buildTrophies([
      badge({ code: 'STREAK_3', target: 3, unlocked: true, progress: 30 }),
      badge({ code: 'STREAK_7', target: 7, unlocked: true, progress: 30 }),
      badge({ code: 'STREAK_30', target: 30, unlocked: true, progress: 30 }), // maxed
      badge({ code: 'NIGHT_OWL_10', target: 10, progress: 9 }), // 90% of 0→10
      badge({ code: 'NIGHT_OWL_30', target: 30, progress: 9 }),
      badge({ code: 'EARLY_BIRD_10', target: 10, progress: 2 }), // 20% of 0→10
      badge({ code: 'EARLY_BIRD_30', target: 30, progress: 2 }),
    ])

    const ordered = byNextWin(trophies)
    expect(ordered[0]!.key).toBe('nightOwl')
    expect(ordered[1]!.key).toBe('earlyBird')
    expect(ordered[ordered.length - 1]!.maxed).toBe(true)
  })

  it('never orders by raw distance, which compares unlike units', () => {
    // PERFECT_MONTH is 1 "month" from its rung; NIGHT_OWL is 1 "day" away after
    // clearing 9 of 10. Raw distances are both 1, but the owl is 90% through its
    // span and the calendar trophy 0%, so the owl must lead.
    const trophies = buildTrophies([
      badge({ code: 'PERFECT_MONTH', target: 1, progress: 0, unit: 'month' }),
      badge({ code: 'NIGHT_OWL_10', target: 10, progress: 9, unit: 'days' }),
      badge({ code: 'NIGHT_OWL_30', target: 30, progress: 9, unit: 'days' }),
    ])
    expect(byNextWin(trophies)[0]!.key).toBe('nightOwl')
  })
})
