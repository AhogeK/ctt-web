/**
 * Query Key Factory for TanStack Query
 * Provides type-safe, centralized query key management
 * Prevents string literal duplication and enables easy refactoring
 */

/**
 * User-related query keys
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (page: number) => [...userKeys.lists(), { page }] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
}

/**
 * Dashboard-related query keys
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  heatmap: (userId: string) => [...dashboardKeys.all, 'heatmap', userId] as const,
}

/**
 * Device-related query keys
 */
export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  detail: (id: string) => [...deviceKeys.all, 'detail', id] as const,
}

/**
 * Leaderboard-related query keys
 */
export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  global: () => [...leaderboardKeys.all, 'global'] as const,
  team: (teamId: string) => [...leaderboardKeys.all, 'team', teamId] as const,
}
