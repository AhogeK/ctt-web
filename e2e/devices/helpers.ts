import { expect, type Page } from '@playwright/test'
import { mockAuthApis, loginViaForm, okEnvelope, nowIso } from '../utils/auth-helpers.js'
import type { DeviceFixture } from './fixtures.js'

export interface DevicesPageSetup {
  /** Snapshot of the current devices array (what GET returns). */
  getDevices: () => DeviceFixture[]
  /** Replace the devices array. */
  setDevices: (devices: DeviceFixture[]) => void
}

/**
 * Seed the auth mocks, mock the devices endpoints with mutable state, log in
 * and navigate to /devices.
 *
 * The GET /api/v1/devices handler reads the mutable `devices` array by
 * closure, so tests can mutate it and the next refetch (triggered by query
 * invalidation after revoke) returns the updated list. DELETE mirrors the
 * backend contract (v0.50.0): revoking KEEPS the record and sets `revokedAt`
 * on it — the refetch then renders the device as Revoked instead of removing
 * it.
 *
 * Error tests override the GET / DELETE handlers after this helper returns
 * (last registered handler wins in Playwright).
 */
export async function setupDevicesPage(page: Page, initialDevices: DeviceFixture[] = []): Promise<DevicesPageSetup> {
  await mockAuthApis(page)

  let devices = [...initialDevices]

  await page.route('**/api/v1/devices', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(okEnvelope(devices)) })
    } else {
      // POST registration — not used by the Web UI (devices register via the
      // JetBrains plugin); return success defensively.
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(okEnvelope(null)) })
    }
  })

  await page.route('**/api/v1/devices/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      const id = new URL(route.request().url()).pathname.split('/').pop() ?? ''
      devices = devices.map((d) => (d.id === id ? { ...d, revokedAt: nowIso() } : d))
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(okEnvelope(null)) })
    } else {
      await route.continue()
    }
  })

  await loginViaForm(page)
  await page.goto('/devices')
  await expect(page.getByRole('heading', { name: 'Device Management' })).toBeVisible()

  return {
    getDevices: () => devices,
    setDevices: (next: DeviceFixture[]) => {
      devices = [...next]
    },
  }
}
