import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import type { StatsSummaryResponse } from '@/lib/schemas/stats.schema'
import SummaryCards from '../SummaryCards.vue'

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: { template: '<div data-testid="skeleton" />' },
}))

const summaryData = ref<StatsSummaryResponse | null>(null)
const summaryPending = ref(true)
const summaryError = ref(false)
const refetchMock = vi.fn<() => void>()

vi.mock('@/composables/useStats', () => ({
  useStatsSummary: () => ({
    data: summaryData,
    isPending: summaryPending,
    isError: summaryError,
    refetch: refetchMock,
  }),
}))

beforeEach(() => {
  summaryData.value = null
  summaryPending.value = true
  summaryError.value = false
  refetchMock.mockClear()
})

describe('SummaryCards', () => {
  it('renders skeletons while the summary query is pending', () => {
    const wrapper = mount(SummaryCards, { props: { deviceId: null, ideName: null } })
    expect(wrapper.findAll('[data-testid="summary-loading"]')).toHaveLength(6)
    expect(wrapper.find('[data-testid="summary-value"]').exists()).toBe(false)
  })

  it('renders formatted durations once the summary resolves', async () => {
    summaryData.value = {
      today: 5400,
      dailyAverage: 1217,
      thisWeek: 7200,
      thisMonth: 86400,
      thisYear: 241959,
      total: 90000,
    }
    summaryPending.value = false

    const wrapper = mount(SummaryCards, { props: { deviceId: null, ideName: null } })
    const values = wrapper.findAll('[data-testid="summary-value"]').map((n) => n.text())
    expect(values).toEqual(['1h 30m', '20m 17s', '2h', '24h', '67h 12m 39s', '25h'])
  })

  it('shows a retry action on failure and refetches on click', async () => {
    summaryPending.value = false
    summaryError.value = true

    const wrapper = mount(SummaryCards, { props: { deviceId: null, ideName: null } })
    const retries = wrapper.findAll('[data-testid="summary-retry"]')
    expect(retries).toHaveLength(6)
    expect(wrapper.find('[data-testid="summary-value"]').exists()).toBe(false)

    const first = retries[0]!
    await first.trigger('click')
    expect(refetchMock).toHaveBeenCalledTimes(1)
  })

  it('renders one change line per comparable metric and never on the lifetime Total', () => {
    summaryData.value = {
      today: 3600,
      dailyAverage: 7200,
      thisWeek: 5400,
      thisMonth: 86400,
      thisYear: 241959,
      total: 90000,
      comparisons: {
        today: { previousSeconds: 7200, changePercent: -50 },
        dailyAverage: { previousSeconds: 0, changePercent: null },
        thisWeek: { previousSeconds: 7200, changePercent: 25 },
        thisMonth: { previousSeconds: 108000, changePercent: 0 },
        thisYear: { previousSeconds: 1200000, changePercent: 8.55 },
      },
    }
    summaryPending.value = false

    const wrapper = mount(SummaryCards, { props: { deviceId: null, ideName: null } })
    const lines = wrapper.findAll('[data-testid="summary-comparison"]')
    // dailyAverage has no baseline (null percent), so four of the five lines render.
    expect(lines).toHaveLength(4)
    expect(lines.map((node) => node.text())).toEqual([
      '-50% vs yesterday',
      '+25% vs last week',
      '0% vs last month',
      '+8.6% vs last year',
    ])
    // The direction icon follows the rounded value: flat carries none.
    expect(lines[0]!.find('svg').exists()).toBe(true)
    expect(lines[2]!.find('svg').exists()).toBe(false)
    expect(lines[1]!.attributes('title')).toBe('Last week · 2h')
  })

  it('renders no change line when the server sends no comparisons (older backend)', () => {
    summaryData.value = {
      today: 5400,
      dailyAverage: 1217,
      thisWeek: 7200,
      thisMonth: 86400,
      thisYear: 241959,
      total: 90000,
    }
    summaryPending.value = false

    const wrapper = mount(SummaryCards, { props: { deviceId: null, ideName: null } })
    expect(wrapper.findAll('[data-testid="summary-comparison"]')).toHaveLength(0)
  })
})
