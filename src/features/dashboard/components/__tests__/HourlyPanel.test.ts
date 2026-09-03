import { describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import HourlyPanel from '../HourlyPanel.vue'

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

// The composable resolves through TanStack Query — stub it to feed data.
const { mockHourlyData } = vi.hoisted(() => {
  const state = { value: undefined as unknown }
  return {
    mockHourlyData: {
      get value(): unknown {
        return state.value
      },
      set value(v: unknown) {
        state.value = v
      },
    },
  }
})

vi.mock('@/composables/useStats', () => ({
  useStatsHourly: () => ({
    data: mockHourlyData,
    isPending: { value: false },
    isError: { value: false },
    refetch: vi.fn<() => Promise<unknown>>(),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockHourlyData.value = undefined
})

afterEach(() => {
  vi.restoreAllMocks()
})

function pointsFor(entries: Array<[hour: number, seconds: number]>) {
  mockHourlyData.value = {
    points: entries.map(([hour, averageSeconds]) => ({ hour, averageSeconds })),
    activeDays: 5,
  }
}

describe('HourlyPanel', () => {
  it('initializes ECharts once on mount', () => {
    pointsFor([[9, 3600]])
    mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    expect(mockInitCalls()).toHaveLength(1)
  })

  it('builds 24 bars with zero-fill for silent hours', async () => {
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

  it('disposes the chart on unmount', () => {
    pointsFor([[9, 3600]])
    const wrapper = mount(HourlyPanel, { props: { deviceId: null, ideName: null } })
    wrapper.unmount()
    expect(mockChart.dispose).toHaveBeenCalledTimes(1)
  })
})
