<script setup lang="ts">
import { useI18n } from 'vue-i18n'
/**
 * LongTermTrendPanel — "Long-term trend": daily coded time as dots over the
 * card's window (rolling 12 months, or a picked calendar year), a centered
 * 7-day average line, and the window mean as a dashed reference level.
 *
 * The raw / smoothed / reference grammar is standard chart vocabulary; the
 * choices around it are this project's own:
 * - the recent-vs-window comparison is NOT drawn into the chart — it is DOM
 *   text (the delta badge above the plot and the a11y label), so it reads to
 *   screen readers and shares the summary cards' single colour convention;
 * - the caption under the plot carries the layer legend AND the baseline
 *   value, so the dashed line explains itself;
 * - no gradient area (unlike the 30-day trend): the dots live below the
 *   average line and a fill would wash out the lower half of the cloud. The
 *   two cards differ on purpose — the 30-day one reads shape, this one reads
 *   the dots against a level.
 *
 * Data contract: dense daily points (date + seconds, zero days included) —
 * the same HeatmapResponse the heatmap and 30-day trend consume; the parent
 * reuses the heatmap's rolling default range so both panels share one cache
 * entry. Rendering is ECharts (tree-shaken — ScatterChart registered in
 * ./echarts-setup). This component owns rendering only: fetching and the
 * loading / error / empty wrapper live in the parent (ChartSection).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { graphic, init, type EChartsType } from 'echarts/core'
import { TrendingDown, TrendingUp } from '@lucide/vue'
import type { DailyStatPoint } from '@/lib/schemas/stats.schema'
import { formatDuration, formatMonthShort, formatWeekdayShort } from '@/lib/utils'
import { useThemeStore } from '@/stores/theme'
import { formatHourLabel, getHourAxisScale } from './axis-scale'
import { tooltipSurface } from './chart-tooltip'
import {
  centeredWeeklyAverage,
  changePercent,
  formatAverageDuration,
  RECENT_DAYS,
  recentMeanSeconds,
  windowMeanSeconds,
} from './trend-baseline'
import { comparisonDirection, deltaClass, formatChangePercent, type DeltaView } from './summary-comparison'
import '@/components/charts/echarts-setup'

const { t } = useI18n()

const props = defineProps<{
  /** Dense daily points (date + seconds) in date order — the card's window */
  points: DailyStatPoint[]
  /** Picked calendar year ('2025'), or undefined for the rolling 12-month default */
  windowLabel?: string
}>()

const theme = useThemeStore()

interface Palette {
  /** Dot ink — muted, so the cloud reads as raw data rather than the message */
  dot: string
  /** Average-line stroke at the TOP of the plot (high coding time) — brighter ink */
  lineTop: string
  /** Average-line stroke at the BOTTOM of the plot (near zero) — deeper ink */
  lineBottom: string
  /** Dashed window-mean reference level — indigo, never a status colour */
  baseline: string
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
        dot: 'rgba(138, 143, 152, 0.5)',
        lineTop: '#b9c1ff',
        lineBottom: '#4a53b8',
        baseline: 'rgba(133, 145, 245, 0.55)',
        axisLabel: '#8a8f98',
        splitLine: 'rgba(255, 255, 255, 0.06)',
        noteText: 'rgba(138, 143, 152, 0.7)',
        pointHalo: '#f7f8f8',
      }
    : {
        dot: 'rgba(98, 102, 109, 0.45)',
        lineTop: '#8a97f2',
        lineBottom: '#3d49ad',
        baseline: 'rgba(94, 106, 210, 0.5)',
        axisLabel: '#62666d',
        splitLine: 'rgba(0, 0, 0, 0.06)',
        noteText: 'rgba(98, 102, 109, 0.7)',
        pointHalo: '#08090a',
      }
})

const container = ref<HTMLDivElement | null>(null)
/** Phone-narrow panels drop the dots — 366 specks at that pitch read as noise. */
const NARROW_WIDTH = 560
const containerWidth = ref(0)
const isNarrow = computed(() => (containerWidth.value || 700) < NARROW_WIDTH)
let chart: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

const CHART_HEIGHT = 200

/** Picks the daily seconds out of the points, in range order. */
const seconds = computed(() => props.points.map((point) => point.seconds))

/**
 * Month-start dates the axis labels: every month when the card has room, every
 * other month on narrow cards — counted back from the newest, so the current
 * month always stays labelled and the window's first month keeps its label at
 * wide widths. The set is chosen here rather than left to ECharts' overlap
 * rule, whose width-dependent drop pattern left arbitrary months unlabelled (a
 * phone card showed December and March missing while ten others stayed, which
 * reads as missing data rather than a layout choice).
 */
