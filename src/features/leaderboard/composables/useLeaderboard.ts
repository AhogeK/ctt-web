/**
 * Leaderboard composables for TanStack Query integration.
 *
 * Provides query hooks for leaderboard data fetching
 * with proper error handling using getErrorMessage utility.
 */
import { useQuery } from '@tanstack/vue-query'
import { getGlobalLeaderboard, getUserLeaderboardPosition } from '@/lib/api/leaderboard'
import { leaderboardKeys } from '@/lib/query-keys'
import { getErrorMessage } from '@/lib/utils/api-error'

/**
 * Composable for fetching the global leaderboard.
 *
 * Uses TanStack Query for automatic caching, background refetch,
 * and loading/error state management.
 *
 * @param params - Optional pagination parameters
 * @param params.limit - Number of entries to return (default: 20)
 * @param params.offset - Number of entries to skip (default: 0)
 * @returns Query result with leaderboard data, loading, and error states
 */
export function useGlobalLeaderboard(params: { limit?: number; offset?: number } = {}) {
  return useQuery({
    queryKey: leaderboardKeys.global(),
    queryFn: () => getGlobalLeaderboard(params),
    staleTime: 1000 * 30,
  })
}

/**
 * Composable for fetching the current user's leaderboard position.
 *
 * Uses TanStack Query for automatic caching and error handling.
 *
 * @returns Query result with user position data, loading, and error states
 */
export function useUserLeaderboardPosition() {
  return useQuery({
    queryKey: [...leaderboardKeys.all, 'me'] as const,
    queryFn: () => getUserLeaderboardPosition(),
    staleTime: 1000 * 30,
  })
}

/**
 * Utility to extract user-friendly error message from leaderboard query errors.
 *
 * Handles specific error codes:
 * - LEADERBOARD_001: Leaderboard service unavailable
 * - LEADERBOARD_002: User not ranked yet
 *
 * @param error - The error object from TanStack Query
 * @returns User-friendly error message string
 */
export function getLeaderboardErrorMessage(error: unknown): string {
  return getErrorMessage(error)
}
