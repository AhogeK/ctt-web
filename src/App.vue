<script setup lang="ts">
/**
 * Root application component.
 * Provides global error handling via ErrorBoundary wrapper,
 * toast notification system via Sonner Toaster,
 * and handles route rendering through Vue Router.
 * Initializes theme to follow system preference on mount.
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import ErrorBoundary from '@/components/app/ErrorBoundary.vue'
import { Toaster } from '@/components/ui/sonner'
import { useThemeStore } from '@/stores/theme'
import { TERMS_EXPIRED_EVENT, resolveTermsQueue, rejectTermsQueue } from '@/lib/api/instance'
import TermsDialog from '@/features/auth/components/TermsDialog.vue'
import { RouteNames } from '@/router/route-names'

const router = useRouter()
const isTermsDialogOpen = ref(false)
const isLoginTimeTermsExpired = ref(false)

function handleTermsExpired() {
  // Track if this happened during login (user on auth pages)
  const currentRoute = router.currentRoute.value
  isLoginTimeTermsExpired.value = currentRoute.path.startsWith('/auth/') || currentRoute.name === RouteNames.LOGIN
  isTermsDialogOpen.value = true
}

function handleTermsAccepted() {
  resolveTermsQueue()
  // Navigate to dashboard if terms expired during login
  if (isLoginTimeTermsExpired.value) {
    isLoginTimeTermsExpired.value = false
    const redirect = router.currentRoute.value.query.redirect as string
    router.push(redirect || { name: RouteNames.DASHBOARD })
  }
}

function handleTermsRejected() {
  rejectTermsQueue()
  isLoginTimeTermsExpired.value = false
}

// Initialize theme to follow system preference
onMounted(() => {
  useThemeStore().setTheme('auto')
  globalThis.addEventListener(TERMS_EXPIRED_EVENT, handleTermsExpired)
})

onUnmounted(() => {
  globalThis.removeEventListener(TERMS_EXPIRED_EVENT, handleTermsExpired)
})
</script>

<template>
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
  <Toaster position="top-right" :expand="true" rich-colors />
  <TermsDialog
    v-if="isTermsDialogOpen"
    v-model:open="isTermsDialogOpen"
    @accepted="handleTermsAccepted"
    @rejected="handleTermsRejected"
  />
</template>
