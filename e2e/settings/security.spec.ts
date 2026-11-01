import { expect, test, type Page } from '@playwright/test'
import * as jsQrModule from 'jsqr'
import { mockAuthApis, loginViaForm, okEnvelope } from '../utils/auth-helpers.js'

/**
 * The security page, end to end: the sign-ins the server reports, how they are folded, revoking
 * one, and the data export.
 *
 * Everything runs against mocked endpoints. The assertions are about what the page does with the
 * answers: it folds repeated clients instead of repeating them, it addresses a revocation to the
 * sign-in the reader pointed at, and it saves the export under the name the server chose.
 */

type QrDecoder = (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null

/** `jsqr` ships CommonJS: the callable arrives either as the namespace or as its `default`. */
const decodeQr = (jsQrModule as unknown as { default?: QrDecoder }).default ?? (jsQrModule as unknown as QrDecoder)

const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'

interface SessionFixture {
  id: string
  kind: 'WEB' | 'PLUGIN'
  deviceName: string | null
  ideName: string | null
  userAgent: string | null
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  current: boolean
}

const session = (overrides: Partial<SessionFixture> & { id: string }): SessionFixture => ({
  kind: 'WEB',
  deviceName: null,
  ideName: null,
  userAgent: CHROME_MAC,
  createdAt: '2026-07-01T00:00:00Z',
  lastUsedAt: '2026-07-09T10:30:00Z',
  expiresAt: '2026-08-09T10:30:00Z',
  current: false,
  ...overrides,
})

/** The list a real account accumulates: several sign-ins from the same browser, plus one plugin. */
const sessionFixtures = (): SessionFixture[] => [
  session({ id: '11111111-1111-4111-8111-111111111111', current: true, lastUsedAt: '2026-07-09T10:30:00Z' }),
  ...Array.from({ length: 6 }, (_unused, index) =>
    session({ id: `aaaaaaaa-1111-4111-8111-00000000000${index}`, lastUsedAt: '2026-07-08T10:30:00Z' }),
  ),
  session({
    id: '22222222-2222-4222-8222-222222222222',
    kind: 'PLUGIN',
    deviceName: 'workstation',
    ideName: 'IntelliJ IDEA',
    userAgent: null,
    lastUsedAt: null,
  }),
  session({ id: '33333333-3333-4333-8333-333333333333', userAgent: FIREFOX_LINUX }),
]

/**
 * Serve the session list from a mutable array and record deletions.
 *
 * The list is mutable on purpose: the page refetches after a successful revocation, and a mock
 * that kept returning the deleted row would make the client look broken.
 */
async function mockSessions(page: Page): Promise<{ list: SessionFixture[]; deletes: string[]; batches: string[][] }> {
  const list = sessionFixtures()
  const deletes: string[] = []
  const batches: string[][] = []

  await page.route('**/api/v1/users/me/sessions**', async (route) => {
    const request = route.request()

    if (request.method() === 'DELETE') {
      const id = new URL(request.url()).pathname.split('/').pop() ?? ''
      deletes.push(id)
      const index = list.findIndex((row) => row.id === id)
      if (index !== -1) list.splice(index, 1)
      await route.fulfill({ status: 204, body: '' })
      return
    }

    if (request.method() === 'POST') {
      const body = request.postDataJSON() as { sessionIds: string[] }
      batches.push(body.sessionIds)
      let revoked = 0
      for (const id of body.sessionIds) {
        const index = list.findIndex((row) => row.id === id)
        if (index === -1) continue
        list.splice(index, 1)
        revoked += 1
      }
      await route.fulfill({ json: okEnvelope({ revoked, skipped: [] }) })
      return
    }

    await route.fulfill({ json: okEnvelope(list) })
  })

  return { list, deletes, batches }
}

/**
 * Serve the second-factor state from a mutable object.
 *
 * The page refetches the status after every change, so the mock has to move with it: a fixed
 * `enabled: false` would make a successful enable look like a failure.
 */
async function mockTwoFactor(
  page: Page,
  initial: { enabled?: boolean; remaining?: number } = {},
): Promise<{ state: { enabled: boolean; remaining: number } }> {
  const state = { enabled: initial.enabled ?? false, remaining: initial.remaining ?? 0 }
  const codes = Array.from({ length: 10 }, (_, index) => `KYQV-BATK-MZVK-MMX${index}`)

  await page.route('**/api/v1/users/me/2fa**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname

    if (request.method() === 'GET') {
      await route.fulfill({
        json: okEnvelope({
          enabled: state.enabled,
          confirmedAt: state.enabled ? '2026-11-01T10:00:00Z' : null,
          recoveryCodesRemaining: state.remaining,
          hasPassword: true,
          recentAuthentication: true,
        }),
      })
      return
    }

    if (path.endsWith('/totp/start')) {
      await route.fulfill({
        json: okEnvelope({
          // What the server now returns: 20 random bytes, encoded once — 32 characters, no padding.
          secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
          otpauthUri:
            'otpauth://totp/Code%20Time%20Tracker:test@example.com?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=Code%20Time%20Tracker',
          digits: 6,
          period: 30,
          issuer: 'Code Time Tracker',
          expiresAt: '2026-11-01T10:40:00Z',
        }),
      })
      return
    }

    if (path.endsWith('/totp/confirm')) {
      state.enabled = true
      state.remaining = 10
      await route.fulfill({ json: okEnvelope({ recoveryCodes: codes }) })
      return
    }

    if (path.endsWith('/recovery-codes/regenerate')) {
      state.remaining = 10
      await route.fulfill({ json: okEnvelope({ recoveryCodes: codes }) })
      return
    }

    if (path.endsWith('/disable')) {
      state.enabled = false
      state.remaining = 0
      // The endpoint answers 204 with no body; a 200 envelope here would hide a client that parses one.
      await route.fulfill({ status: 204, body: '' })
      return
    }

    await route.fulfill({ status: 404, json: { message: 'not mocked' } })
  })

  return { state }
}

