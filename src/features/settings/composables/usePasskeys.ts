import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  deletePasskey,
  fetchPasskeys,
  fetchPasskeyRegistrationOptions,
  registerPasskey,
  renamePasskey,
} from '@/lib/api'
import type { Passkey } from '@/lib/schemas/passkey.schema'
import { base64UrlToBytes, serializeCreatedCredential } from '@/lib/utils/webauthn'
import { forgetPasskeyUse, rememberPasskeyUse } from '@/lib/utils/passkey-preference'

/** Query key for the account's passkeys, shared by every mutation that changes the list. */
export const PASSKEYS_QUERY_KEY = ['passkeys'] as const

/**
 * Raised when the reader dismisses the system prompt.
 *
 * The prompt has already said something, and dismissing it is a decision rather than a failure, so
 * callers stay silent instead of reporting an error the reader caused on purpose.
 */
export class PasskeyCeremonyCancelled extends Error {
  constructor() {
    super('Passkey ceremony cancelled')
    this.name = 'PasskeyCeremonyCancelled'
  }
}

/**
 * Reads the account's registered passkeys.
 *
 * @returns The list query; the server order is kept.
 */
export function usePasskeys() {
  return useQuery({
    queryKey: PASSKEYS_QUERY_KEY,
    queryFn: () => fetchPasskeys(),
    // Same short window as the sibling security queries: this only changes when the reader changes
    // it, which is rare enough not to poll for.
    staleTime: 30 * 1000,
  })
}

/**
 * Runs the registration ceremony and stores the result.
 *
 * The options come from the server on every attempt — the challenge is single use — and the byte
 * fields are converted before the browser sees them: `create()` rejects strings where it wants
 * buffers, and `excludeCredentials` is the one place where a missed conversion silently registers a
 * duplicate.
 *
 * @returns A mutation taking the label the reader typed (optional) and resolving to the new entry.
 */
export function useRegisterPasskey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name?: string): Promise<Passkey> => {
      const options = await fetchPasskeyRegistrationOptions()
      let credential: PublicKeyCredential | null
      try {
        credential = (await navigator.credentials.create({
          publicKey: {
            challenge: base64UrlToBytes(options.challenge),
            rp: options.rp,
            user: {
              id: base64UrlToBytes(options.user.id),
              name: options.user.name,
              displayName: options.user.displayName,
            },
            pubKeyCredParams: options.pubKeyCredParams,
            timeout: options.timeout,
            attestation: (options.attestation ?? 'none') as AttestationConveyancePreference,
            excludeCredentials: options.excludeCredentials?.map((entry) => ({
              type: entry.type,
              id: base64UrlToBytes(entry.id),
              transports: entry.transports as AuthenticatorTransport[] | undefined,
            })),
            // Whatever the server asked for: demanding more on the client would silently change
            // the rule it set (and refuse authenticators it considered sufficient).
            authenticatorSelection: options.authenticatorSelection ?? {
              residentKey: 'required',
              userVerification: 'required',
            },
          },
        })) as PublicKeyCredential | null
      } catch (error) {
        // Dismissing the prompt rejects; `create()` never resolves to null.
        if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'NotAllowedError')) {
          throw new PasskeyCeremonyCancelled()
        }
        throw error
      }

      if (!credential) throw new PasskeyCeremonyCancelled()
      return registerPasskey(serializeCreatedCredential(credential), name)
    },
    onSuccess: () => {
      // Adding one proves this browser holds a credential, which is exactly what the login page
      // needs to know before it opens the picker on its own.
      rememberPasskeyUse()
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY }),
  })
}

/**
 * Renames one entry; the list is re-read from the server afterwards.
 *
 * @returns A mutation taking the entry id and its new label.
 */
export function useRenamePasskey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renamePasskey(id, name),
    onSettled: () => queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY }),
  })
}

/**
 * Removes one entry.
 *
 * @returns A mutation taking the entry id; the list is re-read so a refused removal leaves the
 * page showing what the server actually holds.
 */
export function useDeletePasskey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePasskey(id),
    onSuccess: (_data, id) => {
      // The login page opens the picker on its own only because this browser used to hold one; with
      // the last one gone that list would be empty on every visit.
      const remaining = queryClient.getQueryData<Passkey[]>(PASSKEYS_QUERY_KEY)?.filter((entry) => entry.id !== id)
      if (remaining?.length === 0) forgetPasskeyUse()
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY }),
  })
}
