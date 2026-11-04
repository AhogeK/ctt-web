import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

const mockOptions = vi.hoisted(() => vi.fn<() => Promise<unknown>>())
const mockAssert = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>())

vi.mock('@/lib/api', () => ({
  fetchPasskeyAssertionOptions: mockOptions,
  assertPasskey: mockAssert,
}))
vi.mock('@/lib/utils/passkey-preference', () => ({ rememberPasskeyUse: vi.fn<() => void>() }))

import { usePasskeySignIn } from '../usePasskeySignIn'

/** A `get()` that only settles when its signal aborts, like a conditional request that waits. */
function pendingUntilAborted() {
  return vi.fn<(...args: unknown[]) => Promise<unknown>>(
    (options: unknown) =>
      new Promise((_resolve, reject) => {
        const { signal } = options as { signal?: AbortSignal }
        signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
      }),
  )
}

/** The options object the ceremony handed to `get()` in one call. */
function callOptions(get: ReturnType<typeof pendingUntilAborted>, index: number) {
  const args = get.mock.calls[index]
  if (!args) throw new Error(`get() was not called ${index + 1} time(s)`)
  return args[0] as { mediation: string; signal: AbortSignal }
}

function useInComponent() {
  let api: ReturnType<typeof usePasskeySignIn> | undefined
  mount(
    defineComponent({
      setup() {
        api = usePasskeySignIn()
        return () => null
      },
    }),
  )
  if (!api) throw new Error('the composable did not run')
  return api
}

/** The smallest credential the serialiser accepts. */
function credentialStub() {
  const bytes = new Uint8Array([1]).buffer
  return {
    id: 'cred',
    rawId: bytes,
    type: 'public-key',
    response: {
      clientDataJSON: bytes,
      authenticatorData: bytes,
      signature: bytes,
      userHandle: null,
    },
    getClientExtensionResults: () => ({}),
  }
}

function apiError(code: string) {
  return { statusCode: 401, statusMessage: 'Unauthorized', message: code, data: { code } }
}

describe('usePasskeySignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOptions.mockResolvedValue({ challenge: 'Y2hhbGxlbmdl', rpId: 'localhost' })
    Object.defineProperty(globalThis, 'PublicKeyCredential', {
      configurable: true,
      writable: true,
      value: class {},
    })
  })

  it('leaves the explicit button usable while the field waits for an entry', async () => {
    const get = pendingUntilAborted()
    vi.stubGlobal('navigator', { credentials: { get } })
    const api = useInComponent()

    void api.signIn('conditional')
    await flushPromises()

    // The conditional request stays open for the life of the page; reporting it as a pending
    // attempt would disable the button for good.
    expect(api.pending.value).toBe(false)
    expect(get).toHaveBeenCalledTimes(1)
    expect(callOptions(get, 0).mediation).toBe('conditional')
  })

  it('drops the waiting conditional request when the button asks directly', async () => {
    // The first request parks until aborted; the second is the reader dismissing the prompt.
    const get = pendingUntilAborted()
    get.mockImplementationOnce(
      (options: unknown) =>
        new Promise((_resolve, reject) => {
          const { signal } = options as { signal?: AbortSignal }
          signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'))
          })
        }),
    )
    get.mockResolvedValueOnce(null)
    vi.stubGlobal('navigator', { credentials: { get } })
    const api = useInComponent()

    void api.signIn('conditional')
    await flushPromises()
    const conditionalSignal = callOptions(get, 0).signal

    const explicit = api.signIn('optional')
    expect(api.pending.value).toBe(true)
    expect(conditionalSignal.aborted).toBe(true)

    expect(await explicit).toBeNull()
    await flushPromises()
    expect(callOptions(get, 1).mediation).toBe('optional')
    // The button can be pressed again: the flag is not stuck after an aborted conditional request.
    expect(api.pending.value).toBe(false)
  })

  it('asks for a fresh challenge and retries once when the server rejects a stale one', async () => {
    vi.stubGlobal('navigator', {
      credentials: { get: vi.fn<() => Promise<unknown>>().mockResolvedValue(credentialStub()) },
    })
    mockAssert.mockRejectedValueOnce(apiError('AUTH_032')).mockResolvedValueOnce({ accessToken: 'fresh' })
    const api = useInComponent()

    // The challenge outlives the reader's typing, so an expired one is not a failed attempt.
    expect(await api.signIn('optional')).toEqual({ accessToken: 'fresh' })
    expect(mockOptions).toHaveBeenCalledTimes(2)
    expect(mockAssert).toHaveBeenCalledTimes(2)
    expect(api.errorCode.value).toBeNull()
  })

  it('reports other refusals without asking a second time', async () => {
    vi.stubGlobal('navigator', {
      credentials: { get: vi.fn<() => Promise<unknown>>().mockResolvedValue(credentialStub()) },
    })
    mockAssert.mockRejectedValue(apiError('AUTH_033'))
    const api = useInComponent()

    expect(await api.signIn('optional')).toBeNull()
    expect(mockAssert).toHaveBeenCalledTimes(1)
    expect(api.errorCode.value).toBe('AUTH_033')
  })

  it('leaves no waiting ceremony behind when another attempt starts', async () => {
    // The conditional request parks until aborted; the explicit one dismisses immediately.
    const get = pendingUntilAborted()
    get.mockImplementationOnce(
      (options: unknown) =>
        new Promise((_resolve, reject) => {
          const { signal } = options as { signal?: AbortSignal }
          signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'))
          })
        }),
    )
    get.mockResolvedValueOnce(null)
    vi.stubGlobal('navigator', { credentials: { get } })
    const api = useInComponent()

    void api.signIn('conditional')
    await flushPromises()
    const conditionalSignal = callOptions(get, 0).signal

    await api.signIn('optional')
    await flushPromises()

    // Two ceremonies in one browser is not allowed: the browser refuses the second with no prompt,
    // and a request left behind by a page the reader already left does exactly that to the next page.
    expect(conditionalSignal.aborted).toBe(true)
  })

  it('aborts everything still waiting when the page goes away', async () => {
    const get = pendingUntilAborted()
    vi.stubGlobal('navigator', { credentials: { get } })

    let composer: ReturnType<typeof usePasskeySignIn> | undefined
    const wrapper = mount(
      defineComponent({
        setup() {
          composer = usePasskeySignIn()
          return () => null
        },
      }),
    )
    if (!composer) throw new Error('the composable did not run')

    void composer.signIn('conditional')
    await flushPromises()
    const signal = callOptions(get, 0).signal

    wrapper.unmount()
    await flushPromises()

    // A request outliving its page would block the ceremony on the page the reader moved to.
    expect(signal.aborted).toBe(true)
  })

  it('arms the field-driven request once, however often the field is focused', async () => {
    const get = pendingUntilAborted()
    vi.stubGlobal('navigator', { credentials: { get } })
    const api = useInComponent()

    void api.signIn('conditional')
    await flushPromises()
    void api.signIn('conditional')
    await flushPromises()

    expect(get).toHaveBeenCalledTimes(1)
  })
})
