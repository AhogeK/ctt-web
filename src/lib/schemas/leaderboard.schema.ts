import { z } from 'zod'

/**
 * Leaderboard contracts — `GET /api/v1/leaderboard` (ctt-server).
 *
 * Written against the live endpoint and the server's `LeaderboardDimension` /
 * `LeaderboardPeriod` enums, then re-checked against **ctt-server v0.73.0**, which
 * widened the contract (commit `0111900`): a sixth dimension, broader period support,
 * and a `totalParticipants` field. Authoritative source, per the R24 回源 rule:
 * `leaderboard/enums/LeaderboardDimension.supports()` and `dto/LeaderboardResponse.java`.
 *
 * (An earlier version of this file described an API that does not exist at all —
 * three endpoints, `totalMinutes`, `totalUsers`, `updatedAt`, `avatarUrl` — which is
 * why the page could only ever render its error state.)
 */

/** What the ranking measures. Each is a separate server-side ranking. */
export const LeaderboardDimensionSchema = z.enum([
  'TOTAL',
  'STREAK',
  'NIGHT_OWL',
  'EARLY_BIRD',
  'GROWTH',
  'ACTIVE_DAYS',
])
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
  NIGHT_OWL: ['ALL', 'WEEK', 'MONTH', 'YEAR'],
  EARLY_BIRD: ['ALL', 'WEEK', 'MONTH', 'YEAR'],
  // Any non-ALL window: GROWTH compares a period against the one before it, which an
  // unbounded history cannot do. `supports()` reads `period != ALL`, and WEEK is the
  // server's default — so it must stay first for `defaultPeriodFor` to agree.
  GROWTH: ['WEEK', 'MONTH', 'YEAR'],
  ACTIVE_DAYS: ['ALL', 'WEEK', 'MONTH', 'YEAR'],
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
  // Null when the account no longer exists. Must tolerate the **key being absent**
  // rather than present-as-null: Jackson's `non_null` inclusion omits it entirely for
  // a deleted account (measured live — `{"userId":"…","score":12000,"rank":30}` with
  // no `displayName`), so a required-but-nullable field fails to parse the whole page.
  // Same behaviour that makes `unlockedAt` and the achievements window dates
  // `.default(null)`; here the result is identical either way.

  displayName: z.string().nullable().default(null),
  // Unit depends on the dimension: seconds for TOTAL / NIGHT_OWL / EARLY_BIRD, a
  // **count of days** for STREAK (a run length) and ACTIVE_DAYS (distinct days with
  // time — not a duration; `activeDaysIn` counts entries in `secondsByDay`), and a
  // **signed** period-over-period delta for GROWTH (it can be negative). Callers must
  // pick a formatter from the dimension, not from this number.

  score: z.number().int(),
  // The server's own 1-based rank. Kept verbatim and never derived from the row
  // index, because ties share a rank — the live board reads 1, 2, 3, 3, 5, 5 …
  // so index+1 would mislabel everyone below the first tie.

  rank: z.number().int().positive(),
})
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>

/** A page of one ranking. */
export const LeaderboardResponseSchema = z.object({
  // Rows in score-descending order for the requested page.
  entries: z.array(LeaderboardEntrySchema),
  // The caller's own 1-based rank, or null when they have no score yet (never
  // pushed). Null is the ordinary "you have not been ranked" state, not an error —
  // the previous contract modelled it as an `LEADERBOARD_002` failure, which made
  // a normal condition look like a fault.

  // `.default(null)` for the same reason as `displayName`: when unranked the server
  // **omits the key** rather than sending null (measured: `data` keys are just
  // `entries` for GROWTH on an unranked account), and a required field would fail to
  // parse the page instead of rendering "no rank yet".

  currentUserRank: z.number().int().positive().nullable().default(null),
  // How many users are ranked for this dimension and period — the whole board, not
  // this page. Declared **required with no default**, unlike the two fields above:
  // the server sends a `long` primitive, which cannot be null, and `non_null`
  // inclusion only suppresses nulls — so the key is always present and its absence
  // means a contract mismatch worth failing on rather than papering over.
  //
  // It is what makes "is there another page" exact. Before v0.73.0 the only end
  // signal was a short page, so a board whose size was an exact multiple of the page
  // size offered one page too many.
  totalParticipants: z.number().int().nonnegative(),
})

export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>

/**
 * UI page size, inside the server's `@Min(1) @Max(100)` bounds.
 *
 * The bounds are not mirrored as constants: nothing clamps against them, and this
 * page always sends this one value.
 */
export const LEADERBOARD_PAGE_SIZE = 20
