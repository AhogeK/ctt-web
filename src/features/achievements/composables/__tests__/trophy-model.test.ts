import { describe, expect, it } from 'vite-plus/test'
import type { Achievement } from '@/lib/schemas/stats.schema'
import { achievement as badge, windowed } from '../../__tests__/fixtures'
import { buildTrophies, byNextWin, splitByWindow, tierProgress, trophyTotals } from '../trophy-model'

/**
 * A slice of the real ctt-server v0.71.0 payload: STREAK's 3-tier lifetime
 * ladder, and TOTAL_SECONDS' separate DAY and lifetime ladders — the case that
 * proves grouping must be by (type, window).
 */
function payload(): Achievement[] {
  return [
    badge({ code: 'STREAK_3', type: 'STREAK', tier: 1, target: 3, progress: 7, unlocked: true }),
    badge({ code: 'STREAK_7', type: 'STREAK', tier: 2, target: 7, progress: 7, unlocked: true }),
    badge({ code: 'STREAK_30', type: 'STREAK', tier: 3, target: 30, progress: 7 }),
    badge({
      code: 'TOTAL_10_HOURS',
      type: 'TOTAL_SECONDS',
      tier: 1,
      target: 36_000,
      progress: 460_860,
      unit: 'seconds',
    }),
    badge({
      code: 'TOTAL_100_HOURS',
      type: 'TOTAL_SECONDS',
      tier: 2,
      target: 360_000,
      progress: 460_860,
      unit: 'seconds',
    }),
    windowed('DAY', { code: 'DAILY_TOTAL_1H', type: 'TOTAL_SECONDS', tier: 1, target: 3_600, unit: 'seconds' }),
    windowed('DAY', { code: 'DAILY_TOTAL_2H', type: 'TOTAL_SECONDS', tier: 2, target: 7_200, unit: 'seconds' }),
  ]
}

