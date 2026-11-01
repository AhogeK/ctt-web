import { describe, expect, it } from 'vite-plus/test'
import {
  RecoveryCodesSchema,
  StartTotpSetupResponseSchema,
  TwoFactorCredentialSchema,
  TwoFactorStatusSchema,
} from '../two-factor.schema'

describe('TwoFactorStatusSchema', () => {
  it('reads the server payload, including a never-confirmed account', () => {
    expect(
      TwoFactorStatusSchema.parse({
        enabled: false,
        confirmedAt: null,
        recoveryCodesRemaining: 0,
        hasPassword: true,
        recentAuthentication: true,
      }),
    ).toEqual({
      enabled: false,
      confirmedAt: null,
      recoveryCodesRemaining: 0,
      hasPassword: true,
      recentAuthentication: true,
    })
  })

  it('refuses a payload without the recovery-code count', () => {
    const failure = TwoFactorStatusSchema.safeParse({
      enabled: true,
      confirmedAt: '2026-11-01T10:00:00Z',
      hasPassword: true,
      recentAuthentication: false,
    })
    expect(failure.success).toBe(false)
  })
})

describe('StartTotpSetupResponseSchema', () => {
  it('keeps the parameters an authenticator app needs', () => {
    const parsed = StartTotpSetupResponseSchema.parse({
      secret: 'JBSWY3DPEHPK3PXP',
      otpauthUri: 'otpauth://totp/Code%20Time%20Tracker:user@example.com?secret=JBSWY3DPEHPK3PXP',
      digits: 6,
      period: 30,
      issuer: 'Code Time Tracker',
      expiresAt: '2026-11-01T10:40:00Z',
    })

    expect(parsed.digits).toBe(6)
    expect(parsed.period).toBe(30)
    expect(parsed.otpauthUri.startsWith('otpauth://totp/')).toBe(true)
  })
})

describe('RecoveryCodesSchema', () => {
  const codes = Array.from({ length: 10 }, (_, index) => `CODE-0000-0000-000${index}`)

  it('accepts the batch of ten the server issues', () => {
    expect(RecoveryCodesSchema.parse({ recoveryCodes: codes }).recoveryCodes).toHaveLength(10)
  })

  it('refuses a short batch, because the server promises ten', () => {
    expect(RecoveryCodesSchema.safeParse({ recoveryCodes: codes.slice(0, 9) }).success).toBe(false)
  })
})

describe('TwoFactorCredentialSchema', () => {
  it('accepts a TOTP code alone', () => {
    expect(TwoFactorCredentialSchema.parse({ code: ' 123456 ' })).toEqual({ code: '123456' })
  })

  it('accepts a recovery code alone', () => {
    expect(TwoFactorCredentialSchema.parse({ recoveryCode: 'KYQV-BATK-MZVK-MMXO' })).toEqual({
      recoveryCode: 'KYQV-BATK-MZVK-MMXO',
    })
  })

  it('refuses an empty form and a form carrying both', () => {
    expect(TwoFactorCredentialSchema.safeParse({}).success).toBe(false)
    expect(TwoFactorCredentialSchema.safeParse({ code: '123456', recoveryCode: 'KYQV-BATK' }).success).toBe(false)
  })
})
