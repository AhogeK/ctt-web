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

  test('renders the page and create dialog in Chinese', async ({ page }) => {
    await setupApiKeysPage(page, TEST_KEYS)

    await page.goto('/settings/preferences')
    await page.getByText('简体中文', { exact: true }).click()
    await page.getByRole('heading', { name: '偏好设置' }).waitFor()

    await page.goto('/settings/api-keys')
    await expect(page.getByRole('heading', { name: 'API 密钥' })).toBeVisible()
    const rows = page.getByTestId('api-key-table').locator('tbody tr')
    await expect(rows.nth(0)).toContainText('活跃')
    await expect(rows.nth(1)).toContainText('已过期')
    await expect(rows.nth(2)).toContainText('已撤销')
    await expect(page.getByTestId('api-key-table')).toContainText('名称')
    await expect(page.getByTestId('api-key-table')).toContainText('最近使用')

    await page.getByRole('button', { name: '创建 API 密钥' }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('创建 API 密钥')
    await expect(dialog).toContainText('名称')
    await expect(dialog).toContainText('权限')
    await expect(dialog).toContainText('过期时间')
    await expect(dialog.getByRole('button', { name: '取消' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: '创建 API 密钥' })).toBeVisible()
    await dialog.getByRole('button', { name: '取消' }).click()

    await page.goto('/settings/preferences')
    await page.getByText('English', { exact: true }).click()
    await page.getByRole('heading', { name: 'Preferences' }).waitFor()
  })
})
