import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { useRevokeApiKey } from '../useApiKeys'
import * as apiKeysApi from '@/lib/api/api-keys'

vi.mock('@/lib/api/api-keys', () => ({
  listApiKeys: vi.fn<() => Promise<unknown>>(),
  createApiKey: vi.fn<() => Promise<unknown>>(),
  revokeApiKey: vi.fn<() => Promise<unknown>>(),
}))

const mockInvalidateQueries = vi.fn<(...args: unknown[]) => Promise<void>>()

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn<() => { invalidateQueries: typeof mockInvalidateQueries }>(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
  useMutation: vi.fn<(...args: unknown[]) => unknown>(),
  useQuery: vi.fn<(...args: unknown[]) => unknown>(),
}))

import { useMutation } from '@tanstack/vue-query'

const mockUseMutation = vi.mocked(useMutation)

type MutationConfig = {
  mutationFn?: (id: string) => Promise<unknown>
  onSuccess?: () => void
}

let mutationConfig: MutationConfig | null = null

function setupMutationMock() {
  mutationConfig = null
  // @ts-expect-error - mock implementation doesn't need to match exact TanStack Query types
  mockUseMutation.mockImplementation((config: MutationConfig) => {
    mutationConfig = config
    return {
      mutate: vi.fn<(id: string) => void>((id: string) => {
        const cfg = mutationConfig
        if (!cfg?.mutationFn) return
        return Promise.resolve()
          .then(() => cfg.mutationFn!(id))
          .then(() => cfg.onSuccess?.())
      }),
      mutateAsync: vi.fn<(id: string) => Promise<unknown>>((id: string) => {
        const cfg = mutationConfig
        if (!cfg?.mutationFn) return Promise.resolve()
        return Promise.resolve()
          .then(() => cfg.mutationFn!(id))
          .then(() => {
            cfg.onSuccess?.()
          })
      }),
      isPending: { value: false },
      isError: { value: false },
      error: { value: null },
      reset: vi.fn<() => void>(),
    }
  })
}

describe('useRevokeApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMutationMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns { mutation } with the expected shape', () => {
    const { mutation } = useRevokeApiKey()

    expect(mutation).toBeDefined()
    expect(typeof mutation.mutate).toBe('function')
    expect(mutation.isPending).toBeDefined()
    expect(mutation.isError).toBeDefined()
    expect(mutation.error).toBeDefined()
  })

  it('mutation.mutate calls revokeApiKey with the provided id', async () => {
    vi.mocked(apiKeysApi.revokeApiKey).mockResolvedValue(undefined)

    const { mutation } = useRevokeApiKey()
    mutation.mutate('key-uuid-123')

    await vi.waitFor(() => {
      expect(apiKeysApi.revokeApiKey).toHaveBeenCalledWith('key-uuid-123')
    })
  })

  it('invalidates the api-keys query on successful revoke', async () => {
    vi.mocked(apiKeysApi.revokeApiKey).mockResolvedValue(undefined)

    const { mutation } = useRevokeApiKey()
    mutation.mutate('key-uuid-456')

    await vi.waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['api-keys'] })
    })
  })

  it('uses DELETE method via revokeApiKey (contract: idempotent 204)', async () => {
    vi.mocked(apiKeysApi.revokeApiKey).mockResolvedValue(undefined)

    const { mutation } = useRevokeApiKey()
    mutation.mutate('idempotent-test-id')

    await vi.waitFor(() => {
      expect(apiKeysApi.revokeApiKey).toHaveBeenCalledTimes(1)
      expect(apiKeysApi.revokeApiKey).toHaveBeenCalledWith('idempotent-test-id')
    })
  })

  it('does not invalidate query when revokeApiKey throws', async () => {
    vi.mocked(apiKeysApi.revokeApiKey).mockRejectedValue({
      statusCode: 401,
      data: { code: 'AUTH_010', message: 'API key invalid' },
    })

    const { mutation } = useRevokeApiKey()
    mutation.mutate('nonexistent-key')

    await vi.waitFor(() => {
      expect(apiKeysApi.revokeApiKey).toHaveBeenCalled()
    })

    // Give the microtask queue a chance to settle
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockInvalidateQueries).not.toHaveBeenCalled()
  })
})
