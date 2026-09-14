import { test, expect } from '@playwright/test'
import { setupLeaderboardPage, expectLeaderboardRendered, lastQuery } from './helpers.js'
import {
  TEST_LEADERBOARD_EMPTY,
  TEST_LEADERBOARD_PAGE,
  TEST_LEADERBOARD_WITH_DELETED,
  fullLeaderboardPage,
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
      ['NIGHT_OWL', ['ALL']],
      ['EARLY_BIRD', ['ALL']],
      ['GROWTH', ['WEEK']],
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
    })
    await page.getByTestId('dimension-STREAK').click()
    await expect(page.getByTestId('leaderboard-entry').first()).toContainText('33 days')
  })

  test('shows the caller rank from the same response, and nothing when unranked', async ({ page }) => {
    const setup = await setupLeaderboardPage(page)
    await expectLeaderboardRendered(page)

    await expect(page.getByTestId('own-rank')).toContainText('#11')

    // An unranked caller omits the key entirely; that must read as "no rank",
    // not as a failure — the old contract modelled it as an error code.
    setup.setPayload(TEST_LEADERBOARD_WITH_DELETED)
    await page.getByTestId('dimension-STREAK').click()
    await expect(page.getByTestId('leaderboard-entry').first()).toBeVisible()
    await expect(page.getByTestId('own-rank')).toBeHidden()
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

  test('pages through the board and stops when a page comes back short', async ({ page }) => {
    /*
     * Paging is asserted through the rendered range rather than the wire, because
     * TanStack caches per (dimension, period, offset): returning to a page already
     * fetched renders from cache and issues no request at all. The one wire
     * assertion left is the offset that *is* new — the first step past the initial
     * page — which is also where the ranking must not reset.
     */
    const setup = await setupLeaderboardPage(page, fullLeaderboardPage())
    await expectLeaderboardRendered(page)

    await expect(page.getByTestId('page-range')).toContainText('1–20')
    // First page: nothing to go back to.
    await expect(page.getByTestId('prev-page')).toBeDisabled()

    await page.getByTestId('next-page').click()
    await expect.poll(() => lastQuery(setup.requests()).get('offset')).toBe('20')
    // Moving a page must not change the ranking being viewed.
    expect(lastQuery(setup.requests()).get('dimension')).toBe('TOTAL')
    expect(lastQuery(setup.requests()).get('period')).toBe('ALL')
    await expect(page.getByTestId('page-range')).toContainText('21–40')
    await expect(page.getByTestId('prev-page')).toBeEnabled()

    // Back to the cached first page, which is full — so Next is offered again.
    await page.getByTestId('prev-page').click()
    await expect(page.getByTestId('page-range')).toContainText('1–20')
    await expect(page.getByTestId('next-page')).toBeEnabled()

    // Serve a short page for the next uncached offset (40).
    setup.setPayload({ entries: [TEST_LEADERBOARD_PAGE.entries[0]!], currentUserRank: 11 })

    // Step to the cached offset 20, then on to the fresh offset 40. Two clicks,
    // because the first one is answered from cache and cannot be observed on the wire.
    await page.getByTestId('next-page').click()
    await expect(page.getByTestId('page-range')).toContainText('21–40')
    await page.getByTestId('next-page').click()

    await expect.poll(() => lastQuery(setup.requests()).get('offset')).toBe('40')
    await expect(page.getByTestId('page-range')).toContainText('41–41')
    // A short page is the only end signal the contract offers.
    await expect(page.getByTestId('next-page')).toBeDisabled()
  })

  test('offers a way back from the extra page a full board offers', async ({ page }) => {
    /*
     * With no total in the response, a full page is the only signal that more may
     * follow — so a board whose size is an exact multiple of the page size offers
     * one page too many. That page is empty, and the pager lives in the
     * non-empty branch, so the empty state has to carry its own way back.
     */
    const setup = await setupLeaderboardPage(page, fullLeaderboardPage())
    await expectLeaderboardRendered(page)

    await page.getByTestId('next-page').click()
    await expect.poll(() => lastQuery(setup.requests()).get('offset')).toBe('20')

    setup.setPayload(TEST_LEADERBOARD_EMPTY)
    await page.getByTestId('next-page').click()
    await expect.poll(() => lastQuery(setup.requests()).get('offset')).toBe('40')

    await expect(page.getByText('Nothing more to show')).toBeVisible()
    // Not the "no one is ranked" copy: there are ranked people, the reader just
    // went past them.
    await expect(page.getByText('No one is ranked yet')).toBeHidden()

    const back = page.getByTestId('prev-page-empty')
    await expect(back).toBeVisible()
    await back.click()
    // offset 20 was already fetched, so it comes from cache — assert the render.
    await expect(page.getByTestId('page-range')).toContainText('21–40')
  })

  test('restricts the period selector to the active dimension', async ({ page }) => {
    await setupLeaderboardPage(page)
    await expectLeaderboardRendered(page)

    // TOTAL is the only dimension with a real choice.
    await expect(page.getByTestId('period-WEEK')).toBeVisible()
    await expect(page.getByTestId('period-YEAR')).toBeVisible()

    await page.getByTestId('dimension-NIGHT_OWL').click()
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
})
