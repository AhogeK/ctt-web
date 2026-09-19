import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm } from '../utils/auth-helpers.js'

/**
 * Landing page E2E.
 *
 * The page's contract in this stage: `/` renders without a session, and the
 * top-bar call to action points at the destination that matches the visitor's
 * state — registration when signed out, the dashboard when signed in.
 */
test.describe('Landing page', () => {
  test('renders for an unauthenticated visitor without redirecting', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByTestId('marketing-cta')).toHaveAttribute('href', '/auth/login')
  })

  test('leads with the product and keeps the account entry in the top bar', async ({ page }) => {
    await page.goto('/')

    // Two distinct roles: the hero sells the product (the IDE plugin — the thing
    // the data comes from), while the top bar answers "I already have an
    // account". Neither routes to registration: that page carries no OAuth
    // provider, so GitHub users would hit a dead end there; they reach signup
    // through the login page's "Create account" link.
    await expect(page.getByTestId('landing-primary-cta')).toHaveAttribute(
      'href',
      'https://plugins.jetbrains.com/plugin/29379',
    )
    await expect(page.getByTestId('marketing-cta')).toHaveAttribute('href', '/auth/login')
    await expect(page.locator('a[href="/auth/register"]')).toHaveCount(0)
  })

  test('points an authenticated visitor at the dashboard', async ({ page }) => {
    await mockAuthApis(page)
    await loginViaForm(page)

    await page.goto('/')

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('marketing-cta')).toHaveAttribute('href', '/dashboard')
    // One entry only: the sign-in affordance is the same control, relabelled.
    await expect(page.getByTestId('marketing-cta')).toHaveCount(1)
  })
})
