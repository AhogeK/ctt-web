import type { LeaderboardDimension } from '@/lib/schemas/leaderboard.schema'
import { formatDuration } from './time'

/**
 * Render a leaderboard score in the unit its dimension actually uses.
 *
 * A shared formatter rather than a panel-local helper (the `formatDuration` /
 * `formatPercent` rule): it is the same kind of thing those two are, so it belongs in
 * the same place, and the next surface that prints a score must read it the same way.
 * That a *type* comes from the leaderboard domain does not move the file — a type-only
 * import is erased, so this adds no runtime dependency on the schema.
 *
 * The server sends one `score` number whose meaning depends on the dimension, so a
 * single formatter would lie: `TOTAL`/`NIGHT_OWL`/`EARLY_BIRD` are seconds, `STREAK` is
 * a count of days, and `GROWTH` is a **signed** net delta. `GROWTH` is literally
 * `thisWeek - lastWeek` in seconds (`LeaderboardService.computeScore`), so it is
 * negative whenever the reader slipped — hence three branches, not one duration call.
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
      // so it must not be printed as a bare magnitude. `down` carries the direction
      // and the duration carries the magnitude, which reads as "2h down".
      return `${score > 0 ? '+' : ''}${formatDuration(Math.abs(score))}${score < 0 ? ' down' : ''}`
    default:
      return formatDuration(score)
  }
}
