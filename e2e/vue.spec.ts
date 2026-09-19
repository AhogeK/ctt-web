import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm } from './utils/auth-helpers.js'

/**
 * Root URL behaviour: `/` is the public landing page.
 *
 * It is reachable signed out (the redirect to login was removed) and it stays
 * put when signed in — a `guestOnly` flag here would bounce authenticated
 * visitors to the dashboard, which is the regression this asserts against.
 * Protected-route behaviour itself is covered by e2e/auth/protected-routes.spec.ts.
 */
test('visits the app root url', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('keeps the root url for an authenticated visitor', async ({ page }) => {
  await mockAuthApis(page)
  await loginViaForm(page)
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.goto('/')

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
