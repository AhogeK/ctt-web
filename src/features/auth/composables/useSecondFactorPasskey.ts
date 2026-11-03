import { onUnmounted, ref } from 'vue'
import { assertSecondFactorPasskey, fetchSecondFactorPasskeyOptions } from '@/lib/api'
import type { LoginResponse } from '@/lib/schemas/auth.schema'
import { extractErrorCode, isApiError } from '@/lib/utils/api-error'
import { base64UrlToBytes, serializeAssertedCredential } from '@/lib/utils/webauthn'
import { rememberPasskeyUse } from '@/lib/utils/passkey-preference'

/**
 * Answers the pending second step with a passkey instead of a code.
 *
 * The challenge here belongs to one account, so the browser is told which credentials may answer it;
 * a passkey from another account must not complete this step. A failed ceremony leaves the code form
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
    controller = new AbortController()

    try {
      const options = await fetchSecondFactorPasskeyOptions(challengeToken)
      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge: base64UrlToBytes(options.challenge),
          rpId: options.rpId,
          timeout: options.timeout,
          userVerification: options.userVerification,
          // Passed through as the server sent it: filtering here would be a second, quieter rule
          // about which credentials may answer.
          allowCredentials: options.allowCredentials?.map((entry) => ({
            type: entry.type,
            id: base64UrlToBytes(entry.id),
            transports: entry.transports as AuthenticatorTransport[] | undefined,
          })),
        },
        signal: controller.signal,
      })) as PublicKeyCredential | null

      if (!credential) return null
      const response = await assertSecondFactorPasskey(challengeToken, serializeAssertedCredential(credential))
      // The next visit to the login page may offer the picker by itself.
      rememberPasskeyUse()
      return response
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'NotAllowedError')) {
        return null
      }
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
