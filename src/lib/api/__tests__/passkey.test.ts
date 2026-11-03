import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { apiFetch } from '@/lib/api/instance'
import * as passkeyApi from '@/lib/api/passkey'

vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

const envelope = (data: unknown) => ({
  success: true,
  message: 'Operation successful',
  timestamp: '2026-11-03T10:00:00Z',
  data,
})

const ASSERTION_OPTIONS = {
  publicKey: { challenge: 'abc', rpId: 'ctt.example.com', timeout: 60000, userVerification: 'required' },
}

const CREDENTIAL = {
  id: 'cred-1',
  rawId: 'AQID',
  type: 'public-key' as const,
  response: {
    clientDataJSON: 'BAU',
    authenticatorData: 'Bgc',
    signature: 'CAk',
    userHandle: null,
  },
  clientExtensionResults: {},
}

const PASSKEY = {
  id: 'row-1',
  name: 'MacBook Pro',
  createdAt: '2026-11-03T10:00:00Z',
  lastUsedAt: null,
  transports: ['internal'],
  backupEligible: true,
  backupState: true,
}

describe('passkey api', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset()
  })

  it('unwraps the publicKey envelope the browser needs', async () => {
    vi.mocked(apiFetch).mockResolvedValue(envelope(ASSERTION_OPTIONS))

    const options = await passkeyApi.fetchPasskeyAssertionOptions()

    expect(options.challenge).toBe('abc')
    expect(options.rpId).toBe('ctt.example.com')
  })

  it('posts the assertion and returns the sign-in response', async () => {
    vi.mocked(apiFetch).mockResolvedValue(envelope({ accessToken: 'access', refreshToken: 'refresh', expiresIn: 900 }))

    const result = await passkeyApi.assertPasskey(CREDENTIAL)

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/passkey/assert', {
      method: 'POST',
      body: { credential: CREDENTIAL },
    })
    expect(result.accessToken).toBe('access')
  })

  it('omits the name when the reader kept the default', async () => {
    vi.mocked(apiFetch).mockResolvedValue(envelope(PASSKEY))

    await passkeyApi.registerPasskey(CREDENTIAL)

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/passkey', {
      method: 'POST',
      body: { credential: CREDENTIAL },
    })
  })

  it('sends the label the reader typed', async () => {
    vi.mocked(apiFetch).mockResolvedValue(envelope(PASSKEY))

    await passkeyApi.registerPasskey(CREDENTIAL, 'Work laptop')

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/passkey', {
      method: 'POST',
      body: { credential: CREDENTIAL, name: 'Work laptop' },
    })
  })

  it('reads the list as an array', async () => {
    vi.mocked(apiFetch).mockResolvedValue(envelope([PASSKEY]))

    const list = await passkeyApi.fetchPasskeys()

    expect(list).toHaveLength(1)
    expect(list[0]?.name).toBe('MacBook Pro')
  })

  it('renames through the row id', async () => {
    vi.mocked(apiFetch).mockResolvedValue(envelope({ ...PASSKEY, name: 'Home' }))

    const updated = await passkeyApi.renamePasskey('row-1', 'Home')

    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/passkey/row-1', {
      method: 'PATCH',
      body: { name: 'Home' },
    })
    expect(updated.name).toBe('Home')
  })

  it('deletes without parsing a body', async () => {
    vi.mocked(apiFetch).mockResolvedValue(undefined)

    await expect(passkeyApi.deletePasskey('row-1')).resolves.toBeUndefined()
    expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/me/passkey/row-1', { method: 'DELETE' })
  })
})
