import { describe, expect, it, vi, beforeEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'
import LeaderboardView from '../LeaderboardView.vue'
import type { LeaderboardResponse } from '@/lib/schemas/leaderboard.schema'

/**
 * What the query returns, per test.
 *
 * A `ref` rather than a plain variable: one test has to change the response *after*
 * mount (the empty page that follows an exhausted board), and a `computed` over a
 * plain `let` caches its first value and would never re-render.
 */
const data = ref<LeaderboardResponse | undefined>(undefined)
let pending = false
let failed = false
const refetchSpy = vi.fn<() => void>()

vi.mock('@/features/leaderboard/composables/useLeaderboard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/leaderboard/composables/useLeaderboard')>()
  return {
    ...actual,
    useLeaderboard: () => ({
      data: computed(() => data.value),
      isPending: computed(() => pending),
      isError: computed(() => failed),
      refetch: refetchSpy,
      effectivePeriod: ref('ALL'),
    }),
  }
})

/** A page shaped like the server's: tied ranks, one deleted account. */
function page(over: Partial<LeaderboardResponse> = {}): LeaderboardResponse {
  return {
    entries: [
      { userId: '11111111-1111-4111-8111-111111111111', displayName: 'Ada', score: 7200, rank: 1 },
      { userId: '22222222-2222-4222-8222-222222222222', displayName: null, score: 3600, rank: 2 },
    ],
    currentUserRank: 7,
    ...over,
  }
}

/** A full page — what the server returns whenever more rows may follow. */
function fullPage(): LeaderboardResponse['entries'] {
  return Array.from({ length: 20 }, (_, i) => ({
    userId: `${String(i + 1).padStart(8, '0')}-1111-4111-8111-111111111111`,
    displayName: `User ${i + 1}`,
    score: 10_000 - i,
    rank: i + 1,
  }))
}

function mountView() {
  return mount(LeaderboardView)
}

beforeEach(() => {
  data.value = undefined
  pending = false
  failed = false
  refetchSpy.mockClear()
})

