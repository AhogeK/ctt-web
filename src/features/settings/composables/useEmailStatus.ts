import { useQuery } from '@tanstack/vue-query'
import { fetchEmailStatus, type EmailStatus } from '@/lib/api/email'

export type { EmailStatus }

/**
 * Composable for fetching the current user's email status.
 *
 * Uses TanStack Query with a 30-second stale time and refetch on window focus
 * to keep email verification state reasonably fresh without excessive requests.
 *
 * @returns Query result with email status data, loading state, error state, and refetch function.
 */
export function useEmailStatus() {
  return useQuery({
    queryKey: ['email-status'],
    queryFn: () => fetchEmailStatus(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}
