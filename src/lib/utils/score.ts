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
 * single formatter would lie: `TOTAL`/`NIGHT_OWL`/`EARLY_BIRD`/`LANGUAGE` are seconds,
 * `STREAK` and `ACTIVE_DAYS` are counts of days, and `GROWTH` is a **signed** net delta
 * that can be negative (`LeaderboardService.computeScore`: this period unless `ALL`,
 * minus the one before it) — hence three branches, not one duration call.
 *
 * @param score - raw server score
 * @param dimension - which dimension it came from
 * @returns Display string for that unit
 */
export function formatScore(score: number, dimension: LeaderboardDimension): string {
  // Deliberately **exhaustive with no `default`**: adding a dimension must fail to compile
  // until its unit has been decided here, which is exactly the mistake this function exists
  // to prevent (a new dimension silently inheriting the seconds branch).
  switch (dimension) {
    // Both are day counts, not durations: STREAK is a run length, ACTIVE_DAYS the number of
    // distinct days carrying time. `formatDuration` would print "2h" for a score of 2 — the
    // same string a duration would produce, for a different fact.
    case 'STREAK':
    case 'ACTIVE_DAYS':
      return `${score} ${score === 1 ? 'day' : 'days'}`

    // Signed in both directions, and neither mark for zero: a zero delta has no direction, so
    // `+0s` would claim an increase that did not happen. `down` carries the magnitude in words
    // while `+` carried it in a glyph, which asked the reader to compare two different notations
    // for one axis — a word against a symbol — so both directions now use the same one.
    //
    // A minus sign (U+2212) rather than a hyphen: it is the character that pairs with `+` at the
    // same width, which is what a column of tabular figures wants. Like the `+`, it needs no
    // translation — which is the reason the arrow was rejected, and it does not apply here.
    case 'GROWTH': {
      const magnitude = formatDuration(Math.abs(score))
      if (score === 0) return magnitude
      return `${score > 0 ? '+' : '−'}${magnitude}`
    }

    // Merged seconds, one branch per source. LANGUAGE is a single language's merged time,
    // in seconds like the rest — the unit does not change because the board is partitioned.
    case 'TOTAL':
    case 'NIGHT_OWL':
    case 'EARLY_BIRD':
    case 'LANGUAGE':
      return formatDuration(score)
  }
}
