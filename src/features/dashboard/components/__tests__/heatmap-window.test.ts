import { describe, expect, it } from 'vite-plus/test'
import { heatmapRenderWindow, countWeekColumns, MONDAY_BACKFILL } from '../heatmap-window'

/** Build dense yyyy-MM-dd points covering [start, end] with `seconds` each. */
function densePoints(start: string, end: string, seconds = 3600): Array<{ date: string; seconds: number }> {
  const points: Array<{ date: string; seconds: number }> = []
  const cur = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)
  while (cur.getTime() <= last.getTime()) {
    const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
    points.push({ date: iso, seconds })
    cur.setDate(cur.getDate() + 1)
  }
  return points
}

describe('heatmapRenderWindow', () => {
  it('trims a 14-year All-time range to the trailing 366-day span', () => {
    // Dense 2013-01-01..2026-09-01 — far longer than one render window.
    const points = densePoints('2013-01-01', '2026-09-01')
    const window = heatmapRenderWindow(points)

    // Trailing window must keep the last point (today) and cut ~366 days back.
    expect(window[window.length - 1]!.date).toBe('2026-09-01')
    expect(window.length).toBeLessThanOrEqual(372) // 366 + up to 6 backfill days
    expect(new Date(`${window[0]!.date}T00:00:00`).getFullYear()).toBeGreaterThanOrEqual(2025)
  })

  it('keeps all 366 points of a leap year (no dropped Jan 1)', () => {
    const points = densePoints('2024-01-01', '2024-12-31')
    const window = heatmapRenderWindow(points)
    expect(window).toHaveLength(366)
    expect(window[0]!.date).toBe('2024-01-01')
    expect(window[365]!.date).toBe('2024-12-31')
  })

  it('keeps a short range untouched (under the window span)', () => {
    const points = densePoints('2026-08-01', '2026-08-31')
    const window = heatmapRenderWindow(points)
    expect(window).toHaveLength(31)
    expect(window[0]!.date).toBe('2026-08-01')
  })

  it('returns an empty window for empty input', () => {
    expect(heatmapRenderWindow([])).toEqual([])
  })
})

describe('countWeekColumns', () => {
  it('returns 52-54 columns for a full rolling 12-month window', () => {
    // 2025-09-02..2026-09-01 span; column count derives from the real dates.
    const points = densePoints('2025-09-02', '2026-09-01')
    const cols = countWeekColumns(points)
    expect(cols).toBeGreaterThanOrEqual(52)
    expect(cols).toBeLessThanOrEqual(54)
  })
  it('counts 53 columns for a leap year starting on Monday', () => {
    // 2024 leap year: Jan 1 (Mon) .. Dec 31 (Tue) → 366 days = exactly 53
    // Monday-started weeks (52 full + 2 days).
    const points = densePoints('2024-01-01', '2024-12-31')
    expect(countWeekColumns(points)).toBe(53)
  })

  it('counts 54 columns for a leap year starting on Sunday (grid overflow)', () => {
    // 2012: Jan 1 (Sun) backfills to Mon Dec 26 2011; 366 + 6 = 372 days
    // = 54 Monday-started weeks. A hard 53 would clip the last column.
    const overflow = densePoints('2012-01-01', '2012-12-31')
    expect(countWeekColumns(overflow)).toBe(54)
  })

  it('counts a single column for a range inside one week', () => {
    // 2026-08-03 is a Monday; a 7-day span fits one column.
    const points = densePoints('2026-08-03', '2026-08-09')
    expect(countWeekColumns(points)).toBe(1)
  })
})

describe('MONDAY_BACKFILL', () => {
  it('exposes the Monday-backfill day count', () => {
    expect(MONDAY_BACKFILL).toBeGreaterThanOrEqual(0)
    expect(MONDAY_BACKFILL).toBeLessThanOrEqual(6)
  })
})
