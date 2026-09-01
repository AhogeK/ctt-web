<script setup lang="ts">
/**
 * ChartSection — a titled chart panel with explicit loading / error / empty
 * states. Each dashboard chart renders inside one of these so a slow or
 * failing endpoint never blocks the rest of the grid.
 *
 * Slot content is rendered only when data is ready (not loading, no error,
 * not empty). Retry emits `retry` so the owner can refetch its query.
 */
import { AlertTriangle } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

defineProps<{
  /** Section heading shown above the chart area */
  title: string
  /** True while the underlying query is fetching */
  loading: boolean
  /** True when the underlying query failed */
  error: boolean
  /** True when the query resolved with no data to show */
  empty: boolean
}>()

defineEmits<{
  /** User clicked the retry action in the error state */
  retry: []
}>()
</script>

<template>
  <section class="rounded-lg border border-border/50 bg-card p-4">
    <header class="mb-4">
      <h2 class="text-sm font-medium text-foreground">{{ title }}</h2>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col gap-3" data-testid="chart-loading">
      <Skeleton class="h-8 w-full" />
      <Skeleton class="h-8 w-3/4" />
      <Skeleton class="h-8 w-1/2" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center gap-3 py-8" data-testid="chart-error">
      <AlertTriangle class="h-8 w-8 text-destructive" />
      <p class="text-sm text-muted-foreground">Failed to load data</p>
      <Button variant="outline" size="sm" @click="$emit('retry')"> Retry </Button>
    </div>

    <!-- Empty -->
    <div v-else-if="empty" class="py-8 text-center text-sm text-muted-foreground" data-testid="chart-empty">
      No data for the selected range
    </div>

    <!-- Data -->
    <slot v-else />
  </section>
</template>
