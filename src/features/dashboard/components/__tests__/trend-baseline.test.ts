import { describe, expect, it } from 'vite-plus/test'
import {
  centeredWeeklyAverage,
  changePercent,
  formatAverageDuration,
  RECENT_DAYS,
  recentMeanSeconds,
  WEEKLY_RADIUS,
  windowMeanSeconds,
} from '../trend-baseline'

describe('constants', () => {
  it('keeps the radius and recent window at the documented values', () => {
    expect(WEEKLY_RADIUS).toBe(3)
    expect(RECENT_DAYS).toBe(30)
  })
})

describe('centeredWeeklyAverage', () => {
  it('returns an empty array for no days', () => {
    expect(centeredWeeklyAverage([])).toEqual([])
  })

  it('returns the value itself for a single day', () => {
    expect(centeredWeeklyAverage([3600])).toEqual([3600])
  })

  it('centers the window and shrinks it at both ends', () => {
    // A single 1h day in the middle of nine zeros: the mirror image holds.
    const week = centeredWeeklyAverage([0, 0, 0, 0, 3600, 0, 0, 0, 0])
    expect(week[0]).toBe(0) // window 0–3
    expect(week[1]).toBeCloseTo(3600 / 5, 6) // 0–4
    expect(week[2]).toBeCloseTo(3600 / 6, 6) // 0–5
    expect(week[3]).toBeCloseTo(3600 / 7, 6) // full 7-day window
    expect(week[4]).toBeCloseTo(3600 / 7, 6)
    expect(week[5]).toBeCloseTo(3600 / 7, 6)
    expect(week[6]).toBeCloseTo(3600 / 6, 6)
    expect(week[7]).toBeCloseTo(3600 / 5, 6)
    expect(week[8]).toBe(0) // window 5–8, the peak already out of range
  })

  it('treats zero days as values, not gaps', () => {
    // Two coding days then five zeros: the average decays to zero.
    expect(centeredWeeklyAverage([3600, 3600, 0, 0, 0, 0, 0]).at(-1)).toBe(0)
  })

  it('keeps the input length and order', () => {
    const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const week = centeredWeeklyAverage(values)
    expect(week).toHaveLength(values.length)
    expect(week[5]).toBeCloseTo(35 / 7, 6) // indices 2–8
  })
})

describe('windowMeanSeconds', () => {
  it('is null without any days', () => {
    expect(windowMeanSeconds([])).toBeNull()
  })

  it('averages every value, zero days included', () => {
    expect(windowMeanSeconds([3600, 0])).toBe(1800)
    expect(windowMeanSeconds([0, 0, 0])).toBe(0)
    expect(windowMeanSeconds([3600, 7200, 0])).toBe(3600)
  })
})

describe('recentMeanSeconds', () => {
  it('is null without any days', () => {
    expect(recentMeanSeconds([])).toBeNull()
  })

  it('averages the whole history when it is shorter than the window', () => {
    expect(recentMeanSeconds([3600, 7200])).toBe(5400)
  })

  it('averages only the trailing window when the history is longer', () => {
    const values = [...Array.from({ length: 10 }, () => 3600), ...Array.from({ length: 30 }, () => 7200)]
    expect(recentMeanSeconds(values)).toBe(7200)
    expect(windowMeanSeconds(values)).toBe(6300)
  })

  it('honors a custom window length', () => {
    expect(recentMeanSeconds([3600, 3600, 7200], 2)).toBe(5400)
  })
})

describe('changePercent', () => {
  it('is null when either side is missing', () => {
    expect(changePercent(null, 3600)).toBeNull()
    expect(changePercent(3600, null)).toBeNull()
    expect(changePercent(null, null)).toBeNull()
  })

  it('is null against a zero or negative baseline', () => {
    expect(changePercent(3600, 0)).toBeNull()
    expect(changePercent(0, 0)).toBeNull()
  })

  it('signs the change and handles an empty recent period', () => {
    expect(changePercent(10800, 5400)).toBe(100)
    expect(changePercent(5400, 7200)).toBe(-25)
    expect(changePercent(0, 3600)).toBe(-100)
  })
})

describe('formatAverageDuration', () => {
  it('keeps seconds as a two-digit field and rounds to whole seconds first', () => {
    expect(formatAverageDuration(16145.95)).toBe('4h 29m 06s')
    expect(formatAverageDuration(368)).toBe('6m 08s')
    expect(formatAverageDuration(8)).toBe('08s')
  })

  it('drops the seconds field when the value lands on :00', () => {
    expect(formatAverageDuration(16140)).toBe('4h 29m')
    expect(formatAverageDuration(3600)).toBe('1h')
    expect(formatAverageDuration(0)).toBe('0s')
  })

  it('keeps hours and minutes unpadded like every other duration', () => {
    expect(formatAverageDuration(6181)).toBe('1h 43m 01s')
  })
})
