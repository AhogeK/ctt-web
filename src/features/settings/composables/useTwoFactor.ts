import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { QueryClient } from '@tanstack/vue-query'
import {
  confirmTotpSetup,
  disableTwoFactor,
  fetchTwoFactorStatus,
  regenerateRecoveryCodes,
  startTotpSetup,
} from '@/lib/api/two-factor'
import type { TwoFactorCredential } from '@/lib/schemas/two-factor.schema'

/**
 * Query key for the account's second-factor state.
 *
 * Exported so every mutation that changes the state invalidates this exact key instead of
 * restating it: enable, disable and regeneration all move the same three facts.
 */
export const TWO_FACTOR_STATUS_QUERY_KEY = ['two-factor-status'] as const

/**
 * Re-reads the state after a change has settled.
 *
 * Settled rather than succeeded: a disable the server already applied still has to be reflected,
 * and no mutation writes the status locally — that would show a state the server never confirmed.
 *
 * @param queryClient - the client owning the status query
 */
function reconcileStatus(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: TWO_FACTOR_STATUS_QUERY_KEY })
}

/**
 * Reads whether the account needs a second factor, and how it would prove itself.
 *
 * @returns The status query.
 */
export function useTwoFactorStatus() {
  return useQuery({
    queryKey: TWO_FACTOR_STATUS_QUERY_KEY,
    queryFn: () => fetchTwoFactorStatus(),
    // The same short window the sibling settings queries use: this only changes when the reader
    // changes it on another tab, which is rare enough to not poll for.
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Requests a new secret to show the reader.
 *
 * @returns `mutation`; call `mutate(password?)`, where the password is omitted for OAuth-only accounts.
 */
export function useStartTwoFactorSetup() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (currentPassword?: string) => startTotpSetup(currentPassword),
    // A refusal here can mean the factor is already on (AUTH_028), so the card has to re-read the
    // status instead of keeping a cached "off" that the dialog just contradicted.
    onSettled: () => reconcileStatus(queryClient),
  })

  return { mutation }
}

/**
 * Confirms the pending secret and collects the recovery codes.
 *
 * @returns `mutation`; it resolves to the ten single-use codes.
 */
export function useConfirmTwoFactorSetup() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (code: string) => confirmTotpSetup(code),
    onSettled: () => reconcileStatus(queryClient),
  })

  return { mutation }
}

/**
 * Turns the second factor off.
 *
 * @returns `mutation`; it needs a TOTP code or an unused recovery code, not both.
 */
export function useDisableTwoFactor() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (credential: TwoFactorCredential) => disableTwoFactor(credential),
    onSettled: () => reconcileStatus(queryClient),
  })

  return { mutation }
}

/**
 * Replaces the recovery codes.
 *
 * @returns `mutation`; it resolves to the new ten codes and the previous batch stops working.
 */
export function useRegenerateRecoveryCodes() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (credential: TwoFactorCredential) => regenerateRecoveryCodes(credential),
    onSettled: () => reconcileStatus(queryClient),
  })

  return { mutation }
}