describe('buildTrophies', () => {
  it('groups one ladder per (family, window), not per family', () => {
    const trophies = buildTrophies(payload())
    // TOTAL_SECONDS appears twice — once lifetime, once daily — and must not merge.
    expect(trophies.map((t) => t.key).sort()).toEqual([
      'STREAK:LIFETIME',
      'TOTAL_SECONDS:DAY',
      'TOTAL_SECONDS:LIFETIME',
    ])
  })

  it('keeps a windowed ladder out of the lifetime one and numbers it from 1', () => {
    const daily = buildTrophies(payload()).find((t) => t.key === 'TOTAL_SECONDS:DAY')!
    expect(daily.total).toBe(2)
    expect(daily.tiers.map((t) => t.target)).toEqual([3_600, 7_200])
    // Merging by type alone would have placed these at tiers 3 and 4.
    expect(daily.window).toBe('DAY')
    expect(daily.resets).toBe(true)
  })

  it('orders tiers by the server ordinal, not by the order they arrived', () => {
    // The real payload interleaves: MAX_DAILY_SECONDS tier 3 is the code
    // `DAILY_BURST`, while its tier 1 is `DAILY_BURST_4` — so code order is not
    // tier order and sorting on it would scramble the ladder.
    const scrambled = [
      badge({
        code: 'DAILY_BURST',
        tier: 3,
        target: 28_800,
        progress: 86_400,
        unit: 'seconds',
        type: 'MAX_DAILY_SECONDS',
      }),
      badge({
        code: 'DAILY_BURST_4',
        tier: 1,
        target: 14_400,
        progress: 86_400,
        unit: 'seconds',
        type: 'MAX_DAILY_SECONDS',
      }),
      badge({
        code: 'DAILY_BURST_6',
        tier: 2,
        target: 21_600,
        progress: 86_400,
        unit: 'seconds',
        type: 'MAX_DAILY_SECONDS',
      }),
    ]
    const trophy = buildTrophies(scrambled)[0]!
    expect(trophy.tiers.map((t) => t.code)).toEqual(['DAILY_BURST_4', 'DAILY_BURST_6', 'DAILY_BURST'])
  })

  it('labels a family the build does not know, without dropping it', () => {
    const unknown = buildTrophies([
      badge({ code: 'MYSTERY_1', type: 'BRAND_NEW', displayName: 'Mystery', description: 'Do a new thing', target: 5 }),
    ])
    expect(unknown).toHaveLength(1)
    expect(unknown[0]!.type).toBe('BRAND_NEW')
    // A single-tier family uses the server's own badge name, which says more than
    // the enum identifier would.
    expect(unknown[0]!.label).toBe('Mystery')
    expect(unknown[0]!.blurb).toBe('Do a new thing')
    expect(unknown[0]!.art).toBe('generic')
  })

  it('labels a multi-tier family the build does not know with its family name', () => {
    // With several tiers there is no single badge name to borrow, so the family
    // identifier is the honest label.
    const unknown = buildTrophies([
      badge({ code: 'M1', type: 'BRAND_NEW', tier: 1, displayName: 'First', target: 5 }),
      badge({ code: 'M2', type: 'BRAND_NEW', tier: 2, displayName: 'Second', target: 10 }),
    ])
    expect(unknown[0]!.label).toBe('BRAND_NEW')
    expect(unknown[0]!.art).toBe('generic')
  })

  it('carries each tier unit through, rather than assuming the family default', () => {
    // Thresholds and units must flow from the payload: the server rebalances them
    // and `PERFECT_MONTH` changed unit from `month` to `percent` in v0.71.0. A
    // fixture echo of one value (target: 5 -> 5) cannot fail, so assert a
    // multi-tier payload whose tiers differ in both target and unit.
    const mixed = buildTrophies([
      badge({ code: 'M1', type: 'MYSTERY', tier: 1, target: 5, unit: 'days' }),
      badge({ code: 'M2', type: 'MYSTERY', tier: 2, target: 90, unit: 'percent' }),
    ])[0]!
    expect(mixed.tiers.map((t) => t.target)).toEqual([5, 90])
    expect(mixed.tiers.map((t) => t.unit)).toEqual(['days', 'percent'])
  })

  it('carries the measured value per trophy, not per tier', () => {
    const streak = buildTrophies(payload()).find((t) => t.key === 'STREAK:LIFETIME')!
    expect(streak.progress).toBe(7)
    expect(streak.earned).toBe(2)
    expect(streak.total).toBe(3)
  })

  it('reports a trophy as resetting only when its window is not LIFETIME', () => {
    const trophies = buildTrophies(payload())
    expect(trophies.find((t) => t.key === 'STREAK:LIFETIME')!.resets).toBe(false)
    expect(trophies.find((t) => t.key === 'STREAK:LIFETIME')!.windowLabel).toBeNull()
    expect(trophies.find((t) => t.key === 'TOTAL_SECONDS:DAY')!.windowLabel).toBe('Today')
  })

  it('partitions every badge — nothing is dropped', () => {
    const trophies = buildTrophies(payload())
    const tally = trophies.reduce((n, t) => n + t.total, 0)
    expect(tally).toBe(payload().length)
  })

  it('returns nothing for an empty response', () => {
    expect(buildTrophies([])).toEqual([])
  })

  it('orders lifetime trophies before windowed ones', () => {
    const trophies = buildTrophies(payload())
    const firstWindowed = trophies.findIndex((t) => t.resets)
    const lastLifetime = trophies.map((t) => t.resets).lastIndexOf(false)
    expect(lastLifetime).toBeLessThan(firstWindowed)
  })

  it('order same-label ladders by window, shortest period first', () => {
    // Every TOTAL_SECONDS ladder is labelled "Total time", so the window is the
    // only thing separating them once the view re-sorts each section by closeness.
    // One tier each, all at 0 progress, so closeness ties and the window rank is
    // what decides.
    const sameLabel = buildTrophies([
      windowed('YEAR', { code: 'Y1', type: 'TOTAL_SECONDS', tier: 1, target: 1_800_000, unit: 'seconds' }),
      windowed('WEEK', { code: 'W1', type: 'TOTAL_SECONDS', tier: 1, target: 36_000, unit: 'seconds' }),
      windowed('MONTH', { code: 'M1', type: 'TOTAL_SECONDS', tier: 1, target: 144_000, unit: 'seconds' }),
      windowed('DAY', { code: 'D1', type: 'TOTAL_SECONDS', tier: 1, target: 3_600, unit: 'seconds' }),
    ])
    expect(sameLabel.map((t) => t.window)).toEqual(['DAY', 'WEEK', 'MONTH', 'YEAR'])
  })
})

