import { expect, test, type Page } from '@playwright/test'
import { mockAuthApis, loginViaForm, okEnvelope } from '../utils/auth-helpers.js'

/**
 * Account deletion, end to end.
 *
 * The feature is a destructive confirmation, so the assertions that matter are about what the
 * dialog refuses to do: not closing on a stray Escape, not sending a request while the
 * confirmation is unmet, and not leaking an internal validation message. The one test that does
 * delete runs entirely against a mocked endpoint, so nothing real is ever removed.
 */

const PROFILE_PATH = '/settings/profile'
const EMAIL = 'settings@example.com'

/**
 * Read the two profile fields the danger zone depends on, from the running app.
 *
 * Read-only on purpose. The confirmation branch has to come from the same place production gets it
 * — the app's own bootstrap profile fetch — or a spec that writes the value is asserting its own
 * opinion of the branch rather than the app's. `readAuthStore` in the shared helpers reaches into
 * Pinia the same way for the same reason.
 */
const readStoredProfile = (page: Page) =>
  page.evaluate(() => {
    const el = document.querySelector('#app') as (HTMLElement & { __vue_app__?: unknown }) | null
    const app = el?.__vue_app__ as
      | {
          config: {
            globalProperties: {
              $pinia?: { _s: Map<string, { hasPassword?: boolean; email?: string | null }> }
            }
          }
        }
      | undefined
    const store = app?.config.globalProperties.$pinia?._s.get('auth')
    if (!store) return null
    return { hasPassword: store.hasPassword ?? null, email: store.email ?? null }
  })

interface DeletionHarness {
  /** Raw bodies of every DELETE the page sent, in order. */
  deletes: () => string[]
  /** Make the next DELETE fail with a server error code. */
  failDeleteWith: (code: string) => void
  /** Sign-out requests the page sent. Must always be empty — see the success test. */
  logouts: () => string[]
}

/**
 * Seed the auth mocks, override the profile and email-status endpoints, log in and open the
 * profile page.
 *
 * The profile response is overridden per call because it decides which branch the dialog takes:
 * an account with a password confirms with the password, one without confirms by typing its own
 * email. Both are reachable in production, so both are exercised here.
 */
async function setupProfile(
  page: Page,
  options: { hasPassword: boolean } = { hasPassword: true },
): Promise<DeletionHarness> {
  await mockAuthApis(page)

  const deletes: string[] = []
  const logouts: string[] = []
  let failureCode: string | null = null

  // `mockAuthApis` answers this endpoint with an unconditional 200, so without counting it here a
  // regression that signed the reader out after deleting them — the conventional teardown, and the
  // wrong one, because the account no longer exists — would pass every assertion in this file.
  await page.route('**/api/v1/auth/logout-all', async (route) => {
    logouts.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(okEnvelope(null)),
    })
  })

  // One handler for both verbs: `fallback()` would need the profile route re-registered after
  // this one, and Playwright matches routes in reverse registration order, so branching on the
  // method here keeps the two behaviours visibly in one place.
  await page.route('**/api/v1/users/me', async (route) => {
    if (route.request().method() !== 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          okEnvelope({
            id: 'ada11111-2222-4333-8444-555566660001',
            email: EMAIL,
            displayName: 'Settings User',
            emailVerified: true,
            emailChangePending: false,
            hasPassword: options.hasPassword,
            createdAt: '2026-01-15T10:30:00Z',
            lastLoginAt: '2026-09-17T09:00:00Z',
            termsVersion: '1.0.0',
          }),
        ),
      })
      return
    }

    deletes.push(route.request().postData() ?? '')

    if (failureCode !== null) {
      /*
       * A wrong password is `UnauthorizedException` on the server, so the real status is 401 — not
       * 400. That matters here: 401 runs through the global `handle401Error`, which is the code
       * that signs a reader out. A mock at 400 would skip the very path that could evict someone
       * mid-deletion, which is exactly the failure this test exists to catch.
       *
       * Body shape matches this repo's other specs: `code` at the top level, which is what
       * `getErrorCode` reads for a GlobalExceptionHandler response.
       */
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Refused',
          data: null,
          timestamp: new Date().toISOString(),
          code: failureCode,
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(okEnvelope(null)),
    })
  })

  await page.route('**/api/v1/users/me/email/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        okEnvelope({
          email: EMAIL,
          emailVerified: true,
          emailChangePending: false,
          pendingNewEmail: null,
        }),
      ),
    })
  })

  await loginViaForm(page)
  await page.goto(PROFILE_PATH)
  await expect(page.getByTestId('danger-zone')).toBeVisible()

  /*
   * Wait for the app to populate the profile itself, then check it agrees with what this case is
   * about.
   *
   * `authStore.hasPassword` arrives from the bootstrap profile fetch, which only runs when
   * `initializeAuth()` succeeds — so the refresh token `loginViaForm` leaves behind must survive
   * the navigation. Polling for the value turns a spec that quietly lost its session into a
   * failure that prints the store's real contents, instead of one that asserts a branch the app
   * never took.
   */
  await expect
    .poll(() => readStoredProfile(page), {
      message: 'the app did not populate the auth store from the profile endpoint',
    })
    .toMatchObject({ hasPassword: options.hasPassword, email: EMAIL })

  return {
    deletes: () => deletes,
    failDeleteWith: (code: string) => {
      failureCode = code
    },
    logouts: () => logouts,
  }
}

