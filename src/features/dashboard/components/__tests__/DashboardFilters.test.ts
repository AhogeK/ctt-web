import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import DashboardFilters from '../DashboardFilters.vue'
import { Select } from '@/components/ui/select'
import type { DateRangePreset } from '../../composables/useDashboardFilters'

vi.mock('@lucide/vue', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    CalendarRange: { template: '<svg data-testid="icon-calendar" />' },
  }
})

vi.mock('@/components/ui/label', () => ({
  Label: { template: '<label><slot /></label>' },
}))

vi.mock('@/composables/useDevices', () => ({
  useDevices: () => ({
    data: ref([]),
  }),
}))

vi.mock('@/composables/useStats', () => ({
  useStatsIdeFilters: () => ({
    data: ref(['IntelliJ IDEA', 'PyCharm']),
  }),
}))

const defaults = { preset: 'year' as DateRangePreset, deviceId: null, ideName: null }

type FilterOverrides = {
  preset?: DateRangePreset
  start?: string
  end?: string
  deviceId?: string | null
  ideName?: string | null
}

function mountFilters(overrides: FilterOverrides = {}) {
  // Real Input (native input passthrough) so the date fields are addressable.
  return mount(DashboardFilters, {
    props: {
      preset: overrides.preset ?? defaults.preset,
      deviceId: overrides.deviceId ?? defaults.deviceId,
      ideName: overrides.ideName ?? defaults.ideName,
      start: overrides.start,
      end: overrides.end,
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DashboardFilters', () => {
  it('shows the custom date inputs only when the URL encodes a custom range', () => {
    const hidden = mountFilters({ preset: 'year' })
    expect(hidden.find('[data-testid="custom-range"]').exists()).toBe(false)

    const shown = mountFilters({ preset: 'custom' })
    expect(shown.find('[data-testid="custom-range"]').exists()).toBe(true)
  })

  it('selecting Custom range reveals the inputs, a preset hides them and applies', async () => {
    const wrapper = mountFilters()
    expect(wrapper.find('[data-testid="custom-range"]').exists()).toBe(false)

    // User picks "Custom range" — no URL change yet, just the inputs.
    wrapper.findComponent(Select).vm.$emit('update:modelValue', 'custom')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="custom-range"]').exists()).toBe(true)
    expect(wrapper.emitted('applyPreset')).toBeUndefined()
    // The select now advertises the Custom mode even though the URL is unchanged.
    expect(wrapper.findComponent(Select).props('modelValue')).toBe('custom')

    // Picking a real preset hides the inputs and applies the range.
    wrapper.findComponent(Select).vm.$emit('update:modelValue', 'month')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="custom-range"]').exists()).toBe(false)
    expect(wrapper.emitted('applyPreset')).toEqual([['month']])
  })

  it('emits range updates from the start/end date inputs', async () => {
    const wrapper = mountFilters({ preset: 'custom', start: '2026-08-01', end: '2026-08-31' })

    await wrapper.find('#dash-start').setValue('2026-08-15')
    expect(wrapper.emitted('update:range')).toEqual([['2026-08-15', '2026-08-31']])

    // The parent reflects the emitted range back into the URL-driven props.
    await wrapper.setProps({ start: '2026-08-15' })
    await wrapper.find('#dash-end').setValue('2026-09-01')
    expect(wrapper.emitted('update:range')).toEqual([
      ['2026-08-15', '2026-08-31'],
      ['2026-08-15', '2026-09-01'],
    ])
  })

  it('maps device select values to null for "all"', async () => {
    const wrapper = mountFilters()
    const deviceSelect = wrapper.findAllComponents(Select)[1]
    if (!deviceSelect) throw new Error('device Select not rendered')

    deviceSelect.vm.$emit('update:modelValue', 'dev-1')
    expect(wrapper.emitted('update:device')).toEqual([['dev-1']])

    deviceSelect.vm.$emit('update:modelValue', 'all')
    expect(wrapper.emitted('update:device')).toEqual([['dev-1'], [null]])
  })

  it('maps IDE select values to null for "all"', () => {
    const wrapper = mountFilters({ ideName: 'IntelliJ IDEA' })
    const ideSelect = wrapper.findAllComponents(Select)[2]
    if (!ideSelect) throw new Error('IDE Select not rendered')

    ideSelect.vm.$emit('update:modelValue', 'PyCharm')
    expect(wrapper.emitted('update:ide')).toEqual([['PyCharm']])

    ideSelect.vm.$emit('update:modelValue', 'all')
    expect(wrapper.emitted('update:ide')).toEqual([['PyCharm'], [null]])
  })
})