describe('splitByWindow', () => {
  it('separates the lifetime section from the active one', () => {
    const { lifetime, active } = splitByWindow(buildTrophies(payload()))
    expect(lifetime.map((t) => t.key)).toEqual(['STREAK:LIFETIME', 'TOTAL_SECONDS:LIFETIME'])
    expect(active.map((t) => t.key)).toEqual(['TOTAL_SECONDS:DAY'])
  })
})

describe('tierProgress', () => {
  it('measures between the current and next threshold, not against the next alone', () => {
    // 7 days with tiers 3/7/30: just cleared 7, so 0% into the 7→30 leg.
    const streak = buildTrophies(payload()).find((t) => t.key === 'STREAK:LIFETIME')!
    expect(tierProgress(streak)).toBe(0)
  })

  it('reports partial travel through the current span', () => {
    const streak = buildTrophies([
      badge({ code: 'S1', type: 'STREAK', tier: 1, target: 3, progress: 18, unlocked: true }),
      badge({ code: 'S2', type: 'STREAK', tier: 2, target: 7, progress: 18, unlocked: true }),
      badge({ code: 'S3', type: 'STREAK', tier: 3, target: 30, progress: 18 }),
    ])[0]!
    expect(tierProgress(streak)).toBeCloseTo(11 / 23, 5)
  })

  it('measures the first tier from zero', () => {
    const fresh = buildTrophies([badge({ code: 'S1', type: 'STREAK', tier: 1, target: 10, progress: 5 })])[0]!
    expect(tierProgress(fresh)).toBeCloseTo(0.5, 5)
  })

  it('treats a completed ladder as fully progressed', () => {
    const done = buildTrophies(
      payload()
        .filter((b) => b.type === 'STREAK')
        .map((b) => ({ ...b, unlocked: true })),
    )[0]!
    expect(done.maxed).toBe(true)
    expect(tierProgress(done)).toBe(1)
  })

  it('clamps to 1 when progress overshoots the next threshold', () => {
    const ahead = buildTrophies([
      badge({ code: 'S1', type: 'STREAK', tier: 1, target: 3, progress: 999, unlocked: true }),
      badge({ code: 'S2', type: 'STREAK', tier: 2, target: 7, progress: 999 }),
    ])[0]!
    expect(tierProgress(ahead)).toBe(1)
  })
})

describe('trophyTotals', () => {
  it('counts tiers, not trophies', () => {
    expect(trophyTotals(buildTrophies(payload()))).toEqual({ earned: 2, total: 7 })
  })
})

describe('byNextWin', () => {
  it('puts maxed trophies last and the closest to its next rung first', () => {
    const trophies = buildTrophies([
      badge({ code: 'A1', type: 'STREAK', tier: 1, target: 3, progress: 30, unlocked: true }),
      badge({ code: 'A2', type: 'STREAK', tier: 2, target: 30, progress: 30, unlocked: true }), // maxed
      badge({ code: 'N1', type: 'NIGHT_OWL_DAYS', tier: 1, target: 10, progress: 9 }), // 90%
      badge({ code: 'E1', type: 'EARLY_BIRD_DAYS', tier: 1, target: 10, progress: 2 }), // 20%
    ])
    const ordered = byNextWin(trophies)
    expect(ordered[0]!.type).toBe('NIGHT_OWL_DAYS')
    expect(ordered[1]!.type).toBe('EARLY_BIRD_DAYS')
    expect(ordered[ordered.length - 1]!.maxed).toBe(true)
  })

  it('never orders by raw distance, which compares unlike units', () => {
    // PERFECT_MONTH is 1 "percent" short of 100; NIGHT_OWL is 1 day short of 10.
    // Raw distances tie at 1, but the owl is 90% through its span and the
    // percentage trophy 99% — whichever leads, the order must come from the
    // fraction, so an equal raw distance must not decide it.
    const trophies = buildTrophies([
      badge({ code: 'P1', type: 'PERFECT_MONTH', tier: 1, target: 100, progress: 99, unit: 'percent' }),
      badge({ code: 'N1', type: 'NIGHT_OWL_DAYS', tier: 1, target: 10, progress: 9 }),
    ])
    expect(byNextWin(trophies)[0]!.type).toBe('PERFECT_MONTH')
  })
})
