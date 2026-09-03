import { z } from 'zod'
import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import {
  AchievementSchema,
  DistributionResponseSchema,
  HeatmapResponseSchema,
  HeatmapYearsResponseSchema,
  HourlyDistributionResponseSchema,
  RecentSessionSchema,
  StatsSummaryResponseSchema,
  StreakStatsResponseSchema,
  WeekHourResponseSchema,
  type DistributionType,
  type HeatmapResponse,
  type HeatmapYearsResponse,
  type StatsSummaryResponse,
  type StreakStatsResponse,
  type DistributionResponse,
  type HourlyDistributionResponse,
  type WeekHourResponse,
  type RecentSession,
  type Achievement,
} from '@/lib/schemas/stats.schema'

/** Default session count for the recent-sessions endpoint (backend accepts 1-100). */
export const DEFAULT_RECENT_LIMIT = 20

/**
 * Client timezone offset in minutes for stats day-boundary resolution.
 * Matches `Date.getTimezoneOffset()` semantics negated: UTC+8 → 480.
 */
function timezoneOffset(): number {
  return -new Date().getTimezoneOffset()
}

/**
 * Origin filter shared by the six filterable stats endpoints. The backend
 * treats the two as mutually exclusive (400 COMMON_003 when both are sent).
 */
export interface StatsFilterParams {
  /** Origin-device filter (unknown/foreign devices 404 COMMON_002) */
  deviceId?: string
  /** Exact IDE-name filter (unregistered names 404 COMMON_002) */
  ideName?: string
}

/** Build the deviceId/ideName query fragment from filter params. */
function filterQuery(params: StatsFilterParams): Record<string, string> {
  return {
    ...(params.deviceId ? { deviceId: params.deviceId } : {}),
    ...(params.ideName ? { ideName: params.ideName } : {}),
  }
}

/**
 * Fetches the distinct non-empty IDE names registered by the current user,
 * alphabetical, for the dashboard IDE filter dropdown. Includes names of
 * revoked devices (historical attribution); never contains "Unknown IDE".
 *
 * Endpoint: GET /api/v1/stats/ide-filters
 *
 * @returns IDE names ordered alphabetically
 */
