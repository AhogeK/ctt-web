import { computed, onUnmounted, ref } from 'vue'
import { fetchPasskeyAssertionOptions, assertPasskey } from '@/lib/api'
import type { LoginResponse } from '@/lib/schemas/auth.schema'
import { extractErrorCode, isApiError } from '@/lib/utils/api-error'
import { rememberPasskeyUse } from '@/lib/utils/passkey-preference'
import {
  base64UrlToBytes,
  isConditionalMediationAvailable,
  isPasskeySupported,
  serializeAssertedCredential,
} from '@/lib/utils/webauthn'

/**
 * Runs the passkey sign-in ceremony once.
 *
 * The two ways in share this: the explicit button chooses an entry with `mediation: 'optional'`,
 * while the username field arms `'conditional'` so the browser can offer accounts as autofill.
 *
 * The challenge is requested per attempt, and a page load costs one only for a reader who has signed
 * in with a passkey here before: the anonymous endpoint is rate limited per address, so visitors
 * who have never used one must not spend that budget.
 *
 * @returns whether this browser can run the ceremony, the pending flag, and `signIn`
 */
export function usePasskeySignIn() {
  const supported = isPasskeySupported()
  /** True only while an explicit attempt is in flight; the button reads it. */
  const pending = ref(false)
  const errorCode = ref<string | null>(null)
  let controller: AbortController | null = null
  /**
   * Whether a conditional request is waiting inside the username field. Tracked apart from
   * `pending` because that request settles only when the reader picks an entry or navigates away,
   * and sharing one flag would leave the explicit button disabled for the life of the page.
   */
  let conditionalArmed = false

  /**
   * Signs in with whichever credential the reader picks.
   *
   * @param mediation - `'conditional'` lets the browser offer accounts inside the field's autofill;
   * `'optional'` asks directly. A conditional request that fails because nothing was chosen has to
   * stay silent: the reader simply typed a password instead.
   * @returns the sign-in response, or null when the reader backed out
   */
  async function signIn(mediation: 'conditional' | 'optional'): Promise<LoginResponse | null> {
    if (!supported) return null
    if (mediation === 'optional') {
      if (pending.value) return null
      // The button is the reader asking directly: drop the request waiting in the field first, so
      // the browser never holds two ceremonies at once.
      cancel()
      pending.value = true
      errorCode.value = null
    } else {
      if (conditionalArmed || pending.value) return null
      conditionalArmed = true
    }

    const attempt = new AbortController()
    controller = attempt

    /** One ceremony: fresh options, the reader's authenticator, and the server's verdict. */
    const runCeremony = async (): Promise<LoginResponse | null> => {
      const options = await fetchPasskeyAssertionOptions()
      // The discoverable sign-in names no credentials: the authenticator, not the page, decides
      // which account answers. Anything the server might send here is dropped for that reason.
      const { allowCredentials: _unused, ...requestOptions } = options
      const credential = (await navigator.credentials.get({
        publicKey: {
          ...requestOptions,
          challenge: base64UrlToBytes(options.challenge),
        },
        mediation,
        signal: attempt.signal,
      })) as PublicKeyCredential | null

      if (!credential) return null
      return assertPasskey(serializeAssertedCredential(credential))
    }

    try {
      let response: LoginResponse | null
      try {
        response = await runCeremony()
      } catch (error) {
        // A challenge is short lived and a conditional request keeps waiting while the reader types,
        // so an expired one is routine. Ask for a new challenge and let them answer once more.
        if (!isApiError(error) || extractErrorCode(error) !== 'AUTH_032') throw error
        response = await runCeremony()
      }
      if (!response) return null
      // The next visit may offer the ceremony on load instead of waiting to be asked.
      rememberPasskeyUse()
      return response
    } catch (error) {
      // Closing the system prompt and finding no credential both arrive as NotAllowedError, and
      // the browser has already said something either way: a toast on top of that would only ask
      // the reader to dismiss the same message twice.
      if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'NotAllowedError')) {
        return null
      }
      if (isApiError(error)) {
        errorCode.value = extractErrorCode(error) ?? null
      } else {
        errorCode.value = 'PASSKEY_CEREMONY_FAILED'
      }
      return null
    } finally {
      if (mediation === 'optional') pending.value = false
      else conditionalArmed = false
      // An attempt that already handed the slot to a newer one must not clear its controller.
      if (controller === attempt) controller = null
    }
  }

  /**
   * Arms the field-driven flow when the browser supports it.
   *
   * Called on the first focus of the username field, which is the moment the browser is allowed to
   * show its autofill list.
   */
  const conditionalSupported = ref(false)
  void isConditionalMediationAvailable().then((available) => {
    conditionalSupported.value = available
  })

  /** Stops a ceremony that is still waiting for the reader. */
  function cancel(): void {
    controller?.abort()
  }

  onUnmounted(cancel)

  return {
    supported,
    conditionalSupported: computed(() => conditionalSupported.value),
    pending,
    errorCode,
    signIn,
    cancel,
  }
}