describe('LeaderboardView', () => {
  it('renders one row per entry with the server rank', () => {
    data.value = page()
    const wrapper = mountView()

    const rows = wrapper.findAll('[data-testid="leaderboard-entry"]')
    expect(rows).toHaveLength(2)
    // Top three are medals (2 is silver, not the numeral), the rest are numbers.
    expect(rows.map((r) => r.get('[data-testid="entry-rank"]').text())).toEqual(['🥇', '🥈'])
  })

  it('shows the caller rank from the same response, not a second request', () => {
    data.value = page()
    const wrapper = mountView()

    // The previous implementation fetched /leaderboard/me, which does not exist.
    expect(wrapper.get('[data-testid="own-rank"]').text()).toContain('#7')
  })

  it('renders no rank chip when the caller is unranked', () => {
    // currentUserRank is null (key absent) for a user who has never pushed — a
    // normal state that must not look like a failure.
    data.value = page({ currentUserRank: null })
    const wrapper = mountView()

    expect(wrapper.find('[data-testid="own-rank"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="leaderboard-entry"]')).toHaveLength(2)
  })

  it('names a deleted account instead of printing an empty row', () => {
    data.value = page()
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Deleted account')
  })

  it('offers exactly the periods the active dimension can rank', async () => {
    // Default dimension is TOTAL, the only one with real period choices.
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="period-ALL"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="period-WEEK"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="period-MONTH"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="period-YEAR"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="period-fixed"]').exists()).toBe(false)

    // Switching to a single-period dimension must withdraw the others, otherwise the
    // user could request a pair the server rejects with HTTP 400.
    await wrapper.get('[data-testid="dimension-NIGHT_OWL"]').trigger('click')
    expect(wrapper.find('[data-testid="period-WEEK"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="period-MONTH"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="period-fixed"]').text()).toBe('All time')
  })

  it('restricts the period selector once a single-period dimension is chosen', async () => {
    const wrapper = mountView()
    await wrapper.get('[data-testid="dimension-STREAK"]').trigger('click')

    // No period buttons at all — the one legal period is stated instead.
    expect(wrapper.find('[data-testid="period-WEEK"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="period-fixed"]').text()).toBe('All time')
  })

  it('shows GROWTH locked to the week, which is its only legal period', async () => {
    const wrapper = mountView()
    await wrapper.get('[data-testid="dimension-GROWTH"]').trigger('click')

    expect(wrapper.get('[data-testid="period-fixed"]').text()).toBe('This week')
  })

  it('treats an empty page as a state, not an error', () => {
    // TOTAL:WEEK legitimately returns nothing.
    data.value = page({ entries: [] })
    const wrapper = mountView()

    expect(wrapper.findAll('[data-testid="leaderboard-entry"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('No one is ranked yet')
    expect(wrapper.text()).not.toContain('Failed to load')
  })

  it('renders skeletons while the query is in flight', () => {
    pending = true
    const wrapper = mountView()

    // Assert the skeletons themselves: "no rows and no empty text" also holds in the
    // content branch with undefined data, so it cannot fail if this branch is removed.
    expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(wrapper.findAll('[data-testid="leaderboard-entry"]')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('No one is ranked yet')
  })

  it('offers a working retry when the query fails', async () => {
    failed = true
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Failed to load leaderboard')
    // The dimension tabs are buttons too, so find Retry by its label.
    const retry = wrapper.findAll('button').find((b) => b.text().includes('Retry'))!
    await retry.trigger('click')
    expect(refetchSpy).toHaveBeenCalledTimes(1)
  })

  it('disables Previous on the first page and enables it after paging', async () => {
    // A full page, because "Next" is only offered while the last response came back
    // full — the response carries no total, so that is the only end signal available.
    data.value = page({ entries: fullPage() })
    const wrapper = mountView()

    // The Button primitive declares no `disabled` prop — it is a reka-ui
    // `Primitive`, so `:disabled` lands as a plain attribute on the element rather
    // than becoming `HTMLButtonElement.disabled`. Assert the attribute.
    expect(wrapper.get('[data-testid="prev-page"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="next-page"]').trigger('click')
    expect(wrapper.get('[data-testid="prev-page"]').attributes('disabled')).toBeUndefined()
    // `.text()` includes the visually-hidden context the range carries.
    expect(wrapper.get('[data-testid="page-range"]').text()).toContain('21–40')
  })

  it('lets the reader return after paging one page past the end', async () => {
    /*
     * A ranking whose size is an exact multiple of the page size offers one page too
     * many (a full page is the only end signal the API gives). That extra page is
     * empty, and the pager lives in the non-empty branch — so without this control the
     * reader is stranded with no way back.
     */
    data.value = page({ entries: fullPage() })
    const wrapper = mountView()

    // Click while the page is still full — that is what enables Next. Swapping the
    // data first would disable the very control under test.
    await wrapper.get('[data-testid="next-page"]').trigger('click')
    // The server's answer for the new offset on an exhausted board: an empty page.
    data.value = page({ entries: [] })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Nothing more to show')
    // Not "No one is ranked yet" — there ARE ranked people, the reader just went past them.
    expect(wrapper.text()).not.toContain('No one is ranked yet')

    const back = wrapper.get('[data-testid="prev-page-empty"]')
    await back.trigger('click')
    data.value = page({ entries: fullPage() })
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-testid="page-range"]').text()).toContain('1–20')
  })

  it('says nobody is ranked when the first page itself is empty', () => {
    // The genuinely-empty ranking, which must not be confused with the case above.
    data.value = page({ entries: [] })
    const wrapper = mountView()

    expect(wrapper.text()).toContain('No one is ranked yet')
    // Nothing to go back to, so no way-back control.
    expect(wrapper.find('[data-testid="prev-page-empty"]').exists()).toBe(false)
  })

  it('offers Next only while the last page came back full', () => {
    // Two rows means the end; a 20-row page means there may be more.
    data.value = page()
    expect(mountView().get('[data-testid="next-page"]').attributes('disabled')).toBeDefined()

    data.value = page({ entries: fullPage() })
    expect(mountView().get('[data-testid="next-page"]').attributes('disabled')).toBeUndefined()
  })
})
