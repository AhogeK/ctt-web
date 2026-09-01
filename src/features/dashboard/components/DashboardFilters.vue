<script setup lang="ts">
/**
 * DashboardFilters — the filter bar for the dashboard.
 *
 * Date range presets (All time / This month / Last 90 days / This year /
 * Custom) plus origin filters (device or IDE — the backend rejects both at
 * once, so picking one clears the other). State lives in the URL via
 * useDashboardFilters, so a selection is shareable and survives refresh.
 * Custom shows two date inputs for an explicit inclusive range.
 */
import { computed, ref } from 'vue'
import { CalendarRange } from '@lucide/vue'
import { Select, SelectContent, SelectItem, SelectItemText, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useDevices } from '@/composables/useDevices'
import { useStatsIdeFilters } from '@/composables/useStats'
import type { DateRangePreset } from '../composables/useDashboardFilters'

const props = defineProps<{
  /** Current preset (derived from the URL range) */
  preset: DateRangePreset
  /** Current inclusive start (yyyy-MM-dd) or undefined */
  start?: string
  /** Current inclusive end (yyyy-MM-dd) or undefined */
  end?: string
  /** Selected origin device id, or null for all devices */
  deviceId: string | null
  /** Exact IDE-name filter, or null for all IDEs */
  ideName: string | null
}>()

const emit = defineEmits<{
  /** Apply a non-custom preset */
  applyPreset: [preset: Exclude<DateRangePreset, 'custom'>]
  /** Set an explicit inclusive range (undefined omits the param) */
  'update:range': [start: string | undefined, end: string | undefined]
  /** Filter to one device; null shows all devices */
  'update:device': [deviceId: string | null]
  /** Filter to one IDE; null shows all IDEs */
  'update:ide': [ideName: string | null]
}>()

const { data: devices } = useDevices()
const { data: ideNames } = useStatsIdeFilters()

// Selecting "Custom range" has no URL effect until a range is entered, so the
// intent to show the date inputs is tracked locally (the URL range alone can
// already derive `custom` after a refresh).
const customMode = ref(false)
// While the user is in Custom mode the select must show "Custom range", even
// though the URL range has not changed yet (preset is derived from the URL).
const selectValue = computed<DateRangePreset>(() => (customMode.value ? 'custom' : props.preset))
const deviceValue = computed<string>(() => props.deviceId ?? 'all')
const ideValue = computed<string>(() => props.ideName ?? 'all')

function onPresetChange(value: unknown): void {
  const next = String(value)
  if (next === 'custom') {
    customMode.value = true
  } else {
    customMode.value = false
    emit('applyPreset', next as Exclude<DateRangePreset, 'custom'>)
  }
}

function onDeviceChange(value: unknown): void {
  const next = String(value)
  emit('update:device', next === 'all' ? null : next)
}

function onIdeChange(value: unknown): void {
  const next = String(value)
  emit('update:ide', next === 'all' ? null : next)
}

function onStartChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value || undefined
  emit('update:range', value, props.end)
}

function onEndChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value || undefined
  emit('update:range', props.start, value)
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-4">
    <!-- Date range preset -->
    <div class="flex flex-col gap-1.5">
      <Label class="text-xs text-muted-foreground">Period</Label>
      <Select :model-value="selectValue" @update:model-value="onPresetChange">
        <SelectTrigger class="w-44">
          <CalendarRange class="mr-2 h-4 w-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <SelectItemText>All time</SelectItemText>
          </SelectItem>
          <SelectItem value="month">
            <SelectItemText>This month</SelectItemText>
          </SelectItem>
          <SelectItem value="90d">
            <SelectItemText>Last 90 days</SelectItemText>
          </SelectItem>
          <SelectItem value="year">
            <SelectItemText>This year</SelectItemText>
          </SelectItem>
          <SelectItem value="custom">
            <SelectItemText>Custom range</SelectItemText>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Custom range date inputs (visible once Custom is chosen or the URL
         already encodes a non-preset range) -->
    <div v-if="customMode || preset === 'custom'" class="flex flex-wrap items-end gap-4" data-testid="custom-range">
      <div class="flex flex-col gap-1.5">
        <Label class="text-xs text-muted-foreground" for="dash-start">Start</Label>
        <Input
          id="dash-start"
          type="date"
          :class="
            cn(
              'h-9 w-fit',
              'bg-muted focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20',
              'dark:border-border dark:bg-secondary dark:text-foreground',
            )
          "
          :value="start"
          @change="onStartChange"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label class="text-xs text-muted-foreground" for="dash-end">End</Label>
        <Input
          id="dash-end"
          type="date"
          :class="
            cn(
              'h-9 w-fit',
              'bg-muted focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20',
              'dark:border-border dark:bg-secondary dark:text-foreground',
            )
          "
          :value="end"
          @change="onEndChange"
        />
      </div>
    </div>

    <!-- Device filter -->
    <div class="flex flex-col gap-1.5">
      <Label class="text-xs text-muted-foreground">Device</Label>
      <Select :model-value="deviceValue" @update:model-value="onDeviceChange">
        <SelectTrigger class="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <SelectItemText>All devices</SelectItemText>
          </SelectItem>
          <SelectItem v-for="device in devices ?? []" :key="device.id" :value="device.id">
            <SelectItemText>{{ device.deviceName ?? device.ideName ?? 'Unknown Device' }}</SelectItemText>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- IDE filter (mutually exclusive with the device filter server-side;
         the parent clears the other one on change) -->
    <div class="flex flex-col gap-1.5">
      <Label class="text-xs text-muted-foreground">IDE</Label>
      <Select :model-value="ideValue" @update:model-value="onIdeChange">
        <SelectTrigger class="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <SelectItemText>All IDEs</SelectItemText>
          </SelectItem>
          <SelectItem v-for="ide in ideNames ?? []" :key="ide" :value="ide">
            <SelectItemText>{{ ide }}</SelectItemText>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
