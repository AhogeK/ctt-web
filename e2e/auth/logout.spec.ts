import { test, expect } from '@playwright/test'
import {
  STORAGE_KEYS,
  LOGIN_REDIRECT_TIMEOUT_MS,
  clickLogout,
  loginViaForm,
  mockAuthApis,
  readAuthStore,
} from '../utils/auth-helpers.js'
import { TEST_TOKENS } from '../fixtures/auth.js'

/**
 * Logout flow E2E tests.
 *
 * Verifies the full logout lifecycle:
 * 1. User logs in via the login form
 * 2. User clicks the Logout menu item in the avatar dropdown
 * 3. After logout:
 *    - The app redirects to /auth/login
 *    - All auth tokens are cleared from localStorage
 *    - The auth store reflects unauthenticated state
 *
 * Notes:
 * - The actual route is `/auth/login` (RouteNames.LOGIN is nested under the
 *   auth layout). The redirect query param preserves the originally requested
 *   full path (e.g. `/auth/login?redirect=/dashboard`).
 * - All API endpoints are mocked via the shared `mockAuthApis(page)` helper
 *   from `e2e/utils/auth-helpers.ts` so the tests are fully self-contained —
 *   no real ctt-server backend required. The same `page.route()` pattern
 *   uses Playwright's `page.route()` for API mocking.
 * - The Pinia store is read directly from the running Vue app via
 *   `readAuthStore()` to verify the `isAuthenticated` computed without
 *   depending on the `useStorage` layer.
 * - Canonical `TEST_TOKENS` / `TEST_USER` come from `e2e/fixtures/auth.ts`.
 */

test.describe('Logout flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApis(page)
  })

  test('login → click logout → redirect to /auth/login', async ({ page }) => {
    await loginViaForm(page)

    // Sanity: dashboard actually loaded
    await expect(page).toHaveURL(/\/dashboard$/)

    await clickLogout(page)

    // After logout the auth store navigates to RouteNames.LOGIN
    await page.waitForURL('**/auth/login', { timeout: LOGIN_REDIRECT_TIMEOUT_MS })
    await expect(page).toHaveURL(/\/auth\/login(?:\?.*)?$/)
  })

  test('login → click logout → clears localStorage tokens', async ({ page }) => {
    await loginViaForm(page)

    // Pre-condition: tokens are present after login
    await expect
      .poll(async () => page.evaluate((k) => localStorage.getItem(k), STORAGE_KEYS.ACCESS_TOKEN))
      .toBe(TEST_TOKENS.accessToken)
    await expect
      .poll(async () => page.evaluate((k) => localStorage.getItem(k), STORAGE_KEYS.REFRESH_TOKEN))
      .toBe(TEST_TOKENS.refreshToken)

    await clickLogout(page)
    await page.waitForURL('**/auth/login', { timeout: 10_000 })

    // All auth-related keys must be cleared. The `useStorage` helper
    // removes the key entirely (vs. setting it to the string "null"),
    // so we assert on absence.
    for (const key of Object.values(STORAGE_KEYS)) {
      const value = await page.evaluate((k) => localStorage.getItem(k), key)
      expect(value, `localStorage[${key}] should be cleared after logout`).toBeNull()
    }
  })

  test('login → click logout → useAuthStore().isAuthenticated is false', async ({ page }) => {
    await loginViaForm(page)

    // Pre-condition: store reports authenticated via the live Pinia store
    const storeBefore = await readAuthStore(page)
    expect(storeBefore, 'auth store should be reachable from the running app').not.toBeNull()
    expect(storeBefore!.isAuthenticated, 'isAuthenticated should be true after login').toBe(true)
    expect(storeBefore!.accessToken).toBe(TEST_TOKENS.accessToken)

    await clickLogout(page)
    await page.waitForURL('**/auth/login', { timeout: 10_000 })

    // After logout the auth store must report unauthenticated.
    // The Pinia store reactive state reflects the same `useStorage`-backed
    // ref cleared by `authStore.clearAuth()` in the logout handler.
    const storeAfter = await readAuthStore(page)
    expect(storeAfter, 'auth store should still be reachable after logout').not.toBeNull()
    expect(storeAfter!.isAuthenticated, 'isAuthenticated should be false after logout').toBe(false)
    expect(storeAfter!.accessToken, 'accessToken should be cleared').toBeNull()
    expect(storeAfter!.refreshToken, 'refreshToken should be cleared').toBeNull()
    expect(storeAfter!.userId, 'userId should be cleared').toBeNull()

    // And localStorage is cleared (defense in depth — the Pinia assertion
    // above already guarantees the store state, this confirms the
    // persistence layer matches).
    for (const key of Object.values(STORAGE_KEYS)) {
      const value = await page.evaluate((k) => localStorage.getItem(k), key)
      expect(value, `localStorage[${key}] should be cleared after logout`).toBeNull()
    }
  })
})
