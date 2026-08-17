import { test, expect } from '@playwright/test'
import { setupApiKeysPage, fulfillError } from './helpers.js'
import {
  TEST_ACTIVE_KEY,
  TEST_EXPIRED_KEY,
  TEST_REVOKED_KEY,
  TEST_KEYS,
  AUTH_023_BODY,
  AUTH_010_BODY,
} from './fixtures.js'

test.describe('API key permanent delete flow', () => {
  test('deletes a REVOKED key after confirmation and the row disappears', async ({ page }) => {
    await setupApiKeysPage(page, TEST_KEYS)

    // Only the REVOKED row exposes a Delete button (ACTIVE row shows Revoke instead).
    const revokedRow = page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_REVOKED_KEY.name })
    const activeRow = page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_ACTIVE_KEY.name })
    await expect(activeRow.getByRole('button', { name: `Delete ${TEST_ACTIVE_KEY.name}` })).toHaveCount(0)
    await expect(revokedRow.getByRole('button', { name: `Delete ${TEST_REVOKED_KEY.name}` })).toHaveCount(1)

    await revokedRow
      .getByRole('button', { name: `Delete ${TEST_REVOKED_KEY.name}` })
      .evaluate((el) => (el as HTMLElement).click())

    // Confirmation dialog warns about permanence and shows the key identity.
    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog).toBeVisible()
    await expect(confirmDialog).toContainText(TEST_REVOKED_KEY.name)
    await expect(confirmDialog).toContainText(TEST_REVOKED_KEY.keyPrefix)
    await expect(confirmDialog).toContainText('cannot be recovered')

    await confirmDialog.getByRole('button', { name: 'Delete permanently' }).click()

    // Success toast + list refresh removes the row entirely.
    await expect(page.getByText('API Key deleted')).toBeVisible()
    await expect(
      page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_REVOKED_KEY.name }),
    ).toHaveCount(0)
    // The ACTIVE row is untouched.
    await expect(
      page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_ACTIVE_KEY.name }),
    ).toHaveCount(1)
  })

  test('cancel closes the dialog without deleting the key', async ({ page }) => {
    await setupApiKeysPage(page, TEST_KEYS)

    const revokedRow = page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_REVOKED_KEY.name })
    await revokedRow
      .getByRole('button', { name: `Delete ${TEST_REVOKED_KEY.name}` })
      .evaluate((el) => (el as HTMLElement).click())

    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Cancel' }).click()

    await expect(confirmDialog).toHaveCount(0)
    await expect(
      page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_REVOKED_KEY.name }),
    ).toHaveCount(1)
  })

  test('revokes then deletes an ACTIVE key end to end', async ({ page }) => {
    await setupApiKeysPage(page, [TEST_ACTIVE_KEY])

    // Revoke first: the ACTIVE row gains a Delete button once REVOKED.
    const row = page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_ACTIVE_KEY.name })
    await row
      .getByRole('button', { name: `Revoke ${TEST_ACTIVE_KEY.name}` })
      .evaluate((el) => (el as HTMLElement).click())
    await page.getByRole('alertdialog').getByRole('button', { name: 'Revoke' }).click()
    await expect(page.getByText('API Key revoked')).toBeVisible()
    await expect(row).toContainText('REVOKED')
    await expect(row.getByRole('button', { name: `Delete ${TEST_ACTIVE_KEY.name}` })).toHaveCount(1)

    // Now permanently delete it: the row disappears entirely.
    await row
      .getByRole('button', { name: `Delete ${TEST_ACTIVE_KEY.name}` })
      .evaluate((el) => (el as HTMLElement).click())
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete permanently' }).click()
    await expect(page.getByText('API Key deleted')).toBeVisible()
    await expect(
      page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_ACTIVE_KEY.name }),
    ).toHaveCount(0)
  })

  test('shows the AUTH_023 toast when the server rejects an ACTIVE-key delete', async ({ page }) => {
    await setupApiKeysPage(page, TEST_KEYS)

    // Defensive: the UI never offers Delete on ACTIVE keys, but a server
    // rejection must still surface the mapped AUTH_023 message.
    await page.route('**/api/v1/auth/api-keys/*/delete', async (route) => {
      if (route.request().method() === 'DELETE') {
        await fulfillError(route, 409, AUTH_023_BODY)
        return
      }
      await route.fallback()
    })

    const row = page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_REVOKED_KEY.name })
    await row
      .getByRole('button', { name: `Delete ${TEST_REVOKED_KEY.name}` })
      .evaluate((el) => (el as HTMLElement).click())
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete permanently' }).click()

    await expect(
      page.getByText('Active API keys must be revoked before they can be deleted', { exact: false }),
    ).toBeVisible()
    // The dialog stays open and the row is untouched.
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(
      page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_REVOKED_KEY.name }),
    ).toHaveCount(1)
  })

  test('deletes an EXPIRED key directly after confirmation and the row disappears', async ({ page }) => {
    await setupApiKeysPage(page, TEST_KEYS)

    const row = page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_EXPIRED_KEY.name })
    await row
      .getByRole('button', { name: `Delete ${TEST_EXPIRED_KEY.name}` })
      .evaluate((el) => (el as HTMLElement).click())
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete permanently' }).click()

    await expect(page.getByText('API Key deleted')).toBeVisible()
    await expect(
      page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_EXPIRED_KEY.name }),
    ).toHaveCount(0)
  })

  test('shows the BOLA toast on 401 AUTH_010 without logging out', async ({ page }) => {
    await setupApiKeysPage(page, TEST_KEYS)

    await page.route('**/api/v1/auth/api-keys/*/delete', async (route) => {
      if (route.request().method() === 'DELETE') {
        await fulfillError(route, 401, AUTH_010_BODY)
        return
      }
      await route.fallback()
    })

    const row = page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_REVOKED_KEY.name })
    await row
      .getByRole('button', { name: `Delete ${TEST_REVOKED_KEY.name}` })
      .evaluate((el) => (el as HTMLElement).click())
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete permanently' }).click()

    await expect(page.getByText('API key not found or no longer accessible.')).toBeVisible()
    // The user is NOT logged out (AUTH_010 excluded from the logout path).
    await expect(page).toHaveURL(/\/settings\/api-keys/)
  })

  test('mobile card view shows the Delete button on REVOKED keys', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 })
    await setupApiKeysPage(page, TEST_KEYS)

    // Mobile renders cards instead of the table.
    const card = page.getByTestId('api-key-card').filter({ hasText: TEST_REVOKED_KEY.name })
    await expect(card).toBeVisible()
    await expect(card.getByRole('button', { name: `Delete ${TEST_REVOKED_KEY.name}` })).toHaveCount(1)

    // ACTIVE cards show Revoke, never Delete.
    const activeCard = page.getByTestId('api-key-card').filter({ hasText: TEST_ACTIVE_KEY.name })
    await expect(activeCard.getByRole('button', { name: `Delete ${TEST_ACTIVE_KEY.name}` })).toHaveCount(0)

    // EXPIRED cards show Delete (backend v0.42.0 deletes them directly).
    const expiredCard = page.getByTestId('api-key-card').filter({ hasText: TEST_EXPIRED_KEY.name })
    await expect(expiredCard.getByRole('button', { name: `Delete ${TEST_EXPIRED_KEY.name}` })).toHaveCount(1)

    // Full delete flow works from the card.
    await card
      .getByRole('button', { name: `Delete ${TEST_REVOKED_KEY.name}` })
      .evaluate((el) => (el as HTMLElement).click())
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete permanently' }).click()
    await expect(page.getByText('API Key deleted')).toBeVisible()
    await expect(page.getByTestId('api-key-card').filter({ hasText: TEST_REVOKED_KEY.name })).toHaveCount(0)
  })

  test('rapid double-click on the confirm button fires exactly one delete request', async ({ page }) => {
    const setup = await setupApiKeysPage(page, TEST_KEYS)

    // Hold the delete response open so the mutation stays pending across
    // both clicks — the guard under test is isPending, which only exists
    // while the request is in flight. An instantly-fulfilled mock would let
    // the second click become a second request and defeat the test.
    // The handler also removes the key from the mocked list on release,
    // mirroring the shared helper's delete logic (this handler supersedes it).
    let releaseDelete: (() => void) | undefined
    let deleteRequests = 0
    await page.route('**/api/v1/auth/api-keys/*/delete', async (route) => {
      if (route.request().method() !== 'DELETE') {
        await route.fallback()
        return
      }
      deleteRequests++
      const id = route.request().url().split('/').at(-2) ?? ''
      await new Promise<void>((resolve) => {
        releaseDelete = resolve
      })
      setup.setKeys(setup.getKeys().filter((k) => k.id !== id))
      await route.fulfill({ status: 204, body: '' })
    })

    const row = page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_REVOKED_KEY.name })
    await row
      .getByRole('button', { name: `Delete ${TEST_REVOKED_KEY.name}` })
      .evaluate((el) => (el as HTMLElement).click())
    const confirmButton = page.getByRole('alertdialog').getByRole('button', { name: 'Delete permanently' })
    const dialog = page.getByRole('alertdialog')

    // Double-click while the request is pending: the pending guard must
    // swallow the second invocation (button disabled + isPending early
    // return), so only one DELETE hits the network. The second click is
    // dispatched directly (bypassing actionability waits) to simulate a
    // real rapid double-click — a real click() would block waiting for the
    // button to become enabled again, which is itself the guard working.
    await confirmButton.click()
    // The confirm button's accessible name switches to the pending label
    // ("Deleting...") while disabled, so re-resolving by the original name
    // would fail; assert the disabled state on the dialog instead.
    await expect(dialog.getByRole('button', { name: 'Deleting...' })).toBeDisabled()
    await dialog.getByRole('button', { name: 'Deleting...' }).dispatchEvent('click')

    // Give the second click a chance to misfire before releasing the held
    // response, then let the mutation resolve.
    await expect.poll(() => deleteRequests).toBe(1)
    releaseDelete?.()
    await expect(page.getByText('API Key deleted')).toBeVisible()
    await expect.poll(async () => deleteRequests, { message: 'delete mutation must fire exactly once' }).toBe(1)
    await expect(
      page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_REVOKED_KEY.name }),
    ).toHaveCount(0)
  })
})
