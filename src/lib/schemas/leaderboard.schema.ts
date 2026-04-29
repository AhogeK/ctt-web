import { z } from 'zod'

/**
 * Schema for a single leaderboard entry.
 *
 * Represents a user's position and stats on the global or team leaderboard.
 */
export const LeaderboardEntrySchema = z.object({
  // User identifier
  userId: z.uuid(),
  // Display name of the user
  displayName: z.string(),
  // Current rank position (1-indexed)
  rank: z.number().int().positive(),
  // Total tracked coding time in minutes
  totalMinutes: z.number().int().nonnegative(),
  // Avatar URL or null if not set
  avatarUrl: z.url().nullable().optional(),
})

/**
 * Schema for the global leaderboard response data.
 */
export const GlobalLeaderboardSchema = z.object({
  // Ordered list of leaderboard entries
  entries: z.array(LeaderboardEntrySchema),
  // Total number of users in the leaderboard
  totalUsers: z.number().int().nonnegative(),
  // Timestamp when the leaderboard was last updated
  updatedAt: z.iso.datetime(),
})

/**
 * Schema for the user's own leaderboard position.
 */
export const UserLeaderboardPositionSchema = z.object({
  // User's current rank
  rank: z.number().int().positive(),
  // User's total minutes
  totalMinutes: z.number().int().nonnegative(),
  // Number of users above this user
  usersAbove: z.number().int().nonnegative().optional(),
  // Number of users below this user
  usersBelow: z.number().int().nonnegative().optional(),
})

// Type exports
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>
export type GlobalLeaderboard = z.infer<typeof GlobalLeaderboardSchema>
export type UserLeaderboardPosition = z.infer<typeof UserLeaderboardPositionSchema>
