import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  getStatsAchievements,
  getStatsDistribution,
  getStatsHeatmap,
  getStatsHeatmapYears,
  getStatsHourly,
  getStatsIdeFilters,
  getStatsRecent,
  getStatsStreaks,
  getStatsSummary,
  DEFAULT_RECENT_LIMIT,
  type StatsFilterParams,
} from '@/lib/api/stats'
import type { DistributionType } from '@/lib/schemas/stats.schema'

/**
 * Query key factories — keys isolate by endpoint + params so caches never
 * collide across dimensions. The origin filter (deviceId / ideName, mutually
 * exclusive) is part of the key: switching filters yields independent cache
 * entries.
 */
export const STATS_QUERY_KEYS = {
  summary: (filter?: StatsFilterParams) => ['stats', 'summary', filterKey(filter)] as const,
  heatmap: (start?: string, end?: string, filter?: StatsFilterParams) =>
    ['stats', 'heatmap', start ?? 'auto', end ?? 'auto', filterKey(filter)] as const,
  streaks: (filter?: StatsFilterParams) => ['stats', 'streaks', filterKey(filter)] as const,
  distribution: (type: DistributionType, filter?: StatsFilterParams) =>
    ['stats', 'distribution', type, filterKey(filter)] as const,
  hourly: (filter?: StatsFilterParams) => ['stats', 'hourly', filterKey(filter)] as const,
  recent: (limit: number, filter?: StatsFilterParams) => ['stats', 'recent', limit, filterKey(filter)] as const,
  achievements: () => ['stats', 'achievements'] as const,
  heatmapYears: () => ['stats', 'heatmap-years'] as const,
  ideFilters: () => ['stats', 'ide-filters'] as const,
} as const

/** Stable key fragment for the origin filter ('all' when unfiltered). */
function filterKey(filter?: StatsFilterParams): string {
  return filter?.deviceId ?? filter?.ideName ?? 'all'
}

/** Cache window for summary / heatmap / achievements — aligns with the server's 60s cache. */
const STATS_LONG_STALE_TIME = 1000 * 60
/**
 * Coding activity summary (today / daily average / week / month / year /
 * lifetime totals in seconds).
 *
 * @param params - Optional origin filter (deviceId / ideName, mutually
 * exclusive). Accepts a plain object or a reactive getter; the query key
 * re-resolves when params change, so passing a computed ref drives a refetch.
 */
export function useStatsSummary(params: MaybeRefOrGetter<StatsFilterParams> = {}) {
  return useQuery({
    queryKey: computed(() => STATS_QUERY_KEYS.summary(toValue(params))),
    queryFn: () => getStatsSummary(toValue(params)),
    staleTime: STATS_LONG_STALE_TIME,
  })
}

/**
 * Daily coding heatmap over an inclusive date range (dense, includes
 * zero-value days). Defaults to this calendar year server-side.
 */
export function useStatsHeatmap(params: MaybeRefOrGetter<{ start?: string; end?: string } & StatsFilterParams> = {}) {
  return useQuery({
    queryKey: computed(() => {
      const p = toValue(params)
      return STATS_QUERY_KEYS.heatmap(p.start, p.end, p)
    }),
    queryFn: () => {
      const p = toValue(params)
      return getStatsHeatmap(p)
    },
    staleTime: STATS_LONG_STALE_TIME,
  })
}

/**
 * Current and longest consecutive coding day streaks.
 */
export function useStatsStreaks(params: MaybeRefOrGetter<StatsFilterParams> = {}) {
  return useQuery({
    queryKey: computed(() => STATS_QUERY_KEYS.streaks(toValue(params))),
    queryFn: () => getStatsStreaks(toValue(params)),
    staleTime: 1000 * 30,
  })
}

/**
 * Coding duration distribution by dimension (buckets ordered by duration
 * descending).
 */
export function useStatsDistribution(type: DistributionType, params: MaybeRefOrGetter<StatsFilterParams> = {}) {
  return useQuery({
    queryKey: computed(() => STATS_QUERY_KEYS.distribution(type, toValue(params))),
    queryFn: () => getStatsDistribution(type, toValue(params)),
    staleTime: 1000 * 30,
  })
}

/**
 * Per-hour average coding seconds across active days.
 */
export function useStatsHourly(params: MaybeRefOrGetter<StatsFilterParams> = {}) {
  return useQuery({
    queryKey: computed(() => STATS_QUERY_KEYS.hourly(toValue(params))),
    queryFn: () => getStatsHourly(toValue(params)),
    staleTime: 1000 * 30,
  })
}

/**
 * Most recent coding sessions (start time descending).
 */
export function useStatsRecent(params: MaybeRefOrGetter<{ limit?: number } & StatsFilterParams> = {}) {
  return useQuery({
    queryKey: computed(() => {
      const p = toValue(params)
      return STATS_QUERY_KEYS.recent(p.limit ?? DEFAULT_RECENT_LIMIT, p)
    }),
    queryFn: () => {
      const p = toValue(params)
      return getStatsRecent(p)
    },
    staleTime: 1000 * 30,
  })
}

/**
 * Achievement badges with unlock state and progress. Server caches for 60s —
 * the aligned client staleTime avoids hammering the endpoint on re-mounts.
 */
export function useStatsAchievements() {
  return useQuery({
    queryKey: STATS_QUERY_KEYS.achievements(),
    queryFn: () => getStatsAchievements(),
    staleTime: STATS_LONG_STALE_TIME,
  })
}

/**
 * Distinct registered IDE names for the dashboard IDE filter dropdown
 * (alphabetical; includes revoked devices; never "Unknown IDE").
 */
export function useStatsIdeFilters() {
  return useQuery({
    queryKey: STATS_QUERY_KEYS.ideFilters(),
    queryFn: () => getStatsIdeFilters(),
    staleTime: 1000 * 60,
  })
}

/**
 * Calendar years containing valid coding sessions, newest first — feed for
 * the heatmap year dropdown. Server caches for 60s; the aligned client
 * staleTime avoids hammering the endpoint on re-mounts.
 */
export function useStatsHeatmapYears() {
  return useQuery({
    queryKey: STATS_QUERY_KEYS.heatmapYears(),
    queryFn: () => getStatsHeatmapYears(),
    staleTime: STATS_LONG_STALE_TIME,
  })
}
