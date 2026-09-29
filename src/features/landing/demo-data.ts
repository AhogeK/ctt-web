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
      // contradiction the user caught once before with the total).
      row('11', 'ctt-web', 'TypeScript', 52, start(0, 14, 5)),
      row('12', 'ctt-web', 'Vue', 79, start(0, 11, 40)),
      row('13', 'code-time-tracker', 'Kotlin', 74, start(0, 9, 12)),
      row('21', 'code-time-tracker', 'Kotlin', 96, start(1, 15, 20)),
      row('22', 'ctt-server', 'Java', 44, start(1, 13, 2)),
    ],
    now,
  )
}
