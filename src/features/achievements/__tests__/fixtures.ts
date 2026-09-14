import type { Achievement, AchievementWindow } from '@/lib/schemas/stats.schema'

/**
 * Achievement badge fixture.
 *
 * Owned by the achievements tests rather than `src/test/factories/`: those hold
 * cross-feature builders (auth, API envelopes), and the dashboard's own panel
 * tests likewise build their payloads locally. Several test files in this feature
 * need the same shape, so it lives beside them once instead of repeated.
 *
 * Defaults describe a locked, lifetime, single-day badge; pass `over` for the
 * tier under test. The server repeats one progress value across a trophy's
 * tiers, so tests that care about grouping pass the same `progress` to every
 * tier of a (family, window).
 */
export function achievement(over: Partial<Achievement> & { code: string }): Achievement {
  return {
    type: 'STREAK',
    tier: 1,
    displayName: over.code,
    description: '',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    target: 1,
    unit: 'days',
    window: 'LIFETIME',
    windowStart: null,
    windowEnd: null,
    // History (v0.72.0). Default: never reached, no streak — the state of a badge that
    // exists but has not been earned in any period. Tests that care set them explicitly.
    totalUnlocks: 0,
    periodStreak: 0,
    ...over,
  }
}

/**
 * A windowed badge, which always carries its concrete local range — the server
 * reports these for every non-lifetime badge and omits them otherwise.
 */
export function windowed(
  window: Exclude<AchievementWindow, 'LIFETIME'>,
  over: Partial<Achievement> & { code: string },
): Achievement {
  return achievement({ windowStart: '2026-09-07', windowEnd: '2026-09-13', ...over, window })
}
