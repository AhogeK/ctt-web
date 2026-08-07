import { test, expect } from '@playwright/test'
import { setupApiKeysPage, openCreateDialog, submitCreateForm, copyRawKey } from './helpers.js'

test.describe('RawKeyDialog hard-to-dismiss behavior', () => {
  test('Escape does not close the dialog', async ({ page }) => {
    await setupApiKeysPage(page, [])
    await openCreateDialog(page)
    await submitCreateForm(page, 'Esc Test Key')

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeVisible()
  })

  test('overlay click does not close the dialog', async ({ page }) => {
    await setupApiKeysPage(page, [])
    await openCreateDialog(page)
    await submitCreateForm(page, 'Overlay Test Key')

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()

    // Click far outside the dialog content (top-left corner).
    await page.mouse.click(8, 8)
    await expect(dialog).toBeVisible()
  })

  test('close button stays disabled until the key is copied', async ({ page }) => {
    await setupApiKeysPage(page, [])
    await openCreateDialog(page)
    await submitCreateForm(page, 'Gate Test Key')

    const dialog = page.getByRole('alertdialog')
    const closeButton = dialog.getByRole('button', { name: 'Copy the key to close' })
    await expect(closeButton).toBeDisabled()

    await copyRawKey(page)
    await expect(dialog.getByRole('button', { name: 'Copied, close' })).toBeEnabled()
  })

  test('close works after copying and the dialog unmounts', async ({ page }) => {
    await setupApiKeysPage(page, [])
    await openCreateDialog(page)
    await submitCreateForm(page, 'Close Test Key')

    const dialog = page.getByRole('alertdialog')
    await copyRawKey(page)
    await dialog.getByRole('button', { name: 'Copied, close' }).click()

    await expect(page.getByRole('alertdialog')).toHaveCount(0)
  })
})
