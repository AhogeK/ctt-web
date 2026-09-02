import { z } from 'zod'

/**
 * Stats Schemas — contracts matching ctt-server stats DTOs (backend S1–S5,
 * v0.57.0+). All durations are seconds; all date params are calendar days
 * (yyyy-MM-dd) resolved in the client timezone via `timezoneOffset`.
 */
/** Distribution dimension requested from the distribution endpoint. */
export const DistributionTypeSchema = z.enum(['LANGUAGES', 'PROJECTS', 'TIME_OF_DAY', 'WEEKDAY', 'DEVICES', 'IDES'])
export type DistributionType = z.infer<typeof DistributionTypeSchema>

/** Seconds coded today / this ISO week / this month / this year / lifetime (seconds). */
export const StatsSummaryResponseSchema = z.object({
  // Seconds coded today
  today: z.number().int().nonnegative(),
  // Lifetime total divided by days since first session day
  dailyAverage: z.number().int().nonnegative(),
  // Seconds coded this ISO week (Monday start)
  thisWeek: z.number().int().nonnegative(),
  // Seconds coded this calendar month
  thisMonth: z.number().int().nonnegative(),
  // Seconds coded this calendar year
  thisYear: z.number().int().nonnegative(),
  // Lifetime seconds (overlapping sessions merged)
  total: z.number().int().nonnegative(),
})

/** One day of the coding heatmap (dense — includes zero-value days). */
export const DailyStatPointSchema = z.object({
  // Calendar day (yyyy-MM-dd in the requested timezone)
  date: z.string(),
  // Merged coding seconds on that day
  seconds: z.number().int().nonnegative(),
})

/** Daily coding heatmap over a date range. */
export const HeatmapResponseSchema = z.object({
  // Daily points in date order (dense — includes zero-value days)
  points: z.array(DailyStatPointSchema),
})

/** Consecutive coding day streaks. */
export const StreakStatsResponseSchema = z.object({
  // Current streak ending today or yesterday
  current: z.number().int().nonnegative(),
  // Longest streak ever recorded
  max: z.number().int().nonnegative(),
})

/** One distribution bucket. */
export const DistributionEntrySchema = z.object({
  // Bucket key (language name / project name / hour label / weekday / device / IDE)
  name: z.string(),
  // Raw accumulated coding seconds
  seconds: z.number().int().nonnegative(),
})

/** Coding duration distribution by dimension (buckets ordered by duration descending). */
export const DistributionResponseSchema = z.object({
  // Distribution dimension
  type: DistributionTypeSchema,
  // Buckets ordered by duration descending
  entries: z.array(DistributionEntrySchema),
})

/** One per-hour average point (hour 0-23, average seconds across active days). */
export const HourlyStatPointSchema = z.object({
  // Hour of day (0-23)
  hour: z.number().int().min(0).max(23),
  // Average seconds in that hour across active days
  averageSeconds: z.number().int().nonnegative(),
})

/** Hourly coding distribution across active days. */
export const HourlyDistributionResponseSchema = z.object({
  // Per-hour averages, hour order
  points: z.array(HourlyStatPointSchema),
  // Days with any coding activity
  activeDays: z.number().int().nonnegative(),
})

/** A recent coding session. */
export const RecentSessionSchema = z.object({
  // Server primary key
  sessionId: z.uuid(),
  // Client-generated session UUID
  sessionUuid: z.uuid(),
  // Project or repository name
  projectName: z.string(),
  // Primary programming language
  language: z.string(),
  // Session start time (ISO 8601 UTC)
  startTime: z.string(),
  // Session end time (ISO 8601 UTC)
  endTime: z.string(),
  // Raw session duration in seconds
  durationSeconds: z.number().int().nonnegative(),
})

/** A coding achievement badge with unlock state and progress. */
export const AchievementSchema = z.object({
  // Stable achievement code (e.g. STREAK_7)
  code: z.string(),
  // Human-readable badge name
  displayName: z.string(),
  // What the badge rewards
  description: z.string(),
  // Whether the badge is unlocked
  unlocked: z.boolean(),
  // Unlock time, or null when not unlocked
  unlockedAt: z.string().nullable().default(null),
  // Current progress value
  progress: z.number().int().nonnegative(),
  // Threshold the badge unlocks at
  target: z.number().int().nonnegative(),
  // Unit of progress and target (e.g. "days")
  unit: z.string(),
})

/**
 * Calendar years with valid coding sessions, newest first (backend derives
 * from session start years, not the materialized table). Feed for the
 * heatmap year dropdown.
 */
export const HeatmapYearsResponseSchema = z.array(z.number().int())

// Type exports (z.infer — never hand-write interfaces)
export type StatsSummaryResponse = z.infer<typeof StatsSummaryResponseSchema>
export type DailyStatPoint = z.infer<typeof DailyStatPointSchema>
export type HeatmapResponse = z.infer<typeof HeatmapResponseSchema>
export type RecentSession = z.infer<typeof RecentSessionSchema>
export type Achievement = z.infer<typeof AchievementSchema>
export type StreakStatsResponse = z.infer<typeof StreakStatsResponseSchema>
export type DistributionEntry = z.infer<typeof DistributionEntrySchema>
export type DistributionResponse = z.infer<typeof DistributionResponseSchema>
export type HourlyStatPoint = z.infer<typeof HourlyStatPointSchema>
export type HourlyDistributionResponse = z.infer<typeof HourlyDistributionResponseSchema>
export type HeatmapYearsResponse = z.infer<typeof HeatmapYearsResponseSchema>
