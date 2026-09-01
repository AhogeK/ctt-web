import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import SummaryCards from '../SummaryCards.vue'

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: { template: '<div data-testid="skeleton" />' },
}))

const summaryData = ref<{
  today: number
  dailyAverage: number
  thisWeek: number
  thisMonth: number
  thisYear: number
  total: number
} | null>(null)
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
    expect(values).toEqual(['1h 30m', '20m', '2h', '1d', '2d 19h', '1d 1h'])
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
})
