import { describe, expect, it } from 'vitest'
import { formatPercent } from '../percent'

describe('formatPercent', () => {
  it('uses two decimals and trims trailing zeros for ordinary shares', () => {
    expect(formatPercent(41.666666)).toBe('41.67')
    expect(formatPercent(0.21)).toBe('0.21')
    expect(formatPercent(5)).toBe('5')
    expect(formatPercent(50)).toBe('50')
    expect(formatPercent(100)).toBe('100')
  })

  it('follows the value below the step so a real share never reads as 0', () => {
    // At a fixed two decimals every one of these is "0" — the same readout as
    // a bucket with no time at all.
    expect(formatPercent(0.0033)).toBe('0.0033')
    expect(formatPercent(0.0004)).toBe('0.0004')
    expect(formatPercent(0.000004)).toBe('0.000004')
  })

  it('keeps the value visible even under a coarser step', () => {
    // The time-of-day legend reads whole percents, but a bucket holding real
    // time must not be rounded down to 0% by that coarser step.
    expect(formatPercent(41.666666, 0)).toBe('42')
    expect(formatPercent(5, 0)).toBe('5')
    expect(formatPercent(0.4, 0)).toBe('0.4')
    expect(formatPercent(0.0033, 0)).toBe('0.0033')
  })

  it('reports a floor rather than zero when even the cap cannot express the value', () => {
    // Six decimals are the ceiling; anything smaller would round to zero, so
    // the readout states the floor instead of claiming there is no time.
    expect(formatPercent(2e-7)).toBe('<0.000001')
    expect(formatPercent(1e-9)).toBe('<0.000001')
    // Just above the floor still prints as a number.
    expect(formatPercent(0.000002)).toBe('0.000002')
  })

  it('bounds the readout width so the value lane stays fixed', () => {
    expect(Math.max(...[2e-7, 1e-9, 0.000012, 41.666666, 100].map((v) => formatPercent(v).length))).toBeLessThanOrEqual(
      10,
    )
  })

  it('prints zero and non-finite input as zero rather than NaN', () => {
    expect(formatPercent(0)).toBe('0')
    expect(formatPercent(-1)).toBe('0')
    expect(formatPercent(Number.NaN)).toBe('0')
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe('0')
  })
})
