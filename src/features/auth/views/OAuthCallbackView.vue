<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { RouteNames } from '@/router/route-names'
import { resolvePostAuthTarget } from '@/router/post-auth-redirect'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(() => {
  // An account with TOTP enabled comes back without a session: the server redirects with a
  // flag in the query and the challenge in the fragment, so nothing secret reaches the server
  // or a referrer. Read it, wipe it, and hand the reader to the same step the password flow uses.
  if (route.query.twoFactorRequired === 'true') {
    const fragment = new URLSearchParams(globalThis.location.hash.replace(/^#/, ''))
    const challengeToken = fragment.get('challengeToken')
    const expiresIn = Number(fragment.get('expiresIn'))

    // Clean the URL before anything else runs: the hash is a credential and history keeps it.
    history.replaceState(null, '', route.path)

    // Take the destination before the guard below: a failed challenge still has to leave no key
    // behind for a later sign-in to obey.
    const storedRedirect = sessionStorage.getItem('oauth_redirect')
    if (storedRedirect) {
      sessionStorage.removeItem('oauth_redirect')
    }

    // `Number(null)` is 0 and 0 is finite, so a missing lifetime would slip past a bare
    // finiteness check and blow up later inside the challenge schema.
    if (!challengeToken || !Number.isInteger(expiresIn) || expiresIn <= 0) {
      toast.error(t('auth.errors.oauthLoginFailed'), { description: t('auth.twoFactor.expired') })
      void router.replace({ name: RouteNames.LOGIN })
      return
    }

    authStore.setTwoFactorChallenge({
      twoFactorRequired: true,
      challengeToken,
      expiresIn,
    })

    const redirect = resolvePostAuthTarget(router, storedRedirect)
    void router.replace({
      name: RouteNames.LOGIN_TWO_FACTOR,
      query: redirect ? { redirect } : undefined,
    })
    return
  }

  const accessToken = route.query.accessToken as string | undefined
  const refreshToken = route.query.refreshToken as string | undefined
  const termsExpired = route.query.termsExpired === 'true'

  if (!accessToken || !refreshToken) {
    toast.error(t('auth.errors.oauthLoginFailed'), { description: t('auth.errors.missingTokens') })
    void router.replace({ name: RouteNames.LOGIN })
    return
  }

  authStore.loginWithOAuth({ accessToken, refreshToken, termsExpired })

  // Clean URL query params to prevent token leakage in browser history
  history.replaceState(null, '', route.path)

  if (!termsExpired) {
    const queryRedirect = route.query.redirect as string | undefined
    const storedRedirect = sessionStorage.getItem('oauth_redirect')
    if (storedRedirect) {
      sessionStorage.removeItem('oauth_redirect')
    }
    const redirect = resolvePostAuthTarget(router, queryRedirect ?? storedRedirect)
    void router.replace(redirect ?? { name: RouteNames.DASHBOARD })
  }
  // If termsExpired, App.vue handles TermsDialog display and post-acceptance navigation
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="flex flex-col items-center gap-3">
      <div
        class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary dark:border-white/20 dark:border-t-accent"
      />
      <p class="text-sm text-muted-foreground dark:text-muted-foreground">{{ t('auth.oauthErrors.completing') }}</p>
    </div>
  </div>
</template>
