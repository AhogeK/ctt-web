import type { LeaderboardDimension } from '@/lib/schemas/leaderboard.schema'
import { i18n } from '@/i18n'
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
/** Chinese duration wording: hours/minutes/seconds as words, not the compact `1h 30m`. */
function formatZhDuration(seconds: number): string {
  const t = i18n.global.t
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0 && minutes > 0 && secs > 0)
    return t('leaderboard.score.hoursMinutesSeconds', { hours, minutes, seconds: secs })
  if (hours > 0 && minutes > 0) return t('leaderboard.score.hoursMinutes', { hours, minutes })
  if (hours > 0) return t('leaderboard.score.hours', { hours })
  if (minutes > 0 && secs > 0) return t('leaderboard.score.minutesSeconds', { minutes, seconds: secs })
  if (minutes > 0) return t('leaderboard.score.minutes', { minutes })
  return t('leaderboard.score.seconds', { seconds: secs })
}

export function formatScore(score: number, dimension: LeaderboardDimension): string {
  // Deliberately **exhaustive with no `default`**: adding a dimension must fail to compile
  // until its unit has been decided here, which is exactly the mistake this function exists
  // to prevent (a new dimension silently inheriting the seconds branch).
  switch (dimension) {
    // Both are day counts, not durations: STREAK is a run length, ACTIVE_DAYS the number of
    // distinct days carrying time. `formatDuration` would print "2h" for a score of 2 — the
    // same string a duration would produce, for a different fact.
    case 'STREAK':
    case 'ACTIVE_DAYS': {
      const t = i18n.global.t
      return score === 1 ? t('leaderboard.score.day', { count: score }) : t('leaderboard.score.days', { count: score })
    }

    // Signed in both directions, and neither mark for zero: a zero delta has no direction, so
    // `+0s` would claim an increase that did not happen. `down` carries the magnitude in words
    // while `+` carried it in a glyph, which asked the reader to compare two different notations
    // for one axis — a word against a symbol — so both directions now use the same one.
    //
    // A minus sign (U+2212) rather than a hyphen: it is the character that pairs with `+` at the
    // same width, which is what a column of tabular figures wants. Like the `+`, it needs no
    // translation — which is the reason the arrow was rejected, and it does not apply here.
    case 'GROWTH': {
      const magnitude =
        i18n.global.locale.value === 'zh-CN' ? formatZhDuration(Math.abs(score)) : formatDuration(Math.abs(score))
      if (score === 0) return magnitude
      return `${score > 0 ? '+' : '−'}${magnitude}`
    }

    // Merged seconds, one branch per source. LANGUAGE is a single language's merged time,
    // in seconds like the rest — the unit does not change because the board is partitioned.
    case 'TOTAL':
    case 'NIGHT_OWL':
    case 'EARLY_BIRD':
    case 'LANGUAGE':
      return i18n.global.locale.value === 'zh-CN' ? formatZhDuration(score) : formatDuration(score)
  }
}
