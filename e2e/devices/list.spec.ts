import { test, expect } from '@playwright/test'
import { setupDevicesPage } from './helpers.js'
import { TEST_MAC_DEVICE, TEST_WINDOWS_DEVICE, TEST_DEVICES } from './fixtures.js'

test.describe('Device list', () => {
  test('shows the empty state with an install-plugin guide', async ({ page }) => {
    await setupDevicesPage(page, [])

    await expect(page.getByText('No devices registered')).toBeVisible()
    await expect(page.getByText('Devices will appear here when you log in from a new device.')).toBeVisible()
    const installLink = page.getByRole('link', { name: 'Install the JetBrains plugin' })
    await expect(installLink).toBeVisible()
    await expect(installLink).toHaveAttribute('href', 'https://github.com/AhogeK/code-time-tracker')
  })

  test('renders device cards with name, platform, relative time and status', async ({ page }) => {
    await setupDevicesPage(page, TEST_DEVICES)

    const cards = page.getByTestId('device-list').locator('[data-testid="device-card"]')
    await expect(cards).toHaveCount(3)

    // Active within 7 days → Active badge + "Just now" + IDE version.
    await expect(cards.nth(0)).toContainText(TEST_MAC_DEVICE.deviceName!)
    await expect(cards.nth(0)).toContainText('macOS')
    await expect(cards.nth(0)).toContainText('Last seen: Just now')
    await expect(cards.nth(0)).toContainText('Active')
    await expect(cards.nth(0)).toContainText('Last used IDE: IntelliJ IDEA 2026.1')

    // 30 days idle → Inactive badge + "1mo ago".
    await expect(cards.nth(1)).toContainText(TEST_WINDOWS_DEVICE.deviceName!)
    await expect(cards.nth(1)).toContainText('Windows')
    await expect(cards.nth(1)).toContainText('Inactive')
    await expect(cards.nth(1)).toContainText('1mo ago')

    // No deviceName → falls back to the IDE name.
    await expect(cards.nth(2)).toContainText('PyCharm 2025.3')
    await expect(cards.nth(2)).toContainText('Linux')
  })

  test('exposes an accessible Revoke button per device card', async ({ page }) => {
    await setupDevicesPage(page, TEST_DEVICES)

    await expect(page.getByRole('button', { name: `Revoke ${TEST_MAC_DEVICE.deviceName}` })).toBeVisible()
    await expect(page.getByRole('button', { name: `Revoke ${TEST_WINDOWS_DEVICE.deviceName}` })).toBeVisible()
  })

  test('renders the page in Chinese after switching in Preferences', async ({ page }) => {
    await setupDevicesPage(page, TEST_DEVICES)

    await page.goto('/settings/preferences')
    await page.getByText('简体中文', { exact: true }).click()
    await page.getByRole('heading', { name: '偏好设置' }).waitFor()

    await page.goto('/settings/devices')
    await expect(page.getByRole('heading', { name: '设备管理' })).toBeVisible()

    const macCard = page.getByTestId('device-card').filter({ hasText: TEST_MAC_DEVICE.deviceName! })
    await expect(macCard).toContainText('上次活跃：')
    await expect(macCard).toContainText('最近使用 IDE：IntelliJ IDEA 2026.1')
    await expect(macCard).toContainText('活跃')

    await page.getByRole('button', { name: `撤销 ${TEST_MAC_DEVICE.deviceName}` }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('撤销设备访问')
    await expect(dialog).toContainText(TEST_MAC_DEVICE.deviceName!)
    await expect(dialog.getByRole('button', { name: '撤销设备' })).toBeVisible()
    await dialog.getByRole('button', { name: '取消' }).click()

    await page.goto('/settings/preferences')
    await page.getByText('English', { exact: true }).click()
    await page.getByRole('heading', { name: 'Preferences' }).waitFor()
  })
})
