<script setup lang="ts">
/**
 * LanguageDistributionPanel — "Language distribution": horizontal ranked
 * bars of coding time per language, with the share (percent) and duration
 * annotated at each bar's end.
 *
 * Design (chart-designer + lieflat audit): languages are arbitrary-length
 * labels, so a ranked horizontal bar carries them better than a pie/waffle
 * (no legend squeeze, length ∝ time is honest composition encoding). A
 * 0.1% floor folds the long tail into "Others" (plugin parity). Bars use a
 * single-hue indigo luminance ramp that decays with rank — the same
 * "shade scales with value" family as the weekly heatmap.
 *
 * Data: GET /stats/distribution?type=LANGUAGES — entries {name, seconds}
 * ordered by duration descending (verified against ctt-server v0.65.0).
 * Filter reactivity, loading / error / empty states live in the parent
 * ChartSection; this component owns rendering only.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { init, type EChartsType } from 'echarts/core'
import { useStatsDistribution } from '@/composables/useStats'
import { formatDuration } from '@/lib/utils'
import { useThemeStore } from '@/stores/theme'
import '@/components/charts/echarts-setup'

const props = defineProps<{
  /** Inclusive window start (yyyy-MM-dd); omitted = full history */
  start?: string
  /** Inclusive window end (yyyy-MM-dd); omitted = full history */
  end?: string
  /** Origin-device filter (null → all devices) */
  deviceId: string | null
  /** Exact IDE-name filter (null → all IDEs); mutually exclusive with deviceId */
  ideName: string | null
}>()

const theme = useThemeStore()

const distribution = useStatsDistribution(
  'LANGUAGES',
  computed(() => ({
    start: props.start,
    end: props.end,
    deviceId: props.deviceId ?? undefined,
    ideName: props.ideName ?? undefined,
  })),
)

/** Languages below this share fold into "Others" (plugin parity: 0.1%). */
const MIN_PERCENT = 0.1

/** Percent readout: 2 decimals, trailing zeros trimmed (41.67% / 0.21% / 5%). */
function formatPercent(v: number): string {
  const s = v.toFixed(2)
  return s.endsWith('.00') ? s.slice(0, -3) : s.endsWith('0') ? s.slice(0, -1) : s
}

interface LangBar {
  name: string
  seconds: number
  percent: number
}

const totalSeconds = computed(() => distribution.data.value?.entries.reduce((acc, e) => acc + e.seconds, 0) ?? 0)

/**
 * Ranked bars: entries already arrive duration-descending; the sub-threshold
 * tail collapses into a single "Others" bar so the chart stays readable no
 * matter how many languages a year of history accumulates.
 */
const bars = computed<LangBar[]>(() => {
  const entries = distribution.data.value?.entries ?? []
  const total = totalSeconds.value
  if (total <= 0) return []
  const main: LangBar[] = []
  let othersSeconds = 0
  for (const e of entries) {
    if ((e.seconds / total) * 100 >= MIN_PERCENT) {
      main.push({ name: e.name, seconds: e.seconds, percent: (e.seconds / total) * 100 })
    } else {
      othersSeconds += e.seconds
    }
  }
  if (othersSeconds > 0) main.push({ name: 'Others', seconds: othersSeconds, percent: (othersSeconds / total) * 100 })
  return main
})

const ariaLabel = computed(() => {
  const parts = bars.value.map((b) => `${b.name} ${formatPercent(b.percent)}%`).join(', ')
  return `Language distribution: ${parts}`
})

const container = ref<HTMLDivElement | null>(null)
let chart: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

/** Row height per bar — the chart grows with the language count. */
const ROW_HEIGHT = 26

/** Chart pixel height = N rows + top/bottom padding for zero-axis breathing. */
const chartHeight = computed(() => Math.max(120, bars.value.length * ROW_HEIGHT + 16))

/**
 * Luminance ramp: rank 0 gets the brand indigo, later ranks decay toward a
 * muted tone so the eye reads ranking before color. Light mode starts from
 * the darker brand step for contrast on white; dark mode lifts everything.
 */
function barColor(rank: number, count: number): string {
  const dark = theme.isDark
  const stops = dark ? ['#5e6ad2', '#4d59c9', '#4149bd', '#3a42a8'] : ['#5e6ad2', '#4a53b8', '#3d49ad', '#333b9a']
  if (count <= 1) return stops[0]
  const idx = Math.min(stops.length - 1, Math.round((rank / (count - 1)) * (stops.length - 1)))
  return stops[idx]
}

function buildOption(): Record<string, unknown> {
  const dark = theme.isDark
  const rows = bars.value
  return {
    backgroundColor: 'transparent',
    // Honor the OS reduce-motion preference (lieflat hard rule).
    animation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    animationDuration: 500,
    animationEasing: 'cubicOut',
    animationDelay: (i: number) => i * 70,
    grid: { left: 0, right: 0, top: 4, bottom: 0, containLabel: true },
    // Inverse so the longest bar sits on top (rank order).
    xAxis: { type: 'value', show: false, max: totalSeconds.value || 1 },
    yAxis: {
      type: 'category',
      data: rows.map((r) => r.name),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: dark ? '#d0d6e0' : '#3f4350',
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        fontWeight: 600,
        width: 88,
        overflow: 'truncate',
      },
    },
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: dark ? '#f7f8f8' : '#08090a',
      borderWidth: 0,
      padding: [8, 12],
      textStyle: {
        color: dark ? '#08090a' : '#f7f8f8',
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
      },
      formatter: (params: { name: string; value: number; data: { percent: number } }) =>
        `<b>${params.name}</b> · ${formatDuration(Number(params.value))} · ${formatPercent(params.data.percent)}%`,
    },
    series: [
      {
        type: 'bar',
        barWidth: 14,
        data: rows.map((r, i) => ({
          name: r.name,
          value: r.seconds,
          percent: r.percent,
          itemStyle: { color: barColor(i, rows.length), borderRadius: [0, 7, 7, 0] },
        })),
        // Percent + duration at the bar's end — the composition readout.
        label: {
          show: true,
          position: 'right',
          distance: 8,
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          color: dark ? '#8a8f98' : '#62666d',
          formatter: (p: { data: { percent: number; value: number } }) =>
            `${formatPercent(p.data.percent)}% · ${formatDuration(Number(p.data.value))}`,
        },
      },
    ],
  }
}

function render(): void {
  if (!chart || container.value === null) return
  chart.setOption(buildOption() as Parameters<EChartsType['setOption']>[0], true)
}

function syncSize(): void {
  chart?.resize()
}

onMounted(() => {
  if (container.value === null) return
  container.value.style.height = `${chartHeight.value}px`
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

watch([bars, () => theme.isDark], () => {
  if (container.value !== null) container.value.style.height = `${chartHeight.value}px`
  render()
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div ref="container" class="w-full" role="img" :aria-label="ariaLabel" />
  </div>
</template>
