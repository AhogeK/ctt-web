<script setup lang="ts">
/**
 * HeatmapChart — GitHub-style calendar heatmap for coding activity.
 *
 * One square cell per day over a rolling 12-month window (dense — zero days
 * render as visible "quiet" cells so silence stays readable), laid out
 * GitHub-style: columns are weeks, rows are weekdays (Mon-first). Tooltip
 * shows the full date and formatted duration.
 *
 * Discrete duration buckets (not a continuous ramp): <15min / 15–60min /
 * 1–2h / 2–5h / 5–8h / >8h — precision concentrated in the 1–8h core range
 * where most coding days fall (web-side calibration; the plugin panel still
 * uses its original <5m/5–15m/15m–1h/1–3h/3–6h/>6h ramp). A 20-minute day is
 * visibly different from a quiet day regardless of the range's maximum.
 *
 * Rendering is ECharts (tree-shaken: canvas renderer + heatmap series +
 * calendar coordinate + tooltip — see ./echarts-setup). Square cells adapt
 * to the container width; theme switches re-derive the palette through a
 * setOption update (the instance survives — no re-init flicker).
 *
 * This component owns rendering + sizing only: data fetching and the
 * loading / error / empty wrapper live in the parent (ChartSection).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { init, type EChartsType } from 'echarts/core'
import type { DailyStatPoint } from '@/lib/schemas/stats.schema'
import { formatDuration } from '@/lib/utils'
import { useStatsStreaks } from '@/composables/useStats'
import { useThemeStore } from '@/stores/theme'
import '@/components/charts/echarts-setup'
import { heatmapRenderWindow, countWeekColumns } from './heatmap-window'

const props = defineProps<{
  /** Dense daily points (date + seconds) in date order */
  points: DailyStatPoint[]
  /** Origin-device filter (null → all devices) */
  deviceId: string | null
  /** Exact IDE-name filter (null → all IDEs); mutually exclusive with deviceId */
  ideName: string | null
  /**
   * Human-readable render window for the a11y description (e.g.
   * "2025" for a year view, "the last 12 months" for the rolling default).
   */
  windowLabel?: string
}>()

const theme = useThemeStore()

// Streak footer data — the heatmap's own Max/Current streak line; TanStack
// caches it under the shared streaks key.
const streaks = useStatsStreaks(
  computed(() => ({ deviceId: props.deviceId ?? undefined, ideName: props.ideName ?? undefined })),
)

const activeDays = computed(() => props.points.filter((p) => p.seconds > 0).length)

const container = ref<HTMLDivElement | null>(null)
const containerWidth = ref(0)
let chart: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

interface Palette {
  quietCell: string
  buckets: string[]
  labelText: string
  labelStrong: string
  tooltipBg: string
  tooltipText: string
}

const LEGEND_LABELS = ['< 15 min', '15–60 min', '1–2 h', '2–5 h', '5–8 h', '> 8 h'] as const

const palette = computed<Palette>(() => {
  const dark = theme.isDark
  return dark
    ? {
        // Brand ramp (DESIGN.md #5e6ad2 indigo): quiet = neutral dark cell,
        // buckets climb toward bright brand ink as coding time increases.
        quietCell: '#26282b',
        buckets: ['#313a5c', '#3d4a75', '#5e6ad2', '#7b85e0', '#9aa2ec', '#bcc2f4'],
        labelText: '#8a8f98',
        labelStrong: '#f7f8f8',
        tooltipBg: '#f7f8f8',
        tooltipText: '#08090a',
      }
    : {
        quietCell: '#e9ebf0',
        buckets: ['#d9ddf2', '#b7bfec', '#939fe4', '#5e6ad2', '#4a54c4', '#2f3a9e'],
        labelText: '#62666d',
        labelStrong: '#08090a',
        tooltipBg: '#08090a',
        tooltipText: '#f7f8f8',
      }
})

/** Duration bucket upper bounds in seconds (bucket i covers (BUCKETS[i-1], BUCKETS[i]]). */
const BUCKETS = [15 * 60, 60 * 60, 2 * 3600, 5 * 3600, 8 * 3600] as const

