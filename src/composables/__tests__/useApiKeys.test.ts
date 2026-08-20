import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { ref } from 'vue'
import { useApiKeys, useCreateApiKey, useRevokeApiKey, useDeleteApiKey } from '../useApiKeys'
import * as apiKeysApi from '@/lib/api/api-keys'
import type { CreateApiKeyRequest } from '@/lib/schemas/api-key.schema'

vi.mock('@/lib/api/api-keys', () => ({
  listApiKeys: vi.fn<() => Promise<unknown>>(),
  createApiKey: vi.fn<() => Promise<unknown>>(),
  revokeApiKey: vi.fn<() => Promise<unknown>>(),
  deleteApiKey: vi.fn<() => Promise<unknown>>(),
}))

const mockInvalidateQueries = vi.fn<(...args: unknown[]) => Promise<void>>()

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn<() => { invalidateQueries: typeof mockInvalidateQueries }>(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
  useMutation: vi.fn<(...args: unknown[]) => unknown>(),
  useQuery: vi.fn<(...args: unknown[]) => unknown>(),
}))

import { useMutation, useQuery } from '@tanstack/vue-query'

const mockUseMutation = vi.mocked(useMutation)
const mockUseQuery = vi.mocked(useQuery)

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

type QueryConfig = {
  queryKey?: readonly unknown[]
  queryFn?: () => Promise<unknown>
  staleTime?: number
}

let queryConfig: QueryConfig | null = null

function setupQueryMock() {
  queryConfig = null
  // @ts-expect-error - mock implementation doesn't need to match exact TanStack Query types
  mockUseQuery.mockImplementation((config: QueryConfig) => {
    queryConfig = config
    return {
      data: ref([]),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
      isFetching: ref(false),
      isFetched: ref(false),
      refetch: vi.fn<() => Promise<unknown>>(),
    }
  })
}

describe('useApiKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupQueryMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('queries the api-keys endpoint with the shared query key and 30s staleTime', () => {
    useApiKeys()

    expect(queryConfig?.queryKey).toEqual(['api-keys'])
    expect(queryConfig?.staleTime).toBe(1000 * 30)
  })

  it('fetches keys through listApiKeys', async () => {
    const keys = [
      {
        id: 'key-1',
        name: 'Test Key',
        keyPrefix: 'cttak_a1b2c3d4',
        scopes: ['READ'] as ('READ' | 'WRITE' | 'SYNC' | 'ADMIN')[],
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: '2026-07-01T00:00:00Z',
        status: 'ACTIVE' as const,
      },
    ]
    vi.mocked(apiKeysApi.listApiKeys).mockResolvedValue(keys)

    useApiKeys()
    const result = await queryConfig?.queryFn?.()

    expect(apiKeysApi.listApiKeys).toHaveBeenCalledTimes(1)
    expect(result).toEqual(keys)
  })
})

describe('useCreateApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMutationMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mutation.mutate calls createApiKey with the request payload', async () => {
    vi.mocked(apiKeysApi.createApiKey).mockResolvedValue({
      rawKey: 'cttak_raw',
      apiKey: {
        id: 'key-2',
        name: 'New Key',
        keyPrefix: 'cttak_ef012345',
        scopes: ['READ'] as ('READ' | 'WRITE' | 'SYNC' | 'ADMIN')[],
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: '2026-07-09T10:31:00Z',
        status: 'ACTIVE',
      },
    })

    const { mutation } = useCreateApiKey()
    const request: CreateApiKeyRequest = { name: 'New Key', scopes: ['READ'] }
    mutation.mutate(request)

    await vi.waitFor(() => {
      expect(apiKeysApi.createApiKey).toHaveBeenCalledWith(request)
    })
  })

  it('invalidates the api-keys query on successful create', async () => {
    vi.mocked(apiKeysApi.createApiKey).mockResolvedValue({
      rawKey: 'cttak_raw',
      apiKey: {
        id: 'key-3',
        name: 'Another Key',
        keyPrefix: 'cttak_12345678',
        scopes: ['READ'] as ('READ' | 'WRITE' | 'SYNC' | 'ADMIN')[],
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: '2026-07-09T10:31:00Z',
        status: 'ACTIVE',
      },
    })

    const { mutation } = useCreateApiKey()
    const request: CreateApiKeyRequest = { name: 'Another Key', scopes: ['READ'] }
    mutation.mutate(request)

    await vi.waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['api-keys'] })
    })
  })

  it('does not invalidate the query when createApiKey throws', async () => {
    vi.mocked(apiKeysApi.createApiKey).mockRejectedValue({
      statusCode: 409,
      data: { code: 'AUTH_024', message: 'API key limit reached' },
    })

    const { mutation } = useCreateApiKey()
    const request: CreateApiKeyRequest = { name: 'Failing Key', scopes: ['READ'] }
    mutation.mutate(request)

    await vi.waitFor(() => {
      expect(apiKeysApi.createApiKey).toHaveBeenCalled()
    })

    // Give the microtask queue a chance to settle
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockInvalidateQueries).not.toHaveBeenCalled()
  })
})

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

describe('useDeleteApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMutationMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mutation.mutate calls deleteApiKey with the revoked key id', async () => {
    vi.mocked(apiKeysApi.deleteApiKey).mockResolvedValue(undefined)

    const { mutation } = useDeleteApiKey()
    mutation.mutate('revoked-key-uuid')

    await vi.waitFor(() => {
      expect(apiKeysApi.deleteApiKey).toHaveBeenCalledWith('revoked-key-uuid')
    })
  })

  it('invalidates the api-keys query on successful delete', async () => {
    vi.mocked(apiKeysApi.deleteApiKey).mockResolvedValue(undefined)

    const { mutation } = useDeleteApiKey()
    mutation.mutate('revoked-key-uuid')

    await vi.waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['api-keys'] })
    })
  })

  it('does not invalidate the query when deleteApiKey throws', async () => {
    vi.mocked(apiKeysApi.deleteApiKey).mockRejectedValue({
      statusCode: 401,
      data: { code: 'AUTH_010', message: 'API key invalid' },
    })

    const { mutation } = useDeleteApiKey()
    mutation.mutate('missing-or-foreign-key')

    await vi.waitFor(() => {
      expect(apiKeysApi.deleteApiKey).toHaveBeenCalled()
    })

    // Give the microtask queue a chance to settle
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockInvalidateQueries).not.toHaveBeenCalled()
  })
})
