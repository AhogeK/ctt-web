<script setup lang="ts">
/**
 * Root application component.
 * Provides global toast notification system via Sonner Toaster
 * and handles route rendering through Vue Router.
 */
import { RouterView } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <RouterView />
  <Toaster position="top-right" :expand="true" rich-colors />
</template>
