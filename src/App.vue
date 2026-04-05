<script setup lang="ts">
/**
 * Root application component.
 * Provides global error handling via ErrorBoundary wrapper,
 * toast notification system via Sonner Toaster,
 * and handles route rendering through Vue Router.
 */
import { RouterView } from 'vue-router'
import ErrorBoundary from '@/components/app/ErrorBoundary.vue'
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
  <Toaster position="top-right" :expand="true" rich-colors />
</template>
