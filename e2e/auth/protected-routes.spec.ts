import { test, expect } from '@playwright/test'
import { loginViaForm, mockAuthApis } from '../utils/auth-helpers.js'

/**
 * Protected route E2E tests.
 *
 * Verifies the `requiresAuth` router guard in `src/router/guard.ts`:
 *
 *   if (to.meta.requiresAuth && !authStore.isAuthenticated) {
 *     return { name: RouteNames.LOGIN, query: { redirect: to.fullPath } }
 *   }
 *
 * Two scenarios per protected route:
 *
 * 1. Unauthenticated: navigating to a protected route must redirect to
 *    `/auth/login?redirect=<original-full-path>`. The `redirect` query is
 *    consumed by LoginView to bounce the user back after successful login.
 *
 * 2. Authenticated: navigating to a protected route must NOT redirect —
 *    the user stays on the requested URL.
 *
 * The actual route paths in the app are:
 *   - Login:       /auth/login
 *   - Dashboard:   /dashboard
 *   - Profile:     /settings/profile
 *   - Devices:     /devices
 *   - Leaderboard: /leaderboard
 *
 * (The task brief uses `/login` as a shorthand for the login page — the
 * test assertions use the real nested path.)
 *
 * Notes:
 * - All API endpoints are mocked via the shared `mockAuthApis(page)` helper
 *   from `e2e/utils/auth-helpers.ts`. Unauthenticated tests need no mocks
 *   (the router guard short-circuits before any API call).
 * - Canonical `TEST_USER` / `TEST_TOKENS` come from `e2e/fixtures/auth.ts`.
 */

test.describe('Protected route redirects (unauthenticated)', () => {
  // Note: Vue Router does NOT percent-encode the `/` in the redirect
  // query value — the actual URL is `?redirect=/dashboard`, not
  // `?redirect=%2Fdashboard`. Match the literal slash.

  test('navigate to /dashboard without login → redirect to /auth/login?redirect=/dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/auth\/login\?redirect=\/dashboard$/)
  })

  test('navigate to /settings/profile without login → redirect to /auth/login?redirect=/settings/profile', async ({
    page,
  }) => {
    await page.goto('/settings/profile')

    await expect(page).toHaveURL(/\/auth\/login\?redirect=\/settings\/profile$/)
  })

  test('navigate to /devices without login → redirect to /auth/login?redirect=/devices', async ({ page }) => {
    await page.goto('/devices')

    await expect(page).toHaveURL(/\/auth\/login\?redirect=\/devices$/)
  })

  test('navigate to /leaderboard without login → redirect to /auth/login?redirect=/leaderboard', async ({ page }) => {
    await page.goto('/leaderboard')

    await expect(page).toHaveURL(/\/auth\/login\?redirect=\/leaderboard$/)
  })
})

test.describe('Protected route access (authenticated)', () => {
  // For the "stay on protected route" tests we go through the full
  // login form so the auth state is established organically (tokens
  // in localStorage, isAuthenticated=true, profile populated). This
  // is the same path a real user would take — we do NOT pre-seed
  // localStorage because the auth guard redirects authenticated users
  // away from /auth/login (`guestOnly` meta) and the login form would
  // never be rendered.

  test.beforeEach(async ({ page }) => {
    await mockAuthApis(page)
  })

  test('login → navigate to /dashboard → stay on /dashboard', async ({ page }) => {
    await loginViaForm(page)

    // We should be on the dashboard after login
    await expect(page).toHaveURL(/\/dashboard$/)

    // Navigate again to prove the guard doesn't kick in for an
    // already-authenticated user.
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('login → navigate to /settings/profile → stay on /settings/profile', async ({ page }) => {
    await loginViaForm(page)

    // Navigate directly to settings profile
    await page.goto('/settings/profile')
    await expect(page).toHaveURL(/\/settings\/profile$/)
  })

  test('login → navigate to /auth/login → redirect to /dashboard (guest guard)', async ({ page }) => {
    await loginViaForm(page)

    // Guest guard: authenticated users visiting /auth/login (guestOnly)
    // are redirected to the dashboard by the router guard.
    await page.goto('/auth/login')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