const sessionsList = (page: Page) => page.getByTestId('login-sessions')

test.describe('Security page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApis(page)
    await mockSessions(page)
    await loginViaForm(page)
  })

  test('folds repeated sign-ins of the same client instead of repeating them', async ({ page }) => {
    await page.goto('/settings/security')

    await expect(page.getByRole('heading', { name: 'Security', level: 1 })).toBeVisible()

    // The current sign-in keeps its own row, with the way out.
    const current = page.locator('[data-current="true"]')
    await expect(current).toHaveCount(1)
    await expect(current).toContainText('Chrome · macOS')
    await expect(current).toContainText('This session')

    // Six further Chrome sign-ins are one row with a count, not six rows.
    const groups = page.getByTestId('login-session-group')
    await expect(groups).toHaveCount(3)
    await expect(groups.nth(0)).toContainText('Chrome · macOS')
    await expect(groups.nth(0)).toContainText('6 sign-ins')
    await expect(groups.nth(1)).toContainText('workstation')
    await expect(groups.nth(1)).toContainText('IntelliJ IDEA')
    await expect(groups.nth(2)).toContainText('Firefox · Linux')

    // Nine sign-ins occupy four lines: a card that fills the viewport hides the rest of the page.
    const height = await sessionsList(page).evaluate((element) => element.getBoundingClientRect().height)
    expect(height).toBeLessThan(260)
    await expect(page.getByTestId('login-session-child')).toHaveCount(0)
  })

  test('reveals the individual sign-ins of a folded client on request', async ({ page }) => {
    await page.goto('/settings/security')

    const chrome = page.getByTestId('login-session-group').nth(0)
    await chrome.getByTestId('login-session-toggle').click()

    await expect(page.getByTestId('login-session-child')).toHaveCount(6)
    await expect(chrome.getByTestId('login-session-toggle')).toHaveAttribute('aria-expanded', 'true')

    await chrome.getByTestId('login-session-toggle').click()
    await expect(page.getByTestId('login-session-child')).toHaveCount(0)
  })

  test('revokes the sign-in the user confirmed, and only that one', async ({ page }) => {
    const { deletes } = await mockSessions(page)
    await page.goto('/settings/security')

    // The plugin client has a single sign-in, so its row carries a direct revoke.
    const plugin = page.getByTestId('login-session-group').nth(1)
    await plugin.getByTestId('login-session-revoke').click()
    await page.getByTestId('login-session-confirm').click()

    await expect.poll(() => deletes).toEqual(['22222222-2222-4222-8222-222222222222'])
    // The list is refetched rather than spliced locally, so the row disappears only once the
    // server's answer no longer contains it.
    await expect(page.getByTestId('login-session-group')).toHaveCount(2)
    await expect(page).toHaveURL(/\/settings\/security$/)
  })

  test("ends a folded client's sign-ins in one call", async ({ page }) => {
    const { batches } = await mockSessions(page)
    await page.goto('/settings/security')

    const chrome = page.getByTestId('login-session-group').nth(0)
    await chrome.getByTestId('login-session-bulk').click()
    await page.getByTestId('login-session-bulk-confirm').click()

    // One request for the whole client, not one per sign-in.
    await expect.poll(() => batches).toHaveLength(1)
    expect(batches[0]).toHaveLength(6)
    await expect(page.getByTestId('login-session-group')).toHaveCount(2)
    await expect(page.getByText('Sign-ins revoked: 6')).toBeVisible()
  })

  test('saves the export under the filename the server chose', async ({ page }) => {
    await page.route('**/api/v1/users/me/export**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-disposition': 'attachment; filename="ctt-export-2026-07-09.json"',
        },
        body: '{"exportVersion":"1.0","totalSessions":0,"sessions":[]}',
      })
    })

    await page.goto('/settings/security')

    const downloadStarted = page.waitForEvent('download')
    await page.getByTestId('export-download').click()
    const download = await downloadStarted

    expect(download.suggestedFilename()).toBe('ctt-export-2026-07-09.json')
    await expect(page.getByText('Download started')).toBeVisible()
  })

  test('turns the second factor on, keeps the codes, and turns it off again', async ({ page }) => {
    const { state } = await mockTwoFactor(page)
    await page.goto('/settings/security')

    const card = page.locator('section[aria-labelledby="two-factor-heading"]')
    await expect(card.getByTestId('two-factor-state')).toHaveText('Off')

    await card.getByTestId('two-factor-enable').click()
    await page.getByTestId('two-factor-password').fill('SecurePass1!')
    await page.getByTestId('two-factor-password-submit').click()

    // The key the authenticator needs, shown before anything is confirmed.
    await expect(page.getByTestId('two-factor-secret')).toHaveText('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP')
    await page.getByTestId('two-factor-secret-next').click()
    await page.getByTestId('two-factor-setup-code').fill('123456')
    await page.getByTestId('two-factor-code-submit').click()

    // Ten codes, and the dialog refuses to close until the reader says they are stored.
    await expect(page.getByTestId('recovery-code')).toHaveCount(10)
    await expect(page.getByTestId('recovery-done')).toBeDisabled()
    await page.getByTestId('recovery-acknowledge').click()
    await page.getByTestId('recovery-done').click()

    await expect(card.getByTestId('two-factor-state')).toHaveText('On')
    await expect(card).toContainText('10 recovery codes left')
    expect(state.enabled).toBe(true)

    await card.getByTestId('two-factor-disable').click()
    await page.getByTestId('two-factor-credential').fill('123456')
    await page.getByTestId('two-factor-confirm-submit').click()

    await expect(card.getByTestId('two-factor-state')).toHaveText('Off')
    expect(state.enabled).toBe(false)
  })

  test('re-sets the factor: the confirm dialog hands over to the wizard', async ({ page }) => {
    const { state } = await mockTwoFactor(page, { enabled: true, remaining: 4 })
    await page.goto('/settings/security')

    const card = page.locator('section[aria-labelledby="two-factor-heading"]')
    await card.getByTestId('two-factor-reset').click()
    await page.getByTestId('two-factor-credential').fill('123456')
    await page.getByTestId('two-factor-confirm-submit').click()

    // The factor is off, so the wizard opens at its first step instead of the card going quiet.
    await expect(page.getByTestId('two-factor-password')).toBeVisible()
    await page.getByTestId('two-factor-password').fill('SecurePass1!')
    await page.getByTestId('two-factor-password-submit').click()
    await expect(page.getByTestId('two-factor-secret')).toHaveText('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP')
    expect(state.enabled).toBe(false)
  })

  test('replaces the recovery codes and keeps the new batch behind the same gate', async ({ page }) => {
    await mockTwoFactor(page, { enabled: true, remaining: 3 })
    await page.goto('/settings/security')

    const card = page.locator('section[aria-labelledby="two-factor-heading"]')
    await expect(card).toContainText('3 recovery codes left')

    await card.getByTestId('two-factor-regenerate').click()
    await page.getByTestId('two-factor-credential').fill('123456')
    await page.getByTestId('two-factor-confirm-submit').click()

    await expect(page.getByTestId('recovery-code')).toHaveCount(10)
    await expect(page.getByTestId('recovery-done')).toBeDisabled()
    await page.getByTestId('recovery-acknowledge').click()
    await page.getByTestId('recovery-done').click()

    // The list refetches from the server, which now reports the new batch.
    await expect(card).toContainText('10 recovery codes left')
  })

  test('renders a QR an authenticator app can actually read', async ({ page }) => {
    await mockTwoFactor(page)
    await page.goto('/settings/security')

    await page.getByTestId('two-factor-enable').click()
    await page.getByTestId('two-factor-password').fill('SecurePass1!')
    await page.getByTestId('two-factor-password-submit').click()
    await page.getByTestId('two-factor-qr').waitFor()

    // Read the pixels the page actually painted, then decode them the way a scanner would.
    const pixels = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="two-factor-qr"]') as HTMLCanvasElement | null
      if (!canvas) throw new Error('no QR on the page')
      const context = canvas.getContext('2d')
      if (!context) throw new Error('no 2d context')
      const data = context.getImageData(0, 0, canvas.width, canvas.height)
      return { data: Array.from(data.data), width: data.width, height: data.height }
    })

    const decoded = decodeQr(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)
    expect(decoded?.data).toBe(
      'otpauth://totp/Code%20Time%20Tracker:test@example.com?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=Code%20Time%20Tracker',
    )
    // The key shown for manual entry carries no padding either.
    await expect(page.getByTestId('two-factor-secret')).toHaveText('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP')
  })
})
