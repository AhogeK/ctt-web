import { watch } from 'vue'
import { fetchPasskeys } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { hasUsedPasskey, rememberPasskeyUse } from '@/lib/utils/passkey-preference'

/**
 * Learns, once per session, whether the signed-in account holds a passkey.
 *
 * The login page has to decide whether to open the passkey picker by itself, and it cannot ask the
 * authenticator without starting a ceremony — which would open an empty picker for people who hold
 * nothing. A browser that has just signed in can answer it honestly: the account's own list is one
 * request away, and knowing it turns "a passkey exists somewhere" into "this browser may be offered
 * one next time".
 *
 * Runs on the root component so every sign-in path covers it, and costs nothing once the answer is
 * remembered or when the account has none.
 */
export function useRememberPasskeyAvailability(): void {
  const authStore = useAuthStore()

  watch(
    () => authStore.isAuthenticated,
    async (authenticated) => {
      if (!authenticated || hasUsedPasskey()) return
      try {
        const passkeys = await fetchPasskeys()
        if (passkeys.length > 0) rememberPasskeyUse()
      } catch {
        // A list this session could not read simply leaves the offer behind the button.
      }
    },
    { immediate: true },
  )
}
