<script setup lang="ts">
/**
 * HourlyPanel — "Average Hourly Coding Duration": the window's per-hour
 * averages (hour 00–23) as one smooth line over a soft indigo area, with
 * faint curves for the most recent active days (GET /stats/hourly-days) so
 * the average reads against the days it averages. The hour axis is fixed
 * 0–23 (missing hours zero-fill).
 *
 * Data: GET /stats/hourly returns the per-hour averages + the active-day
 * denominator (`activeDays`); both endpoints accept optional `start`/`end`
 * (yyyy-MM-dd) to clip sessions to a date range — the panel reflects this
 * when props are provided, otherwise falls back to all-history semantics.
 *
 * Day curves: at most the last five active days, drawn raw (not averaged).
 * Today's curve stops at the current hour — its unwritten tail would read as
 * "coded nothing after now". A single active day draws no curve (it would
 * retrace the average); phone-narrow panels drop the day curves and the
 * current-hour marker, keeping the one essential read. When today is among
 * the days, a dashed vertical line marks the current hour.
 *
 * The Y axis reuses the shared getHourAxisScale over the largest drawn value
 * (day curves included) so nothing clips, with readable hour steps and an
 * explicit interval; the peak never kisses the top edge. Theme switches
 * re-derive the palette via setOption (no re-init flicker).
 *
 * This component owns rendering only: fetching and the loading / error /
 * empty wrapper live in the parent (ChartSection).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { init, graphic, type EChartsType } from 'echarts/core'
import { formatDate } from '../composables/useDashboardFilters'
import { useStatsHourly, useStatsHourlyDays } from '@/composables/useStats'
import { formatDuration } from '@/lib/utils'
import { useThemeStore } from '@/stores/theme'
import { formatHourLabel, getHourAxisScale } from './axis-scale'
import { tooltipSurface } from './chart-tooltip'
import '@/components/charts/echarts-setup'

const props = defineProps<{
  /** Origin-device filter (null → all devices) */
  deviceId: string | null
  /** Exact IDE-name filter (null → all IDEs); mutually exclusive with deviceId */
  ideName: string | null
  /** Optional date range filter (yyyy-MM-dd); backend clips sessions to [start, end] */
  start?: string | null
  /** Optional date range filter (yyyy-MM-dd); backend clips sessions to [start, end] */
  end?: string | null
}>()

const theme = useThemeStore()

const queryParams = computed(() => ({
  deviceId: props.deviceId ?? undefined,
  ideName: props.ideName ?? undefined,
  start: props.start ?? undefined,
  end: props.end ?? undefined,
}))

const hourly = useStatsHourly(queryParams)
const hourlyDays = useStatsHourlyDays(queryParams)

interface Palette {
  /** Line ink — the trend chart's stroke language, top→bottom. */
  lineTop: string
  lineBottom: string
  /** Area fill under the average line. */
  areaTop: string
  areaBottom: string
  /** Faint per-day curves — present but clearly secondary to the average. */
  dayLine: string
  /** Current-hour marker on the average line. */
  anchorLine: string
  axisLabel: string
  splitLine: string
  noteText: string
  /** Hover-dot ring — max contrast against the surface, not the tooltip's */
  pointHalo: string
}

const palette = computed<Palette>(() => {
  const dark = theme.isDark
  return dark
    ? {
        lineTop: '#b9c1ff',
        lineBottom: '#4a53b8',
        areaTop: 'rgba(130, 142, 255, 0.36)',
        areaBottom: 'rgba(74, 83, 184, 0.015)',
        dayLine: 'rgba(138, 143, 152, 0.38)',
        anchorLine: 'rgba(185, 193, 255, 0.5)',
        axisLabel: '#8a8f98',
        splitLine: 'rgba(255, 255, 255, 0.06)',
        noteText: 'rgba(138, 143, 152, 0.7)',
        pointHalo: '#f7f8f8',
      }
    : {
        lineTop: '#8a97f2',
        lineBottom: '#3d49ad',
        areaTop: 'rgba(104, 116, 238, 0.26)',
        areaBottom: 'rgba(61, 73, 173, 0.015)',
        dayLine: 'rgba(98, 102, 109, 0.35)',
        anchorLine: 'rgba(74, 83, 184, 0.45)',
        axisLabel: '#62666d',
        splitLine: 'rgba(0, 0, 0, 0.06)',
        noteText: 'rgba(98, 102, 109, 0.7)',
        pointHalo: '#08090a',
      }
})

const container = ref<HTMLDivElement | null>(null)
/** Phone-narrow panels keep only the average line — day curves and the hour marker would crowd the read. */
const NARROW_WIDTH = 560
const containerWidth = ref(0)
const isNarrow = computed(() => (containerWidth.value || 700) < NARROW_WIDTH)
let chart: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

const CHART_HEIGHT = 200

/** Active-day count for the footer note. */
const activeDays = computed(() => hourly.data.value?.activeDays ?? 0)

/** 24 per-hour averages (seconds), zero-filled for silent hours. */
const values = computed(() => {
  const byHour = Array.from({ length: 24 }, () => 0)
  for (const point of hourly.data.value?.points ?? []) {
    byHour[point.hour] = point.averageSeconds
  }
  return byHour
})

/** At most this many faint day curves; more turns the backdrop into a comb. */
const MAX_DAY_LINES = 5

/** The window's active days with their per-hour seconds (ascending date order). */
const days = computed(() => hourlyDays.data.value?.days ?? [])

