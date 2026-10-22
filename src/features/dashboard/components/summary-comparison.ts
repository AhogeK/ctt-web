/**
 * The summary cards' change line: direction, text, colour and tooltip.
 *
 * Split from `SummaryStatGrid` so the rules are unit-testable and the up/down
 * colour convention lives in exactly one place — the interface is English
 * today; when it gains a language, a Chinese locale flips green/red to the
 * A-share convention by changing {@link deltaClass} alone.
 */
import { formatDuration } from '@/lib/utils'
import type { SummaryComparison } from '@/lib/schemas/stats.schema'
import type { SummaryStatItem } from './summary-stat-fields'

/** Direction of the change as the line displays it (after 1-decimal rounding). */
export type ComparisonDirection = 'up' | 'down' | 'flat'

/** What the delta line renders; null means "draw nothing". */
export interface DeltaView {
  direction: ComparisonDirection
  /** '+12.4%' / '-8%' / '0%' */
  text: string
  /** Colour class for the icon and the percent. */
  className: string
  /** Tooltip: the baseline name and its absolute value ('Yesterday · 2h 50m'). */
  title: string
}

/** Percent rounded to the one decimal the line shows, half away from zero — the backend's
 * convention, so a payload like -15.15 reads -15.2 in both places. A bare `percent * 10` lands
 * on the wrong side of a .x5 edge (binary floats), so settle the hundredths first. */
function roundPercent(percent: number): number {
  const tenths = Math.round(Math.round(Math.abs(percent) * 100) / 10)
  return percent < 0 ? -tenths / 10 : tenths / 10
}

/**
 * Direction of the displayed change, or null when nothing should render:
 * no comparison at all (older server), or a null percent (no baseline — the
 * previous period is empty, or dailyAverage on the first coding day).
 */
export function comparisonDirection(comparison: SummaryComparison | undefined): ComparisonDirection | null {
  if (!comparison || comparison.changePercent === null) return null
  const rounded = roundPercent(comparison.changePercent)
  if (rounded > 0) return 'up'
  if (rounded < 0) return 'down'
  return 'flat'
}

/**
 * The percent as the line shows it: one decimal, trailing '.0' dropped,
 * explicit sign unless zero — '+12.4%', '-8%', '-100%', '0%'.
 */
export function formatChangePercent(percent: number): string {
  const rounded = roundPercent(percent)
  if (rounded === 0) return '0%'
  const magnitude = Math.abs(rounded)
  const digits = Number.isInteger(magnitude) ? String(magnitude) : magnitude.toFixed(1)
  return `${rounded > 0 ? '+' : '-'}${digits}%`
}

/**
 * Colour class for a direction — the single mapping point for the up/down
 * colour convention. International today (green = up); a future Chinese
 * locale flips this to the A-share convention (red = up) here and nowhere
 * else.
 */
export function deltaClass(direction: ComparisonDirection): string {
  if (direction === 'up') return 'text-success-ink'
  if (direction === 'down') return 'text-destructive'
  return 'text-muted-foreground'
}

/**
 * Tooltip baseline name. The caller passes the already-localized baseline ("vs yesterday" /
 * "对比昨天"), so only the English form needs the prefix stripped and capitalised.
 */
function baselineName(baseline: string): string {
  const name = baseline.replace(/^vs\s+/i, '')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** Everything the delta line needs, or null when it must not render. */
export function deltaView(item: SummaryStatItem, translate: (key: string) => string): DeltaView | null {
  const { comparison, baseline } = item
  const localized = baseline ? translate(baseline) : ''
  if (!comparison || comparison.changePercent === null || !baseline) return null
  const direction = comparisonDirection(comparison)
  if (!direction) return null
  return {
    direction,
    text: formatChangePercent(comparison.changePercent),
    className: deltaClass(direction),
    title: `${baselineName(localized)} · ${formatDuration(comparison.previousSeconds)}`,
  }
}
