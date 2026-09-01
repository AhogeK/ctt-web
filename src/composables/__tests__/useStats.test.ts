import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { ref, toValue } from 'vue'
import {
  useStatsAchievements,
  useStatsDistribution,
  useStatsHeatmap,
  useStatsHourly,
  useStatsRecent,
  useStatsStreaks,
  useStatsSummary,
} from '../useStats'

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn<(...args: unknown[]) => unknown>(),
}))

vi.mock('@/lib/api/stats', () => ({
  getStatsSummary: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
  getStatsHeatmap: vi.fn<() => Promise<unknown>>(() => Promise.resolve({ points: [] })),
  getStatsStreaks: vi.fn<() => Promise<unknown>>(() => Promise.resolve({ current: 0, max: 0 })),
  getStatsDistribution: vi.fn<() => Promise<unknown>>(() => Promise.resolve({ type: 'LANGUAGES', entries: [] })),
  getStatsHourly: vi.fn<() => Promise<unknown>>(() => Promise.resolve({ points: [], activeDays: 0 })),
  getStatsRecent: vi.fn<() => Promise<unknown>>(() => Promise.resolve([])),
  getStatsAchievements: vi.fn<() => Promise<unknown>>(() => Promise.resolve([])),
  DEFAULT_RECENT_LIMIT: 20,
}))

import { useQuery } from '@tanstack/vue-query'

const mockUseQuery = vi.mocked(useQuery)

type QueryConfig = {
  queryKey?: unknown
  queryFn?: () => Promise<unknown>
  staleTime?: number
}

let queryConfig: QueryConfig | null = null

function setupQueryMock() {
  queryConfig = null
  // @ts-expect-error - mock implementation doesn't need to match exact TanStack Query types
  mockUseQuery.mockImplementation((config: QueryConfig) => {
    queryConfig = config
    return {
      data: ref(undefined),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
      refetch: vi.fn<() => Promise<unknown>>(),
    }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  setupQueryMock()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useStatsSummary', () => {
  it('uses the summary key with 60s staleTime', () => {
    useStatsSummary({ deviceId: 'dev-1' })
    expect(toValue(queryConfig?.queryKey)).toEqual(['stats', 'summary', 'dev-1'])
    expect(queryConfig?.staleTime).toBe(60_000)
  })

  it('re-resolves the key when the deviceId param is reactive', () => {
    const deviceId = ref<string | undefined>(undefined)
    // Pass a getter so the resolved params object re-reads deviceId.value.
    useStatsSummary(() => ({ deviceId: deviceId.value }))

    expect(toValue(queryConfig?.queryKey)).toEqual(['stats', 'summary', 'all'])

    deviceId.value = 'dev-2'
    expect(toValue(queryConfig?.queryKey)).toEqual(['stats', 'summary', 'dev-2'])
  })
})

describe('useStatsHeatmap', () => {
  it('keys by range and deviceId with 60s staleTime', () => {
    useStatsHeatmap({ start: '2026-09-01', end: '2026-09-15', deviceId: 'dev-1' })
    expect(toValue(queryConfig?.queryKey)).toEqual(['stats', 'heatmap', '2026-09-01', '2026-09-15', 'dev-1'])
    expect(queryConfig?.staleTime).toBe(60_000)
  })

  it('re-keys when the range changes reactively', () => {
    const range = ref({ start: '2026-01-01', end: '2026-09-15' })
    useStatsHeatmap(range)

    expect(toValue(queryConfig?.queryKey)).toEqual(['stats', 'heatmap', '2026-01-01', '2026-09-15', 'all'])

    range.value = { start: '2026-02-01', end: '2026-03-01' }
    expect(toValue(queryConfig?.queryKey)).toEqual(['stats', 'heatmap', '2026-02-01', '2026-03-01', 'all'])
  })
})

describe('staleTime by endpoint', () => {
  it('uses 30s for streaks / distribution / hourly / recent', () => {
    useStatsStreaks({})
    expect(queryConfig?.staleTime).toBe(30_000)

    useStatsDistribution('LANGUAGES', {})
    expect(queryConfig?.staleTime).toBe(30_000)

    useStatsHourly({})
    expect(queryConfig?.staleTime).toBe(30_000)

    useStatsRecent({ limit: 5 })
    expect(queryConfig?.staleTime).toBe(30_000)
  })

  it('uses 60s for achievements (server cache alignment)', () => {
    useStatsAchievements()
    expect(queryConfig?.staleTime).toBe(60_000)
    expect(toValue(queryConfig?.queryKey)).toEqual(['stats', 'achievements'])
  })
})

describe('distribution type keys', () => {
  it('isolates by distribution type', () => {
    useStatsDistribution('DEVICES', { deviceId: 'dev-1' })
    expect(toValue(queryConfig?.queryKey)).toEqual(['stats', 'distribution', 'DEVICES', 'dev-1'])

    useStatsDistribution('IDES', {})
    expect(toValue(queryConfig?.queryKey)).toEqual(['stats', 'distribution', 'IDES', 'all'])
  })
})

describe('recent limit default', () => {
  it('uses DEFAULT_RECENT_LIMIT (20) when limit omitted', () => {
    useStatsRecent({})
    expect(toValue(queryConfig?.queryKey)).toEqual(['stats', 'recent', 20, 'all'])
  })
})
