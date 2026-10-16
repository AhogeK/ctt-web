import { describe, expect, it, vi } from 'vite-plus/test'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick, type Ref } from 'vue'
import { formatDate } from '../../composables/useDashboardFilters'
import HourlyPanel from '../HourlyPanel.vue'

// The global setup only cleans Testing Library renders — Vue Test Utils
// wrappers must be unmounted here, or earlier mounts keep reacting to the
// reactive stubs and pollute the shared chart mock's call record.
enableAutoUnmount(afterEach)

// ==========================================
// Mocks — ECharts init/resize/dispose + ResizeObserver (jsdom has neither)
// ==========================================

const { mockChart, mockInit, mockInitCalls } = vi.hoisted(() => {
  const mockChart = {
    setOption: vi.fn<(option: unknown, notMerge?: boolean) => void>(),
    resize: vi.fn<() => void>(),
    dispose: vi.fn<() => void>(),
    convertToPixel: vi.fn<(finder: { xAxisIndex?: number; yAxisIndex?: number }, value: unknown) => number>(() => 100),
  }
  const mockInit = vi.fn<() => typeof mockChart>(() => mockChart)
  return { mockChart, mockInit, mockInitCalls: () => mockInit.mock.calls }
})

vi.mock('echarts/core', () => ({
  init: mockInit,
  graphic: {
    LinearGradient: class {
      constructor(..._args: unknown[]) {}
    },
  },
}))

class MockResizeObserver {
  observe = vi.fn<(target: Element) => void>()
  disconnect = vi.fn<() => void>()
}
vi.stubGlobal('ResizeObserver', MockResizeObserver)

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn<() => { isDark: boolean }>(() => ({ isDark: false })),
}))

vi.mock('@/components/charts/echarts-setup', () => ({}))

// The composables resolve through TanStack Query — stub them with reactive
// refs so data arriving after mount (the real refetch path) can be exercised.
const { hourlyState, hourlyDaysState } = vi.hoisted(() => ({
  hourlyState: {} as { ref?: Ref<unknown> },
  hourlyDaysState: {} as { ref?: Ref<unknown> },
}))

