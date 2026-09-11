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
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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

/** The chart area, measured to keep the placeholder states the same height. */
const dataArea = ref<HTMLElement | null>(null)

/**
 * Height of the last rendered chart area, in px.
 *
 * The loading / error / empty states REPLACE the slot, so whatever they render
 * becomes the card's height. The skeletons are a fixed ~120px while a chart is
 * usually taller, so a refetch visibly collapsed the card and then snapped back
 * — measured on the heatmap: 379px → 188px → 379px when picking an uncached
 * year. (The grid's `stretch` keeps ROW heights aligned, so two-across layouts
 * hid this behind the taller sibling; a single-column layout has no sibling to
 * hide behind.)
 *
 * Carrying the measured height across the swap removes the jump for every panel
 * and every breakpoint, and needs no per-panel height constants.
 */
const lastHeight = ref(0)

/** Applies the remembered height to the placeholder, or nothing on first load. */
const placeholderStyle = computed(() => (lastHeight.value > 0 ? { minHeight: `${lastHeight.value}px` } : undefined))

let sizeObserver: ResizeObserver | null = null

/**
 * Measure through a ResizeObserver rather than a lifecycle hook: the chart
 * inside the slot finishes sizing ASYNCHRONOUSLY (ECharts measures its
 * container, the heatmap derives its height from that width), so measuring at
 * mount/update time caught a partially-sized element and left an 18px jump.
 * The observer reports every settled size instead.
 */
watch(
  dataArea,
  (el) => {
    sizeObserver?.disconnect()
    sizeObserver = null
    if (el === null || typeof ResizeObserver === 'undefined') return
    sizeObserver = new ResizeObserver(() => {
      const measured = el.offsetHeight
      if (measured > 0 && measured !== lastHeight.value) lastHeight.value = measured
    })
    sizeObserver.observe(el)
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  sizeObserver?.disconnect()
  sizeObserver = null
})
</script>

<template>
  <section
    class="group flex min-w-0 flex-col rounded-xl border border-border/60 bg-linear-to-b from-card to-muted/40 p-4 transition-colors hover:border-border"
  >
    <header class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{{ title }}</h2>
      <!-- Panel-scoped actions (e.g. the heatmap year selector) stay mounted in
           EVERY state. Hiding them while loading shrank the header by the
           control's height, so picking a year made the card dip before it
           recovered — and the control the user just clicked vanishing is worse
           than it being briefly inert while data loads. -->
      <div class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <!-- Loading: carries the last chart's height so a refetch cannot collapse
         the card (see `lastHeight`) -->
    <div
      v-if="loading"
      class="flex flex-1 flex-col justify-center gap-3"
      :style="placeholderStyle"
      data-testid="chart-loading"
    >
      <Skeleton class="h-8 w-full" />
      <Skeleton class="h-8 w-3/4" />
      <Skeleton class="h-8 w-1/2" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex flex-1 flex-col items-center justify-center gap-3 py-8"
      :style="placeholderStyle"
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
      :style="placeholderStyle"
      data-testid="chart-empty"
    >
      No data for the selected range
    </div>

    <!-- Data — measured so the states above can match its height -->
    <div v-else ref="dataArea" class="flex flex-1 flex-col justify-center" data-testid="chart-data-area">
      <slot />
    </div>
  </section>
</template>
