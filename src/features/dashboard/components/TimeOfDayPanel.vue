<script setup lang="ts">
import { useI18n } from 'vue-i18n'
/**
 * TimeOfDayPanel — "Time of day distribution" over the backend's
 * plugin-aligned buckets (Night 00-06 / Morning 06-12 / Daytime 12-18 /
 * Evening 18-24, local timezone) — sessions split across bucket edges
 * since ctt-server v0.65.0; each entry = enum name + aggregated seconds.
 *
 * Design (Linear-inspired, lieflat-flavored): the capsule IS the day —
 * segments sit in fixed clock order; a 2px paper seam separates neighbours.
 * Legend glyphs are Lucide day-phase icons (plugin-parity semantics);
 * percent leads the value hierarchy, duration follows.
 *
 * Hover: chart mouse events set `activeSeg`, which raises a fixed info chip
 * anchored to the segment's center (never cursor-following) and dims the
 * other legend entries.
 *
 * This component owns rendering only: fetching and the loading / error /
 * empty wrapper live in the parent (ChartSection) — the project's panel
 * pattern (HourlyPanel precedent: a self-wrapped ChartSection never mounts
 * the chart because the container ref stays null while the query pends).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { init, type EChartsType } from 'echarts/core'
import { Moon, Sun, Sunrise, Sunset, type LucideIcon } from '@lucide/vue'
import { useStatsDistribution } from '@/composables/useStats'
import { formatDuration, formatPercent } from '@/lib/utils'
import { useThemeStore } from '@/stores/theme'
import '@/components/charts/echarts-setup'

const { t } = useI18n()

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

const BUCKET_KEY: Record<BucketKey, string> = {
  NIGHT: 'dashboard.timeOfDay.night',
  MORNING: 'dashboard.timeOfDay.morning',
  DAYTIME: 'dashboard.timeOfDay.daytime',
  EVENING: 'dashboard.timeOfDay.evening',
}

/** Day-phase glyph per bucket — Lucide parity with the plugin's emoji legend. */
const BUCKET_ICON: Record<BucketKey, LucideIcon> = {
  NIGHT: Moon,
  MORNING: Sunrise,
  DAYTIME: Sun,
  EVENING: Sunset,
}

/** Human clock range per bucket (backend v0.65.0 plugin-aligned edges). */
const BUCKET_RANGE: Record<BucketKey, string> = {
  NIGHT: '00–06',
  MORNING: '06–12',
  DAYTIME: '12–18',
  EVENING: '18–24',
}

/**
 * Single-hue indigo ramp following the daylight metaphor: Night deepest,
 * Daytime brightest, Evening settling back down. Light mode darkens the
 * ramp for white-background contrast; dark mode lifts it off #0f1011.
 * Endpoint-vs-surface contrast is deliberately high; adjacent
 * segment distinctness is carried by the 2px paper seams instead.
 */
const BUCKET_COLORS: Record<BucketKey, { light: string; dark: string }> = {
  NIGHT: { light: '#1e2260', dark: '#4149bd' },
  MORNING: { light: '#3f4ab0', dark: '#4d59c9' },
  DAYTIME: { light: '#939ff0', dark: '#bcc5ff' },
  EVENING: { light: '#5e6ad2', dark: '#8b95ea' },
}

interface BucketView {
  name: BucketKey
  seconds: number
  /**
   * EXACT share of the total, never rounded. Geometry (segment seams, chip
   * anchor) reads this: ECharts sizes each segment from `seconds`, so a rounded
   * share would place the seam up to a percent away from the colour boundary it
   * is meant to draw.
   */
  share: number
}

const totalSeconds = computed(() => distribution.data.value?.entries.reduce((acc, e) => acc + e.seconds, 0) ?? 0)

const buckets = computed<BucketView[]>(() => {
  const entries = distribution.data.value?.entries ?? []
  const byName = new Map(entries.map((e) => [e.name, e.seconds]))
  const total = totalSeconds.value
  return BUCKET_ORDER.map((name) => {
    const seconds = byName.get(name) ?? 0
    return { name, seconds, share: total > 0 ? (seconds / total) * 100 : 0 }
  })
})

const totalLabel = computed(() => formatDuration(totalSeconds.value))

const ariaLabel = computed(() => {
  const parts = buckets.value.map((b) => `${t(BUCKET_KEY[b.name])} ${formatPercent(b.share, 0)}%`).join(', ')
  return t('dashboard.timeOfDay.aria', { parts, total: totalLabel.value })
})

