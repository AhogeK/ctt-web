import { apiFetch } from './instance'
import { RestApiResponseSchema, EmptyResponseDataSchema, type EmptyResponse } from '@/lib/schemas/api.schema'
import { z } from 'zod'
import { encodeBase64 } from '@/lib/utils'

/**
 * Email status response schema from GET /api/v1/users/me/email/status.
 */
const EmailStatusSchema = z.object({
  email: z.email(),
  emailVerified: z.boolean(),
  emailChangePending: z.boolean(),
  pendingNewEmail: z.email().nullable(),
})

export type EmailStatus = z.infer<typeof EmailStatusSchema>

/**
 * Fetches the current user's email status.
 *
 * Endpoint: GET /api/v1/users/me/email/status
 *
 * @returns Email status including verification state and pending change info
 */
export async function fetchEmailStatus(): Promise<EmailStatus> {
  const response = await apiFetch<unknown>('/api/v1/users/me/email/status', {
    method: 'GET',
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return EmailStatusSchema.parse(wrapped.data)
}

/**
 * Requests an email change by sending a verification email to the new address.
 *
 * Endpoint: POST /api/v1/users/me/email/change-request
 *
 * @param params - New email and current password for confirmation
 */
export async function requestEmailChange(params: { newEmail: string; password: string }): Promise<EmptyResponse> {
  const encodedParams = { newEmail: params.newEmail, password: encodeBase64(params.password) }
  const response = await apiFetch<unknown>('/api/v1/users/me/email/change-request', {
    method: 'POST',
    body: encodedParams,
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return EmptyResponseDataSchema.parse(wrapped.data)
}

/**
 * Confirms an email change using the token from the verification email.
 *
 * Endpoint: POST /api/v1/users/me/email/change-confirm
 *
 * @param params - Verification token from the email link
 */
export async function confirmEmailChange(params: { token: string }): Promise<EmptyResponse> {
  const response = await apiFetch<unknown>('/api/v1/users/me/email/change-confirm', {
    method: 'POST',
    body: params,
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return EmptyResponseDataSchema.parse(wrapped.data)
}

/**
 * Cancels a pending email change request.
 *
 * Endpoint: DELETE /api/v1/users/me/email/change-request
 */
export async function cancelEmailChange(): Promise<EmptyResponse> {
  const response = await apiFetch<unknown>('/api/v1/users/me/email/change-request', {
    method: 'DELETE',
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return EmptyResponseDataSchema.parse(wrapped.data)
}

/**
 * Resends the verification email for a pending email change.
 *
 * Endpoint: POST /api/v1/users/me/email/resend-verification
 */
export async function resendEmailChangeVerification(): Promise<EmptyResponse> {
  const response = await apiFetch<unknown>('/api/v1/users/me/email/resend-verification', {
    method: 'POST',
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return EmptyResponseDataSchema.parse(wrapped.data)
}
