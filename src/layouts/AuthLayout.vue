<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * AuthLayout - Minimal centered layout for authentication pages
 *
 * Provides a conversion-focused container without navigation chrome.
 * Used for login, register, and other standalone auth flows.
 */
const props = defineProps<{
  /** Additional classes for the layout container */
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="auth-layout"
    :class="cn('min-h-screen flex items-center justify-center bg-background p-4', props.class)"
  >
    <div class="w-full max-w-md">
      <slot />
    </div>
  </div>
</template>
