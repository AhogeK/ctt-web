import { describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import LongTermTrendPanel from '../LongTermTrendPanel.vue'
import { centeredWeeklyAverage } from '../trend-baseline'
import type { DailyStatPoint } from '@/lib/schemas/stats.schema'

// ==========================================
// Mocks — ECharts init/dispose + ResizeObserver (jsdom has neither)
// ==========================================

const { mockChart, mockInit, mockInitCalls } = vi.hoisted(() => {
  const mockChart = {
    setOption: vi.fn<(option: unknown, notMerge?: boolean) => void>(),
    resize: vi.fn<() => void>(),
    dispose: vi.fn<() => void>(),
  }
  const mockInit = vi.fn<() => typeof mockChart>(() => mockChart)
  return { mockChart, mockInit, mockInitCalls: () => mockInit.mock.calls }
})
vi.mock('echarts/core', () => ({
  init: mockInit,
  graphic: {
    // `new`-able stand-in for graphic.LinearGradient.
    LinearGradient: class {
      stops: Array<{ offset: number; color: string }>
      constructor(_x: number, _y: number, _x2: number, _y2: number, stops: Array<{ offset: number; color: string }>) {
        this.stops = stops
      }
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

interface SeriesShape {
  type: string
  data: number[]
  markLine?: {
    silent: boolean
    label: { show: boolean }
    lineStyle: { type: number[] }
    data: Array<{ yAxis: number }>
  }
}

interface OptionShape {
  xAxis: { data: string[]; axisLabel: { interval: (index: number, value: string) => boolean } }
  yAxis: { max: number }
  series: SeriesShape[]
}

function points(secondsList: number[]): DailyStatPoint[] {
  return secondsList.map((seconds, i) => {
    const d = new Date(2026, 0, 1 + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { date: iso, seconds }
  })
}

/** 30 flat days then 30 lower ones — a downward recent trend against the window. */
const DOWN_TREND_SECONDS = [...Array.from({ length: 30 }, () => 7200), ...Array.from({ length: 30 }, () => 5400)]

function lastOption(): OptionShape {
  const call = mockChart.setOption.mock.calls.at(-1)!
  return call[0] as OptionShape
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LongTermTrendPanel', () => {
  it('initializes ECharts once and renders dots plus the centered average line', () => {
    const list = [0, 3600, 7200, 0, 1800, 5400, 0, 0, 7200, 3600]
    mount(LongTermTrendPanel, { props: { points: points(list) } })
    expect(mockInitCalls()).toHaveLength(1)
    expect(mockChart.setOption).toHaveBeenCalledTimes(1)

    const option = lastOption()
    expect(option.series.map((s) => s.type)).toEqual(['scatter', 'line'])
    expect(option.series[0]!.data).toEqual(list)
    expect(option.series[1]!.data).toEqual(centeredWeeklyAverage(list))
  })

  it('draws the window mean as a silent dashed markLine on the average line', () => {
    mount(LongTermTrendPanel, { props: { points: points(Array.from({ length: 14 }, () => 3600)) } })
    const markLine = lastOption().series[1]!.markLine!
    expect(markLine.data[0]!.yAxis).toBe(3600)
    expect(markLine.silent).toBe(true)
    expect(markLine.label.show).toBe(false)
    expect(markLine.lineStyle.type).toEqual([6, 4])
  })

  it('badge carries direction, percent, colour and the named baseline tooltip', () => {
    const wrapper = mount(LongTermTrendPanel, { props: { points: points(DOWN_TREND_SECONDS) } })
    const badge = wrapper.get('[data-testid="long-term-delta"]')
    expect(badge.text()).toContain('-14.3%')
    expect(badge.text()).toContain('vs 12-month average')
    expect(badge.html()).toContain('text-destructive')
    expect(badge.attributes('title')).toBe('Last 30 days 1h 30m vs 12-month average 1h 45m')
  })

  it('hides the badge without a usable baseline', () => {
    const allZero = mount(LongTermTrendPanel, { props: { points: points(Array.from({ length: 40 }, () => 0)) } })
    expect(allZero.find('[data-testid="long-term-delta"]').exists()).toBe(false)

    const empty = mount(LongTermTrendPanel, { props: { points: [] } })
    expect(empty.find('[data-testid="long-term-delta"]').exists()).toBe(false)
  })

  it('exposes a full a11y label: range, both means and the change', () => {
    const wrapper = mount(LongTermTrendPanel, { props: { points: points(DOWN_TREND_SECONDS) } })
    const label = wrapper.find('[role="img"]').attributes('aria-label')
    expect(label).toContain('60 days from 2026-01-01 to 2026-03-01')
    expect(label).toContain('12-month average 1h 45m')
    expect(label).toContain('Last 30 days average 1h 30m')
    expect(label).toContain('-14.3% against the 12-month average')
  })

  it('captions the layers with the baseline value', () => {
    const wrapper = mount(LongTermTrendPanel, { props: { points: points(DOWN_TREND_SECONDS) } })
    expect(wrapper.get('[data-testid="long-term-note"]').text()).toBe(
      '\u25cf daily \u00b7 \u2500 7-day average \u00b7 \u2504 12-month average 1h 45m',
    )
  })

  it('keeps seconds on average levels — two-digit, dropped at :00', () => {
    // 270,010s over 40 days → 6,750.25s → 1h 52m 30s
    const list = [...Array.from({ length: 30 }, () => 7200), ...Array.from({ length: 10 }, () => 5401)]
    const wrapper = mount(LongTermTrendPanel, { props: { points: points(list) } })
    expect(wrapper.get('[data-testid="long-term-note"]').text()).toContain('12-month average 1h 52m 30s')
  })

  it('names the baseline after the chosen window', () => {
    const wrapper = mount(LongTermTrendPanel, {
      props: { points: points(DOWN_TREND_SECONDS), windowLabel: '2025' },
    })
    expect(wrapper.get('[data-testid="long-term-note"]').text()).toContain('2025 average 1h 45m')
    expect(wrapper.get('[data-testid="long-term-delta"]').text()).toContain('vs 2025 average')
    expect(wrapper.find('[role="img"]').attributes('aria-label')).toContain('2025 average 1h 45m')
  })

  it('drops the dots and the daily legend entry on narrow panels', async () => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(400)
    const wrapper = mount(LongTermTrendPanel, { props: { points: points(DOWN_TREND_SECONDS) } })

    const option = lastOption()
    expect(option.series.map((s) => s.type)).toEqual(['line'])
    expect(option.series[0]!.markLine!.data[0]!.yAxis).toBe(6300)
    // The mount-time width lands after the first template render, so the
    // caption updates one tick later (the chart option already re-rendered).
    await wrapper.vm.$nextTick()
    const note = wrapper.get('[data-testid="long-term-note"]').text()
    expect(note).not.toContain('daily')
    expect(note).toContain('7-day average')
  })

  it('labels every month when the card has room, every other month on narrow cards', () => {
    // A full year of dense days: twelve month starts, the newest = December.
    const year = points(Array.from({ length: 365 }, () => 3600))
    const allStarts = year.filter((p) => p.date.endsWith('-01')).map((p) => p.date)
    expect(allStarts).toHaveLength(12)

    mount(LongTermTrendPanel, { props: { points: year } })
    expect(year.filter((p) => lastOption().xAxis.axisLabel.interval(0, p.date))).toHaveLength(12)

    // A phone card: every other month, counted back from the newest — the
    // current month always stays labelled and the rhythm is width-stable.
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(400)
    mount(LongTermTrendPanel, { props: { points: year } })
    const narrowInterval = lastOption().xAxis.axisLabel.interval
    const kept = year.filter((p) => narrowInterval(0, p.date)).map((p) => p.date)
    expect(kept).toEqual(['2026-02-01', '2026-04-01', '2026-06-01', '2026-08-01', '2026-10-01', '2026-12-01'])
  })

  it('scales the y-axis to the drawn layers: raw days wide, the average on a phone', () => {
    // One tall day (6h) among flat 1h days — the spike a phone never draws.
    const spike = points([...Array.from({ length: 30 }, () => 3600), 21600, ...Array.from({ length: 30 }, () => 3600)])

    mount(LongTermTrendPanel, { props: { points: spike } })
    const wideMax = lastOption().yAxis.max
    expect(wideMax).toBeGreaterThanOrEqual(21600)

    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(400)
    mount(LongTermTrendPanel, { props: { points: spike } })
    const narrowMax = lastOption().yAxis.max
    expect(narrowMax).toBeLessThan(wideMax)
    expect(narrowMax).toBeGreaterThanOrEqual(3600)
  })

  it('re-renders on new points without re-initializing', async () => {
    const wrapper = mount(LongTermTrendPanel, { props: { points: points([3600, 7200]) } })
    expect(mockInitCalls()).toHaveLength(1)
    await wrapper.setProps({ points: points([3600, 7200, 10800]) })
    expect(mockInitCalls()).toHaveLength(1)
    expect(mockChart.setOption).toHaveBeenCalledTimes(2)
  })

  it('disposes the chart and observer on unmount', () => {
    const wrapper = mount(LongTermTrendPanel, { props: { points: points([3600]) } })
    wrapper.unmount()
    expect(mockChart.dispose).toHaveBeenCalledTimes(1)
  })
})
