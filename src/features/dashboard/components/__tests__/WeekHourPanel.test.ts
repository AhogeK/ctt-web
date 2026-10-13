import { describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import WeekHourPanel from '../WeekHourPanel.vue'

// ==========================================
// Mocks — ECharts init/dispose + ResizeObserver (jsdom has neither)
// ==========================================

const { mockChart, mockInit } = vi.hoisted(() => {
  const mockChart = {
    setOption: vi.fn<(option: unknown, notMerge?: boolean) => void>(),
    resize: vi.fn<() => void>(),
    dispose: vi.fn<() => void>(),
  }
  const mockInit = vi.fn<() => typeof mockChart>(() => mockChart)
  return { mockChart, mockInit }
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
  useThemeStore: vi.fn<() => { isDark: boolean }>(() => ({ isDark: true })),
}))

vi.mock('@/components/charts/echarts-setup', () => ({}))

// The composable resolves through TanStack Query — stub it to feed data.
const { mockWeekHourData } = vi.hoisted(() => {
  const state = { value: undefined as unknown }
  return {
    mockWeekHourData: {
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
  useStatsWeekHour: () => ({
    data: mockWeekHourData,
    isPending: { value: false },
    isError: { value: false },
    refetch: vi.fn<() => Promise<unknown>>(),
  }),
}))

/** One measured cell (Mon 09:00, 118s average) — every other cell is silent. */
function feed(): void {
  mockWeekHourData.value = {
    points: [{ dayOfWeek: 1, hour: 9, averageSeconds: 118 }],
    weekdayCounts: { '1': 4, '2': 4, '3': 4, '4': 4, '5': 4, '6': 4, '7': 4 },
  }
}

function mountPanel() {
  return mount(WeekHourPanel, { props: { deviceId: null, ideName: null } })
}

interface OptionShape {
  tooltip: { formatter: (params: { data?: unknown }) => string }
  visualMap: { formatter: (value: number) => string }
}

describe('WeekHourPanel', () => {
  it('states the quiet state and the continuous ramp separately in the legend', () => {
    feed()
    const wrapper = mountPanel()
    const legend = wrapper.text()
    expect(legend).toContain('No coding')
    expect(legend).toContain('0 – 0.033 h')
    expect(legend).toContain("shade scales with the window's peak")
  })

  it('reads a silent cell as "No coding" and a measured cell as an average with its divisor', () => {
    feed()
    mountPanel()
    const option = mockChart.setOption.mock.calls[0]![0] as OptionShape
    expect(option.tooltip.formatter({ data: { row: 6, hour: 11, seconds: 0 } })).toBe('<b>Sun 11:00</b><br/>No coding')
    expect(option.tooltip.formatter({ data: { row: 0, hour: 9, seconds: 118, weekdayCount: 4 } })).toBe(
      '<b>Mon 09:00</b><br/>avg 1m 58s across 4 Mondays',
    )
    expect(option.tooltip.formatter({ data: { row: 0, hour: 9, seconds: 118, weekdayCount: 1 } })).toBe(
      '<b>Mon 09:00</b><br/>avg 1m 58s across 1 Monday',
    )
  })

  it('labels the chart as average coding time for screen readers', () => {
    feed()
    const wrapper = mountPanel()
    expect(wrapper.find('[role="img"]').attributes('aria-label')).toContain('cells of average coding time')
  })

  it('formats the scale handle labels in hours, not raw seconds', () => {
    feed()
    mountPanel()
    const option = mockChart.setOption.mock.calls[0]![0] as OptionShape
    expect(option.visualMap.formatter(118)).toBe('0.033 h')
    expect(option.visualMap.formatter(0)).toBe('0 h')
  })
})