export async function getStatsIdeFilters(): Promise<string[]> {
  const response = await apiFetch<unknown>('/api/v1/stats/ide-filters', {
    method: 'GET',
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return z.array(z.string()).parse(wrapped.data)
}

/**
 * Fetches the calendar years containing valid coding sessions for the
 * current user, newest first, for the heatmap year dropdown. Derived from
 * session data (start < end), not the lazily bootstrapped materialized
 * table, so cold-start users never get a truncated list.
 *
 * Endpoint: GET /api/v1/stats/heatmap-years
 *
 * @returns Years ordered newest first; empty array when the user has no
 * valid sessions
 */
export async function getStatsHeatmapYears(): Promise<HeatmapYearsResponse> {
  const response = await apiFetch<unknown>('/api/v1/stats/heatmap-years', {
    method: 'GET',
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return HeatmapYearsResponseSchema.parse(wrapped.data)
}

/**
 * Fetches the coding activity summary (today / daily average / week / month /
 * year / lifetime totals in seconds), computed in the client timezone.
 *
 * Endpoint: GET /api/v1/stats/summary?timezoneOffset=…[&deviceId=…]
 *
 * @param params - Optional filters
 * @param params.deviceId - Origin-device filter (unknown/foreign devices 404)
 * @param params.ideName - Exact IDE-name filter (unregistered names 404)
 * @returns Summary totals in seconds
 * @throws Error with RATE_LIMIT_001 on 429; COMMON_002 for unknown deviceId
 */
export async function getStatsSummary(params: StatsFilterParams = {}): Promise<StatsSummaryResponse> {
  const response = await apiFetch<unknown>('/api/v1/stats/summary', {
    method: 'GET',
    query: {
      timezoneOffset: timezoneOffset(),
      ...filterQuery(params),
    },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return StatsSummaryResponseSchema.parse(wrapped.data)
}

/**
 * Fetches the daily coding heatmap over an inclusive date range
 * (default: this calendar year), dense — includes zero-value days.
 *
 * Endpoint: GET /api/v1/stats/heatmap?timezoneOffset=…&start=…&end=…[&deviceId=…]
 *
 * @param params - Optional range and device filters
 * @param params.start - Range start (yyyy-MM-dd); defaults to Jan 1 server-side
 * @param params.end - Range end (yyyy-MM-dd); defaults to today server-side
 * @param params.deviceId - Origin-device filter (unknown/foreign devices 404)
 * @param params.ideName - Exact IDE-name filter (unregistered names 404)
 * @returns Heatmap points in date order
 */
export async function getStatsHeatmap(
  params: { start?: string; end?: string } & StatsFilterParams = {},
): Promise<HeatmapResponse> {
  const response = await apiFetch<unknown>('/api/v1/stats/heatmap', {
    method: 'GET',
    query: {
      timezoneOffset: timezoneOffset(),
      ...(params.start ? { start: params.start } : {}),
      ...(params.end ? { end: params.end } : {}),
      ...filterQuery(params),
    },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return HeatmapResponseSchema.parse(wrapped.data)
}

/**
 * Fetches the current and longest consecutive coding day streaks.
 *
 * Endpoint: GET /api/v1/stats/streaks?timezoneOffset=…[&deviceId=…]
 *
 * @param params - Optional filters
 * @param params.deviceId - Origin-device filter (unknown/foreign devices 404)
 * @param params.ideName - Exact IDE-name filter (unregistered names 404)
 * @returns Current and max streaks in days
 */
export async function getStatsStreaks(params: StatsFilterParams = {}): Promise<StreakStatsResponse> {
  const response = await apiFetch<unknown>('/api/v1/stats/streaks', {
    method: 'GET',
    query: {
      timezoneOffset: timezoneOffset(),
      ...filterQuery(params),
    },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return StreakStatsResponseSchema.parse(wrapped.data)
}

/**
 * Fetches a coding duration distribution by dimension
 * (LANGUAGES / PROJECTS / TIME_OF_DAY / WEEKDAY / DEVICES / IDES),
 * buckets ordered by duration descending.
 *
 * Endpoint: GET /api/v1/stats/distribution?type=…&timezoneOffset=…[&deviceId=…]
 *
 * @param type - Distribution dimension
 * @param params - Optional filters
 * @param params.deviceId - Origin-device filter (unknown/foreign devices 404)
 * @param params.ideName - Exact IDE-name filter (unregistered names 404)
 * @returns Distribution entries ordered by duration descending
 */
export async function getStatsDistribution(
  type: DistributionType,
  params: StatsFilterParams = {},
): Promise<DistributionResponse> {
  const response = await apiFetch<unknown>('/api/v1/stats/distribution', {
    method: 'GET',
    query: {
      type,
      timezoneOffset: timezoneOffset(),
      ...filterQuery(params),
    },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return DistributionResponseSchema.parse(wrapped.data)
}

/**
 * Fetches per-hour average coding seconds across active days.
 *
 * Endpoint: GET /api/v1/stats/hourly?timezoneOffset=…[&deviceId=…]
 *
 * @param params - Optional filters
 * @param params.deviceId - Origin-device filter (unknown/foreign devices 404)
 * @param params.ideName - Exact IDE-name filter (unregistered names 404)
 * @returns Per-hour averages (hour 0-23) with active-day count
 */
export async function getStatsHourly(params: StatsFilterParams = {}): Promise<HourlyDistributionResponse> {
  const response = await apiFetch<unknown>('/api/v1/stats/hourly', {
    method: 'GET',
    query: {
      timezoneOffset: timezoneOffset(),
      ...filterQuery(params),
    },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return HourlyDistributionResponseSchema.parse(wrapped.data)
}

/**
 * Fetches the weekly coding activity heatmap — one cell per (ISO weekday ×
 * hour), the average seconds over the weekday's appearances in the window.
 * Non-zero cells only; clients zero-fill the full 7×24 matrix.
 *
 * Endpoint: GET /api/v1/stats/week-hour?timezoneOffset=…[&start=…&end=…][&deviceId=…]
 *
 * @param params - Optional window + filters
 * @param params.start - Window start (yyyy-MM-dd, inclusive); omitted = all history
 * @param params.end - Window end (yyyy-MM-dd, inclusive); omitted = all history
 * @param params.deviceId - Origin-device filter (unknown/foreign devices 404)
 * @param params.ideName - Exact IDE-name filter (unregistered names 404)
 * @returns Non-zero week×hour cells + weekday appearance counts (divisors)
 */
export async function getStatsWeekHour(
  params: { start?: string; end?: string } & StatsFilterParams = {},
): Promise<WeekHourResponse> {
  const response = await apiFetch<unknown>('/api/v1/stats/week-hour', {
    method: 'GET',
    query: {
      timezoneOffset: timezoneOffset(),
      ...(params.start ? { start: params.start } : {}),
      ...(params.end ? { end: params.end } : {}),
      ...filterQuery(params),
    },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return WeekHourResponseSchema.parse(wrapped.data)
}

/**
 * Fetches the most recent coding sessions (start time descending).
 *
 * Endpoint: GET /api/v1/stats/recent?limit=…[&deviceId=…]
 *
 * @param params - Optional filters
 * @param params.limit - Session count (1-100; default {@link DEFAULT_RECENT_LIMIT})
 * @param params.deviceId - Origin-device filter (unknown/foreign devices 404)
 * @param params.ideName - Exact IDE-name filter (unregistered names 404)
 * @returns Recent sessions ordered by start time descending
 */
export async function getStatsRecent(params: { limit?: number } & StatsFilterParams = {}): Promise<RecentSession[]> {
  const response = await apiFetch<unknown>('/api/v1/stats/recent', {
    method: 'GET',
    query: {
      limit: params.limit ?? DEFAULT_RECENT_LIMIT,
      ...filterQuery(params),
    },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return RecentSessionSchema.array().parse(wrapped.data)
}

/**
 * Fetches every achievement badge with its unlock state and progress.
 * Server caches for 60s; achievements resolve in the client timezone.
 *
 * Endpoint: GET /api/v1/stats/achievements?timezoneOffset=…
 *
 * @returns All achievement badges with unlock state and progress
 */
export async function getStatsAchievements(): Promise<Achievement[]> {
  const response = await apiFetch<unknown>('/api/v1/stats/achievements', {
    method: 'GET',
    query: {
      timezoneOffset: timezoneOffset(),
    },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return AchievementSchema.array().parse(wrapped.data)
}
