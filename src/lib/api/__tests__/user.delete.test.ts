import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import { ZodError } from 'zod'
import { deleteAccount } from '@/lib/api/user'
import { apiFetch } from '@/lib/api/instance'

vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

/** The envelope every endpoint wraps its payload in. */
const okEnvelope = (data: unknown = {}) => ({
  success: true,
  message: 'Account deleted',
  data,
  timestamp: '2026-09-17T10:00:00Z',
})

describe('deleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiFetch).mockResolvedValue(okEnvelope())
  })

  it('sends DELETE to the caller’s own resource', async () => {
    await deleteAccount('hunter2')
    expect(vi.mocked(apiFetch)).toHaveBeenCalledWith('/api/v1/users/me', expect.objectContaining({ method: 'DELETE' }))
  })

  it('base64-encodes the password, matching every other password this client sends', async () => {
    // Pinned as a literal rather than recomputed through encodeBase64: the point of the assertion
    // is that the wire carries base64, and importing the same helper would assert nothing.
    await deleteAccount('hunter2')
    const body = vi.mocked(apiFetch).mock.calls[0]![1]!.body as { password: string }
    expect(body.password).toBe('aHVudGVyMg==')
    // The two ends only have to agree on the encoding; the server compares this string as-is.
    expect(body.password).not.toBe('hunter2')
  })

  it('sends an empty object — not an absent body — for an account with no password', async () => {
    // The controller declares `@Valid @RequestBody`, so a request without a body fails
    // deserialisation before any password logic runs. `{}` is the payload, not no payload.
    await deleteAccount(null)
    const [, options] = vi.mocked(apiFetch).mock.calls[0]! as [string, { body: unknown }]
    expect(options.body).toEqual({})
    expect(options.body).toBeDefined()
    expect(options.body).not.toHaveProperty('password')
  })

  it('rejects a password longer than the server accepts, before sending it', async () => {
    // The DTO bounds the field at 100 characters; base64 inflates, so a long password could exceed
    // it. Failing here is a local, reportable error rather than a 400 from the server.
    const tooLong = 'x'.repeat(101)
    const error = await deleteAccount(tooLong).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ZodError)
    expect(vi.mocked(apiFetch)).not.toHaveBeenCalled()
  })

  it('rejects a response whose envelope does not match', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ nope: true })
    const error = await deleteAccount('hunter2').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ZodError)
  })
})
