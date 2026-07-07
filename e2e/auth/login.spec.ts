import { test, expect, type Page, type Request } from '@playwright/test'
import { INVALID_CREDENTIALS, TEST_TOKENS, TEST_USER_CREDENTIALS } from '../fixtures/auth.js'
import { readAuthStore, mockAuthApis, nowIso, okEnvelope } from '../utils/auth-helpers.js'

/**
 * E2E tests for the complete login flow.
 *
 * Mocks are layered:
 *
 * 1. **Shared `mockAuthApis(page)`** from `e2e/utils/auth-helpers.ts`
 *    installs the canonical auth-API mocks (config/public, login, refresh,
 *    users/me, logout-all) using the canonical `TEST_USER` / `TEST_TOKENS`
 *    from `e2e/fixtures/auth.ts`.
 *
 * 2. **`installLoginOverrides(page)`** (local to this spec) wires the
 *    two customisations the login flow needs on top of the defaults:
 *    - `/api/v1/auth/refresh` is forced to 401 so the startup
 *      `initializeAuth()` call cannot resurrect a stale session.
 *    - `/api/v1/auth/login` discriminates on `email`: the canonical
 *      `INVALID_CREDENTIALS.email` returns 401 AUTH_001, every other
 *      payload returns the canned `okEnvelope(TEST_TOKENS)` response.
 *
 * 3. **Request counting** uses `page.on('request')` so we can assert
 *    that the form did or did not submit, without re-routing the auth
 *    endpoints (which would override `mockAuthApis`).
 *
 * Note: The login API encodes the password as base64 before sending, so the
 * mock discriminates on `email` rather than `password` to trigger the error path.
 *
 * Note: The auth store calls `fetchUserProfile()` after a successful login, which
 * hits `/api/v1/users/me`. That endpoint is mocked by `mockAuthApis` so the
 * global 401 interceptor does not clear auth state and redirect away from
 * the dashboard.
 */

const LOGIN_PATH = '/auth/login'
const DASHBOARD_PATH = '/dashboard'

/**
 * Install the `mockAuthApis` defaults + login-flow overrides and a
 * request counter. Returns the call counters so tests can assert that
 * the form did or did not submit.
 */
async function installLoginOverrides(page: Page): Promise<{
  getLoginCalls: () => number
  getUserProfileCalls: () => number
}> {
  await mockAuthApis(page)

  let loginCalls = 0
  let userProfileCalls = 0

  // Override refresh — `mockAuthApis` returns 200, but the login flow
  // wants 401 so `initializeAuth()` cannot resurrect a stale session.
  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: 'Unauthorized',
        code: 'AUTH_003',
        timestamp: nowIso(),
      }),
    })
  })

  // Override login — `mockAuthApis` always returns 200, but we want
  // AUTH_001 for the canonical invalid-credentials email.
  await page.route('**/api/v1/auth/login', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}') as {
      email?: string
    }
    if (body.email === INVALID_CREDENTIALS.email) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Invalid email or password',
          data: null,
          timestamp: nowIso(),
          code: 'AUTH_001',
        }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(okEnvelope(TEST_TOKENS)),
    })
  })

  // Count requests to auth endpoints by listening on the page's network
  // events. We do NOT re-route these endpoints because the request counter
  // is sufficient to track call frequency.
  const onRequest = (request: Request) => {
    if (request.url().includes('/api/v1/auth/login')) {
      loginCalls += 1
    } else if (request.url().includes('/api/v1/users/me')) {
      userProfileCalls += 1
    }
  }
  page.on('request', onRequest)

  return {
    getLoginCalls: () => loginCalls,
    getUserProfileCalls: () => userProfileCalls,
  }
}

