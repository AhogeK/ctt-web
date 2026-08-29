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
    await expect(cards.nth(0)).toContainText('IntelliJ IDEA 2026.1')

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
})