const labelDates = computed(() => {
  const starts = props.points.map((point) => point.date).filter((date) => date.endsWith('-01'))
  const stride = isNarrow.value ? 2 : 1
  const dates = new Set<string>()
  for (let i = starts.length - 1; i >= 0; i -= stride) {
    const date = starts[i]
    if (date !== undefined) dates.add(date)
  }
  return dates
})
const weeklyAverage = computed(() => centeredWeeklyAverage(seconds.value))
const windowMean = computed(() => windowMeanSeconds(seconds.value))
const recentMean = computed(() => recentMeanSeconds(seconds.value))
/** Days the recent figure actually covers — the full window unless history is shorter. */
const recentSpanDays = computed(() => Math.min(RECENT_DAYS, props.points.length))
const recentLabel = computed(() => t('dashboard.longTerm.lastDays', { days: recentSpanDays.value }))
const recentDelta = computed(() => changePercent(recentMean.value, windowMean.value))

/** What the dashed level is the mean OF — the named baseline. */
const averageLabel = computed(() =>
  props.windowLabel === undefined
    ? t('dashboard.longTerm.twelveMonthAverage')
    : t('dashboard.longTerm.averageLabel', { window: props.windowLabel }),
)

/**
 * The badge view, or null when it must not render (no baseline to compare
 * against). Direction, text and colour come from the summary line's helpers,
 * so the badge reads exactly like the summary cards' comparison line.
 */
const delta = computed<DeltaView | null>(() => {
  const mean = windowMean.value
  const percent = recentDelta.value
  if (mean === null || percent === null) return null
  const direction = comparisonDirection({ previousSeconds: mean, changePercent: percent })
  if (!direction) return null
  return {
    direction,
    className: deltaClass(direction),
    text: formatChangePercent(percent),
    title: `${recentLabel.value} ${formatAverageDuration(recentMean.value ?? 0)} vs ${averageLabel.value} ${formatAverageDuration(mean)}`,
  }
})

/**
 * Full-sentence label: range, both means and the change. The dots are hidden
 * at phone widths but every number in this sentence still describes the data
 * behind the drawn line, so the label stays whole at every width.
 */
const ariaLabel = computed(() => {
  const first = props.points[0]?.date ?? ''
  const last = props.points[props.points.length - 1]?.date ?? ''
  const parts = [t('dashboard.longTerm.aria', { days: props.points.length, first, last })]
  const mean = windowMean.value
  if (mean !== null)
    parts.push(t('dashboard.longTerm.ariaAverage', { label: averageLabel.value, value: formatAverageDuration(mean) }))
  const recent = recentMean.value
  if (recent !== null)
    parts.push(t('dashboard.longTerm.ariaRecent', { days: recentSpanDays.value, value: formatAverageDuration(recent) }))
  if (delta.value) parts.push(t('dashboard.longTerm.ariaDelta', { text: delta.value.text, label: averageLabel.value }))
  return parts.join(' · ')
})

/**
 * Legend + baseline value, under the plot. The "daily" entry drops at phone
 * widths with the dots, so the caption never names a layer that is not drawn.
 */
const noteText = computed(() => {
  const parts: string[] = []
  if (!isNarrow.value) parts.push('\u25cf daily')
  parts.push('\u2500 7-day average')
  const mean = windowMean.value
  const level = `\u2504 ${averageLabel.value}`
  parts.push(mean === null ? level : `${level} ${formatAverageDuration(mean)}`)
  return parts.join(' · ')
})

/**
 * The line stroke is colored by VERTICAL POSITION — near 0h the curve is deep
 * indigo, at the top of the plot it brightens. LinearGradient coords are
 * series-relative (globalCoord false): resize needs no recompute. The same
 * stroke language as the 30-day trend.
 */
function createLineGradient(pal: Palette) {
  return new graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: pal.lineTop },
    { offset: 0.48, color: '#8290f0' },
    { offset: 1, color: pal.lineBottom },
  ])
}

