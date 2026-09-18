import { test, expect } from '@playwright/test'
import { setupLeaderboardPage, expectLeaderboardRendered, lastQuery } from './helpers.js'
import { okEnvelope } from '../utils/auth-helpers.js'
// The signed-in account's id: the own-row assertion needs the caller to actually be on the board,
// and a highlight is only meaningful when the row it marks is really theirs.
import { TEST_USER_ID } from '../fixtures/auth.js'
import {
  TEST_LEADERBOARD_EMPTY,
  TEST_LEADERBOARD_PAGE,
  TEST_LEADERBOARD_WITH_DELETED,
  fullLeaderboardPage,
  TEST_LANGUAGES,
  TEST_LANGUAGES_WITH_EMPTY,
} from './fixtures.js'

/**
 * Leaderboard page, end to end.
 *
 * This page previously called three endpoints that do not exist and could only
 * ever render its error state, so the assertions here are mostly about the real
 * contract: that the request carries a legal dimension/period pair, that the
 * absent-key cases parse, and that paging moves without resetting the ranking.
 *
 * What the unit tests cannot reach is what the page *asks for* — the helpers
 * record every request so those assertions are made against the wire, not
 * against the rendered result.
 */
test.describe('Leaderboard page', () => {
  test('renders the board from the contract, not an error state', async ({ page }) => {
    await setupLeaderboardPage(page)
    await expectLeaderboardRendered(page)

    await expect(page.getByTestId('leaderboard-entry')).toHaveCount(3)
    await expect(page.getByText('Ada Lovelace')).toBeVisible()
    // The old implementation's failure mode: a permanent error panel.
    await expect(page.getByText('Failed to load leaderboard')).toBeHidden()
  })

  test('mounts inside the app shell', async ({ page }) => {
    await setupLeaderboardPage(page)
    await expectLeaderboardRendered(page)

    // Nesting under AppLayout is what restores the shell. Registered flat, the
    // page had no sidebar and no way to navigate away.
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  })

  test('requests the dimension and its legal period', async ({ page }) => {
    const setup = await setupLeaderboardPage(page)
    await expectLeaderboardRendered(page)

    // Default is TOTAL + ALL, which is a legal pair.
    const params = lastQuery(setup.requests())
    expect(params.get('dimension')).toBe('TOTAL')
    expect(params.get('period')).toBe('ALL')
  })

  test('never sends a dimension/period pair the server rejects', async ({ page }) => {
    /*
     * The server answers an unsupported pair with HTTP 400 COMMON_003, so the
     * selectors are built from the legal sets rather than the cross-product. Walk
     * every dimension and assert on the wire, because a wrong pair would surface
     * as a generic error rather than an obviously bad request.
     */
    const setup = await setupLeaderboardPage(page)
    await expectLeaderboardRendered(page)

    // Each dimension is locked to a single period where the server only allows one.
    for (const [dimension, allowed] of [
      ['STREAK', ['ALL']],
      ['NIGHT_OWL', ['ALL', 'WEEK', 'MONTH', 'YEAR']],
      ['EARLY_BIRD', ['ALL', 'WEEK', 'MONTH', 'YEAR']],
      ['GROWTH', ['WEEK', 'MONTH', 'YEAR']],
      ['ACTIVE_DAYS', ['ALL', 'WEEK', 'MONTH', 'YEAR']],
      ['TOTAL', ['ALL', 'WEEK', 'MONTH', 'YEAR']],
    ] as const) {
      setup.setPayload(TEST_LEADERBOARD_PAGE)
      await page.getByTestId(`dimension-${dimension}`).click()

      // Find the request the click produced rather than assuming it is the last
      // one: a dimension/period pair already fetched is served from cache and
      // issues no request at all.
      await expect
        .poll(() => setup.requests().some((u) => new URL(u).searchParams.get('dimension') === dimension))
        .toBe(true)

      const sent = setup
        .requests()
        .map((u) => new URL(u).searchParams)
        .filter((q) => q.get('dimension') === dimension)
      for (const params of sent) {
        expect(allowed, `${dimension} sent an illegal period`).toContain(params.get('period'))
      }
      const params = sent.at(-1)!

      /*
       * A single-period dimension states the period instead of offering buttons; a
       * dimension with a real choice shows the buttons. Both are asserted as counts
       * rather than in an if/else, so neither case can be skipped silently.
       */
      const expectsSelector = allowed.length > 1
      await expect(page.getByTestId('period-fixed')).toHaveCount(expectsSelector ? 0 : 1)
      await expect(page.getByTestId(`period-${params.get('period')}`)).toHaveCount(expectsSelector ? 1 : 0)
    }
  })

  test('formats the score per dimension rather than as one unit', async ({ page }) => {
    const setup = await setupLeaderboardPage(page)
    await expectLeaderboardRendered(page)

    // TOTAL is a duration: raw seconds must not reach the page.
    await expect(page.getByTestId('leaderboard-entry').first()).toContainText('690h')

    // STREAK counts days, not seconds.
    setup.setPayload({
      entries: [{ userId: 'ada11111-2222-4333-8444-555566660001', displayName: 'Ada Lovelace', score: 33, rank: 1 }],
      currentUserRank: 17,
      totalParticipants: 1,
    })
    await page.getByTestId('dimension-STREAK').click()
    await expect(page.getByTestId('leaderboard-entry').first()).toContainText('33 days')

    // ACTIVE_DAYS is a day count too — a score of 12 must not read as "12s".
    setup.setPayload({
      entries: [{ userId: 'ada11111-2222-4333-8444-555566660001', displayName: 'Ada Lovelace', score: 12, rank: 1 }],
      currentUserRank: 17,
      totalParticipants: 1,
    })
    await page.getByTestId('dimension-ACTIVE_DAYS').click()
    await expect(page.getByTestId('leaderboard-entry').first()).toContainText('12 days')
  })

  test('shows the caller rank from the same response, and states an absent one', async ({ page }) => {
    const setup = await setupLeaderboardPage(page)
    await expectLeaderboardRendered(page)

    await expect(page.getByTestId('own-rank')).toContainText('#11')

    // An unranked caller omits the key entirely; that must read as "no rank",
    // not as a failure — the old contract modelled it as an error code.
    setup.setPayload(TEST_LEADERBOARD_WITH_DELETED)
    await page.getByTestId('dimension-STREAK').click()
    await expect(page.getByTestId('leaderboard-entry').first()).toBeVisible()
    // The key is absent, which reads as "not on this board" — stated, not hidden, and not an
    // error. (The copy itself is asserted in its own case below.)
    await expect(page.getByTestId('own-rank-value')).toHaveText('Not ranked')
    await expect(page.getByText('Failed to load leaderboard')).toBeHidden()
  })

  test('renders a deleted account rather than an empty cell', async ({ page }) => {
    // Its `displayName` key is absent, not null — a schema that required the key
    // failed to parse the whole page, which put page 2 into the error state.
    await setupLeaderboardPage(page, TEST_LEADERBOARD_WITH_DELETED)
    await expectLeaderboardRendered(page)

    await expect(page.getByTestId('leaderboard-entry')).toHaveCount(2)
    await expect(page.getByText('Deleted account')).toBeVisible()
  })

  test('numbers rows by the server rank, so a tie is not renumbered', async ({ page }) => {
    await setupLeaderboardPage(page, TEST_LEADERBOARD_PAGE)
    await expectLeaderboardRendered(page)

    // Ranks are 1, 2, 2 — the third row shares rank 2 and must not read "#3",
    // which is what numbering by row index would produce.
    const badges = page.getByTestId('leaderboard-entry').locator('[data-slot="badge"]')
    await expect(badges).toHaveText(['#1', '#2', '#2'])
  })

  test('treats an empty board as a state, not an error', async ({ page }) => {
    // TOTAL:WEEK legitimately returns nothing.
    await setupLeaderboardPage(page, TEST_LEADERBOARD_EMPTY)

    await expect(page.getByText('No one is ranked yet')).toBeVisible()
    await expect(page.getByTestId('leaderboard-entry')).toHaveCount(0)
    await expect(page.getByText('Failed to load leaderboard')).toBeHidden()
  })

  test('pages through the board and stops at its real end', async ({ page }) => {
    /*
     * Paging is asserted through the rendered range rather than the wire, because
     * TanStack caches per (dimension, period, offset): returning to a page already
     * fetched renders from cache and issues no request. The wire assertions left are
     * the offsets that *are* new.
     *
     * The board is 60 rows with a 20-row page — an exact multiple, which is precisely
     * the shape that used to offer a fourth page that does not exist.
     */
    const setup = await setupLeaderboardPage(page, fullLeaderboardPage(60))
    await expectLeaderboardRendered(page)

    await expect(page.getByTestId('page-range')).toContainText('1–20')
    // First page: nothing to go back to.
    await expect(page.getByTestId('prev-page')).toBeDisabled()
    await expect(page.getByTestId('next-page')).toBeEnabled()

    await page.getByTestId('next-page').click()
    await expect.poll(() => lastQuery(setup.requests()).get('offset')).toBe('20')
    // Moving a page must not change the ranking being viewed.
    expect(lastQuery(setup.requests()).get('dimension')).toBe('TOTAL')
    expect(lastQuery(setup.requests()).get('period')).toBe('ALL')
    await expect(page.getByTestId('page-range')).toContainText('21–40')
    await expect(page.getByTestId('prev-page')).toBeEnabled()

    await page.getByTestId('next-page').click()
    await expect.poll(() => lastQuery(setup.requests()).get('offset')).toBe('40')
    await expect(page.getByTestId('page-range')).toContainText('41–60')

    /*
     * The last page is full, and that must no longer imply another one. Under the old
     * full-page inference this offered a fourth page; the board's own size says 60 of
     * 60 are shown.
     */
    await expect(page.getByTestId('next-page')).toBeDisabled()

    // Back to offset 20 — already fetched, so it comes from cache and issues nothing.
    await page.getByTestId('prev-page').click()
    await expect(page.getByTestId('page-range')).toContainText('21–40')
  })

  test('lets the reader back when the board shrinks under them', async ({ page }) => {
    /*
     * The exact total means a page past the end is normally unreachable, but a board
     * shrinks for real: deleting sessions removes a member outright (v0.76.1 — before
     * that a stale score kept them listed), so `totalParticipants` can fall between two
     * requests and leave the reader on an offset that no longer exists. That empty page
     * renders in place of the non-empty branch, so it carries its own way back.
     */
    const setup = await setupLeaderboardPage(page, fullLeaderboardPage(60))
    await expectLeaderboardRendered(page)

    await page.getByTestId('next-page').click()
    await expect.poll(() => lastQuery(setup.requests()).get('offset')).toBe('20')

    // The board collapsed to 20 rows while the reader sits at offset 20.
    setup.setPayload({ entries: [], currentUserRank: 11, totalParticipants: 20 })
    await page.getByTestId('next-page').click()
    await expect.poll(() => lastQuery(setup.requests()).get('offset')).toBe('40')

    await expect(page.getByText('Nothing more to show')).toBeVisible()
    // Not the "no one is ranked" copy: there are ranked people, the reader just went
    // past them.
    await expect(page.getByText('No one is ranked yet')).toBeHidden()

    const back = page.getByTestId('prev-page-empty')
    await expect(back).toBeVisible()
    await back.click()
    // offset 20 was already fetched, so it comes from cache — assert the render.
    await expect(page.getByTestId('page-range')).toContainText('21–40')
  })

  test('offers the language dimension only when a board exists', async ({ page }) => {
    /*
     * Boards are written the first time somebody is scored on one, so an empty catalogue is
     * a real state rather than an error. The tab must be absent then: every selection it
     * could offer is HTTP 400 — the dimension cannot be ranked without a language, and the
     * catalogue is what supplies them.
     */
    await setupLeaderboardPage(page)
    await expectLeaderboardRendered(page)
    await expect(page.getByTestId('dimension-LANGUAGE')).toBeHidden()

    await page.unroute('**/api/v1/leaderboard/languages')
    await setupLeaderboardPage(page, TEST_LEADERBOARD_PAGE, TEST_LANGUAGES)
    await expectLeaderboardRendered(page)
    await expect(page.getByTestId('dimension-LANGUAGE')).toBeVisible()
  })

  test('selects a board and sends it, never the dimension alone', async ({ page }) => {
    const setup = await setupLeaderboardPage(page, TEST_LEADERBOARD_PAGE, TEST_LANGUAGES)
    await expectLeaderboardRendered(page)

    await page.getByTestId('dimension-LANGUAGE').click()

    // The dimension without a language is a 400, so selecting it has to select a board too.
    await expect.poll(() => lastQuery(setup.requests()).get('dimension')).toBe('LANGUAGE')
    // The first board in **category** order, not catalogue order: `Java` precedes
    // `Markdown` even though the catalogue lists Markdown first.
    expect(lastQuery(setup.requests()).get('language')).toBe('Java')
  })

  test('sends the language only for the dimension that is partitioned by one', async ({ page }) => {
    /*
     * The server rejects a language on any other dimension rather than ignoring it, because
     * ignoring it would answer a different question than the one asked. So the parameter must
     * appear and disappear with the dimension — asserted per request, not just on the last one.
     */
    const setup = await setupLeaderboardPage(page, TEST_LEADERBOARD_PAGE, TEST_LANGUAGES)
    await expectLeaderboardRendered(page)

    await page.getByTestId('dimension-LANGUAGE').click()
    await expect.poll(() => setup.requests().some((u) => new URL(u).searchParams.get('language') !== null)).toBe(true)

    await page.getByTestId('dimension-TOTAL').click()
    await expect
      .poll(() => setup.requests().some((u) => new URL(u).searchParams.get('dimension') === 'TOTAL'))
      .toBe(true)

    const wrong = setup
      .requests()
      .map((u) => new URL(u).searchParams)
      .filter((q) => q.get('dimension') !== 'LANGUAGE' && q.get('language') !== null)
    expect(wrong.map((q) => q.toString())).toEqual([])
  })

  test('opens the board picker grouped by category', async ({ page }) => {
    // Rendered here rather than in a unit test: `SelectContent` teleports out of the
    // component, so only a real browser shows whether the groups and their options exist.
    await setupLeaderboardPage(page, TEST_LEADERBOARD_PAGE, TEST_LANGUAGES)
    await expectLeaderboardRendered(page)

    await page.getByTestId('dimension-LANGUAGE').click()
    await page.getByTestId('language-select').click()

    await expect(page.getByText('Programming languages')).toBeVisible()
    await expect(page.getByText('Prose & docs')).toBeVisible()

    // Group order is the selector's own work — by likelihood of use, so `Programming` precedes
    // `Prose` even though the catalogue arrives sorted by name.
    const group = page.locator('[data-slot="select-group"]').filter({ hasText: 'Programming languages' })
    await expect(group.locator('[data-testid^="language-option-"]')).toHaveText(['Java', 'Kotlin'])

    // The default request returns only boards that have members, so `hasMembers` is uniformly
    // true and there is no second partition to divide.
    await expect(page.locator('[data-slot="select-separator"]')).toHaveCount(0)
  })

  test('orders an includeEmpty catalogue with the boards that have members first', async ({ page }) => {
    /*
     * The default returns only boards with members, where the flag distinguishes nothing;
     * `includeEmpty=true` returns the vocabulary (813 of 842 without members) and that is the
     * shape the flag exists for. The client does not request that mode, but the endpoint
     * documents it and the selector orders by the flag — so the ordering is asserted against
     * the shape that exercises it rather than left assumed from a uniform response.
     */
    await setupLeaderboardPage(page, TEST_LEADERBOARD_PAGE, TEST_LANGUAGES_WITH_EMPTY)
    await expectLeaderboardRendered(page)
    await page.getByTestId('dimension-LANGUAGE').click()
    await page.getByTestId('language-select').click()

    const group = page.locator('[data-slot="select-group"]').filter({ hasText: 'Programming languages' })
    await expect(group.locator('[data-testid^="language-option-"]')).toHaveText(['Java', 'Kotlin', 'ABAP', 'Zig'])

    // The boundary is drawn, not inferred: among hundreds of empty boards, "where the empty
    // ones start" is not something the names can tell a reader.
    await expect(group.locator('[data-slot="select-separator"]')).toHaveCount(1)
  })

  test('switches boards without leaving the dimension', async ({ page }) => {
    const setup = await setupLeaderboardPage(page, TEST_LEADERBOARD_PAGE, TEST_LANGUAGES)
    await expectLeaderboardRendered(page)
    await page.getByTestId('dimension-LANGUAGE').click()
    await expect.poll(() => lastQuery(setup.requests()).get('language')).toBe('Java')

    await page.getByTestId('language-select').click()
    await page.getByTestId('language-option-Kotlin').click()

    await expect.poll(() => lastQuery(setup.requests()).get('language')).toBe('Kotlin')
    expect(lastQuery(setup.requests()).get('dimension')).toBe('LANGUAGE')
  })

  test('treats an empty language board as a state, not an error', async ({ page }) => {
    // A listed board can be empty for the current period: the catalogue is sticky so the
    // selector does not move when a period rolls over.
    const setup = await setupLeaderboardPage(page, TEST_LEADERBOARD_PAGE, TEST_LANGUAGES)
    await expectLeaderboardRendered(page)
    await page.getByTestId('dimension-LANGUAGE').click()
    await expect.poll(() => lastQuery(setup.requests()).get('language')).toBe('Java')

    setup.setPayload({ entries: [], totalParticipants: 0 })
    await page.getByTestId('period-WEEK').click()

    await expect(page.getByText('No one is ranked yet')).toBeVisible()
    await expect(page.getByText('Failed to load leaderboard')).toBeHidden()
  })

  test('abandons the request for a board the reader has left', async ({ page }) => {
    /*
     * The endpoint is rate limited to 60 requests/minute, and an abandoned request still
     * spends the budget — so switching dimensions must cancel the one in flight rather than
     * let it finish unread. TanStack aborts a query once nothing observes it, but only if the
     * fetch consumes the signal; that wiring is what this covers.
     *
     * The delay is registered as a second handler, so it takes precedence over the setup's
     * (Playwright matches the most recently registered first) — which also means this test
     * records those requests itself rather than through the setup.
     */
    await setupLeaderboardPage(page)
    await expectLeaderboardRendered(page)

    const seen: string[] = []
    const aborted: string[] = []
    page.on('requestfailed', (request) => {
      if (request.url().includes('/leaderboard?')) aborted.push(request.failure()?.errorText ?? '')
    })

    // Hold the response open so the request is still in flight when the reader moves on.
    await page.route('**/api/v1/leaderboard?*', async (route) => {
      seen.push(route.request().url())
      await new Promise((resolve) => setTimeout(resolve, 3000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(okEnvelope(TEST_LEADERBOARD_PAGE)),
      })
    })

    await page.getByTestId('dimension-STREAK').click()
    await expect.poll(() => seen.some((u) => new URL(u).searchParams.get('dimension') === 'STREAK')).toBe(true)

    // Leaving the board while its request is still open.
    await page.getByTestId('dimension-TOTAL').click()

    await expect.poll(() => aborted.length).toBeGreaterThan(0)
    expect(aborted.every((text) => text.includes('ABORTED'))).toBe(true)
  })

  test('states an unranked caller instead of leaving the slot empty', async ({ page }) => {
    // `currentUserRank` is null when the board holds no activity for the caller. Rendering
    // nothing left that indistinguishable from a rank that failed to load.
    await setupLeaderboardPage(page, { ...TEST_LEADERBOARD_PAGE, currentUserRank: undefined })
    await expectLeaderboardRendered(page)

    await expect(page.getByTestId('own-rank-value')).toHaveText('Not ranked')
  })

  test('shows the board size beside the caller rank', async ({ page }) => {
    await setupLeaderboardPage(page, { ...TEST_LEADERBOARD_PAGE, currentUserRank: 7, totalParticipants: 340 })
    await expectLeaderboardRendered(page)

    // The denominator is how a reader tells a small board from a large one.
    await expect(page.getByTestId('own-rank-value')).toHaveText('#7 of 340')
  })

  test('restricts the period selector to the active dimension', async ({ page }) => {
    await setupLeaderboardPage(page)
    await expectLeaderboardRendered(page)

    await expect(page.getByTestId('period-WEEK')).toBeVisible()
    await expect(page.getByTestId('period-YEAR')).toBeVisible()

    // NIGHT_OWL ranks over every window (v0.73.0 widened it), so it keeps a choice.
    await page.getByTestId('dimension-NIGHT_OWL').click()
    await expect(page.getByTestId('period-WEEK')).toBeVisible()
    await expect(page.getByTestId('period-fixed')).toBeHidden()

    // GROWTH has windows but never ALL — an unbounded history is meaningless for a
    // period-over-period delta, and the pair would be a 400.
    await page.getByTestId('dimension-GROWTH').click()
    await expect(page.getByTestId('period-ALL')).toBeHidden()
    await expect(page.getByTestId('period-WEEK')).toBeVisible()

    // STREAK is the single-period dimension: stated, not offered.
    await page.getByTestId('dimension-STREAK').click()
    await expect(page.getByTestId('period-WEEK')).toBeHidden()
    await expect(page.getByTestId('period-fixed')).toHaveText('All time')
  })

  test('keeps the row list free of overflow', async ({ page }) => {
    await setupLeaderboardPage(page, fullLeaderboardPage())
    await expectLeaderboardRendered(page)

    const overflowing = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid="leaderboard-entry"]')]
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => el.textContent?.trim()),
    )
    expect(overflowing).toEqual([])
  })

  test('keeps the visible board on screen while another one loads', async ({ page }) => {
    /*
     * Regression: choosing a board the reader has not visited yet used to tear the list down and
     * stand skeletons in its place — measured, the rows were gone at 3ms with twenty skeletons
     * where they had been, and the new rows arrived at 33ms. Holding the previous page on screen
     * while the next one loads is what removes that flash, and nothing else here would notice it
     * being removed again.
     *
     * The response is held open deliberately: without it the new rows can land inside a single
     * frame and the test would pass whichever way the component behaved.
     */
    await setupLeaderboardPage(page)
    await expectLeaderboardRendered(page)

    const held = Promise.withResolvers<void>()
    await page.route('**/api/v1/leaderboard?*', async (route) => {
      await held.promise
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(okEnvelope(TEST_LEADERBOARD_PAGE)),
      })
    })

    await page.getByTestId('dimension-GROWTH').click()

    // The previous board is still on screen, marked as not-yet-current rather than removed.
    await expect(page.getByTestId('leaderboard-entry').first()).toBeVisible()
    await expect(page.locator('ol[aria-busy="true"]')).toBeVisible()
    // No skeleton took its place.
    await expect(page.locator('.animate-pulse')).toHaveCount(0)

    held.resolve()
    // And the mark lifts once the new board is the one being shown.
    await expect(page.locator('ol[aria-busy="true"]')).toHaveCount(0)
  })

  test('marks the caller’s own row and not the stranger sharing its rank', async ({ page }) => {
    // The caller's id is on the board, sharing rank 2 with somebody else. Ties share a rank, so a
    // highlight keyed on the rank would mark both rows and leave the reader unable to tell which
    // one is theirs — which is why the marker follows the id.
    await setupLeaderboardPage(page, {
      entries: [
        { userId: 'ada11111-2222-4333-8444-555566660001', displayName: 'Ada Lovelace', score: 7200, rank: 1 },
        { userId: TEST_USER_ID, displayName: 'Me', score: 3600, rank: 2 },
        { userId: 'ada11111-2222-4333-8444-555566660003', displayName: 'Also tied', score: 3600, rank: 2 },
      ],
      currentUserRank: 2,
      totalParticipants: 3,
    })
    await expectLeaderboardRendered(page)

    const marked = page.locator('[data-testid="leaderboard-entry"][aria-current="true"]')

    await expect(marked).toHaveCount(1)
    await expect(marked).toContainText('Me')
  })

  test('offers no jump when the caller is not on the board', async ({ page }) => {
    // `currentUserRank` omitted rather than nulled: the server leaves the key out entirely for a
    // caller who has never pushed, and the fixture mirrors the wire.
    await setupLeaderboardPage(page, {
      entries: TEST_LEADERBOARD_PAGE.entries,
      totalParticipants: TEST_LEADERBOARD_PAGE.totalParticipants,
    })
    await expectLeaderboardRendered(page)

    // Nowhere to go, so nothing to press; the panel beside it already states "Not ranked".
    await expect(page.getByTestId('jump-to-my-rank')).toHaveCount(0)
  })

  test('jumps to the page holding the caller’s rank instead of walking there', async ({ page }) => {
    // Rank 45 on a 20-per-page board is offset 40. Asserted through the request, because the
    // landing itself is a scroll the DOM cannot report: one request for the page that holds the
    // row, not three fetched on the way and thrown away.
    const harness = await setupLeaderboardPage(page, {
      entries: TEST_LEADERBOARD_PAGE.entries,
      currentUserRank: 45,
      totalParticipants: 60,
    })
    await expectLeaderboardRendered(page)

    await page.getByTestId('jump-to-my-rank').click()

    await expect.poll(() => lastQuery(harness.requests()).get('offset')).toBe('40')
  })
})
