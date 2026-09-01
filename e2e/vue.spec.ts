import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm } from './utils/auth-helpers.js'

test('visits the app root url', async ({ page }) => {
  // `/` is a requiresAuth route: an unauthenticated visit redirects to the
  // login page (covered by e2e/auth/protected-routes.spec.ts). Log in first,
  // then assert the root renders its Home view.
  await mockAuthApis(page)
  await loginViaForm(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
})
