import { describe, expect, it, vi, afterEach, beforeEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'
import AchievementsView from '../AchievementsView.vue'
import type { Achievement } from '@/lib/schemas/stats.schema'
import { achievement, windowed } from '../../__tests__/fixtures'

/** Response and query state the view reads, per test. */
let data: Achievement[] = []
let pending = false
let failed = false
const refetchSpy = vi.fn<() => void>()
/** Every wrapper mounted by a test, so each can be unmounted after it. */
const wrappers: ReturnType<typeof mount>[] = []

vi.mock('@/composables/useStats', () => ({
  useStatsAchievements: () => ({
    data: computed(() => data),
    isPending: computed(() => pending),
    isError: computed(() => failed),
    refetch: refetchSpy,
  }),
}))

/**
 * The countdown reads a ticking clock (`useNow`). Pinning it keeps the assertions
 * exact — otherwise they would have to allow for whatever day the suite runs on,
 * and a conditional assertion can silently pass without testing either branch.
 *
 * A `ref`, not a plain variable: the view watches the clock's *date* to refetch at a
 * window boundary, so a non-reactive clock would silently disable that path.
 */
const nowValue = ref(new Date(2026, 8, 14))
vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>()
  return { ...actual, useNow: () => computed(() => nowValue.value) }
})

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
      windowStart: '2026-09-14',
      windowEnd: '2026-09-14',
      code: 'DAILY_TOTAL_1H',
      type: 'TOTAL_SECONDS',
      tier: 1,
      target: 3_600,
      progress: 0,
      unit: 'seconds',
    }),
    windowed('DAY', {
      windowStart: '2026-09-14',
      windowEnd: '2026-09-14',
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
  const wrapper = mount(AchievementsView)
  wrappers.push(wrapper)
  return wrapper
}

beforeEach(() => {
  data = []
  pending = false
  failed = false
  refetchSpy.mockClear()
  nowValue.value = new Date(2026, 8, 14)
})

/*
 * Unmount every wrapper after each test.
 *
 * The view watches the clock's date to refetch at a window boundary, so a wrapper
 * left mounted keeps a live watcher. `refetchSpy` is module-scoped, so those
 * orphaned watchers fire on a later test's clock change and inflate its call count
 * (observed: 11 calls where 1 was expected).
 */
afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount()
  wrappers.length = 0
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

  it('groups the resetting ladders into one sub-section per window', () => {
    data = serverPayload()
    const wrapper = mountView()

    // A window is a deadline, so it is a grouping of its own rather than one grid
    // holding trophies that expire at four different moments.
    const groups = wrapper.findAll('[data-window-group]')
    expect(groups.map((g) => g.attributes('data-window-group'))).toEqual(['DAY'])
    expect(groups[0]!.findAll('[data-testid="trophy-card"]')).toHaveLength(1)
  })

  it('states each window date range and countdown once, on the group', () => {
    data = serverPayload()
    const wrapper = mountView()

    const group = wrapper.get('[data-window-group="DAY"]')
    // A DAY window begins and ends on the same date, so the range collapses.
    expect(group.get('[data-testid="window-range"]').text()).toBe('Sep 14')
    // The clock is pinned, so the countdown is exact rather than pattern-matched:
    // the window's last day is the pinned date.
    expect(group.get('[data-testid="window-countdown"]').text()).toBe('Ends today')
  })

  it('emphasises the countdown on its last day', () => {
    // The window ending today is the one with something left to act on; a fortnight
    // out is information, not a deadline. Emphasis is a token swap (muted →
    // foreground), not a colour: the palette has no "urgent" hue.
    // The clock is pinned to 2026-09-14, which is also this window's last day.
    data = [
      windowed('DAY', {
        windowStart: '2026-09-14',
        windowEnd: '2026-09-14',
        code: 'D1',
        type: 'TOTAL_SECONDS',
        target: 3_600,
        unit: 'seconds',
      }),
    ]
    const wrapper = mountView()

    const countdown = wrapper.get('[data-testid="window-countdown"]')
    expect(countdown.text()).toBe('Ends today')
    expect(countdown.classes()).toContain('text-foreground')
    // Not colour alone: the underline is what makes it legible in greyscale.
    expect(countdown.classes()).toContain('underline')
  })

  it('emphasises the closing stretch of a window', () => {
    // Same pinned clock (2026-09-14), a window ending tomorrow: live, and inside
    // the closing stretch — a target is still reachable but not comfortably so.
    data = [
      windowed('DAY', {
        windowStart: '2026-09-14',
        windowEnd: '2026-09-15',
        code: 'D1',
        type: 'TOTAL_SECONDS',
        target: 3_600,
        unit: 'seconds',
      }),
    ]
    const wrapper = mountView()

    const countdown = wrapper.get('[data-testid="window-countdown"]')
    expect(countdown.text()).toBe('1 day left')
    expect(countdown.classes()).toContain('text-foreground')
  })

  it('leaves a distant deadline unemphasised', () => {
    // A year-long window is never closing in on anything; it must not borrow the
    // closing-stretch styling.
    data = [
      windowed('YEAR', {
        windowStart: '2026-01-01',
        windowEnd: '2026-12-31',
        code: 'Y1',
        type: 'TOTAL_SECONDS',
        target: 1_800_000,
        unit: 'seconds',
      }),
    ]
    const wrapper = mountView()

    const countdown = wrapper.get('[data-testid="window-countdown"]')
    // 2026-09-14 → 2026-12-31 is 108 days.
    expect(countdown.text()).toBe('108 days left')
    expect(countdown.classes()).toContain('text-muted-foreground')
  })

  it('counts down from the pinned clock, so the deadline is not guessed', () => {
    data = serverPayload()
    const wrapper = mountView()

    // A DAY window whose end equals the pinned date: 0 days left, i.e. today.
    const group = wrapper.get('[data-window-group="DAY"]')
    expect(group.get('[data-testid="window-countdown"]').text()).toBe('Ends today')
  })

  it('refetches when the local date rolls over, so the countdown cannot outlive its data', async () => {
    /*
     * The countdown runs on a live clock while the window dates come from a query
     * that never refreshes on its own (`refetchOnWindowFocus: false`, no interval).
     * A past window clamps to 0 days, which renders "Ends today" — so without this
     * refetch a page left open past a boundary would state "Ends today" beside a
     * range it has already left, and never correct itself.
     */
    data = serverPayload()
    const wrapper = mountView()
    expect(refetchSpy).not.toHaveBeenCalled()

    // Same day, a minute later: the clock ticks but the local date has not moved,
    // so there is nothing new to ask the server for.
    nowValue.value = new Date(2026, 8, 14, 23, 59)
    await wrapper.vm.$nextTick()
    expect(refetchSpy).not.toHaveBeenCalled()

    // Midnight: the windows this page is showing have now changed.
    nowValue.value = new Date(2026, 8, 15)
    await wrapper.vm.$nextTick()
    expect(refetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not repeat the window range on the cards inside the group', () => {
    data = serverPayload()
    const wrapper = mountView()

    // One deadline per window, not once per trophy: the group header owns it.
    expect(wrapper.findAll('[data-testid="window-range"]')).toHaveLength(wrapper.findAll('[data-window-group]').length)
  })

  it('says a lifetime trophy never resets, rather than dating it', () => {
    data = serverPayload()
    const wrapper = mountView()

    const lifetime = wrapper.get('[data-testid="section-lifetime"]')
    expect(lifetime.findAll('[data-testid="window-range"]')).toHaveLength(0)
    expect(lifetime.findAll('[data-testid="window-countdown"]')).toHaveLength(0)
    expect(lifetime.text()).toContain('Never resets')
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
