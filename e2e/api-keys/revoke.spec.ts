import { test, expect } from '@playwright/test'
import { setupApiKeysPage } from './helpers.js'
import { TEST_ACTIVE_KEY, TEST_KEYS } from './fixtures.js'

test.describe('API key revoke flow', () => {
  test('revokes an ACTIVE key after confirmation', async ({ page }) => {
    await setupApiKeysPage(page, TEST_KEYS)

    const row = page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_ACTIVE_KEY.name })
    await row
      .getByRole('button', { name: `Revoke ${TEST_ACTIVE_KEY.name}` })
      .evaluate((el) => (el as HTMLElement).click())

    // Confirmation dialog shows the key identity.
    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog).toBeVisible()
    await expect(confirmDialog).toContainText(TEST_ACTIVE_KEY.name)
    await expect(confirmDialog).toContainText(TEST_ACTIVE_KEY.keyPrefix)

    await confirmDialog.getByRole('button', { name: 'Revoke' }).click()

    // Success toast + list refresh flips the row to REVOKED.
    await expect(page.getByText('API Key revoked')).toBeVisible()
    const revokedRow = page.getByTestId('api-key-table').locator('tbody tr').filter({ hasText: TEST_ACTIVE_KEY.name })
    await expect(revokedRow).toContainText('REVOKED')
    await expect(revokedRow.getByRole('button', { name: /Revoke/i })).toHaveCount(0)
  })
})
