import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { listApiKeys, createApiKey, revokeApiKey, deleteApiKey } from '@/lib/api/api-keys'
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
 * - AUTH_024: per-user active key limit reached (409)
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

/**
 * Composable for revoking (soft-deleting) an API key.
 *
 * The revoke endpoint is idempotent: revoking an already-revoked key
 * returns 204 and does NOT produce an error. On success the keys list
 * query is invalidated so the revoked key disappears immediately.
 *
 * If the key does not exist or belongs to another user, the server
 * returns 401 with code AUTH_010. The interceptor does NOT log the
 * user out for this code; the error propagates to the caller, which
 * should use `getErrorMessage` to surface the mapped BOLA message
 * ("API key not found or no longer accessible") - `getErrorMessage`
 * internally calls `mapApiErrorCode` which maps AUTH_010 to the
 * generic text, so the caller does not need to inspect the code.
 *
 * @returns Object with the revoke mutation - call `mutation.mutate(id)`
 *   to revoke a key. Exposes `mutation.isPending`, `mutation.isError`,
 *   and `mutation.error` for UI state.
 */
export function useRevokeApiKey() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY })
    },
  })

  return { mutation }
}

/**
 * Composable for permanently deleting a REVOKED or EXPIRED API key.
 *
 * ACTIVE keys are rejected by the server (409 AUTH_023 — revoke first);
 * REVOKED and EXPIRED keys delete directly (backend v0.42.0). The key is
 * physically removed and the operation is not reversible. On success the
 * keys list query is invalidated so the row disappears from the list.
 *
 * Errors: AUTH_010 (missing/foreign/already-deleted, BOLA-safe) and
 * AUTH_023 (still active) propagate to the caller for `getErrorMessage`
 * mapping.
 *
 * @returns Object with the delete mutation - call `mutation.mutate(id)`
 *   to delete a revoked or expired key. Exposes `mutation.isPending`,
 *   `mutation.isError`, and `mutation.error` for UI state.
 */
export function useDeleteApiKey() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: string) => deleteApiKey(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY })
    },
  })

  return { mutation }
}
