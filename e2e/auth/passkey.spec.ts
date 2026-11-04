import { test, expect, type Page } from '@playwright/test'
import { generateKeyPairSync } from 'node:crypto'
import { LOGIN_SUCCESS_RESPONSE } from '../mocks/handlers/auth.js'
import { mockAuthApis, okEnvelope } from '../utils/auth-helpers.js'

/**
 * Passkey sign-in and enrolment against a virtual authenticator.
 *
 * A real fingerprint sensor cannot be automated, and a mocked `credentials.get()` would prove
 * nothing about the ceremony, so Chromium's WebAuthn domain supplies an authenticator that really
 * signs. The API is still mocked: the server's own verification is covered by its tests, and the
 * page's job is to send the credential it produced in the shape the server reads.
 */

const LOGIN_PATH = '/auth/login'
const DASHBOARD_PATH = '/dashboard'

/**
 * The virtual authenticator's credential id.
 *
 * CDP takes standard base64, the wire format is base64url: same bytes, two spellings. The
 * authenticator matches on bytes, so both spellings describe one credential.
 */
const SEEDED_CREDENTIAL_BYTES = Buffer.from('seeded-credential-1')
const SEEDED_CREDENTIAL_ID_CDP = SEEDED_CREDENTIAL_BYTES.toString('base64')
const SEEDED_CREDENTIAL_ID_URL = SEEDED_CREDENTIAL_BYTES.toString('base64url')

const REGISTERED_PASSKEY = {
  id: 'row-1',
  name: 'Playwright device',
  createdAt: '2026-11-03T10:00:00Z',
  lastUsedAt: null,
  transports: ['internal'],
  backupEligible: true,
  backupState: false,
}

async function installVirtualAuthenticator(page: Page): Promise<void> {
  const session = await page.context().newCDPSession(page)
  await session.send('WebAuthn.enable')
  const { authenticatorId } = await session.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  })

  // A brand-new authenticator holds nothing, and a discoverable sign-in names no credential to
  // look for — so the browser would wait forever. Seeding one is what makes the ceremony real:
  // it signs a challenge with a key the test generated.
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  await session.send('WebAuthn.addCredential', {
    authenticatorId,
    credential: {
      credentialId: SEEDED_CREDENTIAL_ID_CDP,
      isResidentCredential: true,
      rpId: 'localhost',
      privateKey: privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64'),
      userHandle: Buffer.from('user-1').toString('base64'),
      signCount: 1,
    },
  })
}

/** Mocks a password step that owes a second factor, plus the passkey endpoints for that step. */
async function installPasskeySecondStepApi(page: Page): Promise<void> {
  await mockAuthApis(page)
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 202,
      json: okEnvelope({
        twoFactorRequired: true,
        challengeToken: 'challenge-token',
        expiresIn: 300,
        passkeyCount: 2,
      }),
    }),
  )
  await page.route('**/api/v1/auth/2fa/passkey/options', (route) =>
    route.fulfill({
      json: okEnvelope({
        publicKey: {
          challenge: 'bW9jay1jaGFsbGVuZ2U',
          rpId: 'localhost',
          timeout: 60000,
          userVerification: 'required',
          allowCredentials: [{ type: 'public-key', id: SEEDED_CREDENTIAL_ID_URL, transports: ['internal'] }],
        },
      }),
    }),
  )
  await page.route('**/api/v1/auth/2fa/passkey/assert', (route) => route.fulfill({ json: LOGIN_SUCCESS_RESPONSE }))
}