test.describe('Login flow', () => {
  test('completes login with valid credentials and redirects to dashboard', async ({ page }) => {
    const { getLoginCalls, getUserProfileCalls } = await installLoginOverrides(page)

    await page.goto(LOGIN_PATH)

    await page.getByPlaceholder('you@example.com').fill(TEST_USER_CREDENTIALS.email)
    await page.getByPlaceholder('Enter your password').fill(TEST_USER_CREDENTIALS.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Redirect to dashboard
    await page.waitForURL(DASHBOARD_PATH)
    await expect(page).toHaveURL(DASHBOARD_PATH)

    // Login API was called exactly once
    expect(getLoginCalls()).toBe(1)
    // User profile was fetched (auth store calls fetchUserProfile after login)
    expect(getUserProfileCalls()).toBe(1)

    // Verify the auth store is authenticated by reading the Pinia store
    // from the running Vue app. readAuthStore returns null if the internal
    // Pinia API is not reachable (e.g. across Vue version changes).
    const authState = await readAuthStore(page)
    expect(authState).not.toBeNull()
    expect(authState!.isAuthenticated).toBe(true)
  })

  test('shows error message and stays on login with invalid credentials', async ({ page }) => {
    const { getLoginCalls } = await installLoginOverrides(page)

    await page.goto(LOGIN_PATH)

    await page.getByPlaceholder('you@example.com').fill(INVALID_CREDENTIALS.email)
    await page.getByPlaceholder('Enter your password').fill(INVALID_CREDENTIALS.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Inline field error from AUTH_001 — mapped via mapApiErrorCode().
    // Note: the global API 401 interceptor may also trigger a redirect to
    // the login page with a `redirect` query param, so we check the pathname
    // rather than the full URL.
    await expect(page.getByText('Invalid email or password. Please check your credentials.')).toBeVisible()
    await expect.poll(() => new URL(page.url()).pathname).toBe(LOGIN_PATH)

    // Login API was called once (the form did submit)
    expect(getLoginCalls()).toBe(1)
  })

  test('shows validation errors and does not submit when fields are empty', async ({ page }) => {
    const { getLoginCalls } = await installLoginOverrides(page)

    await page.goto(LOGIN_PATH)

    await page.getByRole('button', { name: 'Sign in' }).click()

    // Vee-Validate + Zod produce field-level messages. We assert via
    // data-slot attribute used by the shadcn-vue FormMessage component.
    await expect(page.locator('[data-slot="form-message"]').first()).toBeVisible()

    // Still on the login page
    await expect(page).toHaveURL(new RegExp(`${LOGIN_PATH.replace(/\//g, '\\/')}(\\?.*)?$`))

    // Form was NOT submitted — no login API call was made
    expect(getLoginCalls()).toBe(0)
  })

  test('shows toast error and stays on login when API returns 429 rate limit', async ({ page }) => {
    const { getLoginCalls } = await installLoginOverrides(page)

    // LoginView.onError catches statusCode===429 and calls
    // toast.error(mapApiErrorCode('rate_limit_exceeded')). Re-route the
    // login endpoint to return 429 regardless of payload.
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Too many requests',
          data: null,
          timestamp: nowIso(),
          code: 'RATE_LIMIT_001',
        }),
      })
    })

    await page.goto(LOGIN_PATH)

    await page.getByPlaceholder('you@example.com').fill(TEST_USER_CREDENTIALS.email)
    await page.getByPlaceholder('Enter your password').fill(TEST_USER_CREDENTIALS.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Too many requests. Please wait a moment before trying again.')).toBeVisible()
    await expect.poll(() => new URL(page.url()).pathname).toBe(LOGIN_PATH)
    expect(getLoginCalls()).toBe(1)
  })

  test('shows generic login failed toast when the network drops the request', async ({ page }) => {
    const { getLoginCalls } = await installLoginOverrides(page)

    // Aborting at the CDP layer simulates a network drop — ofetch throws
    // without a statusCode, so LoginView hits the !isApiError branch.
    await page.route('**/api/v1/auth/login', (route) => route.abort('failed'))

    await page.goto(LOGIN_PATH)

    await page.getByPlaceholder('you@example.com').fill(TEST_USER_CREDENTIALS.email)
    await page.getByPlaceholder('Enter your password').fill(TEST_USER_CREDENTIALS.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Login failed')).toBeVisible()
    await expect(page.getByText('An unexpected error occurred')).toBeVisible()
    await expect.poll(() => new URL(page.url()).pathname).toBe(LOGIN_PATH)
    expect(getLoginCalls()).toBe(1)
  })

  test('opens TermsDialog when login response has termsExpired=true', async ({ page }) => {
    const { getLoginCalls } = await installLoginOverrides(page)

    // authStore.login dispatches `api:terms-expired` when the response
    // has termsExpired=true; App.vue listens and opens TermsDialog.
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          okEnvelope({
            ...TEST_TOKENS,
            termsExpired: true,
          }),
        ),
      })
    })

    await page.goto(LOGIN_PATH)

    await page.getByPlaceholder('you@example.com').fill(TEST_USER_CREDENTIALS.email)
    await page.getByPlaceholder('Enter your password').fill(TEST_USER_CREDENTIALS.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByRole('dialog', { name: /Terms of Service/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible()
    expect(getLoginCalls()).toBe(1)
  })
})