/**
 * Faint day curves: the most recent active days, raw values. A single day
 * draws nothing (it would retrace the average), and today's curve stops at
 * the current hour — the hours it has not reached yet are not zeros. The
 * local day is sampled per evaluation (never cached in its own computed), so
 * a session that crosses midnight and then refetches trims against the new day.
 */
const dayLines = computed(() => {
  const list = days.value
  if (list.length < 2) return []
  const todayIso = formatDate(new Date())
  const nowHour = new Date().getHours()
  return list.slice(-MAX_DAY_LINES).map((day) => ({
    date: day.date,
    data: day.hourlySeconds.map((seconds, hour) => (day.date === todayIso && hour > nowHour ? null : seconds)),
  }))
})

/** Whether the window includes today — gates the current-hour marker (sampled like the curves). */
const hasToday = computed(() => days.value.at(-1)?.date === formatDate(new Date()))

/** Screen-reader label — states the layers the chart actually drew. */
const ariaLabel = computed(() => {
  const parts = [`Average hourly coding duration, 24 hours, ${activeDays.value} active days`]
  if (!isNarrow.value && dayLines.value.length > 0) {
    parts.push(`faint lines show the last ${dayLines.value.length} days`)
  }
  if (!isNarrow.value && hasToday.value) parts.push('a dashed line marks the current hour')
  return parts.join(', ')
})

function buildOption(pal: Palette) {
  // The scale must fit every drawn curve — a single spike day can exceed the
  // average's peak, and clipping it would misread the day it came from.
  // Narrow panels draw no day curves, so they must not scale to them either.
  const drawnPeaks = isNarrow.value
    ? []
    : dayLines.value.flatMap((day) => day.data.filter((v): v is number => v !== null))
  const maxSeconds = Math.max(...values.value, ...drawnPeaks, 1)
  const yScale = getHourAxisScale(maxSeconds)

  return {
    backgroundColor: 'transparent',
    grid: { left: 8, right: 8, top: 12, bottom: 4, containLabel: true },
    tooltip: {
      ...tooltipSurface(theme.isDark),
      trigger: 'axis',
      confine: true,
      axisPointer: { type: 'line' },
      formatter: (params: Array<{ axisValue: string; value: number }>) => {
        const p = params[0]
        if (!p) return ''
        // The bucket value is the average across the window's active days
        // (the footer states the divisor) — "coded" alone would read as a total.
        return `<b>${p.axisValue}</b><br/>avg ${formatDuration(p.value)}`
      },
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: pal.axisLabel,
        fontSize: 9,
        fontFamily: 'Inter, sans-serif',
        interval: 2, // 00:00, 03:00, … 21:00
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yScale.maxSeconds,
      interval: yScale.intervalSeconds,
      minInterval: yScale.intervalSeconds,
      axisTick: { show: false },
      axisLabel: {
        color: pal.axisLabel,
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
        formatter: formatHourLabel,
      },
      splitLine: { lineStyle: { color: pal.splitLine, type: 'dashed' } },
    },
    series: [
      {
        // The average: one smooth line over a soft area — the trend chart's
        // stroke/area language. First in the array so the axis tooltip's
        // params[0] is always the average, never a day curve.
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbolSize: 6,
        data: values.value,
        z: 2,
        lineStyle: {
          width: 2,
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: pal.lineTop },
            { offset: 0.48, color: '#8290f0' },
            { offset: 1, color: pal.lineBottom },
          ]),
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: pal.areaTop },
              { offset: 1, color: pal.areaBottom },
            ],
          },
        },
        emphasis: {
          itemStyle: { color: pal.lineTop, borderColor: pal.pointHalo, borderWidth: 2 },
        },
        // Current-hour marker: today is still being written, so the average
        // curve beyond this hour rests on fewer days than the hours before it.
        ...(!isNarrow.value && hasToday.value
          ? {
              markLine: {
                silent: true,
                symbol: 'none',
                label: { show: false },
                lineStyle: { color: pal.anchorLine, type: [4, 4], width: 1 },
                data: [{ xAxis: new Date().getHours() }],
              },
            }
          : {}),
      },
      ...(isNarrow.value
        ? []
        : dayLines.value.map((day) => ({
            // Raw per-day curves behind the average — silent (never a hover
            // target) and under it in z, present but clearly secondary.
            type: 'line',
            smooth: true,
            showSymbol: false,
            silent: true,
            data: day.data,
            z: 1,
            lineStyle: { width: 1, color: pal.dayLine },
          }))),
    ],
  }
}

function render(): void {
  if (!chart || container.value === null) return
  chart.setOption(buildOption(palette.value), true)
}

function syncSize(): void {
  const next = container.value?.clientWidth ?? 0
  if (next !== containerWidth.value) {
    containerWidth.value = next
    render()
  }
  chart?.resize()
}

onMounted(() => {
  if (container.value === null) return
  containerWidth.value = container.value.clientWidth
  chart = init(container.value)
  render()
  resizeObserver = new ResizeObserver(syncSize)
  resizeObserver.observe(container.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.dispose()
  chart = null
})

watch([values, dayLines], render)
watch(palette, render)
</script>

<template>
  <div>
    <div
      ref="container"
      class="mx-auto w-full max-w-full"
      :style="{ height: `${CHART_HEIGHT}px` }"
      role="img"
      :aria-label="ariaLabel"
    />
    <p class="mt-1 text-center text-[10px] tracking-wide" :style="{ color: palette.noteText }">
      based on {{ activeDays }} active day{{ activeDays === 1 ? '' : 's'
      }}<template v-if="!isNarrow && dayLines.length"> · faint lines: the last {{ dayLines.length }} days</template>
    </p>
  </div>
</template>
