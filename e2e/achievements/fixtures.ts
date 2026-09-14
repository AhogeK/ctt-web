/**
 * Local achievement wire shapes matching the API contract
 * (`src/lib/schemas/stats.schema.ts`). Kept local to the E2E suite; never import
 * from src/ in specs.
 *
 * The shapes below are the **wire** shapes, not the schema's parsed output, and the
 * difference matters for two fields: `windowStart`/`windowEnd` are optional here
 * because the server omits them entirely for a LIFETIME badge, while the schema
 * (which applies `.default(null)`) types them as always present. Declaring the wire
 * shape is what lets a fixture omit them the way the server does.
 */

export interface AchievementFixture {
  code: string
  type: string
  tier: number
  displayName: string
  description: string
  unlocked: boolean
  unlockedAt: string | null
  progress: number
  target: number
  unit: string
  window: 'LIFETIME' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
  /** Omitted entirely for LIFETIME badges. */
  windowStart?: string
  /** Omitted entirely for LIFETIME badges. */
  windowEnd?: string
  totalUnlocks: number
  periodStreak: number
}

/**
 * A lifetime ladder at two rungs, both earned from the same measurement — the
 * server reports `progress` per (family, window), so every rung repeats it.
 *
 * No `windowStart`/`windowEnd` keys, matching what a LIFETIME badge actually sends.
 */
export const TEST_STREAK_TIERS: AchievementFixture[] = [
  {
    code: 'STREAK_3',
    type: 'STREAK',
    tier: 1,
    displayName: '3-Day Streak',
    description: 'Code on 3 consecutive days',
    unlocked: true,
    unlockedAt: '2026-09-13T06:03:00.126297Z',
    progress: 7,
    target: 3,
    unit: 'days',
    window: 'LIFETIME',
    totalUnlocks: 1,
    periodStreak: 0,
  },
  {
    code: 'STREAK_7',
    type: 'STREAK',
    tier: 2,
    displayName: '7-Day Streak',
    description: 'Code on 7 consecutive days',
    unlocked: true,
    unlockedAt: '2026-09-13T06:03:00.126297Z',
    progress: 7,
    target: 7,
    unit: 'days',
    window: 'LIFETIME',
    totalUnlocks: 1,
    periodStreak: 0,
  },
]

/**
 * A `percent`-unit ladder that is not yet complete, so the card renders a progress
 * bar rather than the "Complete" marker — and exercises the unit formatting that a
 * `month` unit used to cover before v0.71.0.
 */
export const TEST_PERFECT_MONTH: AchievementFixture = {
  code: 'PERFECT_MONTH_50',
  type: 'PERFECT_MONTH',
  tier: 1,
  displayName: 'Half The Month',
  description: 'Code on half of a calendar month',
  unlocked: false,
  unlockedAt: null,
  progress: 32,
  target: 50,
  unit: 'percent',
  window: 'LIFETIME',
  totalUnlocks: 0,
  periodStreak: 0,
}

/**
 * A windowed ladder with a non-zero history and an unmet current period — the
 * ordinary state on a real account, and the combination that pins the card's
 * history line (including the zero streak) and its collapsed date range.
 */
export const TEST_DAILY_TOTAL: AchievementFixture[] = [
  {
    code: 'DAILY_TOTAL_1H',
    type: 'TOTAL_SECONDS',
    tier: 1,
    displayName: 'Productive Hour',
    description: 'Code for an hour today',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    target: 3600,
    unit: 'seconds',
    window: 'DAY',
    windowStart: '2026-09-14',
    windowEnd: '2026-09-14',
    totalUnlocks: 13,
    periodStreak: 0,
  },
  {
    code: 'DAILY_TOTAL_2H',
    type: 'TOTAL_SECONDS',
    tier: 2,
    displayName: 'Focused Two Hours',
    description: 'Code for two hours today',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    target: 7200,
    unit: 'seconds',
    window: 'DAY',
    windowStart: '2026-09-14',
    windowEnd: '2026-09-14',
    totalUnlocks: 12,
    periodStreak: 0,
  },
]

/** A weekly ladder on a different family, sharing the WEEK window bucket. */
export const TEST_WEEKLY_ACTIVE: AchievementFixture = {
  code: 'WEEKLY_ACTIVE_3',
  type: 'ACTIVE_DAYS',
  tier: 1,
  displayName: 'Three-Day Week',
  description: 'Code on 3 days this week',
  unlocked: false,
  unlockedAt: null,
  progress: 0,
  target: 3,
  unit: 'days',
  window: 'WEEK',
  windowStart: '2026-09-14',
  windowEnd: '2026-09-20',
  totalUnlocks: 3,
  periodStreak: 0,
}

/** A yearly ladder never reached in any period, so both history values are 0. */
export const TEST_YEARLY_TOTAL: AchievementFixture = {
  code: 'YEARLY_TOTAL_500H',
  type: 'TOTAL_SECONDS',
  tier: 1,
  displayName: 'Five Hundred Hours',
  description: 'Code for 500 hours this year',
  unlocked: false,
  unlockedAt: null,
  progress: 306_000,
  target: 1_800_000,
  unit: 'seconds',
  window: 'YEAR',
  windowStart: '2026-01-01',
  windowEnd: '2026-12-31',
  totalUnlocks: 0,
  periodStreak: 0,
}

/** A non-empty payload: two lifetime ladders plus one of each window. */
export const TEST_ACHIEVEMENTS: AchievementFixture[] = [
  ...TEST_STREAK_TIERS,
  TEST_PERFECT_MONTH,
  ...TEST_DAILY_TOTAL,
  TEST_WEEKLY_ACTIVE,
  TEST_YEARLY_TOTAL,
]
