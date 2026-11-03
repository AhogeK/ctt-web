import { describe, expect, it } from 'vite-plus/test'
import { PasskeyAssertionOptionsSchema, PasskeyRegistrationOptionsSchema, PasskeySchema } from '../passkey.schema'

describe('passkey schemas', () => {
  it('reads an assertion challenge that carries no allowCredentials', () => {
    const parsed = PasskeyAssertionOptionsSchema.parse({
      challenge: 'abc',
      rpId: 'ctt.example.com',
      timeout: 60000,
      userVerification: 'required',
    })

    expect(parsed.rpId).toBe('ctt.example.com')
    expect(parsed.userVerification).toBe('required')
  })

  it('keeps the registration fields the page feeds to the browser', () => {
    const parsed = PasskeyRegistrationOptionsSchema.parse({
      challenge: 'abc',
      rp: { id: 'ctt.example.com', name: 'CTT' },
      user: { id: 'dXVpZA', name: 'me@example.com', displayName: 'Me' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      excludeCredentials: [{ type: 'public-key', id: 'existing', transports: ['internal'] }],
    })

    expect(parsed.excludeCredentials?.[0]?.id).toBe('existing')
  })

  it('rejects a verification requirement the browser would refuse', () => {
    const result = PasskeyAssertionOptionsSchema.safeParse({ challenge: 'a', rpId: 'r', userVerification: 'maybe' })
    expect(result.success).toBe(false)
  })

  it('keeps lastUsedAt present and null for a credential never used', () => {
    const parsed = PasskeySchema.parse({
      id: 'row-1',
      name: 'MacBook Pro',
      createdAt: '2026-11-03T10:00:00Z',
      lastUsedAt: null,
      transports: ['internal'],
      backupEligible: true,
      backupState: false,
    })

    expect(parsed.lastUsedAt).toBeNull()
  })
})
