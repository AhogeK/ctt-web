<script setup lang="ts">
/**
 * Root application component.
 * Provides global error handling via ErrorBoundary wrapper,
 * toast notification system via Sonner Toaster,
 * and handles route rendering through Vue Router.
 * Initializes theme to follow system preference on mount.
 */
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import ErrorBoundary from '@/components/app/ErrorBoundary.vue'
import { Toaster } from '@/components/ui/sonner'
import { useThemeStore } from '@/stores/theme'

// Initialize theme to follow system preference
onMounted(() => {
  useThemeStore().setTheme('auto')
})
</script>

<template>
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
  <Toaster position="top-right" :expand="true" rich-colors />
</template>
