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
