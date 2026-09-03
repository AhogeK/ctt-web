<script setup lang="ts">
/**
 * WeekHourPanel — "Weekly Coding Activity by Hour": a 7×24 heatmap
 * (rows = ISO weekday Mon→Sun, columns = hour 0–23) of average coding
 * seconds per week-hour cell.
 *
 * Unlike the main heatmap and the 30-day trend, this panel IS driven by the
 * dashboard filter bar: the parent passes the resolved date range (start/end)
 * and origin filter, so the weekly pattern reflects the selected window —
 * exactly the plugin's "Weekly Coding Activity by Hour" panel semantics.
 *
 * Two plugin-fidelity rules drive the rendering:
 * 1. COLOR IS DYNAMIC, not a fixed bucket ladder — the plugin maps
 *    `visualMap min 0 → max = data maximum` onto a continuous ramp, so a
 *    cell's shade depends on the window's own peak (1h fills the scale when
 *    the peak is 1h, dims when the peak is 8h). We reproduce that with a
 *    continuous interpolation over the DESIGN.md indigo family.
 * 2. CELLS ARE SQUARE — drawn as an ECharts `custom` series with manual
 *    pixel layout (the same architecture as the main heatmap), so the side
 *    length is computed from the container and every cell stays a square
 *    regardless of how wide the panel is. A native `heatmap` series cannot
 *    guarantee square cells.
 *
 * Data: GET /stats/week-hour returns sparse non-zero cells + weekday
 * appearance counts; `buildWeekHourMatrix` zero-fills the full 168-cell grid
 * (silent cells render as quiet tiles). Theme switches re-derive the palette
 * via setOption (no re-init flicker).
 *
 * This component owns rendering only: fetching and the loading / error /
 * empty wrapper live in the parent (ChartSection).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { init, type EChartsType } from 'echarts/core'
import { useStatsWeekHour } from '@/composables/useStats'
import { formatDuration } from '@/lib/utils'
import { useThemeStore } from '@/stores/theme'
import { buildWeekHourMatrix, WEEKDAY_LABELS } from './week-hour-matrix'
import '@/components/charts/echarts-setup'

const props = defineProps<{
  /** Inclusive window start (yyyy-MM-dd); omitted = all history */
  start?: string
  /** Inclusive window end (yyyy-MM-dd); omitted = all history */
  end?: string
  /** Origin-device filter (null → all devices) */
  deviceId: string | null
  /** Exact IDE-name filter (null → all IDEs); mutually exclusive with deviceId */
  ideName: string | null
}>()

const theme = useThemeStore()

const query = useStatsWeekHour(
  computed(() => ({
    start: props.start,
    end: props.end,
    deviceId: props.deviceId ?? undefined,
    ideName: props.ideName ?? undefined,
  })),
)

const cells = computed(() => (query.data.value ? buildWeekHourMatrix(query.data.value) : []))

interface Palette {
  quiet: string
  /** Dynamic-ramp endpoints: 0s → quiet, >0 → dataLow … dataHigh as seconds/max grows */
  dataLow: string
  dataHigh: string
  axisLabel: string
  /** Hover/3D-lift shadow for emphasized cells (plugin's shadowBlur effect) */
  cellShadow: string
  tooltipBg: string
  tooltipText: string
}

const palette = computed<Palette>(() => {
  const dark = theme.isDark
  return dark
    ? {
        quiet: '#26282b',
        dataLow: '#313a5c',
        dataHigh: '#bcc2f4',
        axisLabel: '#8a8f98',
        cellShadow: 'rgba(0, 0, 0, 0.55)',
        tooltipBg: '#f7f8f8',
        tooltipText: '#08090a',
      }
    : {
        quiet: '#e9ebf0',
        dataLow: '#d9ddf2',
        dataHigh: '#2f3a9e',
        axisLabel: '#62666d',
        cellShadow: 'rgba(0, 0, 0, 0.28)',
        tooltipBg: '#08090a',
        tooltipText: '#f7f8f8',
      }
})

const container = ref<HTMLDivElement | null>(null)
const containerWidth = ref(0)
let chart: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

