import { expect, type Page } from '@playwright/test'
import { mockAuthApis, loginViaForm, okEnvelope } from '../utils/auth-helpers.js'
import { TEST_LEADERBOARD_PAGE, type LanguageFixture, type LeaderboardFixture } from './fixtures.js'

export interface LeaderboardPageSetup {
  /** Every leaderboard request URL the page issued, in order. */
  requests: () => string[]
  /** Replace the payload the next ranking GET returns. */
  setPayload: (payload: LeaderboardFixture) => void
  /** Replace the catalogue the next languages GET returns. */
  setLanguages: (languages: LanguageFixture[]) => void
}

/**
 * Seed the auth mocks, mock the leaderboard endpoint, log in and navigate to
 * /leaderboard.
 *
 * Records each request URL as well, because several assertions are about what
 * the page *asks for* rather than what it renders — that the period sent is one
 * the server accepts, and that paging moves `offset` without resetting the rest.
 *
 * @param page - Playwright page
 * @param initial - the payload the first GET returns
 * @returns handles for the recorded requests and the mutable payload
 */
export async function setupLeaderboardPage(
  page: Page,
  initial: LeaderboardFixture = TEST_LEADERBOARD_PAGE,
  initialLanguages: LanguageFixture[] = [],
): Promise<LeaderboardPageSetup> {
  await mockAuthApis(page)

  let payload = initial
  let languages = initialLanguages
  const requests: string[] = []

  /*
   * Two routes, registered most-specific-last: Playwright matches in reverse registration
   * order. The ranking route requires a query string so it cannot swallow the catalogue
   * request — the two endpoints differ only by a path segment, and a glob that matched both
   * would answer `/languages` with a ranking page.
   */
  await page.route('**/api/v1/leaderboard/languages', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(okEnvelope({ languages })),
    })
  })

  await page.route('**/api/v1/leaderboard?*', async (route) => {
    requests.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(okEnvelope(payload)),
    })
  })

  await loginViaForm(page)
  await page.goto('/leaderboard')

  return {
    requests: () => [...requests],
    setPayload: (next: LeaderboardFixture) => {
      payload = next
    },
    setLanguages: (next: LanguageFixture[]) => {
      languages = next
    },
  }
}

/** Search params of the last request the page issued, for query assertions. */
export function lastQuery(requests: string[]): URLSearchParams {
  const last = requests.at(-1)
  expect(last, 'a leaderboard request should have been issued').toBeDefined()
  return new URL(last!).searchParams
}

/** Wait for the entry list and assert the page is not in its error state. */
export async function expectLeaderboardRendered(page: Page): Promise<void> {
  await expect(page.getByTestId('leaderboard-entry').first()).toBeVisible()
  await expect(page.getByText('Failed to load leaderboard')).toBeHidden()
}
