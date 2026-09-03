import { describe, expect, it } from 'vite-plus/test'
import { buildWeekHourMatrix, WEEK_HOUR_CELLS, WEEKDAY_LABELS, windowWeekdayCount } from '../week-hour-matrix'
import type { WeekHourResponse } from '@/lib/schemas/stats.schema'

function response(
  points: WeekHourResponse['points'],
  weekdayCounts: WeekHourResponse['weekdayCounts'],
): WeekHourResponse {
  return { points, weekdayCounts }
}

describe('buildWeekHourMatrix', () => {
  it('produces the full 168-cell grid (7×24)', () => {
    const cells = buildWeekHourMatrix(response([], { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1 }))
    expect(cells).toHaveLength(WEEK_HOUR_CELLS)
  })

  it('zero-fills cells absent from the sparse backend response', () => {
    const cells = buildWeekHourMatrix(response([{ dayOfWeek: 2, hour: 10, averageSeconds: 1800 }], { '2': 1 }))
    expect(cells).toHaveLength(168)
    const tue10 = cells.find((c) => c.dayOfWeek === 2 && c.hour === 10)!
    expect(tue10.averageSeconds).toBe(1800)
    expect(tue10.weekdayCount).toBe(1)
    // A silent cell on the same weekday, different hour
    const tue11 = cells.find((c) => c.dayOfWeek === 2 && c.hour === 11)!
    expect(tue11.averageSeconds).toBe(0)
    // A weekday not present in counts gets divisor 0 and stays silent
    const sun0 = cells.find((c) => c.dayOfWeek === 7 && c.hour === 0)!
    expect(sun0.weekdayCount).toBe(0)
    expect(sun0.averageSeconds).toBe(0)
  })

  it('assigns the divisor from weekdayCounts for each populated cell', () => {
    const cells = buildWeekHourMatrix(
      response(
        [
          { dayOfWeek: 3, hour: 9, averageSeconds: 3600 },
          { dayOfWeek: 3, hour: 10, averageSeconds: 1800 },
        ],
        { '3': 2 },
      ),
    )
    const wed9 = cells.find((c) => c.dayOfWeek === 3 && c.hour === 9)!
    expect(wed9.weekdayCount).toBe(2)
  })

  it('tolerates arbitrary weekdayCounts key order (backend Map order)', () => {
    // Backend may return keys in any order; build must not depend on it.
    const cells = buildWeekHourMatrix(
      response([{ dayOfWeek: 1, hour: 8, averageSeconds: 900 }], { '4': 3, '1': 5, '7': 1 }),
    )
    const mon8 = cells.find((c) => c.dayOfWeek === 1 && c.hour === 8)!
    expect(mon8.weekdayCount).toBe(5)
    const thu0 = cells.find((c) => c.dayOfWeek === 4 && c.hour === 0)!
    expect(thu0.weekdayCount).toBe(3)
  })
})

describe('windowWeekdayCount', () => {
  it('counts distinct weekdays in the window', () => {
    expect(windowWeekdayCount(response([], { '2': 1, '3': 1 }))).toBe(2)
    expect(windowWeekdayCount(response([], {}))).toBe(0)
  })
})

describe('WEEKDAY_LABELS', () => {
  it('labels Monday first (ISO order)', () => {
    expect(WEEKDAY_LABELS[0]).toBe('Mon')
    expect(WEEKDAY_LABELS[6]).toBe('Sun')
  })
})
