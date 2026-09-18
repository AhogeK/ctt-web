import { describe, expect, it, vi, beforeEach } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'
import LanguageSelect from '../../components/LanguageSelect.vue'
import type { LanguageBoardGroup } from '../../composables/useLeaderboard'
import LeaderboardView from '../LeaderboardView.vue'
import type { LanguageBoard, LeaderboardResponse } from '@/lib/schemas/leaderboard.schema'

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

/**
 * The language catalogue, per test.
 *
 * Empty by default: the `LANGUAGE` dimension is only offered once a board exists, and the
 * unit under test for that rule is the view's own filtering, not the fixture.
 */
const languageBoards = ref<LanguageBoard[]>([])

/**
 * The view reads the signed-in id to know which row is the reader's own, so the store has to
 * answer. Stubbed rather than mounting Pinia: this suite is about what the list renders, and a
 * real store would pull the whole auth module — persistence, refresh timers, the router — in
 * with it, none of which any assertion here is about.
 */
const mockAuthUserId = vi.hoisted(() => ({ value: null as string | null }))

/**
 * The page offset the view handed the query, captured by reference.
 *
 * By *reference* on purpose: the view passes a `ref` and mutates it, so reading `.value` once at
 * call time would record only the first page and every jump assertion would pass.
 */
const mockOffsetRef = vi.hoisted(() => ({ current: null as { value: number } | null }))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ userId: mockAuthUserId.value }),
}))

vi.mock('@/features/leaderboard/composables/useLeaderboard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/leaderboard/composables/useLeaderboard')>()
  return {
    ...actual,
    useLeaderboard: (_dimension: unknown, _period: unknown, _language: unknown, offset: { value: number }) => {
      mockOffsetRef.current = offset
      return {
        data: computed(() => data.value),
        isPending: computed(() => pending),
        isError: computed(() => failed),
        refetch: refetchSpy,
        effectivePeriod: ref('ALL'),
      }
    },
    // `groupLanguageBoards` comes from `actual`, deliberately: a mock that reimplemented
    // the grouping would keep these tests green while the real ordering broke.
    useLeaderboardLanguages: () => ({
      boards: computed(() => languageBoards.value),
      grouped: computed(() => actual.groupLanguageBoards(languageBoards.value)),
    }),
  }
})

/** A page shaped like the server's: tied ranks, one deleted account. */
function page(over: Partial<LeaderboardResponse> = {}): LeaderboardResponse {
  const entries = over.entries ?? [
    { userId: '11111111-1111-4111-8111-111111111111', displayName: 'Ada', score: 7200, rank: 1 },
    { userId: '22222222-2222-4222-8222-222222222222', displayName: null, score: 3600, rank: 2 },
  ]
  return {
    currentUserRank: 7,
    ...over,
    entries,
    // "This page is the whole board" unless a test says otherwise: what decides
    // whether another page exists is the board's total, not how full the page is.
    totalParticipants: over.totalParticipants ?? entries.length,
  }
}

/** A full page. A board holding exactly this many is exhausted at page 1. */
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
  languageBoards.value = []
  pending = false
  failed = false
  refetchSpy.mockClear()
  // Reset alongside the rest: a leftover id would decide which row is "mine" in the next test.
  mockAuthUserId.value = null
})

describe('the reader’s own row', () => {
  it('is marked by userId, so a tie does not mark every row that shares the rank', () => {
    // Rows 2 and 3 share rank 2 — the server's ties. Only one of them is the reader's, and a
    // highlight keyed on rank would light up both, which is the whole reason the id is the key.
    mockAuthUserId.value = '33333333-3333-4333-8333-333333333333'
    data.value = page({
      entries: [
        { userId: '11111111-1111-4111-8111-111111111111', displayName: 'Ada', score: 7200, rank: 1 },
        { userId: '33333333-3333-4333-8333-333333333333', displayName: 'Me', score: 3600, rank: 2 },
        { userId: '44444444-4444-4444-8444-444444444444', displayName: 'Also tied', score: 3600, rank: 2 },
      ],
    })

    const rows = mountView().findAll('[data-testid="leaderboard-entry"]')

    expect(rows).toHaveLength(3)
    expect(rows.filter((row) => row.attributes('aria-current') === 'true')).toHaveLength(1)
    expect(rows[1]!.attributes('aria-current')).toBe('true')
  })

  it('leaves every row unmarked when the reader is not on this page', () => {
    mockAuthUserId.value = '99999999-9999-4999-8999-999999999999'
    data.value = page()

    const rows = mountView().findAll('[data-testid="leaderboard-entry"]')

    // Not "no highlight at all" as a stylistic choice: the page may legitimately be showing
    // someone else's rows, and marking none of them is the correct answer.
    expect(rows.filter((row) => row.attributes('aria-current') === 'true')).toEqual([])
  })
})

