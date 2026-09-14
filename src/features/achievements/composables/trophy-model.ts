/**
 * Achievement trophy model — turns the flat badge list the API returns into the
 * tier ladders the UI renders.
 *
 * ## Why grouping is needed
 *
 * The API returns one entry per threshold (67 of them as of ctt-server v0.71.0),
 * but progress is measured once per **(family, window)**. Rendering 67 cards
 * would print a family's single measured value many times over and imply dozens
 * of independent goals. One trophy per (family, window), each carrying a ladder
 * of tiers, is the honest shape.
 *
 * ## Grouping is data-driven, not hardcoded
 *
 * Until v0.70.0 the client had to recognise families itself, because the response
 * did not carry one — and the codes are not parseable (`DAILY_BURST` is tier 3 of
 * `MAX_DAILY_SECONDS`, while `DAILY_BURST_4` is tier 1; `PERFECT_MONTH` is tier 5
 * of its family while `PERFECT_MONTH_50` is tier 1). The server now sends `type`
 * and `tier`, so grouping and ordering are pure data operations and adding a
 * badge server-side needs **no change here**.
 *
 * The key must be `(type, window)`, not `type` alone: `TOTAL_SECONDS` has five
 * independent ladders — a LIFETIME one with 8 tiers and DAY/WEEK/MONTH/YEAR ones
 * with 2–3 each. Grouping by `type` alone would merge the 3 daily tiers into the
 * lifetime ladder and number them 9/10/11.
 */

import type { Achievement, AchievementWindow } from '@/lib/schemas/stats.schema'

/** Built-in artwork, one per family. Unknown families fall back to `generic`. */
export type TrophyArt =
  | 'streak'
  | 'volume'
  | 'polyglot'
  | 'activeDays'
  | 'earlyBird'
  | 'nightOwl'
  | 'burst'
  | 'perfectMonth'
  | 'generic'

/**
 * Presentation metadata for a family.
 *
 * Only what the server cannot express: a readable title, a one-line description
 * of what the ladder rewards, and which artwork to draw. Grouping, ordering and
 * thresholds all come from the response — deliberately not duplicated here, so a
 * server-side rebalance or a new badge needs no change in this file.
 */
interface FamilyPresentation {
  label: string
  blurb: string
  art: TrophyArt
}

const FAMILY_PRESENTATION: Record<string, FamilyPresentation> = {
  STREAK: { label: 'Streak', blurb: 'Code on consecutive days', art: 'streak' },
  TOTAL_SECONDS: { label: 'Total time', blurb: 'Accumulate coding time', art: 'volume' },
  LANGUAGE_COUNT: { label: 'Polyglot', blurb: 'Code in different languages', art: 'polyglot' },
  ACTIVE_DAYS: { label: 'Active days', blurb: 'Code on enough days', art: 'activeDays' },
  EARLY_BIRD_DAYS: { label: 'Early bird', blurb: 'Start coding in the morning', art: 'earlyBird' },
  NIGHT_OWL_DAYS: { label: 'Night owl', blurb: 'Code late into the night', art: 'nightOwl' },
  MAX_DAILY_SECONDS: { label: 'Marathon', blurb: 'Code a full day in one sitting', art: 'burst' },
  PERFECT_MONTH: { label: 'Perfect month', blurb: 'Code on nearly every day of a month', art: 'perfectMonth' },
}

/**
 * Display order within every band — not just the lifetime one.
 *
 * The rank it feeds runs in `buildTrophies` for every window band, and both
 * sections are then re-sorted independently by closeness, so this order decides
 * the tie-break among same-label ladders (all five `TOTAL_SECONDS` cards read
 * "Total time").
 *
 * Derived from `FAMILY_PRESENTATION`'s own key order rather than restated as a
 * second literal: two lists of the same eight families had to be edited together
 * or silently disagree, and `Object.keys` preserves insertion order for string
 * keys. Unknown families sort after the known ones, alphabetically.
 */
const FAMILY_ORDER = Object.keys(FAMILY_PRESENTATION)

/**
 * Window display order: **lifetime first**, then the rolling periods shortest
 * first. Lifetime leads because it is the section that carries a user's lasting
 * record; the resetting ones are the current-period goals beneath it (see the
 * `window` labels, which read "This week" / "Today").
 */
const WINDOW_PRESENTATION: Record<AchievementWindow, { label: string; order: number }> = {
  LIFETIME: { label: 'All time', order: 0 },
  DAY: { label: 'Today', order: 1 },
  WEEK: { label: 'This week', order: 2 },
  MONTH: { label: 'This month', order: 3 },
  YEAR: { label: 'This year', order: 4 },
}

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
   * reports one progress number per (family, window), not one per rung.
   */
  target: number
  unit: string
}

