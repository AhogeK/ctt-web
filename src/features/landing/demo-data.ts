/**
 * Example data for the marketing surfaces.
 *
 * Single source: the hero preview and the proof sections below it read from here. Every surface that
 * renders it must also render `EXAMPLE_DATA_BADGE` — otherwise a visitor has no way to tell these
 * numbers apart from a real account's, which is the one thing this data must never be mistaken for.
 *
 * The values are a plausible week for a developer who works on a few projects across two languages;
 * they are deliberately unremarkable rather than impressive.
 */
import type { SummaryStatKey } from '@/features/dashboard/components/summary-stat-fields'
import type { RankedEntry } from '@/features/dashboard/composables/useRankedDistribution'
import type { RecentSession } from '@/lib/schemas/stats.schema'
import { groupSessions, type SessionDayGroup } from '@/features/dashboard/components/session-groups'
import { buildTrophies, type Trophy } from '@/features/achievements/composables/trophy-model'
import type { Achievement, AchievementWindow } from '@/lib/schemas/stats.schema'

/** Badge text shown wherever example data appears. */
export const EXAMPLE_DATA_BADGE = 'Example data'

/** One line explaining what the example is, in plain language. */
export const EXAMPLE_DATA_NOTE = 'Sample figures from a pretend week — not a real account.'

/**
 * Languages as the distribution model takes them: ordered by seconds descending. Share, bar length
 * and the folded tail are all derived by `useRankedDistribution`, never hand-written here.
 */
export const EXAMPLE_LANGUAGES: RankedEntry[] = [
  { name: 'TypeScript', seconds: 41 * 3600 + 12 * 60 },
  { name: 'Kotlin', seconds: 27 * 3600 + 30 * 60 },
  { name: 'Vue', seconds: 12 * 3600 + 45 * 60 },
  { name: 'SQL', seconds: 5 * 3600 + 20 * 60 },
  { name: 'Markdown', seconds: 2 * 3600 + 10 * 60 },
  { name: 'Shell', seconds: 55 * 60 },
  { name: 'YAML', seconds: 32 * 60 },
]

/**
 * Seconds per summary field, keyed exactly like the API fields the dashboard maps.
 *
 * `total` is **derived from the language list above**, not typed in: the hero shows both side by side,
 * and two hand-written numbers drifted apart the first time this shipped (a 90h list next to a 3148h
 * total). Everything else is bounded by the field it sits under — year ≤ total, month ≤ year, week ≤
 * month, today ≤ week — so the six cards read as one plausible story instead of six plausible numbers.
 */
export const EXAMPLE_SUMMARY_SECONDS: Record<SummaryStatKey, number> = {
  today: 3 * 3600 + 25 * 60,
  dailyAverage: 4 * 3600 + 5 * 60,
  thisWeek: 18 * 3600 + 40 * 60,
  thisMonth: 41 * 3600 + 15 * 60,
  thisYear: 74 * 3600 + 30 * 60,
  total: EXAMPLE_LANGUAGES.reduce((sum, entry) => sum + entry.seconds, 0),
}

/**
 * Example sessions for the hero's floating card.
 *
 * Built by calling the dashboard's own `groupSessions()` on generated rows rather than by
 * hand-writing labels: the day headings, the counts and the per-row time all come out of the real
 * grouping code, so the hero cannot drift from the dashboard's row model (the same reason the ranking
 * reuses `useRankedDistribution`). Timestamps are relative to `now`, so "Today" really is today.
 *
 * Five rows across two days, on purpose: the hero's card is 176px tall, and a list that overflows it
 * would either scroll (wrong for a marketing surface) or show a day heading whose count does not match
 * the rows beneath it.
 */
