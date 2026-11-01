import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import {
  RecoveryCodesSchema,
  StartTotpSetupResponseSchema,
  TwoFactorCredentialSchema,
  TwoFactorStatusSchema,
  type StartTotpSetupResponse,
  type TwoFactorCredential,
  type TwoFactorStatus,
} from '@/lib/schemas/two-factor.schema'
import { encodeBase64 } from '@/lib/utils'

/**
 * Reads whether the account needs a second factor.
 *
 * Endpoint: GET /api/v1/users/me/2fa
 *
 * @returns the current state, including how many recovery codes are still unused
 */
export async function fetchTwoFactorStatus(): Promise<TwoFactorStatus> {
  const response = await apiFetch<unknown>('/api/v1/users/me/2fa', { method: 'GET' })
  const wrapped = RestApiResponseSchema.parse(response)
  return TwoFactorStatusSchema.parse(wrapped.data)
}

/**
 * Starts a TOTP setup and returns the secret to show the reader.
 *
 * Endpoint: POST /api/v1/users/me/2fa/totp/start
 *
 * @param currentPassword - the account password; omitted for OAuth-only accounts, which the server
 * authenticates by how recent the session is instead
 * @returns the secret, its `otpauth://` URI, and the parameters an authenticator app needs
 * @throws 401 USER_013 / USER_014 when a password account did not prove its password
 * @throws 409 AUTH_028 when the account already has a confirmed secret
 */
export async function startTotpSetup(currentPassword?: string): Promise<StartTotpSetupResponse> {
  const body = currentPassword ? { currentPassword: encodeBase64(currentPassword) } : {}
  const response = await apiFetch<unknown>('/api/v1/users/me/2fa/totp/start', {
    method: 'POST',
    body,
  })
  const wrapped = RestApiResponseSchema.parse(response)
  return StartTotpSetupResponseSchema.parse(wrapped.data)
}

/**
 * Confirms the pending secret with one code and issues the first batch of recovery codes.
 *
 * Endpoint: POST /api/v1/users/me/2fa/totp/confirm
 *
 * @param code - the six-digit code from the authenticator app
 * @returns the ten single-use recovery codes, shown to the reader exactly once
 * @throws 401 AUTH_027 when the code does not match the pending secret
 */
export async function confirmTotpSetup(code: string): Promise<string[]> {
  const response = await apiFetch<unknown>('/api/v1/users/me/2fa/totp/confirm', {
    method: 'POST',
    body: { code: code.trim() },
  })
  const wrapped = RestApiResponseSchema.parse(response)
  return RecoveryCodesSchema.parse(wrapped.data).recoveryCodes
}

/**
 * Turns the second factor off.
 *
 * Endpoint: POST /api/v1/users/me/2fa/disable
 *
 * @param credential - a TOTP code or an unused recovery code, proving the reader still holds the factor
 * @throws 401 AUTH_027 when the credential does not match
 * @throws 409 AUTH_029 when the account has no confirmed secret
 */
export async function disableTwoFactor(credential: TwoFactorCredential): Promise<void> {
  const body = TwoFactorCredentialSchema.parse(credential)
  // The endpoint answers `204 No Content`: there is no envelope to parse, and parsing one would
  // throw on every success. Same shape as unbinding an OAuth account.
  await apiFetch<unknown>('/api/v1/users/me/2fa/disable', { method: 'POST', body })
}

/**
 * Replaces every unused recovery code with a fresh batch.
 *
 * Endpoint: POST /api/v1/users/me/2fa/recovery-codes/regenerate
 *
 * @param credential - a TOTP code or an unused recovery code
 * @returns the new ten codes; the previous batch stops working immediately
 * @throws 401 AUTH_027 when the credential does not match
 */
export async function regenerateRecoveryCodes(credential: TwoFactorCredential): Promise<string[]> {
  const body = TwoFactorCredentialSchema.parse(credential)
  const response = await apiFetch<unknown>('/api/v1/users/me/2fa/recovery-codes/regenerate', {
    method: 'POST',
    body,
  })
  const wrapped = RestApiResponseSchema.parse(response)
  return RecoveryCodesSchema.parse(wrapped.data).recoveryCodes
}
