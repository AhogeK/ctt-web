<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { onErrorCaptured, ref, shallowRef } from 'vue'
import { TriangleAlert } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

/**
 * ErrorBoundary - Catches errors from child components and displays fallback UI
 *
 * This component prevents white-screen crashes by catching rendering errors
 * in its subtree and showing a user-friendly error message with retry option.
 *
 * @example
 * ```vue
 * <ErrorBoundary>
 *   <RouterView />
 * </ErrorBoundary>
 * ```
 *
 * @props stopPropagation - Whether to stop error propagation to parent boundaries (default: true)
 */

interface Props {
  /** Whether to stop error propagation to parent error boundaries */
  stopPropagation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  stopPropagation: true,
})

/**
 * Tracks whether an error has been captured
 * Using shallowRef for boolean primitive for better performance
 */
const hasError = shallowRef(false)

/**
 * Stores the captured error object for display in development mode
 * Using ref since the entire error object may be replaced
 */
const errorInfo = ref<Error | null>(null)

/**
 * Component instance where the error occurred (for debugging)
 */
const componentInstance = ref<ComponentPublicInstance | null>(null)

/**
 * Check if running in development mode
 * Cannot use import.meta.env.DEV directly in template
 */
const isDev = import.meta.env.DEV

/**
 * Error capture handler
 *
 * Sets error state, logs to console with prefix, and controls propagation
 * based on stopPropagation prop.
 *
 * @param error - The captured error object
 * @param instance - The component instance where error occurred
 * @param info - Vue error capture info object
 * @returns boolean - Whether to continue propagating the error
 */
onErrorCaptured((error, instance, info) => {
  hasError.value = true
  errorInfo.value = error
  componentInstance.value = instance

  // Log error with prefix for debugging
  console.error('[ErrorBoundary Captured]', error, { instance, info })

  // Return false to stop propagation, true to continue
  return !props.stopPropagation
})

/**
 * Resets error state to allow retry
 *
 * Clears hasError flag and error info, allowing child components
 * to re-render. Useful for transient errors that may succeed on retry.
 */
function handleReset() {
  hasError.value = false
  errorInfo.value = null
  componentInstance.value = null
}
</script>

<template>
  <!-- Error state: show fallback UI -->
  <div
    v-if="hasError"
    class="error-boundary border border-destructive bg-destructive/5 rounded-lg p-6"
    data-slot="error-boundary"
    data-state="error"
  >
    <!-- Error header with warning icon -->
    <div class="flex items-start gap-4">
      <TriangleAlert class="h-6 w-6 text-destructive shrink-0 mt-0.5" />
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-destructive mb-2">Component Render Error</h3>
        <p class="text-sm text-muted-foreground mb-4">Please refresh the page or contact administrator</p>

        <!-- Error details in development mode -->
        <details v-if="isDev && errorInfo" class="mb-4 text-xs bg-muted/50 rounded p-3">
          <summary class="cursor-pointer font-medium text-muted-foreground mb-2">
            Error Details (Development Mode Only)
          </summary>
          <div class="space-y-2 overflow-auto">
            <div>
              <span class="font-medium">Message:</span>
              <pre class="whitespace-pre-wrap text-destructive">{{ errorInfo.message }}</pre>
            </div>
            <div v-if="errorInfo.stack">
              <span class="font-medium">Stack:</span>
              <pre class="whitespace-pre-wrap text-muted-foreground">{{ errorInfo.stack }}</pre>
            </div>
            <div v-if="componentInstance?.$options?.name">
              <span class="font-medium">Component:</span>
              <span class="text-muted-foreground">{{ componentInstance.$options.name }}</span>
            </div>
          </div>
        </details>

        <!-- Retry button -->
        <Button variant="outline" size="sm" @click="handleReset"> Try Again </Button>
      </div>
    </div>
  </div>

  <!-- Normal state: render children -->
  <slot v-else />
</template>

<style scoped>
.error-boundary {
  max-width: 100%;
  overflow: hidden;
}

pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
