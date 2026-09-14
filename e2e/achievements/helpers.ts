import { expect, type Page } from '@playwright/test'
import { mockAuthApis, loginViaForm, okEnvelope } from '../utils/auth-helpers.js'
import { TEST_ACHIEVEMENTS, type AchievementFixture } from './fixtures.js'

export interface AchievementsPageSetup {
  /** Replace the badge list the next GET returns. */
  setAchievements: (badges: AchievementFixture[]) => void
}

/**
 * Seed the auth mocks, mock the achievements endpoint with mutable state, log in
 * and navigate to /achievements.
 *
 * The handler reads the `badges` array through its closure, so a test can swap
 * the payload and refetch without re-registering a route — the same shape the
 * devices helper uses.
 *
 * Mocks `GET /api/v1/stats/achievements` only. The dashboard's other endpoints
 * are never called from this page, and `mockAuthApis` already covers the boot
 * sequence.
 *
 * @param page - Playwright page
 * @param initialBadges - the payload the first GET returns
 * @returns a handle to replace the payload between assertions
 */
export async function setupAchievementsPage(
  page: Page,
  initialBadges: AchievementFixture[] = TEST_ACHIEVEMENTS,
): Promise<AchievementsPageSetup> {
  await mockAuthApis(page)

  let badges = [...initialBadges]

  await page.route('**/api/v1/stats/achievements*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(okEnvelope(badges)),
    })
  })

  await loginViaForm(page)
  await page.goto('/achievements')

  return {
    setAchievements: (next: AchievementFixture[]) => {
      badges = [...next]
    },
  }
}

/**
 * Wait for the trophy grid and assert the page is not in a loading or error
 * state, so a spec's first assertion cannot race the query.
 */
export async function expectAchievementsRendered(page: Page): Promise<void> {
  await expect(page.getByTestId('trophy-card').first()).toBeVisible()
  await expect(page.getByText('Failed to load achievements')).toBeHidden()
}
