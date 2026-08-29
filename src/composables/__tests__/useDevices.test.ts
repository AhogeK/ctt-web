import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { ref } from 'vue'
import { useDevices, useRevokeDevice } from '../useDevices'
import * as devicesApi from '@/lib/api/devices'

vi.mock('@/lib/api/devices', () => ({
  listDevices: vi.fn<() => Promise<unknown>>(),
  revokeDevice: vi.fn<() => Promise<unknown>>(),
}))

const mockInvalidateQueries = vi.fn<(...args: unknown[]) => Promise<void>>()

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn<() => { invalidateQueries: typeof mockInvalidateQueries }>(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
  useMutation: vi.fn<(...args: unknown[]) => unknown>(),
  useQuery: vi.fn<(...args: unknown[]) => unknown>(),
}))

vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn<() => void>(), error: vi.fn<() => void>() },
}))

import { useMutation, useQuery } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

const mockUseMutation = vi.mocked(useMutation)
const mockUseQuery = vi.mocked(useQuery)
const mockToastSuccess = vi.mocked(toast.success)
const mockToastError = vi.mocked(toast.error)

type MutationConfig = {
  mutationFn?: (vars: { deviceId: string }) => Promise<unknown>
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

let mutationConfig: MutationConfig | null = null

function setupMutationMock() {
  mutationConfig = null
  // @ts-expect-error - mock implementation doesn't need to match exact TanStack Query types
  mockUseMutation.mockImplementation((config: MutationConfig) => {
    mutationConfig = config
    return {
      mutate: vi.fn<(vars: { deviceId: string }) => void>((vars: { deviceId: string }) => {
        const cfg = mutationConfig
        if (!cfg?.mutationFn) return
        return Promise.resolve()
          .then(() => cfg.mutationFn!(vars))
          .then(() => cfg.onSuccess?.())
          .catch((error: unknown) => cfg.onError?.(error))
      }),
      mutateAsync: vi.fn<(vars: { deviceId: string }) => Promise<unknown>>((vars: { deviceId: string }) => {
        const cfg = mutationConfig
        if (!cfg?.mutationFn) return Promise.resolve()
        return Promise.resolve()
          .then(() => cfg.mutationFn!(vars))
          .then(() => cfg.onSuccess?.())
          .catch((error: unknown) => {
            cfg.onError?.(error)
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
      data: ref(undefined),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
      isFetching: ref(false),
      isFetched: ref(false),
      refetch: vi.fn<() => Promise<unknown>>(),
    }
  })
}

const macDevice = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  deviceName: 'MacBook Pro',
  platform: 'macOS',
  ideName: 'IntelliJ IDEA',
  ideVersion: '2026.1',
  appVersion: '1.2.0',
  createdAt: '2026-08-29T16:13:47.695149Z',
  lastSeenAt: '2026-08-29T16:13:47.693590Z',
}

describe('useDevices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupQueryMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('queries the devices endpoint with the shared query key and 30s staleTime', () => {
    useDevices()

    expect(queryConfig?.queryKey).toEqual(['devices'])
    expect(queryConfig?.staleTime).toBe(1000 * 30)
  })

  it('fetches devices through listDevices', async () => {
    vi.mocked(devicesApi.listDevices).mockResolvedValue([macDevice])

    useDevices()
    const result = await queryConfig?.queryFn?.()

    expect(devicesApi.listDevices).toHaveBeenCalledTimes(1)
    expect(result).toEqual([macDevice])
  })
})

describe('useRevokeDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMutationMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mutation.mutate calls revokeDevice with the device id payload', async () => {
    vi.mocked(devicesApi.revokeDevice).mockResolvedValue(undefined)

    const { mutation } = useRevokeDevice()
    mutation.mutate({ deviceId: macDevice.id })

    await vi.waitFor(() => {
      expect(devicesApi.revokeDevice).toHaveBeenCalledWith(macDevice.id)
    })
  })

  it('invalidates the devices query on successful revoke', async () => {
    vi.mocked(devicesApi.revokeDevice).mockResolvedValue(undefined)

    const { mutation } = useRevokeDevice()
    mutation.mutate({ deviceId: macDevice.id })

    await vi.waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['devices'] })
    })
  })

  it('shows a success toast on successful revoke', async () => {
    vi.mocked(devicesApi.revokeDevice).mockResolvedValue(undefined)

    const { mutation } = useRevokeDevice()
    mutation.mutate({ deviceId: macDevice.id })

    await vi.waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Device revoked successfully')
    })
  })

  it('does not invalidate the query and shows an error toast when revokeDevice throws', async () => {
    vi.mocked(devicesApi.revokeDevice).mockRejectedValue({
      statusCode: 404,
      data: { code: 'COMMON_002', message: 'Device not found or access denied' },
    })

    const { mutation } = useRevokeDevice()
    mutation.mutate({ deviceId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' })

    await vi.waitFor(() => {
      expect(devicesApi.revokeDevice).toHaveBeenCalled()
    })

    // waitFor already flushed the microtask queue: the mutation's onError
    // (toast.error) ran without invalidating the devices query.
    expect(mockInvalidateQueries).not.toHaveBeenCalled()
    expect(mockToastError).toHaveBeenCalledTimes(1)
  })
})
