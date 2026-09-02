<script setup lang="ts">
/**
 * Dashboard home view — the stats dashboard container.
 *
 * Layout: filter bar → overview summary cards → heatmap + streaks (2-col,
 * heatmap keeps panel width for GitHub-sized cells) → Coding trend (30-day)
 * + Language distribution → hourly stats + Project distribution →
 * Time-of-day → IDE / Weekday distributions. Every panel renders its loading / error / empty states
 * through ChartSection so a slow or failing endpoint never blocks the grid.
 * The heat-map chart body is live (ECharts); other chart bodies remain
 * reserved mount points for later passes.
 *
 * State lives in the URL (useDashboardFilters): the filter bar (date range
 * presets + custom range + device/IDE origin) drives the summary cards and
 * the distribution/streak/hourly panels; the heatmap's time axis is owned
 * exclusively by its own year selector (?year=, "Last 12 months" rolling
 * default). Changing any of them re-keys the affected stats queries.
 */
import { computed } from 'vue'
import { useStatsHeatmap, useStatsHeatmapYears } from '@/composables/useStats'
import { formatDate, useDashboardFilters } from '../composables/useDashboardFilters'
import DashboardFilters from '../components/DashboardFilters.vue'
import SummaryCards from '../components/SummaryCards.vue'
import ChartSection from '../components/ChartSection.vue'
import HeatmapChart from '../components/HeatmapChart.vue'
import TrendChart from '../components/TrendChart.vue'
import HeatmapYearSelect from '../components/HeatmapYearSelect.vue'
import DistributionPanel from '../components/DistributionPanel.vue'
import StreaksPanel from '../components/StreaksPanel.vue'
import HourlyPanel from '../components/HourlyPanel.vue'

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

    <!-- Heatmap + streaks: container query on THIS row's width — the heatmap
         card needs ≥729px content width; two columns only fit when the row is
         ≥ 2×(729+32 pad) + 24 gap ≈ 1546px. Below that the heatmap takes the
         full row (its cells stay ≥13px). -->
    <div class="@container">
      <div class="grid grid-cols-1 gap-6 @[1546px]:grid-cols-2">
        <ChartSection
          title="Coding heatmap"
          :loading="heatmap.isPending.value"
          :error="heatmap.isError.value"
          :empty="!!heatmap.data.value && heatmap.data.value.points.length === 0"
          @retry="() => heatmap.refetch()"
        >
          <template #actions>
            <HeatmapYearSelect
              :year="heatmapYear"
              :years="heatmapYears.data.value ?? []"
              @update:year="setHeatmapYear"
            />
          </template>
          <HeatmapChart
            :points="heatmap.data.value?.points ?? []"
            :device-id="deviceIdOrNull"
            :ide-name="ideNameOrNull"
            :window-label="heatmapYear === null ? undefined : String(heatmapYear)"
          />
        </ChartSection>

        <StreaksPanel :device-id="deviceIdOrNull" :ide-name="ideNameOrNull" />
      </div>
    </div>

    <!-- Two-column row: last-30-days trend + language distribution -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

      <DistributionPanel
        type="LANGUAGES"
        title="Language distribution"
        :device-id="deviceIdOrNull"
        :ide-name="ideNameOrNull"
      />
    </div>

    <!-- Two-column row: hourly stats + project distribution -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <HourlyPanel :device-id="deviceIdOrNull" :ide-name="ideNameOrNull" />
      <DistributionPanel
        type="PROJECTS"
        title="Project distribution"
        :device-id="deviceIdOrNull"
        :ide-name="ideNameOrNull"
      />
    </div>

    <!-- Two-column row: time-of-day distribution -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <DistributionPanel
        type="TIME_OF_DAY"
        title="Time of day distribution"
        :device-id="deviceIdOrNull"
        :ide-name="ideNameOrNull"
      />
    </div>

    <!-- Two-column row: IDE + weekday distributions -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <DistributionPanel type="IDES" title="IDE distribution" :device-id="deviceIdOrNull" :ide-name="ideNameOrNull" />
      <DistributionPanel
        type="WEEKDAY"
        title="Weekday distribution"
        :device-id="deviceIdOrNull"
        :ide-name="ideNameOrNull"
      />
    </div>
  </div>
</template>