/** A trophy: one artwork plus its ladder, resolved for display. */
export interface Trophy {
  /** Unique key: `${type}:${window}`, stable across renders. */
  key: string
  /** Server family name (`TOTAL_SECONDS`). */
  type: string
  /** Measurement window — what this trophy's progress resets with. */
  window: AchievementWindow
  /**
   * Readable window noun ("This week") for a resetting trophy, else null.
   *
   * Rendered on the card because the window is the only thing separating ladders
   * that share a family: the API returns `TOTAL_SECONDS` five times (lifetime,
   * day, week, month, year) and they all present as "Total time". Without the
   * noun, five cards read as duplicates of one another.
   */
  windowLabel: string | null
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
  /** True when the whole ladder is earned. */
  maxed: boolean
  /** True when this ladder resets at the end of its window. */
  resets: boolean
  /** 0–1 completion of this trophy across its own ladder. */
  completion: number
  /**
   * The tier currently earned, or `null` when none is. The *next* tier is
   * `tiers[earned]` — progress toward it is what the card's bar shows, because a
   * bar drawn against the current tier's own target would read 0% for every
   * mid-ladder trophy.
   */
  currentTier: TrophyTier | null
  /** The next tier still to earn, or `null` when the ladder is complete. */
  nextTier: TrophyTier | null
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

/** Group key: a family's ladder is per window, so both take part. */
function groupKey(badge: Achievement): string {
  return `${badge.type}:${badge.window}`
}

/** Presentation for a family, with a readable fallback for one we do not know. */
function present(type: string, badges: Achievement[]): FamilyPresentation {
  const known = FAMILY_PRESENTATION[type]
  if (known !== undefined) return known

  /*
   * An unknown family. The server's family name is the only honest label for the
   * trophy, but the badge already carries copy the server wrote for it — use that
   * as the blurb so a new family is still readable rather than a bare enum name.
   * Single-tier families use their own displayName as the label, which is more
   * informative than the enum.
   */
  const first = badges[0]!
  return {
    label: badges.length === 1 ? first.displayName : type,
    blurb: first.description,
    art: 'generic',
  }
}

/** Build one trophy from the badges sharing a (family, window). */
function buildTrophy(badges: Achievement[]): Trophy {
  const first = badges[0]!
  const type = first.type
  const window = first.window

  // Ascending by tier, which the server defines by ascending target. Ties broken
  // by code so the order is total and cannot shuffle between renders.
  const tiers = [...badges]
    .sort((a, b) => (a.tier !== b.tier ? a.tier - b.tier : a.code.localeCompare(b.code)))
    .map(toTier)

  const earned = tiers.filter((tier) => tier.unlocked).length
  const presentation = present(type, badges)
  // Progress is family-and-window scoped, so the server repeats one value across
  // the ladder; the max absorbs any per-tier disagreement without inventing one.
  const progress = badges.reduce((max, badge) => Math.max(max, badge.progress), 0)
  const resets = window !== 'LIFETIME'

  return {
    key: groupKey(first),
    type,
    window,
    // The window noun is the only thing distinguishing five `TOTAL_SECONDS`
    // ladders that would otherwise all read "Total time".
    windowLabel: resets ? WINDOW_PRESENTATION[window].label : null,
    label: presentation.label,
    blurb: presentation.blurb,
    art: presentation.art,
    tiers,
    earned,
    total: tiers.length,
    progress,
    unit: first.unit,
    maxed: earned === tiers.length,
    resets,
    completion: earned / tiers.length,
    currentTier: tiers[earned - 1] ?? null,
    nextTier: tiers[earned] ?? null,
  }
}

/**
 * Group the flat badge list into trophies, lifetime first.
 *
 * Every badge is claimed by exactly one trophy — grouping is a partition, so
 * nothing can be dropped and no code list has to be maintained. A family the
 * presentation map does not know still produces a trophy, labelled with the
 * server's own badge name and drawn with generic artwork. (A *window* the model
 * does not know cannot occur: `AchievementWindowSchema` is a closed enum, so zod
 * rejects it before the model sees it.)
 *
 * The returned order is lifetime first, then the rolling periods shortest-first,
 * and within each band the declared family order then name. The view renders that
 * as two sections (`splitByWindow`) rather than one list, so this ordering is what
 * fixes the position *within* each section.
 */
export function buildTrophies(badges: Achievement[]): Trophy[] {
  const groups = new Map<string, Achievement[]>()
  for (const badge of badges) {
    const key = groupKey(badge)
    const bucket = groups.get(key)
    if (bucket === undefined) groups.set(key, [badge])
    else bucket.push(badge)
  }

  return [...groups.values()].map(buildTrophy).sort((a, b) => {
    const order = WINDOW_PRESENTATION[a.window].order - WINDOW_PRESENTATION[b.window].order
    if (order !== 0) return order
    const familyA = FAMILY_ORDER.indexOf(a.type)
    const familyB = FAMILY_ORDER.indexOf(b.type)
    const rankA = familyA === -1 ? 99 : familyA
    const rankB = familyB === -1 ? 99 : familyB
    if (rankA !== rankB) return rankA - rankB
    return a.label.localeCompare(b.label)
  })
}

/** Trophies that never reset, and those that do — the two page sections. */
export function splitByWindow(trophies: Trophy[]): { lifetime: Trophy[]; active: Trophy[] } {
  return {
    lifetime: trophies.filter((trophy) => !trophy.resets),
    active: trophies.filter((trophy) => trophy.resets),
  }
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
