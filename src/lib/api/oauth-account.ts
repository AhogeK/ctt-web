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
