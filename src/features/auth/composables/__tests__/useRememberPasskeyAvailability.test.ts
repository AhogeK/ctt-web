import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { effectScope, type EffectScope } from 'vue'
import { useRememberPasskeyAvailability } from '../useRememberPasskeyAvailability'

const mockFetchPasskeys = vi.hoisted(() => vi.fn<() => Promise<unknown>>())
const mockRemember = vi.hoisted(() => vi.fn<() => void>())

// The store's flag has to be a real ref: the composable watches it.
vi.mock('@/stores/auth', async () => {
  const { reactive } = await import('vue')
  // A Pinia store is reactive: reading `.isAuthenticated` yields the value, not a ref, which is
  // what the composable's watcher depends on.
  const state = reactive({ isAuthenticated: false })
  return { useAuthStore: () => state, __state: state }
})
vi.mock('@/lib/api', () => ({ fetchPasskeys: mockFetchPasskeys }))
vi.mock('@/lib/utils/passkey-preference', () => ({
  hasUsedPasskey: () => false,
  rememberPasskeyUse: mockRemember,
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-only handle on the mock's ref
const auth = (await import('@/stores/auth')) as any

describe('useRememberPasskeyAvailability', () => {
  // Each run gets its own scope so one test's watcher cannot answer for the next.
  let scope: EffectScope
  beforeEach(() => {
    vi.clearAllMocks()
    auth.__state.isAuthenticated = false
    scope = effectScope()
  })
  afterEach(() => {
    scope.stop()
  })

  it('remembers that the signed-in account holds one', async () => {
    mockFetchPasskeys.mockResolvedValue([{ id: 'row-1' }])

    scope.run(() => useRememberPasskeyAvailability())
    auth.__state.isAuthenticated = true
    await flushPromises()

    expect(mockFetchPasskeys).toHaveBeenCalledTimes(1)
    expect(mockRemember).toHaveBeenCalledTimes(1)
  })

  it('says nothing when the account holds none', async () => {
    mockFetchPasskeys.mockResolvedValue([])

    scope.run(() => useRememberPasskeyAvailability())
    auth.__state.isAuthenticated = true
    await flushPromises()

    expect(mockRemember).not.toHaveBeenCalled()
  })

  it('does not ask before anyone signs in', async () => {
    scope.run(() => useRememberPasskeyAvailability())
    await flushPromises()

    expect(mockFetchPasskeys).not.toHaveBeenCalled()
  })
})
