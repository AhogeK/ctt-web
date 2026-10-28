import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchLoginSessions, revokeLoginSession } from '@/lib/api'

/**
 * Query key for the caller's login sessions.
 *
 * Exported so the revoke mutation invalidates exactly this list instead of restating the key,
 * and so a future sign-out path can drop it deliberately.
 */
export const LOGIN_SESSIONS_QUERY_KEY = ['login-sessions'] as const

/**
 * Reads the sign-ins attached to the account and revokes one of them.
 *
 * The list is fetched whole in one request: the server sorts it by last use and does not
 * paginate, so the client renders the order it received rather than re-sorting it.
 *
 * A revocation invalidates the list in both outcomes, because the row it removes — or fails to
 * remove because another tab already revoked it — is the server's decision. The mutation never
 * splices the array locally: that would show a list the server never confirmed.
 *
 * @returns The sessions, the query state, and the revoke mutation.
 */
export function useLoginSessions() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: LOGIN_SESSIONS_QUERY_KEY,
    queryFn: () => fetchLoginSessions(),
    // The same 30s window the email-status query uses: fresh enough to notice a new sign-in
    // without polling a list that changes only when the user signs in somewhere.
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => revokeLoginSession(sessionId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: LOGIN_SESSIONS_QUERY_KEY }),
  })

  return {
    sessions: query.data,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    revokeMutation,
  }
}
