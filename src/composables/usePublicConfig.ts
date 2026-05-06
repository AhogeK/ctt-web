import { useQuery } from '@tanstack/vue-query'
import { type MaybeRef } from 'vue'
import { PUBLIC_CONFIG_QUERY_KEY } from '@/lib/query'
import { getPublicConfig } from '@/lib/api/config'

/**
 * Composable for fetching public configuration (termsVersion, etc.).
 *
 * Uses TanStack Query with `staleTime: Infinity` to cache the result
 * for the entire session — public config rarely changes.
 *
 * Multiple consumers sharing the same query key will receive a single
 * deduplicated network request.
 *
 * @param enabled - Optional boolean ref to conditionally enable the query.
 *                   When false, the query is inactive (no network request).
 *                   Defaults to true (always active).
 */
export function usePublicConfig(enabled?: MaybeRef<boolean>) {
  return useQuery({
    queryKey: PUBLIC_CONFIG_QUERY_KEY,
    queryFn: () => getPublicConfig(),
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: enabled ?? true,
  })
}
