import { computed } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'

/**
 * LanguageDistributionPanel unit tests — DOM assertions on the ranked bar
 * list: row construction, longest-scaled bar lengths, the 0.1% Others
 * folding rule plus its row budget, and the aggregate row's hover detail.
 */

const { feed } = vi.hoisted(() => ({
  feed: { entries: [] as { name: string; seconds: number }[] },
}))

// jsdom ships neither observer; the component uses both (scroll affordance +
// reveal-on-scroll). Class stubs keep `new` working.
class MockResizeObserver {
  observe = vi.fn<(target: Element) => void>()
  unobserve = vi.fn<(target: Element) => void>()
  disconnect = vi.fn<() => void>()
}
class MockIntersectionObserver {
  observe = vi.fn<(target: Element) => void>()
  unobserve = vi.fn<(target: Element) => void>()
  disconnect = vi.fn<() => void>()
  takeRecords = vi.fn<() => []>()
  root = null
  rootMargin = ''
  thresholds = []
  constructor(cb: IntersectionObserverCallback) {
    // A mounted component is in view for the test: report intersection so the
    // entrance animation reaches its target width.
    cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}
vi.stubGlobal('ResizeObserver', MockResizeObserver)
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn<() => { isDark: boolean }>(() => ({ isDark: false })),
}))

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

function mountPanel() {
  return mount(LanguageDistributionPanel, { props: { deviceId: null, ideName: null } })
}

/** Row widgets in render order. */
function rowWrappers(wrapper: VueWrapper) {
  return wrapper.findAll('[data-testid="language-row"]')
}

/** The label column's text for each row, in render order. */
function rowLabels(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[data-testid="language-label"]').map((el) => el.text())
}

/** Bar width percent recorded on each row's capsule. */
function barWidths(wrapper: VueWrapper): number[] {
  return wrapper.findAll('[data-testid="language-bar"]').map((b) => {
    const style = b.attributes('style') ?? ''
    const m = style.match(/width:\s*([\d.]+)%/)
    return m ? Number(m[1]) : 0
  })
}

beforeEach(() => {
  feed.entries = []
})