export function exampleSessionGroups(now: Date = new Date()): SessionDayGroup[] {
  const start = (daysAgo: number, hours: number, minutes: number) => {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(hours, minutes, 0, 0)
    return date
  }
  const row = (seed: string, projectName: string, language: string, minutes: number, at: Date): RecentSession => ({
    sessionId: `00000000-0000-4000-8000-0000000000${seed}`,
    sessionUuid: `00000000-0000-4000-8000-0000000000${seed}`,
    projectName,
    language,
    startTime: at.toISOString(),
    endTime: new Date(at.getTime() + minutes * 60_000).toISOString(),
    durationSeconds: minutes * 60,
  })

  return groupSessions(
    [
      // Deliberately sums to the Today card (3h 25m = 205m): the two surfaces are read side by side,
      // so arithmetic that does not reconcile is a bug, not a rounding difference (the same class of
      // contradiction the total above would be).
      row('11', 'ctt-web', 'TypeScript', 52, start(0, 14, 5)),
      row('12', 'ctt-web', 'Vue', 79, start(0, 11, 40)),
      row('13', 'code-time-tracker', 'Kotlin', 74, start(0, 9, 12)),
      row('21', 'code-time-tracker', 'Kotlin', 96, start(1, 15, 20)),
      row('22', 'ctt-server', 'Java', 44, start(1, 13, 2)),
    ],
    now,
  )
}

/** One rung of an example ladder, as the API states it per badge. */
interface ExampleRung {
  code: string
  displayName: string
  target: number
}

/**
 * Expand one ladder into the badge rows the API returns.
 *
 * The API reports **one threshold per row** and **one progress value per (family, window)** — progress
 * is deliberately not repeated per rung, and `buildTrophies` reads it back off the family. Writing the
 * rows through this helper is what keeps that contract true in the example: the caller states the
 * family's progress once, so a rung can never disagree with its siblings.
 */
function exampleLadder(
  type: string,
  description: string,
  unit: string,
  progress: number,
  rungs: ExampleRung[],
  options: {
    window?: AchievementWindow
    periodsReached?: number
    periodStreak?: number
  } = {},
): Achievement[] {
  const { window = 'LIFETIME', periodsReached = 0, periodStreak = 0 } = options
  return rungs.map((rung) => ({
    code: rung.code,
    type,
    tier: rungs.indexOf(rung) + 1,
    displayName: rung.displayName,
    description,
    unlocked: progress >= rung.target,
    unlockedAt: progress >= rung.target ? '2026-09-14T18:00:00Z' : null,
    progress,
    target: rung.target,
    unit,
    window,
    windowStart: null,
    windowEnd: null,
    totalUnlocks: periodsReached,
    periodStreak,
  }))
}

/**
 * Example trophies for the proof section below the hero.
 *
 * Built by calling the achievements page's own `buildTrophies()` on example badges rather than by
 * hand-writing a `Trophy`: grouping, tier order, the earned count, `currentTier` / `nextTier` and the
 * completion fraction all come out of the real code, so a marketing surface cannot show a ladder shape
 * the product would never produce (the same reason the ranking reuses `useRankedDistribution` and the
 * session log reuses `groupSessions`).
 *
 * Three ladders, not the cabinet's fourteen: the section shows what a ladder *is*. The weekly one is
 * included on purpose — a resetting ladder is the only kind that carries the history row, which is the
 * part a reader needs in order to see that progress restarts.
 *
 * The arithmetic ties to the surfaces above instead of being invented a second time: the weekly
 * ladder's progress **is** `EXAMPLE_SUMMARY_SECONDS.thisWeek`, so a reader comparing the two never
 * finds a contradiction.
 */
