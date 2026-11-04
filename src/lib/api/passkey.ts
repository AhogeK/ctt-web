import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import {
  PasskeyAssertionOptionsSchema,
  PasskeyRegistrationOptionsSchema,
  PasskeySchema,
  type Passkey,
  type PasskeyAssertionOptions,
  type PasskeyCredentialPayload,
  type PasskeyRegistrationOptions,
} from '@/lib/schemas/passkey.schema'
import { LoginResponseSchema, type LoginResponse } from '@/lib/schemas/auth.schema'

/**
 * Requests options for signing in with a passkey.
 *
 * The server wraps them in a `publicKey` key ready for `navigator.credentials.get()`.
 *
 * Endpoint: POST /api/v1/auth/passkey/options (anonymous)
 *
 * Anonymous on purpose: the credential is discoverable, so the browser offers whichever account
 * the authenticator holds instead of the page naming one first.
 *
 * @returns the challenge and the relying-party parameters for `navigator.credentials.get()`
 * @throws 429 RATE_LIMIT_001 when this address asked too often
 */
export async function fetchPasskeyAssertionOptions(): Promise<PasskeyAssertionOptions> {
  const response = await apiFetch<unknown>('/api/v1/auth/passkey/options', { method: 'POST' })
  const wrapped = RestApiResponseSchema.parse(response)
  const publicKey = (wrapped.data as { publicKey?: unknown } | null)?.publicKey
  return PasskeyAssertionOptionsSchema.parse(publicKey)
}

/**
 * Exchanges a signed assertion for a session.
 *
 * Endpoint: POST /api/v1/auth/passkey/assert (anonymous)
 *
 * The answer is the ordinary sign-in response: a passkey already proves possession and a local
 * verification, so no second step follows.
 *
 * @param credential - the assertion serialized by the page
 * @returns the same shape the password sign-in returns
 * @throws 401 AUTH_032 when the challenge expired; AUTH_033 when the assertion does not verify
 */
export async function assertPasskey(credential: PasskeyCredentialPayload): Promise<LoginResponse> {
  const response = await apiFetch<unknown>('/api/v1/auth/passkey/assert', {
    method: 'POST',
    body: { credential },
  })
  const wrapped = RestApiResponseSchema.parse(response)
  return LoginResponseSchema.parse(wrapped.data)
}

/**
 * Requests options for answering an existing second-step challenge with a passkey.
 *
 * Endpoint: POST /api/v1/auth/2fa/passkey/options
 *
 * Unlike the discoverable sign-in, the challenge already belongs to one account, so the server names
 * that account's credentials and nothing else may answer.
 *
 * @param challengeToken - the token the second step was opened with
 * @returns assertion options whose `allowCredentials` must be passed through untouched
 * @throws 401 AUTH_026 when the step itself expired
 */
export async function fetchSecondFactorPasskeyOptions(challengeToken: string): Promise<PasskeyAssertionOptions> {
  const response = await apiFetch<unknown>('/api/v1/auth/2fa/passkey/options', {
    method: 'POST',
    body: { challengeToken },
  })
  const wrapped = RestApiResponseSchema.parse(response)
  const publicKey = (wrapped.data as { publicKey?: unknown } | null)?.publicKey
  return PasskeyAssertionOptionsSchema.parse(publicKey)
}

/**
 * Completes the second step with a passkey assertion.
 *
 * Endpoint: POST /api/v1/auth/2fa/passkey/assert
 *
 * The answer is the same sign-in response the code path returns; a failure leaves the challenge
 * intact, so the reader can still type a code.
 *
 * @param challengeToken - the token the second step was opened with
 * @param credential - the assertion serialized by the page
 * @returns the session, exactly as a successful code submission would
 * @throws 401 AUTH_032 when the WebAuthn challenge was already used; AUTH_033 when it does not verify
 */
export async function assertSecondFactorPasskey(
  challengeToken: string,
  credential: PasskeyCredentialPayload,
): Promise<LoginResponse> {
  const response = await apiFetch<unknown>('/api/v1/auth/2fa/passkey/assert', {
    method: 'POST',
    body: { challengeToken, credential },
  })
  const wrapped = RestApiResponseSchema.parse(response)
  return LoginResponseSchema.parse(wrapped.data)
}

/**
 * Requests options for registering a new passkey.
 *
 * Endpoint: POST /api/v1/users/me/passkey/options
 *
 * @returns creation options, including the account's existing credentials to exclude
 * @throws 403 AUTH_031 when the session is older than the server accepts for security changes
 */
export async function fetchPasskeyRegistrationOptions(): Promise<PasskeyRegistrationOptions> {
  const response = await apiFetch<unknown>('/api/v1/users/me/passkey/options', { method: 'POST' })
  const wrapped = RestApiResponseSchema.parse(response)
  const publicKey = (wrapped.data as { publicKey?: unknown } | null)?.publicKey
  return PasskeyRegistrationOptionsSchema.parse(publicKey)
}

/**
 * Stores a freshly created credential.
 *
 * Endpoint: POST /api/v1/users/me/passkey
 *
 * @param credential - the attestation serialized by the page
 * @param name - optional label; the server falls back to `Passkey`
 * @returns the stored entry as the list would show it
 * @throws 409 AUTH_034 when this authenticator is already registered
 */
export async function registerPasskey(credential: PasskeyCredentialPayload, name?: string): Promise<Passkey> {
  const body = name ? { credential, name } : { credential }
  const response = await apiFetch<unknown>('/api/v1/users/me/passkey', { method: 'POST', body })
  const wrapped = RestApiResponseSchema.parse(response)
  return PasskeySchema.parse(wrapped.data)
}

/**
 * Lists the account's passkeys.
 *
 * Endpoint: GET /api/v1/users/me/passkey
 *
 * @returns every registered credential, newest first as the server orders them
 */
export async function fetchPasskeys(): Promise<Passkey[]> {
  const response = await apiFetch<unknown>('/api/v1/users/me/passkey', { method: 'GET' })
  const wrapped = RestApiResponseSchema.parse(response)
  return PasskeySchema.array().parse(wrapped.data)
}

/**
 * Renames one credential.
 *
 * Endpoint: PATCH /api/v1/users/me/passkey/{id}
 *
 * @param id - the row id from the list
 * @param name - the new label
 * @returns the updated entry
 */
export async function renamePasskey(id: string, name: string): Promise<Passkey> {
  const response = await apiFetch<unknown>(`/api/v1/users/me/passkey/${id}`, {
    method: 'PATCH',
    body: { name },
  })
  const wrapped = RestApiResponseSchema.parse(response)
  return PasskeySchema.parse(wrapped.data)
}

/**
 * Removes one credential.
 *
 * Endpoint: DELETE /api/v1/users/me/passkey/{id}
 *
 * @param id - the row id from the list
 * @throws 403 AUTH_031 when the session is too old for security changes
 * @throws 409 AUTH_018 when this would leave the account without any way to sign in
 */
export async function deletePasskey(id: string): Promise<void> {
  await apiFetch<unknown>(`/api/v1/users/me/passkey/${id}`, { method: 'DELETE' })
}
