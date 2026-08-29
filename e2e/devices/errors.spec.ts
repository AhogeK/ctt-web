import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm } from '../utils/auth-helpers.js'
import { setupDevicesPage } from './helpers.js'
import { COMMON_002_BODY, DEVICE_001_BODY, TEST_MAC_DEVICE, TEST_DEVICES } from './fixtures.js'

test.describe('Device error paths', () => {
  test('shows the error state with retry when the list returns 404 COMMON_002', async ({ page }) => {
    // Seed auth mocks and a failing list route BEFORE the first navigation so
    // the first GET /api/v1/devices already errors (no reload needed — the
    // initial route load runs auth init and the guarded /devices fetch).
    await mockAuthApis(page)
    await page.route('**/api/v1/devices', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify(COMMON_002_BODY) })
      } else {
        await route.continue()
      }
    })

    await loginViaForm(page)
    await page.goto('/devices')

    await expect(page.getByText('Failed to load devices')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
  })

  test('shows the error state when the devices request fails (network)', async ({ page }) => {
    await mockAuthApis(page)
    await page.route('**/api/v1/devices', async (route) => {
      if (route.request().method() === 'GET') {
        await route.abort('connectionfailed')
      } else {
        await route.continue()
      }
    })

    await loginViaForm(page)
    await page.goto('/devices')

    await expect(page.getByText('Failed to load devices')).toBeVisible()
  })

  test('shows the not-found toast when revoking a device returns 404 COMMON_002', async ({ page }) => {
    await setupDevicesPage(page, TEST_DEVICES)

    // Override the DELETE handler so the revoke mutation fails.
    await page.route('**/api/v1/devices/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify(COMMON_002_BODY) })
      }
    })

    const macCard = page.getByTestId('device-card').filter({ hasText: TEST_MAC_DEVICE.deviceName! })
    await macCard.getByRole('button', { name: `Revoke ${TEST_MAC_DEVICE.deviceName}` }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Revoke Device' }).click()

    await expect(page.getByText('The requested resource was not found or you do not have access to it.')).toBeVisible()
    // The dialog stays open so the user can retry or cancel.
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('shows the device-occupied toast when revoking returns 409 DEVICE_001', async ({ page }) => {
    await setupDevicesPage(page, TEST_DEVICES)

    await page.route('**/api/v1/devices/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify(DEVICE_001_BODY) })
      }
    })

    const macCard = page.getByTestId('device-card').filter({ hasText: TEST_MAC_DEVICE.deviceName! })
    await macCard.getByRole('button', { name: `Revoke ${TEST_MAC_DEVICE.deviceName}` }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Revoke Device' }).click()

    await expect(page.getByText('Device already registered to another user.')).toBeVisible()
  })
})
