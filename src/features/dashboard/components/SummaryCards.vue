<script setup lang="ts">
/**
 * SummaryCards — the overview row of the dashboard.
 *
 * Shows all six summary fields from the backend (today / daily average /
 * this week / this month / this year / lifetime total), mirroring the plugin
 * panel, formatted as compact durations.
 *
 * Visual language follows DESIGN.md (Linear-inspired): translucent card
 * surfaces with hairline borders, muted uppercase tracked labels, one icon
 * per metric, and tabular numerals for stable alignment. Cards surface a
 * retry action on failure without blocking the rest of the row.
 */
import { computed } from 'vue'
import {
  Activity,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  CalendarClock,
  Timer,
  type LucideIcon,
} from '@lucide/vue'
import { useStatsSummary } from '@/composables/useStats'
import { formatDuration } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps<{
  /** Origin-device filter (null → all devices) */
  deviceId: string | null
  /** Exact IDE-name filter (null → all IDEs); mutually exclusive with deviceId */
  ideName: string | null
}>()

const { data, isPending, isError, refetch } = useStatsSummary(
  computed(() => ({
    deviceId: props.deviceId ?? undefined,
    ideName: props.ideName ?? undefined,
  })),
)

interface SummaryCard {
  label: string
  seconds: number
  icon: LucideIcon
}

const cards = computed<SummaryCard[]>(() => [
  { label: 'Today', seconds: data.value?.today ?? 0, icon: Activity },
  { label: 'Daily avg', seconds: data.value?.dailyAverage ?? 0, icon: CalendarCheck },
  { label: 'This week', seconds: data.value?.thisWeek ?? 0, icon: CalendarDays },
  { label: 'This month', seconds: data.value?.thisMonth ?? 0, icon: CalendarRange },
  { label: 'This year', seconds: data.value?.thisYear ?? 0, icon: CalendarClock },
  { label: 'Total', seconds: data.value?.total ?? 0, icon: Timer },
])

// While pending or after a failed request there is no value to show yet.
const showPlaceholder = computed(() => isPending.value || !data.value)
</script>

<template>
  <div class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6" data-testid="summary-cards">
    <div
      v-for="card in cards"
      :key="card.label"
      class="group rounded-xl border border-border/50 bg-gradient-to-b from-card to-muted/40 p-4 transition-all duration-200 hover:border-border hover:shadow-sm"
    >
      <div class="flex items-center justify-between gap-2">
        <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/90">
          {{ card.label }}
        </p>
        <component
          :is="card.icon"
          class="h-3.5 w-3.5 transition-colors"
          :class="
            card.icon === Activity || card.icon === Timer
              ? 'text-primary/70'
              : 'text-muted-foreground/50 group-hover:text-muted-foreground'
          "
          aria-hidden="true"
        />
      </div>
      <Skeleton v-if="showPlaceholder" class="mt-3 h-7 w-20" data-testid="summary-loading" />
      <p
        v-else
        class="mt-2 text-[26px] font-semibold leading-none tracking-tight tabular-nums text-foreground"
        data-testid="summary-value"
      >
        {{ formatDuration(card.seconds) }}
      </p>
      <button
        v-if="isError"
        type="button"
        class="mt-1.5 text-xs text-destructive hover:underline"
        data-testid="summary-retry"
        @click="refetch()"
      >
        Failed to load — retry
      </button>
    </div>
  </div>
</template>
