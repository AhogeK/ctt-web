import { useQuery } from '@tanstack/vue-query'
import {
  getStatsAchievements,
  getStatsDistribution,
  getStatsHeatmap,
  getStatsHourly,
  getStatsRecent,
  getStatsStreaks,
  getStatsSummary,
  DEFAULT_RECENT_LIMIT,
} from '@/lib/api/stats'
import type { DistributionType } from '@/lib/schemas/stats.schema'

/**
 * Query key factories — keys isolate by endpoint + params so caches never
 * collide across dimensions. deviceId is part of the key: switching filters
 * yields independent cache entries.
 */
export const STATS_QUERY_KEYS = {
  summary: (deviceId?: string) => ['stats', 'summary', deviceId ?? 'all'] as const,
  heatmap: (start?: string, end?: string, deviceId?: string) =>
    ['stats', 'heatmap', start ?? 'auto', end ?? 'auto', deviceId ?? 'all'] as const,
  streaks: (deviceId?: string) => ['stats', 'streaks', deviceId ?? 'all'] as const,
  distribution: (type: DistributionType, deviceId?: string) =>
    ['stats', 'distribution', type, deviceId ?? 'all'] as const,
  hourly: (deviceId?: string) => ['stats', 'hourly', deviceId ?? 'all'] as const,
  recent: (limit: number, deviceId?: string) => ['stats', 'recent', limit, deviceId ?? 'all'] as const,
  achievements: () => ['stats', 'achievements'] as const,
} as const

/** Cache window for summary / heatmap / achievements — aligns with the server's 60s cache. */
const STATS_LONG_STALE_TIME = 1000 * 60

/**
 * Coding activity summary (today / daily average / week / month / year /
 * lifetime totals in seconds).
 *
 * @param params - Optional origin-device filter (static value; filters are
 * part of the query key, so changing devices yields a separate cache entry)
 */
export function useStatsSummary(params: { deviceId?: string } = {}) {
  return useQuery({
    queryKey: STATS_QUERY_KEYS.summary(params.deviceId),
    queryFn: () => getStatsSummary({ deviceId: params.deviceId }),
    staleTime: STATS_LONG_STALE_TIME,
  })
}

/**
 * Daily coding heatmap over an inclusive date range (dense, includes
 * zero-value days). Defaults to this calendar year server-side.
 */
export function useStatsHeatmap(params: { start?: string; end?: string; deviceId?: string } = {}) {
  return useQuery({
    queryKey: STATS_QUERY_KEYS.heatmap(params.start, params.end, params.deviceId),
    queryFn: () => getStatsHeatmap({ start: params.start, end: params.end, deviceId: params.deviceId }),
    staleTime: STATS_LONG_STALE_TIME,
  })
}

/**
 * Current and longest consecutive coding day streaks.
 */
export function useStatsStreaks(params: { deviceId?: string } = {}) {
  return useQuery({
    queryKey: STATS_QUERY_KEYS.streaks(params.deviceId),
    queryFn: () => getStatsStreaks({ deviceId: params.deviceId }),
    staleTime: 1000 * 30,
  })
}

/**
 * Coding duration distribution by dimension (buckets ordered by duration
 * descending).
 */
export function useStatsDistribution(type: DistributionType, params: { deviceId?: string } = {}) {
  return useQuery({
    queryKey: STATS_QUERY_KEYS.distribution(type, params.deviceId),
    queryFn: () => getStatsDistribution(type, { deviceId: params.deviceId }),
    staleTime: 1000 * 30,
  })
}

/**
 * Per-hour average coding seconds across active days.
 */
export function useStatsHourly(params: { deviceId?: string } = {}) {
  return useQuery({
    queryKey: STATS_QUERY_KEYS.hourly(params.deviceId),
    queryFn: () => getStatsHourly({ deviceId: params.deviceId }),
    staleTime: 1000 * 30,
  })
}

/**
 * Most recent coding sessions (start time descending).
 */
export function useStatsRecent(params: { limit?: number; deviceId?: string } = {}) {
  const limit = params.limit ?? DEFAULT_RECENT_LIMIT
  return useQuery({
    queryKey: STATS_QUERY_KEYS.recent(limit, params.deviceId),
    queryFn: () => getStatsRecent({ limit, deviceId: params.deviceId }),
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
