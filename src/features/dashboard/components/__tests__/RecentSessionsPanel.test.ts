import { describe, expect, it, vi, beforeEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import RecentSessionsPanel from '../RecentSessionsPanel.vue'
import type { RecentSession } from '@/lib/schemas/stats.schema'

/** Sessions returned by the mocked composable, per test. */
const mockData = { value: [] as RecentSession[] }
const recentSpy = vi.fn<(params: unknown) => void>()

/**
 * jsdom has neither observer. The shell uses both, and the distribution-panel
 * tests stub them the same way — a mounted component counts as in view.
 */
class MockResizeObserver {
  observe = vi.fn<(target: Element) => void>()
  unobserve = vi.fn<(target: Element) => void>()
  disconnect = vi.fn<() => void>()
  constructor(_cb: ResizeObserverCallback) {}
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

vi.mock('@/composables/useStats', () => ({
  useStatsRecent: (params: unknown) => {
    recentSpy(params)
    return { data: computed(() => mockData.value) }
  },
}))

function session(over: Partial<RecentSession> & { startTime: string }): RecentSession {
  return {
    sessionId: '00000000-0000-4000-8000-000000000001',
    sessionUuid: '00000000-0000-4000-8000-000000000002',
    projectName: 'ctt-web',
    language: 'TypeScript',
    endTime: over.startTime,
    durationSeconds: 60,
    ...over,
  }
}

function localIso(y: number, m: number, d: number, hh = 0, mm = 0): string {
  return new Date(y, m - 1, d, hh, mm).toISOString()
}

function mountPanel() {
  return mount(RecentSessionsPanel, { props: { deviceId: null, ideName: null } })
}

beforeEach(() => {
  mockData.value = []
  recentSpy.mockClear()
})

describe('RecentSessionsPanel', () => {
  it('renders a row per session with time, project, language and duration', () => {
    mockData.value = [
      session({
        startTime: localIso(2026, 9, 12, 9, 30),
        projectName: 'ctt-web',
        language: 'Vue',
        durationSeconds: 5400,
      }),
    ]
    const wrapper = mountPanel()

    const row = wrapper.get('[data-testid="session-row"]')
    expect(row.get('[data-testid="session-project"]').text()).toBe('ctt-web')
    expect(row.get('[data-testid="session-language"]').text()).toBe('Vue')
    expect(row.get('[data-testid="session-duration"]').text()).toBe('1h 30m')
    expect(row.text()).toContain('09:30')
  })

  it('groups rows under day headings, newest day first', () => {
    mockData.value = [
      session({ startTime: localIso(2026, 9, 10, 9, 0), projectName: 'older' }),
      session({ startTime: localIso(2026, 9, 12, 9, 0), projectName: 'newest' }),
    ]
    const wrapper = mountPanel()

    const text = wrapper.text()
    expect(text.indexOf('newest')).toBeLessThan(text.indexOf('older'))
    // The heading is the day's identity — a date, not a repeated per-row stamp.
    expect(text).toMatch(/Sep 1[02]/)
  })

  it('reports counts and never a duration total', () => {
    mockData.value = [
      session({ startTime: localIso(2026, 9, 12, 9, 0), durationSeconds: 3600 }),
      session({ startTime: localIso(2026, 9, 12, 9, 0), durationSeconds: 3600 }),
    ]
    const wrapper = mountPanel()

    const footer = wrapper.get('[data-testid="session-footer"]').text()
    expect(footer).toContain('Latest 2 sessions')
    expect(footer).toContain('1 day')
    // Parallel sessions overlap in real time, so summing them would over-report.
    expect(wrapper.text()).not.toMatch(/\b2h\b|\btotal\b/i)
  })

  it('requests the origin filters and a bounded limit', () => {
    mountPanel()
    expect(recentSpy).toHaveBeenCalledTimes(1)

    const arg = recentSpy.mock.calls[0]![0] as unknown as { value: { limit: number } }
    // The composable receives a getter; the panel must not have already unwrapped it.
    expect(typeof arg.value).toBe('object')
    expect(arg.value.limit).toBe(20)
  })

  it('passes the device and IDE filters through to the query', () => {
    mount(RecentSessionsPanel, { props: { deviceId: 'dev-1', ideName: null } })
    const arg = recentSpy.mock.calls[0]![0] as unknown as { value: { deviceId: string } }
    expect(arg.value.deviceId).toBe('dev-1')
  })

  it('renders no rows and a zero footer when the response is empty', () => {
    mockData.value = []
    const wrapper = mountPanel()

    expect(wrapper.findAll('[data-testid="session-row"]')).toHaveLength(0)
    expect(wrapper.get('[data-testid="session-footer"]').text()).toContain('Latest 0')
  })

  it('exposes the exact instant on hover for rows that look identical', () => {
    mockData.value = [session({ startTime: localIso(2026, 9, 12, 9, 30) })]
    const wrapper = mountPanel()

    const time = wrapper.get('[data-testid="session-row"] > span')
    expect(time.attributes('title')).toMatch(/2026/)
    expect(wrapper.get('[data-testid="session-project"]').attributes('title')).toBe('ctt-web')
  })
})
