import { describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import TimeOfDayPanel from '../TimeOfDayPanel.vue'

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
const { mockDistributionData } = vi.hoisted(() => {
  const state: { value: unknown } = { value: undefined }
  return {
    mockDistributionData: {
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
  useStatsDistribution: () => ({
    data: mockDistributionData,
    isPending: { value: false },
    isError: { value: false },
    refetch: vi.fn<() => Promise<unknown>>(),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockDistributionData.value = undefined
})

afterEach(() => {
  vi.restoreAllMocks()
})

function timeOfDayFor(entries: Array<[name: string, seconds: number]>): void {
  mockDistributionData.value = {
    type: 'TIME_OF_DAY',
    entries: entries.map(([name, seconds]) => ({ name, seconds })),
  }
}

describe('TimeOfDayPanel', () => {
  it('initializes ECharts once on mount', () => {
    timeOfDayFor([
      ['NIGHT', 0],
      ['MORNING', 3600],
      ['DAYTIME', 0],
      ['EVENING', 0],
    ])
    mount(TimeOfDayPanel, { props: { deviceId: null, ideName: null } })
    expect(mockInitCalls()).toHaveLength(1)
  })

  it('builds a stacked capsule of visible segments in clock order', async () => {
    timeOfDayFor([
      // Backend returns by duration descending — normalize to clock order.
      ['EVENING', 900],
      ['MORNING', 3600],
    ])
    mount(TimeOfDayPanel, { props: { deviceId: null, ideName: null } })
    const option = mockChart.setOption.mock.calls[0]![0]
    if (typeof option !== 'object' || option === null || !('series' in option)) {
      throw new TypeError('setOption payload missing series')
    }
    // Zero-width buckets drop out of the strip; survivors keep clock order.
    const { series } = option
    if (!Array.isArray(series)) throw new TypeError('series not an array')
    expect(series).toHaveLength(2)
    expect(series[0]).toMatchObject({ data: [{ value: 3600 }] }) // Morning first (clock)
    expect(series[1]).toMatchObject({ data: [{ value: 900 }] }) // Evening last
    // All segments share one stack so widths are honest shares of the total
    expect(series.every((s) => 'stack' in s && s.stack === 'tod')).toBe(true)
  })

  it('keeps a lone segment fully rounded', async () => {
    timeOfDayFor([['NIGHT', 7200]])
    mount(TimeOfDayPanel, { props: { deviceId: null, ideName: null } })
    expect(mockChart.setOption).toHaveBeenCalled()
    const option = mockChart.setOption.mock.calls[0]![0]
    if (typeof option !== 'object' || option === null || !('series' in option)) {
      throw new TypeError('setOption payload missing series')
    }
    const { series } = option
    if (!Array.isArray(series)) throw new TypeError('series not an array')
    expect(series).toHaveLength(1)
    expect(series[0]).toMatchObject({ itemStyle: { borderRadius: [12, 12, 12, 12] } })
  })

  it('renders 100% when a single bucket holds all the duration', async () => {
    timeOfDayFor([
      ['NIGHT', 7200],
      ['Morning', 0],
      ['DAYTIME', 0],
      ['EVENING', 0],
    ])
    const wrapper = mount(TimeOfDayPanel, { props: { deviceId: null, ideName: null } })
    expect(wrapper.text()).toContain('100%')
    expect(wrapper.text()).toContain('Night') // display label
  })

  it('exposes an a11y label with the total and bucket percentages', () => {
    timeOfDayFor([
      ['NIGHT', 1800],
      ['MORNING', 3600],
      ['DAYTIME', 1800],
      ['EVENING', 0],
    ])
    const wrapper = mount(TimeOfDayPanel, { props: { deviceId: null, ideName: null } })
    const label = wrapper.find('[role="img"]').attributes('aria-label')
    expect(label).toContain('Time of day:')
    expect(label).toContain('Morning')
    expect(label).toContain('Total')
  })

  it('renders duration labels with zero-value dash', () => {
    timeOfDayFor([
      ['NIGHT', 0],
      ['Morning', 0],
      ['DAYTIME', 0],
      ['EVENING', 0],
    ])
    const wrapper = mount(TimeOfDayPanel, { props: { deviceId: null, ideName: null } })
    // Silent buckets render em dash, not "0s"
    expect(wrapper.text()).toContain('—')
  })

  it('disposes the chart on unmount', () => {
    timeOfDayFor([
      ['NIGHT', 0],
      ['MORNING', 3600],
      ['DAYTIME', 0],
      ['EVENING', 0],
    ])
    const wrapper = mount(TimeOfDayPanel, { props: { deviceId: null, ideName: null } })
    wrapper.unmount()
    expect(mockChart.dispose).toHaveBeenCalledTimes(1)
  })
})
