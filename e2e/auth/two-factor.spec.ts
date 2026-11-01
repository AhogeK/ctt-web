import { test, expect, type Page } from '@playwright/test'
import { TEST_USER_CREDENTIALS } from '../fixtures/auth.js'
import {
  LOGIN_CHALLENGE_RESPONSE,
  LOGIN_TWO_FACTOR_INVALID_CODE_RESPONSE,
  LOGIN_TWO_FACTOR_SUCCESS_RESPONSE,
} from '../mocks/handlers/auth.js'
import { mockAuthApis, nowIso, STORAGE_KEYS } from '../utils/auth-helpers.js'

/**
 * E2E tests for the two-step login.
 *
 * The password step answers `202` with a challenge instead of a session, so the
 * browser has to reach a second screen and only then hold tokens. The mocks
 * mirror that split exactly: `/auth/login` never returns tokens here, and
 * `/auth/login/2fa` accepts one code and refuses every other one.
 */

const LOGIN_PATH = '/auth/login'
const TWO_FACTOR_PATH = '/auth/login/2fa'
const DASHBOARD_PATH = '/dashboard'

const VALID_CODE = '123456'
const INVALID_CODE = '000000'

async function installTwoFactorOverrides(page: Page): Promise<void> {
  await mockAuthApis(page)

  // A stale session must not masquerade as signed in while the password step runs.
  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: 'Unauthorized',
        code: 'AUTH_003',
        timestamp: nowIso(),
      }),
    }),
  )

  // The password alone is never enough for this account.
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify(LOGIN_CHALLENGE_RESPONSE),
    }),
  )

  await page.route('**/api/v1/auth/login/2fa', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}') as { code?: string }

    if (body.code === VALID_CODE) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(LOGIN_TWO_FACTOR_SUCCESS_RESPONSE),
      })
      return
    }

    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify(LOGIN_TWO_FACTOR_INVALID_CODE_RESPONSE),
    })
  })
}

/** Drives the password form and stops on the second step. */
async function submitPassword(page: Page): Promise<void> {
  await page.goto(LOGIN_PATH)
  await page.getByPlaceholder('you@example.com').fill(TEST_USER_CREDENTIALS.email)
  await page.getByPlaceholder('Enter your password').fill(TEST_USER_CREDENTIALS.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(TWO_FACTOR_PATH)
}

test.describe('Two-factor login', () => {
  test('moves to the second step without signing anyone in', async ({ page }) => {
    await installTwoFactorOverrides(page)
    await submitPassword(page)

    await expect(page.getByRole('heading', { name: 'Two-factor authentication' })).toBeVisible()
    await expect(page.getByPlaceholder('123456 or a recovery code')).toBeVisible()

    // A challenge is not a session: nothing may be stored before the code is accepted.
    const storedToken = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.ACCESS_TOKEN)
    expect(storedToken).toBeNull()
  })

  test('rejects a wrong code in place and accepts the right one', async ({ page }) => {
    await installTwoFactorOverrides(page)
    await submitPassword(page)

    await page.getByPlaceholder('123456 or a recovery code').fill(INVALID_CODE)
    await page.getByRole('button', { name: 'Verify' }).click()

    // Still on the step, with the reason beside the field instead of a page change.
    await expect(page.locator('[data-slot="form-message"]').first()).toBeVisible()
    await expect(page).toHaveURL(TWO_FACTOR_PATH)

    await page.getByPlaceholder('123456 or a recovery code').fill(VALID_CODE)
    await page.getByRole('button', { name: 'Verify' }).click()

    await page.waitForURL(DASHBOARD_PATH)
    await expect(page).toHaveURL(DASHBOARD_PATH)

    const storedToken = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.ACCESS_TOKEN)
    expect(storedToken).not.toBeNull()
  })

  test('sends a direct visitor back to sign-in', async ({ page }) => {
    await installTwoFactorOverrides(page)

    await page.goto(TWO_FACTOR_PATH)
    await page.waitForURL(LOGIN_PATH)

    await expect(page).toHaveURL(LOGIN_PATH)
  })
})
