import { computed } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { TWO_FACTOR_STATUS_QUERY_KEY, useTwoFactorStatus } from './useTwoFactor'

/**
 * Whether this session is recent enough for the server to accept security changes.
 *
 * The server reports session freshness on the second-factor status, so the page reads it from the
 * query that already runs for the card instead of asking for a second endpoint. A page that gates
 * several controls on "signed in long ago" needs one answer, not one per card.
 *
 * @returns `isKnown` once the status has arrived, and `isFresh` for the gate itself
 */
export function useRecentAuthentication() {
  const { data } = useTwoFactorStatus()

  return {
    isKnown: computed(() => data.value !== undefined),
    isFresh: computed(() => data.value?.recentAuthentication === true),
  }
}

/**
 * Re-reads session freshness after the server refused a change for being too old.
 *
 * The status is cached, so a window that closed while the page was open would otherwise keep the
 * notice hidden and leave the reader without the sentence that explains the refusal.
 *
 * @returns A function that invalidates the status query
 */
export function useRefreshRecentAuthentication() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: TWO_FACTOR_STATUS_QUERY_KEY })
}
