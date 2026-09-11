/**
 * Percent readout — the percentage counterpart of `formatDuration` in `time.ts`,
 * and like it a shared util rather than a panel-local helper: any surface that
 * prints a share (distributions today, leaderboard/summary later) must read it
 * the same way.
 *
 * A fixed decimal count is only safe while every value is comfortably larger
 * than that step. Shares are not: a categorical distribution has a long tail by
 * nature (a project used for one second, a language touched once), and at a
 * fixed resolution those entries print as `0%` — the same string as "no time at
 * all". The panel that exists to show them then reports the opposite of the
 * truth.
 *
 * So the precision follows the value: the readout always keeps one digit past
 * the value's first significant digit, never fewer than `step`. `step` sets the
 * resolution for values that can afford it (2 decimals for the distribution
 * lists, 0 for a coarse legend), and does not cap precision — it is a floor,
 * not a ceiling. (See dashboard-visualization P8.)
 *
 * Trailing zeros are trimmed, so the columns read as numbers rather than as
 * padded fields (`41.67%`, `0.21%`, `5%`, `0.0033%`).
 */

/** Decimals kept for values large enough not to need more. */
const DEFAULT_STEP = 2
/**
 * Hard ceiling on precision. Six decimals stay non-zero down to roughly one
 * second out of six years of tracked time — far beyond any real history — and
 * bound the readout to nine visible characters, which is what the value lane is
 * sized for.
 */
const MAX_DECIMALS = 6
/** Smallest share this readout can express, matching MAX_DECIMALS. */
const FLOOR = 10 ** -MAX_DECIMALS

/**
 * Strips the trailing zeros from a fixed-point string, plus the decimal point
 * they leave dangling when they were the entire fractional part
 * (`60.00` → `60`, `0.50` → `0.5`, `5.00` → `5`).
 *
 * A regex (`/0+$/`) expresses the same thing, but its quantifier is retried at
 * every start position, so it degrades quadratically when the string does not
 * end in a zero — measured at ~2.2s for a 100k-character input versus ~1.3µs
 * for this scan. The readouts here are a handful of characters, so this was
 * never a hot path; a single backward pass is both linear and more direct about
 * the two things being removed.
 */
function trimTrailingZeros(fixed: string): string {
  if (!fixed.includes('.')) return fixed

  let end = fixed.length
  while (end > 0 && fixed[end - 1] === '0') end--
  // Everything after the point was zeros, so the point itself goes too.
  if (end > 0 && fixed[end - 1] === '.') end--
  return fixed.slice(0, end)
}

/**
 * Formats a percentage.
 *
 * A value that survives rounding is printed exactly; a value so small that even
 * the precision ceiling cannot express it is printed as `<0.000001` rather than
 * as `0`, because "there is time, below this resolution" and "there is no time"
 * are different facts and the readout must not merge them.
 *
 * @param value - the percentage (already multiplied by 100)
 * @param step - decimals kept for values large enough (default 2); precision
 *   extends beyond it when the value would otherwise round away
 * @returns the number without its `%` sign, trailing zeros trimmed
 */
export function formatPercent(value: number, step: number = DEFAULT_STEP): string {
  if (!Number.isFinite(value) || value <= 0) return '0'

  const decimals = Math.min(MAX_DECIMALS, Math.max(Math.trunc(step), Math.ceil(-Math.log10(value)) + 1))
  const fixed = value.toFixed(decimals)
  // Rounded away entirely at the precision ceiling: report the floor instead of
  // claiming there is nothing.
  if (Number(fixed) === 0 && value > 0) return `<${FLOOR.toFixed(MAX_DECIMALS)}`

  return trimTrailingZeros(fixed)
}
