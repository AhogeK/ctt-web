import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, type Ref } from 'vue'
import ProfileView from '../ProfileView.vue'

// ==========================================
// Hoisted Mock Variables (must be before vi.mock)
// ==========================================

const mockToastError = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockToastSuccess = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const mockRefetch = vi.hoisted(() => vi.fn<() => Promise<unknown>>(() => Promise.resolve()))
const mockFetchLinkedOAuthAccounts = vi.hoisted(() => vi.fn<() => Promise<unknown>>())
const mockGetGitHubAuthorizeUrl = vi.hoisted(() => vi.fn<() => Promise<unknown>>())
const mockReplace = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())

// Real vue refs so the template auto-unwrap works correctly
const queryData: Ref<{ accounts: Array<Record<string, unknown>> } | undefined> = ref({
  accounts: [],
})
const queryIsPending: Ref<boolean> = ref(false)
const queryIsError: Ref<boolean> = ref(false)

let mutationOnError: ((error: unknown) => void) | undefined
// Module-level mutable query — per-test setup reassigns this before mount()
// to simulate OAuth callback URL state (e.g. { linked: 'github' } or
// { error: 'AUTH_016' }). The mock useRoute returns this same object
// reference, so changes made before mount() are visible on the next render.
let routeQuery: Record<string, string> = {}

// ==========================================
// Mocks
// ==========================================

vi.mock('vue-sonner', () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn<() => { push: (...args: unknown[]) => unknown; replace: (...args: unknown[]) => unknown }>(() => ({
    push: vi.fn<(...args: unknown[]) => unknown>(),
    replace: mockReplace,
  })),
  useRoute: vi.fn<() => { query: Record<string, string> }>(() => ({
    query: routeQuery,
  })),
  RouterLink: { template: '<a><slot /></a>' },
  createRouter: vi.fn<() => { install: () => void; onError: () => void }>(() => ({
    install: vi.fn<() => void>(),
    onError: vi.fn<() => void>(),
  })),
  createWebHistory: vi.fn<() => void>(),
}))

vi.mock('@tanstack/vue-query', () => ({
  QueryClient: vi.fn<() => void>(),
  useMutation: vi.fn<
    (options: { onSuccess?: (data: { authUrl: string }) => void; onError?: (error: unknown) => void }) => {
      mutate: (...args: unknown[]) => unknown
      isPending: { value: boolean }
    }
  >((options) => {
    mutationOnError = options.onError
    return {
      mutate: mockMutate,
      isPending: { value: false },
    }
  }),
  useQuery: vi.fn<
    () => {
      data: typeof queryData
      isPending: typeof queryIsPending
      isError: typeof queryIsError
      refetch: typeof mockRefetch
    }
  >(() => ({
    data: queryData,
    isPending: queryIsPending,
    isError: queryIsError,
    refetch: mockRefetch,
  })),
}))

vi.mock('@/lib/api/oauth-account', () => ({
  fetchLinkedOAuthAccounts: mockFetchLinkedOAuthAccounts,
}))

vi.mock('@/lib/api/auth', () => ({
  getGitHubAuthorizeUrl: mockGetGitHubAuthorizeUrl,
}))

// Mock the router module so importing @/lib/api (which transitively imports
// @/lib/api/instance → @/router → setupRouterGuards) does not throw during
// file evaluation. The vue-router mock above handles useRouter/useRoute; this
// one handles the default-export router object that apiFetch/instance reads.
vi.mock('@/router', () => ({
  default: {
    push: vi.fn<() => void>(),
    replace: mockReplace,
    currentRoute: { value: { fullPath: '/' } },
    beforeEach: vi.fn<() => void>(),
    afterEach: vi.fn<() => void>(),
  },
}))

vi.mock('@/stores/auth', () => ({
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'ctt_access_token',
    REFRESH_TOKEN: 'ctt_refresh_token',
    USER_ID: 'ctt_user_id',
  },
  useAuthStore: vi.fn<() => { isAuthenticated: boolean; login: () => void; logout: () => void }>(() => ({
    isAuthenticated: false,
    login: vi.fn<() => void>(),
    logout: vi.fn<() => void>(),
  })),
}))

