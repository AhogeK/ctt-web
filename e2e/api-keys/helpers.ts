import { expect, type Page, type Route } from '@playwright/test'
import { mockAuthApis, loginViaForm, okEnvelope, nowIso } from '../utils/auth-helpers.js'
import { TEST_CREATE_RESPONSE, TEST_NEW_KEY, type ApiKeyFixture } from './fixtures.js'

export interface ApiKeysPageSetup {
  /** Snapshot of the current keys array (what GET returns). */
  getKeys: () => ApiKeyFixture[]
  /** Replace the keys array. */
  setKeys: (keys: ApiKeyFixture[]) => void
}

/**
 * Seed the auth mocks, mock the API keys endpoints with mutable state, log in
 * and navigate to /settings/api-keys.
 *
 * The GET /api/v1/auth/api-keys handler reads the mutable `keys` array by
 * closure, so tests can mutate it and the next refetch (triggered by query
 * invalidation after create/revoke) returns the updated list.
 *
 * Defaults: POST → 201 with TEST_CREATE_RESPONSE and appends TEST_NEW_KEY to
 * the list; DELETE → 204 and marks the target key REVOKED. Error tests
 * override the route handlers after this helper returns (last registered
 * handler wins in Playwright).
 */
export async function setupApiKeysPage(page: Page, initialKeys: ApiKeyFixture[] = []): Promise<ApiKeysPageSetup> {
  await mockAuthApis(page)

  let keys = [...initialKeys]

  await page.route('**/api/v1/auth/api-keys', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(okEnvelope({ keys })),
      })
      return
    }
    if (method === 'POST') {
      keys = [...keys, TEST_NEW_KEY]
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(okEnvelope(TEST_CREATE_RESPONSE)),
      })
      return
    }
    await route.fallback()
  })

  await page.route('**/api/v1/auth/api-keys/*', async (route) => {
    if (route.request().method() !== 'DELETE') {
      await route.fallback()
      return
    }
    const id = route.request().url().split('/').pop() ?? ''
    keys = keys.map((k) => (k.id === id ? { ...k, status: 'REVOKED' as const, revokedAt: nowIso() } : k))
    await route.fulfill({ status: 204, body: '' })
  })

  // Permanent delete: DELETE /api/v1/auth/api-keys/{id}/delete physically
  // removes the key from the mocked list (row disappears on refetch).
  await page.route('**/api/v1/auth/api-keys/*/delete', async (route) => {
    if (route.request().method() !== 'DELETE') {
      await route.fallback()
      return
    }
    const id = route.request().url().split('/').at(-2) ?? ''
    keys = keys.filter((k) => k.id !== id)
    await route.fulfill({ status: 204, body: '' })
  })

  await loginViaForm(page)
  await page.goto('/settings/api-keys')
  await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible()

  return {
    getKeys: () => [...keys],
    setKeys: (next) => {
      keys = [...next]
    },
  }
}

/** Open the create dialog from the page header. */
export async function openCreateDialog(page: Page): Promise<void> {
  // Use a native el.click() instead of Playwright's hit-test: in headless
  // Chromium the app sidebar's tooltip/grace-area overlay intercepts pointer
  // events on content buttons (a rendering difference, not a functional bug,
  // the click still reaches the Vue handler via the DOM event).
  await page
    .getByRole('button', { name: 'Create API Key' })
    .first()
    .evaluate((el) => (el as HTMLElement).click())
  await expect(page.getByRole('dialog')).toContainText('Create API Key')
}

/** Fill the create form name field and submit. */
export async function submitCreateForm(page: Page, name: string): Promise<void> {
  const dialog = page.getByRole('dialog')
  // Target by id. fill() dispatches a native input event; the Input component
  // writes back through v-model (useVModel) and vee-validate flushes the
  // schema validation asynchronously, so we wait for the flush before
  // clicking submit or the schema still sees an empty name (race: cold server
  // passes, warm server fails).
  const nameInput = dialog.locator('#api-key-name')
  await nameInput.fill(name)
  await page.waitForTimeout(200)
  await expect(nameInput).toHaveValue(name)
  await dialog.getByRole('button', { name: 'Create API Key' }).click()
}

/** Click the copy button in RawKeyDialog and wait for the copied state. */
export async function copyRawKey(page: Page): Promise<void> {
  const copyButton = page.getByRole('alertdialog').getByRole('button', { name: /Copy key/i })
  await copyButton.click()
  await expect(page.getByRole('alertdialog').getByRole('button', { name: 'Copied', exact: true })).toBeVisible()
}

/** Fulfill a JSON error response for the given route. */
export async function fulfillError(route: Route, status: number, body: Record<string, unknown>): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
