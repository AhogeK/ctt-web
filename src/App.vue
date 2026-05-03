<script setup lang="ts">
/**
 * Root application component.
 * Provides global error handling via ErrorBoundary wrapper,
 * toast notification system via Sonner Toaster,
 * and handles route rendering through Vue Router.
 * Initializes theme to follow system preference on mount.
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import ErrorBoundary from '@/components/app/ErrorBoundary.vue'
import { Toaster } from '@/components/ui/sonner'
import { useThemeStore } from '@/stores/theme'
import { TERMS_EXPIRED_EVENT, resolveTermsQueue, rejectTermsQueue } from '@/lib/api/instance'
import TermsDialog from '@/features/auth/components/TermsDialog.vue'

const isTermsDialogOpen = ref(false)

function handleTermsExpired() {
  isTermsDialogOpen.value = true
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
  <TermsDialog v-model:open="isTermsDialogOpen" @accepted="resolveTermsQueue()" @rejected="rejectTermsQueue()" />
</template>