// ── Geometry: square cells sized from the live container width ──
const COLS = 24
const ROWS = 7
const LEFT_PAD = 8
const RIGHT_PAD = 8
const DAY_LABEL_BAND = 34
/** Right-hand room for the dynamic-scale scroll bar (plugin visualMap). */
const SCALE_BAND = 44
const TOP_PAD = 10
const HOUR_LABEL_ROW = 16
const BOTTOM_PAD = 4
const CELL_GAP = 1

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/** Square cell side length — derived from the container so cells stay squares. */
const cell = computed(() => {
  const availW = containerWidth.value || 700
  const usable = availW - LEFT_PAD - RIGHT_PAD - DAY_LABEL_BAND - SCALE_BAND - (COLS - 1) * CELL_GAP
  return clamp(Math.floor(usable / COLS), 8, 26)
})

/**
 * Left offset of the grid so the whole chart is centered: any width left
 * over after the fixed bands + cells is split evenly around the layout.
 */
const centering = computed(() => {
  const used = LEFT_PAD + DAY_LABEL_BAND + COLS * cell.value + (COLS - 1) * CELL_GAP + SCALE_BAND + RIGHT_PAD
  return Math.max(0, Math.floor(((containerWidth.value || 700) - used) / 2))
})

const chartHeight = computed(() => TOP_PAD + ROWS * cell.value + (ROWS - 1) * CELL_GAP + HOUR_LABEL_ROW + BOTTOM_PAD)

/** Peak across the window — the dynamic scale denominator (≥1s to avoid div-by-zero). */
const maxSeconds = computed(() => Math.max(...cells.value.map((c) => c.averageSeconds), 1))

/** Adaptive hour precision — a sub-0.1h peak must not read as "0.0 h". */
function formatHoursLabel(hours: number): string {
  if (hours === 0) return '0 h'
  // Adaptive precision: whole hours 1 decimal, down to tenths 2, below that 3.
  let precision = 1
  if (hours < 1) precision = 2
  if (hours < 0.1) precision = 3
  return `${Number(hours.toFixed(precision))} h`
}

/** Dynamic scale readout for the legend / scroll bar. */
const maxHoursLabel = computed(() => formatHoursLabel(maxSeconds.value / 3600))

interface CellData {
  /** [x=hour, y=dayIdx, seconds] — feeds the continuous visualMap */
  value: [number, number, number]
  row: number
  col: number
  hour: number
  seconds: number
}

