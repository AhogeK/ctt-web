<script setup lang="ts">
/**
 * YearSelect — the year picker shared by the heatmap and the long-term trend
 * panels (extracted from HeatmapYearSelect when the second consumer
 * appeared).
 *
 * Options: the fixed "Last 12 months" item (value null → the panel's rolling
 * default) plus every year the backend reports as containing valid coding
 * sessions (newest first). The value is `number | null`, matching
 * useDashboardFilters' panel-window setters.
 */
import { computed } from 'vue'
import { Select, SelectContent, SelectItem, SelectItemText, SelectTrigger, SelectValue } from '@/components/ui/select'

const props = defineProps<{
  /** Selected year, or null for the rolling 12-month default */
  year: number | null
  /** Years with valid sessions, newest first (backend heatmap-years) */
  years: number[]
  /** The trigger's accessible name ('Heatmap year' / 'Long-term trend year') */
  label: string
  /** The trigger's data-testid — one per consumer */
  testid: string
}>()

const emit = defineEmits<{
  /** Pick a year; null returns to the rolling 12-month default */
  'update:year': [year: number | null]
}>()

/** String shape for the Select — 'rolling' encodes the null (default) value. */
const ROLLING_VALUE = 'rolling'

const modelValue = computed(() => (props.year === null ? ROLLING_VALUE : String(props.year)))

function onChange(value: unknown): void {
  const next = String(value)
  emit('update:year', next === ROLLING_VALUE ? null : Number(next))
}
</script>

<template>
  <Select :model-value="modelValue" @update:model-value="onChange">
    <SelectTrigger class="h-7 w-36 text-xs" :data-testid="testid" :aria-label="label">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="rolling">
        <SelectItemText>Last 12 months</SelectItemText>
      </SelectItem>
      <SelectItem v-for="y in years" :key="y" :value="String(y)">
        <SelectItemText>{{ y }}</SelectItemText>
      </SelectItem>
    </SelectContent>
  </Select>
</template>
