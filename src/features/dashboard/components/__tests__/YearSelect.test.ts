import { describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import YearSelect from '../YearSelect.vue'

/**
 * YearSelect unit tests — the option space (rolling default plus every
 * reported year, newest first) and the value mapping ('rolling' ↔ null).
 *
 * The reka-ui Select is stubbed the way TrendMonthSelect stubs its popover:
 * the open-and-pick flow through the real widget is a real browser's job and
 * is covered by the dashboard e2e specs.
 */
vi.mock('@/components/ui/select', () => ({
  Select: {
    name: 'SelectStub',
    props: { modelValue: { type: [String, Number], default: undefined } },
    emits: ['update:modelValue'],
    template: '<div data-slot="select"><slot /></div>',
  },
  SelectTrigger: {
    template: '<button v-bind="$attrs"><slot /></button>',
  },
  SelectValue: {
    template: '<span />',
  },
  SelectContent: {
    template: '<div><slot /></div>',
  },
  SelectItem: {
    props: { value: { type: String, default: '' } },
    template: '<div class="mock-option" :data-value="value"><slot /></div>',
  },
  SelectItemText: {
    template: '<span><slot /></span>',
  },
}))

function mountYearSelect(year: number | null) {
  return mount(YearSelect, {
    props: { year, years: [2026, 2025], label: 'Long-term trend year', testid: 'year-select' },
  })
}

/** Drives the stubbed Select's model value — the same event reka emits on pick. */
function pickValue(wrapper: ReturnType<typeof mountYearSelect>, value: string) {
  wrapper.findComponent({ name: 'SelectStub' }).vm.$emit('update:modelValue', value)
}

describe('YearSelect', () => {
  it('offers the rolling default plus every reported year, newest first', () => {
    const wrapper = mountYearSelect(null)
    const options = wrapper.findAll('.mock-option')
    expect(options.map((option) => option.text())).toEqual(['Last 12 months', '2026', '2025'])
    expect(options.map((option) => option.attributes('data-value'))).toEqual(['rolling', '2026', '2025'])
  })

  it('carries the consumer-specific trigger label and test id', () => {
    const wrapper = mountYearSelect(null)
    expect(wrapper.get('[data-testid="year-select"]').attributes('aria-label')).toBe('Long-term trend year')
  })

  it('emits the picked year as a number', () => {
    const wrapper = mountYearSelect(null)
    pickValue(wrapper, '2025')
    expect(wrapper.emitted('update:year')?.at(-1)).toEqual([2025])
  })

  it('emits null when the rolling default is chosen', () => {
    const wrapper = mountYearSelect(2025)
    pickValue(wrapper, 'rolling')
    expect(wrapper.emitted('update:year')?.at(-1)).toEqual([null])
  })
})
