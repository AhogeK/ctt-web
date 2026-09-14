import { describe, expect, it } from 'vite-plus/test'
import type { Achievement } from '@/lib/schemas/stats.schema'
import { achievement as badge, windowed } from '../../__tests__/fixtures'
import {
  buildTrophies,
  byNextWin,
  formatDaysLeft,
  formatWindowRange,
  TROPHY_ART_GEOMETRY,
  TROPHY_ART_IDS,
  TROPHY_CENTER,
  TROPHY_RING_INNER,
  groupByWindow,
  isClosing,
  periodUnit,
  medalFitTransform,
  splitByWindow,
  tierProgress,
  trophyTotals,
} from '../trophy-model'

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

describe('groupByWindow', () => {
  it('groups resetting ladders by window, shortest period first', () => {
    const groups = groupByWindow(
      buildTrophies([
        windowed('YEAR', { code: 'Y', type: 'TOTAL_SECONDS', target: 1_800_000, unit: 'seconds' }),
        windowed('DAY', { code: 'D', type: 'TOTAL_SECONDS', target: 3_600, unit: 'seconds' }),
        windowed('WEEK', { code: 'W', type: 'TOTAL_SECONDS', target: 36_000, unit: 'seconds' }),
      ]),
    )
    expect(groups.map((g) => g.window)).toEqual(['DAY', 'WEEK', 'YEAR'])
    expect(groups.map((g) => g.label)).toEqual(['Today', 'This week', 'This year'])
  })

  it('collects same-window ladders under one group, since they share a deadline', () => {
    const groups = groupByWindow(
      buildTrophies([
        windowed('WEEK', { code: 'W1', type: 'ACTIVE_DAYS', tier: 1, target: 5 }),
        windowed('WEEK', { code: 'W2', type: 'TOTAL_SECONDS', tier: 1, target: 36_000, unit: 'seconds' }),
      ]),
    )
    expect(groups).toHaveLength(1)
    expect(groups[0]!.trophies.map((t) => t.type).sort()).toEqual(['ACTIVE_DAYS', 'TOTAL_SECONDS'])
  })

  it('carries the range and countdown once per window, not per trophy', () => {
    const groups = groupByWindow(
      buildTrophies([
        windowed('WEEK', {
          code: 'W1',
          type: 'ACTIVE_DAYS',
          tier: 1,
          target: 5,
          windowStart: '2026-09-14',
          windowEnd: '2026-09-20',
        }),
        windowed('WEEK', {
          code: 'W2',
          type: 'TOTAL_SECONDS',
          tier: 1,
          target: 36_000,
          unit: 'seconds',
          windowStart: '2026-09-14',
          windowEnd: '2026-09-20',
        }),
      ]),
      // Local construction so the countdown assertion holds in any timezone.
      new Date(2026, 8, 18),
    )
    expect(groups).toHaveLength(1)
    expect(groups[0]!.range).toBe('Sep 14 – Sep 20')
    expect(groups[0]!.daysLeft).toBe(2)
  })

  it('orders each group by closeness, like every other section', () => {
    const groups = groupByWindow(
      buildTrophies([
        windowed('WEEK', { code: 'FAR', type: 'ACTIVE_DAYS', tier: 1, target: 7, progress: 1 }),
        windowed('WEEK', { code: 'NEAR', type: 'TOTAL_SECONDS', tier: 1, target: 10, progress: 9, unit: 'seconds' }),
      ]),
    )
    expect(groups[0]!.trophies[0]!.type).toBe('TOTAL_SECONDS')
  })

  it('does not depend on which badge arrives first when members disagree', () => {
    // The server repeats one date pair per window, so this cannot happen today —
    // but the group header reads one span for all its members, so it must not be
    // decided by response ordering. The widest span wins.
    const narrow = windowed('WEEK', {
      code: 'N',
      type: 'ACTIVE_DAYS',
      windowStart: '2026-09-16',
      windowEnd: '2026-09-18',
    })
    const wide = windowed('WEEK', {
      code: 'W',
      type: 'TOTAL_SECONDS',
      windowStart: '2026-09-14',
      windowEnd: '2026-09-20',
      unit: 'seconds',
    })

    const forward = groupByWindow(buildTrophies([narrow, wide]), new Date(2026, 8, 14))
    const reversed = groupByWindow(buildTrophies([wide, narrow]), new Date(2026, 8, 14))

    expect(forward[0]!.range).toBe('Sep 14 – Sep 20')
    expect(reversed[0]!.range).toBe('Sep 14 – Sep 20')
    // Both ends, so the countdown agrees too.
    expect(forward[0]!.daysLeft).toBe(6)
    expect(reversed[0]!.daysLeft).toBe(6)
  })

  it('reports no countdown when the server sent no end date', () => {
    const groups = groupByWindow(buildTrophies([badge({ code: 'W', type: 'ACTIVE_DAYS', window: 'WEEK' })]))
    expect(groups[0]!.daysLeft).toBeNull()
    expect(groups[0]!.range).toBeNull()
  })
})

