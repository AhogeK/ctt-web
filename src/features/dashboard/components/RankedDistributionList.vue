<script setup lang="ts">
/**
 * RankedDistributionList — the shared presentational list behind the ranked
 * categorical distribution panels (language, project, and any dimension with
 * the same shape: a name and an accumulated duration).
 *
 * It owns structure and behaviour only; the panel keeps its own query, its own
 * labels and its own footer copy. Extracting it is what makes the panels
 * consistent *by construction*: every hard-won detail below (mask edges, the
 * shared gradient, the lane widths, the overlay scrollbar) has exactly one
 * home, so a fix in one panel can no longer silently miss the other.
 *
 * Behaviours encoded here, each of which was arrived at by measurement:
 *
 * - **Bar length is scaled to the longest row**, so rank 1 spans the track and
 *   no width is wasted whether the distribution is dominated or flat.
 * - **One shared gradient across the whole bar region.** Each bar paints a
 *   track-wide ramp (background-size: 100cqw) and its own width clips it, so
 *   every row exposes the same dark→bright scale. Colour carries no data —
 *   length and label do — so the aggregate row is painted identically; any
 *   tint or alpha difference would re-import "colour means something".
 * - **A bounded viewport, never bounded data.** The list scrolls; the card
 *   caps its own height. Edge fades are `mask-image` (colourless) because a
 *   card-coloured overlay can never match a card that carries a gradient.
 * - **Truncated names stay readable.** A label the column cuts off raises the
 *   full name on hover; the aggregate row raises its folded breakdown instead.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDuration, formatPercent } from '@/lib/utils'
import { useThemeStore } from '@/stores/theme'
import type { RankedRow } from '../composables/useRankedDistribution'

const props = withDefaults(
  defineProps<{
    /** Rows in render order (already sorted, aggregate row included) */
    rows: RankedRow[]
    /**
     * Accessible description of the list, including every row's share.
     * Named `a11yLabel` rather than `ariaLabel`: Vue maps a camelCase prop back
     * to its kebab form, which for this name collides with the reserved `aria-*`
     * attribute namespace and fails the template type check.
     */
    a11yLabel: string
    /** Decimals kept for values that can afford them (the readout extends below this) */
    percentStep?: number
    /** Plural noun for the folded entries in the aggregate popover ("languages") */
    foldNoun?: string
  }>(),
  { percentStep: 2, foldNoun: 'entries' },
)

const theme = useThemeStore()

/** Quarter ticks on every track: the scale that makes lengths comparable. */
const TICKS = [25, 50, 75] as const
/** Folded entries listed in the aggregate row's popover before it summarises. */
const FOLDED_SHOWN = 8
/** Fraction of the label column a name must exceed to be treated as cut off. */
const TRUNCATION_SLACK_PX = 1

/**
 * The stops are the trend chart's own indigo ramp, so the panels share one
 * gradient language rather than picking "similar" values. The dark deep end is
 * nudged from #4a53b8 purely to clear the 3:1 visibility floor on the track.
 */
/** 0 / 48% / 100% mirrors the trend chart's own gradient offsets. */
const RAMP_OFFSETS = [0, 48, 100] as const
const BAR_RAMP_LIGHT = ['#3d49ad', '#8290f0', '#8a97f2'] as const
const BAR_RAMP_DARK = ['#4f58c0', '#8290f0', '#b9c1ff'] as const

const barRamp = computed(() => {
  const stops = theme.isDark ? BAR_RAMP_DARK : BAR_RAMP_LIGHT
  const stopList = stops.map((color, i) => `${color} ${RAMP_OFFSETS[i]}%`).join(', ')
  return `linear-gradient(90deg, ${stopList})`
})

// ── Scroll affordance: the list is scrollable, so say so when it is ──
const listEl = ref<HTMLElement | null>(null)
const moreBelow = ref(false)
const atTop = ref(true)
const revealed = ref(false)
/** True briefly while the list is being scrolled — reveals the thumb. */
const scrolling = ref(false)
/** Names the label column currently cuts off (measured, not guessed). */
const truncated = ref<ReadonlySet<string>>(new Set())
let observer: IntersectionObserver | null = null
let sizeObserver: ResizeObserver | null = null
let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null