function bucketIndex(seconds: number): number {
  let idx = 0
  for (const bound of BUCKETS) {
    if (seconds > bound) idx++
  }
  return idx
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** Category rows for the heatmap grid (Mon-first). */
const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * Render window: dense points trimmed to the trailing 366-day span (see
 * ./heatmap-window). Year mode feeds exactly one calendar year, which always
 * fits — no point is dropped, including Jan 1 of leap years.
 */
const renderedPoints = computed(() => heatmapRenderWindow(props.points))

/**
 * Week columns for the geometry loop — derived from the real date span,
 * floored at 53 so a partial trailing window still fills a GitHub-like grid.
 */
const weekColumns = computed(() => Math.max(53, countWeekColumns(renderedPoints.value)))

// ── Geometry: one closed loop — cell → fonts → labelBand → pitch → cell ──
const PAD = 12

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

const geometry = computed(() => {
  const availW = containerWidth.value || 848

  const derive = (pitch: number) => {
    const cellGap = Math.max(2, Math.round(pitch * 0.2))
    const cell = pitch - cellGap
    // Fonts scale with the cell so big cells never pair with tiny labels.
    const monthFont = clamp(Math.round(cell * 0.9), 9, 13)
    const weekdayFont = clamp(Math.round(cell * 0.8), 8, 12)
    // One shared gap between label and grid for both axes (month→top row,
    // weekday→first column): identical spacing on both sides.
    const labelGap = clamp(Math.round(cell * 1.2), 8, 16)
    const labelBand = labelGap + Math.ceil(weekdayFont * 2.3) + Math.ceil(cell / 2) + 4
    return { cell, pitch, monthFont, weekdayFont, labelGap, labelBand }
  }

  const weeks = weekColumns.value
  // Two passes break the pitch → cell → font → labelBand → pitch loop.
  let g = derive(Math.max(12, Math.floor((availW - 40 - PAD) / weeks)))
  g = derive(Math.max(12, Math.floor((availW - g.labelBand - PAD) / weeks)))

  const gridLeft = g.labelBand + Math.round((availW - g.labelBand - PAD - weeks * g.pitch) / 2)
  return { ...g, gridLeft }
})

const chartHeight = computed(() => {
  const { cell, pitch, monthFont, labelGap } = geometry.value
  const lastCellBottom = 8 + monthFont + labelGap + cell + 6 * pitch
  return lastCellBottom + 14
})

function buildOption(points: DailyStatPoint[], pal: Palette) {
  // Windowed points (see renderedPoints / heatmap-window).
  const first = points[0]?.date ?? '1970-01-01'
  const last = points[points.length - 1]?.date ?? first

  // ECharts heatmap-on-calendar ignores itemStyle.borderRadius (engine
  // limitation), so cells are a custom series on NO coordinate system with
  // manual pixel layout — full control over pitch, gap and corner radius.
  const { cell, pitch, gridLeft, monthFont, weekdayFont, labelGap } = geometry.value
  const labelTop = 8
  // Month band = half cell + month font + shared gap — leaves room for the
  // (scaled) month labels above the first row without colliding into it.
  const monthBand = Math.round(cell / 2) + monthFont + labelGap

  // Align the first column to the Monday of the week containing `first`.
  const start = new Date(`${first}T00:00:00`)
  const startDow = (start.getDay() + 6) % 7 // Mon=0
  const gridStart = new Date(start)
  gridStart.setDate(gridStart.getDate() - startDow)
  const totalDays = Math.round((new Date(`${last}T00:00:00`).getTime() - gridStart.getTime()) / 86_400_000) + 1

  interface Cell {
    date: string
    seconds: number
    col: number
    row: number
    color: string
  }
  const cells: Cell[] = []
  const monthLabels: Array<{ col: number; name: string }> = []
  let lastMonth = -1
  for (let d = 0; d < totalDays; d++) {
    const day = new Date(gridStart)
    day.setDate(day.getDate() + d)
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    const point = points.find((p) => p.date === iso)
    const seconds = point?.seconds ?? -1
    const col = Math.floor(d / 7)
    const row = (day.getDay() + 6) % 7
    cells.push({
      date: iso,
      seconds,
      col,
      row,
      color: seconds > 0 ? (pal.buckets[bucketIndex(seconds)] ?? pal.quietCell) : pal.quietCell,
    })
    if (day.getDate() === 1 || (d === 0 && day.getDate() <= 7)) {
      if (day.getMonth() !== lastMonth) {
        lastMonth = day.getMonth()
        monthLabels.push({ col, name: day.toLocaleString('en-US', { month: 'short' }) })
      }
    }
  }

  return {
    backgroundColor: 'transparent',
    tooltip: {
      confine: true,
      backgroundColor: pal.tooltipBg,
      borderWidth: 0,
      padding: [8, 12],
      textStyle: { color: pal.tooltipText, fontFamily: 'Inter, sans-serif', fontSize: 12 },
      formatter: (params: { data: { date?: string; seconds?: number } }) => {
        if (!params.data?.date) return ''
        const d = new Date(`${params.data.date}T00:00:00`)
        const weekday = WEEKDAY_NAMES[d.getDay()]
        return `<b>${weekday}, ${params.data.date}</b><br/>${formatDuration(params.data.seconds ?? 0)} coded`
      },
    },
    // Explicit empty axes so ECharts does not require a coordinate system.
    xAxis: { show: false },
    yAxis: { show: false },
    series: [
      {
        type: 'custom',
        coordinateSystem: 'none',
        renderItem: (params: { dataIndex: number }) => {
          const item = cells[params.dataIndex]
          if (!item) return null
          const x = gridLeft + item.col * pitch - cell / 2
          const y = labelTop + monthBand + item.row * pitch - cell / 2
          return {
            type: 'rect',
            shape: { x, y, width: cell, height: cell, r: Math.max(2, Math.round(cell * 0.2)) },
            style: { fill: item.color },
          }
        },
        data: cells.map((c) => ({ value: [c.col, c.row], date: c.date, seconds: c.seconds })),
      },
      {
        type: 'custom',
        coordinateSystem: 'none',
        silent: true,
        renderItem: (params: { dataIndex: number }) => {
          const label = monthLabels[params.dataIndex]
          if (!label) return null
          const firstCellTop = labelTop + monthBand - cell / 2
          const firstColLeft = gridLeft - cell / 2
          return {
            type: 'text',
            style: {
              text: label.name,
              x: firstColLeft + label.col * pitch,
              y: firstCellTop - labelGap,
              fill: pal.labelText,
              font: `500 ${monthFont}px Inter, sans-serif`,
              verticalAlign: 'bottom',
            },
          }
        },
        data: monthLabels.map((m) => ({ value: [m.col, 0], name: m.name })),
      },
      // Weekday labels — anchored to the same grid coordinate system as cells
      // and month labels: x = first column's LEFT edge − constant gap;
      // y = row center (rect top + cell/2) with verticalAlign 'middle' — no
      // magic offsets, stable at any pitch/cell combination.
      {
        type: 'custom',
        coordinateSystem: 'none',
        silent: true,
        renderItem: (params: { dataIndex: number }) => {
          const row = [0, 2, 4, 6][params.dataIndex]
          if (row === undefined) return null
          const label = DOW_LABELS[row] ?? ''
          const rowCenterY = labelTop + monthBand + row * pitch
          return {
            type: 'text',
            style: {
              text: label,
              x: gridLeft - cell / 2 - labelGap,
              y: rowCenterY,
              fill: pal.labelText,
              font: `500 ${weekdayFont}px Inter, sans-serif`,
              align: 'right',
              verticalAlign: 'middle',
            },
          }
        },
        data: [0, 1, 2, 3].map((i) => ({ value: [i, 0] })),
      },
    ],
  }
}

function render(): void {
  if (!chart || container.value === null) return
  chart.setOption(buildOption(renderedPoints.value, palette.value), true)
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
    <!-- Duration legend, plugin-parity -->
    <div
      class="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
    >
      <span class="flex items-center gap-1.5">
        <span
          class="inline-block h-3 w-3 rounded-[3px]"
          :style="{ background: palette.quietCell }"
          aria-hidden="true"
        />No coding
      </span>
      <span v-for="(label, i) in LEGEND_LABELS" :key="label" class="flex items-center gap-1.5">
        <span
          class="inline-block h-3 w-3 rounded-[3px]"
          :style="{ background: palette.buckets[i] ?? palette.buckets[0] }"
          aria-hidden="true"
        />{{ label }}
      </span>
    </div>
    <div
      ref="container"
      class="mx-auto w-full max-w-full"
      :style="{ height: `${chartHeight}px` }"
      role="img"
      :aria-label="`Coding heatmap for ${props.windowLabel ?? 'the last 12 months'}, ${renderedPoints.length} days from ${renderedPoints[0]?.date ?? ''} to ${renderedPoints[renderedPoints.length - 1]?.date ?? ''}`"
    />

    <!-- Plugin-parity footer: activity totals + streak context (quiet metadata) -->
    <div
      class="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[10px] tracking-wide text-muted-foreground/90"
    >
      <span
        >Total active days: <span class="tabular-nums">{{ activeDays }}</span></span
      >
      <span v-if="streaks.data.value">
        Max streak: <span class="tabular-nums">{{ streaks.data.value.max }}d</span> · Current streak:
        <span class="tabular-nums">{{ streaks.data.value.current }}d</span>
      </span>
    </div>
  </div>
</template>
