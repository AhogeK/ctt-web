<script setup lang="ts">
/**
 * TrendChart — 30-day coding activity trend (smooth line + gradient area).
 *
 * Mirrors the plugin panel "Coding Activity (Last 30 Days)": one point per
 * day, hour-scaled Y axis, smooth curve. Design differs from the plugin's
 * blue→green two-hue gradient on purpose — this dashboard's charts share a
 * single brand indigo ramp (DESIGN.md), so the line is brand ink and the
 * area fades from a soft indigo tint to transparent (the top/bottom color
 * separation the user asked for).
 *
 * Data contract: dense daily points (date + seconds), zero days included —
 * the same HeatmapResponse the heatmap consumes (parent reuses one query).
 * Rendering is ECharts (tree-shaken — LineChart registered in ./echarts-setup
 * next to the heatmap's imports). Theme switches re-derive the palette
 * through a setOption update (instance survives — no re-init flicker).
 *
 * This component owns rendering only: fetching and the loading / error /
 * empty wrapper live in the parent (ChartSection).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { graphic, init, type EChartsType } from 'echarts/core'
import type { DailyStatPoint } from '@/lib/schemas/stats.schema'
import { formatHourLabel, getHourAxisScale } from './axis-scale'
import { formatDuration } from '@/lib/utils'
import { useThemeStore } from '@/stores/theme'
import '@/components/charts/echarts-setup'

const props = defineProps<{
  /** Dense daily points (date + seconds) in date order, ≤31 days */
  points: DailyStatPoint[]
}>()

const theme = useThemeStore()

interface Palette {
  /** Line stroke at the TOP of the plot (high coding time) — brighter ink */
  lineTop: string
  /** Line stroke at the BOTTOM of the plot (near zero) — deeper ink */
  lineBottom: string
  areaTop: string
  areaBottom: string
  axisLabel: string
  /** Grid-line ramp endpoints — hue AND alpha both shift bottom → top. */
  gridLineBottom: string
  gridLineTop: string
  tooltipBg: string
  tooltipText: string
}

const palette = computed<Palette>(() => {
  const dark = theme.isDark
  return dark
    ? {
        // Deliberately wide spread: bottom reads as deep navy-indigo,
        // top as near-lavender — the gradient must be obvious at a glance.
        lineTop: '#b9c1ff',
        lineBottom: '#4a53b8',
        areaTop: 'rgba(130, 142, 255, 0.36)',
        areaBottom: 'rgba(74, 83, 184, 0.015)',
        axisLabel: '#8a8f98',
        gridLineBottom: 'rgba(83, 92, 150, 0.16)',
        gridLineTop: 'rgba(133, 145, 245, 0.42)',
        tooltipBg: '#f7f8f8',
        tooltipText: '#08090a',
      }
    : {
        lineTop: '#8a97f2',
        lineBottom: '#3d49ad',
        areaTop: 'rgba(104, 116, 238, 0.26)',
        areaBottom: 'rgba(61, 73, 173, 0.015)',
        axisLabel: '#62666d',
        gridLineBottom: 'rgba(94, 106, 210, 0.08)',
        gridLineTop: 'rgba(94, 106, 210, 0.28)',
        tooltipBg: '#08090a',
        tooltipText: '#f7f8f8',
      }
})

const container = ref<HTMLDivElement | null>(null)
const containerWidth = ref(0)
let chart: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

/** Chart height in px — content-driven, no dead space under the axis. */
const CHART_HEIGHT = 180

/**
 * The line stroke is colored by VERTICAL POSITION — near 0h the curve is
 * deep indigo, at the top of the plot it brightens. LinearGradient coords
 * are series-relative (globalCoord false): resize needs no recompute.
 */
function createLineGradient(pal: Palette) {
  return new graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: pal.lineTop },
    { offset: 0.48, color: '#8290f0' },
    { offset: 1, color: pal.lineBottom },
  ])
}

interface RgbaColor {
  r: number
  g: number
  b: number
  a: number
}

function parseRgba(value: string): RgbaColor {
  const match = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (!match) throw new Error(`Invalid rgba color: ${value}`)
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] === undefined ? 1 : Number(match[4]),
  }
}