function syncOverflow(): void {
  const el = listEl.value
  if (el === null) return
  atTop.value = el.scrollTop <= 2
  moreBelow.value = el.scrollHeight - el.scrollTop - el.clientHeight > 4
}

/**
 * Measures which labels the column actually cuts off. Measured rather than
 * inferred from character count: the font is proportional, so a length rule
 * would both hide readable names and expose cut ones. Runs on the existing
 * resize observer, so it costs one pass, not one observer per row.
 */
function syncTruncation(): void {
  const root = listEl.value
  if (root === null) return
  const next = new Set<string>()
  for (const el of root.querySelectorAll<HTMLElement>('[data-testid="distribution-label"]')) {
    if (el.scrollWidth > el.clientWidth + TRUNCATION_SLACK_PX) next.add(el.textContent?.trim() ?? '')
  }
  truncated.value = next
}

/**
 * Overlay-scrollbar behaviour: the thumb stays hidden at rest and only shows
 * while the list is actually being scrolled (or hovered/focused) — a standing
 * grey bar on a card reads as chrome, not content.
 */
function onScroll(): void {
  syncOverflow()
  scrolling.value = true
  if (scrollIdleTimer !== null) clearTimeout(scrollIdleTimer)
  scrollIdleTimer = setTimeout(() => {
    scrolling.value = false
    scrollIdleTimer = null
  }, 900)
}

onMounted(() => {
  const el = listEl.value
  if (el === null) return
  nextTick(() => {
    syncOverflow()
    syncTruncation()
  })
  el.addEventListener('scroll', onScroll, { passive: true })
  if (typeof ResizeObserver !== 'undefined') {
    sizeObserver = new ResizeObserver(() => {
      syncOverflow()
      syncTruncation()
    })
    sizeObserver.observe(el)
  }

  if (typeof IntersectionObserver === 'undefined') {
    revealed.value = true
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        revealed.value = true
        observer?.disconnect()
        observer = null
      }
    },
    { threshold: 0.25 },
  )
  observer.observe(el)
})

onBeforeUnmount(() => {
  listEl.value?.removeEventListener('scroll', onScroll)
  if (scrollIdleTimer !== null) clearTimeout(scrollIdleTimer)
  scrollIdleTimer = null
  sizeObserver?.disconnect()
  sizeObserver = null
  observer?.disconnect()
  observer = null
})

/**
 * Whether a row has anything to reveal: an aggregate row explains what it
 * swallowed, and a name the column cut off reveals itself. One predicate drives
 * both the popover and the row's tab stop, so the two can never disagree —
 * a row you can raise but not reach by keyboard (or vice versa) is the bug this
 * prevents.
 */
function hasDetail(row: RankedRow): boolean {
  return row.folded.length > 0 || truncated.value.has(row.name)
}

// New data means new names and new scroll height — refresh both affordances.
watch(
  () => props.rows,
  () => {
    nextTick(() => {
      syncOverflow()
      syncTruncation()
    })
  },
)

/** The folded languages with their shares, capped so the popover stays bounded. */
function foldedBreakdown(row: RankedRow): { shown: { name: string; percent: number }[]; rest: number } {
  const all = row.folded
  return { shown: all.slice(0, FOLDED_SHOWN), rest: Math.max(0, all.length - FOLDED_SHOWN) }
}

