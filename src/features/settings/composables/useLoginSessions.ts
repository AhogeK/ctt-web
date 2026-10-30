import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { QueryClient } from '@tanstack/vue-query'
import { fetchLoginSessions, revokeLoginSession, revokeLoginSessions } from '@/lib/api'

/**
 * Query key for the caller's login sessions.
 *
 * Exported so the revoke mutations invalidate exactly this list instead of restating the key,
 * and so a future sign-out path can drop it deliberately.
 */
export const LOGIN_SESSIONS_QUERY_KEY = ['login-sessions'] as const

/**
 * Re-reads the list after a revocation has settled.
 *
 * Settled rather than succeeded: a row that is already gone is the server's answer too, and the
 * mutation never splices the array locally — that would show a list the server never confirmed.
 *
 * @param queryClient - the client owning the list
 */
function reconcileList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: LOGIN_SESSIONS_QUERY_KEY })
}

/**
 * Reads the sign-ins attached to the account.
 *
 * The list is fetched whole in one request: the server sorts it by last use and does not
 * paginate, so the client renders the order it received rather than re-sorting it.
 *
 * @returns The sessions and the query state.
 */
export function useLoginSessions() {
  const query = useQuery({
    queryKey: LOGIN_SESSIONS_QUERY_KEY,
    queryFn: () => fetchLoginSessions(),
    // The same 30s window the email-status query uses: fresh enough to notice a new sign-in
    // without polling a list that changes only when the user signs in somewhere.
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })

  return {
    sessions: query.data,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  }
}

/**
 * Ends one session.
 *
 * @returns The mutation, whose `mutateAsync` takes the session id.
 */
export function useRevokeLoginSession() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (sessionId: string) => revokeLoginSession(sessionId),
    onSettled: () => reconcileList(queryClient),
  })

  return { mutation }
}

/**
 * Ends several sessions in one call.
 *
 * Separate from the single-session mutation only because the two answer differently: this one
 * reports how many it ended and which ids it left alone, and the caller needs both numbers to
 * tell the reader what happened.
 *
 * @returns The mutation, whose `mutateAsync` takes the session ids.
 */
export function useRevokeLoginSessions() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (sessionIds: string[]) => revokeLoginSessions(sessionIds),
    onSettled: () => reconcileList(queryClient),
  })

  return { mutation }
}
