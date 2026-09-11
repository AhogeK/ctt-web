import { describe, expect, it, vi } from 'vite-plus/test'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import ChartSection from '../ChartSection.vue'

// ==========================================
// Mocks
// ==========================================

vi.mock('@lucide/vue', () => ({
  AlertTriangle: { template: '<svg data-testid="icon-alert" />' },
}))

vi.mock('@/components/ui/button', () => ({
  Button: { template: '<button data-testid="btn"><slot /></button>' },
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: { template: '<div data-testid="skeleton" />' },
}))

// jsdom ships no ResizeObserver; the component measures the chart area through
// one. This stub keeps the callback so a test can report a height on demand.
const observers = vi.hoisted(() => ({ callbacks: [] as Array<() => void> }))

class MockResizeObserver {
  constructor(cb: () => void) {
    observers.callbacks.push(cb)
  }
  observe = vi.fn<(target: Element) => void>()
  disconnect = vi.fn<() => void>()
}
vi.stubGlobal('ResizeObserver', MockResizeObserver)

/** Reports `height` on the chart area, as a real layout would. */
function reportChartHeight(wrapper: ReturnType<typeof mount>, height: number): void {
  const area = wrapper.find('[data-testid="chart-data-area"]').element
  Object.defineProperty(area, 'offsetHeight', { configurable: true, value: height })
  for (const cb of observers.callbacks) cb()
}

describe('ChartSection', () => {
  it('keeps the chart height while a refetch is in flight', async () => {
    // Regression: the loading state REPLACES the slot, so a fixed-height
    // skeleton collapsed the card whenever a refetch had to fetch (measured on
    // the heatmap: 379px → 188px → 379px when picking an uncached year).
    const wrapper = mount(ChartSection, {
      props: { title: 'Heatmap', loading: false, error: false, empty: false },
      slots: { default: '<div data-testid="chart" />' },
    })

    // The observer is registered in a post-flush watcher, so let it attach
    // before reporting a size.
    await nextTick()
    reportChartHeight(wrapper, 293)
    await nextTick()

    await wrapper.setProps({ loading: true })
    await nextTick()

    const loading = wrapper.find('[data-testid="chart-loading"]')
    expect(loading.exists()).toBe(true)
    expect(loading.attributes('style')).toContain('min-height: 293px')
  })

  it('does not invent a height on first load (no chart measured yet)', () => {
    const wrapper = mount(ChartSection, {
      props: { title: 'Heatmap', loading: true, error: false, empty: false },
    })

    // Nothing has rendered yet, so the skeleton keeps its natural height
    // rather than reserving a made-up one.
    expect(wrapper.find('[data-testid="chart-loading"]').attributes('style')).toBeUndefined()
  })

  it('keeps the panel actions mounted in every state', async () => {
    // Actions used to be hidden while loading, which shrank the header by the
    // control's height on every refetch.
    const wrapper = mount(ChartSection, {
      props: { title: 'Heatmap', loading: true, error: false, empty: false },
      slots: { actions: '<button data-testid="action" />' },
    })

    expect(wrapper.find('[data-testid="action"]').exists()).toBe(true)
  })

  it('renders the loading state while fetching', () => {
    const wrapper = mount(ChartSection, { props: { title: 'Heatmap', loading: true, error: false, empty: false } })
    expect(wrapper.find('[data-testid="chart-loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="chart-error"]').exists()).toBe(false)
  })

  it('renders the error state with a retry action', async () => {
    const wrapper = mount(ChartSection, {
      props: { title: 'Heatmap', loading: false, error: true, empty: false },
      slots: { default: '<div data-testid="data" />' },
    })
    expect(wrapper.find('[data-testid="chart-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="data"]').exists()).toBe(false)

    await wrapper.find('[data-testid="btn"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('renders the empty state', () => {
    const wrapper = mount(ChartSection, {
      props: { title: 'Heatmap', loading: false, error: false, empty: true },
    })
    expect(wrapper.find('[data-testid="chart-empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No data for the selected range')
  })

  it('renders slot content only when data is ready', () => {
    const wrapper = mount(ChartSection, {
      props: { title: 'Heatmap', loading: false, error: false, empty: false },
      slots: { default: '<div data-testid="data" />' },
    })
    expect(wrapper.find('[data-testid="data"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="chart-loading"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="chart-error"]').exists()).toBe(false)
  })
})
