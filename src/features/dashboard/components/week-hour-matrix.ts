import type { WeekHourResponse } from '@/lib/schemas/stats.schema'

/**
 * WeekHour matrix helpers — pure cell-mapping math for the 7×24 weekly
 * activity heatmap, extracted so the zero-fill rules are unit-testable.
 *
 * The backend returns only NON-ZERO cells (average seconds per ISO weekday ×
 * hour) plus `weekdayCounts` (how many times each weekday appeared in the
 * window — the averaging divisor). The chart needs the full 7×24 grid with
 * silent cells where nothing was coded.
 */

/** ISO weekday labels, index 0 = Monday (1) .. 6 = Sunday (7). */
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** Total cells in the full matrix. */
export const WEEK_HOUR_CELLS = 7 * 24

export interface WeekHourCell {
  /** ISO weekday 1..7 */
  dayOfWeek: number
  /** Hour 0..23 */
  hour: number
  /** Average seconds; 0 for silent cells */
  averageSeconds: number
  /** Weekday appearances in the window (the divisor) — 0 when the weekday never appeared */
  weekdayCount: number
}

/**
 * Build the full 7×24 matrix from the sparse backend response.
 *
 * Every (dayOfWeek, hour) pair gets a cell: a backend point fills its value,
 * any missing pair zero-fills. The divisor comes from `weekdayCounts`, which
 * the backend returns keyed "1".."7" in arbitrary order — normalize to ISO
 * order here so render code never depends on object iteration order.
 */
export function buildWeekHourMatrix(response: WeekHourResponse): WeekHourCell[] {
  const cellByKey: Record<string, WeekHourCell> = {}
  for (const point of response.points) {
    const key = `${point.dayOfWeek}:${point.hour}`
    cellByKey[key] = {
      dayOfWeek: point.dayOfWeek,
      hour: point.hour,
      averageSeconds: point.averageSeconds,
      weekdayCount: response.weekdayCounts[String(point.dayOfWeek)] ?? 0,
    }
  }

  const cells: WeekHourCell[] = []
  for (let day = 1; day <= 7; day++) {
    const weekdayCount = response.weekdayCounts[String(day)] ?? 0
    for (let hour = 0; hour < 24; hour++) {
      cells.push(cellByKey[`${day}:${hour}`] ?? { dayOfWeek: day, hour, averageSeconds: 0, weekdayCount })
    }
  }
  return cells
}

/** How many weekdays actually appear in the window (denominator sanity). */
export function windowWeekdayCount(response: WeekHourResponse): number {
  return Object.keys(response.weekdayCounts).length
}
