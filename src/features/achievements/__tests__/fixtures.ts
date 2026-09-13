import type { Achievement } from '@/lib/schemas/stats.schema'

/**
 * Achievement badge fixture.
 *
 * Owned by the achievements tests rather than `src/test/factories/`: those hold
 * cross-feature builders (auth, API envelopes), and the dashboard's own panel
 * tests likewise build their payloads locally. Two test files in this feature
 * need the same shape, so it lives beside them once instead of twice.
 *
 * Defaults describe a locked, single-day badge; pass `over` for the tier under
 * test. The server repeats one progress value across a family's tiers, so tests
 * that care about grouping pass the same `progress` to every tier of a family.
 */
export function achievement(over: Partial<Achievement> & { code: string }): Achievement {
  return {
    displayName: over.code,
    description: '',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    target: 1,
    unit: 'days',
    ...over,
  }
}