/** Interpolate two rgba() strings (component-wise, clamped progress). */
function interpolateRgba(from: string, to: string, progress: number): string {
  const start = parseRgba(from)
  const end = parseRgba(to)
  const t = Math.max(0, Math.min(1, progress))
  const r = Math.round(start.r + (end.r - start.r) * t)
  const g = Math.round(start.g + (end.g - start.g) * t)
  const b = Math.round(start.b + (end.b - start.b) * t)
  const a = start.a + (end.a - start.a) * t
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`
}

function buildOption(points: DailyStatPoint[], pal: Palette) {
  // Readable equidistant scale: explicit max + interval (see axis-scale.ts).
  const maxSeconds = Math.max(...points.map((p) => p.seconds), 0)
  const yScale = getHourAxisScale(maxSeconds)

  return {
    backgroundColor: 'transparent',
    grid: { left: 8, right: 8, top: 12, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: { color: pal.gridLineTop, width: 1 },
      },
      backgroundColor: pal.tooltipBg,
      borderWidth: 0,
      padding: [8, 12],
      textStyle: { color: pal.tooltipText, fontFamily: 'Inter, sans-serif', fontSize: 12 },
      formatter: (params: Array<{ dataIndex: number }>) => {
        const p = params[0]
        const point = p === undefined ? undefined : points[p.dataIndex]
        if (!point) return ''
        const d = new Date(`${point.date}T00:00:00`)
        const weekday = d.toLocaleString('en-US', { weekday: 'short' })
        return `<b>${weekday}, ${point.date}</b><br/>${formatDuration(point.seconds)} coded`
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
        // ~5 ticks across 30 days: show every 7th date (MM-DD).
        interval: 6,
        formatter: (date: string) => date.slice(5),
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
        formatter: formatHourLabel,
      },
      // Grid lines are drawn as ECharts `graphic` elements (see
      // buildGridGraphics) — splitLine's per-line color array cannot express
      // a reliable bottom→top ramp.
      splitLine: { show: false },
    },
    series: [
      {
        name: 'Coding time',
        type: 'line',
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 0, // hover reveals the point via emphasis
        // Curve stroke colored by vertical position (deep → bright indigo).
        lineStyle: { width: 2, color: createLineGradient(pal) },
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
          scale: 1.6,
          itemStyle: {
            // Hover dot is a single shape — reuse the bright top ink.
            color: pal.lineTop,
            borderColor: pal.tooltipBg,
            borderWidth: 2,
          },
        },
        data: points.map((p) => p.seconds),
      },
    ],
  }
}

/** One hand-drawn grid line — shape matches the ECharts `graphic` line element. */
interface GridLine {
  id: string
  type: 'line'
  silent: boolean
  z: number
  shape: { x1: number; y1: number; x2: number; y2: number }
  style: { stroke: string; lineWidth: number; lineDash: number[] }
}

/**
 * Draw the grid lines as explicit `graphic` elements at the real pixel Y of
 * each tick — color interpolated bottom→top through the palette endpoints
 * (hue and alpha both shift). Runs AFTER setOption: convertToPixel needs the
 * laid-out coordinate system.
 */
function buildGridGraphics(
  points: DailyStatPoint[],
  yScale: { intervalSeconds: number; maxSeconds: number; tickCount: number },
  pal: Palette,
): GridLine[] {
  if (!chart || points.length === 0) return []

  const left = chart.convertToPixel({ xAxisIndex: 0 }, points[0]!.date)
  const right = chart.convertToPixel({ xAxisIndex: 0 }, points[points.length - 1]!.date)
  if (typeof left !== 'number' || typeof right !== 'number') return []
  if (!Number.isFinite(left) || !Number.isFinite(right)) return []

  return Array.from({ length: yScale.tickCount }, (_, index) => {
    const value = index * yScale.intervalSeconds
    const y = chart!.convertToPixel({ yAxisIndex: 0 }, value)
    if (typeof y !== 'number' || !Number.isFinite(y)) return null
    const progress = yScale.tickCount <= 1 ? 1 : index / (yScale.tickCount - 1)
    return {
      id: `trend-grid-line-${index}`,
      type: 'line',
      silent: true,
      z: 0,
      shape: { x1: left, y1: y, x2: right, y2: y },
      style: {
        stroke: interpolateRgba(pal.gridLineBottom, pal.gridLineTop, progress),
        lineWidth: 1,
        lineDash: [4, 4],
      },
    }
  }).filter((g): g is GridLine => g !== null)
}

function render(): void {
  if (!chart || container.value === null) return
  const maxSeconds = Math.max(...props.points.map((point) => point.seconds), 0)
  const yScale = getHourAxisScale(maxSeconds)

  chart.setOption(buildOption(props.points, palette.value), true)
  // Second pass writes the hand-drawn grid into the live instance (not a
  // re-init) — theme/data changes recompute colors and positions.
  chart.setOption({
    graphic: [
      {
        id: 'trend-grid-lines',
        type: 'group',
        silent: true,
        z: 0,
        $action: 'replace',
        children: buildGridGraphics(props.points, yScale, palette.value),
      },
    ],
  })
}

function syncSize(): void {
  chart?.resize()
  // Graphics are pinned to pixel coordinates — re-derive after relayout.
  render()
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
    <div
      ref="container"
      class="mx-auto w-full max-w-full"
      :style="{ height: `${CHART_HEIGHT}px` }"
      role="img"
      :aria-label="`Coding trend, ${points.length} days from ${points[0]?.date ?? ''} to ${points[points.length - 1]?.date ?? ''}`"
    />
  </div>
</template>
