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

/** One week×hour cell of the weekly activity heatmap. */
export const WeekHourStatPointSchema = z.object({
  // ISO weekday: 1=Monday .. 7=Sunday
  dayOfWeek: z.number().int().min(1).max(7),
  // Hour of day (0-23)
  hour: z.number().int().min(0).max(23),
  // Average seconds = cell total ÷ weekday appearances in the window
  averageSeconds: z.number().int().nonnegative(),
})

/** Weekly (7×24) coding activity heatmap over a date window. */
export const WeekHourResponseSchema = z.object({
  // Non-zero cells only — clients zero-fill the full matrix
  points: z.array(WeekHourStatPointSchema),
  // Weekday appearances in the window (key "1".."7") — the averaging divisor
  weekdayCounts: z.record(z.string(), z.number().int().nonnegative()),
})

/**
 * Measurement window a badge's progress is computed over (ctt-server v0.71.0).
 *
 * `LIFETIME` badges never reset; every other value resets at the start of the
 * next local period, and the response carries the concrete range in
 * `windowStart`/`windowEnd`.
 */
export const AchievementWindowSchema = z.enum(['LIFETIME', 'DAY', 'WEEK', 'MONTH', 'YEAR'])
export type AchievementWindow = z.infer<typeof AchievementWindowSchema>

/** A coding achievement badge with unlock state and progress. */
export const AchievementSchema = z.object({
  // Stable achievement code (e.g. STREAK_7)
  code: z.string(),
  // Family this badge belongs to (e.g. STREAK) — groups a badge into its ladder
  type: z.string(),
  // 1-based position within the family AND window, ascending by target
  tier: z.number().int().positive(),
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
  // Unit of progress and target (e.g. "days", "seconds", "percent")
  unit: z.string(),
  // Windowed achievements (v0.71.0). The server omits these for LIFETIME badges
  // (Jackson non_null), so they default to null exactly like `unlockedAt` —
  // treating them as required would reject a legitimate response.
  window: AchievementWindowSchema.default('LIFETIME'),
  // First local date of the current window; null for LIFETIME
  windowStart: z.string().nullable().default(null),
  // Last local date of the current window; null for LIFETIME
  windowEnd: z.string().nullable().default(null),
  /*
   * History (ctt-server v0.72.0). How many periods this badge has ever been earned in
   * / how many consecutive periods up to now it has been earned in.
   *
   * **Computed server-side from the session history, not counted from unlock rows.**
   * That distinction matters: unlock rows are only written when a user *opens the
   * achievements page* (`evaluate` has a single caller — the GET), so counting rows
   * would measure how often someone looked rather than how often they achieved. See
   * `references.md`.
   *
   * No `.default(0)`: the server sends them as primitive ints on every badge, so a
   * missing key means the contract changed and should fail loudly rather than read as
   * "never earned".
   */
  totalUnlocks: z.number().int().nonnegative(),
  periodStreak: z.number().int().nonnegative(),
})

/**
 * Calendar years that contain at least one day with coding time, newest first.
 * Feed for the heatmap year selector.
 *
 * The year is resolved in the CLIENT's timezone (the request carries
 * timezoneOffset), so this list and the rendered heatmap agree on which year a
 * session belongs to — a session just after local midnight on Dec 31 is the
 * next year's, and a UTC-derived list would have offered the wrong one.
 */
export const HeatmapYearsResponseSchema = z.array(z.number().int())

/**
 * Months (`yyyy-MM`) that contain at least one day with coding time, newest
 * first. Feed for the trend panel's month picker.
 *
 * Same timezone rule as the year list, and the two are derived from one source
 * server-side, so they cannot disagree: every listed month belongs to a listed
 * year, and every listed month's heatmap has something to draw.
 */
export const HeatmapMonthsResponseSchema = z.array(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/))

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
export type HeatmapMonthsResponse = z.infer<typeof HeatmapMonthsResponseSchema>
export type WeekHourStatPoint = z.infer<typeof WeekHourStatPointSchema>
export type WeekHourResponse = z.infer<typeof WeekHourResponseSchema>
