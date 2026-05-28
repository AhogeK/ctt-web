<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { RouteNames } from '@/router/route-names'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(() => {
  const accessToken = route.query.accessToken as string | undefined
  const refreshToken = route.query.refreshToken as string | undefined
  const termsExpired = route.query.termsExpired === 'true'

  if (!accessToken || !refreshToken) {
    toast.error('OAuth login failed', { description: 'Missing authentication tokens' })
    void router.replace({ name: RouteNames.LOGIN })
    return
  }

  authStore.loginWithOAuth({ accessToken, refreshToken, termsExpired })

  // Clean URL query params to prevent token leakage in browser history
  history.replaceState(null, '', route.path)

  if (!termsExpired) {
    const redirect = route.query.redirect as string | undefined
    void router.replace(redirect || { name: RouteNames.DASHBOARD })
  }
  // If termsExpired, App.vue handles TermsDialog display and post-acceptance navigation
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="flex flex-col items-center gap-3">
      <div
        class="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#5e6ad2] dark:border-white/20 dark:border-t-[#7170ff]"
      />
      <p class="text-sm text-gray-500 dark:text-[#8a8f98]">Completing sign in...</p>
    </div>
  </div>
</template>