const container = ref<HTMLDivElement | null>(null)
let chart: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

/** Strip height in px — a single capsule row, legend lives in HTML below. */
const STRIP_HEIGHT = 40
/**
 * Capsule thickness and the radius that closes its ends. Defined together and
 * derived from one another: a radius that is not exactly half the thickness
 * shows a seam where the straight edge meets the curve.
 */
const BAR_WIDTH = 24
const CAPSULE_RADIUS = BAR_WIDTH / 2

/**
 * Corner radius for a segment of the capsule, in ECharts' order
 * (top-left, top-right, bottom-right, bottom-left).
 *
 * `CAPSULE_RADIUS` closes an end into a true semicircle. Only the two OUTER
 * ends of the strip are rounded; an end that touches a neighbour stays square,
 * otherwise the stack reads as a row of beads instead of one capsule.
 *
 * @param index - position of the segment among the visible ones
 * @param count - number of visible segments
 */
function capsuleCorners(index: number, count: number): [number, number, number, number] {
  if (count === 1) return [CAPSULE_RADIUS, CAPSULE_RADIUS, CAPSULE_RADIUS, CAPSULE_RADIUS]
  if (index === 0) return [CAPSULE_RADIUS, 0, 0, CAPSULE_RADIUS]
  if (index === count - 1) return [0, CAPSULE_RADIUS, CAPSULE_RADIUS, 0]
  return [0, 0, 0, 0]
}

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
  const visible = colored.filter((b) => b.seconds > 0)
  return visible.map((seg, i) => ({
    ...seg,
    borderRadius: capsuleCorners(i, visible.length),
  }))
})

/**
 * Seam positions between surviving segments (cumulative percent). Rendered
 * as an HTML overlay because ECharts stacked bars paint over any border.
 */
const seams = computed(() => {
  const visible = segments.value
  const out: { name: BucketKey; left: string }[] = []
  let acc = 0
  for (const seg of visible) {
    acc += seg.share
    if (seg !== visible[visible.length - 1]) out.push({ name: seg.name, left: `${acc}%` })
  }
  return out
})

/**
 * Highlight state: which segment is under the pointer — or was last tapped
 * (null = none). Drives the fixed info chip above the capsule and the legend
 * highlight — replaces the ECharts floating tooltip, which drifted with the
 * cursor and read as noise. A tap PINS it (touch has no pointer-leave), so the
 * same segment tapped again — or any tap outside the panel — restores.
 */
const activeSeg = ref<BucketKey | null>(null)
/** The segment of the last tap — a second tap on it clears the pin. */
let lastClick: BucketKey | null = null

/** Center-x of each visible segment as a percent of the capsule width. */
const segmentCenters = computed(() => {
  const out = new Map<BucketKey, number>()
  let acc = 0
  for (const seg of segments.value) {
    out.set(seg.name, acc + seg.share / 2)
    acc += seg.share
  }
  return out
})

const activeView = computed(() => buckets.value.find((b) => b.name === activeSeg.value) ?? null)

/** Info-chip position: segment center, clamped so the chip never overflows. */
const chipLeft = computed(() => {
  if (!activeSeg.value) return 0
  const c = segmentCenters.value.get(activeSeg.value) ?? 50
  return Math.min(86, Math.max(14, c))
})

function onSegEnter(name: BucketKey): void {
  activeSeg.value = name
}

function onSegLeave(): void {
  activeSeg.value = null
}

/**
 * Tap/click toggle: a second tap on the same segment restores; a tap on a
 * different segment moves the highlight. Works from the strip and from a
 * legend entry.
 */
function onSegToggle(name: BucketKey): void {
  if (lastClick === name && activeSeg.value === name) {
    activeSeg.value = null
    lastClick = null
    return
  }
  activeSeg.value = name
  lastClick = name
}

const root = ref<HTMLElement | null>(null)

/** A tap outside the panel restores the default (all legend entries lit). */
function onDocPointerDown(event: PointerEvent): void {
  if (activeSeg.value === null) return
  const target = event.target as Node | null
  if (root.value !== null && target !== null && !root.value.contains(target)) {
    activeSeg.value = null
    lastClick = null
  }
}

