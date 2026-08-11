import { test, expect } from '@playwright/test'
import { setupApiKeysPage } from './helpers.js'
import { TEST_ACTIVE_KEY, TEST_EXPIRED_KEY, TEST_REVOKED_KEY, TEST_KEYS } from './fixtures.js'

test.describe('API keys list', () => {
  test('shows the empty state when no keys exist', async ({ page }) => {
    await setupApiKeysPage(page, [])

    await expect(page.getByText('No API keys yet')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create API Key' }).first()).toBeVisible()
  })

  test('renders the table with mixed-status keys', async ({ page }) => {
    await setupApiKeysPage(page, TEST_KEYS)

    const table = page.getByTestId('api-key-table')
    const rows = table.locator('tbody tr')
    await expect(rows).toHaveCount(3)

    await expect(rows.nth(0)).toContainText(TEST_ACTIVE_KEY.name)
    await expect(rows.nth(0)).toContainText(TEST_ACTIVE_KEY.keyPrefix)
    await expect(rows.nth(0)).toContainText('ACTIVE')

    await expect(rows.nth(1)).toContainText(TEST_EXPIRED_KEY.name)
    await expect(rows.nth(1)).toContainText('EXPIRED')

    await expect(rows.nth(2)).toContainText(TEST_REVOKED_KEY.name)
    await expect(rows.nth(2)).toContainText('REVOKED')
  })

  test('shows Revoke on ACTIVE, Delete on EXPIRED and REVOKED rows', async ({ page }) => {
    await setupApiKeysPage(page, TEST_KEYS)

    const rows = page.getByTestId('api-key-table').locator('tbody tr')
    await expect(rows.nth(0).getByRole('button', { name: `Revoke ${TEST_ACTIVE_KEY.name}` })).toBeVisible()
    // EXPIRED keys cannot be reactivated; backend v0.42.0 deletes them directly.
    await expect(rows.nth(1).getByRole('button', { name: `Delete ${TEST_EXPIRED_KEY.name}` })).toBeVisible()
    await expect(rows.nth(1).getByRole('button', { name: /Revoke/i })).toHaveCount(0)
    await expect(rows.nth(2).getByRole('button', { name: `Delete ${TEST_REVOKED_KEY.name}` })).toBeVisible()
  })
})