function buildOption(points: DailyStatPoint[], weekly: number[], mean: number | null, pal: Palette) {
  // On a phone the raw daily spikes are not drawn (the dots drop), so scaling
  // to them would leave the top of the chart empty while the visible 7-day
  // average hugs the bottom — the scale follows the layers actually drawn: the
  // raw days when the dots are visible, the average and the window mean when
  // they are not.
  const maxSeconds = isNarrow.value ? Math.max(...weekly, mean ?? 0, 0) : Math.max(...points.map((p) => p.seconds), 0)
  const yScale = getHourAxisScale(maxSeconds)

  const dots = {
    name: t('dashboard.common.daily'),
    type: 'scatter',
    symbolSize: 3,
    data: points.map((p) => p.seconds),
    itemStyle: { color: pal.dot },
    z: 1,
    emphasis: { scale: 1.6, itemStyle: { color: pal.lineTop } },
  }

  const averageLine = {
    name: '7-day average',
    type: 'line',
    smooth: 0.4,
    showSymbol: false,
    data: weekly,
    lineStyle: { width: 2, color: createLineGradient(pal) },
    z: 2,
    // The window mean as a reference level. A markLine (not a data series):
    // it stays out of tooltips and needs no zero-filled data of its own.
    markLine:
      mean === null
        ? undefined
        : {
            silent: true,
            symbol: 'none',
            label: { show: false },
            lineStyle: { color: pal.baseline, type: [6, 4], width: 1.5 },
            data: [{ yAxis: mean }],
          },
    emphasis: { itemStyle: { color: pal.lineTop, borderColor: pal.pointHalo, borderWidth: 2 } },
  }

  return {
    backgroundColor: 'transparent',
    grid: { left: 8, right: 8, top: 12, bottom: 4, containLabel: true },
    tooltip: {
      ...tooltipSurface(theme.isDark),
      trigger: 'axis',
      confine: true,
      axisPointer: { type: 'line', lineStyle: { color: pal.splitLine, width: 1 } },
      formatter: (params: Array<{ dataIndex: number }>) => {
        const index = params[0]?.dataIndex
        const point = index === undefined ? undefined : points[index]
        if (index === undefined || point === undefined) return ''
        const d = new Date(`${point.date}T00:00:00`)
        const weekday = formatWeekdayShort(d)
        const lines = [
          `<b>${weekday}, ${point.date}</b>`,
          `${t('dashboard.common.coded', { value: formatDuration(point.seconds) })}`,
        ]
        const average = weekly[index]
        if (average !== undefined)
          lines.push(`${t('dashboard.longTerm.sevenDayAverage')} ${formatAverageDuration(average)}`)
        return lines.join('<br/>')
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: points.map((p) => p.date),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: pal.axisLabel,
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
        // A 366-day axis cannot carry day labels: tick on month boundaries and
        // label with the short month name, from the set `labelDates` chose —
        // never ECharts' overlap rule (see that computed's note).
        interval: (_index: number, value: string) => labelDates.value.has(value),
        formatter: (date: string) => formatMonthShort(new Date(`${date}T00:00:00`)),
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
      // A flat dashed grid, unlike the 30-day trend's hand-drawn ramp: under a
      // dense dot cloud the quiet grid keeps the cloud readable.
      splitLine: { lineStyle: { color: pal.splitLine, type: 'dashed' } },
    },
    series: isNarrow.value ? [averageLine] : [dots, averageLine],
  }
}

function render(): void {
  if (!chart || container.value === null) return
  chart.setOption(buildOption(props.points, weeklyAverage.value, windowMean.value, palette.value), true)
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

// Data or palette change → update the existing instance (no re-init flicker).
watch(() => props.points, render)
watch(palette, render)
</script>

<template>
  <div>
    <!-- The recent-vs-window readout lives OUTSIDE the canvas: DOM text is
         readable and the colour convention is the summary line's. Pinned to
         the right so it sits beside the geometry's newest end. -->
    <p
      v-if="delta"
      class="mb-2 flex items-center justify-end gap-1 text-[11px] leading-4 tabular-nums"
      data-testid="long-term-delta"
      :title="delta.title"
    >
      <TrendingUp
        v-if="delta.direction === 'up'"
        class="h-3 w-3 shrink-0"
        :class="delta.className"
        aria-hidden="true"
      />
      <TrendingDown
        v-else-if="delta.direction === 'down'"
        class="h-3 w-3 shrink-0"
        :class="delta.className"
        aria-hidden="true"
      />
      <span class="shrink-0 font-medium whitespace-nowrap" :class="delta.className">{{ delta.text }}</span>
      <!-- The label is the row's only flexible item — see the summary row's note. -->
      <span class="min-w-0 truncate text-muted-foreground">{{ ' vs ' + averageLabel }}</span>
    </p>
    <div
      ref="container"
      class="mx-auto w-full max-w-full"
      :style="{ height: `${CHART_HEIGHT}px` }"
      role="img"
      :aria-label="ariaLabel"
    />
    <p
      class="mt-1 text-center text-[10px] tracking-wide"
      :style="{ color: palette.noteText }"
      data-testid="long-term-note"
    >
      {{ noteText }}
    </p>
  </div>
</template>
