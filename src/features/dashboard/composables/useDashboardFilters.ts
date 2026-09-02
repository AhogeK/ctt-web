import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** Date range presets offered by the dashboard filter bar. */
export type DateRangePreset = 'all' | 'month' | '90d' | 'year' | 'custom'

/**
 * Lower bound for the All-time range. Real coding sessions cannot predate it;
 * it exists so "no URL params" resolves to an explicit backend range instead
 * of the backend's own default (this calendar year).
 */
export const ALL_TIME_START = '2000-01-01'

/**
 * Format a date as yyyy-MM-dd in the local timezone — matches the backend
 * LocalDate params consumed by the stats endpoints.
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Read a single string from a route query value (string | string[] | undefined). */
function queryString(value: unknown): string | undefined {
  if (Array.isArray(value)) return value[0]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** Resolve a non-custom preset to its inclusive local date range. */
export function resolvePresetRange(
  preset: Exclude<DateRangePreset, 'custom'>,
  now = new Date(),
): { start: string; end: string } {
  const end = formatDate(now)
  switch (preset) {
    case 'all':
      return { start: ALL_TIME_START, end }
    case 'month':
      return { start: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)), end }
    case '90d':
      return { start: formatDate(new Date(now.getTime() - 89 * 86_400_000)), end }
    case 'year':
      return { start: formatDate(new Date(now.getFullYear(), 0, 1)), end }
  }
}

/**
 * Infer which preset the current start/end range matches, if any. A range
 * that equals a preset's resolution maps back to that preset; anything else
 * is a custom range.
 */
export function inferPreset(start?: string, end?: string, now = new Date()): DateRangePreset {
  // No URL params at all = All time (the dashboard's default view).
  if (!start && !end) return 'all'
  if (!start || !end) return 'custom'
  const month = resolvePresetRange('month', now)
  if (start === month.start && end === month.end) return 'month'
  const days90 = resolvePresetRange('90d', now)
  if (start === days90.start && end === days90.end) return '90d'
  const year = resolvePresetRange('year', now)
  if (start === year.start && end === year.end) return 'year'
  const all = resolvePresetRange('all', now)
  if (start === all.start && end === all.end) return 'all'
  return 'custom'
}

/**
 * Dashboard filter state backed by URL SearchParams.
 *
 * The URL query (`start` / `end` / `deviceId`) is the single source of truth:
 * - values are absolute (yyyy-MM-dd), so a URL is shareable and survives refresh
 * - the active preset is derived from start/end rather than stored, avoiding
 *   stale preset labels when a custom range happens to match one
 * - setters replace the query (no history spam), and every change re-keys the
 *   stats queries (keys include range + origin filter), driving refetch
 */
export function useDashboardFilters() {
  const route = useRoute()
  const router = useRouter()

  /** Inclusive range start (yyyy-MM-dd), or undefined when unset. */
  const start = computed(() => queryString(route.query.start))
  /** Inclusive range end (yyyy-MM-dd), or undefined when unset. */
  const end = computed(() => queryString(route.query.end))
  /** Selected origin device id, or undefined for all devices. */
  const deviceId = computed(() => queryString(route.query.deviceId))
  /** Exact IDE-name filter, or undefined for all IDEs. */
  const ideName = computed(() => queryString(route.query.ideName))
  /**
   * Heatmap panel year selection (yyyy as string), or undefined for the
   * default rolling 12-month view. Panel-scoped: it re-keys only the
   * heatmap query and never touches the filter-bar range.
   */
  const heatmapYear = computed(() => {
    const raw = queryString(route.query.year)
    if (raw === undefined) return null
    const year = Number(raw)
    return Number.isInteger(year) && year >= 2000 && year <= 9999 ? year : null
  })
  /** Preset the current range maps to ('custom' when it matches none). */
  const preset = computed(() => inferPreset(start.value, end.value))

  /** Merge a patch into the query, dropping keys set to undefined. */
  function updateQuery(patch: Record<string, string | undefined>): void {
    const query: Record<string, string> = {}
    // Apply the patch; undefined values mean "drop this param".
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) query[key] = value
    }
    // Preserve untouched params (only plain string values survive; arrays
    // and nulls from the current URL are not meaningful filter state).
    for (const [key, value] of Object.entries(route.query)) {
      if (!(key in patch) && typeof value === 'string') query[key] = value
    }
    void router.replace({ query })
  }

  /** Set the inclusive date range (undefined omits the param, using server defaults). */
  function setDateRange(nextStart?: string, nextEnd?: string): void {
    updateQuery({ start: nextStart, end: nextEnd })
  }

  /**
   * Apply a non-custom preset. All time clears the URL params entirely (the
   * default view); the others write their resolved range to the URL.
   */
  function applyPreset(next: Exclude<DateRangePreset, 'custom'>): void {
    if (next === 'all') {
      updateQuery({ start: undefined, end: undefined })
      return
    }
    const range = resolvePresetRange(next)
    updateQuery({ start: range.start, end: range.end })
  }

  /**
   * Filter to one device. The backend rejects deviceId + ideName together
   * (400 COMMON_003), so setting one clears the other.
   */
  function setDevice(next: string | null): void {
    updateQuery({ deviceId: next ?? undefined, ideName: undefined })
  }

  /** Filter to one IDE; null clears the filter. Clears any device filter. */
  function setIde(next: string | null): void {
    updateQuery({ ideName: next ?? undefined, deviceId: undefined })
  }

  /**
   * Select the heatmap year view (yyyy) or clear it (null → rolling
   * 12-month default). Independent of the filter-bar range: the year view
   * is heatmap-panel context, so start/end stay untouched.
   */
  function setHeatmapYear(year: number | null): void {
    updateQuery({ year: year === null ? undefined : String(year) })
  }

  /**
   * Origin filter in API params shape (undefined = unfiltered), shared by
   * every stats consumer so the null/undefined conversion lives in one place.
   */
  const originFilter = computed(() => ({
    deviceId: deviceId.value ?? undefined,
    ideName: ideName.value ?? undefined,
  }))
  const deviceIdOrNull = computed(() => deviceId.value ?? null)
  const ideNameOrNull = computed(() => ideName.value ?? null)
  return {
    start,
    end,
    deviceId: deviceIdOrNull,
    ideName: ideNameOrNull,
    heatmapYear,
    originFilter,
    preset,
    setDateRange,
    applyPreset,
    setDevice,
    setIde,
    setHeatmapYear,
  }
}
