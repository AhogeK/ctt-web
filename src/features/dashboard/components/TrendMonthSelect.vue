<script setup lang="ts">
/**
 * TrendMonthSelect — window picker for the trend panel header.
 *
 * The default is the rolling 30-day view; the alternative is any calendar month
 * that actually has coding time. Panel-scoped, exactly like the heatmap's year
 * selector: the value is local state (not a URL param, so choosing a month does
 * not re-render the app shell) and the filter-bar Period never moves the trend.
 *
 * Shape: a trigger stating the active window, and a popover holding
 *   1. `Last 30 days` — the default and the reset, and
 *   2. one year at a time with a 12-cell month grid.
 *
 * Why not the heatmap's `Select`: a year is a single bounded step, but months
 * are up to twelve entries per year, and flattening them into a dropdown would
 * grow with history and hide the alternatives. A grid shows every month of the
 * chosen year at once, and the year row keeps the option count flat. Months the
 * backend did not report as having data are disabled rather than hidden — the
 * absence is information, and a hidden cell would make the grid jump.
 */
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const props = defineProps<{
  /** Selected month (`yyyy-MM`), or null for the rolling 30-day default */
  month: string | null
  /** Months with coding time, newest first (backend heatmap-months) */
  months: string[]
}>()

const emit = defineEmits<{
  /** Pick a month, or null to return to the rolling 30-day default */
  'update:month': [month: string | null]
}>()

/** January–December, the grid's fixed axis. */
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** Months the backend reports as having data, as a Set for O(1) cell lookup. */
const available = computed(() => new Set(props.months))

/** Years that contain at least one available month, newest first. */
const years = computed(() => {
  const seen = new Set<string>()
  for (const ym of props.months) seen.add(ym.slice(0, 4))
  return [...seen].sort((a, b) => b.localeCompare(a))
})

const open = ref(false)

/**
 * Year the user has browsed to, or '' for "not chosen yet". Treated as a
 * preference rather than state: it may point at a year that does not exist
 * (the month list is fetched asynchronously, and a stale value survives a data
 * change), so nothing reads it directly.
 */
const browsedYear = ref<string>('')

/**
 * Year the grid actually renders — `browsedYear` when it names a year that has
 * data, otherwise the newest one that does. Keeping one always-valid value
 * means the grid can never render a year the backend did not report, and the
 * async arrival of the month list needs no separate correction.
 */
const gridYear = computed(() => (years.value.includes(browsedYear.value) ? browsedYear.value : (years.value[0] ?? '')))

// Reopening lands on the year being looked at rather than wherever the user
// last browsed.
watch(open, (isOpen) => {
  if (isOpen) browsedYear.value = props.month?.slice(0, 4) ?? ''
})

/** Index of `gridYear` in the descending year list (-1 when absent). */
const yearIndex = computed(() => years.value.indexOf(gridYear.value))
const canGoNewer = computed(() => yearIndex.value > 0)
const canGoOlder = computed(() => yearIndex.value >= 0 && yearIndex.value < years.value.length - 1)

function stepYear(delta: number): void {
  const next = years.value[yearIndex.value + delta]
  if (next !== undefined) browsedYear.value = next
}

/** `2026-08` → `August 2026` for the trigger and the a11y label. */
const monthLabel = computed(() => {
  if (props.month === null) return 'Last 30 days'
  const [year, month] = props.month.split('-')
  const index = Number(month) - 1
  const name = MONTH_LABELS[index]
  return name === undefined ? props.month : `${name} ${year}`
})

/** Whether the given month of the displayed year can be selected. */
function isAvailable(index: number): boolean {
  const month = String(index + 1).padStart(2, '0')
  return available.value.has(`${gridYear.value}-${month}`)
}

function isSelected(index: number): boolean {
  const month = String(index + 1).padStart(2, '0')
  return props.month === `${gridYear.value}-${month}`
}

function pick(index: number): void {
  if (!isAvailable(index)) return
  const month = String(index + 1).padStart(2, '0')
  emit('update:month', `${gridYear.value}-${month}`)
  open.value = false
}

function pickRolling(): void {
  emit('update:month', null)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="h-7 gap-1.5 px-2 text-xs font-normal"
        data-testid="trend-month-trigger"
        :aria-label="`Trend window: ${monthLabel}`"
      >
        {{ monthLabel }}
        <span class="text-muted-foreground" aria-hidden="true">▾</span>
      </Button>
    </PopoverTrigger>

    <PopoverContent class="w-60" data-testid="trend-month-popover">
      <button
        type="button"
        class="mb-2 w-full rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        :class="month === null ? 'text-foreground' : 'text-muted-foreground'"
        data-testid="trend-month-rolling"
        @click="pickRolling"
      >
        Last 30 days
      </button>

      <div class="mb-1.5 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0 text-xs disabled:opacity-30"
          :disabled="!canGoOlder"
          :aria-label="`Older year`"
          data-testid="trend-month-prev-year"
          @click="stepYear(1)"
        >
          ‹
        </Button>
        <span class="text-xs font-medium tabular-nums" data-testid="trend-month-year">{{ gridYear }}</span>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0 text-xs disabled:opacity-30"
          :disabled="!canGoNewer"
          :aria-label="`Newer year`"
          data-testid="trend-month-next-year"
          @click="stepYear(-1)"
        >
          ›
        </Button>
      </div>

      <div class="grid grid-cols-3 gap-1" role="group" :aria-label="`Months in ${gridYear}`">
        <button
          v-for="(label, index) in MONTH_LABELS"
          :key="label"
          type="button"
          class="rounded-md px-2 py-1.5 text-xs tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-35"
          :class="
            isSelected(index)
              ? 'bg-primary text-primary-foreground font-medium'
              : 'enabled:hover:bg-accent enabled:hover:text-accent-foreground text-foreground'
          "
          :disabled="!isAvailable(index)"
          :aria-pressed="isSelected(index)"
          :aria-label="`${label} ${gridYear}`"
          :data-testid="`trend-month-${String(index + 1).padStart(2, '0')}`"
          @click="pick(index)"
        >
          {{ label }}
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>
