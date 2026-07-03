import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { useEmailStatus } from '../useEmailStatus'
import * as emailApi from '@/lib/api/email'
import type { EmailStatus } from '@/lib/api/email'

vi.mock('@/lib/api/email', () => ({
  fetchEmailStatus: vi.fn<() => Promise<unknown>>(),
}))

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn<(...args: unknown[]) => void>(),
    error: vi.fn<(...args: unknown[]) => void>(),
    info: vi.fn<(...args: unknown[]) => void>(),
  },
}))

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn<() => { invalidateQueries: () => Promise<void> }>(() => ({
    invalidateQueries: vi.fn<() => Promise<void>>(),
  })),
  useMutation: vi.fn<(...args: unknown[]) => unknown>(),
  useQuery: vi.fn<(...args: unknown[]) => unknown>(),
}))

import { useQuery } from '@tanstack/vue-query'

const mockUseQuery = vi.mocked(useQuery)

type QueryOptions = {
  queryKey: readonly unknown[]
  queryFn?: () => Promise<unknown>
  staleTime?: number
  refetchOnWindowFocus?: boolean
}

function setupQueryMock(overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, unknown> = {
    data: { value: undefined },
    isLoading: { value: false },
    isPending: { value: false },
    isError: { value: false },
    error: { value: null },
    refetch: vi.fn<() => Promise<void>>(),
    isSuccess: { value: true },
    isStale: { value: false },
    isFetching: { value: false },
    status: { value: 'success' },
    fetchStatus: { value: 'idle' },
    promise: { value: Promise.resolve() },
    suspense: vi.fn<() => Promise<void>>(),
    ...overrides,
  }

  mockUseQuery.mockReturnValue(defaults as ReturnType<typeof useQuery>)
}

describe('useEmailStatus', () => {
  const mockEmailStatus: EmailStatus = {
    email: 'user@test.com',
    emailVerified: true,
    emailChangePending: false,
    pendingNewEmail: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setupQueryMock()
  })

  describe('query configuration', () => {
    it('uses correct query key', () => {
      useEmailStatus()

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['email-status'],
        }),
      )
    })

    it('uses fetchEmailStatus as query function', () => {
      useEmailStatus()

      const callArgs = mockUseQuery.mock.calls[0]?.[0] as QueryOptions | undefined
      expect(callArgs?.queryFn).toBeDefined()
    })

    it('sets staleTime to 30 seconds', () => {
      useEmailStatus()

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          staleTime: 30 * 1000,
        }),
      )
    })

    it('enables refetchOnWindowFocus', () => {
      useEmailStatus()

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          refetchOnWindowFocus: true,
        }),
      )
    })
  })

  describe('data fetching', () => {
    it('calls fetchEmailStatus when query executes', () => {
      useEmailStatus()

      const callArgs = mockUseQuery.mock.calls[0]?.[0] as QueryOptions | undefined
      void callArgs?.queryFn?.()

      expect(emailApi.fetchEmailStatus).toHaveBeenCalled()
    })

    it('returns email status data', () => {
      setupQueryMock({ data: { value: mockEmailStatus } })
      const result = useEmailStatus()

      expect(result.data.value).toEqual(mockEmailStatus)
    })

    it('returns pending email when change is pending', () => {
      const pendingStatus: EmailStatus = {
        email: 'user@test.com',
        emailVerified: true,
        emailChangePending: true,
        pendingNewEmail: 'new@test.com',
      }
      setupQueryMock({ data: { value: pendingStatus } })
      const result = useEmailStatus()

      expect(result.data.value).toEqual(pendingStatus)
      expect(result.data.value?.emailChangePending).toBe(true)
      expect(result.data.value?.pendingNewEmail).toBe('new@test.com')
    })
  })

  describe('loading and error states', () => {
    it('returns isLoading as true during fetch', () => {
      setupQueryMock({
        isLoading: { value: true },
        isPending: { value: true },
        isFetching: { value: true },
        status: { value: 'pending' },
        fetchStatus: { value: 'fetching' },
      })
      const result = useEmailStatus()

      expect(result.isLoading.value).toBe(true)
      expect(result.isPending.value).toBe(true)
    })

    it('returns error when query fails', () => {
      const error = new Error('Network error')
      setupQueryMock({
        isError: { value: true },
        error: { value: error },
        status: { value: 'error' },
      })
      const result = useEmailStatus()

      expect(result.isError.value).toBe(true)
      expect(result.error.value).toBe(error)
    })

    it('exposes refetch function', () => {
      const result = useEmailStatus()

      expect(result.refetch).toBeDefined()
      expect(typeof result.refetch).toBe('function')
    })
  })

  describe('return value shape', () => {
    it('returns expected query result properties', () => {
      const result = useEmailStatus()

      expect(result.data).toBeDefined()
      expect(result.isLoading).toBeDefined()
      expect(result.isError).toBeDefined()
      expect(result.error).toBeDefined()
      expect(result.refetch).toBeDefined()
    })
  })
})
