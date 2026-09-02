/**
 * Heatmap render-window helpers — pure date math extracted from
 * HeatmapChart so the geometry rules are unit-testable.
 *
 * The chart lays out Monday-first week columns. Two constraints drive the
 * helpers:
 * 1. Long ranges (All time = 14 years) must trim to a trailing window that
 *    still fills a GitHub-like grid — previously a hard `slice(-365)`,
 *    which silently dropped Jan 1 of leap years (366-point years).
 * 2. Column count must derive from the actual date span. A hard 53 breaks
 *    leap years whose Monday-backfilled grid spills into a 54th column
 *    (e.g. 2024: Jan 1 = Monday, 366 days → 54 weeks).
 */

import type { DailyStatPoint } from '@/lib/schemas/stats.schema'

/** Maximum trailing span kept for rendering (days). Covers any leap year. */
export const RENDER_WINDOW_DAYS = 366

/**
 * Monday-backfill extension: the grid starts on the Monday of the week
 * containing the first point — up to 6 extra days before it.
 */
export const MONDAY_BACKFILL = 6

/** Monday-backfilled grid start for the first rendered point. */
export function gridStartDate(firstDate: string): Date {
  const start = new Date(`${firstDate}T00:00:00`)
  const startDow = (start.getDay() + 6) % 7 // Mon = 0
  const gridStart = new Date(start)
  gridStart.setDate(gridStart.getDate() - startDow)
  return gridStart
}

/**
 * Trim dense points to the render window: the trailing `RENDER_WINDOW_DAYS`
 * days (or all of them when the span is shorter). Input must be in date
 * order; output keeps the same order.
 */
export function heatmapRenderWindow(points: DailyStatPoint[]): DailyStatPoint[] {
  if (points.length === 0) return []
  const last = points[points.length - 1]!
  const cutoff = new Date(`${last.date}T00:00:00`)
  cutoff.setDate(cutoff.getDate() - RENDER_WINDOW_DAYS)
  const firstKept = points.findIndex((p) => new Date(`${p.date}T00:00:00`).getTime() > cutoff.getTime())
  // findIndex cannot fail here: the last point itself is always > cutoff.
  return points.slice(firstKept)
}

/**
 * Number of Monday-started week columns the (already windowed) points span,
 * including the backfill days before the first point.
 */
export function countWeekColumns(points: DailyStatPoint[]): number {
  if (points.length === 0) return 0
  const first = points[0]!
  const last = points[points.length - 1]!
  const gridStart = gridStartDate(first.date)
  const totalDays = Math.round((new Date(`${last.date}T00:00:00`).getTime() - gridStart.getTime()) / 86_400_000) + 1
  return Math.ceil(totalDays / 7)
}
