/**
 * Query Key Factory for TanStack Query
 * Provides type-safe, centralized query key management
 * Prevents string literal duplication and enables easy refactoring
 */
import type { LeaderboardDimension, LeaderboardPeriod } from './schemas/leaderboard.schema'

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
  // Which boards exist. Global, so it takes no parameters — but it is still a query of its
  // own, because the selector must not wait on a ranking request to render.
  languages: () => [...leaderboardKeys.all, 'languages'] as const,

  // One ranking per (dimension, period, language, page): all four change the payload, so
  // all four belong in the key. The previous bare `global()` would have served one
  // dimension's page from cache for every other dimension, and omitting the language
  // would serve the Java page for Kotlin.

  // Typed by the domain enums rather than `string`: these values are the whole point of
  // the key, so a typo or a renamed member should be a type error rather than a silently
  // distinct cache entry. `language` is `null` for the dimensions that are not
  // partitioned — written explicitly rather than omitted so the key's shape does not vary.
  page: (dimension: LeaderboardDimension, period: LeaderboardPeriod, language: string | null, offset: number) =>
    [...leaderboardKeys.all, dimension, period, language, offset] as const,
}
