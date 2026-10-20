import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm, okEnvelope } from '../utils/auth-helpers.js'

/**
 * The settings group's navigation contract:
 *
 *  1. /settings lands on its default section (Profile) — the parent record
 *     redirects, so the content region never renders blank.
 *  2. The section rail reaches every settings page and marks the active one.
 *  3. The legacy /devices URL redirects into the group.
 *  4. The avatar menu opens the group on its default section (it used to point
 *     at API Keys; this is the reported mismatch).
 */
test.describe('Settings navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApis(page)
    // The Devices section fetches the registry; an empty list is enough for
    // the heading and the rail assertions.
    await page.route('**/api/v1/devices', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(okEnvelope([])) })
      } else {
        await route.fallback()
      }
    })
    await loginViaForm(page)
  })

  test('/settings lands on the default section (Profile)', async ({ page }) => {
    await page.goto('/settings')

    await expect(page).toHaveURL(/\/settings\/profile$/)
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Settings sections' })).toBeVisible()
  })

  test('the section rail reaches every settings page', async ({ page }) => {
    await page.goto('/settings/profile')
    const rail = page.getByRole('navigation', { name: 'Settings sections' })

    await rail.getByRole('link', { name: /Devices/ }).click()
    await expect(page).toHaveURL(/\/settings\/devices$/)
    await expect(page.getByRole('heading', { name: 'Device Management' })).toBeVisible()

    await rail.getByRole('link', { name: /Preferences/ }).click()
    await expect(page).toHaveURL(/\/settings\/preferences$/)
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()

    await rail.getByRole('link', { name: /API Keys/ }).click()
    await expect(page).toHaveURL(/\/settings\/api-keys$/)
    await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible()

    await rail.getByRole('link', { name: /Profile/ }).click()
    await expect(page).toHaveURL(/\/settings\/profile$/)
  })

  test('the legacy /devices URL redirects into the settings group', async ({ page }) => {
    await page.goto('/devices')

    await expect(page).toHaveURL(/\/settings\/devices$/)
    await expect(page.getByRole('heading', { name: 'Device Management' })).toBeVisible()
  })

  test('the avatar menu opens the settings group on its default section', async ({ page }) => {
    // Start on a different section so the assertion proves the target rather
    // than an already-correct URL.
    await page.goto('/settings/api-keys')
    await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible()

    await page.getByRole('button', { name: 'Open user menu' }).click()
    await page.getByRole('menuitem', { name: /Settings/ }).click()

    await expect(page).toHaveURL(/\/settings\/profile$/)
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible()
  })
})
