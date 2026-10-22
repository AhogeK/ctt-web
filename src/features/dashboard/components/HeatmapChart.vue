<script setup lang="ts">
import { useI18n } from 'vue-i18n'
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { init, type EChartsType } from 'echarts/core'
import type { DailyStatPoint } from '@/lib/schemas/stats.schema'
import { formatDuration, formatMonthShort } from '@/lib/utils'
import { useStatsStreaks } from '@/composables/useStats'
import { useThemeStore } from '@/stores/theme'
import '@/components/charts/echarts-setup'
import { tooltipSurface } from './chart-tooltip'
import {
  heatmapRenderWindow,
  countWeekColumns,
  heatmapContentWidth,
  needsHeatmapScroll,
  gridStartDate,
  MIN_PITCH,
} from './heatmap-window'

const { t } = useI18n()

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
const scroller = ref<HTMLDivElement | null>(null)
const containerWidth = ref(0)
let chart: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

interface Palette {
  quietCell: string
  buckets: string[]
  labelText: string
  labelStrong: string
}

const LEGEND_LABELS = ['< 15 min', '15–60 min', '1–2 h', '2–5 h', '5–8 h', '> 8 h'] as const

const palette = computed<Palette>(() => {
  const dark = theme.isDark
  return dark
    ? {
        // Brand ramp (indigo #5e6ad2): quiet = neutral dark cell,
        // buckets climb toward bright brand ink as coding time increases.
        quietCell: '#26282b',
        buckets: ['#313a5c', '#3d4a75', '#5e6ad2', '#7b85e0', '#9aa2ec', '#bcc2f4'],
        labelText: '#8a8f98',
        labelStrong: '#f7f8f8',
      }
    : {
        quietCell: '#e9ebf0',
        buckets: ['#d9ddf2', '#b7bfec', '#939fe4', '#5e6ad2', '#4a54c4', '#2f3a9e'],
        labelText: '#62666d',
        labelStrong: '#08090a',
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

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
/** Category rows for the heatmap grid (Mon-first). */
const DOW_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

/**
 * Render window: dense points trimmed to the trailing 366-day span (see
 * ./heatmap-window). Year mode feeds exactly one calendar year, which always
 * fits — no point is dropped, including Jan 1 of leap years.
 */
const renderedPoints = computed(() => heatmapRenderWindow(props.points))

/**
 * Week columns for the geometry loop — derived from the real date span, never
 * padded: a partial window (the current year up to today) ends at its newest
 * column instead of trailing empty ones, so the grid's right edge is always
 * the newest day.
 */
const weekColumns = computed(() => Math.max(1, countWeekColumns(renderedPoints.value)))

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
  let g = derive(Math.max(MIN_PITCH, Math.floor((availW - 40 - PAD) / weeks)))
  g = derive(Math.max(MIN_PITCH, Math.floor((availW - g.labelBand - PAD) / weeks)))

  if (!needsHeatmapScroll(availW, heatmapContentWidth(weeks, g.pitch, g.labelBand, PAD))) {
    const gridLeft = g.labelBand + Math.round((availW - g.labelBand - PAD - weeks * g.pitch) / 2)
    return { ...g, gridLeft, mode: 'fit' as const, contentWidth: availW }
  }

  // Too narrow to hold the grid at the readable pitch: the strip scrolls
  // horizontally, drawn at full width and opening on its newest end (the right
  // edge is the newest week — the calendar's home position). Squeezing instead
  // would push the newest columns off-canvas; they are the ones worth showing.
  const scrollG = derive(MIN_PITCH)
  return {
    ...scrollG,
    gridLeft: scrollG.labelBand,
    mode: 'scroll' as const,
    contentWidth: heatmapContentWidth(weeks, scrollG.pitch, scrollG.labelBand, PAD),
  }
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
        monthLabels.push({ col, name: formatMonthShort(day) })
      }
    }
  }

  return {
    backgroundColor: 'transparent',
    tooltip: {
      ...tooltipSurface(theme.isDark),
      confine: true,
      formatter: (params: { data: { date?: string; seconds?: number } }) => {
        if (!params.data?.date) return ''
        const d = new Date(`${params.data.date}T00:00:00`)
        const weekday = t(`dashboard.weekdays.${WEEKDAY_KEYS[d.getDay()]}`)
        return `<b>${weekday}, ${params.data.date}</b><br/>${t('dashboard.common.coded', { value: formatDuration(params.data.seconds ?? 0) })}`
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
          const label = t(`dashboard.weekdays.${DOW_KEYS[row] ?? 'mon'}`)
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

/**
 * Home position of the strip: the newest day not in the future sits at the
 * right edge — a rolling window ends at today, a past year at its last day,
 * and the CURRENT year keeps its full frame while the future cells flow past
 * the edge instead of leading the view. A reader parked here is left here
 * when data grows; one browsing older weeks is left where they are.
 */
let anchorX = 0
function pinToAnchorEnd(): void {
  void nextTick(() => {
    const el = scroller.value
    if (!el || geometry.value.mode !== 'scroll') return
    const pts = renderedPoints.value
    const first = pts[0]?.date
    const max = el.scrollWidth - el.clientWidth
    if (first === undefined) {
      anchorX = max
      el.scrollLeft = max
      return
    }
    const now = new Date()
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    let anchor = 0
    for (let i = pts.length - 1; i >= 0; i--) {
      if (pts[i]!.date <= todayIso) {
        anchor = i
        break
      }
    }
    if (anchor === pts.length - 1) {
      // The window's newest day IS the anchor: the right edge is its own end.
      anchorX = max
    } else {
      const days = Math.round(
        (new Date(`${pts[anchor]!.date}T00:00:00`).getTime() - gridStartDate(first).getTime()) / 86_400_000,
      )
      const g = geometry.value
      const columnEnd = g.gridLeft + (Math.floor(days / 7) + 1) * g.pitch
      anchorX = Math.min(Math.max(columnEnd - el.clientWidth, 0), max)
    }
    el.scrollLeft = anchorX
  })
}

function syncSize(): void {
  const next = scroller.value?.clientWidth ?? 0
  if (next === containerWidth.value) {
    chart?.resize()
    return
  }
  containerWidth.value = next
  // The strip's drawn width follows the new mode; size the canvas and re-paint
  // after the DOM width has applied, then re-open at the anchor end.
  void nextTick(() => {
    chart?.resize()
    render()
    pinToAnchorEnd()
  })
}

onMounted(() => {
  if (container.value === null) return
  containerWidth.value = scroller.value?.clientWidth ?? container.value.clientWidth
  chart = init(container.value)
  render()
  resizeObserver = new ResizeObserver(syncSize)
  resizeObserver.observe(scroller.value ?? container.value)
  // The first pass runs before the strip has its drawn width: give the canvas
  // its real size, re-paint, then land on the anchor end.
  void nextTick(() => {
    chart?.resize()
    render()
    pinToAnchorEnd()
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.dispose()
  chart = null
})

// Data or palette change → update the existing instance (no re-init flicker).
// A window change (rolling default ⇄ a calendar year) re-opens at that
// window's anchor end; grown data keeps a reader who is at the anchor there.
watch(
  () => props.windowLabel,
  () => {
    render()
    pinToAnchorEnd()
  },
)
watch(
  () => props.points,
  () => {
    const el = scroller.value
    const atAnchor = el === null || geometry.value.mode !== 'scroll' || Math.abs(el.scrollLeft - anchorX) <= 40
    render()
    if (atAnchor) pinToAnchorEnd()
  },
)
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
          class="inline-block h-3 w-3 shrink-0 rounded-[3px]"
          :style="{ background: palette.quietCell }"
          aria-hidden="true"
        />{{ t('dashboard.common.noCoding') }}
      </span>
      <span v-for="(label, i) in LEGEND_LABELS" :key="label" class="flex items-center gap-1.5">
        <span
          class="inline-block h-3 w-3 shrink-0 rounded-[3px]"
          :style="{ background: palette.buckets[i] ?? palette.buckets[0] }"
          aria-hidden="true"
        />{{ label }}
      </span>
    </div>
    <div ref="scroller" class="heatmap-scroll" :class="geometry.mode === 'scroll' ? 'is-scrollable' : ''">
      <div
        ref="container"
        :class="geometry.mode === 'scroll' ? '' : 'mx-auto w-full max-w-full'"
        :style="{
          height: `${chartHeight}px`,
          ...(geometry.mode === 'scroll' ? { width: `${geometry.contentWidth}px` } : {}),
        }"
        role="img"
        :aria-label="
          t('dashboard.heatmap.aria', {
            window: props.windowLabel ?? t('dashboard.heatmap.lastTwelve'),
            days: renderedPoints.length,
            first: renderedPoints[0]?.date ?? '',
            last: renderedPoints[renderedPoints.length - 1]?.date ?? '',
          })
        "
      />
    </div>

    <!-- Plugin-parity footer: activity totals + streak context (quiet metadata) -->
    <div
      class="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[10px] tracking-wide text-muted-foreground/90"
    >
      <span
        >{{ t('dashboard.heatmap.activeDays') }} <span class="tabular-nums">{{ activeDays }}</span></span
      >
      <span v-if="streaks.data.value">
        {{ t('dashboard.heatmap.maxStreak') }} <span class="tabular-nums">{{ streaks.data.value.max }}d</span> ·
        {{ t('dashboard.heatmap.currentStreak') }}:
        <span class="tabular-nums">{{ streaks.data.value.current }}d</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
/**
 * The strip scrolls only when the grid cannot hold the readable pitch inside
 * the panel (see the geometry in the script): squeezing instead would clip the
 * newest columns off the canvas. It opens on its newest end — the right edge
 * is the newest day, the calendar's home position — fades its left edge so
 * older weeks read as "more to the left", and keeps the swipe from chaining
 * into the page's own back gesture.
 */
.heatmap-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
}

.heatmap-scroll.is-scrollable {
  mask-image: linear-gradient(to right, transparent 0, #000 1.5rem);
}

.heatmap-scroll:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--ring) 45%, transparent);
  border-radius: 0.375rem;
}
</style>
