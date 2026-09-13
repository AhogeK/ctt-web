/**
 * Achievement trophy model — turns the flat badge list the API returns into the
 * tier ladders the UI renders.
 *
 * ## Why this exists
 *
 * `GET /stats/achievements` returns 15 badges, but they are **7 families of 2–3
 * tiers**, and progress is measured once per family. Measured against a real
 * account, all three STREAK badges reported `progress = 7`; all three TOTAL
 * badges reported `460860`. Rendering 15 cards would therefore print the same
 * number five times and imply 15 independent goals. One trophy per family, each
 * carrying a ladder of tiers, is the honest shape.
 *
 * ## The seam, and how it degrades
 *
 * The server's `AchievementResponse` does not carry the family even though its
 * enum knows it (`Achievement.type()`). Recovering the family from `code` is not
 * reliable — the codes are irregular (`TOTAL_10_HOURS` carries a unit,
 * `DAILY_BURST` carries no number, and the stems do not match the enum's type
 * names). So:
 *
 * - Families are declared here as **data**, not inferred from strings.
 * - A code that no declaration claims still renders, as a **single-tier trophy
 *   of its own**, using the server's own `displayName` / `description`.
 *
 * That degradation is the point: a badge added server-side appears to users
 * immediately, without a frontend change. It joins a shared ladder once a
 * declaration here lists its **exact code** — matching is by code, not by prefix,
 * because the codes are irregular enough that a prefix rule would misgroup them.
 * Until then it renders standalone rather than being dropped.
 *
 * Once the API exposes `type` (and ideally `tier`), the declarations below lose
 * their matching role and this module becomes a pure lookup — the call sites do
 * not change.
 */

import type { Achievement } from '@/lib/schemas/stats.schema'

/** Built-in artwork, one per family. Unknown families fall back to `generic`. */
export type TrophyArt =
  | 'streak'
  | 'volume'
  | 'polyglot'
  | 'earlyBird'
  | 'nightOwl'
  | 'burst'
  | 'perfectMonth'
  | 'generic'

/**
 * A family declaration.
 *
 * `codes` lists the ladder in ascending order. `label` and `blurb` are the
 * trophy's own copy — the per-tier strings the server sends describe the tier
 * ("7-Day Streak"), not the family, so they cannot label the artwork.
 */
export interface TrophyFamily {
  /** Stable key, also the analytics/vue-key identity. */
  key: string
  /** Trophy title shown under the artwork. */
  label: string
  /** One line describing what the whole ladder rewards. */
  blurb: string
  /** Artwork to draw. */
  art: TrophyArt
  /** Codes in ascending tier order, lowest threshold first. */
  codes: string[]
}

/**
 * The seven families the server currently ships.
 *
 * Order here is display order. Thresholds are **not** duplicated — each tier
 * reads `target` from its own server payload, so a rebalanced threshold needs no
 * frontend change.
 */
export const TROPHY_FAMILIES: TrophyFamily[] = [
  {
    key: 'streak',
    label: 'Streak',
    blurb: 'Code on consecutive days',
    art: 'streak',
    codes: ['STREAK_3', 'STREAK_7', 'STREAK_30'],
  },
  {
    key: 'volume',
    label: 'Total time',
    blurb: 'Accumulate coding time',
    art: 'volume',
    codes: ['TOTAL_10_HOURS', 'TOTAL_100_HOURS', 'TOTAL_500_HOURS'],
  },
  {
    key: 'polyglot',
    label: 'Polyglot',
    blurb: 'Code in different languages',
    art: 'polyglot',
    codes: ['LANGUAGES_3', 'LANGUAGES_5', 'LANGUAGES_10'],
  },
  {
    key: 'earlyBird',
    label: 'Early bird',
    blurb: 'Start coding in the morning',
    art: 'earlyBird',
    codes: ['EARLY_BIRD_10', 'EARLY_BIRD_30'],
  },
  {
    key: 'nightOwl',
    label: 'Night owl',
    blurb: 'Code late into the night',
    art: 'nightOwl',
    codes: ['NIGHT_OWL_10', 'NIGHT_OWL_30'],
  },
  {
    key: 'burst',
    label: 'Marathon',
    blurb: 'Code a full day in one sitting',
    art: 'burst',
    codes: ['DAILY_BURST'],
  },
  {
    key: 'perfectMonth',
    label: 'Perfect month',
    blurb: 'Code on every day of a month',
    art: 'perfectMonth',
    codes: ['PERFECT_MONTH'],
  },
]

/** One rung of a ladder, carrying the server's own thresholds and state. */
export interface TrophyTier {
  code: string
  /** The server's own label for this rung ("7-Day Streak"). */
  displayName: string
  unlocked: boolean
  unlockedAt: string | null
  /**
   * This tier's threshold.
   *
   * The family's *measured* value is separate (`Trophy.progress`) — the server
   * reports one progress number for the whole family, not one per rung.
   */
  target: number
  unit: string
}

/** A trophy: one artwork plus its ladder, resolved for display. */
export interface Trophy {
  key: string
  label: string
  blurb: string
  art: TrophyArt
  /** Ascending tiers. */
  tiers: TrophyTier[]
  /** How many tiers are earned. */
  earned: number
  /** Total tiers on this ladder. */
  total: number
  /** The family's single measured value (progress is per family, not per tier). */
  progress: number
  /** Unit the progress is expressed in. */
  unit: string
  /**
   * The tier currently earned, or `null` when none is. The *next* tier is
   * `tiers[earned]` — progress toward it is what the card's bar shows, because a
   * bar drawn against the current tier's own target would read 0% for every
   * mid-ladder trophy.
   */
  currentTier: TrophyTier | null
  /** The next tier still to earn, or `null` when the ladder is complete. */
  nextTier: TrophyTier | null
  /** True when every tier is earned. */
  maxed: boolean
  /** 0–1 completion of this trophy across its own ladder. */
  completion: number
}

