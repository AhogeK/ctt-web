import { describe, expect, it, vi, beforeEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import AchievementsView from '../AchievementsView.vue'
import type { Achievement } from '@/lib/schemas/stats.schema'
import { achievement, windowed } from '../../__tests__/fixtures'

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

/**
 * Mirrors the server: one progress value per (family, window), repeated across
 * that ladder's tiers. Includes a windowed ladder, which the view must show
 * alongside the lifetime ones.
 */
function serverPayload(): Achievement[] {
  return [
    achievement({
      code: 'STREAK_3',
      type: 'STREAK',
      tier: 1,
      displayName: '3-Day Streak',
      target: 3,
      progress: 7,
      unlocked: true,
    }),
    achievement({
      code: 'STREAK_7',
      type: 'STREAK',
      tier: 2,
      displayName: '7-Day Streak',
      target: 7,
      progress: 7,
      unlocked: true,
    }),
    achievement({ code: 'STREAK_30', type: 'STREAK', tier: 3, displayName: '30-Day Streak', target: 30, progress: 7 }),
    achievement({ code: 'LANGUAGES_3', type: 'LANGUAGE_COUNT', tier: 1, target: 3, progress: 39, unlocked: true }),
    achievement({ code: 'LANGUAGES_5', type: 'LANGUAGE_COUNT', tier: 2, target: 5, progress: 39, unlocked: true }),
    achievement({ code: 'LANGUAGES_10', type: 'LANGUAGE_COUNT', tier: 3, target: 10, progress: 39, unlocked: true }),
    achievement({
      code: 'TOTAL_10_HOURS',
      type: 'TOTAL_SECONDS',
      tier: 1,
      target: 36_000,
      progress: 460_860,
      unlocked: true,
      unit: 'seconds',
    }),
    achievement({
      code: 'TOTAL_100_HOURS',
      type: 'TOTAL_SECONDS',
      tier: 2,
      target: 360_000,
      progress: 460_860,
      unlocked: true,
      unit: 'seconds',
    }),
    achievement({
      code: 'TOTAL_500_HOURS',
      type: 'TOTAL_SECONDS',
      tier: 3,
      target: 1_800_000,
      progress: 460_860,
      unit: 'seconds',
    }),
    windowed('DAY', {
      code: 'DAILY_TOTAL_1H',
      type: 'TOTAL_SECONDS',
      tier: 1,
      target: 3_600,
      progress: 0,
      unit: 'seconds',
    }),
    windowed('DAY', {
      code: 'DAILY_TOTAL_2H',
      type: 'TOTAL_SECONDS',
      tier: 2,
      target: 7_200,
      progress: 0,
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
  it('renders one card per (family, window), not one per badge', () => {
    data = serverPayload()
    const wrapper = mountView()

    // 11 badges collapse into 3 lifetime ladders + 1 daily ladder.
    expect(wrapper.findAll('[data-testid="trophy-card"]')).toHaveLength(4)
    const keys = wrapper
      .findAll('[data-testid="trophy-card"]')
      .map((c) => c.attributes('data-trophy') ?? '')
      .sort((a, b) => a.localeCompare(b))
    expect(keys).toEqual(['LANGUAGE_COUNT:LIFETIME', 'STREAK:LIFETIME', 'TOTAL_SECONDS:DAY', 'TOTAL_SECONDS:LIFETIME'])
  })

  it('counts tiers, not trophies, in the header', () => {
    data = serverPayload()
    const wrapper = mountView()

    // STREAK 2/3 + LANGUAGE_COUNT 3/3 + TOTAL_SECONDS 2/3 + DAY 0/2 = 7 / 11.
    // Asserted as an ordered pair: a bare toContain("7")/"11" still passes with
    // earned and total swapped, and is satisfied by the percentage alone.
    const summary = wrapper.get('[data-testid="achievement-summary"]').text()
    expect(summary).toMatch(/7\s*\/\s*11/)
  })

  it('separates the lifetime ladders from the resetting one', () => {
    data = serverPayload()
    const wrapper = mountView()

    // The split is the point of the page: a permanent record and a goal that
    // expires must not read as the same kind of thing.
    const lifetime = wrapper.get('[data-testid="section-lifetime"]')
    const active = wrapper.get('[data-testid="section-active"]')

    const lifetimeKeys = lifetime.findAll('[data-testid="trophy-card"]').map((c) => c.attributes('data-trophy'))
    const activeKeys = active.findAll('[data-testid="trophy-card"]').map((c) => c.attributes('data-trophy'))
    expect(lifetimeKeys).toEqual(
      expect.arrayContaining(['STREAK:LIFETIME', 'LANGUAGE_COUNT:LIFETIME', 'TOTAL_SECONDS:LIFETIME']),
    )
    expect(activeKeys).toEqual(['TOTAL_SECONDS:DAY'])
  })

  it('names the window on a resetting trophy, so same-family ladders are distinguishable', () => {
    data = serverPayload()
    const wrapper = mountView()

    // Five TOTAL_SECONDS ladders all display as "Total time"; without the window
    // noun they read as duplicates of one trophy.
    expect(wrapper.get('[data-trophy="TOTAL_SECONDS:DAY"] [data-testid="trophy-window"]').text()).toBe('Today')
    // A lifetime trophy has no window to name.
    expect(wrapper.find('[data-trophy="TOTAL_SECONDS:LIFETIME"] [data-testid="trophy-window"]').exists()).toBe(false)
  })

  it('shows a completed ladder as complete rather than a full progress bar', () => {
    data = serverPayload()
    const wrapper = mountView()

    const polyglot = wrapper.get('[data-trophy="LANGUAGE_COUNT:LIFETIME"]')
    expect(polyglot.find('[data-testid="trophy-complete"]').exists()).toBe(true)
    expect(polyglot.find('[data-testid="trophy-progress-bar"]').exists()).toBe(false)
  })

  it('measures progress toward the next tier, not the current one', () => {
    data = serverPayload()
    const wrapper = mountView()

    // Streak is at 7 days having cleared 3 and 7; the next rung is 30, and the
    // bar is anchored at 7, so it sits at 0% — not 23% (7/30) and not 100% (7/7).
    const bar = wrapper.get('[data-trophy="STREAK:LIFETIME"] [data-testid="trophy-progress-bar"]')
    expect(bar.attributes('style')).toContain('width: 0%')
  })

  it('formats a seconds-based measurement through the duration formatter', () => {
    data = serverPayload()
    const wrapper = mountView()

    const progress = wrapper.get('[data-trophy="TOTAL_SECONDS:LIFETIME"] [data-testid="trophy-progress"]').text()
    // 460860 s must not be printed raw.
    expect(progress).not.toContain('460860')
    expect(progress).toMatch(/h/)
  })

  it('formats a percentage measurement as a percentage, not as prose', () => {
    // PERFECT_MONTH changed unit from `month` to `percent` in ctt-server
    // v0.71.0; "32 percent" would read as copy rather than a measurement.
    data = [
      achievement({
        code: 'PERFECT_MONTH_50',
        type: 'PERFECT_MONTH',
        tier: 1,
        target: 50,
        progress: 32,
        unit: 'percent',
      }),
      achievement({
        code: 'PERFECT_MONTH',
        type: 'PERFECT_MONTH',
        tier: 2,
        target: 100,
        progress: 32,
        unit: 'percent',
      }),
    ]
    const wrapper = mountView()

    const progress = wrapper.get('[data-trophy="PERFECT_MONTH:LIFETIME"] [data-testid="trophy-progress"]').text()
    expect(progress).toContain('32%')
    expect(progress).not.toContain('percent')
  })

  it('renders a family the build does not know rather than dropping it', () => {
    data = [
      ...serverPayload(),
      achievement({ code: 'MYSTERY_1', type: 'BRAND_NEW', displayName: 'Mystery', target: 5 }),
    ]
    const wrapper = mountView()

    expect(wrapper.get('[data-trophy="BRAND_NEW:LIFETIME"]').text()).toContain('Mystery')
  })

  it('renders a windowed ladder as its own card, not merged into the lifetime one', () => {
    data = serverPayload()
    const wrapper = mountView()

    const daily = wrapper.get('[data-trophy="TOTAL_SECONDS:DAY"]')
    expect(daily.attributes('data-window')).toBe('DAY')
    // Its own ladder only: two daily rungs, not the lifetime ladder's three plus
    // these appended as tiers 4-5 (which is what grouping by `type` alone did).
    expect(daily.get('[data-testid="trophy-tier-count"]').text()).toBe('0/2')
  })

  it('shows the empty state when the account has no badges', () => {
    data = []
    const wrapper = mountView()

    expect(wrapper.findAll('[data-testid="trophy-card"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('No achievements yet')
    expect(wrapper.find('[data-testid="achievement-summary"]').exists()).toBe(false)
  })

  it('marks earned and unearned rungs distinctly in the ladder', () => {
    data = serverPayload()
    const wrapper = mountView()

    const streak = wrapper.get('[data-trophy="STREAK:LIFETIME"]')
    const rungs = streak.findAll('[data-earned]')
    expect(rungs).toHaveLength(3)
    expect(rungs.filter((r) => r.attributes('data-earned') === 'true')).toHaveLength(2)
  })

  it('renders skeletons while the query is in flight', () => {
    pending = true
    const wrapper = mountView()

    expect(wrapper.findAll('[data-testid="trophy-card"]')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('No achievements yet')
  })

  it('offers a working retry when the query fails', async () => {
    failed = true
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Failed to load achievements')
    expect(wrapper.findAll('[data-testid="trophy-card"]')).toHaveLength(0)

    await wrapper.get('button').trigger('click')
    expect(refetchSpy).toHaveBeenCalledTimes(1)
  })
})
