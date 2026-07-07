import { expect, type Page } from '@playwright/test'
import { TEST_USER, TEST_TOKENS, TEST_USER_CREDENTIALS } from '../fixtures/auth.js'

/**
 * Shared E2E helpers for authentication-related spec files.
 *
 * These helpers were extracted from `e2e/auth/logout.spec.ts` and
 * `e2e/auth/protected-routes.spec.ts` to eliminate duplicate setup code.
 * They use the canonical `TEST_USER` / `TEST_TOKENS` from
 * `e2e/fixtures/auth.ts` — spec files that need custom user/token
 * data should call `mockAuthApis()` first and then override the
 * specific route they care about.
 *
 * Replaces per-test `page.route()` mocks. MSW browser workers
 * (`e2e/mocks/handlers/auth.ts`) are the project's infrastructure
 * for future shared mocking; these helpers remain the single-entry
 * API for spec files.
 */

// ==========================================
// Constants
// ==========================================

/** localStorage keys used by the Pinia auth store's `useStorage` layer. */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ctt_access_token',
  REFRESH_TOKEN: 'ctt_refresh_token',
  USER_ID: 'ctt_user_id',
} as const

/** Timeout for `page.waitForURL` after the login form submits. */
export const LOGIN_REDIRECT_TIMEOUT_MS = 10_000

// ==========================================
// Envelope Helpers
// ==========================================

/** Current time as an ISO-8601 string. */
export const nowIso = (): string => new Date().toISOString()

/**
 * Build a successful `RestApiResponse<T>` envelope.
 *
 * Matches the server's envelope shape consumed by
 * `src/lib/schemas/api.schema.ts` so Zod parsers accept the mock
 * response without modification.
 */
export const okEnvelope = (data: unknown) => ({
  success: true,
  message: 'Success',
  data,
  timestamp: nowIso(),
})

// ==========================================
// Mock Setup
// ==========================================

/**
 * Install minimal API mocks required to log in and reach the dashboard.
 *
 * Mocks:
 * - `GET /api/v1/config/public` — disables hCaptcha so the login form
 *   submits without the widget.
 * - `POST /api/v1/auth/login` — returns canned `TEST_TOKENS`.
 * - `POST /api/v1/auth/refresh` — returns refreshed tokens (called by
 *   `initializeAuth()` on app boot; must succeed for seeded-token
 *   sessions to remain authenticated).
 * - `GET /api/v1/users/me` — returns canned `TEST_USER` (called by
 *   `authStore.fetchUserProfile()` after a successful login).
 * - `POST /api/v1/auth/logout-all` — always succeeds so local state
 *   can be cleared.
 *
 * Spec files that need custom user/token data should call this first
 * and then override the specific route with their own `page.route()`
 * (Playwright uses the last registered handler for a given URL).
 */
export async function mockAuthApis(page: Page): Promise<void> {
  // Public config — disables captcha so the form submits without hCaptcha
  await page.route('**/api/v1/config/public', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(okEnvelope({ termsVersion: '1', captchaSiteKey: null })),
    })
  })

  // Login — succeed with canned tokens
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(okEnvelope(TEST_TOKENS)),
    })
  })

  // Refresh — return refreshed tokens so initializeAuth() succeeds
  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        okEnvelope({
          accessToken: 'mock-access-token-refreshed',
          refreshToken: 'mock-refresh-token-refreshed',
          expiresIn: TEST_TOKENS.expiresIn,
          termsExpired: false,
        }),
      ),
    })
  })

  // User profile — return the canonical test user (called by
  // authStore.fetchUserProfile after login)
  await page.route('**/api/v1/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        okEnvelope({
          id: TEST_USER.id,
          email: TEST_USER.email,
          displayName: TEST_USER.displayName,
          emailVerified: TEST_USER.emailVerified,
          emailChangePending: false,
          hasPassword: TEST_USER.hasPassword,
          createdAt: nowIso(),
          lastLoginAt: nowIso(),
          termsVersion: TEST_USER.termsVersion,
        }),
      ),
    })
  })

  // Logout-all — always succeed so local state can be cleared
  await page.route('**/api/v1/auth/logout-all', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(okEnvelope(null)),
    })
  })
}

// ==========================================
// Form Drivers
// ==========================================

/**
 * Drive the login form with the canonical test user and wait until the
 * app redirects to the dashboard.
 *
 * Assumes `mockAuthApis(page)` has been called in `beforeEach`.
 */
export async function loginViaForm(page: Page): Promise<void> {
  await page.goto('/auth/login')
  await expect(page).toHaveURL(/\/auth\/login(?:\?.*)?$/)

  await page.getByPlaceholder('you@example.com').fill(TEST_USER.email)
  await page.getByPlaceholder('Enter your password').fill(TEST_USER_CREDENTIALS.password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.waitForURL('**/dashboard', { timeout: LOGIN_REDIRECT_TIMEOUT_MS })
}

/**
 * Open the avatar dropdown and click the Logout item.
 *
 * The avatar trigger exposes `aria-label="Open user menu"`. The dropdown
 * item text switches between "Logout" and "Logging out..." while the
 * logout request is in flight, so we match the stable idle label.
 */
export async function clickLogout(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open user menu' }).click()
  await page.getByRole('menuitem', { name: 'Logout' }).click()
}

// ==========================================
// Store Reader
// ==========================================

/**
 * Read the live Pinia auth store from the running Vue app.
 *
 * Returns the store object so callers can inspect any of its reactive
 * properties (accessToken, refreshToken, isAuthenticated, …).
 *
 * Falls back to `null` if the internal Pinia API is not reachable
 * (e.g. across Vue version changes) — callers must handle the null case.
 */
export async function readAuthStore(page: Page): Promise<{
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
} | null> {
  return page.evaluate(() => {
    const appEl = document.querySelector('#app') as (HTMLElement & { __vue_app__?: unknown }) | null
    const app = appEl?.__vue_app__ as
      | {
          config: {
            globalProperties: {
              $pinia?: {
                _s: Map<
                  string,
                  {
                    isAuthenticated: boolean
                    accessToken: string | null
                    refreshToken: string | null
                    userId: string | null
                  }
                >
              }
            }
          }
        }
      | undefined
    const store = app?.config.globalProperties.$pinia?._s.get('auth')
    if (!store) return null
    return {
      isAuthenticated: store.isAuthenticated,
      accessToken: store.accessToken,
      refreshToken: store.refreshToken,
      userId: store.userId,
    }
  })
}
