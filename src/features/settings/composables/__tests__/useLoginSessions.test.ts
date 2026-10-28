import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { LOGIN_SESSIONS_QUERY_KEY, useLoginSessions } from '../useLoginSessions'

/**
 * The wiring this composable owns is the query key the list lives under and the moment the list is
 * reconciled. Both matter: the revoke mutation must invalidate exactly this key — not a key that
 * happens to look like it — and it must do so whether the revocation succeeded or failed, because a
 * row that another tab already removed is the server's answer too.
 */

const mockFetchLoginSessions = vi.hoisted(() => vi.fn<() => Promise<unknown>>())
const mockRevokeLoginSession = vi.hoisted(() => vi.fn<(id: string) => Promise<void>>())
const mockInvalidateQueries = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<void>>())

vi.mock('@/lib/api', () => ({
  fetchLoginSessions: mockFetchLoginSessions,
  revokeLoginSession: mockRevokeLoginSession,
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
  mutationFn: (id: string) => Promise<void>
  onSettled?: () => void
}

let queryConfig: QueryConfig | null = null
let mutationConfig: MutationConfig | null = null

describe('useLoginSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryConfig = null
    mutationConfig = null

    // @ts-expect-error - the mock only needs the fields this composable reads
    vi.mocked(useQuery).mockImplementation((config: QueryConfig) => {
      queryConfig = config
      return { data: undefined, isPending: true, isError: false, refetch: vi.fn<() => void>() }
    })
    // @ts-expect-error - the mock only needs the fields this composable reads
    vi.mocked(useMutation).mockImplementation((config: MutationConfig) => {
      mutationConfig = config
      return { mutateAsync: vi.fn<() => Promise<void>>(), isPending: false }
    })
  })

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

  it('revokes the id it was given', async () => {
    mockRevokeLoginSession.mockResolvedValue(undefined)
    useLoginSessions()

    await mutationConfig?.mutationFn('22222222-2222-4222-8222-222222222222')

    expect(mockRevokeLoginSession).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222')
  })

  it('reconciles the list after a failed revocation too', async () => {
    mockRevokeLoginSession.mockRejectedValue(new Error('already gone'))
    useLoginSessions()

    await expect(mutationConfig!.mutationFn('gone')).rejects.toThrow('already gone')
    mutationConfig?.onSettled?.()

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: LOGIN_SESSIONS_QUERY_KEY })
  })
})