function buildOption(cellsForOption: ReturnType<typeof buildWeekHourMatrix>, pal: Palette) {
  const cellSize = cell.value
  const pitch = cellSize + CELL_GAP
  const gridLeft = centering.value + LEFT_PAD + DAY_LABEL_BAND
  const gridTop = TOP_PAD

  // value = [x=hour, y=dayIdx, seconds] so the continuous visualMap (bound
  // to this series) owns the dynamic color — the scroll bar and the cells
  // share one scale, exactly the plugin's calculable visualMap.
  const cellsForRender: CellData[] = cellsForOption.map((c) => ({
    value: [c.hour, c.dayOfWeek - 1, c.averageSeconds] as [number, number, number],
    row: c.dayOfWeek - 1, // 0 = Mon … 6 = Sun
    col: c.hour,
    hour: c.hour,
    seconds: c.averageSeconds,
  }))

  return {
    backgroundColor: 'transparent',
    tooltip: {
      confine: true,
      backgroundColor: pal.tooltipBg,
      borderWidth: 0,
      padding: [8, 12],
      textStyle: { color: pal.tooltipText, fontFamily: 'Inter, sans-serif', fontSize: 12 },
      formatter: (params: { data?: CellData }) => {
        const d = params.data
        if (!d) return ''
        const day = WEEKDAY_LABELS[d.row] ?? ''
        return `<b>${day} ${String(d.hour).padStart(2, '0')}:00</b><br/>${formatDuration(d.seconds)} coded`
      },
    },
    // Explicit empty axes so ECharts does not require a coordinate system.
    xAxis: { show: false },
    yAxis: { show: false },
    // Dynamic-scale scroll bar (plugin parity): continuous + calculable,
    // vertical on the right, min 0 → max = window peak.
    visualMap: {
      type: 'continuous',
      min: 0,
      max: maxSeconds.value,
      calculable: true,
      orient: 'vertical',
      right: 4,
      top: 'middle',
      dimension: 2,
      text: [maxHoursLabel.value, '0'],
      textStyle: { color: pal.axisLabel, fontSize: 9, fontFamily: 'Inter, sans-serif' },
      inRange: { color: [pal.dataLow, pal.dataHigh] },
      seriesIndex: 0,
      // Hovering the scroll bar highlights the cells in that value range
      // (plugin behavior) — the custom series elements carry an `emphasis`
      // style so the highlight lifts them with a 3D shadow.
      hoverLink: true,
    },
    series: [
      // Cells — square rects at exact pixel positions; fill comes from the
      // visualMap via api.visual so dragging the scroll bar re-shades the
      // cells live (silent cells stay on the quiet color).
      {
        type: 'custom',
        coordinateSystem: 'none',
        renderItem: (params: { dataIndex: number }, api: { visual: (type: string) => string }) => {
          const item = cellsForRender[params.dataIndex]
          if (!item) return null
          const x = gridLeft + item.col * pitch
          const y = gridTop + item.row * pitch
          return {
            type: 'rect',
            shape: { x, y, width: cellSize, height: cellSize, r: Math.max(2, Math.round(cellSize * 0.15)) },
            style: { fill: item.seconds <= 0 ? pal.quiet : api.visual('color') },
            // Hover (or visualMap hoverLink highlight) lifts the cell with a
            // drop shadow — the plugin's 3D pop effect.
            emphasis: {
              style: { shadowBlur: 10, shadowColor: pal.cellShadow, shadowOffsetY: 2 },
            },
          }
        },
        data: cellsForRender,
      },
      // Day labels (left column).
      {
        type: 'custom',
        coordinateSystem: 'none',
        silent: true,
        renderItem: (params: { dataIndex: number }) => {
          const row = params.dataIndex
          const y = gridTop + row * pitch + cellSize / 2
          return {
            type: 'text',
            style: {
              text: WEEKDAY_LABELS[row] ?? '',
              x: centering.value + LEFT_PAD + DAY_LABEL_BAND - 6,
              y,
              fill: pal.axisLabel,
              font: '500 9px Inter, sans-serif',
              align: 'right',
              verticalAlign: 'middle',
            },
          }
        },
        data: WEEKDAY_LABELS.map((_, row) => ({ value: [row, 0] })),
      },
      // Hour labels (bottom row) — every 3rd hour to stay readable.
      {
        type: 'custom',
        coordinateSystem: 'none',
        silent: true,
        renderItem: (params: { dataIndex: number }) => {
          const col = params.dataIndex
          if (col % 3 !== 0) return null
          const x = gridLeft + col * pitch + cellSize / 2
          const y = gridTop + ROWS * pitch + HOUR_LABEL_ROW / 2
          return {
            type: 'text',
            style: {
              text: String(col).padStart(2, '0'),
              x,
              y,
              fill: pal.axisLabel,
              font: '500 9px Inter, sans-serif',
              align: 'center',
              verticalAlign: 'middle',
            },
          }
        },
        data: Array.from({ length: COLS }, (_, col) => ({ value: [col, 0] })),
      },
    ],
  }
}

function render(): void {
  if (!chart || container.value === null) return
  chart.setOption(buildOption(cells.value, palette.value), true)
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

watch(cells, render)
watch(palette, render)
</script>

<template>
  <div>
    <!-- Dynamic scale legend: color = seconds relative to the window's peak -->
    <div
      class="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
    >
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-3 w-3 rounded-[3px]" :style="{ background: palette.quiet }" aria-hidden="true" />No
        coding
      </span>
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-3 w-3 rounded-[3px]" :style="{ background: palette.dataLow }" aria-hidden="true" />0
      </span>
      <span class="flex items-center gap-1.5">
        <span
          class="inline-block h-3 w-3 rounded-[3px]"
          :style="{ background: palette.dataHigh }"
          aria-hidden="true"
        />{{ maxHoursLabel }}
      </span>
      <span class="text-muted-foreground/70 normal-case">· shade scales with the window's peak</span>
    </div>
    <div
      ref="container"
      class="mx-auto w-full max-w-full"
      :style="{ height: `${chartHeight}px` }"
      role="img"
      :aria-label="`Weekly coding activity by hour, ${cells.length} cells across ${WEEKDAY_LABELS.length} weekdays and 24 hours`"
    />
  </div>
</template>
