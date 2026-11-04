import { test, expect, type Page } from '@playwright/test'
import { TEST_USER_CREDENTIALS } from '../fixtures/auth.js'
import {
  LOGIN_CHALLENGE_RESPONSE,
  LOGIN_TWO_FACTOR_INVALID_CODE_RESPONSE,
  LOGIN_TWO_FACTOR_SUCCESS_RESPONSE,
} from '../mocks/handlers/auth.js'
import { mockAuthApis, nowIso, STORAGE_KEYS } from '../utils/auth-helpers.js'

/**
 * E2E tests for the two-step login.
 *
 * The password step answers `202` with a challenge instead of a session, so the
 * browser has to reach a second screen and only then hold tokens. The mocks
 * mirror that split exactly: `/auth/login` never returns tokens here, and
 * `/auth/login/2fa` accepts one code and refuses every other one.
 */

const LOGIN_PATH = '/auth/login'
const TWO_FACTOR_PATH = '/auth/login/2fa'
const DASHBOARD_PATH = '/dashboard'

const VALID_CODE = '123456'
const INVALID_CODE = '000000'

async function installTwoFactorOverrides(page: Page): Promise<void> {
  await mockAuthApis(page)

  // A stale session must not masquerade as signed in while the password step runs.
  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: 'Unauthorized',
        code: 'AUTH_003',
        timestamp: nowIso(),
      }),
    }),
  )

  // The password alone is never enough for this account.
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify(LOGIN_CHALLENGE_RESPONSE),
    }),
  )

  await page.route('**/api/v1/auth/login/2fa', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}') as { code?: string }

    if (body.code === VALID_CODE) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(LOGIN_TWO_FACTOR_SUCCESS_RESPONSE),
      })
      return
    }

    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify(LOGIN_TWO_FACTOR_INVALID_CODE_RESPONSE),
    })
  })
}

/** Drives the password form and stops on the second step. */
async function submitPassword(page: Page): Promise<void> {
  await page.goto(LOGIN_PATH)
  await page.getByPlaceholder('you@example.com').fill(TEST_USER_CREDENTIALS.email)
  await page.getByPlaceholder('Enter your password').fill(TEST_USER_CREDENTIALS.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(TWO_FACTOR_PATH)
}

/**
 * Records the sign-in surface's height on every frame, starting before the swap.
 *
 * `.auth-card__inner` is the element that carries the background, the shadow and the contents; the
 * card around it only frames it, so sampling the card would miss a surface that snapped inside a
 * smoothly animated frame.
 */
async function armSurfaceSampler(page: Page): Promise<void> {
  await page.evaluate(() => {
    const frames: number[] = []
    ;(window as unknown as { __surfaceHeights: number[] }).__surfaceHeights = frames
    const tick = () => {
      const surface = document.querySelector('.auth-card__inner')
      frames.push(surface ? Math.round(surface.getBoundingClientRect().height) : -1)
      if (frames.length < 200) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

/**
 * Reads the recorded heights once the surface has stopped changing.
 *
 * The swap itself is what is being measured, so the wait is on the recording: ten consecutive equal
 * frames means the transition (or the reduced-motion snap) has finished, whatever the clock says.
 */
async function settledSurfaceHeights(page: Page): Promise<number[]> {
  await expect
    .poll(
      async () => {
        const heights = await page.evaluate(
          () => (window as unknown as { __surfaceHeights?: number[] }).__surfaceHeights ?? [],
        )
        const tail = heights.slice(-10)
        return tail.length === 10 && new Set(tail).size === 1
      },
      { timeout: 5000 },
    )
    .toBe(true)

  return page.evaluate(() => (window as unknown as { __surfaceHeights?: number[] }).__surfaceHeights ?? [])
}

/**
 * The same password step, but the account has a passkey that could answer the challenge.
 *
 * The ceremony is stubbed to reject like a dismissed prompt: the reader is choosing another method,
 * which must not be reported as a failure — or as an empty code field.
 */
async function installPasskeyChallenge(page: Page): Promise<void> {
  await installTwoFactorOverrides(page)
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        ...LOGIN_CHALLENGE_RESPONSE,
        data: { ...(LOGIN_CHALLENGE_RESPONSE as { data: object }).data, passkeyCount: 1 },
      }),
    }),
  )
  // A well-formed challenge, so the attempt reaches the browser rather than failing on the wire.
  await page.route('**/api/v1/auth/2fa/passkey/options', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          publicKey: {
            challenge: 'Y2hhbGxlbmdl',
            rpId: 'localhost',
            timeout: 60000,
            userVerification: 'required',
            allowCredentials: [{ type: 'public-key', id: 'Y3JlZA', transports: ['internal'] }],
          },
        },
        timestamp: nowIso(),
      }),
    }),
  )
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { get: () => Promise.reject(new DOMException('cancelled', 'NotAllowedError')) },
    })
  })
}

