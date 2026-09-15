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
 * The page size is fixed at `LEADERBOARD_PAGE_SIZE` rather than taken as a parameter:
 * the view's "is there another page" logic compares the returned row count against that
 * same constant, so a caller-supplied size would silently break paging.
 *
 * The period is never taken on faith either: if the caller's period is not legal for the
 * requested dimension (a state the selectors should already prevent), it falls back to
 * that dimension's default rather than sending a request the server answers with HTTP
 * 400 `COMMON_003`. That keeps the illegal pair unreachable by construction instead of
 * turning it into an error the user has to decode.
 *
 * @param dimension - reactive ranking dimension
 * @param period - reactive period; coerced to a legal one for `dimension`
 * @param offset - reactive row offset for pagination
 * @returns TanStack Query result for the current page
 */
export function useLeaderboard(
  dimension: Ref<LeaderboardDimension>,
  period: Ref<LeaderboardPeriod>,
  offset: Ref<number>,
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
        limit: LEADERBOARD_PAGE_SIZE,
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
