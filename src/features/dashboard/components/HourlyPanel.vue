<script setup lang="ts">
/**
 * HourlyPanel — "Average Hourly Coding Duration": 24 bars (hour 00–23), one
 * per hour = the average coding seconds across the window's active days.
 *
 * Data: GET /stats/hourly returns per-hour averages + the active-day
 * denominator (`activeDays`). Backend v0.64.0 accepts optional `start`/`end`
 * (yyyy-MM-dd) to clip sessions to a date range — the panel reflects this
 * when props are provided, otherwise falls back to all-history semantics.
 * The hour axis is fixed 0–23 (missing hours zero-fill).
 *
 * Rendering is ECharts bar with the DESIGN.md indigo family — a vertical
 * gradient (bright top → deep base) matching the 30-day trend's stroke, and
 * rounded bar tops matching the heatmap's cell language. The Y axis reuses
 * the shared getHourAxisScale (readable hour steps, explicit interval), so
 * bars stay strictly proportional and the peak never kisses the top edge.
 * Theme switches re-derive the palette via setOption (no re-init flicker).
 *
 * This component owns rendering only: fetching and the loading / error /
 * empty wrapper live in the parent (ChartSection).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { init, type EChartsType } from 'echarts/core'
import { useStatsHourly } from '@/composables/useStats'
import { formatDuration } from '@/lib/utils'
import { useThemeStore } from '@/stores/theme'
import { formatHourLabel, getHourAxisScale } from './axis-scale'
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

const hourly = useStatsHourly(
  computed(() => ({
    deviceId: props.deviceId ?? undefined,
    ideName: props.ideName ?? undefined,
    start: props.start ?? undefined,
    end: props.end ?? undefined,
  })),
)

interface Palette {
  barTop: string
  barBottom: string
  axisLabel: string
  splitLine: string
  noteText: string
  tooltipBg: string
  tooltipText: string
}

const palette = computed<Palette>(() => {
  const dark = theme.isDark
  return dark
    ? {
        barTop: '#7b85e0',
        barBottom: '#4a53b8',
        axisLabel: '#8a8f98',
        splitLine: 'rgba(255, 255, 255, 0.06)',
        noteText: 'rgba(138, 143, 152, 0.7)',
        tooltipBg: '#f7f8f8',
        tooltipText: '#08090a',
      }
    : {
        barTop: '#5e6ad2',
        barBottom: '#3d49ad',
        axisLabel: '#62666d',
        splitLine: 'rgba(0, 0, 0, 0.06)',
        noteText: 'rgba(98, 102, 109, 0.7)',
        tooltipBg: '#08090a',
        tooltipText: '#f7f8f8',
      }
})

const container = ref<HTMLDivElement | null>(null)
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

function buildOption(pal: Palette) {
  const maxSeconds = Math.max(...values.value, 1)
  const yScale = getHourAxisScale(maxSeconds)

  return {
    backgroundColor: 'transparent',
    grid: { left: 8, right: 8, top: 12, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: { type: 'shadow', shadowStyle: { color: pal.splitLine } },
      backgroundColor: pal.tooltipBg,
      borderWidth: 0,
      padding: [8, 12],
      textStyle: { color: pal.tooltipText, fontFamily: 'Inter, sans-serif', fontSize: 12 },
      formatter: (params: Array<{ axisValue: string; value: number }>) => {
        const p = params[0]
        if (!p) return ''
        return `<b>${p.axisValue}</b><br/>${formatDuration(p.value)} coded`
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
        type: 'bar',
        data: values.value,
        barWidth: '55%',
        itemStyle: {
          borderRadius: [3, 3, 0, 0], // rounded tops only — the heatmap cell language
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: pal.barTop },
              { offset: 1, color: pal.barBottom },
            ],
          },
        },
        emphasis: {
          itemStyle: { color: pal.barTop },
        },
      },
    ],
  }
}

function render(): void {
  if (!chart || container.value === null) return
  chart.setOption(buildOption(palette.value), true)
}

function syncSize(): void {
  chart?.resize()
}

onMounted(() => {
  if (container.value === null) return
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

watch(values, render)
watch(palette, render)
</script>

<template>
  <div>
    <div
      ref="container"
      class="mx-auto w-full max-w-full"
      :style="{ height: `${CHART_HEIGHT}px` }"
      role="img"
      :aria-label="`Average hourly coding duration, 24 hours, ${activeDays} active days`"
    />
    <p class="mt-1 text-center text-[10px] tracking-wide" :style="{ color: palette.noteText }">
      based on {{ activeDays }} active day{{ activeDays === 1 ? '' : 's' }}
    </p>
  </div>
</template>
