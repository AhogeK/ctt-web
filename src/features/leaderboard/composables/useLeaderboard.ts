/**
 * Leaderboard query hooks.
 *
 * Two queries, not one: the ranking being viewed, and the catalogue of language boards the
 * selector offers. They are independent — the selector must render before any ranking is
 * chosen, and a slow ranking must not hold it back.
 *
 * A ranking is identified by (dimension, period, language, page). `LANGUAGE` is the only
 * dimension partitioned by language; for the rest the language is `null` and never travels.
 */
import { computed, type Ref } from 'vue'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { getLeaderboard, getLeaderboardLanguages } from '@/lib/api/leaderboard'
import { leaderboardKeys } from '@/lib/query-keys'
import {
  DIMENSION_PERIODS,
  LEADERBOARD_PAGE_SIZE,
  defaultPeriodFor,
  type LanguageBoard,
  type LanguageType,
  type LeaderboardDimension,
  type LeaderboardPeriod,
  type LeaderboardRequest,
} from '@/lib/schemas/leaderboard.schema'

/**
 * One category's boards, split by whether anybody is ranked on them.
 *
 * Split rather than merely sorted, because the selector draws a boundary between the two:
 * the catalogue is the whole vocabulary (~842 languages) and only a couple of dozen carry
 * members, so "worth opening" and "everything else" must be distinguishable at a glance.
 */
export interface LanguageBoardGroup {
  type: LanguageType
  /** Boards with at least one ranked member, in catalogue (name) order. */
  withMembers: LanguageBoard[]
  /** Boards nobody is ranked on yet — still selectable, and usually the majority. */
  withoutMembers: LanguageBoard[]
}

/**
 * Fetch one page of a ranking.
 *
 * The page size is fixed at `LEADERBOARD_PAGE_SIZE` rather than taken as a parameter: the
 * view's paging compares the returned row count against that same constant, so a
 * caller-supplied size would silently break it.
 *
 * Two illegal requests are made unreachable here rather than reported by the server:
 *
 * - **The period** is coerced to one the dimension accepts. A caller whose period is not
 *   legal for the requested dimension (a state the selectors should already prevent) falls
 *   back to that dimension's default instead of sending a request the server answers with
 *   HTTP 400 `COMMON_003`.
 * - **The language** gates the query. `LANGUAGE` without a language is a 400, so while no
 *   language is selected the request is `null` and the query is disabled — nothing is sent,
 *   and the view shows its loading state rather than an error it cannot explain.
 *
 * @param dimension - reactive ranking dimension
 * @param period - reactive period; coerced to a legal one for `dimension`
 * @param language - reactive language board; must be non-null while `dimension` is `LANGUAGE`
 * @param offset - reactive row offset for pagination
 * @returns TanStack Query result for the current page
 */
export function useLeaderboard(
  dimension: Ref<LeaderboardDimension>,
  period: Ref<LeaderboardPeriod>,
  language: Ref<string | null>,
  offset: Ref<number>,
) {
  const effectivePeriod = computed<LeaderboardPeriod>(() => {
    const legal = DIMENSION_PERIODS[dimension.value]
    return legal.includes(period.value) ? period.value : defaultPeriodFor(dimension.value)
  })

  /**
   * The request, or `null` while one cannot be built.
   *
   * Built as the discriminated union the API takes, so the pairing rule is enforced by the
   * compiler here too rather than only at the call site.
   */
  const request = computed<LeaderboardRequest | null>(() => {
    const common = {
      period: effectivePeriod.value,
      limit: LEADERBOARD_PAGE_SIZE,
      offset: offset.value,
    }
    if (dimension.value !== 'LANGUAGE') return { ...common, dimension: dimension.value }

    const name = language.value
    if (name === null) return null
    return { ...common, dimension: 'LANGUAGE', language: name }
  })

  const query = useQuery({
    queryKey: computed(() =>
      // The language is part of the key only where it is part of the request: for an
      // unpartitioned dimension the stored selection is irrelevant, and keying on it would
      // fragment one ranking across as many cache entries as boards the reader has visited.
      leaderboardKeys.page(
        dimension.value,
        effectivePeriod.value,
        requiresLanguage(dimension.value) ? language.value : null,
        offset.value,
      ),
    ),
    queryFn: ({ signal }) => {
      const current = request.value
      // Unreachable: `enabled` below is false whenever this is null, and TanStack does not
      // call a disabled query's function. Narrowing needs the check regardless.
      if (current === null) throw new Error('No leaderboard request is buildable')
      return getLeaderboard(current, { signal })
    },
    enabled: computed(() => request.value !== null),
    // Switch boards without destroying the visible one. Without this, every key the reader has
    // not visited yet has no cache, so `isPending` is true for a moment and the list is replaced
    // by skeletons and back — measured: the list vanished at 3ms and returned at 33ms.
    // `isPlaceholderData` then says the shown rows belong to the *previous* board, which is what
    // the view dims on; keeping stale rows on screen with no signal would be worse than a flicker.
    placeholderData: keepPreviousData,
    // Server-computed rankings; short staleness so switching tabs is cheap but a revisit
    // still refreshes.
    staleTime: 1000 * 30,
  })

  return { ...query, effectivePeriod }
}

