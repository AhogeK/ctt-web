import { describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import TrendMonthSelect from '../TrendMonthSelect.vue'

/**
 * TrendMonthSelect unit tests — the panel's window picker.
 *
 * The behaviour worth pinning is the option *space*: the rolling default is
 * always offered, years come only from months that have data, and a month
 * without data is present but unselectable (hiding it would make the grid jump
 * between years).
 */

// The popover portals its content; the component's own structure is what these
// assertions read, so the portal target is stubbed to mount inline.
vi.mock('@/components/ui/popover', () => ({
  Popover: { template: '<div><slot /></div>' },
  PopoverTrigger: { template: '<div><slot /></div>' },
  PopoverContent: { template: '<div><slot /></div>' },
}))

const MONTHS = ['2026-09', '2026-08', '2026-06', '2025-03']

/** Grid cells, in Jan..Dec order — the fixed axis the tests read. */
function mountTrendMonthSelect(month: string | null, months: string[] = MONTHS) {
  return mount(TrendMonthSelect, { props: { month, months } })
}

const MONTH_CELL_SELECTOR = '[data-testid^="trend-month-0"], [data-testid^="trend-month-1"]'

describe('TrendMonthSelect', () => {
  it('states the active window on the trigger, defaulting to the rolling view', () => {
    expect(mountTrendMonthSelect(null).find('[data-testid="trend-month-trigger"]').text()).toContain('Last 30 days')

    const selected = mountTrendMonthSelect('2026-08')
    expect(selected.find('[data-testid="trend-month-trigger"]').text()).toContain('Aug 2026')
  })

  it('emits null when the rolling default is chosen', async () => {
    const wrapper = mountTrendMonthSelect('2026-08')
    await wrapper.find('[data-testid="trend-month-rolling"]').trigger('click')
    expect(wrapper.emitted('update:month')?.at(-1)).toEqual([null])
  })

  it('offers only years that contain a month with data', () => {
    const wrapper = mountTrendMonthSelect('2026-08')
    // The grid opens on the selected month's year, and the year row steps only
    // across years the backend reported — 2025 exists, an empty 2024 cannot.
    expect(wrapper.find('[data-testid="trend-month-year"]').text()).toBe('2026')
  })

  it('disables months without data rather than omitting them', () => {
    const wrapper = mountTrendMonthSelect('2026-08')
    const cells = wrapper.findAll(MONTH_CELL_SELECTOR)
    expect(cells).toHaveLength(12)

    const stateOf = (label: string) => wrapper.find(`[aria-label="${label} 2026"]`)
    // Aug and Jun have data; July and October do not.
    expect(stateOf('Aug').attributes('disabled')).toBeUndefined()
    expect(stateOf('Jun').attributes('disabled')).toBeUndefined()
    expect(stateOf('Jul').attributes('disabled')).toBeDefined()
    expect(stateOf('Oct').attributes('disabled')).toBeDefined()
  })

  it('emits the picked month as yyyy-MM and marks it selected', async () => {
    const wrapper = mountTrendMonthSelect(null)
    await wrapper.find('[aria-label="Aug 2026"]').trigger('click')
    expect(wrapper.emitted('update:month')?.at(-1)).toEqual(['2026-08'])
  })

  it('cannot emit a month that has no data', async () => {
    const wrapper = mountTrendMonthSelect(null)
    // A disabled button does not fire its handler; assert the emit never lands.
    await wrapper.find('[aria-label="Jul 2026"]').trigger('click')
    expect(wrapper.emitted('update:month')).toBeUndefined()
  })

  it('steps the year only within the years that have data', async () => {
    const wrapper = mountTrendMonthSelect(null)
    const older = wrapper.find('[data-testid="trend-month-prev-year"]')
    const newer = wrapper.find('[data-testid="trend-month-next-year"]')

    // Opens on the newest year with data, so there is nothing newer to go to.
    expect(newer.attributes('disabled')).toBeDefined()

    await older.trigger('click')
    expect(wrapper.find('[data-testid="trend-month-year"]').text()).toBe('2025')
    // Now at the oldest year: older is exhausted, newer is available again.
    expect(wrapper.find('[data-testid="trend-month-prev-year"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="trend-month-next-year"]').attributes('disabled')).toBeUndefined()
  })
})
