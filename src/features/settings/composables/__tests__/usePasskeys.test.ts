import { describe, expect, it, vi } from 'vitest'
import { PasskeyCeremonyCancelled, useDeletePasskey, useRegisterPasskey } from '../usePasskeys'

const mockRemember = vi.hoisted(() => vi.fn<() => void>())
const mockForget = vi.hoisted(() => vi.fn<() => void>())
const mockRegister = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>())
const mockDelete = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>())
const mockOptions = vi.hoisted(() => vi.fn<() => Promise<unknown>>())
const mockCache = vi.hoisted(() => ({ value: undefined as unknown }))

vi.mock('@/lib/utils/passkey-preference', () => ({
  rememberPasskeyUse: mockRemember,
  forgetPasskeyUse: mockForget,
}))
vi.mock('@/lib/api', () => ({
  fetchPasskeyRegistrationOptions: mockOptions,
  registerPasskey: mockRegister,
  fetchPasskeys: vi.fn<() => Promise<unknown>>(),
  renamePasskey: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  deletePasskey: mockDelete,
}))
vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn<() => void>(),
    getQueryData: () => mockCache.value,
  }),
  useMutation: (options: {
    mutationFn: (input: unknown) => Promise<unknown>
    onSuccess?: (data: unknown, input: unknown) => void
    onSettled?: () => void
  }) => ({
    mutate: async (input: unknown) => {
      const data = await options.mutationFn(input)
      options.onSuccess?.(data, input)
      options.onSettled?.()
    },
    isPending: { value: false },
  }),
}))

describe('useRegisterPasskey', () => {
  it('remembers the browser holds a credential once one is stored', async () => {
    mockOptions.mockResolvedValue({
      challenge: 'Y2hhbGxlbmdl',
      rp: { id: 'localhost', name: 'CTT' },
      user: { id: 'dXNlcg', name: 'me@example.com', displayName: 'Me' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    })
    mockRegister.mockResolvedValue({ id: 'row-1', name: 'Local' })
    vi.stubGlobal('navigator', {
      credentials: {
        create: vi.fn<() => Promise<unknown>>().mockResolvedValue({
          id: 'cred',
          rawId: new Uint8Array([1]).buffer,
          type: 'public-key',
          response: {
            clientDataJSON: new Uint8Array([2]).buffer,
            attestationObject: new Uint8Array([3]).buffer,
            getTransports: () => ['internal'],
          },
          getClientExtensionResults: () => ({}),
        }),
      },
    })

    // The mock's mutate settles synchronously and runs onSuccess/onSettled itself.
    await Promise.resolve(useRegisterPasskey().mutate('Local'))

    // The login page reads this flag to decide whether to open the picker on its own.
    expect(mockRemember).toHaveBeenCalledTimes(1)
  })

  it('treats a dismissed prompt as a decision, not a failure', async () => {
    mockOptions.mockResolvedValue({
      challenge: 'Y2hhbGxlbmdl',
      rp: { id: 'localhost', name: 'CTT' },
      user: { id: 'dXNlcg', name: 'me@example.com', displayName: 'Me' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    })
    // Dismissing the system prompt rejects; `create()` never resolves to null.
    vi.stubGlobal('navigator', {
      credentials: {
        create: vi.fn<() => Promise<unknown>>().mockRejectedValue(new DOMException('denied', 'NotAllowedError')),
      },
    })

    await expect(Promise.resolve(useRegisterPasskey().mutate('Local'))).rejects.toBeInstanceOf(PasskeyCeremonyCancelled)
    expect(mockRegister).not.toHaveBeenCalled()
    expect(mockRemember).not.toHaveBeenCalled()
  })
})

describe('useDeletePasskey', () => {
  it('stops offering the picker on load once the last credential is gone', async () => {
    mockDelete.mockResolvedValue(undefined)
    mockCache.value = [{ id: 'row-1' }]

    await Promise.resolve(useDeletePasskey().mutate('row-1'))

    expect(mockForget).toHaveBeenCalledTimes(1)
  })

  it('keeps offering it while another credential remains', async () => {
    mockDelete.mockResolvedValue(undefined)
    mockCache.value = [{ id: 'row-1' }, { id: 'row-2' }]

    await Promise.resolve(useDeletePasskey().mutate('row-1'))

    expect(mockForget).not.toHaveBeenCalled()
  })
})