export const EXAMPLE_TROPHIES: Trophy[] = buildTrophies([
  ...exampleLadder(
    'STREAK',
    'Code on consecutive days',
    'days',
    23,
    [
      { code: 'STREAK_7', displayName: 'One Week Streak', target: 7 },
      { code: 'STREAK_14', displayName: 'Two Week Streak', target: 14 },
      { code: 'STREAK_30', displayName: 'One Month Streak', target: 30 },
      { code: 'STREAK_60', displayName: 'Two Month Streak', target: 60 },
    ],
    { periodsReached: 4, periodStreak: 23 },
  ),
  ...exampleLadder(
    'TOTAL_SECONDS',
    'Accumulate coding time',
    'seconds',
    EXAMPLE_SUMMARY_SECONDS.thisWeek,
    [
      { code: 'WEEKLY_5H', displayName: 'Five Hour Week', target: 5 * 3600 },
      { code: 'WEEKLY_15H', displayName: 'Fifteen Hour Week', target: 15 * 3600 },
      { code: 'WEEKLY_25H', displayName: 'Twenty Five Hour Week', target: 25 * 3600 },
    ],
    { window: 'WEEK', periodsReached: 3, periodStreak: 2 },
  ),
  ...exampleLadder(
    'LANGUAGE_COUNT',
    'Code in different languages',
    'languages',
    7,
    [
      { code: 'LANG_3', displayName: 'Trilingual', target: 3 },
      { code: 'LANG_5', displayName: 'Five Languages', target: 5 },
      { code: 'LANG_10', displayName: 'Ten Languages', target: 10 },
    ],
    { periodsReached: 2, periodStreak: 2 },
  ),
])

/**
 * The window the activity grid shows: a full year.
 *
 * 52 weeks, not 12, because of what the reference pages measure: their product artefacts span the
 * container (Linear's app window bleeds past both edges, Supabase's four tiles fill the row), while a
 * 12-week grid is ~200px of indigo in a 1200px row — empty space where the product should be. Stated
 * on the surface, because the window is not lifetime.
 */
export const EXAMPLE_ACTIVITY_WEEKS = 52

/** One painted day. `seconds` of 0 is a real value: the visitor coded nothing that day. */
export interface ActivityCell {
  /** `YYYY-MM-DD`, for the accessible summary and stable keys. */
  date: string
  seconds: number
}

/** A column of the grid: seven slots, Sunday first, `null` where the window does not reach. */
export interface ActivityWeek {
  cells: (ActivityCell | null)[]
}

/**
 * Twelve weeks of example days, oldest first, aligned to whole weeks.
 *
 * Deterministic on purpose — a random fill would make screenshots, tests and any two page loads
 * disagree — and it rises towards the present, so the grid reads as a habit rather than wallpaper.
 *
 * The trailing seven days are **rescaled to sum to `EXAMPLE_SUMMARY_SECONDS.thisWeek`**: the summary
 * row and this grid are read one after the other, and a mismatch between them is a contradiction
 * rather than a rounding difference (the same rule that made `total` a derivation rather than a
 * second number). Nothing else about this window is stated as a total, so nothing else can disagree.
 *
 * @param now - the day the window ends on; injectable so tests are not time-dependent.
 * @returns Week columns for the grid, each with seven slots, Sunday first.
 */