function buildOption(): Record<string, unknown> {
  return {
    backgroundColor: 'transparent',
    // Honor the OS reduce-motion preference (lieflat hard rule).
    animation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    animationDuration: 500,
    animationEasing: 'cubicOut',
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: 'value', max: totalSeconds.value || 1, show: false },
    yAxis: { type: 'category', data: ['tod'], show: false },
    // Hover is handled by chart events + an HTML chip (see activeSeg) — the
    // floating ECharts tooltip drifted with the cursor and was hard to read.
    tooltip: { show: false },
    series: segments.value.map((seg, i) => ({
      type: 'bar',
      name: seg.name,
      stack: 'tod',
      barWidth: BAR_WIDTH,
      animationDelay: i * 90,
      data: [{ name: seg.name, value: seg.seconds }],
      itemStyle: { color: seg.color, borderRadius: seg.borderRadius },
      label: { show: false },
      cursor: 'pointer',
    })),
  }
}

function bindHoverEvents(): void {
  if (!chart || typeof chart.on !== 'function') return
  chart.on('mouseover', (params: { seriesName?: string }) => {
    const name = params.seriesName as BucketKey | undefined
    if (name && BUCKET_ORDER.includes(name)) activeSeg.value = name
  })
  chart.on('mouseout', () => {
    activeSeg.value = null
  })
  chart.on('click', (params: { seriesName?: string }) => {
    const name = params.seriesName as BucketKey | undefined
    if (name && BUCKET_ORDER.includes(name)) onSegToggle(name)
  })
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
  bindHoverEvents()
  document.addEventListener('pointerdown', onDocPointerDown)
  resizeObserver = new ResizeObserver(syncSize)
  resizeObserver.observe(container.value)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.dispose()
  chart = null
})

watch([buckets, () => theme.isDark], render)
</script>