describe('formatWindowRange', () => {
  it('collapses a single-day window, which the DAY ladder always is', () => {
    // Verified against the live endpoint: DAY reports the same date for both ends.
    expect(formatWindowRange('2026-09-14', '2026-09-14')).toBe('Sep 14')
  })

  it('renders a span within one year without repeating it', () => {
    expect(formatWindowRange('2026-09-14', '2026-09-20')).toBe('Sep 14 – Sep 20')
    expect(formatWindowRange('2026-09-01', '2026-09-30')).toBe('Sep 1 – Sep 30')
  })

  it('keeps both years when the range crosses one', () => {
    // An ISO week at a year boundary does this: the week containing 2025-12-29
    // ends on 2026-01-04 and is still one window.
    expect(formatWindowRange('2025-12-29', '2026-01-04')).toBe('Dec 29, 2025 – Jan 4, 2026')
  })

  it('is null when either end is missing or malformed', () => {
    expect(formatWindowRange(null, '2026-09-20')).toBeNull()
    expect(formatWindowRange('2026-09-14', null)).toBeNull()
    expect(formatWindowRange('nonsense', '2026-09-20')).toBeNull()
    expect(formatWindowRange('2026-13-01', '2026-13-02')).toBeNull()
  })

  it('rejects a date that looks well-formed but does not exist', () => {
    // A range check on the numbers (m <= 12, d <= 31) accepts all of these and
    // prints "Feb 31". Only a round-trip through the calendar catches them.
    expect(formatWindowRange('2026-02-31', '2026-02-31')).toBeNull()
    expect(formatWindowRange('2026-04-31', '2026-04-31')).toBeNull()
    expect(formatWindowRange('2026-09-00', '2026-09-10')).toBeNull()
    expect(formatWindowRange('2026-00-10', '2026-01-10')).toBeNull()
    // 2026 is not a leap year, so this date does not exist either.
    expect(formatWindowRange('2026-02-29', '2026-02-29')).toBeNull()
  })

  it('accepts a real leap day', () => {
    expect(formatWindowRange('2028-02-29', '2028-02-29')).toBe('Feb 29')
  })
})

describe('isClosing', () => {
  it('covers the last day and the one before it, and nothing further out', () => {
    // The rule lives here rather than as a `<= 1` in the template so its boundary
    // is pinned: two days is where a target stops being comfortably reachable.
    expect(isClosing(0)).toBe(true)
    expect(isClosing(1)).toBe(true)
    expect(isClosing(2)).toBe(false)
    expect(isClosing(30)).toBe(false)
  })

  it('is false when there is no deadline to close in on', () => {
    // A lifetime trophy reports null and must never take the closing styling.
    expect(isClosing(null)).toBe(false)
  })
})

