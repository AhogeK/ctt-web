import { describe, expect, it, vi } from 'vite-plus/test'
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

describe('ChartSection', () => {
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
