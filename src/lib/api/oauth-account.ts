import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import { OAuthAccountsResponseDataSchema, type OAuthAccountsResponseData } from '@/lib/schemas/oauth-account.schema'

export type { OAuthAccountsResponseData } from '@/lib/schemas/oauth-account.schema'

/**
 * Fetches the list of third-party OAuth accounts bound to the authenticated user.
 *
 * Endpoint: GET /api/v1/auth/oauth/accounts
 * Auth: Bearer JWT (injected by apiFetch interceptor)
 *
 * The response payload intentionally excludes sensitive fields (accessToken,
 * refreshToken, providerUserId). On 401 the global ofetch interceptor
 * dispatches `api:unauthorized` (or attempts a token refresh for AUTH_002/003)
 * so this function simply re-throws the underlying error for the caller
 * (typically TanStack Query) to surface.
 *
 * @param signal Optional AbortSignal forwarded to apiFetch so TanStack Query
 *               can cancel the in-flight request on component unmount.
 * @returns The parsed inner data payload containing the list of bindings
 * @throws Error if the network request fails or the response does not
 *         match the expected schema (Zod parse error)
 */
export async function fetchLinkedOAuthAccounts(signal?: AbortSignal): Promise<OAuthAccountsResponseData> {
  const response = await apiFetch<unknown>('/api/v1/auth/oauth/accounts', {
    method: 'GET',
    signal,
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return OAuthAccountsResponseDataSchema.parse(wrapped.data)
}

/**
 * Unbinds (removes) a third-party OAuth account from the authenticated user.
 *
 * Endpoint: DELETE /api/v1/auth/oauth/accounts/{provider}
 * Auth: Bearer JWT (injected by apiFetch interceptor)
 *
 * Returns 204 No Content on success — the empty body is dropped by apiFetch
 * and the function returns `undefined`. On error the existing apiFetch
 * interceptor handles 401 (token refresh / logout) and 5xx paths; we just
 * propagate 4xx errors (404 AUTH_017 not-linked, 409 AUTH_018 last-method)
 * for the caller to surface via the error-mapping table.
 *
 * The endpoint is non-idempotent (matches the BIND flow design): a successful
 * call removes the binding row, a second call returns 404. The provider path
 * segment is URL-encoded to guard against any future provider slug that may
 * include reserved characters — today the only valid value is lowercase
 * "github" but the encoding cost is zero.
 *
 * @param provider OAuth provider identifier (e.g. "github")
 * @returns Resolves with `void` on 204 success; rejects on any error response
 */
export async function unbindOAuthAccount(provider: string): Promise<void> {
  await apiFetch<unknown>(`/api/v1/auth/oauth/accounts/${encodeURIComponent(provider)}`, {
    method: 'DELETE',
  })
}
