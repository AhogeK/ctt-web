<script setup lang="ts">
/**
 * Dashboard home view — the stats dashboard container.
 *
 * Layout: filter bar → overview summary cards → one 2-column grid holding
 * every panel. No privileges: every card is exactly half width at ≥lg and
 * stacks below — heatmap included (its cell renderer clamps to the
 * available width). Every panel renders its loading / error / empty states
 * through ChartSection.
 * State lives in the URL (useDashboardFilters): the filter bar (date range
 * presets + custom range + device/IDE origin) drives the summary cards and
 * the distribution/streak/hourly panels; the heatmap's time axis is owned
 * exclusively by its own year selector (?year=, "Last 12 months" rolling
 * default). Changing any of them re-keys the affected stats queries.
 */
import { computed } from 'vue'
import {
  useStatsDistribution,
  useStatsHeatmap,
  useStatsHeatmapYears,
  useStatsHourly,
  useStatsWeekHour,
} from '@/composables/useStats'
import { formatDate, useDashboardFilters } from '../composables/useDashboardFilters'
import DashboardFilters from '../components/DashboardFilters.vue'
import SummaryCards from '../components/SummaryCards.vue'
import ChartSection from '../components/ChartSection.vue'
import HeatmapChart from '../components/HeatmapChart.vue'
import TrendChart from '../components/TrendChart.vue'
import HeatmapYearSelect from '../components/HeatmapYearSelect.vue'
import HourlyPanel from '../components/HourlyPanel.vue'
import TimeOfDayPanel from '../components/TimeOfDayPanel.vue'
import WeekHourPanel from '../components/WeekHourPanel.vue'

const {
  start,
  end,
  originFilter,
  deviceId: deviceIdOrNull,
  ideName: ideNameOrNull,
  heatmapYear,
  preset,
  setDateRange,
  applyPreset,
  setDevice,
  setIde,
  setHeatmapYear,
} = useDashboardFilters()
const heatmapYears = useStatsHeatmapYears()
// The heatmap panel's time axis is owned EXCLUSIVELY by the year selector:
// "Last 12 months" (no ?year=) is a fixed rolling window, and picking a year
// shows that calendar year. The filter-bar Period (start/end) drives every
// other panel but never the heatmap.
const today = new Date()
const rollingRange = computed(() => ({
  start: formatDate(new Date(today.getTime() - 365 * 86_400_000)),
  end: formatDate(today),
}))
const heatmapRange = computed(() => {
  if (heatmapYear.value === null) return rollingRange.value
  return { start: `${heatmapYear.value}-01-01`, end: `${heatmapYear.value}-12-31` }
})
const heatmap = useStatsHeatmap(computed(() => ({ ...heatmapRange.value, ...originFilter.value })))

// The 30-day trend panel always shows the last 30 days regardless of the
// filter range (mirrors the plugin panel "Coding Activity (Last 30 Days)").
const last30 = computed(() => ({
  start: formatDate(new Date(today.getTime() - 29 * 86_400_000)),
  end: formatDate(today),
  ...originFilter.value,
}))
const heatmap30 = useStatsHeatmap(last30)

// Weekly activity by hour follows the filter bar: window = the resolved
// range (All time → full history), origin filters applied. Changing the
// range or filter re-keys the query.
const weekHour = useStatsWeekHour(
  computed(() => ({
    start: start.value,
    end: end.value,
    ...originFilter.value,
  })),
)

// Average hourly duration — origin filters + date range; drives the ChartSection
// wrapper for HourlyPanel. Backend v0.64.0 clips sessions to [start, end].
const hourly = useStatsHourly(
  computed(() => ({
    start: start.value,
    end: end.value,
    ...originFilter.value,
  })),
)

// Time of day distribution — origin filters (the endpoint has no date
// range yet); DashboardHome owns the query and drives the ChartSection
// three-state wrapper for the pure-renderer TimeOfDayPanel.
const timeOfDay = useStatsDistribution('TIME_OF_DAY', originFilter)
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Page header -->
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold">Dashboard Overview</h1>
      <p class="text-sm text-muted-foreground">Your coding statistics and analytics</p>
    </div>

    <!-- Filter bar -->
    <DashboardFilters
      :preset="preset"
      :start="start"
      :end="end"
      :device-id="deviceIdOrNull"
      :ide-name="ideNameOrNull"
      @apply-preset="applyPreset"
      @update:range="setDateRange"
      @update:device="setDevice"
      @update:ide="setIde"
    />

    <!-- Overview cards -->
    <SummaryCards :device-id="deviceIdOrNull" :ide-name="ideNameOrNull" />

    <!-- All panels live in ONE grid, zero privileges: every card is exactly
         half width at ≥lg and full width below — heatmap included (its cell
         renderer clamps to the available width). Content areas center
         vertically inside equal-height cards. -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartSection
        title="Coding heatmap"
        :loading="heatmap.isPending.value"
        :error="heatmap.isError.value"
        :empty="!!heatmap.data.value && heatmap.data.value.points.length === 0"
        @retry="() => heatmap.refetch()"
      >
        <template #actions>
          <HeatmapYearSelect :year="heatmapYear" :years="heatmapYears.data.value ?? []" @update:year="setHeatmapYear" />
        </template>
        <HeatmapChart
          :points="heatmap.data.value?.points ?? []"
          :device-id="deviceIdOrNull"
          :ide-name="ideNameOrNull"
          :window-label="heatmapYear === null ? undefined : String(heatmapYear)"
        />
      </ChartSection>

      <ChartSection
        title="Weekly coding activity by hour"
        :loading="weekHour.isPending.value"
        :error="weekHour.isError.value"
        :empty="!!weekHour.data.value && weekHour.data.value.points.length === 0"
        @retry="() => weekHour.refetch()"
      >
        <WeekHourPanel
          :start="start ?? undefined"
          :end="end ?? undefined"
          :device-id="deviceIdOrNull"
          :ide-name="ideNameOrNull"
        />
      </ChartSection>

      <ChartSection
        title="Average hourly coding duration"
        :loading="hourly.isPending.value"
        :error="hourly.isError.value"
        :empty="!!hourly.data.value && hourly.data.value.points.length === 0"
        @retry="() => hourly.refetch()"
      >
        <HourlyPanel
          :start="start ?? undefined"
          :end="end ?? undefined"
          :device-id="deviceIdOrNull"
          :ide-name="ideNameOrNull"
        />
      </ChartSection>

      <ChartSection
        title="Coding trend (last 30 days)"
        :loading="heatmap30.isPending.value"
        :error="heatmap30.isError.value"
        :empty="!!heatmap30.data.value && heatmap30.data.value.points.length === 0"
        @retry="() => heatmap30.refetch()"
      >
        <!-- Chart body: 30-day smooth line + gradient area (filter-independent) -->
        <TrendChart :points="heatmap30.data.value?.points ?? []" />
      </ChartSection>

      <ChartSection
        title="Time of day distribution"
        :loading="timeOfDay.isPending.value"
        :error="timeOfDay.isError.value"
        :empty="!!timeOfDay.data.value && timeOfDay.data.value.entries.length === 0"
        @retry="() => timeOfDay.refetch()"
      >
        <TimeOfDayPanel :device-id="deviceIdOrNull" :ide-name="ideNameOrNull" />
      </ChartSection>
    </div>
  </div>
</template>