describe('the jump to the reader’s rank', () => {
  it('is offered only while a rank exists', () => {
    data.value = page({ currentUserRank: null })

    // A control that leads nowhere would be a question with no answer; the panel beside it
    // already says "Not ranked".
    expect(mountView().find('[data-testid="jump-to-my-rank"]').exists()).toBe(false)
  })

  it('names the action so the reader knows what pressing it does', () => {
    data.value = page({ currentUserRank: 7 })

    const button = mountView().find('[data-testid="jump-to-my-rank"]')

    expect(button.exists()).toBe(true)
    // "Find me" while the row is elsewhere on another page; the rank itself is stated in the
    // panel beside it, so the button does not repeat it.
    expect(button.text()).toContain('Find me')
  })

  it('switches to the page that holds the rank rather than walking there', () => {
    // Rank 7 on a board of 20-per-page rows is page 1 — offset 0 — so this case is the "already
    // here" path, and the assertion below is that pressing it does not move the reader away.
    data.value = page({ currentUserRank: 7 })
    const view = mountView()

    void view.find('[data-testid="jump-to-my-rank"]').trigger('click')

    expect(mockOffsetRef.current?.value).toBe(0)
  })

  it('moves to the page that holds a rank from further down the board', () => {
    // Rank 45 needs offset 40 on a 20-per-page board: one offset, not three pages fetched and
    // discarded. Asserted through the request the view made, since the query is mocked.
    data.value = page({ currentUserRank: 45 })
    const view = mountView()

    void view.find('[data-testid="jump-to-my-rank"]').trigger('click')

    expect(mockOffsetRef.current?.value).toBe(40)
  })
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
    data.value = page({ totalParticipants: 340 })
    const wrapper = mountView()

    // The previous implementation fetched /leaderboard/me, which does not exist. The board's
    // size travels with it: #7 reads differently at 7 of 20 than at 7 of 340.
    expect(wrapper.get('[data-testid="own-rank-value"]').text()).toBe('#7 of 340')
  })

  it('states that the caller is unranked rather than hiding the slot', () => {
    // currentUserRank is null (key absent) for a caller with no activity on this board — a
    // normal state. Rendering nothing left "not on this board" indistinguishable from
    // "the rank did not load".
    data.value = page({ currentUserRank: null })
    const wrapper = mountView()

    expect(wrapper.get('[data-testid="own-rank-value"]').text()).toBe('Not ranked')
    // The rows others occupy are unaffected.
    expect(wrapper.findAll('[data-testid="leaderboard-entry"]')).toHaveLength(2)
  })

  it('gives the board size even when the caller is the only member', () => {
    // #1 of 1 is not the same fact as #1 of 340, and hiding the denominator for small boards
    // would remove the case where it carries the most information.
    data.value = page({ currentUserRank: 1, totalParticipants: 1 })
    const wrapper = mountView()

    expect(wrapper.get('[data-testid="own-rank-value"]').text()).toBe('#1 of 1')
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

    // STREAK is the single-period dimension: its periods must be withdrawn, otherwise
    // the user could request a pair the server rejects with HTTP 400.
    await wrapper.get('[data-testid="dimension-STREAK"]').trigger('click')
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

  it('offers GROWTH its windows but never ALL, which it cannot rank', async () => {
    // GROWTH compares a period against the one before it, so an unbounded history is
    // meaningless for it — and an illegal pair is a 400, not a fallback.
    const wrapper = mountView()
    await wrapper.get('[data-testid="dimension-GROWTH"]').trigger('click')

    expect(wrapper.find('[data-testid="period-ALL"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="period-WEEK"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="period-MONTH"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="period-YEAR"]').exists()).toBe(true)
    // A real choice, so it is not stated as a fixed period.
    expect(wrapper.find('[data-testid="period-fixed"]').exists()).toBe(false)
  })

  it('ranks ACTIVE_DAYS over every period, like the other measurements', async () => {
    const wrapper = mountView()
    await wrapper.get('[data-testid="dimension-ACTIVE_DAYS"]').trigger('click')

    expect(wrapper.find('[data-testid="period-ALL"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="period-WEEK"]').exists()).toBe(true)
  })

  it('offers the LANGUAGE dimension only once a board exists', async () => {
    // An empty catalogue is a real state: boards are populated lazily as people are scored.
    // Offering the tab anyway would offer a dimension whose every selection is a 400
    // (`COMMON_003` — it cannot be ranked without a language, and there is none to give).
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="dimension-LANGUAGE"]').exists()).toBe(false)

    languageBoards.value = [{ name: 'Java', type: 'PROGRAMMING', hasMembers: true }]
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="dimension-LANGUAGE"]').exists()).toBe(true)
  })

  it('selects a board when the language dimension is chosen', async () => {
    // The server rejects `LANGUAGE` with no language, so a selection has to exist before a
    // request can be built.
    languageBoards.value = [
      { name: 'Markdown', type: 'PROSE', hasMembers: true },
      { name: 'Java', type: 'PROGRAMMING', hasMembers: true },
    ]
    const wrapper = mountView()
    await wrapper.get('[data-testid="dimension-LANGUAGE"]').trigger('click')
    await wrapper.vm.$nextTick()

    // The first board in category order, which is PROGRAMMING before PROSE.
    expect(wrapper.get('[data-testid="language-select"]').text()).toContain('Java')
  })

  it('offers every language, with the ones that have members first', async () => {
    // The catalogue is the whole vocabulary: an unranked board is still offered, because it
    // is a real board that answers "nobody yet" — but it must not push a board with members
    // down the list.
    languageBoards.value = [
      { name: 'ABAP', type: 'PROGRAMMING', hasMembers: false },
      { name: 'Java', type: 'PROGRAMMING', hasMembers: true },
      { name: '4D', type: 'PROGRAMMING', hasMembers: false },
      { name: 'Kotlin', type: 'PROGRAMMING', hasMembers: true },
    ]
    const wrapper = mountView()
    await wrapper.get('[data-testid="dimension-LANGUAGE"]').trigger('click')
    await wrapper.vm.$nextTick()

    // Asserted on what the view hands the picker, not on rendered options: `SelectContent`
    // teleports to `body` and only renders once opened. The rendered menu is covered
    // end-to-end instead. Cast because `props()` is untyped for an SFC.
    const groups = wrapper.findComponent(LanguageSelect).props('groups') as LanguageBoardGroup[]
    expect(groups[0]!.withMembers.map((board) => board.name)).toEqual(['Java', 'Kotlin'])
    expect(groups[0]!.withoutMembers.map((board) => board.name)).toEqual(['ABAP', '4D'])
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
    // A full page out of a larger board, so there is somewhere to page to.
    data.value = page({ entries: fullPage(), totalParticipants: 60 })
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

  it('lets the reader return when the board shrinks under them', async () => {
    // Rare, but reachable: the total is exact, so the board can only strand the reader
    // by shrinking between requests (a score decays, an account is deleted) and leaving
    // them on an offset that no longer exists. The empty page then has no pager — it is
    // rendered in the non-empty branch — so it must carry its own way back.

    data.value = page({ entries: fullPage(), totalParticipants: 60 })
    const wrapper = mountView()

    await wrapper.get('[data-testid="next-page"]').trigger('click')
    // The board collapsed to 20 rows while the reader sits at offset 20.
    data.value = page({ entries: [], totalParticipants: 20 })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Nothing more to show')
    // Not "No one is ranked yet" — there ARE ranked people, the reader just went past them.
    expect(wrapper.text()).not.toContain('No one is ranked yet')

    const back = wrapper.get('[data-testid="prev-page-empty"]')
    await back.trigger('click')
    data.value = page({ entries: fullPage(), totalParticipants: 60 })
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

  it('offers Next only while rows remain, so a full last page offers none', () => {
    // Two rows out of two: the end.
    data.value = page()
    expect(mountView().get('[data-testid="next-page"]').attributes('disabled')).toBeDefined()

    // Twenty rows out of twenty — **still the end**. Under the old full-page inference
    // this offered one page too many, which is exactly what the exact total fixes.
    data.value = page({ entries: fullPage(), totalParticipants: 20 })
    expect(mountView().get('[data-testid="next-page"]').attributes('disabled')).toBeDefined()

    // Twenty rows out of more: there is somewhere to go.
    data.value = page({ entries: fullPage(), totalParticipants: 21 })
    expect(mountView().get('[data-testid="next-page"]').attributes('disabled')).toBeUndefined()
  })
})
