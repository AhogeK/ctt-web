/**
 * The dashboard's six summary fields, in display order.
 *
 * Their own module rather than an export from an SFC: `<script setup>` cannot carry named exports, and
 * both consumers (`SummaryCards` with live data, the marketing hero with example data) need the same
 * label/icon table. Keys match the API field names, so a consumer maps data without a second lookup.
 */
import {
  Activity,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Timer,
  type LucideIcon,
} from '@lucide/vue'

export interface SummaryStatItem {
  /** Uppercase card label ("This week"). */
  label: string
  /** Value in seconds; formatted with the shared duration formatter. */
  seconds: number
  icon: LucideIcon
}

export const SUMMARY_STAT_FIELDS = [
  { key: 'today', label: 'Today', icon: Activity },
  { key: 'dailyAverage', label: 'Daily avg', icon: CalendarCheck },
  { key: 'thisWeek', label: 'This week', icon: CalendarDays },
  { key: 'thisMonth', label: 'This month', icon: CalendarRange },
  { key: 'thisYear', label: 'This year', icon: CalendarClock },
  { key: 'total', label: 'Total', icon: Timer },
] as const

export type SummaryStatKey = (typeof SUMMARY_STAT_FIELDS)[number]['key']

/** Icons that take the brand tint, as opposed to the muted hover tint. */
export const SUMMARY_ACCENT_ICONS = new Set<LucideIcon>([Activity, Timer])
