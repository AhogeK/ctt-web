import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useRankedDistribution } from '../useRankedDistribution'

describe('useRankedDistribution', () => {
  it('keeps the backend order and computes each share of the total', () => {
    const { rows } = useRankedDistribution([
      { name: 'ctt-web', seconds: 40 },
      { name: 'ctt-server', seconds: 25 },
      { name: 'plugin', seconds: 35 },
    ])
    expect(rows.value.map((r) => r.name)).toEqual(['ctt-web', 'ctt-server', 'plugin'])
    expect(rows.value.map((r) => r.percent)).toEqual([40, 25, 35])
  })

  it('scales bar length to the LONGEST row, so rank 1 spans the track', () => {
    const { rows } = useRankedDistribution([
      { name: 'a', seconds: 40 },
      { name: 'b', seconds: 20 },
      { name: 'c', seconds: 10 },
    ])
    expect(rows.value.map((r) => r.barPercent)).toEqual([100, 50, 25])
  })

  it('folds the sub-0.1% tail into one aggregate row that keeps every name', () => {
    const total = 100 * 3600
    const { rows } = useRankedDistribution([
      { name: 'a', seconds: Math.round(total * 0.6) },
      { name: 'b', seconds: Math.round(total * 0.3) },
      { name: 'tiny-1', seconds: Math.round(total * 0.0005) },
      { name: 'tiny-2', seconds: Math.round(total * 0.0004) },
    ])

    expect(rows.value.map((r) => r.name)).toEqual(['a', 'b', 'Others'])
    const others = rows.value[2]!
    // The folded entries stay reachable — this is what the row's popover lists.
    expect(others.folded.map((f) => f.name)).toEqual(['tiny-1', 'tiny-2'])
    // Invariant: the aggregate's share IS the sum of the shares it swallowed.
    expect(others.percent).toBeCloseTo(
      others.folded.reduce((acc, f) => acc + f.percent, 0),
      10,
    )
    // ...and by construction it sits under the folding floor while the folded
    // entries individually sit under the same floor.
    expect(others.percent).toBeLessThan(0.1)
    expect(others.folded.every((f) => f.percent < 0.1 && f.percent > 0)).toBe(true)
    // The aggregate row is ranked exactly like a real one.
    expect(others.barPercent).toBeLessThan(rows.value[0]!.barPercent)
    expect(others.folded.every((f) => f.percent > 0)).toBe(true)
  })

  it('keeps a bucket sitting exactly on the floor as its own row', () => {
    const total = 100 * 3600
    const { rows } = useRankedDistribution([
      { name: 'a', seconds: Math.round(total * 0.899) },
      { name: 'exactly-floor', seconds: Math.round(total * 0.1) },
    ])
    expect(rows.value.map((r) => r.name)).toEqual(['a', 'exactly-floor'])
  })

  it('honours a custom aggregate label and folding floor', () => {
    const total = 100 * 3600
    const { rows } = useRankedDistribution(
      [
        { name: 'a', seconds: Math.round(total * 0.9) },
        { name: 'b', seconds: Math.round(total * 0.05) },
      ],
      { minPercent: 10, aggregateLabel: 'Rest' },
    )
    expect(rows.value.map((r) => r.name)).toEqual(['a', 'Rest'])
  })

  it('returns no rows for an empty or all-zero distribution instead of NaN', () => {
    expect(useRankedDistribution([]).rows.value).toEqual([])

    const { rows } = useRankedDistribution([
      { name: 'a', seconds: 0 },
      { name: 'b', seconds: 0 },
    ])
    expect(rows.value).toEqual([])
    expect(rows.value.some((r) => Number.isNaN(r.percent))).toBe(false)
  })

  it('recomputes when the entries change (a new window re-ranks)', () => {
    const entries = ref([
      { name: 'a', seconds: 90 },
      { name: 'b', seconds: 10 },
    ])
    const { rows, totalSeconds } = useRankedDistribution(entries)
    expect(rows.value.map((r) => r.name)).toEqual(['a', 'b'])

    // A narrower window drops the dominant project: the ranking, the shares and
    // the bar scale all have to follow it.
    entries.value = [
      { name: 'b', seconds: 60 },
      { name: 'c', seconds: 40 },
    ]
    expect(rows.value.map((r) => r.name)).toEqual(['b', 'c'])
    expect(rows.value.map((r) => r.barPercent)).toEqual([100, 66.66666666666666])
    expect(totalSeconds.value).toBe(100)
  })
})