/** Mocks the passkey endpoints on top of the shared auth mocks. */
async function installPasskeyApi(page: Page): Promise<void> {
  // No refresh override here: both tests start without a session, and the guarded page is visited
  // after signing in — a refresh the mock answers 401 to would expire the session mid-test.
  await mockAuthApis(page)

  await page.route('**/api/v1/auth/passkey/options', (route) =>
    route.fulfill({
      json: okEnvelope({
        publicKey: {
          challenge: 'bW9jay1jaGFsbGVuZ2U',
          rpId: 'localhost',
          timeout: 60000,
          userVerification: 'required',
        },
      }),
    }),
  )

  await page.route('**/api/v1/auth/passkey/assert', (route) => route.fulfill({ json: LOGIN_SUCCESS_RESPONSE }))

  // The page gates the add button on session freshness, which the second-factor status reports.
  await page.route('**/api/v1/users/me/2fa**', (route) =>
    route.fulfill({
      json: okEnvelope({
        enabled: false,
        confirmedAt: null,
        recoveryCodesRemaining: 0,
        hasPassword: true,
        recentAuthentication: true,
      }),
    }),
  )

  await page.route('**/api/v1/users/me/passkey/options', (route) =>
    route.fulfill({
      json: okEnvelope({
        publicKey: {
          challenge: 'bW9jay1jaGFsbGVuZ2U',
          rp: { id: 'localhost', name: 'CTT' },
          user: { id: 'dXNlci0x', name: 'test@example.com', displayName: 'Test User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          timeout: 60000,
          attestation: 'none',
          authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
          excludeCredentials: [],
        },
      }),
    }),
  )

  // The list has to reflect the registration, or the page would be re-reading the same empty
  // answer it started with.
  const registered: unknown[] = []
  await page.route('**/api/v1/users/me/passkey', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: okEnvelope(registered) })
      return
    }
    registered.push(REGISTERED_PASSKEY)
    await route.fulfill({ status: 201, json: okEnvelope(REGISTERED_PASSKEY) })
  })
}

test.describe('Passkey as the second step', () => {
  test('still signs in when the server’s list of credentials is stale', async ({ page }) => {
    await installVirtualAuthenticator(page)
    await installPasskeySecondStepApi(page)

    // The record disagrees with the device: a different id, and a transport this reader does not
    // have. Naming that list would leave the browser waiting for a key that never arrives.
    await page.unroute('**/api/v1/auth/2fa/passkey/options')
    await page.route('**/api/v1/auth/2fa/passkey/options', (route) =>
      route.fulfill({
        json: okEnvelope({
          publicKey: {
            challenge: 'bW9jay1jaGFsbGVuZ2U',
            rpId: 'localhost',
            timeout: 60000,
            userVerification: 'required',
            allowCredentials: [
              {
                type: 'public-key',
                id: Buffer.from('a-different-credential').toString('base64url'),
                transports: ['usb'],
              },
            ],
          },
        }),
      }),
    )

    await page.goto(LOGIN_PATH)
    await page.getByPlaceholder('you@example.com').fill('test@example.com')
    await page.getByPlaceholder('Enter your password').fill('SecurePass1!')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.waitForURL('**/auth/login/2fa')

    await page.getByTestId('two-factor-passkey').click()

    // The authenticator offers what it holds; the server decides whether it belongs to the account.
    await page.waitForURL(/\/dashboard$/)
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('answers the challenge with a passkey and skips the code', async ({ page }) => {
    await installVirtualAuthenticator(page)
    await installPasskeySecondStepApi(page)

    // The password step answers 202 with a challenge that says how many credentials could answer.
    await page.goto(LOGIN_PATH)
    await page.getByPlaceholder('you@example.com').fill('test@example.com')
    await page.getByPlaceholder('Enter your password').fill('SecurePass1!')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.waitForURL('**/auth/login/2fa')

    await page.getByTestId('two-factor-passkey').click()

    await page.waitForURL(/\/dashboard$/)
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})

test.describe('Passkey', () => {
  test('signs in from the login button without a code step', async ({ page }) => {
    await installVirtualAuthenticator(page)
    await installPasskeyApi(page)
    await page.goto(LOGIN_PATH)

    await page.getByTestId('passkey-sign-in').click()

    // The response is the ordinary sign-in: straight to the dashboard, no second step in between.
    await page.waitForURL(`**${DASHBOARD_PATH}`)
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('registers a passkey from the security page and lists it', async ({ page }) => {
    await installVirtualAuthenticator(page)
    await installPasskeyApi(page)
    // Signing in with the passkey rather than the password form: with a credential present, focusing
    // the username field is itself a sign-in (that is what conditional autofill does), so the
    // password path would race the ceremony it triggers.
    await page.goto(LOGIN_PATH)
    await page.getByTestId('passkey-sign-in').click()
    await page.waitForURL(`**${DASHBOARD_PATH}`)

    await page.goto('/settings/security')
    await page.getByTestId('passkey-add').click()
    await page.getByTestId('passkey-name').fill('Playwright device')
    await page.getByTestId('passkey-name-submit').click()

    // The list is re-read from the server after a successful ceremony.
    await expect(page.getByTestId('passkey-row')).toHaveCount(1)
    await expect(page.getByTestId('passkey-row').first()).toContainText('Playwright device')
  })
})