export function exampleActivityWeeks(now: Date = new Date()): ActivityWeek[] {
  const days = EXAMPLE_ACTIVITY_WEEKS * 7
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  /**
   * Deterministic pseudo-noise: a sine pair, not `Math.random()`. Two page loads, a screenshot and a
   * test must all see the same year.
   */
  const noise = (index: number) => {
    const a = Math.sin(index * 12.9898) * 43758.5453
    return a - Math.floor(a)
  }

  /**
   * A break, not a blackout: a run of blank days lands across two whole
   * columns and reads as "the data is missing" rather than "they were away". Fourteen days, of which two or three still have a short session —
   * which is also what a real holiday looks like when the laptop comes along.
   */
  const VACATION_UNTIL = 168 // ~24 weeks back
  const VACATION_LENGTH = 14

  const raw: ActivityCell[] = []
  for (let back = days - 1; back >= 0; back -= 1) {
    const date = new Date(today)
    date.setDate(date.getDate() - back)
    const weekday = date.getDay()
    const index = days - 1 - back
    const n = noise(index)

    let hours = 0
    /*
     * Sundays are light, not empty. Zeroing them paints one completely blank row across the whole
     * grid — the single most obvious tell that the data is generated. A real year has quiet
     * Sundays, some busy ones, and a few skipped entirely; the `off` chance below is higher on
     * Sundays so that mix comes out of the same rules as every other day.
     */
    const isSunday = weekday === 0
    const offChance = isSunday ? 0.34 : 0.14
    const onVacation = back >= VACATION_UNTIL - VACATION_LENGTH && back <= VACATION_UNTIL
    // Two short sessions inside the break, so no column is ever a blank stripe.
    const vacationDabble = onVacation && (back === VACATION_UNTIL - 4 || back === VACATION_UNTIL - 9)
    const off = (onVacation && !vacationDabble) || n < offChance
    const sprint = back >= 40 && back <= 47 // one heavy week, so the year has a shape rather than a level
    // A handful of five-minute days: without them the lightest bucket never occurs, because the
    // days whose multiplier would land there are exactly the ones the `off` rule above turns into
    // zeros. Selection effect, not noise.
    const brief = !off && n > 0.97
    if (brief) {
      hours = 6 / 60
    } else if (!off) {
      // Sunday keeps a small base (0.9h) instead of zero: with the wide spread below it lands
      // anywhere from a few minutes to a long weekend session.
      const base = [0.9, 2.2, 3.6, 2.6, 3.8, 3.2, 1.2][weekday] ?? 0
      /*
       * The multiplier has to be **wider than the colour ladder's buckets**, or the grid reads as
       * wallpaper: the buckets are `<15m · 15–60m · 1–2h · 2–5h · 5–8h · >8h`, so a Monday that only
       * ever ranges 1.8–3.0h is one colour for fifty-two weeks. Skewed by `n ** 1.7` so most days are
       * short and the long ones are rare, the way a real year looks.
       */
      // Floor at ~6m so the lightest bucket also occurs: a ladder whose first shade never appears
      // invites the reader to wonder whether the scale is real.
      const spread = 0.1 + 2.35 * n ** 1.7 + (sprint ? 0.6 : 0)
      hours = base * spread
    }
    raw.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      seconds: Math.round(hours * 3600),
    })
  }

  const target = EXAMPLE_SUMMARY_SECONDS.thisWeek
  const trail = raw.slice(-7)
  const trailSum = trail.reduce((sum, cell) => sum + cell.seconds, 0)
  const scale = trailSum === 0 ? 0 : target / trailSum
  let assigned = 0
  trail.forEach((cell, index) => {
    // The last cell absorbs the rounding so the seven add up to `target` exactly, not approximately.
    const seconds = index === trail.length - 1 ? target - assigned : Math.round(cell.seconds * scale)
    assigned += seconds
    cell.seconds = seconds
  })

  /*
   * Hard rule, enforced rather than hoped for: **no week column may be entirely empty.** An empty
   * column is indistinguishable from a gap in the rendering — the reader sees a missing stripe, not
   * a quiet week. Any that survive the rules above (a break, or a run of unlucky draws) get one short
   * session on their middle day. The assertion lives in the unit test so it can fail.
   */
  const byWeek = new Map<string, ActivityCell[]>()
  for (const cell of raw) {
    const day = new Date(`${cell.date}T12:00:00`)
    const sunday = new Date(day)
    sunday.setDate(day.getDate() - day.getDay())
    const key = sunday.toISOString().slice(0, 10)
    const bucket = byWeek.get(key)
    if (bucket) bucket.push(cell)
    else byWeek.set(key, [cell])
  }
  for (const cells of byWeek.values()) {
    if (cells.some((cell) => cell.seconds > 0)) continue
    const middle = cells[Math.floor(cells.length / 2)]
    if (middle) middle.seconds = 25 * 60
  }

  const weeks: ActivityWeek[] = []
  let current: (ActivityCell | null)[] = Array.from({ length: 7 }, () => null)
  let slot = new Date(raw[0]?.date ?? today).getDay()
  for (const cell of raw) {
    current[slot] = cell
    slot += 1
    if (slot === 7) {
      weeks.push({ cells: current })
      current = Array.from({ length: 7 }, () => null)
      slot = 0
    }
  }
  if (slot !== 0) weeks.push({ cells: current })
  return weeks
}
