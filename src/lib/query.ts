import { MutationCache, QueryClient, type VueQueryPluginOptions } from '@tanstack/vue-query'
import { reportOperationFailure, wasFailureReported } from '@/lib/utils/operation-failure'

/**
 * Query key for public configuration data.
 * Used by usePublicConfig() composable to fetch and cache public config.
 */
export const PUBLIC_CONFIG_QUERY_KEY = ['public-config'] as const

/**
 * Global QueryClient instance
 * Manages server state cache for the entire application
 */
/**
 * The last resort for a failed action.
 *
 * Every mutation ends here, which is the only place that sees both the error and the options the
 * mutation was created with. It stays quiet for a mutation that has its own `onError`: that handler
 * owns the wording. A failure that must stay silent is either a no-op module-level handler or a
 * call-site handler that claims the error — the latter because a call-site `onError` is invisible
 * here.
 *
 * Call-site callbacks (`mutate(variables, { onError })`) are not visible here — measured on
 * query-core 5.104.5 — so those handlers claim their error through `markFailureReported()`, and the
 * reporter stays quiet for an error that was already explained.
 */
const mutationCache = new MutationCache({
  onError: (error, _variables, _onMutateResult, mutation) => {
    if (mutation.options.onError) return
    // Measured on query-core 5.104.5: this cache callback runs first, the call-site `onError`
    // second, and a microtask fires between them. A task boundary is the first point where both
    // have had their turn, so a handler that speaks can claim the error before the fallback would.
    setTimeout(() => {
      if (wasFailureReported(error)) return
      reportOperationFailure(error)
    }, 0)
  },
})

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      // Data is considered 'fresh' for 30 seconds, during which multiple requests use cache without network calls
      staleTime: 1000 * 30,

      // GC Time: How long inactive data is kept before garbage collection (default 5 minutes)
      gcTime: 1000 * 60 * 5,

      // In admin/backoffice systems, disable refetch on window focus to prevent API flooding from tab switching
      refetchOnWindowFocus: false,

      // Default retry count: default is 3, recommend 1 for Fail-Fast behavior
      retry: 1,

      // Whether to refetch on component unmount or network reconnect
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Left empty on purpose: the last-resort handler lives on the cache below, where it can see
      // which mutation failed and whether that mutation already has a handler of its own.
    },
  },
})

// Override global defaults for specific query keys
// This ensures public config is fetched only once per session, bypassing option merge issues
queryClient.setQueryDefaults(PUBLIC_CONFIG_QUERY_KEY, {
  staleTime: Number.POSITIVE_INFINITY,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
})

/**
 * Vue plugin configuration for main.ts
 */
export const vueQueryOptions: VueQueryPluginOptions = {
  queryClient,
}
