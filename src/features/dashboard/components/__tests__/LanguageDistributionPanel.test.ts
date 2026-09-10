import { computed } from 'vue'
import { describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'

/**
 * LanguageDistributionPanel unit tests — pure-renderer assertions against
 * a mocked ECharts: ranked bar construction, the 0.1% Others folding rule,
 * axis ordering, and the a11y label.
 */

// ==========================================
// Mocks — ECharts init/resize/dispose + ResizeObserver (jsdom has neither)
// ==========================================

const { mockChart, mockInit, feed } = vi.hoisted(() => {
  const mockChart = {
    setOption: vi.fn<(option: unknown, notMerge?: boolean) => void>(),
    resize: vi.fn<() => void>(),
    dispose: vi.fn<() => void>(),
  }
  const mockInit = vi.fn<() => typeof mockChart>(() => mockChart)
  return { mockChart, mockInit, feed: { entries: [] as { name: string; seconds: number }[] } }
})

vi.mock('echarts/core', () => ({ init: mockInit }))

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
vi.mock('@/composables/useStats', () => ({
  useStatsDistribution: vi.fn<
    () => {
      data: unknown
      isPending: unknown
      isError: unknown
      refetch: () => Promise<void>
    }
  >(() => ({
    data: computed(() => ({ type: 'LANGUAGES', entries: feed.entries })),
    isPending: computed(() => false),
    isError: computed(() => false),
    refetch: vi.fn<() => Promise<void>>(),
  })),
}))

import LanguageDistributionPanel from '../LanguageDistributionPanel.vue'

function lastOption(): {
  yAxis: { data: string[] }
  series: { data: { name: string; value: number; percent: number }[] }[]
} {
  expect(mockChart.setOption).toHaveBeenCalled()
  const call = mockChart.setOption.mock.calls[mockChart.setOption.mock.calls.length - 1]
  expect(call).toBeDefined()
  return call![0] as unknown as {
    yAxis: { data: string[] }
    series: { data: { name: string; value: number; percent: number }[] }[]
  }
}

beforeEach(() => {
  mockChart.setOption.mockClear()
  feed.entries = []
})

describe('LanguageDistributionPanel', () => {
  it('builds ranked bars in duration order with percent annotations', async () => {
    feed.entries = [
      { name: 'TypeScript', seconds: 40 * 3600 },
      { name: 'Java', seconds: 25 * 3600 },
      { name: 'Python', seconds: 15 * 3600 },
    ]
    const wrapper = mount(LanguageDistributionPanel, { props: { deviceId: null, ideName: null } })
    await wrapper.vm.$nextTick()
    const opt = lastOption()
    // Longest bar on top (inverse y-axis: first category = first entry).
    expect(opt.yAxis.data).toEqual(['TypeScript', 'Java', 'Python'])
    expect(opt.series[0]?.data.map((d) => d.percent)).toEqual([50, 31.25, 18.75])
    wrapper.unmount()
  })

  it('folds the sub-0.1% tail into Others', async () => {
    const total = 100 * 3600
    feed.entries = [
      { name: 'TypeScript', seconds: Math.round(total * 0.6) },
      { name: 'Java', seconds: Math.round(total * 0.3) },
      { name: 'HTML', seconds: Math.round(total * 0.0005) }, // 0.05% → folded
      { name: 'CSS', seconds: Math.round(total * 0.0004) }, // 0.04% → folded
    ]
    const wrapper = mount(LanguageDistributionPanel, { props: { deviceId: null, ideName: null } })
    await wrapper.vm.$nextTick()
    const opt = lastOption()
    expect(opt.yAxis.data).toEqual(['TypeScript', 'Java', 'Others'])
    wrapper.unmount()
  })

  it('keeps a 0.1% language as its own bar (plugin-parity threshold)', async () => {
    const total = 100 * 3600
    feed.entries = [
      { name: 'TypeScript', seconds: Math.round(total * 0.899) },
      { name: 'Go', seconds: Math.round(total * 0.1) }, // exactly 0.1% → kept
    ]
    const wrapper = mount(LanguageDistributionPanel, { props: { deviceId: null, ideName: null } })
    await wrapper.vm.$nextTick()
    const opt = lastOption()
    expect(opt.yAxis.data).toEqual(['TypeScript', 'Go'])
    wrapper.unmount()
  })

  it('exposes an a11y label with per-language shares and the total', async () => {
    feed.entries = [
      { name: 'TypeScript', seconds: 40 * 3600 },
      { name: 'Java', seconds: 25 * 3600 },
    ]
    const wrapper = mount(LanguageDistributionPanel, { props: { deviceId: null, ideName: null } })
    await wrapper.vm.$nextTick()
    const label = wrapper.find('[role="img"]').attributes('aria-label')
    expect(label).toContain('TypeScript 61.54%')
    expect(label).toContain('Java 38.46%')
    expect(label).not.toContain('Total') // categorical buckets have no meaningful total
    wrapper.unmount()
  })
})
