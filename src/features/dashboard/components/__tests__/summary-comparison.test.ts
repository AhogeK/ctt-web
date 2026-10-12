import { describe, expect, it } from 'vite-plus/test'
import { Activity } from '@lucide/vue'
import type { SummaryStatItem } from '../summary-stat-fields'
import { comparisonDirection, deltaClass, deltaView, formatChangePercent } from '../summary-comparison'

function item(overrides: Partial<SummaryStatItem> = {}): SummaryStatItem {
  return { label: 'Today', seconds: 3600, icon: Activity, baseline: 'vs yesterday', ...overrides }
}

describe('comparisonDirection', () => {
  it('hides when there is no comparison at all (older server)', () => {
    expect(comparisonDirection(undefined)).toBeNull()
  })

  it('hides when the percent is null (no baseline: empty previous period / first day)', () => {
    expect(comparisonDirection({ previousSeconds: 0, changePercent: null })).toBeNull()
  })

  it('reads the direction from the value as displayed (one decimal)', () => {
    expect(comparisonDirection({ previousSeconds: 1, changePercent: 12.45 })).toBe('up')
    expect(comparisonDirection({ previousSeconds: 1, changePercent: -8 })).toBe('down')
    expect(comparisonDirection({ previousSeconds: 1, changePercent: 0 })).toBe('flat')
    // Rounds to 0.0 before the direction is read: not a misleading "up"/"down".
    expect(comparisonDirection({ previousSeconds: 1, changePercent: 0.04 })).toBe('flat')
    expect(comparisonDirection({ previousSeconds: 1, changePercent: -0.04 })).toBe('flat')
  })
})

describe('formatChangePercent', () => {
  it('shows one decimal, drops a trailing .0 and always carries a sign', () => {
    expect(formatChangePercent(12.45)).toBe('+12.5%')
    expect(formatChangePercent(8)).toBe('+8%')
    expect(formatChangePercent(-100)).toBe('-100%')
    expect(formatChangePercent(-74.67)).toBe('-74.7%')
    expect(formatChangePercent(0)).toBe('0%')
    expect(formatChangePercent(0.04)).toBe('0%')
  })
})

describe('deltaClass', () => {
  it('maps the international convention: green up (AA ink), red down, muted flat', () => {
    expect(deltaClass('up')).toBe('text-success-ink')
    expect(deltaClass('down')).toBe('text-destructive')
    expect(deltaClass('flat')).toBe('text-muted-foreground')
  })
})

describe('deltaView', () => {
  it('is null without a comparison, without a percent, or on the lifetime Total', () => {
    expect(deltaView(item())).toBeNull()
    expect(deltaView(item({ comparison: { previousSeconds: 0, changePercent: null } }))).toBeNull()
    expect(deltaView(item({ baseline: null, comparison: { previousSeconds: 7200, changePercent: -50 } }))).toBeNull()
  })

  it('carries direction, display text, colour and a named-baseline tooltip', () => {
    expect(deltaView(item({ comparison: { previousSeconds: 10200, changePercent: 20.59 } }))).toEqual({
      direction: 'up',
      text: '+20.6%',
      className: 'text-success-ink',
      title: 'Yesterday · 2h 50m',
    })
    expect(
      deltaView(item({ baseline: 'vs last week', comparison: { previousSeconds: 79200, changePercent: -15.15 } })),
    ).toEqual({
      direction: 'down',
      text: '-15.2%',
      className: 'text-destructive',
      title: 'Last week · 22h',
    })
  })
})
