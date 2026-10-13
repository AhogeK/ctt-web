/**
 * Long-term trend baselines — the pure math behind the Long-term trend panel:
 * a centered weekly average for the smoothed line, the whole-window mean for
 * the dashed reference level, and the recent-vs-window change for the delta
 * badge.
 *
 * Split from the panel so every boundary is unit-testable: windows shrink at
 * both ends of the range, zero-second days are real values (not gaps), a
 * short account history still yields a recent figure, and a missing or zero
 * baseline yields null rather than an invented percentage. It also owns the
 * average levels' display rule (see {@link formatAverageDuration}).
 */

import { formatDuration } from '@/lib/utils'

/** Half-width of the centered weekly window — 3 days on each side. */
export const WEEKLY_RADIUS = 3

/** Days the "recent" figure covers when the history is at least this long. */
export const RECENT_DAYS = 30

/**
 * Centered 7-day mean per day, same length and order as the input. Windows
 * shrink where history runs out (day 0 averages days 0–3), so the line never
 * invents data outside the range. Zero-second days pull their neighbourhood
 * down like any other value.
 */
export function centeredWeeklyAverage(values: readonly number[], radius = WEEKLY_RADIUS): number[] {
  return values.map((_, index) => {
    const from = Math.max(0, index - radius)
    const to = Math.min(values.length, index + radius + 1)
    let sum = 0
    for (let i = from; i < to; i++) sum += values[i]!
    return sum / (to - from)
  })
}

/** Mean of every value in seconds — null when there is nothing to average. */
export function windowMeanSeconds(values: readonly number[]): number | null {
  if (values.length === 0) return null
  let sum = 0
  for (const value of values) sum += value
  return sum / values.length
}

/**
 * Mean of the last `days` values in seconds — the whole history when it is
 * shorter than the window (the panel prints the real span) and null when the
 * history is empty.
 */
export function recentMeanSeconds(values: readonly number[], days = RECENT_DAYS): number | null {
  if (values.length === 0) return null
  return windowMeanSeconds(values.slice(Math.max(0, values.length - days)))
}

/**
 * Percent change from `baseline` to `current` — null when either side is
 * missing or the baseline is zero (a percentage against it would claim an
 * infinite change). The signed result feeds the summary delta line's
 * formatter and direction helpers, so the badge reads exactly like the
 * summary cards'.
 */
export function changePercent(current: number | null, baseline: number | null): number | null {
  if (current === null || baseline === null || baseline <= 0) return null
  return ((current - baseline) / baseline) * 100
}

/**
 * Format an average level: seconds are kept as a two-digit field
 * (`4h 32m 08s`) and the field drops entirely when the value lands on :00
 * (`4h 32m`). The value rounds to whole seconds FIRST — `formatDuration`
 * takes whole seconds, and a float mean would otherwise leak its decimals
 * into the label.
 */
export function formatAverageDuration(seconds: number): string {
  const whole = Math.round(seconds)
  const remaining = whole % 60
  if (remaining === 0) return formatDuration(whole)
  const minutes = Math.floor(whole / 60) % 60
  const hours = Math.floor(whole / 3600)
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  parts.push(`${String(remaining).padStart(2, '0')}s`)
  return parts.join(' ')
}
