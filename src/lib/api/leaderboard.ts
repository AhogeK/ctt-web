import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import {
  LanguageBoardsResponseSchema,
  LeaderboardResponseSchema,
  type LanguageBoardsResponse,
  type LeaderboardRequest,
  type LeaderboardResponse,
} from '@/lib/schemas/leaderboard.schema'

/** Options every call here accepts — currently just cancellation. */
interface LeaderboardCallOptions {
  /**
   * Abort signal from the query layer.
   *
   * Wired through because the endpoint is rate limited to **60 requests/minute**
   * (`RATE_LIMIT_001`): a reader switching dimensions leaves the previous page's request
   * in flight, and abandoned requests still spend the budget. TanStack cancels a query
   * when it becomes unused, but only if the fetch actually consumes the signal.
   */
  signal?: AbortSignal
}

/**
 * Fetches one page of a leaderboard ranking.
 *
 * Endpoint: `GET /api/v1/leaderboard`
 * Authentication: required (JWT bearer).
 *
 * The caller passes a `LeaderboardRequest`, which is a **discriminated union**: the
 * `LANGUAGE` dimension cannot be requested without a language, and no other dimension can
 * be requested with one. Both mistakes are HTTP 400 `COMMON_003` server-side (measured
 * against v0.75.0 — the second deliberately, since silently ignoring a language would
 * answer a different question than the one asked), so the type makes them unbuildable.
 *
 * `dimension` is mandatory, and the legal `period` values depend on it — an unsupported
 * pair is also `COMMON_003` ("Dimension STREAK does not support period WEEK").
 * `DIMENSION_PERIODS` holds that constraint; derive the period from it rather than
 * offering a free choice.
 *
 * @param request - dimension, period, paging, and the language when partitioned
 * @param options - abort signal
 * @returns The page's entries, the caller's own rank (null when unranked) and the board's size
 */
export async function getLeaderboard(
  request: LeaderboardRequest,
  options: LeaderboardCallOptions = {},
): Promise<LeaderboardResponse> {
  const query: Record<string, string | number | undefined> = {
    dimension: request.dimension,
    period: request.period,
    limit: request.limit,
    offset: request.offset,
  }
  // Sent only for the partitioned dimension. The union narrows `request` here, so the
  // language cannot be read on a branch that has none.
  if (request.dimension === 'LANGUAGE') query.language = request.language

  const response = await apiFetch<unknown>('/api/v1/leaderboard', {
    method: 'GET',
    query,
    signal: options.signal,
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return LeaderboardResponseSchema.parse(wrapped.data)
}

/**
 * Lists the languages that have a board, for the language selector.
 *
 * Endpoint: `GET /api/v1/leaderboard/languages`
 * Authentication: required (JWT bearer).
 *
 * The catalogue is **global**, not "languages this caller has used", and it is populated
 * lazily: a board appears once somebody is scored on it, so it is legitimately empty on a
 * deployment where nobody has pushed since the dimension was introduced. A listed board can
 * equally be empty for the current period — the listing is deliberately sticky so the
 * selector does not move under the reader when a period rolls over.
 *
 * @param options - abort signal
 * @returns The catalogue, unfiltered; callers should pass it through `selectableLanguageBoards`
 */
export async function getLeaderboardLanguages(options: LeaderboardCallOptions = {}): Promise<LanguageBoardsResponse> {
  const response = await apiFetch<unknown>('/api/v1/leaderboard/languages', {
    method: 'GET',
    signal: options.signal,
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return LanguageBoardsResponseSchema.parse(wrapped.data)
}
