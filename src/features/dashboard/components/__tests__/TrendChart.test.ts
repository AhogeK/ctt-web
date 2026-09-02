import { describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import TrendChart from '../TrendChart.vue'
import type { DailyStatPoint } from '@/lib/schemas/stats.schema'

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

// The setup module only registers ECharts plugins — import for effect, no assertions needed.
vi.mock('@/components/charts/echarts-setup', () => ({}))

function points(n: number): DailyStatPoint[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(2026, 7, 5 + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { date: iso, seconds: i === 23 ? 3600 : i % 7 === 0 ? 600 : 0 }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TrendChart', () => {
  it('initializes ECharts on mount and renders the series', () => {
    mount(TrendChart, { props: { points: points(30) } })
    expect(mockInitCalls()).toHaveLength(1)
    // Two setOption passes: chart option, then the graphic grid overlay.
    expect(mockChart.setOption).toHaveBeenCalledTimes(2)
  })

  it('re-renders when the points change (no re-init)', async () => {
    const wrapper = mount(TrendChart, { props: { points: points(30) } })
    expect(mockInitCalls()).toHaveLength(1)

    await wrapper.setProps({ points: points(31) })
    expect(mockInitCalls()).toHaveLength(1) // instance survives
    // 2 passes per render × 2 renders.
    expect(mockChart.setOption).toHaveBeenCalledTimes(4)
  })

  it('picks an explicit equidistant scale; peak on a gridline gets headroom', async () => {
    mount(TrendChart, { props: { points: points(30) } }) // max = 3600s = 1h
    const option = mockChart.setOption.mock.calls[0]![0] as {
      yAxis: { min: number; max: number; interval: number; splitLine: { show: boolean } }
    }
    expect(option.yAxis.min).toBe(0)
    // 1h peak lands EXACTLY on the 1h gridline → one extra step: ceiling 1.25h.
    expect(option.yAxis.interval).toBe(900)
    expect(option.yAxis.max).toBe(4500)
    // Native split lines are off — the ramp is hand-drawn via `graphic`.
    expect(option.yAxis.splitLine.show).toBe(false)
  })

  it('draws the grid as graphic lines fading bottom→top', async () => {
    mount(TrendChart, { props: { points: points(30) } }) // max = 1h → 6 gridlines
    // Second setOption call carries the graphic group.
    const second = mockChart.setOption.mock.calls[1]![0] as {
      graphic: Array<{ children: Array<{ style: { stroke: string } }> }>
    }
    const children = second.graphic[0]!.children
    const alphas = children.map((c) => Number(c.style.stroke.match(/([\d.]+)\)$/)![1]!))
    expect(alphas[0]!).toBeLessThan(alphas[alphas.length - 1]!)
  })

  it('exposes an a11y label covering the rendered window', () => {
    const wrapper = mount(TrendChart, { props: { points: points(30) } })
    const label = wrapper.find('[role="img"]').attributes('aria-label')
    expect(label).toContain('30 days')
    expect(label).toContain('2026-08-05')
    expect(label).toContain('2026-09-03')
  })

  it('disposes the chart and observer on unmount', async () => {
    const wrapper = mount(TrendChart, { props: { points: points(30) } })
    expect(mockInitCalls()).toHaveLength(1)
    wrapper.unmount()
    expect(mockChart.dispose).toHaveBeenCalledTimes(1)
  })
})
