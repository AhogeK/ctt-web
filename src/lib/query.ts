import { QueryClient, type VueQueryPluginOptions } from '@tanstack/vue-query'

/**
 * Global QueryClient instance
 * Manages server state cache for the entire application
 */
export const queryClient = new QueryClient({
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
      // Handle all Mutation global errors here
      onError: (error) => {
        // If error already handled in ofetch interceptor with Toast, can skip based on error type
        console.error('[Mutation Error]:', error)
      },
    },
  },
})

/**
 * Vue plugin configuration for main.ts
 */
export const vueQueryOptions: VueQueryPluginOptions = {
  queryClient,
}
