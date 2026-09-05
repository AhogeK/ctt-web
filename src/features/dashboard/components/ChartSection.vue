<script setup lang="ts">
/**
 * ChartSection — a titled chart panel with explicit loading / error / empty
 * states. Each dashboard chart renders inside one of these so a slow or
 * failing endpoint never blocks the rest of the grid.
 *
 * Slot content is rendered only when data is ready (not loading, no error,
 * not empty). Retry emits `retry` so the owner can refetch its query.
 * The optional `actions` slot renders in the header next to the title,
 * under the same visibility rule — for panel-scoped controls like the
 * heatmap year selector.
 */
import { AlertTriangle } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps<{
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
  <section
    class="group flex min-w-0 flex-col rounded-xl border border-border/60 bg-linear-to-b from-card to-muted/40 p-4 transition-colors hover:border-border"
  >
    <header class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{{ title }}</h2>
      <!-- Optional panel-scoped actions (e.g. the heatmap year selector);
           hidden while loading/error/empty so a dead control never shows -->
      <div v-if="!loading && !error && !empty" class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-1 flex-col justify-center gap-3" data-testid="chart-loading">
      <Skeleton class="h-8 w-full" />
      <Skeleton class="h-8 w-3/4" />
      <Skeleton class="h-8 w-1/2" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex flex-1 flex-col items-center justify-center gap-3 py-8"
      data-testid="chart-error"
    >
      <AlertTriangle class="h-8 w-8 text-destructive" />
      <p class="text-sm text-muted-foreground">Failed to load data</p>
      <Button variant="outline" size="sm" @click="$emit('retry')"> Retry </Button>
    </div>

    <!-- Empty: flex-1 + centered so a sparse panel matches its row sibling's height -->
    <div
      v-else-if="empty"
      class="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground"
      data-testid="chart-empty"
    >
      No data for the selected range
    </div>

    <!-- Data -->
    <div v-else class="flex flex-1 flex-col justify-center">
      <slot />
    </div>
  </section>
</template>
