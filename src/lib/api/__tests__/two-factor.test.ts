import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { apiFetch } from '@/lib/api/instance'
import * as twoFactorApi from '@/lib/api/two-factor'

vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

const STATUS = {
  enabled: true,
  confirmedAt: '2026-11-01T10:00:00Z',
  recoveryCodesRemaining: 9,
  hasPassword: true,
  recentAuthentication: true,
}

const CODES = Array.from({ length: 10 }, (_, index) => `CODE-${index}`)

const envelope = (data: unknown) => ({
  success: true,
  message: 'Operation successful',
  timestamp: '2026-11-01T10:00:00Z',
  data,
})

describe('two-factor API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads the status from the account endpoint', async () => {
    vi.mocked(apiFetch).mockResolvedValue(envelope(STATUS))

    const status = await twoFactorApi.fetchTwoFactorStatus()

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/2fa', { method: 'GET' })
    expect(status.recoveryCodesRemaining).toBe(9)
  })

  it('sends the password base64-encoded when starting a setup', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      envelope({
        secret: 'JBSWY3DPEHPK3PXP',
        otpauthUri: 'otpauth://totp/x',
        digits: 6,
        period: 30,
        issuer: 'Code Time Tracker',
        expiresAt: '2026-11-01T10:40:00Z',
      }),
    )

    await twoFactorApi.startTotpSetup('SecurePass1!')

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/2fa/totp/start', {
      method: 'POST',
      body: { currentPassword: 'U2VjdXJlUGFzczEh' },
    })
  })

  it('starts without a password for an OAuth-only account', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      envelope({
        secret: 'JBSWY3DPEHPK3PXP',
        otpauthUri: 'otpauth://totp/x',
        digits: 6,
        period: 30,
        issuer: 'Code Time Tracker',
        expiresAt: '2026-11-01T10:40:00Z',
      }),
    )

    await twoFactorApi.startTotpSetup()

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/2fa/totp/start', {
      method: 'POST',
      body: {},
    })
  })

  it('confirms with the code and returns the recovery codes', async () => {
    vi.mocked(apiFetch).mockResolvedValue(envelope({ recoveryCodes: CODES }))

    const codes = await twoFactorApi.confirmTotpSetup('123456')

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/2fa/totp/confirm', {
      method: 'POST',
      body: { code: '123456' },
    })
    expect(codes).toHaveLength(10)
  })

  it('disables with either credential, on the bodiless 204 the server really sends', async () => {
    // `204 No Content`: ofetch resolves `undefined`. An envelope parser here would throw on success.
    vi.mocked(apiFetch).mockResolvedValue(undefined)

    await expect(twoFactorApi.disableTwoFactor({ code: '123456' })).resolves.toBeUndefined()
    expect(apiFetch).toHaveBeenLastCalledWith('/api/v1/users/me/2fa/disable', {
      method: 'POST',
      body: { code: '123456' },
    })

    await twoFactorApi.disableTwoFactor({ recoveryCode: 'KYQV-BATK' })
    expect(apiFetch).toHaveBeenLastCalledWith('/api/v1/users/me/2fa/disable', {
      method: 'POST',
      body: { recoveryCode: 'KYQV-BATK' },
    })
  })

  it('regenerates the recovery codes with either credential', async () => {
    vi.mocked(apiFetch).mockResolvedValue(envelope({ recoveryCodes: CODES }))

    const codes = await twoFactorApi.regenerateRecoveryCodes({ code: '123456' })

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/2fa/recovery-codes/regenerate', {
      method: 'POST',
      body: { code: '123456' },
    })
    expect(codes).toHaveLength(10)
  })
})
