import { describe, expect, it } from 'vitest'
import { formatScore } from '../score'

describe('formatScore', () => {
  it('prints durations as durations for the time dimensions', () => {
    // Raw seconds must never reach the page: 2484000 is three days minus an hour.
    expect(formatScore(3600, 'TOTAL')).toBe('1h')
    expect(formatScore(90, 'TOTAL')).toBe('1m 30s')
    expect(formatScore(45, 'TOTAL')).toBe('45s')
    expect(formatScore(7200, 'NIGHT_OWL')).toBe('2h')
    expect(formatScore(7200, 'EARLY_BIRD')).toBe('2h')
  })

  it('counts days for STREAK, singular at one', () => {
    expect(formatScore(33, 'STREAK')).toBe('33 days')
    expect(formatScore(1, 'STREAK')).toBe('1 day')
    expect(formatScore(0, 'STREAK')).toBe('0 days')
  })

  it('marks the sign of a GROWTH delta, because direction is the fact', () => {
    // GROWTH is `thisWeek - lastWeek` in seconds: a negative score means the reader
    // slipped. Printing the bare magnitude would report a decline as an improvement.
    expect(formatScore(5400, 'GROWTH')).toBe('+1h 30m')
    expect(formatScore(-5400, 'GROWTH')).toBe('1h 30m down')
    // Neither mark: `+0s` would read as an increase, which is the ambiguity the sign
    // exists to remove in the first place.
    expect(formatScore(0, 'GROWTH')).toBe('0s')
  })
})
