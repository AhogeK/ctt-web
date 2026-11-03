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
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchSecondFactorPasskeyOptions).mockResolvedValue(OPTIONS)
    vi.mocked(assertSecondFactorPasskey).mockResolvedValue({ accessToken: 'access' } as never)
  })

  it('names only the credentials the challenge belongs to', async () => {
    const get = vi.fn<(options: unknown) => Promise<unknown>>().mockResolvedValue(credential())
    vi.stubGlobal('navigator', { credentials: { get } })

    await useSecondFactorPasskey().signIn('challenge-token')

    const request = get.mock.calls[0]?.[0] as {
      publicKey: { allowCredentials: Array<{ id: ArrayBuffer }> }
    }
    // 'Y3JlZA' decodes to the four bytes of the id the server named, unchanged.
    expect(Array.from(new Uint8Array(request.publicKey.allowCredentials[0]!.id))).toEqual([99, 114, 101, 100])
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
