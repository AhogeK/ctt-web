import { onUnmounted, ref } from 'vue'
import { assertSecondFactorPasskey, fetchSecondFactorPasskeyOptions } from '@/lib/api'
import type { LoginResponse } from '@/lib/schemas/auth.schema'
import { extractErrorCode, isApiError } from '@/lib/utils/api-error'
import { base64UrlToBytes, serializeAssertedCredential } from '@/lib/utils/webauthn'
import { rememberPasskeyUse } from '@/lib/utils/passkey-preference'

/**
 * Answers the pending second step with a passkey instead of a code.
 *
 * The authenticator is asked first, without a credential list: the server's list describes its own
 * record of the account, and a stale one — a credential re-registered, a transport this machine does
 * not have — makes the browser wait for a key that never arrives. The list is the fallback, and the
 * server decides ownership when it verifies the assertion; a failed ceremony leaves the code form
 * usable, which is why nothing is cleared on error.
 *
 * @returns the pending flag, the last failure code, and `signIn`
 */
export function useSecondFactorPasskey() {
  const pending = ref(false)
  const errorCode = ref<string | null>(null)
  let controller: AbortController | null = null

  /**
   * Runs the ceremony for one challenge.
   *
   * @param challengeToken - the token the second step was opened with
   * @returns the session, or null when the reader cancelled or the ceremony failed
   */
  async function signIn(challengeToken: string): Promise<LoginResponse | null> {
    if (pending.value) return null
    pending.value = true
    errorCode.value = null
    const attempt = new AbortController()
    controller = attempt

    /** The browser asks for one of the credentials the server named. */
    const ceremony = async (restrictToAccount: boolean) => {
      const options = await fetchSecondFactorPasskeyOptions(challengeToken)
      // The console is the only place a diagnosis belongs: the page shows a state, not internals.
      console.warn('[passkey] second step: options', {
        credentials: options.allowCredentials?.length ?? 0,
        rpId: options.rpId,
        userVerification: options.userVerification,
        timeout: options.timeout,
        transports: options.allowCredentials?.map((entry) => entry.transports?.join('+') ?? '-'),
        restrictToAccount,
      })
      return (await navigator.credentials.get({
        publicKey: {
          challenge: base64UrlToBytes(options.challenge),
          rpId: options.rpId,
          timeout: options.timeout,
          userVerification: options.userVerification,
          // Passed through as the server sent it: filtering here would be a second, quieter rule
          // about which credentials may answer.
          allowCredentials: restrictToAccount
            ? options.allowCredentials?.map((entry) => ({
                type: entry.type,
                id: base64UrlToBytes(entry.id),
                transports: entry.transports as AuthenticatorTransport[] | undefined,
              }))
            : undefined,
        },
        signal: attempt.signal,
      })) as PublicKeyCredential | null
    }

    try {
      let credential: PublicKeyCredential | null
      try {
        // Asked without a list first. The server's list is a hint built from its own record of this
        // account; when that record and the device disagree — a stale transport, a key registered
        // elsewhere — the browser waits for a credential that will never come and the button looks
        // dead. Letting the authenticator offer what it actually holds ends at the same server
        // check: an assertion for another account is refused there, not here.
        credential = await ceremony(false)
      } catch (error) {
        const refused = error instanceof DOMException && error.name === 'NotAllowedError'
        if (!refused) throw error
        // Nothing resident answered: fall back to naming this account's credentials explicitly.
        console.warn('[passkey] second step: the authenticator offered nothing, asking for the named list')
        credential = await ceremony(true)
      }

      if (!credential) return null
      const response = await assertSecondFactorPasskey(challengeToken, serializeAssertedCredential(credential))
      // The next visit to the login page may offer the picker by itself.
      rememberPasskeyUse()
      return response
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'NotAllowedError')) {
        // The name alone cannot separate "dismissed" from "nothing here can answer": both arrive as
        // NotAllowedError, and the reader needs a stage to report when neither is expected.
        console.warn('[passkey] second step: ceremony refused', { name: error.name, message: error.message })
        return null
      }
      console.warn('[passkey] second step failed', error)
      errorCode.value = isApiError(error) ? (extractErrorCode(error) ?? null) : 'PASSKEY_CEREMONY_FAILED'
      return null
    } finally {
      pending.value = false
      controller = null
    }
  }

  /** Stops a ceremony still waiting for the reader. */
  function cancel(): void {
    controller?.abort()
  }

  onUnmounted(cancel)

  return { pending, errorCode, signIn, cancel }
}
