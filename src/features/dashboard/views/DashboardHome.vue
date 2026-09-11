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
 * exclusively by its own year selector ("Last 12 months" rolling default). Changing any of them re-keys the affected stats queries.
 */
import { computed } from 'vue'
import {
  useStatsDistribution,
  useStatsHeatmap,
  useStatsHeatmapMonths,
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
import TrendMonthSelect from '../components/TrendMonthSelect.vue'
import HeatmapYearSelect from '../components/HeatmapYearSelect.vue'
import HourlyPanel from '../components/HourlyPanel.vue'
import TimeOfDayPanel from '../components/TimeOfDayPanel.vue'
import LanguageDistributionPanel from '../components/LanguageDistributionPanel.vue'
import ProjectDistributionPanel from '../components/ProjectDistributionPanel.vue'
import WeekHourPanel from '../components/WeekHourPanel.vue'

const {
  start,
  end,
  originFilter,
  deviceId: deviceIdOrNull,
  ideName: ideNameOrNull,
  heatmapYear,
  trendMonth,
  preset,
  setDateRange,
  applyPreset,
  setDevice,
  setIde,
  setHeatmapYear,
  setTrendMonth,
} = useDashboardFilters()
const heatmapYears = useStatsHeatmapYears()
const heatmapMonths = useStatsHeatmapMonths()
// The heatmap panel's time axis is owned EXCLUSIVELY by the year selector:
// "Last 12 months" is a fixed rolling window, and picking a year shows that
// calendar year. The filter-bar Period (start/end) drives every other panel but
// never the heatmap.
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

// The trend panel owns its window, like the heatmap owns its year: it defaults
// to the plugin's "Last 30 Days" view and otherwise shows one calendar month.
// The filter-bar Period deliberately does NOT drive it.
const trendRange = computed(() => {
  if (trendMonth.value === null) {
    return { start: formatDate(new Date(today.getTime() - 29 * 86_400_000)), end: formatDate(today) }
  }
  // `monthEnd` day 0 of the next month is the last day of this one, leap-safe.
  const [y, m] = trendMonth.value.split('-').map(Number)
  const lastDay = new Date(y!, m!, 0).getDate()
  return { start: `${trendMonth.value}-01`, end: `${trendMonth.value}-${String(lastDay).padStart(2, '0')}` }
})
const trend = useStatsHeatmap(computed(() => ({ ...trendRange.value, ...originFilter.value })))

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

// Distribution panels — since backend v0.66.0 the endpoint accepts the same
// inclusive start/end window as summary/hourly, so every panel follows the
// filter bar. LanguageDistributionPanel owns its own query (start/end are
// props); TOD is held here per the pure-renderer panel pattern.
const distributionWindow = computed(() => ({ start: start.value ?? undefined, end: end.value ?? undefined }))
const timeOfDay = useStatsDistribution(
  'TIME_OF_DAY',
  computed(() => ({ ...distributionWindow.value, ...originFilter.value })),
)
const languages = useStatsDistribution(
  'LANGUAGES',
  computed(() => ({ ...distributionWindow.value, ...originFilter.value })),
)
const projects = useStatsDistribution(
  'PROJECTS',
  computed(() => ({ ...distributionWindow.value, ...originFilter.value })),
)
</script>

<template>
  <div class="@container/page flex flex-col gap-6 p-6">
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

    <!-- All panels live in ONE grid, zero privileges. Container query against
         the page column (its content width == the grid's row width): below
         1684px each 2-col card would drop under 830px (share minus gap), so
         the grid collapses to one column; at ≥1684px every card is exactly
         half width — heatmap included (its cell renderer clamps to the
         available width).

         Order is deliberate, in row pairs: the two categorical shares lead
         (language, project), then the two calendar/time-series reads (heatmap,
         trend), then the three rhythm views. The e2e layout spec pins these
         pairs, so reordering means updating it too. -->
    <div class="grid grid-cols-1 gap-6 @[1684px]/page:grid-cols-2">
      <ChartSection
        title="Language distribution"
        :loading="languages.isPending.value"
        :error="languages.isError.value"
        :empty="!!languages.data.value && languages.data.value.entries.length === 0"
        @retry="() => languages.refetch()"
      >
        <LanguageDistributionPanel
          :start="start ?? undefined"
          :end="end ?? undefined"
          :device-id="deviceIdOrNull"
          :ide-name="ideNameOrNull"
        />
      </ChartSection>
      <ChartSection
        title="Project distribution"
        :loading="projects.isPending.value"
        :error="projects.isError.value"
        :empty="!!projects.data.value && projects.data.value.entries.length === 0"
        @retry="() => projects.refetch()"
      >
        <ProjectDistributionPanel
          :start="start ?? undefined"
          :end="end ?? undefined"
          :device-id="deviceIdOrNull"
          :ide-name="ideNameOrNull"
        />
      </ChartSection>
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
        title="Coding trend"
        :loading="trend.isPending.value"
        :error="trend.isError.value"
        :empty="!!trend.data.value && trend.data.value.points.length === 0"
        @retry="() => trend.refetch()"
      >
        <template #actions>
          <TrendMonthSelect
            :month="trendMonth"
            :months="heatmapMonths.data.value ?? []"
            @update:month="setTrendMonth"
          />
        </template>
        <!-- Chart body: smooth line + gradient area over the panel's own window
             (30-day rolling by default, a calendar month when one is picked) -->
        <TrendChart :points="trend.data.value?.points ?? []" />
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
