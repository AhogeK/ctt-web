import { z } from 'zod'

/**
 * Leaderboard contracts — `GET /api/v1/leaderboard` (ctt-server).
 *
 * Verified against the live endpoint and the server's `LeaderboardDimension` /
 * `LeaderboardPeriod` enums. The previous version of this file described an API
 * that does not exist (three endpoints, `totalMinutes`, `totalUsers`, `updatedAt`,
 * `avatarUrl`), which is why the page could only ever render its error state.
 */

/** What the ranking measures. Each is a separate server-side ranking. */
export const LeaderboardDimensionSchema = z.enum(['TOTAL', 'STREAK', 'NIGHT_OWL', 'EARLY_BIRD', 'GROWTH'])
export type LeaderboardDimension = z.infer<typeof LeaderboardDimensionSchema>

/** Time window the ranking covers. */
export const LeaderboardPeriodSchema = z.enum(['ALL', 'WEEK', 'MONTH', 'YEAR'])
export type LeaderboardPeriod = z.infer<typeof LeaderboardPeriodSchema>

/**
 * Periods each dimension can actually be ranked over.
 *
 * Not a free cross-product: the server rejects illegal pairs with **HTTP 400
 * `COMMON_003`** ("Dimension STREAK does not support period WEEK", measured). These
 * are the server's own `LeaderboardDimension.supports` rules, encoded here so the
 * UI cannot construct a request the server will refuse — a disabled selector is
 * better than an error the user cannot act on.
 */
export const DIMENSION_PERIODS: Record<LeaderboardDimension, readonly LeaderboardPeriod[]> = {
  TOTAL: ['ALL', 'WEEK', 'MONTH', 'YEAR'],
  STREAK: ['ALL'],
  NIGHT_OWL: ['ALL'],
  EARLY_BIRD: ['ALL'],
  GROWTH: ['WEEK'],
}

/**
 * Default period for a dimension — mirrors the server's own defaulting
 * (`GROWTH` defaults to `WEEK`, everything else to `ALL`) so the first request
 * matches what the server would have chosen anyway.
 */
export function defaultPeriodFor(dimension: LeaderboardDimension): LeaderboardPeriod {
  return DIMENSION_PERIODS[dimension][0]!
}

/** One ranked user. */
export const LeaderboardEntrySchema = z.object({
  // Stable user id — the row key, since display names are not unique (measurably:
  // the live board has several entries sharing one name) and can be null.
  userId: z.uuid(),
  /*
   * Null when the account no longer exists. Must tolerate the **key being absent**
   * rather than present-as-null: Jackson's `non_null` inclusion omits it entirely for
   * a deleted account (measured live — `{"userId":"…","score":12000,"rank":30}` with
   * no `displayName`), so a required-but-nullable field fails to parse the whole page.
   * Same behaviour that makes `unlockedAt` and the achievements window dates
   * `.default(null)`; here the result is identical either way.
   */
  displayName: z.string().nullable().default(null),
  /*
   * Unit depends on the dimension: seconds for TOTAL / NIGHT_OWL / EARLY_BIRD,
   * whole days for STREAK, and a **signed** week-over-week delta for GROWTH (it
   * can be negative). Callers must pick a formatter from the dimension, not from
   * this number.
   */
  score: z.number().int(),
  /*
   * The server's own 1-based rank. Kept verbatim and never derived from the row
   * index, because ties share a rank — the live board reads 1, 2, 3, 3, 5, 5 …
   * so index+1 would mislabel everyone below the first tie.
   */
  rank: z.number().int().positive(),
})
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>

/** A page of one ranking. */
export const LeaderboardResponseSchema = z.object({
  // Rows in score-descending order for the requested page.
  entries: z.array(LeaderboardEntrySchema),
  /*
   * The caller's own 1-based rank, or null when they have no score yet (never
   * pushed). Null is the ordinary "you have not been ranked" state, not an error —
   * the previous contract modelled it as an `LEADERBOARD_002` failure, which made
   * a normal condition look like a fault.
   *
   * `.default(null)` for the same reason as `displayName`: when unranked the server
   * **omits the key** rather than sending null (measured: `data` keys are just
   * `entries` for GROWTH on an unranked account), and a required field would fail to
   * parse the page instead of rendering "no rank yet".
   */
  currentUserRank: z.number().int().positive().nullable().default(null),
})

export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>

/**
 * UI page size, inside the server's `@Min(1) @Max(100)` bounds.
 *
 * The bounds are not mirrored as constants: nothing clamps against them, and this
 * page always sends this one value.
 */
export const LEADERBOARD_PAGE_SIZE = 20