test.describe('Two-factor login', () => {
  test('moves to the second step without signing anyone in', async ({ page }) => {
    await installTwoFactorOverrides(page)
    await submitPassword(page)

    await expect(page.getByRole('heading', { name: 'Two-factor authentication' })).toBeVisible()
    await expect(page.getByPlaceholder('123456 or a recovery code')).toBeVisible()

    // A challenge is not a session: nothing may be stored before the code is accepted.
    const storedToken = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.ACCESS_TOKEN)
    expect(storedToken).toBeNull()
  })

  test('does not accuse the reader of an empty code when they switch to the passkey', async ({ page }) => {
    await installPasskeyChallenge(page)
    await submitPassword(page)

    const field = page.getByPlaceholder('123456 or a recovery code')
    await field.click()
    await page.getByTestId('two-factor-passkey').click()

    // Wait for the attempt to settle: the accusation only appears once the ceremony has answered.
    await expect(page.getByTestId('two-factor-passkey')).toBeEnabled()

    // Choosing another method is not a failed entry: the field stays quiet, and the step stays put.
    await expect(page.locator('[data-slot="form-message"]')).toHaveCount(0)
    // The click still has to answer: a button that appears to do nothing reads as broken.
    await expect(page.getByTestId('two-factor-passkey-note').or(page.getByRole('alert'))).toBeVisible()
    await expect(page).toHaveURL(TWO_FACTOR_PATH)
    await expect(field).toBeVisible()
  })

  test('rejects a wrong code in place and accepts the right one', async ({ page }) => {
    await installTwoFactorOverrides(page)
    await submitPassword(page)

    await page.getByPlaceholder('123456 or a recovery code').fill(INVALID_CODE)
    await page.getByRole('button', { name: 'Verify' }).click()

    // Still on the step, with the reason beside the field instead of a page change.
    await expect(page.locator('[data-slot="form-message"]').first()).toBeVisible()
    await expect(page).toHaveURL(TWO_FACTOR_PATH)

    await page.getByPlaceholder('123456 or a recovery code').fill(VALID_CODE)
    await page.getByRole('button', { name: 'Verify' }).click()

    await page.waitForURL(DASHBOARD_PATH)
    await expect(page).toHaveURL(DASHBOARD_PATH)

    const storedToken = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.ACCESS_TOKEN)
    expect(storedToken).not.toBeNull()
  })

  test('eases the sign-in surface between the two steps instead of letting it jump', async ({ page }) => {
    await installTwoFactorOverrides(page)

    // Arm the sampler between filling the form and submitting it, so it covers the whole swap.
    await page.goto(LOGIN_PATH)
    await page.getByPlaceholder('you@example.com').fill(TEST_USER_CREDENTIALS.email)
    await page.getByPlaceholder('Enter your password').fill(TEST_USER_CREDENTIALS.password)
    await armSurfaceSampler(page)

    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(TWO_FACTOR_PATH)
    const heights = await settledSurfaceHeights(page)
    const distinct = [...new Set(heights.filter((height) => height > 0))]

    // The surface never leaves the screen...
    expect(heights.every((height) => height > 0)).toBe(true)
    // ...and it changes size over several frames instead of snapping between two.
    expect(distinct.length).toBeGreaterThan(3)
    // It starts at the password step's height and ends at the code step's.
    expect(distinct[0]).toBe(Math.max(...distinct))
    expect(distinct.at(-1)).toBe(Math.min(...distinct))
  })

  test('keeps the swap instant when motion is reduced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await installTwoFactorOverrides(page)

    await page.goto(LOGIN_PATH)
    await page.getByPlaceholder('you@example.com').fill(TEST_USER_CREDENTIALS.email)
    await page.getByPlaceholder('Enter your password').fill(TEST_USER_CREDENTIALS.password)
    await armSurfaceSampler(page)

    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(TWO_FACTOR_PATH)
    const heights = await settledSurfaceHeights(page)
    const distinct = [...new Set(heights.filter((height) => height > 0))]

    // A reader who asked for less motion gets the new size in one step, not a 200ms slide.
    expect(distinct).toHaveLength(2)
  })

  test('asks for the code in the interface language when nothing was typed', async ({ page }) => {
    await installTwoFactorOverrides(page)
    await submitPassword(page)

    // Submit untouched: the field is empty, and the reason has to be a sentence, not Zod's
    // description of the value it received.
    await page.getByRole('button', { name: 'Verify' }).click()
    const message = page.locator('[data-slot="form-message"]').first()
    await expect(message).toHaveText('Enter your verification code')
  })

  test('says the same thing in Chinese', async ({ page }) => {
    await installTwoFactorOverrides(page)
    await submitPassword(page)

    // Switch language on the step itself: the message is resolved when it is shown, not when the
    // form was built.
    await page.getByTestId('language-menu').click()
    await page.getByRole('menuitemradio', { name: '简体中文' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')

    await page.getByRole('button', { name: '验证' }).click()
    const message = page.locator('[data-slot="form-message"]').first()
    await expect(message).toHaveText('请输入验证码')
    await expect(message).not.toContainText('Invalid input')
  })

  test('sends a direct visitor back to sign-in', async ({ page }) => {
    await installTwoFactorOverrides(page)

    await page.goto(TWO_FACTOR_PATH)
    await page.waitForURL(LOGIN_PATH)

    await expect(page).toHaveURL(LOGIN_PATH)
  })
})