function toTier(badge: Achievement): TrophyTier {
  return {
    code: badge.code,
    displayName: badge.displayName,
    unlocked: badge.unlocked,
    unlockedAt: badge.unlockedAt,
    target: badge.target,
    unit: badge.unit,
  }
}

/**
 * Family-scoped measured value.
 *
 * The server repeats one number across a family's rungs (measured: all three
 * STREAK badges reported `7`), so any rung carries it — the highest is used so
 * this stays correct if the server ever reports per-rung values.
 */
function familyProgress(badges: Achievement[]): number {
  return badges.reduce((max, badge) => Math.max(max, badge.progress), 0)
}

/**
 * Build one trophy from a family declaration plus the badges it received.
 *
 * A family whose codes are entirely absent from the response is skipped: showing
 * an empty ladder would invent a goal the server does not track.
 */
function buildTrophy(family: TrophyFamily, byCode: Map<string, Achievement>): Trophy | null {
  const found = family.codes
    .map((code) => byCode.get(code))
    .filter((badge): badge is Achievement => badge !== undefined)

  if (found.length === 0) return null

  return finishTrophy(
    { key: family.key, label: family.label, blurb: family.blurb, art: family.art },
    found.map(toTier),
    familyProgress(found),
  )
}

/** Shared tail for declared families and for the unknown-code fallback. */
function finishTrophy(
  identity: { key: string; label: string; blurb: string; art: TrophyArt },
  tiers: TrophyTier[],
  progress: number,
): Trophy {
  const earned = tiers.filter((tier) => tier.unlocked).length

  return {
    key: identity.key,
    label: identity.label,
    blurb: identity.blurb,
    art: identity.art,
    tiers,
    earned,
    total: tiers.length,
    progress,
    unit: tiers[0]!.unit,
    currentTier: tiers[earned - 1] ?? null,
    nextTier: tiers[earned] ?? null,
    maxed: earned === tiers.length,
    completion: earned / tiers.length,
  }
}

/**
 * Group the flat badge list into trophies.
 *
 * Declared families come first, in declaration order. Any code no declaration
 * claims is appended as its own single-tier trophy, so a newly shipped badge is
 * visible immediately and never dropped. Two passes over 15 items, so no index
 * is needed.
 */
export function buildTrophies(badges: Achievement[]): Trophy[] {
  const byCode = new Map(badges.map((badge) => [badge.code, badge]))
  const claimed = new Set<string>()
  const trophies: Trophy[] = []

  for (const family of TROPHY_FAMILIES) {
    const trophy = buildTrophy(family, byCode)
    if (trophy === null) continue
    trophies.push(trophy)
    for (const code of family.codes) claimed.add(code)
  }

  // Iterate the deduped map, not the raw array: two entries sharing an unclaimed
  // code would otherwise produce two trophies with the same `key` — duplicate Vue
  // keys and a doubled card.
  for (const [code, badge] of byCode) {
    if (claimed.has(code)) continue
    // Unknown to this build: still shown, as a one-rung ladder. Its own copy is
    // the only label the server gave us, so use it.
    trophies.push(
      finishTrophy(
        { key: code, label: badge.displayName, blurb: badge.description, art: 'generic' },
        [toTier(badge)],
        badge.progress,
      ),
    )
  }

  return trophies
}

/**
 * Progress toward the next tier, 0–1, for the card's bar.
 *
 * Measured **between the current and next tier's thresholds**, not against the
 * next tier alone — a fresh account sitting at 7/30 days is 0% of the way to 30,
 * but that is misleading when it already cleared 3 and 7. Anchoring to the
 * previous threshold shows the distance actually being travelled now.
 */
export function tierProgress(trophy: Trophy): number {
  const next = trophy.nextTier
  if (next === null) return 1
  const floor = trophy.currentTier?.target ?? 0
  const span = next.target - floor
  if (span <= 0) return 1
  return Math.min(1, Math.max(0, (trophy.progress - floor) / span))
}

/** Totals for the page header. */
export function trophyTotals(trophies: Trophy[]): { earned: number; total: number } {
  return trophies.reduce((acc, trophy) => ({ earned: acc.earned + trophy.earned, total: acc.total + trophy.total }), {
    earned: 0,
    total: 0,
  })
}

/**
 * Trophies ordered for display: closest to its next rung first, ties alphabetical,
 * completed ladders last.
 *
 * Closeness is measured as **fraction of the current span travelled**
 * (`tierProgress`), never as `next.target - progress`. The latter compares raw
 * values across families whose units differ — one *month* short and two *days*
 * short are not comparable quantities, and sorting on them put a barely-started
 * calendar trophy ahead of a trophy that was 80% of the way to its next rung.
 * The fraction is unit-free and is the same number the card's bar draws.
 *
 * The page should open on something attainable rather than on a maxed trophy the
 * reader can do nothing with.
 */
export function byNextWin(trophies: Trophy[]): Trophy[] {
  return [...trophies].sort((a, b) => {
    if (a.maxed !== b.maxed) return a.maxed ? 1 : -1
    const closeness = tierProgress(b) - tierProgress(a)
    if (closeness !== 0) return closeness
    return a.label.localeCompare(b.label)
  })
}
