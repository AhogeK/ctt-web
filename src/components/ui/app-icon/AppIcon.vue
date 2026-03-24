<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Icon, type IconProps } from '@iconify/vue'
import { cn } from '@/lib/utils'

/**
 * Wrapper for Iconify icons with consistent sizing and styling.
 * @example <AppIcon icon="mdi:account" class="text-primary" />
 */
interface Props {
  /** Iconify icon ID (e.g., "mdi:account", "lucide:check") */
  icon: IconProps['icon']
  /** Icon size */
  size?: string | number
  /** Accessible label for screen readers */
  label?: string
  /** CSS classes */
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  size: '1em',
})
</script>

<template>
  <Icon
    :icon="props.icon"
    :width="props.size"
    :height="props.size"
    :aria-hidden="!props.label"
    :aria-label="props.label"
    :class="cn(props.class)"
  />
</template>
