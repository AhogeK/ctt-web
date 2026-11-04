import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { assertSecondFactorPasskey, fetchSecondFactorPasskeyOptions } from '@/lib/api'
import { useSecondFactorPasskey } from '../useSecondFactorPasskey'

const mockRemember = vi.hoisted(() => vi.fn<() => void>())
vi.mock('@/lib/utils/passkey-preference', () => ({ rememberPasskeyUse: mockRemember }))

vi.mock('@/lib/api', () => ({
  fetchSecondFactorPasskeyOptions: vi.fn<() => Promise<unknown>>(),
  assertSecondFactorPasskey: vi.fn<() => Promise<unknown>>(),
}))

const OPTIONS = {
  challenge: 'Y2hhbGxlbmdl',
  rpId: 'ctt.example.com',
  userVerification: 'required' as const,
  allowCredentials: [{ type: 'public-key' as const, id: 'Y3JlZA', transports: ['internal'] }],
}

function credential(overrides: Partial<PublicKeyCredential> = {}) {
  return {
    id: 'Y3JlZA',
    rawId: new Uint8Array([1, 2, 3]).buffer,
    type: 'public-key',
    response: {
      clientDataJSON: new Uint8Array([4]).buffer,
      authenticatorData: new Uint8Array([5]).buffer,
      signature: new Uint8Array([6]).buffer,
      userHandle: null,
    },
    getClientExtensionResults: () => ({}),
    ...overrides,
  } as unknown as PublicKeyCredential
}

describe('useSecondFactorPasskey', () => {
  it('asks the authenticator first and only then the account’s own list', async () => {
    const get = vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValueOnce(credential())
    vi.stubGlobal('navigator', { credentials: { get } })

    await useSecondFactorPasskey().signIn('challenge-token')

    // The first call names no credentials: a stale list from the server would leave the browser
    // waiting for a key the reader may not even have, which looks like a dead button.
    const first = get.mock.calls[0]?.[0] as { publicKey: { allowCredentials?: unknown } }
    expect(first.publicKey.allowCredentials).toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('falls back to the named list when nothing resident answers', async () => {
    const get = vi
      .fn<(...args: unknown[]) => Promise<unknown>>()
      .mockRejectedValueOnce(new DOMException('nothing resident', 'NotAllowedError'))
      .mockResolvedValueOnce(credential())
    vi.stubGlobal('navigator', { credentials: { get } })

    const result = await useSecondFactorPasskey().signIn('challenge-token')

    expect(result).toEqual({ accessToken: 'access' })
    const second = get.mock.calls[1]?.[0] as { publicKey: { allowCredentials?: unknown[] } }
    expect(second.publicKey.allowCredentials).toHaveLength(1)
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchSecondFactorPasskeyOptions).mockResolvedValue(OPTIONS)
    vi.mocked(assertSecondFactorPasskey).mockResolvedValue({ accessToken: 'access' } as never)
  })

  it('names the challenge’s own credentials, byte for byte, when the fallback runs', async () => {
    const get = vi
      .fn<(options: unknown) => Promise<unknown>>()
      .mockRejectedValueOnce(new DOMException('nothing resident', 'NotAllowedError'))
      .mockResolvedValueOnce(credential())
    vi.stubGlobal('navigator', { credentials: { get } })

    await useSecondFactorPasskey().signIn('challenge-token')

    const request = get.mock.calls[1]?.[0] as {
      publicKey: { allowCredentials: Array<{ id: ArrayBuffer }> }
    }
    // 'Y3JlZA' decodes to the four bytes of the id the server named, unchanged.
    expect(Array.from(new Uint8Array(request.publicKey.allowCredentials[0]!.id))).toEqual([99, 114, 101, 100])
    vi.unstubAllGlobals()
  })

  it('sends the assertion back with the challenge it answers', async () => {
    vi.stubGlobal('navigator', {
      credentials: { get: vi.fn<() => Promise<unknown>>().mockResolvedValue(credential()) },
    })
    const wrapper = useSecondFactorPasskey()

    await wrapper.signIn('challenge-token')

    expect(assertSecondFactorPasskey).toHaveBeenCalledWith(
      'challenge-token',
      expect.objectContaining({ id: 'Y3JlZA', type: 'public-key' }),
    )
  })

  it('remembers the success so the login page can offer it next time', async () => {
    vi.stubGlobal('navigator', {
      credentials: { get: vi.fn<() => Promise<unknown>>().mockResolvedValue(credential()) },
    })

    await useSecondFactorPasskey().signIn('challenge-token')

    expect(mockRemember).toHaveBeenCalledTimes(1)
  })

  it('keeps the failure code so the page can explain it', async () => {
    vi.stubGlobal('navigator', {
      credentials: { get: vi.fn<() => Promise<unknown>>().mockResolvedValue(credential()) },
    })
    vi.mocked(assertSecondFactorPasskey).mockRejectedValue({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Passkey verification failed',
      data: { code: 'AUTH_033' },
    })
    const wrapper = useSecondFactorPasskey()

    const response = await wrapper.signIn('challenge-token')

    expect(response).toBeNull()
    expect(wrapper.errorCode.value).toBe('AUTH_033')
  })

  it('treats a dismissed prompt as no attempt at all', async () => {
    vi.stubGlobal('navigator', {
      credentials: {
        get: vi.fn<() => Promise<unknown>>().mockRejectedValue(new DOMException('cancelled', 'NotAllowedError')),
      },
    })
    const wrapper = useSecondFactorPasskey()

    const response = await wrapper.signIn('challenge-token')

    expect(response).toBeNull()
    expect(wrapper.errorCode.value).toBeNull()
  })
})
