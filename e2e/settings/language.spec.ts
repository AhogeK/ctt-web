import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm } from '../utils/auth-helpers.js'

/**
 * Interface language switching, end to end.
 *
 * The application shell (sidebar, settings rail, avatar menu, Preferences page)
 * is the first migrated surface: switching to Chinese must repaint it without a
 * reload, update `<html lang>` for assistive technology and screen readers, and
 * survive a reload.
 */
test.describe('Interface language', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApis(page)
    await loginViaForm(page)
  })

  test('switching to Chinese repaints the shell and persists across a reload', async ({ page }) => {
    await page.goto('/settings/preferences')
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()

    // Click the label, not the radio: the input is visually hidden by design
    // (native grouping and arrow keys still work through the label).
    await page.getByText('简体中文', { exact: true }).click()

    await expect(page.getByRole('heading', { name: '偏好设置' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: '设置分区' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    // The sidebar follows without a reload — the switcher publishes to the
    // i18n instance, not to storage alone.
    await expect(page.getByRole('link', { name: '统计看板' })).toBeVisible()

    await page.reload()

    await expect(page.getByRole('heading', { name: '偏好设置' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')

    // Restore the default so a later spec in the same context starts in English.
    await page.getByText('English', { exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()
  })

  test('the avatar menu offers the same languages', async ({ page }) => {
    await page.goto('/settings/preferences')

    await page.getByRole('button', { name: 'Open user menu' }).click()

    await expect(page.getByRole('menuitem', { name: /Language/ })).toBeVisible()
  })
})
