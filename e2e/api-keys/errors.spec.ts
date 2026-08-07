import { test, expect } from '@playwright/test'
import { setupApiKeysPage, openCreateDialog, submitCreateForm, fulfillError } from './helpers.js'
import {
  AUTH_014_BODY,
  RATE_LIMIT_BODY,
  RATE_LIMIT_WITH_RETRY_AFTER_BODY,
  AUTH_010_BODY,
  TEST_ACTIVE_KEY,
  TEST_KEYS,
} from './fixtures.js'

test.describe('API keys error paths', () => {
  test('shows the limit banner on 409 AUTH_014 and keeps the form intact', async ({ page }) => {
    await setupApiKeysPage(page, [])

    // Override POST with a 409; fall through to the setup handler for GET.
    await page.route('**/api/v1/auth/api-keys', async (route) => {
      if (route.request().method() === 'POST') {
        await fulfillError(route, 409, AUTH_014_BODY)
        return
      }
      await route.fallback()
    })

    await openCreateDialog(page)
    await submitCreateForm(page, 'Limit Test Key')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('You have reached the maximum of 20 API keys')
    // Form content is preserved.
    await expect(dialog.locator('#api-key-name')).toHaveValue('Limit Test Key')
  })

  test('shows a toast on 429 RATE_LIMIT_001', async ({ page }) => {
    await setupApiKeysPage(page, [])

    await page.route('**/api/v1/auth/api-keys', async (route) => {
      if (route.request().method() === 'POST') {
        await fulfillError(route, 429, RATE_LIMIT_BODY)
        return
      }
      await route.fallback()
    })

    await openCreateDialog(page)
    await submitCreateForm(page, 'Rate Limited Key')

    await expect(page.getByText('Too many requests', { exact: false })).toBeVisible()
  })

  test('shows the countdown toast when the 429 body carries a retryAfter instant', async ({ page }) => {
    await setupApiKeysPage(page, [])

    await page.route('**/api/v1/auth/api-keys', async (route) => {
      if (route.request().method() === 'POST') {
        await fulfillError(route, 429, RATE_LIMIT_WITH_RETRY_AFTER_BODY)
        return
      }
      await route.fallback()
    })

    await openCreateDialog(page)
    await submitCreateForm(page, 'Countdown Key')

    // getRetryAfterSeconds resolves the body instant to whole seconds, so the
    // countdown toast ("Please try again in Ns.") replaces the static message.
    await expect(page.getByText(/Please try again in \d+s\./)).toBeVisible()
  })

  test('shows the generic BOLA toast on 401 AUTH_010 without logging out', async ({ page }) => {
    await setupApiKeysPage(page, TEST_KEYS)

    // Override DELETE with a 401 AUTH_010.
    await page.route('**/api/v1/auth/api-keys/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await fulfillError(route, 401, AUTH_010_BODY)
        return
      }
      await route.fallback()
    })

    const row = page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_ACTIVE_KEY.name })
    await row
      .getByRole('button', { name: `Revoke ${TEST_ACTIVE_KEY.name}` })
      .evaluate((el) => (el as HTMLElement).click())
    await page.getByRole('alertdialog').getByRole('button', { name: 'Revoke' }).click()

    await expect(page.getByText('API key not found or no longer accessible.')).toBeVisible()
    // The user is NOT logged out (interceptor excludes AUTH_010 from the logout
    // path). The confirm dialog stays open, so assert on the URL instead of the
    // page heading: an aria-modal dialog hides the rest of the page from the
    // accessibility tree.
    await expect(page).toHaveURL(/\/settings\/api-keys/)
  })
})
