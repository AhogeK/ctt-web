import { useMutation } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { deleteAccount } from '@/lib/api/user'
import { useAuthStore } from '@/stores/auth'
import { RouteNames } from '@/router/route-names'

/**
 * The one server code this feature answers itself. A deletion can also come back as `USER_013` (a
 * password is required and none was sent) or `AUTH_025` (the session is an API key, not the web
 * app). `AUTH_025` is unreachable from this client; `USER_013` is reachable only when the profile
 * fetch failed, which `DangerZone` now refuses to open its dialog on — both are left to the
 * generic message rather than a field of their own.
 */
export const PASSWORD_MISMATCH_CODE = 'USER_014'

/**
 * Delete the signed-in user's own account.
 *
 * The success path retires the session **locally and immediately**, and deliberately does not call
 * the sign-out endpoint: there is no account left to sign out of, so that request could only come
 * back 401 and drag the auth interceptor into reacting to it. For the same reason this must be the
 * last request the tab makes — the server cannot revoke an already-issued access token before it
 * expires (up to 15 minutes, the same trade-off as signing out), so anything sent afterwards would
 * still be authenticated as a deleted account.
 *
 * @returns the deletion mutation plus the error codes the dialog maps
 */
export function useDeleteAccount() {
  const router = useRouter()
  const authStore = useAuthStore()

  const mutation = useMutation({
    // `null` for an OAuth-only account: the request still carries `{}`, because the endpoint's
    // body is required even when there is no password to put in it.
    mutationFn: (password: string | null) => deleteAccount(password),
    onSuccess: async () => {
      // Drops the tokens, stops the silent-refresh timer, resets the profile fields and clears the
      // query caches — everything that belonged to the account that no longer exists.
      authStore.clearAuth()
      await router.replace({ name: RouteNames.LOGIN })
      toast.success('Your account has been deleted', {
        // Said plainly because it is the one reassuring thing that is still true: the server's copy
        // is gone, and the plugin's local history is the authority it can push again from.
        description: 'The plugin still holds your local history, and can sync it again if you register anew.',
      })
    },
  })

  return { mutation }
}
