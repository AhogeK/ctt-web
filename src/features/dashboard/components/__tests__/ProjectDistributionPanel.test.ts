import { computed } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'

/**
 * ProjectDistributionPanel unit tests — the panel's own contract: it queries
 * the PROJECTS dimension, ranks by time, folds the sub-0.1% tail, and reports
 * itself as the categorical family (no Total).
 *
 * The row rendering itself is covered by the language panel's suite, which now
 * drives the same shared list; asserting it twice would only pin one component
 * from two files.
 */

const { feed, calls } = vi.hoisted(() => ({
  feed: { entries: [] as { name: string; seconds: number }[] },
  calls: { types: [] as string[] },
}))

// jsdom ships neither observer; the shared list uses both.
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
    (type: string) => { data: unknown; isPending: unknown; isError: unknown; refetch: () => Promise<void> }
  >((type: string) => {
    calls.types.push(type)
    return {
      data: computed(() => ({ type, entries: feed.entries })),
      isPending: computed(() => false),
      isError: computed(() => false),
      refetch: vi.fn<() => Promise<void>>(),
    }
  }),
}))

import ProjectDistributionPanel from '../ProjectDistributionPanel.vue'

function mountPanel() {
  return mount(ProjectDistributionPanel, { props: { deviceId: null, ideName: null } })
}

function rowLabels(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[data-testid="distribution-label"]').map((el) => el.text())
}

function barWidths(wrapper: VueWrapper): number[] {
  return wrapper.findAll('[data-testid="distribution-bar"]').map((b) => {
    const m = (b.attributes('style') ?? '').match(/width:\s*([\d.]+)%/)
    return m ? Number(m[1]) : 0
  })
}

beforeEach(() => {
  feed.entries = []
  calls.types = []
})

describe('ProjectDistributionPanel', () => {
  it('queries the PROJECTS dimension, not another categorical one', () => {
    mountPanel()
    expect(calls.types).toEqual(['PROJECTS'])
  })

  it('renders one ranked row per project, longest first', async () => {
    feed.entries = [
      { name: 'ctt-web', seconds: 40 * 3600 },
      { name: 'ctt-server', seconds: 25 * 3600 },
      { name: 'code-time-tracker', seconds: 15 * 3600 },
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    expect(rowLabels(wrapper)).toEqual(['ctt-web', 'ctt-server', 'code-time-tracker'])
    expect(barWidths(wrapper)).toEqual([100, 62.5, 37.5])
    wrapper.unmount()
  })

  it('folds the sub-0.1% tail into one aggregate row', async () => {
    const total = 100 * 3600
    feed.entries = [
      { name: 'ctt-web', seconds: Math.round(total * 0.6) },
      { name: 'ctt-server', seconds: Math.round(total * 0.3) },
      { name: 'advent-of-code', seconds: Math.round(total * 0.0005) }, // 0.05% → folded
      { name: 'scratch-notes', seconds: Math.round(total * 0.0004) }, // 0.04% → folded
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()

    // The folded names themselves are covered by useRankedDistribution's own
    // suite; the popover that lists them is a portal and only exists while
    // open, so it is verified live rather than from a closed DOM.
    expect(rowLabels(wrapper)).toEqual(['ctt-web', 'ctt-server', 'Others'])
    expect(wrapper.text()).toContain('3 projects')
    wrapper.unmount()
  })

  it('reports the project count and never a total (categorical family)', async () => {
    const total = 100 * 3600
    feed.entries = [
      { name: 'ctt-web', seconds: Math.round(total * 0.6) },
      { name: 'ctt-server', seconds: Math.round(total * 0.4) },
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('2 projects')
    // Same-second concurrency counts once per project, so the bucket sum is
    // legitimately ≥ the real activity — printing it would imply a total that
    // does not exist. The time-axis panels keep their Total cross-check; this
    // family must not have one.
    expect(wrapper.text()).not.toMatch(/\bTotal\b/)
    wrapper.unmount()
  })

  it('exposes an a11y label naming the dimension and the scale', async () => {
    feed.entries = [
      { name: 'ctt-web', seconds: 40 * 3600 },
      { name: 'ctt-server', seconds: 25 * 3600 },
    ]
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    const label = wrapper.find('[role="list"]').attributes('aria-label')
    expect(label).toContain('Project distribution')
    expect(label).toContain('bar length is coding time')
    expect(label).toContain('ctt-web 61.54%')
    wrapper.unmount()
  })
})
