<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Minimal blank layout for pages without navigation.
 * Used for login, register, 404, and other standalone pages.
 */
const props = defineProps<{
  /** Additional classes for the layout container */
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div data-slot="blank-layout" :class="cn('min-h-screen bg-background', props.class)">
    <slot />
  </div>
</template>
