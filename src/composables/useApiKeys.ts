import { useQuery } from '@tanstack/vue-query'
import { listApiKeys } from '@/lib/api/api-keys'

const API_KEYS_QUERY_KEY = ['api-keys'] as const

/**
 * Composable for fetching the authenticated user's API keys.
 *
 * Uses TanStack Query for automatic caching, background refetch,
 * and loading/error state management.
 */
export function useApiKeys() {
  return useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: () => listApiKeys(),
    staleTime: 1000 * 30,
  })
}
