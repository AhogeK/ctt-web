import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { listApiKeys, createApiKey } from '@/lib/api/api-keys'
import type { CreateApiKeyRequest } from '@/lib/schemas/api-key.schema'

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

/**
 * Composable for creating a new API key.
 *
 * On success the keys list query is invalidated so the new key appears
 * immediately. The response carries the one-time rawKey; the caller is
 * responsible for showing it in the RawKeyDialog and never persisting it.
 *
 * Error codes handled by the caller via `extractErrorCode`:
 * - AUTH_014: per-user active key limit reached (409)
 * - RATE_LIMIT_001: creation rate limit exceeded (429)
 *
 * @returns Object with the create mutation
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateApiKeyRequest) => createApiKey(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY })
    },
  })

  return { mutation }
}