<template>
  <!-- The card stretches to its grid row (a sibling may be much taller), so the
       panel fills that height and spreads its three blocks — capsule, legend,
       total — with space-around instead of huddling in the vertical centre.
       Other panels keep the default centring: a chart with a fixed plot height
       should not be stretched, but a stack of small blocks reads better
       distributed. -->
  <div ref="root" class="tod-panel flex flex-1 flex-col justify-around gap-4">
    <!-- Capsule strip — widths are the shares. An overlay draws the paper
         seams between buckets (ECharts stacked bars have no inter-segment
         gap; a border hack gets overpainted by the neighbour). Hovering a
         segment raises the fixed info chip above it — anchored to the
         segment center, not the cursor — and highlights its legend entry.
         `mt-10` reserves exactly the chip's height (32px) plus its 8px gap, so
         the chip always has somewhere to appear: without it, a short card puts
         the strip at the top and the chip would land on the card header. Narrow
         panels neither reserve nor paint the chip — see the scoped container
         rules. -->
    <div class="tod-strip relative mt-10">
      <!-- `role="img"` + `aria-label` on the chart container is ECharts' own ARIA
           pattern (its `visual/aria.js` sets exactly these two attributes when the
           `aria` option is enabled), and it is what every chart panel here uses.
           An `<img>`/`<svg>` cannot replace it: the content is a live canvas the
           library draws into, and the label carries the data the canvas cannot
           express. The legend below repeats every bucket as real text. -->
      <div ref="container" class="w-full" :style="{ height: `${STRIP_HEIGHT}px` }" role="img" :aria-label="ariaLabel" />
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <span
          v-for="seg in seams"
          :key="seg.name"
          class="absolute top-0 h-full w-0.5 -translate-x-1/2"
          :style="{ left: seg.left, background: theme.isDark ? '#191a1b' : '#ffffff' }"
          data-testid="tod-seam"
        ></span>
      </div>

      <!-- Fixed info chip: shows the hovered bucket, anchored above its center -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition duration-100 ease-in"
        leave-to-class="opacity-0"
      >
        <div
          v-if="activeView && activeSeg"
          class="tod-chip-float pointer-events-none absolute bottom-full left-0 mb-2 flex items-center gap-2 whitespace-nowrap rounded-lg border border-border/60 bg-popover px-3 py-1.5 shadow-md"
          :style="{ left: chipLeft + '%', transform: 'translateX(-50%)' }"
          data-testid="tod-info-chip"
        >
          <component
            :is="BUCKET_ICON[activeSeg]"
            class="h-3.5 w-3.5"
            :style="{ color: theme.isDark ? BUCKET_COLORS[activeSeg].dark : BUCKET_COLORS[activeSeg].light }"
          />
          <span class="text-xs font-semibold text-popover-foreground">{{ t(BUCKET_KEY[activeSeg]) }}</span>
          <span class="text-[10px] tabular-nums text-muted-foreground">{{ BUCKET_RANGE[activeSeg] }}</span>
          <span class="text-xs font-semibold tabular-nums text-popover-foreground"
            >{{ formatPercent(activeView.share, 0) }}%</span
          >
          <span class="text-[11px] tabular-nums text-muted-foreground">{{ formatDuration(activeView.seconds) }}</span>
        </div>
      </Transition>
    </div>

    <!-- Legend: clock order, Lucide day-phase glyph, percent leads · duration
         follows; the hovered bucket's entry highlights in sync with the chip -->
    <ul class="tod-legend flex flex-wrap justify-around gap-y-2.5">
      <li
        v-for="bucket in buckets"
        :key="bucket.name"
        class="flex items-center gap-2.5 rounded-lg px-2 py-1 transition-opacity"
        :class="activeSeg && activeSeg !== bucket.name ? 'opacity-45' : ''"
        @mouseenter="onSegEnter(bucket.name)"
        @mouseleave="onSegLeave()"
        @click="onSegToggle(bucket.name)"
      >
        <span
          class="tod-chip flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          :style="{
            backgroundColor: theme.isDark
              ? 'color-mix(in srgb, ' + BUCKET_COLORS[bucket.name].dark + ' 30%, transparent)'
              : 'color-mix(in srgb, ' + BUCKET_COLORS[bucket.name].light + ' 22%, transparent)',
          }"
          aria-hidden="true"
        >
          <component
            :is="BUCKET_ICON[bucket.name]"
            class="h-4 w-4"
            :stroke-width="2.25"
            :style="{ color: theme.isDark ? BUCKET_COLORS[bucket.name].dark : BUCKET_COLORS[bucket.name].light }"
          />
        </span>
        <span class="flex min-w-0 flex-col leading-tight">
          <span class="text-xs font-medium tracking-wide">
            {{ t(BUCKET_KEY[bucket.name]) }}
            <span class="ml-1 text-[10px] tabular-nums text-muted-foreground/60">{{ BUCKET_RANGE[bucket.name] }}</span>
          </span>
          <span class="tod-value tod-percent text-sm font-semibold tabular-nums text-foreground">
            {{ formatPercent(bucket.share, 0) }}%
            <span class="tod-duration ml-1.5 text-[11px] font-normal tabular-nums text-muted-foreground">
              <template v-if="bucket.seconds > 0">{{ formatDuration(bucket.seconds) }}</template>
              <template v-else>—</template>
            </span>
          </span>
        </span>
      </li>
    </ul>

    <p class="text-right text-[11px] tracking-wide text-muted-foreground">
      {{ t('dashboard.common.total') }} <span class="font-medium text-foreground">{{ totalLabel }}</span>
    </p>
  </div>
</template>

<style scoped>
/**
 * Phone-narrow panels tighten the stack: the capsule's chip reserve drops to
 * a plain gap (touch has no hover to raise the chip into it), the four stats
 * align on a two-column grid instead of wrapping one ragged row each, and the
 * icon chips shrink a notch. Wide panels keep the spread legend and full
 * reserve.
 */
.tod-panel {
  container: tod / inline-size;
}

@container tod (max-width: 30rem) {
  /* The hover chip is a desktop affordance: at this width it has no room to
     rise (it would overlap the title and clip on the card edges), and the
     legend below already carries every value. The hover highlight on the
     legend stays. */
  .tod-chip-float {
    display: none;
  }

  .tod-strip {
    margin-top: 1rem;
  }

  .tod-legend {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    column-gap: 0.75rem;
    row-gap: 0.375rem;
  }

  .tod-legend li {
    gap: 0.5rem;
    padding-inline: 0.125rem;
  }

  .tod-chip {
    height: 1.5rem;
    width: 1.5rem;
  }

  /* The percent + duration line must stay one line: at grid-lane width the
     longest bucket ("31% 21h 14m 47s") otherwise orphans its seconds. */
  .tod-value {
    white-space: nowrap;
  }

  .tod-percent {
    font-size: 0.8125rem;
  }

  .tod-duration {
    font-size: 0.625rem;
  }
}
</style>
