import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  LOGIN_SESSIONS_QUERY_KEY,
  useLoginSessions,
  useRevokeLoginSession,
  useRevokeLoginSessions,
} from '../useLoginSessions'

/**
 * The wiring these composables own is the query key the list lives under and when it is
 * reconciled. Both matter: a revocation must invalidate exactly this key, and it must do so
 * whether it succeeded or failed — a row another tab already removed is the server's answer too.
 */

const mockFetchLoginSessions = vi.hoisted(() => vi.fn<() => Promise<unknown>>())
const mockRevokeLoginSession = vi.hoisted(() => vi.fn<(id: string) => Promise<void>>())
const mockRevokeLoginSessions = vi.hoisted(() => vi.fn<(ids: string[]) => Promise<unknown>>())
const mockInvalidateQueries = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<void>>())

vi.mock('@/lib/api', () => ({
  fetchLoginSessions: mockFetchLoginSessions,
  revokeLoginSession: mockRevokeLoginSession,
  revokeLoginSessions: mockRevokeLoginSessions,
}))

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  useQuery: vi.fn<(...args: unknown[]) => unknown>(),
  useMutation: vi.fn<(...args: unknown[]) => unknown>(),
}))

import { useMutation, useQuery } from '@tanstack/vue-query'

interface QueryConfig {
  queryKey: readonly unknown[]
  queryFn: () => Promise<unknown>
  staleTime?: number
  refetchOnWindowFocus?: boolean
}

interface MutationConfig {
  mutationFn: (input: never) => Promise<unknown>
  onSettled?: () => void
}

let queryConfig: QueryConfig | null = null
let mutationConfig: MutationConfig | null = null

describe('login session composables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryConfig = null
    mutationConfig = null

    // @ts-expect-error - the mock only needs the fields these composables read
    vi.mocked(useQuery).mockImplementation((config: QueryConfig) => {
      queryConfig = config
      return { data: undefined, isPending: true, isError: false, refetch: vi.fn<() => void>() }
    })
    // @ts-expect-error - the mock only needs the fields these composables read
    vi.mocked(useMutation).mockImplementation((config: MutationConfig) => {
      mutationConfig = config
      return { mutateAsync: vi.fn<() => Promise<void>>(), isPending: false }
    })
  })

  describe('useLoginSessions', () => {
    it('reads the whole list under its own key', async () => {
      useLoginSessions()

      expect(queryConfig?.queryKey).toEqual(LOGIN_SESSIONS_QUERY_KEY)
      await queryConfig?.queryFn()
      expect(mockFetchLoginSessions).toHaveBeenCalledTimes(1)
      // The list changes only when someone signs in somewhere, so a short fresh window and a
      // refetch on focus is enough — polling it would be noise.
      expect(queryConfig?.refetchOnWindowFocus).toBe(true)
      expect(queryConfig?.staleTime).toBe(30_000)
    })
  })

  describe('useRevokeLoginSession', () => {
    it('revokes the id it was given and reconciles the list either way', async () => {
      mockRevokeLoginSession.mockResolvedValue(undefined)
      const { mutation } = useRevokeLoginSession()

      expect(mutation).toBeDefined()
      await mutationConfig?.mutationFn('22222222-2222-4222-8222-222222222222' as never)
      expect(mockRevokeLoginSession).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222')

      mutationConfig?.onSettled?.()
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: LOGIN_SESSIONS_QUERY_KEY })
    })
  })

  describe('useRevokeLoginSessions', () => {
    it('sends the whole batch in one call and reconciles the list either way', async () => {
      const result = { revoked: 2, skipped: ['33333333-3333-4333-8333-333333333333'] }
      mockRevokeLoginSessions.mockResolvedValue(result)
      const { mutation } = useRevokeLoginSessions()

      expect(mutation).toBeDefined()
      await expect(mutationConfig?.mutationFn(['a', 'b'] as never)).resolves.toEqual(result)
      expect(mockRevokeLoginSessions).toHaveBeenCalledWith(['a', 'b'])

      mockRevokeLoginSessions.mockRejectedValue(new Error('too many'))
      await expect(mutationConfig?.mutationFn(['a'] as never)).rejects.toThrow('too many')
      mutationConfig?.onSettled?.()
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: LOGIN_SESSIONS_QUERY_KEY })
    })
  })
})
