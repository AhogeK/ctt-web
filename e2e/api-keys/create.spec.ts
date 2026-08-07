import { test, expect } from '@playwright/test'
import { setupApiKeysPage, openCreateDialog, submitCreateForm, copyRawKey } from './helpers.js'
import { TEST_RAW_KEY, TEST_NEW_KEY } from './fixtures.js'

test.describe('API key create flow', () => {
  test('creates a key end to end and shows it in the list', async ({ page }) => {
    await setupApiKeysPage(page, [])

    await openCreateDialog(page)
    await submitCreateForm(page, 'New Test Key')

    // RawKeyDialog appears with the one-time raw key.
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('API key')).toHaveValue(TEST_RAW_KEY)

    // Copy gates the close button (disabled while the raw key is uncopied).
    const closeButton = dialog.getByRole('button', { name: 'Copy the key to close' })
    await expect(closeButton).toBeDisabled()

    await copyRawKey(page)
    const copiedCloseButton = dialog.getByRole('button', { name: 'Copied, close' })
    await expect(copiedCloseButton).toBeEnabled()
    await copiedCloseButton.click()

    // List refreshes (query invalidation) and shows the new row.
    const rows = page.getByTestId('api-key-table').locator('tbody tr')
    await expect(rows).toHaveCount(1)
    await expect(rows.nth(0)).toContainText(TEST_NEW_KEY.name)
    await expect(rows.nth(0)).toContainText('ACTIVE')
  })
})
