import { describe, expect, it, vi, beforeEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import AchievementsView from '../AchievementsView.vue'
import type { Achievement } from '@/lib/schemas/stats.schema'
import { achievement } from '../../__tests__/fixtures'

/** Response and query state the view reads, per test. */
let data: Achievement[] = []
let pending = false
let failed = false
const refetchSpy = vi.fn<() => void>()

vi.mock('@/composables/useStats', () => ({
  useStatsAchievements: () => ({
    data: computed(() => data),
    isPending: computed(() => pending),
    isError: computed(() => failed),
    refetch: refetchSpy,
  }),
}))

/** Mirrors the server: one progress value per family across all its tiers. */
function serverPayload(): Achievement[] {
  return [
    achievement({ code: 'STREAK_3', displayName: '3-Day Streak', target: 3, progress: 7, unlocked: true }),
    achievement({ code: 'STREAK_7', displayName: '7-Day Streak', target: 7, progress: 7, unlocked: true }),
    achievement({ code: 'STREAK_30', displayName: '30-Day Streak', target: 30, progress: 7 }),
    achievement({ code: 'LANGUAGES_3', displayName: 'Polyglot', target: 3, progress: 39, unlocked: true }),
    achievement({ code: 'LANGUAGES_5', displayName: 'Versatile Developer', target: 5, progress: 39, unlocked: true }),
    achievement({ code: 'LANGUAGES_10', displayName: 'Language Master', target: 10, progress: 39, unlocked: true }),
    achievement({
      code: 'TOTAL_10_HOURS',
      displayName: '10 Hours Total',
      target: 36_000,
      progress: 460_860,
      unlocked: true,
      unit: 'seconds',
    }),
    achievement({
      code: 'TOTAL_100_HOURS',
      displayName: '100 Hours Total',
      target: 360_000,
      progress: 460_860,
      unlocked: true,
      unit: 'seconds',
    }),
    achievement({
      code: 'TOTAL_500_HOURS',
      displayName: '500 Hours Total',
      target: 1_800_000,
      progress: 460_860,
      unit: 'seconds',
    }),
  ]
}

function mountView() {
  return mount(AchievementsView)
}

beforeEach(() => {
  data = []
  pending = false
  failed = false
  refetchSpy.mockClear()
})

describe('AchievementsView', () => {
  it('renders one card per family, not one per badge', () => {
    data = serverPayload()
    const wrapper = mountView()

    // 9 badges above collapse into 3 families.
    expect(wrapper.findAll('[data-testid="trophy-card"]')).toHaveLength(3)
    const keys = wrapper.findAll('[data-testid="trophy-card"]').map((c) => c.attributes('data-trophy') ?? '')
    expect(keys.sort((a, b) => a.localeCompare(b))).toEqual(['polyglot', 'streak', 'volume'])
  })

  it('counts tiers, not trophies, in the header', () => {
    data = serverPayload()
    const wrapper = mountView()

    const summary = wrapper.get('[data-testid="achievement-summary"]').text()
    // STREAK 2/3 + POLYGLOT 3/3 + VOLUME 2/3 = 7 / 9
    expect(summary).toContain('7')
    expect(summary).toContain('9')
  })

  it('shows a completed ladder as complete rather than a full progress bar', () => {
    data = serverPayload()
    const wrapper = mountView()

    // Polyglot's three tiers are all unlocked.
    const polyglot = wrapper.get('[data-trophy="polyglot"]')
    expect(polyglot.find('[data-testid="trophy-complete"]').exists()).toBe(true)
    expect(polyglot.find('[data-testid="trophy-progress-bar"]').exists()).toBe(false)
  })

  it('measures progress toward the next tier, not the current one', () => {
    data = serverPayload()
    const wrapper = mountView()

    // Streak is at 7 days having cleared 3 and 7; the next rung is 30, and the
    // bar is anchored at 7, so it sits at 0% — not 23% (7/30) and not 100% (7/7).
    const bar = wrapper.get('[data-trophy="streak"] [data-testid="trophy-progress-bar"]')
    expect(bar.attributes('style')).toContain('width: 0%')
  })

  it('formats a seconds-based measurement through the duration formatter', () => {
    data = serverPayload()
    const wrapper = mountView()

    const progress = wrapper.get('[data-trophy="volume"] [data-testid="trophy-progress"]').text()
    // 460860 s must not be printed raw.
    expect(progress).not.toContain('460860')
    expect(progress).toMatch(/h/)
  })

  it('renders a badge the build does not know rather than dropping it', () => {
    data = [
      ...serverPayload(),
      achievement({ code: 'STREAK_365', displayName: '365-Day Streak', target: 365, progress: 7 }),
    ]
    const wrapper = mountView()

    expect(wrapper.get('[data-trophy="STREAK_365"]').text()).toContain('365-Day Streak')
  })

  it('renders one card for an unclaimed code the server repeats', () => {
    // Duplicate keys would silently render two identical cards.
    data = [
      achievement({ code: 'MYSTERY_1', displayName: 'Mystery', target: 1 }),
      achievement({ code: 'MYSTERY_1', target: 1 }),
    ]
    const wrapper = mountView()

    expect(wrapper.findAll('[data-testid="trophy-card"]')).toHaveLength(1)
  })

  it('shows the empty state when the account has no badges', () => {
    data = []
    const wrapper = mountView()

    expect(wrapper.findAll('[data-testid="trophy-card"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('No achievements yet')
    // The header summary must not claim 0/0 as a result.
    expect(wrapper.find('[data-testid="achievement-summary"]').exists()).toBe(false)
  })

  it('marks earned and unearned rungs distinctly in the ladder', () => {
    data = serverPayload()
    const wrapper = mountView()

    const streak = wrapper.get('[data-trophy="streak"]')
    const rungs = streak.findAll('[data-earned]')
    expect(rungs).toHaveLength(3)
    expect(rungs.filter((r) => r.attributes('data-earned') === 'true')).toHaveLength(2)
  })

  it('renders skeletons while the query is in flight', () => {
    pending = true
    const wrapper = mountView()

    expect(wrapper.findAll('[data-testid="trophy-card"]')).toHaveLength(0)
    // The empty copy must not appear while still loading.
    expect(wrapper.text()).not.toContain('No achievements yet')
  })

  it('offers a working retry when the query fails', async () => {
    failed = true
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Failed to load achievements')
    expect(wrapper.findAll('[data-testid="trophy-card"]')).toHaveLength(0)

    const retry = wrapper.get('button')
    await retry.trigger('click')
    expect(refetchSpy).toHaveBeenCalledTimes(1)
  })
})
