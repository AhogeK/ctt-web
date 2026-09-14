import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import {
  LeaderboardResponseSchema,
  type LeaderboardDimension,
  type LeaderboardPeriod,
  type LeaderboardResponse,
} from '@/lib/schemas/leaderboard.schema'

/**
 * Fetches one page of a leaderboard ranking.
 *
 * Endpoint: `GET /api/v1/leaderboard`
 * Authentication: required (JWT bearer).
 *
 * `dimension` is mandatory server-side, and the legal `period` values depend on it
 * — an unsupported pair is rejected with HTTP 400 `COMMON_003` (measured:
 * "Dimension STREAK does not support period WEEK"). `DIMENSION_PERIODS` in the
 * schema is the source of that constraint, so callers should derive the period from
 * it rather than offering a free choice.
 *
 * @param params.dimension - what to rank by (`TOTAL` / `STREAK` / …)
 * @param params.period - time window; must be legal for `dimension`
 * @param params.limit - page size, 1–100 (server default 20)
 * @param params.offset - rows to skip, ≥ 0
 * @returns The page's entries plus the caller's own rank (null when unranked)
 */
export async function getLeaderboard(params: {
  dimension: LeaderboardDimension
  period: LeaderboardPeriod
  limit?: number
  offset?: number
}): Promise<LeaderboardResponse> {
  const response = await apiFetch<unknown>('/api/v1/leaderboard', {
    method: 'GET',
    query: {
      dimension: params.dimension,
      period: params.period,
      limit: params.limit,
      offset: params.offset,
    },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return LeaderboardResponseSchema.parse(wrapped.data)
}