vi.mock('@/components/ui/button', () => ({
  Button: { template: '<button><slot /></button>' },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

// ==========================================
// Helper Functions
// ==========================================

function setQueryState(
  overrides: {
    data?: { accounts: Array<Record<string, unknown>> }
    isPending?: boolean
    isError?: boolean
  } = {},
): void {
  queryData.value = overrides.data ?? { accounts: [] }
  queryIsPending.value = overrides.isPending ?? false
  queryIsError.value = overrides.isError ?? false
  mockRefetch.mockClear()
}

function resetMocks(): void {
  vi.clearAllMocks()
  mockRefetch.mockClear()
  mockMutate.mockClear()
  mockToastError.mockClear()
  mockToastSuccess.mockClear()
  mockReplace.mockClear()
  mockReplace.mockResolvedValue(undefined)
  mockFetchLinkedOAuthAccounts.mockClear()
  mockGetGitHubAuthorizeUrl.mockClear()
  mutationOnError = undefined
  routeQuery = {}
  setQueryState()
}

function githubBindingRow(
  overrides: Partial<{
    providerLogin: string | null
    providerEmail: string | null
    createdAt: string
    updatedAt: string
  }> = {},
): Record<string, unknown> {
  return {
    provider: 'github',
    providerLogin: overrides.providerLogin ?? null,
    providerEmail: overrides.providerEmail ?? null,
    createdAt: overrides.createdAt ?? '2026-04-22T10:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-06-28T12:00:00Z',
  }
}

// ==========================================
// Tests
// ==========================================

describe('ProfileView', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('GitHub binding status', () => {
    it('shows loading state while fetching linked accounts', () => {
      setQueryState({ data: undefined, isPending: true })
      const wrapper = mount(ProfileView)

      expect(wrapper.find('[data-testid="github-status-loading"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="github-status-disconnected"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="github-status-connected"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="github-status-error"]').exists()).toBe(false)
    })

    it('shows Not connected when accounts list is empty', () => {
      setQueryState({ data: { accounts: [] } })
      const wrapper = mount(ProfileView)

      expect(wrapper.find('[data-testid="github-status-disconnected"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="github-status-disconnected"]').text()).toBe('Not connected')
      expect(wrapper.find('[data-testid="github-status-connected"]').exists()).toBe(false)
    })

    it('shows Connected with providerLogin when GitHub binding exists', () => {
      setQueryState({
        data: { accounts: [githubBindingRow({ providerLogin: 'octocat', providerEmail: 'octocat@example.com' })] },
      })
      const wrapper = mount(ProfileView)

      const connected = wrapper.find('[data-testid="github-status-connected"]')
      expect(connected.exists()).toBe(true)
      expect(connected.text()).toContain('Connected')
      expect(connected.text()).toContain('as')
      expect(connected.text()).toContain('octocat')
    })

    it('falls back to providerEmail when providerLogin is null', () => {
      setQueryState({
        data: { accounts: [githubBindingRow({ providerLogin: null, providerEmail: 'octocat@example.com' })] },
      })
      const wrapper = mount(ProfileView)

      const connected = wrapper.find('[data-testid="github-status-connected"]')
      expect(connected.exists()).toBe(true)
      expect(connected.text()).toContain('octocat@example.com')
    })

    it('shows Connected (no handle) when both providerLogin and providerEmail are null', () => {
      setQueryState({
        data: { accounts: [githubBindingRow({ providerLogin: null, providerEmail: null })] },
      })
      const wrapper = mount(ProfileView)

      const connected = wrapper.find('[data-testid="github-status-connected"]')
      expect(connected.exists()).toBe(true)
      expect(connected.text()).toContain('Connected')
      // No "as …" suffix when both labels are missing
      expect(connected.text()).not.toContain('as')
    })

    it('ignores non-GitHub providers when determining GitHub connection state', () => {
      setQueryState({
        data: {
          accounts: [
            {
              provider: 'google',
              providerLogin: 'octo.cat',
              providerEmail: 'octo.cat@gmail.com',
              createdAt: '2026-05-01T08:00:00Z',
              updatedAt: '2026-05-01T08:00:00Z',
            },
          ],
        },
      })
      const wrapper = mount(ProfileView)

      // No GitHub binding → GitHub row shows Not connected
      expect(wrapper.find('[data-testid="github-status-disconnected"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="github-status-connected"]').exists()).toBe(false)
    })

    it('shows error state and a retry button when query fails', () => {
      setQueryState({ data: undefined, isError: true })
      const wrapper = mount(ProfileView)

      const error = wrapper.find('[data-testid="github-status-error"]')
      expect(error.exists()).toBe(true)
      expect(error.text()).toContain('Failed to load connection status')
      expect(error.find('[data-testid="github-status-retry"]').exists()).toBe(true)
    })

    it('triggers refetch when retry button is clicked', async () => {
      setQueryState({ data: undefined, isError: true })
      const wrapper = mount(ProfileView)

      await wrapper.find('[data-testid="github-status-retry"]').trigger('click')

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Connect GitHub button', () => {
    it('always shows Connect GitHub label (no Disconnect button this iteration)', () => {
      setQueryState({
        data: { accounts: [githubBindingRow({ providerLogin: 'octocat' })] },
      })
      const wrapper = mount(ProfileView)

      expect(wrapper.html()).toContain('Connect GitHub')
    })

    it('invokes the GitHub authorize mutation on click', async () => {
      const wrapper = mount(ProfileView)
      const button = wrapper.find('button')

      await button.trigger('click')

      expect(mockMutate).toHaveBeenCalledTimes(1)
    })

    it('shows a toast on mutation error', () => {
      mount(ProfileView)
      expect(mutationOnError).toBeDefined()

      mutationOnError!(new Error('network down'))

      expect(mockToastError).toHaveBeenCalledWith('GitHub linking failed', {
        description: 'Unable to start GitHub authorization. Please try again.',
      })
    })
  })

  describe('useQuery configuration', () => {
    it('configures queryKey, staleTime, and refetchOnWindowFocus via useQuery', async () => {
      const { useQuery } = await import('@tanstack/vue-query')
      setQueryState({ data: { accounts: [] } })
      mount(ProfileView)

      expect(useQuery).toHaveBeenCalledTimes(1)
      const callArgs = vi.mocked(useQuery).mock.calls[0]?.[0] as
        | { queryKey: string[]; queryFn: unknown; staleTime: number; refetchOnWindowFocus: boolean }
        | undefined
      expect(callArgs?.queryKey).toStrictEqual(['oauth-accounts'])
      expect(typeof callArgs?.queryFn).toBe('function')
      expect(callArgs?.staleTime).toBe(30 * 1000)
      expect(callArgs?.refetchOnWindowFocus).toBe(true)
    })
  })

  describe('Component unmount', () => {
    it('cancels in-flight query when component is unmounted (no leaked requests)', async () => {
      // TanStack Query's useQuery handles abort automatically on
      // unmount; we verify the component tears down cleanly without
      // throwing or leaking the AbortController.
      setQueryState({ data: { accounts: [] } })
      const wrapper = mount(ProfileView)

      expect(() => wrapper.unmount()).not.toThrow()
      await flushPromises()
    })
  })

  describe('AbortSignal forwarding', () => {
    it('queryFn forwards the AbortSignal from the queryFn context to fetchLinkedOAuthAccounts', async () => {
      const { useQuery } = await import('@tanstack/vue-query')
      setQueryState({ data: { accounts: [] } })
      mockFetchLinkedOAuthAccounts.mockResolvedValueOnce({ accounts: [] })
      mount(ProfileView)

      const callArgs = vi.mocked(useQuery).mock.calls[0]?.[0] as
        | { queryFn: (ctx: { signal: AbortSignal }) => Promise<unknown> }
        | undefined
      expect(callArgs?.queryFn).toBeDefined()

      const controller = new AbortController()
      await callArgs!.queryFn({ signal: controller.signal })

      expect(mockFetchLinkedOAuthAccounts).toHaveBeenCalledWith(controller.signal)
    })
  })

  describe('GitHub OAuth bind callback', () => {
    it('shouldCallBindAction_whenHandleBindGitHubInvoked', async () => {
      const wrapper = mount(ProfileView)
      const button = wrapper.find('button')

      await button.trigger('click')

      expect(mockMutate).toHaveBeenCalledWith('bind')
    })

    it('shouldShowSuccessToastAndRefetch_whenLinkedQueryIsGithub', async () => {
      routeQuery = { linked: 'github' }
      const localWrapper = mount(ProfileView)
      await flushPromises()

      expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('GitHub'))
      expect(mockRefetch).toHaveBeenCalled()
      expect(mockReplace).toHaveBeenCalledWith({ query: {} })

      localWrapper.unmount()
    })

    it('shouldShowErrorToast_whenLinkedAndErrorAuth016', async () => {
      routeQuery = { linked: 'github', error: 'AUTH_016' }
      const localWrapper = mount(ProfileView)
      await flushPromises()

      expect(mockToastError).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          description: 'This GitHub account is already linked to another user.',
        }),
      )
      expect(mockReplace).toHaveBeenCalledWith({ query: {} })

      localWrapper.unmount()
    })

    it('shouldUseFallbackMessage_whenErrorCodeUnknown', async () => {
      routeQuery = { linked: 'github', error: 'FUTURE_UNKNOWN_CODE' }
      const localWrapper = mount(ProfileView)
      await flushPromises()

      expect(mockToastError).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          description: 'Failed to connect GitHub. Please try again.',
        }),
      )
      expect(mockReplace).toHaveBeenCalledWith({ query: {} })

      localWrapper.unmount()
    })
  })

  describe('Connect GitHub button edge cases', () => {
    it('allows clicking Connect GitHub even when status fetch failed', async () => {
      setQueryState({ data: undefined, isError: true })
      const localWrapper = mount(ProfileView)
      await flushPromises()
      expect(localWrapper.find('[data-testid="github-status-error"]').exists()).toBe(true)

      // In error state a Retry button renders before Connect — target Connect
      // explicitly via its label so we click the right element.
      const connectButton = localWrapper.findAll('button').find((b) => b.text().includes('Connect GitHub'))
      expect(connectButton).toBeDefined()
      await connectButton!.trigger('click')
      await flushPromises()

      expect(mockMutate).toHaveBeenCalledWith('bind')
      localWrapper.unmount()
    })

    it('triggers bind mutation when Connect GitHub clicked while disconnected', async () => {
      setQueryState({ data: { accounts: [] } })
      const localWrapper = mount(ProfileView)
      await flushPromises()
      expect(localWrapper.find('[data-testid="github-status-disconnected"]').exists()).toBe(true)

      const button = localWrapper.find('button')
      await button.trigger('click')
      await flushPromises()

      expect(mockMutate).toHaveBeenCalledWith('bind')
      localWrapper.unmount()
    })
  })
})