describe('formatDaysLeft', () => {
  it('names the last day rather than counting zero', () => {
    // "0 days left" reads as expired; the window is still live today.
    expect(formatDaysLeft(0)).toBe('Ends today')
  })

  it('keeps the singular for one day', () => {
    expect(formatDaysLeft(1)).toBe('1 day left')
    expect(formatDaysLeft(2)).toBe('2 days left')
  })

  it('is null when there is no deadline to state', () => {
    expect(formatDaysLeft(null)).toBeNull()
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

describe('medalFitTransform', () => {
  /**
   * Parse the transform back into its matrix, so the geometric claim is checked
   * numerically. jsdom has no layout engine — every `getBBox()` returns zero — so a
   * DOM-level assertion could not catch a wrong transform; the algebra is the only
   * honest way to test this in unit tests, and the live measurements it encodes were
   * taken from a real browser.
   */
  function parse(transform: string) {
    const t = transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/)
    const k = transform.match(/scale\(([-\d.]+)\)/)
    if (!t || !k) throw new Error(`unparseable transform: ${transform}`)
    return { tx: Number(t[1]), ty: Number(t[2]), s: Number(k[1]) }
  }

  it('puts every artwork’s centre exactly on the grid centre', () => {
    // The measured `center` is an offset from the grid centre, so the artwork's
    // absolute centre is CENTER + offset and must land back on CENTER. A first
    // version omitted the CENTER*(1-s) term and left every medal ~4 units off; this
    // is the assertion that catches that class of error.
    for (const art of TROPHY_ART_IDS) {
      const { tx, ty, s } = parse(medalFitTransform(art))
      const [dx, dy] = TROPHY_ART_GEOMETRY[art].center
      const centreX = tx + s * (TROPHY_CENTER + dx)
      const centreY = ty + s * (TROPHY_CENTER + dy)
      expect(centreX).toBeCloseTo(TROPHY_CENTER, 3)
      expect(centreY).toBeCloseTo(TROPHY_CENTER, 3)
    }
  })

  it('fits every artwork inside the ring', () => {
    // The whole point: the ring is at the largest radius the 24-grid allows, so the
    // artwork must come in to meet it. Before this the ring cut through all nine
    // artworks — the worst (the calendars) by 2.58 units.
    for (const art of TROPHY_ART_IDS) {
      const { tx, ty, s } = parse(medalFitTransform(art))
      const { distance, center } = TROPHY_ART_GEOMETRY[art]
      void center
      // The artwork is scaled by `s` about its own centre, which the previous test
      // pins onto the grid centre — so its farthest painted point is `s * distance`.
      expect(s * distance).toBeLessThanOrEqual(TROPHY_RING_INNER)
      expect(tx).toBeGreaterThan(-TROPHY_CENTER)
      expect(ty).toBeGreaterThan(-TROPHY_CENTER)
    }
  })

  it('leaves clear space rather than touching the ring', () => {
    // Touching is not "inside" in any useful sense: the stroke needs room.
    for (const art of TROPHY_ART_IDS) {
      const { s } = parse(medalFitTransform(art))
      expect(s * TROPHY_ART_GEOMETRY[art].distance).toBeLessThan(TROPHY_RING_INNER)
    }
  })

  it('scales each artwork so they all end up the same size', () => {
    // An artwork smaller than the budget is scaled *up*, so the medals read as one set
    // rather than as whatever size each path happened to be drawn at.
    const reaches = TROPHY_ART_IDS.map((art) => parse(medalFitTransform(art)).s * TROPHY_ART_GEOMETRY[art].distance)
    for (const reach of reaches) expect(reach).toBeCloseTo(reaches[0]!, 2)
  })

  it('has geometry for every artwork, and none for a non-existent one', () => {
    // Keeps the measured table and the union from drifting apart.
    expect(Object.keys(TROPHY_ART_GEOMETRY).sort()).toEqual([...TROPHY_ART_IDS].sort())
  })

  it('records a plausible distance for every artwork', () => {
    /*
     * A sanity floor on the measured data. The bound cannot be the half-diagonal (12):
     * `streak` is drawn high in the grid, so its farthest painted point measures 11.35
     * — legitimate, and a good reason not to guess a threshold. What is not legitimate
     * is a distance so small the scale becomes meaningless, or zero, which the clamp
     * would silently absorb.
     */
    for (const art of TROPHY_ART_IDS) {
      expect(TROPHY_ART_GEOMETRY[art].distance).toBeGreaterThan(TROPHY_CENTER / 2)
      expect(TROPHY_ART_GEOMETRY[art].distance).toBeLessThan(2 * TROPHY_CENTER)
    }
  })
})

describe('period history', () => {
  it('reports the ladder history from its base rung', () => {
    // Per-rung on the wire; the ladder reports its lowest rung, which is the largest
    // count by construction (a higher threshold cannot be met more often).
    const trophies = buildTrophies([
      windowed('WEEK', { code: 'W1', type: 'ACTIVE_DAYS', tier: 1, target: 3, totalUnlocks: 9, periodStreak: 2 }),
      windowed('WEEK', { code: 'W2', type: 'ACTIVE_DAYS', tier: 2, target: 5, totalUnlocks: 4, periodStreak: 1 }),
    ])
    expect(trophies[0]!.periodsReached).toBe(9)
    expect(trophies[0]!.periodStreak).toBe(2)
  })

  it('reads the base rung even when no rung is unlocked this period', () => {
    /*
     * The common case on real data: the server reports `unlocked: false` with a
     * non-zero history whenever the current period has not been reached yet (measured:
     * a day ladder at `unlocked=n` with `totalUnlocks=13`). Anchoring to the current rung
     * would have nothing to read, which is why the base rung is used.
     */
    const trophies = buildTrophies([
      windowed('DAY', {
        code: 'D1',
        type: 'TOTAL_SECONDS',
        tier: 1,
        target: 3_600,
        unit: 'seconds',
        unlocked: false,
        totalUnlocks: 13,
        periodStreak: 0,
      }),
    ])
    expect(trophies[0]!.earned).toBe(0)
    expect(trophies[0]!.periodsReached).toBe(13)
  })

  it('is monotone down a real ladder, so the base rung is the right pick', () => {
    // The server's own numbers: 13 / 12 / 11 for a day ladder, 3 / 2 / 0 for a week one.
    const trophies = buildTrophies([
      windowed('DAY', { code: 'D1', type: 'TOTAL_SECONDS', tier: 1, target: 3_600, unit: 'seconds', totalUnlocks: 13 }),
      windowed('DAY', { code: 'D2', type: 'TOTAL_SECONDS', tier: 2, target: 7_200, unit: 'seconds', totalUnlocks: 12 }),
      windowed('DAY', {
        code: 'D3',
        type: 'TOTAL_SECONDS',
        tier: 3,
        target: 14_400,
        unit: 'seconds',
        totalUnlocks: 11,
      }),
    ])
    const rungs = trophies[0]!.tiers.map((t) => t.periodsReached)
    expect(rungs).toEqual([13, 12, 11])
    // Every higher rung is reached no more often than the one below it.
    for (let i = 1; i < rungs.length; i++) expect(rungs[i]!).toBeLessThanOrEqual(rungs[i - 1]!)
  })

  it('carries each rung its own history, not the whole ladder’s', () => {
    // So a future feature can show "this rung: 4 of 9 periods" without re-deriving it.
    const trophies = buildTrophies([
      windowed('WEEK', { code: 'W1', type: 'ACTIVE_DAYS', tier: 1, target: 3, totalUnlocks: 9 }),
      windowed('WEEK', { code: 'W2', type: 'ACTIVE_DAYS', tier: 2, target: 5, totalUnlocks: 4 }),
    ])
    expect(trophies[0]!.tiers.map((t) => t.periodsReached)).toEqual([9, 4])
  })

  it('does not invent a history for a badge that has none', () => {
    const trophies = buildTrophies([windowed('YEAR', { code: 'Y1', type: 'ACTIVE_DAYS', tier: 1, target: 100 })])
    expect(trophies[0]!.periodsReached).toBe(0)
    expect(trophies[0]!.periodStreak).toBe(0)
  })
})

describe('periodUnit', () => {
  it('uses the singular for a count of one', () => {
    // Caught live: a monthly ladder at exactly 1 rendered "1 months reached".
    expect(periodUnit('MONTH', 1)).toBe('month')
    expect(periodUnit('DAY', 1)).toBe('day')
    expect(periodUnit('WEEK', 1)).toBe('week')
    expect(periodUnit('YEAR', 1)).toBe('year')
  })

  it('uses the plural everywhere else, including zero', () => {
    // Zero never renders (the card hides the line), but the helper must still be sane
    // rather than returning the singular.
    expect(periodUnit('MONTH', 0)).toBe('months')
    expect(periodUnit('MONTH', 2)).toBe('months')
    expect(periodUnit('DAY', 13)).toBe('days')
  })

  it('names the noun by window, not by the badge unit', () => {
    // TOTAL_SECONDS ladders measure progress in seconds but are counted in periods.
    expect(periodUnit('WEEK', 3)).toBe('weeks')
    expect(periodUnit('YEAR', 5)).toBe('years')
  })
})
