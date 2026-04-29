import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import {
  GlobalLeaderboardSchema,
  UserLeaderboardPositionSchema,
  type GlobalLeaderboard,
  type UserLeaderboardPosition,
} from '@/lib/schemas/leaderboard.schema'

/**
 * Fetches the global leaderboard with top-ranked users.
 *
 * Endpoint: GET /api/v1/leaderboard/global
 * Authentication: Required (JWT Bearer token)
 *
 * @param params - Optional pagination parameters
 * @param params.limit - Number of entries to return (default: 20, max: 100)
 * @param params.offset - Number of entries to skip (default: 0)
 * @returns Global leaderboard data with ranked entries
 * @throws ApiError with code LEADERBOARD_001 if leaderboard service is unavailable
 */
export async function getGlobalLeaderboard(
  params: { limit?: number; offset?: number } = {},
): Promise<GlobalLeaderboard> {
  const response = await apiFetch<unknown>('/api/v1/leaderboard/global', {
    method: 'GET',
    query: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return GlobalLeaderboardSchema.parse(wrapped.data)
}

/**
 * Fetches the current user's position on the global leaderboard.
 *
 * Endpoint: GET /api/v1/leaderboard/me
 * Authentication: Required (JWT Bearer token)
 *
 * @returns User's leaderboard position and surrounding stats
 * @throws ApiError with code LEADERBOARD_002 if user is not in the leaderboard
 */
export async function getUserLeaderboardPosition(): Promise<UserLeaderboardPosition> {
  const response = await apiFetch<unknown>('/api/v1/leaderboard/me', {
    method: 'GET',
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return UserLeaderboardPositionSchema.parse(wrapped.data)
}

/**
 * Fetches a team-specific leaderboard.
 *
 * Endpoint: GET /api/v1/leaderboard/team/{teamId}
 * Authentication: Required (JWT Bearer token)
 *
 * @param teamId - The team identifier
 * @param params - Optional pagination parameters
 * @returns Team leaderboard data with ranked entries
 * @throws ApiError with code LEADERBOARD_001 if leaderboard service is unavailable
 */
export async function getTeamLeaderboard(
  teamId: string,
  params: { limit?: number; offset?: number } = {},
): Promise<GlobalLeaderboard> {
  const response = await apiFetch<unknown>(`/api/v1/leaderboard/team/${teamId}`, {
    method: 'GET',
    query: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return GlobalLeaderboardSchema.parse(wrapped.data)
}
