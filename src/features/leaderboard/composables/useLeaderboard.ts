/**
 * Leaderboard query hooks.
 *
 * One ranking per (dimension, period, page). Unlike the previous version — which
 * modelled the caller's own rank as a second request to an endpoint that does not
 * exist — the rank arrives inside the same response, so a page is a single query.
 */
import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getLeaderboard } from '@/lib/api/leaderboard'
import { formatDuration } from '@/lib/utils'
import { leaderboardKeys } from '@/lib/query-keys'
import {
  DIMENSION_PERIODS,
  LEADERBOARD_PAGE_SIZE,
  defaultPeriodFor,
  type LeaderboardDimension,
  type LeaderboardPeriod,
} from '@/lib/schemas/leaderboard.schema'

/**
 * Fetch one page of a ranking.
 *
 * The period is never taken on faith: if the caller's period is not legal for the
 * requested dimension (a state the selectors should already prevent), it falls back
 * to that dimension's default rather than sending a request the server answers with
 * HTTP 400 `COMMON_003`. That keeps the illegal pair unreachable by construction
 * instead of turning it into an error the user has to decode.
 *
 * @param dimension - reactive ranking dimension
 * @param period - reactive period; coerced to a legal one for `dimension`
 * @param offset - reactive row offset for pagination
 * @param limit - page size (server allows 1–100)
 * @returns TanStack Query result for the current page
 */
export function useLeaderboard(
  dimension: Ref<LeaderboardDimension>,
  period: Ref<LeaderboardPeriod>,
  offset: Ref<number>,
  limit: number = LEADERBOARD_PAGE_SIZE,
) {
  const effectivePeriod = computed<LeaderboardPeriod>(() => {
    const legal = DIMENSION_PERIODS[dimension.value]
    return legal.includes(period.value) ? period.value : defaultPeriodFor(dimension.value)
  })

  const query = useQuery({
    queryKey: computed(() => leaderboardKeys.page(dimension.value, effectivePeriod.value, offset.value)),
    queryFn: () =>
      getLeaderboard({
        dimension: dimension.value,
        period: effectivePeriod.value,
        limit,
        offset: offset.value,
      }),
    // Server-computed rankings; short staleness so switching tabs is cheap but a
    // revisit still refreshes.
    staleTime: 1000 * 30,
  })

  return { ...query, effectivePeriod }
}

/**
 * Legal periods for a dimension — drives the period selector so it can never offer
 * a choice the server would reject.
 */
export function periodsFor(dimension: LeaderboardDimension): readonly LeaderboardPeriod[] {
  return DIMENSION_PERIODS[dimension]
}

/**
 * Readable labels for the UI. Kept beside the enums rather than in the view so the
 * wording for a dimension lives in one place.
 */
export const DIMENSION_LABELS: Record<LeaderboardDimension, string> = {
  TOTAL: 'Total time',
  STREAK: 'Streak',
  NIGHT_OWL: 'Night owl',
  EARLY_BIRD: 'Early bird',
  GROWTH: 'Growth',
}

export const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  ALL: 'All time',
  WEEK: 'This week',
  MONTH: 'This month',
  YEAR: 'This year',
}

/**
 * Render a score in the unit its dimension actually uses.
 *
 * The server sends one `score` number whose meaning depends on the dimension, so a
 * single formatter would lie: `TOTAL`/`NIGHT_OWL`/`EARLY_BIRD` are seconds,
 * `STREAK` is a count of days, and `GROWTH` is a **signed** net delta that can be
 * negative. Hence three branches, not one duration call.
 *
 * @param score - raw server score
 * @param dimension - which dimension it came from
 * @returns Display string for that unit
 */
export function formatScore(score: number, dimension: LeaderboardDimension): string {
  switch (dimension) {
    case 'STREAK':
      return `${score} ${score === 1 ? 'day' : 'days'}`
    case 'GROWTH':
      // Signed on purpose: a negative delta is the meaningful case ("you slipped"),
      // so it must not be printed as a bare magnitude.
      return `${score > 0 ? '+' : ''}${formatDuration(Math.abs(score))}${score < 0 ? ' down' : ''}`
    default:
      return formatDuration(score)
  }
}