/** Open the confirmation dialog and wait for it to be on screen. */
const openDialog = async (page: Page): Promise<void> => {
  await page.getByTestId('delete-account-button').click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
}

test.describe('account deletion', () => {
  test('offers deletion last on the page, behind a confirmation', async ({ page }) => {
    // Last matters: a reader scanning for a routine setting must not meet the irreversible one
    // halfway up. Asserted by position rather than by reading the source.
    await setupProfile(page)

    const zoneBox = await page.getByTestId('danger-zone').boundingBox()
    // Measured against the section that used to follow it: the block must sit below every other
    // block on the page, and connected accounts is the last of those. A stale assertion that only
    // compared against the account card passed while the zone sat in the middle of the page.
    const connectedBox = await page.getByRole('heading', { name: 'Connected Accounts' }).boundingBox()

    expect(zoneBox).not.toBeNull()
    expect(connectedBox).not.toBeNull()
    expect(zoneBox!.y).toBeGreaterThan(connectedBox!.y)

    // Nothing is deleted by opening the dialog.
    await expect(page.getByRole('alertdialog')).toBeHidden()
    await openDialog(page)
  })

  test('asks a passwordless account to type its email', async ({ page }) => {
    await setupProfile(page, { hasPassword: false })
    await openDialog(page)

    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByTestId('delete-account-email')).toBeVisible()
    await expect(dialog.getByTestId('delete-account-password')).toHaveCount(0)
  })

  test('asks an account with a password for that password, not a typed email', async ({ page }) => {
    await setupProfile(page, { hasPassword: true })
    await openDialog(page)

    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByTestId('delete-account-password')).toBeVisible()
    await expect(dialog.getByTestId('delete-account-email')).toHaveCount(0)
  })

  test('will not be dismissed by Escape', async ({ page }) => {
    // Every other dialog in the app closes on Escape. This one must not: the reader is one
    // keystroke from an irreversible action, and a dialog that vanishes mid-thought is how
    // people lose track of which confirm button they were aiming at.
    await setupProfile(page)
    await openDialog(page)

    await page.keyboard.press('Escape')

    await expect(page.getByRole('alertdialog')).toBeVisible()
  })

  test('shows a readable message and sends nothing when the confirmation is empty', async ({ page }) => {
    const harness = await setupProfile(page, { hasPassword: false })
    await openDialog(page)
    await page.getByTestId('delete-account-confirm').click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Type your email to confirm')).toBeVisible()

    // The regression this pins: an untouched field used to fail validation with Zod's own wording
    // ("expected string, received undefined"), which is an internal message, not a sentence.
    await expect(dialog).not.toContainText('expected string')

    expect(harness.deletes()).toEqual([])
  })

  test('sends nothing until the typed email matches the account', async ({ page }) => {
    const harness = await setupProfile(page, { hasPassword: false })
    await openDialog(page)

    await page.getByTestId('delete-account-email').fill('not-my-address@example.com')
    await page.getByTestId('delete-account-confirm').click()

    await expect(page.getByRole('alertdialog')).toContainText('That does not match the email on this account')
    expect(harness.deletes()).toEqual([])
  })

  test('deletes on a matching email, with no password in the request', async ({ page }) => {
    const harness = await setupProfile(page, { hasPassword: false })
    await openDialog(page)

    await page.getByTestId('delete-account-email').fill(EMAIL)
    await page.getByTestId('delete-account-confirm').click()

    // The account is gone, so the tab must stop acting as if it still owns a session.
    await page.waitForURL('**/auth/login', { timeout: 10_000 })

    // An empty body is the contract for a passwordless account: the endpoint declares
    // `@Valid @RequestBody`, so omitting the body fails before any password logic runs.
    expect(harness.deletes()).toEqual(['{}'])
    // The account is gone, so a sign-out call could only fail — and it would also be the moment a
    // reader is most likely to be left staring at a spinner.
    expect(harness.logouts()).toEqual([])
  })

  test('keeps the dialog open and reports a wrong password', async ({ page }) => {
    const harness = await setupProfile(page, { hasPassword: true })
    // USER_014 is the mismatch code (`PasswordService` throws it); USER_013 means "a password was
    // required and none was sent", which is a different failure with a different message.
    harness.failDeleteWith('USER_014')
    await openDialog(page)

    await page.getByTestId('delete-account-password').fill('wrong-password')
    await page.getByTestId('delete-account-confirm').click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('That password is incorrect.')
    // Pinned by body, not by count: a dialog that showed the password field but sent `{}` would
    // satisfy a count and fail in production with 403 USER_013. This is what makes the branch
    // selection and the payload answer to the same assertion.
    expect(JSON.parse(harness.deletes()[0] ?? 'null')).toEqual({ password: 'd3JvbmctcGFzc3dvcmQ=' })
  })
})
