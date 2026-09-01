<script setup lang="ts">
/**
 * Dashboard home view — the stats dashboard container.
 *
 * Layout: filter bar → overview summary cards → heatmap panel (reflects the
 * active filter range) → Coding trend (30-day) + Language distribution →
 * Yearly activity + streaks → Project / Time-of-day / Weekday / IDE
 * distributions → hourly stats. Every panel renders its loading / error /
 * empty states through ChartSection so a slow or failing endpoint never
 * blocks the grid; chart bodies are a later pass and each panel reserves its
 * mount point.
 *
 * Filters live in the URL (useDashboardFilters): date range presets + custom
 * range + origin-device filter. Changing them re-keys the stats queries
 * (keys include range and deviceId), so every chart refetches for the new
 * selection.
 */
import { computed } from 'vue'
import { useStatsHeatmap } from '@/composables/useStats'
import { ALL_TIME_START, formatDate, useDashboardFilters } from '../composables/useDashboardFilters'
import DashboardFilters from '../components/DashboardFilters.vue'
import SummaryCards from '../components/SummaryCards.vue'
import ChartSection from '../components/ChartSection.vue'
import DistributionPanel from '../components/DistributionPanel.vue'
import StreaksPanel from '../components/StreaksPanel.vue'
import HourlyPanel from '../components/HourlyPanel.vue'

const {
  start,
  end,
  originFilter,
  deviceId: deviceIdOrNull,
  ideName: ideNameOrNull,
  preset,
  setDateRange,
  applyPreset,
  setDevice,
  setIde,
} = useDashboardFilters()
// "No URL params" means All time: resolve an explicit backend range (the
// backend's own no-param default would be this calendar year only).
const effectiveRange = computed(() => ({
  start: start.value ?? ALL_TIME_START,
  end: end.value ?? formatDate(new Date()),
}))
const heatmap = useStatsHeatmap(computed(() => ({ ...effectiveRange.value, ...originFilter.value })))
// The 30-day trend panel always shows the last 30 days regardless of the
// filter range (mirrors the plugin panel "Coding Activity (Last 30 Days)").
const today = new Date()
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

    <!-- Heatmap over the active filter range (full width) -->
    <ChartSection
      title="Coding heatmap"
      :loading="heatmap.isPending.value"
      :error="heatmap.isError.value"
      :empty="!!heatmap.data.value && heatmap.data.value.points.length === 0"
      @retry="() => heatmap.refetch()"
    >
      <!-- Chart body: heatmap grid (reserved mount point) -->
      <div class="py-8 text-center text-sm text-muted-foreground">Heatmap chart</div>
    </ChartSection>

    <!-- Two-column row: last-30-days trend + language distribution -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartSection
        title="Coding trend (last 30 days)"
        :loading="heatmap30.isPending.value"
        :error="heatmap30.isError.value"
        :empty="!!heatmap30.data.value && heatmap30.data.value.points.length === 0"
        @retry="() => heatmap30.refetch()"
      >
        <!-- Chart body: 30-day line (reserved mount point) -->
        <div class="py-8 text-center text-sm text-muted-foreground">Trend chart</div>
      </ChartSection>

      <DistributionPanel
        type="LANGUAGES"
        title="Language distribution"
        :device-id="deviceIdOrNull"
        :ide-name="ideNameOrNull"
      />
    </div>

    <!-- Two-column row: filtered-range activity + streaks. The heatmap
         panel above already owns the filter range; this panel mirrors it
         with the same query (single fetch, two views) so the title states
         the active range instead of promising a fixed year. -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartSection
        title="Activity heatmap (selected range)"
        :loading="heatmap.isPending.value"
        :error="heatmap.isError.value"
        :empty="!!heatmap.data.value && heatmap.data.value.points.length === 0"
        @retry="() => heatmap.refetch()"
      >
        <!-- Chart body: range heatmap (reserved mount point) -->
        <div class="py-8 text-center text-sm text-muted-foreground">Range heatmap</div>
      </ChartSection>

      <StreaksPanel :device-id="deviceIdOrNull" :ide-name="ideNameOrNull" />
    </div>

    <!-- Three-column row: project / time-of-day / IDE distributions -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <DistributionPanel
        type="PROJECTS"
        title="Project distribution"
        :device-id="deviceIdOrNull"
        :ide-name="ideNameOrNull"
      />
      <DistributionPanel
        type="TIME_OF_DAY"
        title="Time of day distribution"
        :device-id="deviceIdOrNull"
        :ide-name="ideNameOrNull"
      />
      <DistributionPanel type="IDES" title="IDE distribution" :device-id="deviceIdOrNull" :ide-name="ideNameOrNull" />
    </div>

    <!-- Two-column row: hourly stats + weekday distribution -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <HourlyPanel :device-id="deviceIdOrNull" :ide-name="ideNameOrNull" />
      <DistributionPanel
        type="WEEKDAY"
        title="Weekday distribution"
        :device-id="deviceIdOrNull"
        :ide-name="ideNameOrNull"
      />
    </div>
  </div>
</template>
