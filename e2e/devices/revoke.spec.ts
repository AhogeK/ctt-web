import { test, expect } from '@playwright/test'
import { setupDevicesPage } from './helpers.js'
import { TEST_MAC_DEVICE, TEST_DEVICES } from './fixtures.js'

test.describe('Device revoke flow', () => {
  test('revokes a device after confirmation and refreshes the list', async ({ page }) => {
    await setupDevicesPage(page, TEST_DEVICES)

    const macCard = page.getByTestId('device-card').filter({ hasText: TEST_MAC_DEVICE.deviceName! })
    await macCard.getByRole('button', { name: `Revoke ${TEST_MAC_DEVICE.deviceName}` }).click()

    // Confirmation dialog shows the device identity.
    const confirmDialog = page.getByRole('dialog')
    await expect(confirmDialog).toBeVisible()
    await expect(confirmDialog).toContainText('Revoke Device Access')
    await expect(confirmDialog).toContainText(TEST_MAC_DEVICE.deviceName!)

    await confirmDialog.getByRole('button', { name: 'Revoke Device' }).click()

    // Success toast + query invalidation removes the revoked device from the list.
    await expect(page.getByText('Device revoked successfully')).toBeVisible()
    await expect(page.getByTestId('device-card').filter({ hasText: TEST_MAC_DEVICE.deviceName! })).toHaveCount(0)
    await expect(page.getByTestId('device-card')).toHaveCount(TEST_DEVICES.length - 1)
  })

  test('cancels the confirmation dialog without revoking', async ({ page }) => {
    await setupDevicesPage(page, TEST_DEVICES)

    const macCard = page.getByTestId('device-card').filter({ hasText: TEST_MAC_DEVICE.deviceName! })
    await macCard.getByRole('button', { name: `Revoke ${TEST_MAC_DEVICE.deviceName}` }).click()

    const confirmDialog = page.getByRole('dialog')
    await confirmDialog.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByTestId('device-card')).toHaveCount(TEST_DEVICES.length)
  })
})