defineExpose({ syncOverflow, syncTruncation })
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- The card bounds the HEIGHT, not the data. Height budget: this card
         spends 92px on chrome (32 padding + 18 header + 16 header gap + 8 gap +
         18 footer), so a 228px viewport lands it at ~320px — the agreed ceiling
         for the two-column layout. -->
    <div class="relative">
      <!-- `role="list"` and `tabindex` are both deliberate here, and both are
           flagged by generic linters as redundant — they are not:
           - Tailwind's preflight sets `list-style: none`, which strips list
             semantics in Safari/VoiceOver, so the role is the documented fix;
           - the region scrolls, and its rows are not focusable, so without the
             tab stop a keyboard user cannot reach the rows below the fold
             (WCAG 2.1.1; this is the standard scrollable-region pattern).

           The max-height stays an arbitrary px value on purpose: 228 is a
           derived budget (320px card ceiling − 92px chrome), not a spacing step.
           The canonical spacing-scale form (step 57) compiles to
           `calc(var(--spacing) * 57)`, which would silently move the card off
           that ceiling if the spacing scale were ever themed. Utility class and
           the comment above then agree on 228. -->
      <ul
        ref="listEl"
        class="dist-scroll max-h-57 overflow-y-auto"
        :class="{ 'is-scrolling': scrolling, 'fade-top': !atTop, 'fade-bottom': moreBelow }"
        role="list"
        :aria-label="a11yLabel"
        tabindex="0"
      >
        <li v-for="(row, i) in rows" :key="row.name" class="mb-2" data-testid="distribution-row">
          <TooltipProvider :delay-duration="200">
            <Tooltip>
              <TooltipTrigger as-child>
                <!-- Column widths are a contract, not a preference. Each lane is
                     sized for the LONGEST value it can ever receive, measured at
                     11px tabular-nums — the common case is much narrower and would
                     otherwise hide the overflow until a real dataset produced it:
                     - percent: "<0.000001%" = 69.6px (the formatter's hard max);
                     - duration: "10000h 59m 59s" = 91.3px (5-digit hours, beyond
                       any real history, with minutes and seconds both non-zero);
                     - label: a realistic name prefix; longer names truncate and
                       raise the full name on hover. -->
                <span
                  class="dist-row-body grid grid-cols-[7rem_minmax(0,1fr)_4.5rem_6rem] items-center gap-2.5"
                  :tabindex="hasDetail(row) ? 0 : undefined"
                  data-testid="distribution-row-body"
                >
                  <!-- Label column -->
                  <span
                    class="truncate text-right text-[11px] font-medium text-muted-foreground"
                    data-testid="distribution-label"
                    >{{ row.name }}</span
                  >

                  <!-- Track: a measurement rail, not emptiness. Quarter ticks turn
                       the unused length into a scale so bar lengths stay comparable.
                       `container-type: inline-size` makes the track the gradient's
                       coordinate space: the bar paints its background at 100cqw (the
                       FULL track width) and clips it to its own width, so every row
                       exposes the same single dark→bright ramp. -->
                  <span class="dist-track relative h-2 rounded-full bg-muted/50">
                    <span
                      v-for="tick in TICKS"
                      :key="tick"
                      class="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-border/70"
                      :style="{ left: `${tick}%` }"
                      aria-hidden="true"
                    />
                    <span
                      class="dist-bar absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                      :style="{
                        width: revealed ? `${row.barPercent}%` : '0%',
                        backgroundImage: barRamp,
                        transitionDelay: `${(i % 12) * 45}ms`,
                      }"
                      data-testid="distribution-bar"
                    />
                  </span>

                  <!-- Value columns: percent and duration each own a fixed, right-
                       aligned lane so they stack down the list instead of trailing
                       each bar at a different x. -->
                  <span class="text-right text-[11px] font-semibold tabular-nums text-foreground">
                    {{ formatPercent(row.percent, percentStep) }}%
                  </span>
                  <span class="whitespace-nowrap text-right text-[11px] tabular-nums text-muted-foreground">
                    <template v-if="row.seconds > 0">{{ formatDuration(row.seconds) }}</template>
                    <template v-else>—</template>
                  </span>
                </span>
              </TooltipTrigger>

              <!-- One tooltip per row, whichever reason applies:
                   an aggregate row explains what it swallowed, and a name the
                   column cut off reveals itself. Rendered in the design-system
                   popover rather than a native browser tooltip. -->
              <TooltipContent v-if="hasDetail(row)" side="top" class="max-w-xs" data-testid="distribution-popover">
                <div v-if="row.folded.length" class="flex flex-col gap-1">
                  <span class="font-semibold">{{ row.folded.length }} {{ foldNoun }} folded in</span>
                  <span
                    v-for="entry in foldedBreakdown(row).shown"
                    :key="entry.name"
                    class="flex justify-between gap-3 tabular-nums"
                  >
                    <span>{{ entry.name }}</span>
                    <span>{{ formatPercent(entry.percent, percentStep) }}%</span>
                  </span>
                  <span v-if="foldedBreakdown(row).rest > 0" class="opacity-70">
                    +{{ foldedBreakdown(row).rest }} more below {{ formatPercent(0.1, percentStep) }}%
                  </span>
                </div>
                <span v-else class="tabular-nums">{{ row.name }}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </li>
      </ul>
    </div>

    <p class="text-right text-[11px] tracking-wide text-muted-foreground">
      <slot name="footer" :more-below="moreBelow" />
      <span v-if="moreBelow" class="text-muted-foreground/70"> · scroll for more</span>
    </p>
  </div>
</template>

<style scoped>
/**
 * Scroll lane — same recipe as TermsDialog (thin, transparent track, rounded
 * thumb) tuned for a panel: the thumb rests at reduced opacity and firms up on
 * hover, and the lane is reserved up front so the readout column never shifts
 * when the list starts overflowing.
 */
.dist-scroll {
  scrollbar-width: thin;
  /* Hidden at rest — the mask fade and footer hint carry the affordance. */
  scrollbar-color: transparent transparent;
  scrollbar-gutter: stable;
  padding-right: 0.5rem;
  outline: none;
}

/* Content-space fade: the viewport masks its own children, so there is no
   painted colour to mismatch the card's gradient. Only the edges that actually
   hide content get a mask, so a short list that fits entirely is never touched. */
.dist-scroll.fade-top.fade-bottom {
  mask-image: linear-gradient(to bottom, transparent 0, #000 1.125rem, #000 calc(100% - 1.625rem), transparent 100%);
}

.dist-scroll.fade-top:not(.fade-bottom) {
  mask-image: linear-gradient(to bottom, transparent 0, #000 1.125rem, #000 100%);
}

.dist-scroll.fade-bottom:not(.fade-top) {
  mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - 1.625rem), transparent 100%);
}

/* Reveal on interaction: hover, keyboard focus, or while scrolling. */
.dist-scroll:hover,
.dist-scroll:focus-visible,
.dist-scroll.is-scrolling {
  scrollbar-color: color-mix(in oklab, var(--muted-foreground) 60%, transparent) transparent;
}

.dist-scroll:focus-visible {
  /* Region-level focus indicator: an inset ring marks the scrollable area
     without adding chrome around the whole card. */
  box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--ring) 45%, transparent);
}