describe('LanguageDistributionPanel', () => {
  it('renders one ranked row per language, longest first', async () => {
    feed.entries = [
      { name: 'TypeScript', seconds: 40 * 3600 },
      { name: 'Java', seconds: 25 * 3600 },
      { name: 'Python', seconds: 15 * 3600 },
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    expect(rowLabels(wrapper)).toEqual(['TypeScript', 'Java', 'Python'])
    expect(rowWrappers(wrapper)).toHaveLength(3)
    wrapper.unmount()
  })

  it('scales bar length to the longest language, so rank 1 fills the row', async () => {
    feed.entries = [
      { name: 'TypeScript', seconds: 40 * 3600 },
      { name: 'Java', seconds: 20 * 3600 },
      { name: 'Python', seconds: 10 * 3600 },
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    // Animation starts at zero; the target widths are in the inline style.
    expect(barWidths(wrapper)).toEqual([100, 50, 25])
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
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    const names = rowLabels(wrapper)
    expect(names).toEqual(['TypeScript', 'Java', 'Others'])
    wrapper.unmount()
  })

  it('keeps a 0.1% language as its own row (plugin-parity threshold)', async () => {
    const total = 100 * 3600
    feed.entries = [
      { name: 'TypeScript', seconds: Math.round(total * 0.899) },
      { name: 'Go', seconds: Math.round(total * 0.1) }, // exactly 0.1% → kept
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    expect(rowLabels(wrapper)).toEqual(['TypeScript', 'Go'])
    wrapper.unmount()
  })

  it('lists every language with no row cap (completeness over truncation)', async () => {
    // 20 languages above the 0.1% floor must all get a row — the card bounds
    // its height with scrolling, never by hiding languages.
    const total = 200 * 3600
    feed.entries = Array.from({ length: 20 }, (_, i) => ({
      name: `Lang${String(i).padStart(2, '0')}`,
      seconds: total / 20,
    }))
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    const names = rowLabels(wrapper)
    expect(names.length).toBe(20)
    expect(names).toContain('Lang19')
    expect(names).not.toContain('Others') // nothing needed folding
    wrapper.unmount()
  })

  it('reports the listed language count', async () => {
    feed.entries = [
      { name: 'TypeScript', seconds: 40 * 3600 },
      { name: 'Java', seconds: 25 * 3600 },
      { name: 'Python', seconds: 15 * 3600 },
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('3 languages')
    wrapper.unmount()
  })

  it('no longer uses a native title tooltip on rows', async () => {
    const total = 100 * 3600
    feed.entries = [
      { name: 'TypeScript', seconds: Math.round(total * 0.9) },
      { name: 'Tiny1', seconds: Math.round(total * 0.0004) },
      { name: 'Tiny2', seconds: Math.round(total * 0.0003) },
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    const rows = rowWrappers(wrapper)
    const others = rows[rows.length - 1]
    expect(others).toBeDefined()
    expect(others!.text()).toContain('Others')
    // Hover detail moved into the design-system popover: no native title.
    expect(others!.attributes('title')).toBeUndefined()
    wrapper.unmount()
  })

  it('paints every language from the same shared gradient (colour carries no rank)', async () => {
    feed.entries = [
      { name: 'TypeScript', seconds: 40 * 3600 },
      { name: 'Java', seconds: 25 * 3600 },
      { name: 'Python', seconds: 15 * 3600 },
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    const ramps = wrapper
      .findAll('[data-testid="language-bar"]')
      .map((b) => (b.attributes('style') ?? '').match(/background-image:\s*([^;"]+)/)?.[1])
    // Length encodes the amount and the label names the language; the ramp is
    // ONE shared scale, so every row paints identical stops and its own slice
    // comes from the track-sized background.
    expect(ramps[0]).toBeTruthy()
    expect(new Set(ramps).size).toBe(1)
    // A gradient, not segments: continuous interpolation between stops.
    expect(ramps[0]).toContain('linear-gradient')
    expect(ramps[0]).not.toMatch(/rgb\([^)]*\)\s+\d+%\s+\d+%/)
    wrapper.unmount()
  })

  it('sets the aggregate row apart from real languages', async () => {
    const total = 100 * 3600
    feed.entries = [
      { name: 'TypeScript', seconds: Math.round(total * 0.9) },
      { name: 'Tiny', seconds: Math.round(total * 0.0004) }, // below the floor
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    const bars = wrapper.findAll('[data-testid="language-bar"]')
    // The aggregate is painted exactly like every language row: same ramp, same
    // opacity. Length says how much and the label says what it is, so no colour
    // or alpha difference may imply otherwise.
    const styleOf = (i: number) => bars[i]?.attributes('style') ?? ''
    expect(styleOf(0)).toContain('linear-gradient')
    expect(styleOf(0)?.match(/linear-gradient\([^)]*\)/)?.[0]).toBe(
      styleOf(bars.length - 1)?.match(/linear-gradient\([^)]*\)/)?.[0],
    )
    expect(styleOf(bars.length - 1)).not.toContain('opacity')
    wrapper.unmount()
  })

  it('exposes the list as a keyboard-focusable scroll region', async () => {
    feed.entries = [
      { name: 'TypeScript', seconds: 40 * 3600 },
      { name: 'Java', seconds: 25 * 3600 },
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    // Scrollable content must be reachable without a pointer (WCAG 2.1.1).
    expect(wrapper.find('[role="list"]').attributes('tabindex')).toBe('0')
    wrapper.unmount()
  })

  it('exposes an a11y label stating that bar length is coding time', async () => {
    feed.entries = [
      { name: 'TypeScript', seconds: 40 * 3600 },
      { name: 'Java', seconds: 25 * 3600 },
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    const label = wrapper.find('[role="list"]').attributes('aria-label')
    expect(label).toContain('bar length is coding time')
    expect(label).toContain('TypeScript 61.54%')
    expect(label).toContain('Java 38.46%')
    wrapper.unmount()
  })
})
