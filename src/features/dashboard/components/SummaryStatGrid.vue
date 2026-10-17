<script setup lang="ts">
/**
 * SummaryStatGrid — the presentational half of the dashboard's overview row.
 *
 * Six compact duration cards in a container-query grid (2 → 3 → 6 columns). It was split out of
 * `SummaryCards` so a surface with no query client (the marketing hero) can render the *same* markup
 * from its own data: one implementation, two consumers. The testids stay on this element, so the
 * dashboard's unit test and the heatmap E2E keep asserting the real node.
 */
import { computed } from 'vue'
import { TrendingDown, TrendingUp } from '@lucide/vue'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDuration } from '@/lib/utils'
import { SUMMARY_ACCENT_ICONS, type SummaryStatItem } from './summary-stat-fields'
import { deltaView } from './summary-comparison'

const props = withDefaults(
  defineProps<{
    /** Cards to render, in order. Consumers choose the subset they need. */
    items: SummaryStatItem[]
    /** Pending or not-yet-loaded: show the value skeleton instead of a number. */
    placeholder?: boolean
    /** Request failed: the row offers retry instead of a value. */
    error?: boolean
  }>(),
  { placeholder: false, error: false },
)

const emit = defineEmits<{ retry: [] }>()

/** Items plus their resolved delta lines — a null view means "render no line". */
const rows = computed(() => props.items.map((item) => ({ ...item, delta: deltaView(item) })))
</script>

<template>
  <!-- @container/sc wrapper: the query target must be an ANCESTOR of the
       grid — a container cannot query itself. Wrapper width == row width. -->
  <div class="@container/sc">
    <div class="grid grid-cols-2 gap-4 md:grid-cols-3 @[1430px]/sc:grid-cols-6" data-testid="summary-cards">
      <div
        v-for="row in rows"
        :key="row.label"
        data-surface="card"
        class="group rounded-xl border border-border/50 dark:border-border bg-gradient-to-b from-card to-muted/40 dark:bg-none dark:bg-card p-4 transition-[border-color,box-shadow] duration-200 hover:border-border hover:shadow-sm"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/90">{{ row.label }}</p>
          <component
            :is="row.icon"
            class="h-3.5 w-3.5 shrink-0 transition-colors"
            :class="
              SUMMARY_ACCENT_ICONS.has(row.icon)
                ? 'text-primary/70'
                : 'text-muted-foreground/50 group-hover:text-muted-foreground'
            "
            aria-hidden="true"
          />
        </div>
        <Skeleton v-if="props.placeholder" class="mt-3 h-7 w-20" data-testid="summary-loading" />
        <p
          v-else
          class="mt-1.5 text-[26px] font-semibold leading-none tracking-tight tabular-nums text-foreground"
          data-testid="summary-value"
        >
          {{ formatDuration(row.seconds) }}
        </p>
        <p
          v-if="!props.placeholder && row.delta"
          class="mt-1.5 flex items-center gap-1 text-[11px] leading-4 tabular-nums"
          data-testid="summary-comparison"
          :title="row.delta?.title"
        >
          <TrendingUp
            v-if="row.delta?.direction === 'up'"
            class="h-3 w-3 shrink-0"
            :class="row.delta?.className"
            aria-hidden="true"
          />
          <TrendingDown
            v-else-if="row.delta?.direction === 'down'"
            class="h-3 w-3 shrink-0"
            :class="row.delta?.className"
            aria-hidden="true"
          />
          <span class="shrink-0 font-medium whitespace-nowrap" :class="row.delta?.className">{{
            row.delta?.text
          }}</span>
          <!-- The baseline label is the row's only flexible item: the metric,
               the percent and the trend glyph stay whole, and the label ellipsises
               on the narrowest cards rather than pushing the row past its box. -->
          <span class="min-w-0 truncate text-muted-foreground">{{ ' ' + (row.baseline ?? '') }}</span>
        </p>
        <button
          v-if="props.error"
          type="button"
          class="mt-1.5 text-xs text-destructive hover:underline"
          data-testid="summary-retry"
          @click="emit('retry')"
        >
          Failed to load — retry
        </button>
      </div>
    </div>
  </div>
</template>