.dist-scroll::-webkit-scrollbar {
  width: 6px;
}

.dist-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.dist-scroll::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 9999px;
}

/* Keyboard-reachable rows need a visible focus indicator (WCAG 2.4.7). Only the
   rows that have detail to reveal carry a tab stop, so this never competes with
   the scroll region's own ring for attention. */
.dist-row-body:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--ring) 55%, transparent);
  border-radius: 0.25rem;
}

.dist-scroll:hover::-webkit-scrollbar-thumb,
.dist-scroll:focus-visible::-webkit-scrollbar-thumb,
.dist-scroll.is-scrolling::-webkit-scrollbar-thumb {
  background-color: color-mix(in oklab, var(--muted-foreground) 60%, transparent);
}

/**
 * The track is the gradient's coordinate space. `container-type: inline-size`
 * makes `cqw` resolve against the track's width, so a bar can paint a ramp
 * sized to the WHOLE track while being clipped to its own width — that is what
 * turns many per-row sweeps into one shared scale across the panel.
 */
.dist-track {
  container-type: inline-size;
}

.dist-bar {
  /* Track-sized ramp: the bar paints stops sized to the FULL track and its own
     width clips them, so every row climbs the same scale. */
  background-size: 100cqw 100%;
  background-repeat: no-repeat;
  background-position: left center;
}
</style>
