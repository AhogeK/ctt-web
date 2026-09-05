<script setup lang="ts">
/**
 * TimeOfDayPanel — "Time of day distribution": a horizontal 100% stacked
 * capsule (Night / Morning / Daytime / Evening) with the plugin's hour
 * buckets [22-04 / 05-11 / 12-16 / 17-21].
 *
 * This component owns rendering only: fetching and the loading / error /
 * empty wrapper live in the parent (ChartSection) — the project's panel
 * pattern (HourlyPanel precedent: a self-wrapped ChartSection never mounts
 * the chart because the container ref stays null while the query pends).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { init, type EChartsType } from 'echarts/core'
import { useStatsDistribution } from '@/composables/useStats'
import { formatDuration } from '@/lib/utils'
import { useThemeStore } from '@/stores/theme'
import '@/components/charts/echarts-setup'

const props = defineProps<{
  /** Origin-device filter (null → all devices) */
  deviceId: string | null
  /** Exact IDE-name filter (null → all IDEs); mutually exclusive with deviceId */
  ideName: string | null
}>()

const theme = useThemeStore()

const distribution = useStatsDistribution(
  'TIME_OF_DAY',
  computed(() => ({
    deviceId: props.deviceId ?? undefined,
    ideName: props.ideName ?? undefined,
  })),
)

/**
 * Fixed clock order — the backend orders by duration; we never re-flow.
 * Keys are the backend enum names (DistributionType.TIME_OF_DAY buckets are
 * UPPERCASE — verified live); labels are the human display names.
 */
const BUCKET_ORDER = ['NIGHT', 'MORNING', 'DAYTIME', 'EVENING'] as const
type BucketKey = (typeof BUCKET_ORDER)[number]

const BUCKET_LABEL: Record<BucketKey, string> = {
  NIGHT: 'Night',
  MORNING: 'Morning',
  DAYTIME: 'Daytime',
  EVENING: 'Evening',
}

/**
 * Single-hue indigo ramp following the daylight metaphor: Night deepest,
 * Daytime brightest, Evening settling back down. Light mode darkens the
 * ramp for white-background contrast; dark mode lifts it off #0f1011.
 */
const BUCKET_COLORS: Record<BucketKey, { light: string; dark: string }> = {
  NIGHT: { light: '#2d3291', dark: '#6a71d8' },
  MORNING: { light: '#4a53b8', dark: '#8a92ea' },
  DAYTIME: { light: '#8a94e8', dark: '#aab4ff' },
  EVENING: { light: '#5e6ad2', dark: '#7b85e0' },
}

interface BucketView {
  name: BucketKey
  seconds: number
  percent: number
}

const totalSeconds = computed(() => distribution.data.value?.entries.reduce((acc, e) => acc + e.seconds, 0) ?? 0)

const buckets = computed<BucketView[]>(() => {
  const entries = distribution.data.value?.entries ?? []
  const byName = new Map(entries.map((e) => [e.name, e.seconds]))
  const total = totalSeconds.value
  return BUCKET_ORDER.map((name) => {
    const seconds = byName.get(name) ?? 0
    return { name, seconds, percent: total > 0 ? Math.round((seconds / total) * 100) : 0 }
  })
})

const totalLabel = computed(() => formatDuration(totalSeconds.value))

const ariaLabel = computed(() => {
  const parts = buckets.value.map((b) => `${BUCKET_LABEL[b.name]} ${b.percent}%`).join(', ')
  return `Time of day: ${parts}. Total ${totalLabel.value}`
})

const container = ref<HTMLDivElement | null>(null)
let chart: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

/** Strip height in px — a single capsule row, legend lives in HTML below. */
const STRIP_HEIGHT = 40

/**
 * Visible segments only: zero-width buckets would still paint their edge
 * into the capsule, so they drop out and the rounded ends re-attach to the
 * first/last surviving segment.
 */
const segments = computed(() => {
  const dark = theme.isDark
  const colored = buckets.value.map((b) => ({
    ...b,
    color: dark ? BUCKET_COLORS[b.name].dark : BUCKET_COLORS[b.name].light,
  }))
  const visible = colored.filter((b) => b.seconds > 0 && b.percent > 0)
  return visible.map((seg, i) => ({
    ...seg,
    borderRadius:
      visible.length === 1
        ? [12, 12, 12, 12]
        : i === 0
          ? [12, 0, 0, 12]
          : i === visible.length - 1
            ? [0, 12, 12, 0]
            : 0,
  }))
})

function buildOption(): Record<string, unknown> {
  const dark = theme.isDark
  return {
    backgroundColor: 'transparent',
    // Honor the OS reduce-motion preference (lieflat hard rule).
    animation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    animationDuration: 500,
    animationEasing: 'cubicOut',
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: 'value', max: totalSeconds.value || 1, show: false },
    yAxis: { type: 'category', data: ['tod'], show: false },
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
        `<b>${BUCKET_LABEL[params.name as BucketKey]}</b> · ${formatDuration(params.value)} · ${params.data.percent}%`,
    },
    series: segments.value.map((seg, i) => ({
      type: 'bar',
      stack: 'tod',
      barWidth: 24,
      animationDelay: i * 90,
      data: [{ value: seg.seconds, percent: seg.percent }],
      itemStyle: { color: seg.color, borderRadius: seg.borderRadius },
      label: { show: false },
      emphasis: { disabled: true },
      cursor: 'pointer',
    })),
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

watch([buckets, () => theme.isDark], render)
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Capsule strip — widths are the shares; glyphs live in HTML below -->
    <div ref="container" class="w-full" :style="{ height: `${STRIP_HEIGHT}px` }" role="img" :aria-label="ariaLabel" />

    <!-- Legend: clock order, HTML text (crisp), duration · percent right-aligned -->
    <ul class="grid grid-cols-1 gap-x-10 gap-y-1.5 sm:grid-cols-2">
      <li v-for="bucket in buckets" :key="bucket.name" class="flex items-center gap-2 text-xs">
        <span
          class="h-2.5 w-2.5 shrink-0 rounded-full"
          :style="{
            backgroundColor: theme.isDark ? BUCKET_COLORS[bucket.name].dark : BUCKET_COLORS[bucket.name].light,
          }"
          aria-hidden="true"
        />
        <span class="font-medium tracking-wide">{{ BUCKET_LABEL[bucket.name] }}</span>
        <span class="ml-auto tabular-nums text-muted-foreground">
          <template v-if="bucket.seconds > 0">{{ formatDuration(bucket.seconds) }}</template>
          <template v-else>—</template>
          <span class="ml-2 inline-block w-9 text-right">{{ bucket.percent }}%</span>
        </span>
      </li>
    </ul>

    <p class="text-right text-[11px] tracking-wide text-muted-foreground">
      Total <span class="font-medium text-foreground">{{ totalLabel }}</span>
    </p>
  </div>
</template>
