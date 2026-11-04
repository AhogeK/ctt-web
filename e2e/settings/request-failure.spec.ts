import { expect, test } from '@playwright/test'
import { loginViaForm, mockAuthApis, okEnvelope } from '../utils/auth-helpers.js'

/**
 * The last-resort answers for a request that fails without a code.
 *
 * Two layers, both covered here because they are the places a failure can escape silently: a
 * mutation whose call site has no handler, and a promise nobody awaited. The assertion is the same
 * for both — one visible message, not zero and not two.
 */
test.describe('unknown request failures', () => {
  test('a handled failure stays one message, not two', async ({ page }) => {
    await page.addInitScript(() => globalThis.localStorage.setItem('ctt.locale', 'en'))
    await mockAuthApis(page)
    await page.route('**/api/v1/users/me/email/status', (route) =>
      route.fulfill({
        json: okEnvelope({
          email: 'test@example.com',
          emailVerified: true,
          emailChangePending: false,
          pendingNewEmail: null,
        }),
      }),
    )
    // A 500 carries no code, so the dialog has nothing to map onto a field and would stay silent.
    await page.route('**/api/v1/users/me/password/change', (route) =>
      route.fulfill({ status: 500, json: { error: 'Internal Server Error' } }),
    )

    await page.goto('/settings/profile')
    await loginViaForm(page)
    await page.goto('/settings/profile')
    const trigger = page.getByRole('button', { name: 'Change Password' })
    await expect(trigger).toBeVisible()
    await trigger.click()

    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder('Enter your current password').fill('SecurePass1!')
    await dialog.getByPlaceholder('8-64 characters, printable ASCII only').fill('NewSecurePass1!')
    await dialog.getByPlaceholder('Re-enter your password').fill('NewSecurePass1!')
    await dialog.getByRole('button', { name: 'Change Password' }).click()

    // The mutation owns this sentence; the fallback must not add a second, generic one.
    await expect
      .poll(async () => page.locator('[data-sonner-toast]').allTextContents(), { timeout: 8000 })
      .toHaveLength(1)
    const [toast] = await page.locator('[data-sonner-toast]').allTextContents()
    expect(toast).toContain('Failed to change password')
  })

  test('a promise nobody awaited is not silence either', async ({ page }) => {
    await page.addInitScript(() => globalThis.localStorage.setItem('ctt.locale', 'en'))
    await mockAuthApis(page)
    await page.goto('/settings/profile')
    await loginViaForm(page)
    await page.goto('/settings/profile')
    // The listener is installed when the app boots; rejecting before that is not the case under test.
    await expect(page.getByRole('button', { name: 'Change Email' })).toBeVisible()

    await page.evaluate(() => {
      void Promise.reject({ statusCode: 500, statusMessage: 'Server Error' })
    })

    await expect(page.locator('[data-sonner-toast]')).toHaveCount(1)
  })
})
