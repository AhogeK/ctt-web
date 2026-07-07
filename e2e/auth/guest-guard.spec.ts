import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm } from '../utils/auth-helpers.js'

/**
 * Guest guard E2E tests.
 *
 * Verifies the `guestOnly` meta branch in `src/router/guard.ts`:
 *
 *   if (to.meta.guestOnly && authStore.isAuthenticated) {
 *     return { name: RouteNames.DASHBOARD }
 *   }
 *
 * Auth routes (`/auth/login`, `/auth/register`, …) carry `guestOnly: true`
 * (see `src/router/modules/auth.ts`). When an already-authenticated user
 * tries to visit one of these routes — e.g. by following a stale bookmark
 * or hitting the back button after login — they must be redirected to
 * `/dashboard` instead of seeing the auth form again.
 *
 * Mocks are layered via the shared `mockAuthApis(page)` helper from
 * `e2e/utils/auth-helpers.ts` — it installs page.route() handlers for
 * `/api/v1/config/public`, `/api/v1/auth/login`, `/api/v1/auth/refresh`,
 * `/api/v1/users/me` and `/api/v1/auth/logout-all` so the login form
 * can complete and the resulting auth state is indistinguishable from a
 * real session.
 */

test.describe('Guest guard redirects (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApis(page)
  })

  test('login → navigate to /auth/login → redirect to /dashboard', async ({ page }) => {
    await loginViaForm(page)

    await page.goto('/auth/login')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('login → navigate to /auth/register → redirect to /dashboard', async ({ page }) => {
    await loginViaForm(page)

    await page.goto('/auth/register')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
