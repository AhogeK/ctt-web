import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { reactive } from 'vue'
import {
  ALL_TIME_START,
  formatDate,
  inferPreset,
  resolvePresetRange,
  useDashboardFilters,
} from '../useDashboardFilters'

// ==========================================
// vue-router mocks (URL query is the filter source of truth)
// ==========================================

const routeQuery = reactive<Record<string, unknown>>({})
const mockReplace = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>())

vi.mock('vue-router', () => ({
  useRoute: vi.fn<() => { query: Record<string, unknown> }>(() => ({ query: routeQuery })),
  useRouter: vi.fn<() => { replace: typeof mockReplace }>(() => ({ replace: mockReplace })),
}))

beforeEach(() => {
  for (const key of Object.keys(routeQuery)) delete routeQuery[key]
  mockReplace.mockClear()
})

describe('formatDate', () => {
  it('formats a date as yyyy-MM-dd in local time', () => {
    expect(formatDate(new Date(2026, 8, 1))).toBe('2026-09-01')
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('resolvePresetRange', () => {
  const now = new Date(2026, 8, 15) // 2026-09-15

  it('month spans the first day of the month to today', () => {
    expect(resolvePresetRange('month', now)).toEqual({ start: '2026-09-01', end: '2026-09-15' })
  })

  it('90d spans 89 days back to today (inclusive)', () => {
    expect(resolvePresetRange('90d', now)).toEqual({ start: '2026-06-18', end: '2026-09-15' })
  })

  it('all time spans the fixed lower bound to today', () => {
    expect(resolvePresetRange('all', now)).toEqual({ start: ALL_TIME_START, end: '2026-09-15' })
  })
})

describe('inferPreset', () => {
  const now = new Date(2026, 8, 15)

  it('maps matching ranges back to their preset', () => {
    expect(inferPreset('2026-09-01', '2026-09-15', now)).toBe('month')
    expect(inferPreset('2026-06-18', '2026-09-15', now)).toBe('90d')
    expect(inferPreset('2026-01-01', '2026-09-15', now)).toBe('year')
    expect(inferPreset(ALL_TIME_START, '2026-09-15', now)).toBe('all')
  })

  it('returns custom for unmatched or partial ranges', () => {
    expect(inferPreset('2026-09-10', '2026-09-15', now)).toBe('custom')
    expect(inferPreset(undefined, '2026-09-15', now)).toBe('custom')
    expect(inferPreset('2026-09-01', undefined, now)).toBe('custom')
  })
})

describe('useDashboardFilters', () => {
  it('exposes unset filters when the URL has no query params', () => {
    const { deviceId, preset } = useDashboardFilters()

    // deviceId/ideName surface as null when no filter is set.
    expect(deviceId.value).toBeNull()
    // No URL params → the default All time view.
    expect(preset.value).toBe('all')
  })

  it('reads filters from URL query params', () => {
    const range = resolvePresetRange('month')
    Object.assign(routeQuery, { start: range.start, end: range.end, deviceId: '550e8400-e29b-41d4-a716-446655440000' })
    const { start, end, deviceId, preset } = useDashboardFilters()

    expect(start.value).toBe(range.start)
    expect(end.value).toBe(range.end)
    expect(deviceId.value).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(preset.value).toBe('month')
  })

  it('handles array query values by taking the first entry', () => {
    Object.assign(routeQuery, { start: ['2026-01-01', '2025-01-01'] })
    const { start } = useDashboardFilters()
    expect(start.value).toBe('2026-01-01')
  })

  it('applyPreset writes the resolved range to the URL via replace', () => {
    const { applyPreset } = useDashboardFilters()

    applyPreset('year')

    const range = resolvePresetRange('year')
    expect(mockReplace).toHaveBeenCalledWith({ query: { start: range.start, end: range.end } })
  })

  it('applyPreset("all") clears the range params from the URL', () => {
    Object.assign(routeQuery, { deviceId: 'dev-1' })
    const { applyPreset } = useDashboardFilters()

    applyPreset('all')

    expect(mockReplace).toHaveBeenCalledWith({ query: { deviceId: 'dev-1' } })
  })

  it('applyPreset preserves unrelated query params and drops undefined ones', () => {
    Object.assign(routeQuery, { deviceId: 'dev-1', stale: 'keep' })
    const { applyPreset, deviceId } = useDashboardFilters()

    applyPreset('month')

    const range = resolvePresetRange('month')
    expect(mockReplace).toHaveBeenCalledWith({
      query: { deviceId: 'dev-1', stale: 'keep', start: range.start, end: range.end },
    })
    // deviceId stays readable after the replace.
    expect(deviceId.value).toBe('dev-1')
  })

  it('setDateRange writes explicit dates and can clear them', () => {
    const { setDateRange } = useDashboardFilters()

    setDateRange('2026-07-01', '2026-07-31')
    expect(mockReplace).toHaveBeenLastCalledWith({ query: { start: '2026-07-01', end: '2026-07-31' } })

    setDateRange(undefined, undefined)
    expect(mockReplace).toHaveBeenLastCalledWith({ query: {} })
  })

  it('setDevice filters to a device and null clears the filter', () => {
    const { setDevice } = useDashboardFilters()

    setDevice('550e8400-e29b-41d4-a716-446655440000')
    expect(mockReplace).toHaveBeenLastCalledWith({ query: { deviceId: '550e8400-e29b-41d4-a716-446655440000' } })

    setDevice(null)
    expect(mockReplace).toHaveBeenLastCalledWith({ query: {} })
  })

  it('preset reacts to query changes', () => {
    const { preset } = useDashboardFilters()

    const year = resolvePresetRange('year')
    Object.assign(routeQuery, { start: year.start, end: year.end })
    expect(preset.value).toBe('year')

    const customStart = formatDate(new Date(Date.now() - 5 * 86_400_000))
    const today = formatDate(new Date())
    Object.assign(routeQuery, { start: customStart, end: today })
    expect(preset.value).toBe('custom')
  })

  it('setHeatmapYear writes the year param and null clears it', () => {
    const { setHeatmapYear } = useDashboardFilters()

    setHeatmapYear(2025)
    expect(mockReplace).toHaveBeenLastCalledWith({ query: { year: '2025' } })

    setHeatmapYear(null)
    expect(mockReplace).toHaveBeenLastCalledWith({ query: {} })
  })

  it('heatmapYear reads the URL param and surfaces null when unset', () => {
    const filters = useDashboardFilters()
    expect(filters.heatmapYear.value).toBeNull()

    Object.assign(routeQuery, { year: '2024' })
    expect(filters.heatmapYear.value).toBe(2024)
  })

  it('setHeatmapYear preserves unrelated query params', () => {
    Object.assign(routeQuery, { deviceId: 'dev-1' })
    const { setHeatmapYear } = useDashboardFilters()

    setHeatmapYear(2025)
    expect(mockReplace).toHaveBeenLastCalledWith({ query: { deviceId: 'dev-1', year: '2025' } })
  })
})