/**
 * The catalogue, grouped by category and split by whether a board has members.
 *
 * Since v0.76.0 this is the whole vocabulary — around 842 languages, of which only a couple
 * of dozen carry ranked members. Everything here is selectable: an empty board answers 200
 * and simply has nobody in it.
 */
export function useLeaderboardLanguages() {
  const query = useQuery({
    queryKey: leaderboardKeys.languages(),
    queryFn: ({ signal }) => getLeaderboardLanguages({ signal }),
    // A board is added when somebody is first scored on it and never removed, so this
    // changes only as fast as people push. Waiting a minute between checks costs nothing.
    staleTime: 1000 * 60,
  })

  const boards = computed(() => query.data.value?.languages ?? [])

  /** The same boards, ordered by category, ready for grouped rendering. */
  const grouped = computed(() => groupLanguageBoards(boards.value))

  return { ...query, boards, grouped }
}

/**
 * Groups boards by category, in `LANGUAGE_TYPE_ORDER`, dropping empty categories.
 *
 * A pure function rather than a `computed` body so the ordering rule has one home and can
 * be tested directly — a test that reimplemented it would keep passing if the real one
 * regressed.
 */
export function groupLanguageBoards(boards: readonly LanguageBoard[]): LanguageBoardGroup[] {
  return LANGUAGE_TYPE_ORDER.map((type) => {
    const ofType = boards.filter((board) => board.type === type)
    return {
      type,
      withMembers: ofType.filter((board) => board.hasMembers),
      withoutMembers: ofType.filter((board) => !board.hasMembers),
    }
  }).filter((group) => group.withMembers.length + group.withoutMembers.length > 0)
}

/**
 * Legal periods for a dimension — drives the period selector so it can never offer a
 * choice the server would reject.
 */
export function periodsFor(dimension: LeaderboardDimension): readonly LeaderboardPeriod[] {
  return DIMENSION_PERIODS[dimension]
}

/**
 * Whether a dimension is partitioned by language.
 *
 * The server's `LeaderboardDimension.requiresLanguage()`: exactly `LANGUAGE` today, and the
 * single place this client decides whether a language has to be selected and sent.
 */
export function requiresLanguage(dimension: LeaderboardDimension): boolean {
  return dimension === 'LANGUAGE'
}

/**
 * Readable labels for the UI. Kept beside the enums rather than in the view so the wording
 * for a dimension lives in one place.
 */
export const DIMENSION_LABELS: Record<LeaderboardDimension, string> = {
  TOTAL: 'Total time',
  STREAK: 'Streak',
  NIGHT_OWL: 'Night owl',
  EARLY_BIRD: 'Early bird',
  GROWTH: 'Growth',
  ACTIVE_DAYS: 'Active days',
  LANGUAGE: 'Language',
}

export const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  ALL: 'All time',
  WEEK: 'This week',
  MONTH: 'This month',
  YEAR: 'This year',
}

/**
 * Categories in the order the selector groups them: the languages a reader is most likely
 * to look for first, then the formats, then the rest.
 */
export const LANGUAGE_TYPE_ORDER = ['PROGRAMMING', 'MARKUP', 'DATA', 'PROSE', 'OTHER'] as const

/**
 * Category headings. Total over `LanguageType`, including `OTHER` — which the selector
 * never renders because no board can exist for it, but a total map is what keeps a future
 * category from silently rendering unlabelled.
 */
export const LANGUAGE_TYPE_LABELS: Record<LanguageType, string> = {
  PROGRAMMING: 'Programming languages',
  MARKUP: 'Markup & styling',
  DATA: 'Data & config',
  PROSE: 'Prose & docs',
  OTHER: 'Other',
}
