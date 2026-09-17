import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import { useDeleteAccount } from '../useDeleteAccount'
import { deleteAccount } from '@/lib/api/user'
import { toast } from 'vue-sonner'

vi.mock('@/lib/api/user', () => ({
  deleteAccount: vi.fn<() => Promise<void>>(),
}))

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn<(...args: unknown[]) => void>(),
    error: vi.fn<(...args: unknown[]) => void>(),
  },
}))

const mockReplace = vi.fn<(...args: unknown[]) => Promise<void>>()
vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

const mockClearAuth = vi.fn<() => void>()
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ clearAuth: mockClearAuth }),
}))

interface MutationOptions {
  mutationFn: (password: string | null) => Promise<void>
  onSuccess?: () => unknown
  onError?: (error: unknown) => unknown
}

vi.mock('@tanstack/vue-query', () => ({
  // Mirrors the part of TanStack that matters here: the mutation runs, then the composable's own
  // `onSuccess` runs because that is where the teardown lives. A mock that only ran a caller's
  // handler would leave the teardown untested while looking green.
  useMutation: (options: MutationOptions) => ({
    mutate: (password: string | null, handlers?: { onSuccess?: () => unknown }) => {
      void Promise.resolve(options.mutationFn(password))
        .then(() => Promise.resolve(options.onSuccess?.()).then(() => handlers?.onSuccess?.()))
        .catch((error: unknown) => {
          options.onError?.(error)
        })
    },
    isPending: { value: false },
  }),
}))

describe('useDeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(deleteAccount).mockResolvedValue(undefined)
    mockReplace.mockResolvedValue(undefined)
  })

  it('passes the password through, and null for an account that has none', () => {
    const { mutation } = useDeleteAccount()
    const mutate = mutation.mutate as (password: string | null) => void

    mutate('hunter2')
    expect(vi.mocked(deleteAccount)).toHaveBeenLastCalledWith('hunter2')

    mutate(null)
    expect(vi.mocked(deleteAccount)).toHaveBeenLastCalledWith(null)
  })

  it('retires the session locally and sends the reader to sign in again', async () => {
    const { mutation } = useDeleteAccount()
    ;(mutation.mutate as (password: string | null) => void)('hunter2')

    await vi.waitFor(() => expect(mockReplace).toHaveBeenCalled())

    // The account no longer exists, so nothing may keep acting as if it does: tokens, cached server
    // data and the silent-refresh timer all have to go, and the reader has to leave the pages that
    // would otherwise refetch as a deleted user.
    expect(mockClearAuth).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith({ name: 'login' })
  })

  it('clears the session before navigating away', async () => {
    // Order is the whole point: navigation unmounts the authenticated pages, and a page refetching
    // in the gap would use a token that still works for up to fifteen minutes. The two are
    // independent calls from outside, so only the recorded order can pin this.
    const order: string[] = []
    mockClearAuth.mockImplementation(() => {
      order.push('clearAuth')
    })
    mockReplace.mockImplementation(() => {
      order.push('navigate')
      return Promise.resolve()
    })

    const { mutation } = useDeleteAccount()
    ;(mutation.mutate as (password: string | null) => void)('hunter2')

    await vi.waitFor(() => expect(order).toContain('navigate'))
    expect(order).toEqual(['clearAuth', 'navigate'])
  })

  it('tells the reader the plugin can still re-sync their history', async () => {
    const { mutation } = useDeleteAccount()
    ;(mutation.mutate as (password: string | null) => void)('hunter2')

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalled())

    const [, options] = vi.mocked(toast.success).mock.calls[0] as [string, { description: string }]
    expect(options.description.toLowerCase()).toContain('local history')
  })
})