vi.mock('@/composables/useStats', async () => {
  const { ref } = await import('vue')
  hourlyState.ref = ref<unknown>()
  hourlyDaysState.ref = ref<unknown>()
  const stub = (data: Ref<unknown>) => ({
    data,
    isPending: { value: false },
    isError: { value: false },
    refetch: vi.fn<() => Promise<unknown>>(),
  })
  return {
    useStatsHourly: () => stub(hourlyState.ref!),
    useStatsHourlyDays: () => stub(hourlyDaysState.ref!),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  hourlyState.ref!.value = undefined
  hourlyDaysState.ref!.value = undefined
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function pointsFor(entries: Array<[hour: number, seconds: number]>) {
  hourlyState.ref!.value = {
    points: entries.map(([hour, averageSeconds]) => ({ hour, averageSeconds })),
    activeDays: 5,
  }
}

function daysFor(days: Array<{ date: string; hourlySeconds?: number[] }>, activeDays = days.length) {
  hourlyDaysState.ref!.value = {
    days: days.map((day) => ({
      date: day.date,
      hourlySeconds: day.hourlySeconds ?? Array.from({ length: 24 }, () => 60),
    })),
    activeDays,
  }
}

interface SeriesShape {
  type: string
  silent?: boolean
  data: Array<number | null>
  lineStyle?: { width?: number }
  markLine?: { data: Array<{ xAxis: number }> }
}

/** First-render option — data stubs are set before mount, so call 0 has it all. */
function optionAt(call = 0) {
  return mockChart.setOption.mock.calls[call]![0] as {
    xAxis: { data: string[] }
    yAxis: { min: number; max: number; interval: number }
    series: SeriesShape[]
  }
}

describe('HourlyPanel', () => {
  it('initializes ECharts once on mount', () => {
    pointsFor([[9, 3600]])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    expect(mockInitCalls()).toHaveLength(1)
  })

  it('builds the 24-hour series with zero-fill for silent hours', async () => {
    pointsFor([
      [9, 3600],
      [10, 1800],
    ])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    const option = mockChart.setOption.mock.calls[0]![0] as {
      xAxis: { data: string[] }
      series: Array<{ data: number[] }>
    }
    expect(option.xAxis.data).toHaveLength(24)
    expect(option.xAxis.data[9]).toBe('09:00')
    const data = option.series[0]!.data
    expect(data).toHaveLength(24)
    expect(data[9]).toBe(3600)
    expect(data[10]).toBe(1800)
    expect(data[0]).toBe(0) // zero-filled silent hour
    expect(data[23]).toBe(0)
  })

  it('picks an explicit equidistant Y scale with headroom', () => {
    pointsFor([[9, 3600]]) // peak = 1h
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    const option = mockChart.setOption.mock.calls[0]![0] as {
      yAxis: { min: number; max: number; interval: number }
    }
    expect(option.yAxis.min).toBe(0)
    // 1h peak → 0.25h steps, ceiling 1.25h (exact-on-gridline +1 step)
    expect(option.yAxis.interval).toBe(900)
    expect(option.yAxis.max).toBe(4500)
  })

  it('reads the tooltip value as an average, not a total', () => {
    pointsFor([[9, 5400]])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    const option = mockChart.setOption.mock.calls[0]![0] as {
      tooltip: { formatter: (params: Array<{ axisValue: string; value: number }>) => string }
    }
    expect(option.tooltip.formatter([{ axisValue: '09:00', value: 5400 }])).toBe('<b>09:00</b><br/>avg 1h 30m')
  })

  it('exposes an a11y label with the active-day count', () => {
    pointsFor([[9, 3600]])
    const wrapper = mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    const label = wrapper.find('[role="img"]').attributes('aria-label')
    expect(label).toContain('24 hours')
    expect(label).toContain('5 active days')
  })

  it('renders the active-days footer note', () => {
    pointsFor([[9, 3600]])
    const wrapper = mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    expect(wrapper.text()).toContain('based on 5 active days')
  })

  it('draws the recent active days as faint curves behind the average', () => {
    pointsFor([[9, 3600]])
    daysFor([{ date: '2026-10-08' }, { date: '2026-10-09' }, { date: '2026-10-10' }])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    const series = optionAt().series
    expect(series).toHaveLength(4) // average + three day curves
    for (const day of series.slice(1)) {
      expect(day.type).toBe('line')
      expect(day.silent).toBe(true)
      expect(day.lineStyle?.width).toBe(1)
      expect(day.data).toHaveLength(24)
    }
  })

  it('draws no day curves when a single day is active', () => {
    pointsFor([[9, 3600]])
    daysFor([{ date: '2026-10-10' }])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    expect(optionAt().series).toHaveLength(1)
  })

  it('keeps only the average line on phone-narrow panels', () => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(400)
    pointsFor([[9, 3600]])
    const spike = Array.from({ length: 24 }, () => 0)
    spike[9] = 7200
    daysFor([
      { date: '2026-10-09', hourlySeconds: spike },
      { date: '2026-10-10', hourlySeconds: spike },
    ])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    const series = optionAt().series
    expect(series).toHaveLength(1)
    expect(series[0]!.markLine).toBeUndefined()
    // The undrawn day curves must not stretch the axis either.
    expect(optionAt().yAxis.max).toBe(4500)
  })

  it('marks the current hour when today is among the days', () => {
    pointsFor([[9, 3600]])
    daysFor([{ date: '2026-10-09' }, { date: formatDate(new Date()) }])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    expect(optionAt().series[0]!.markLine?.data[0]?.xAxis).toBe(new Date().getHours())
  })

  it('leaves the average unmarked when today is outside the window', () => {
    pointsFor([[9, 3600]])
    daysFor([{ date: '2026-10-09' }, { date: '2026-10-10' }])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    expect(optionAt().series[0]!.markLine).toBeUndefined()
  })

  it("trims today's curve at the current hour", () => {
    const nowHour = new Date().getHours()
    pointsFor([[9, 3600]])
    daysFor([{ date: '2026-10-09' }, { date: formatDate(new Date()) }])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    const todays = optionAt().series[2]!.data
    expect(todays[0]).toBe(60)
    expect(todays[nowHour]).toBe(60)
    // Every hour past the current one is a gap, not a zero (empty at 23:xx).
    expect(todays.slice(nowHour + 1).every((v) => v === null)).toBe(true)
  })

  it('scales the Y axis to the day curves, not just the average', () => {
    pointsFor([[9, 3600]])
    const spike = Array.from({ length: 24 }, () => 0)
    spike[9] = 7200
    daysFor([
      { date: '2026-10-09', hourlySeconds: spike },
      { date: '2026-10-10', hourlySeconds: spike },
    ])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    expect(optionAt().yAxis.max).toBeGreaterThanOrEqual(7200)
  })

  it('names the faint lines in the footer and the a11y label', () => {
    pointsFor([[9, 3600]])
    daysFor([{ date: '2026-10-08' }, { date: '2026-10-09' }, { date: '2026-10-10' }])
    const wrapper = mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    expect(wrapper.text()).toContain('faint lines: the last 3 days')
    const label = wrapper.find('[role="img"]').attributes('aria-label')
    expect(label).toContain('faint lines show the last 3 days')
    expect(label).not.toContain('dashed line')
  })

  it('states the current-hour marker in the a11y label when today is in range', () => {
    pointsFor([[9, 3600]])
    daysFor([{ date: '2026-10-09' }, { date: formatDate(new Date()) }])
    const wrapper = mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    const label = wrapper.find('[role="img"]').attributes('aria-label')
    expect(label).toContain('a dashed line marks the current hour')
  })

  it('draws the average as a line over an area, not bars', () => {
    pointsFor([[9, 3600]])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    expect(optionAt().series[0]!.type).toBe('line')
  })

  it('caps the day curves at five when more days are active', () => {
    pointsFor([[9, 3600]])
    daysFor([
      { date: '2026-10-10' },
      { date: '2026-10-11' },
      { date: '2026-10-12' },
      { date: '2026-10-13' },
      { date: '2026-10-14' },
      { date: '2026-10-15' },
      { date: '2026-10-16' },
    ])
    const wrapper = mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    expect(optionAt().series).toHaveLength(6) // average + five day curves
    expect(wrapper.text()).toContain('faint lines: the last 5 days')
  })

  it('re-reads the local day when the window rolls past midnight', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 16, 23, 30))
    pointsFor([[9, 3600]])
    daysFor([{ date: '2026-10-15' }, { date: '2026-10-16' }])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    expect(optionAt().series[0]!.markLine?.data[0]?.xAxis).toBe(23)

    // Midnight passes and the query refetches with the new day appended.
    vi.setSystemTime(new Date(2026, 9, 17, 1, 5))
    daysFor([{ date: '2026-10-16' }, { date: '2026-10-17' }])
    await nextTick()

    const calls = mockChart.setOption.mock.calls
    const option = optionAt(calls.length - 1)
    expect(option.series[0]!.markLine?.data[0]?.xAxis).toBe(1)
    const newDay = option.series[2]!.data
    expect(newDay[1]).toBe(60)
    expect(newDay[2]).toBeNull()
  })

  it('disposes the chart on unmount', () => {
    pointsFor([[9, 3600]])
    const wrapper = mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    wrapper.unmount()
    expect(mockChart.dispose).toHaveBeenCalledTimes(1)
  })
})
