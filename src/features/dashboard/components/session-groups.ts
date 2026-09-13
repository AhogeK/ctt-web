/**
 * Recent-session row model — grouping, ordering and labelling extracted from
 * `RecentSessionsPanel` so the rules are unit-testable.
 *
 * Three of these rules exist because the real data forced them, not by taste:
 *
 * 1. **Group by LOCAL calendar day.** `startTime` is UTC. A session at
 *    `2026-09-08T20:00Z` is `2026-09-09 04:00` at UTC+8, i.e. the *next* day
 *    locally. Slicing the ISO string would file it under Sept 8 and contradict
 *    every other panel, which localises through `timezoneOffset`.
 * 2. **Order deterministically.** The server sorts by `startTime` only; ties
 *    (several sessions starting the same second, which the real data has) fall
 *    back to database row order, so the same request can theoretically shuffle.
 *    A client-side tiebreak on project name pins it.
 * 3. **Count, never sum.** Parallel sessions are legitimate, so a day's
 *    durations overlap in wall-clock time. A day total would be a number larger
 *    than the time actually spent coding — the same trap as the distribution
 *    panels' "super-linear" totals.
 */

import type { RecentSession } from '@/lib/schemas/stats.schema'

/** One rendered row: a session plus the local time it started. */
export interface SessionRow {
  /** Server primary key — stable Vue key, unique per session. */
  id: string
  /** Project or repository name, as returned by the server. */
  projectName: string
  /** Primary programming language. */
  language: string
  /** Raw duration in seconds (formatting belongs to the view). */
  durationSeconds: number
  /** Local start time as `HH:mm`. */
  time: string
  /** Raw ISO start time, for the caller to format as an absolute hover title. */
  startedAt: string
}

/** A local calendar day and the sessions that started in it. */
export interface SessionDayGroup {
  /** Group key, `yyyy-MM-dd` in local time. */
  key: string
  /** Heading text: `Today` / `Yesterday` / `Sep 8`. */
  label: string
  /** Full local date, for the heading's hover title. */
  fullLabel: string
  rows: SessionRow[]
}

/**
 * Month names are pinned to `en-US` rather than the runtime locale, matching
 * `HeatmapChart` / `TrendChart`: the readouts are asserted in tests and mixed into
 * English panel copy, so a non-English host locale would change the UI and break
 * those assertions.
 */
const LOCALE = 'en-US'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Local calendar-day key (`yyyy-MM-dd`) — deliberately not the UTC one. */
export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Heading for a day, relative to `now`.
 *
 * Only *today* and *yesterday* get words: beyond that a date is more useful
 * than "5d ago", because the panel is a log and the reader is locating a
 * specific day, not measuring recency.
 */
export function dayLabel(date: Date, now: Date): string {
  const key = localDayKey(date)
  if (key === localDayKey(now)) return 'Today'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === localDayKey(yesterday)) return 'Yesterday'

  const sameYear = date.getFullYear() === now.getFullYear()
  const month = date.toLocaleDateString(LOCALE, { month: 'short' })
  return sameYear ? `${month} ${date.getDate()}` : `${month} ${date.getDate()}, ${date.getFullYear()}`
}

/**
 * Group sessions into local days, newest day first, newest session first
 * within a day.
 *
 * The comparison is a **total order**: start time, then project, then language,
 * then session id. The id is what makes it total — `Array.prototype.sort` is
 * only stable within one array, so without a final unique key, two sessions
 * matching on every other field would keep whatever order the server happened
 * to return, which is the nondeterminism this exists to remove (the server
 * sorts by `startTime` alone).
 *
 * Sessions whose `startTime` cannot be parsed are dropped rather than grouped:
 * the schema types it as a plain string, so an unparseable value would otherwise
 * produce a group labelled `Invalid Date NaN`.
 */
export function groupSessions(sessions: RecentSession[], now: Date = new Date()): SessionDayGroup[] {
  const ordered = sessions
    .map((session) => ({ session, startedAt: new Date(session.startTime) }))
    .filter(({ startedAt }) => !Number.isNaN(startedAt.getTime()))
    .sort((a, b) => {
      const byTime = b.startedAt.getTime() - a.startedAt.getTime()
      if (byTime !== 0) return byTime
      const byProject = a.session.projectName.localeCompare(b.session.projectName)
      if (byProject !== 0) return byProject
      const byLanguage = a.session.language.localeCompare(b.session.language)
      if (byLanguage !== 0) return byLanguage
      return a.session.sessionId.localeCompare(b.session.sessionId)
    })

  const groups = new Map<string, SessionDayGroup>()
  for (const { session, startedAt } of ordered) {
    const key = localDayKey(startedAt)
    let group = groups.get(key)
    if (group === undefined) {
      group = {
        key,
        label: dayLabel(startedAt, now),
        fullLabel: startedAt.toLocaleDateString(LOCALE, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        rows: [],
      }
      groups.set(key, group)
    }
    group.rows.push({
      id: session.sessionId,
      projectName: session.projectName,
      language: session.language,
      durationSeconds: session.durationSeconds,
      time: `${pad(startedAt.getHours())}:${pad(startedAt.getMinutes())}`,
      // The raw server value, not the parsed Date: the hover title goes through
      // the shared `formatDateTime` formatter, which takes an ISO string.
      startedAt: session.startTime,
    })
  }

  // Insertion order already runs newest-day-first because the sort is global.
  return [...groups.values()]
}

/**
 * Accessible summary of the panel, since the visual grouping carries meaning
 * that a screen reader cannot infer from a flat list of rows.
 */
export function sessionsAriaLabel(groups: SessionDayGroup[]): string {
  if (groups.length === 0) return 'Recent coding sessions: none'
  const total = groups.reduce((sum, group) => sum + group.rows.length, 0)
  const days = groups
    .map(
      (group) => `${group.label}: ${group.rows.map((r) => `${r.time} ${r.projectName} in ${r.language}`).join(', ')}`,
    )
    .join('. ')
  return `Recent coding sessions, ${total} across ${groups.length} ${groups.length === 1 ? 'day' : 'days'}. ${days}`
}
