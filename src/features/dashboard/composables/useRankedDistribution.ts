import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'

/** One bucket as the backend returns it (already ordered by duration desc). */
export interface RankedEntry {
  /** Bucket key — the language or project name */
  name: string
  /** Raw accumulated coding seconds */
  seconds: number
}

/** One rendered row: a real bucket, or the aggregate of the folded tail. */
export interface RankedRow {
  name: string
  seconds: number
  /** Share of the whole distribution, in percent */
  percent: number
  /** Bar width as a share of the LONGEST row, not of the total */
  barPercent: number
  /** Entries swallowed by this aggregate row — listed in its popover */
  folded: { name: string; percent: number }[]
}

export interface UseRankedDistributionOptions {
  /**
   * Share below which a bucket folds into the aggregate row. Kept identical
   * across dimensions (0.1%, plugin parity) so the panels agree on what counts
   * as a negligible tail.
   */
  minPercent?: number
  /** Label of the aggregate row. */
  aggregateLabel?: string
}

/**
 * Row model shared by the ranked categorical distribution panels (languages,
 * projects, and any further dimension).
 *
 * Two rules it encodes, both of which the panels must not diverge on:
 *
 * 1. **Bar length is scaled to the LONGEST row, not to the total.** The top
 *    row then spans the full track, so no width is wasted whether one bucket
 *    dominates or the distribution is flat.
 * 2. **The tail folds, the data does not.** Buckets under `minPercent` collapse
 *    into one aggregate row that keeps every folded name for hover, so nothing
 *    becomes unreachable — the card bounds its height, never the data.
 *
 * Categorical distributions are super-linear (same-second concurrency counts
 * once per category), so callers must NOT print a total from these rows.
 *
 * @param entries - buckets ordered by duration descending
 * @returns the rows plus the figures the list and the a11y label need
 */
export function useRankedDistribution(
  entries: MaybeRefOrGetter<RankedEntry[]>,
  options: UseRankedDistributionOptions = {},
): {
  rows: ComputedRef<RankedRow[]>
  totalSeconds: ComputedRef<number>
} {
  const minPercent = options.minPercent ?? 0.1
  const aggregateLabel = options.aggregateLabel ?? 'Others'

  const totalSeconds = computed(() => toValue(entries).reduce((acc, e) => acc + e.seconds, 0))

  const rows = computed<RankedRow[]>(() => {
    const all = toValue(entries)
    const total = totalSeconds.value
    if (total <= 0) return []

    // Scale against the longest row so rank 1 fills the track. Guarded with 1
    // so an all-zero distribution yields zero-width bars instead of NaN.
    const longest = Math.max(...all.map((e) => e.seconds), 1)
    const toBar = (seconds: number) => (seconds / longest) * 100

    const above = all.filter((e) => (e.seconds / total) * 100 >= minPercent)
    const below = all.filter((e) => (e.seconds / total) * 100 < minPercent)

    const out: RankedRow[] = above.map((e) => ({
      name: e.name,
      seconds: e.seconds,
      percent: (e.seconds / total) * 100,
      barPercent: toBar(e.seconds),
      folded: [],
    }))

    const foldedSeconds = below.reduce((acc, e) => acc + e.seconds, 0)
    if (foldedSeconds > 0) {
      out.push({
        name: aggregateLabel,
        seconds: foldedSeconds,
        percent: (foldedSeconds / total) * 100,
        barPercent: toBar(foldedSeconds),
        folded: below.map((e) => ({ name: e.name, percent: (e.seconds / total) * 100 })),
      })
    }

    return out
  })

  return { rows, totalSeconds }
}
