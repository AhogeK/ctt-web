<script setup lang="ts">
/**
 * LanguageDistributionPanel — "Language distribution": a ranked horizontal
 * bar list showing EVERY language in the selected window, sorted by coding
 * time.
 *
 * Design (lieflat §6 translation; closest relative = F5/C1 Tick Rows): the
 * row is a queue — a right-aligned label column, a bar growing from a shared
 * origin, and the readout immediately after the bar's end. Bar length is
 * scaled to the LONGEST language, so the top row spans the full track and no
 * width is wasted no matter how dominant or flat the distribution is.
 *
 * Completeness over truncation (user: "must see every language"): rows are
 * never capped. The list scrolls inside a bounded card instead, so a polyglot
 * history neither hides languages nor stretches the dashboard grid. Only the
 * sub-0.1% tail folds into an aggregate row (plugin parity); that row names
 * every folded language on hover, so nothing is unreachable.
 *
 * Bars are 8px capsules (never area fills), ranked on a single-hue indigo
 * luminance ramp — light mode walks deep → pale, dark mode bright → deep — so
 * neighbouring rows never share a shade while the biggest language leads.
 *
 * Data: GET /stats/distribution?type=LANGUAGES — entries {name, seconds}
 * ordered by duration descending (ctt-server v0.66.0 window params).
 * Loading / error / empty shell lives in the parent ChartSection.
 */
import { computed, onBeforeUnmount, onMounted, ref, nextTick, watch } from 'vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useStatsDistribution } from '@/composables/useStats'
import { formatDuration } from '@/lib/utils'
import { useThemeStore } from '@/stores/theme'

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
/** Quarter ticks on every track: the scale that makes lengths comparable. */
const TICKS = [25, 50, 75] as const

/** Percent readout: 2 decimals, trailing zeros trimmed (41.67% / 0.21% / 5%). */
function formatPercent(v: number): string {
  const s = v.toFixed(2)
  return s.endsWith('.00') ? s.slice(0, -3) : s.endsWith('0') ? s.slice(0, -1) : s
}

interface LangRow {
  name: string
  seconds: number
  percent: number
  /** Bar width as a share of the LONGEST row, not of the total. */
  barPercent: number
  /** Entries swallowed by an aggregate row — listed in its popover. */
  folded: { name: string; percent: number }[]
}

const totalSeconds = computed(() => distribution.data.value?.entries.reduce((acc, e) => acc + e.seconds, 0) ?? 0)

/**
 * Colour carries NO data here. Bar length already encodes the amount and the
 * label column already names the language, so per-row colour differences
 * imply a hierarchy that does not exist — which is why the earlier attempts
 * read wrong (a rank ramp suggests eight meaningful tiers; one accent plus
 * grey suggests every other language is disabled).
 *
 * Instead the whole bar region shares ONE smooth ramp: deepest at the track's
 * left edge, brightest at its right edge. Each bar paints a track-wide ramp
 * and clips it to its own width, so a long bar climbs the whole sweep while a
 * short bar only touches the deep end — one continuous scale, not a per-row
 * decoration, and deliberately NOT stepped: discrete rungs read as segments,
 * whereas this is a gradient.
 *
 * The stops are the trend chart's own indigo ramp (#3d49ad / #8290f0 /
 * #8a97f2 light; #4a53b8 / #8290f0 / #b9c1ff dark), so the two panels share
 * one gradient language. The dark deep end is nudged to #4f58c0 purely to
 * clear the 3:1 visibility floor on the track.
 */
const BAR_RAMP_LIGHT = ['#3d49ad', '#8290f0', '#8a97f2'] as const
const BAR_RAMP_DARK = ['#4f58c0', '#8290f0', '#b9c1ff'] as const

/** The shared ramp as a smooth gradient across the full track width. */
const barRamp = computed(() => {
  const stops = theme.isDark ? BAR_RAMP_DARK : BAR_RAMP_LIGHT
  // 0 / 48% / 100% mirrors the trend chart's own gradient offsets.
  const offsets = [0, 48, 100]
  return `linear-gradient(90deg, ${stops.map((c, i) => `${c} ${offsets[i]}%`).join(', ')})`
})

/**
 * Every language above the 0.1% floor becomes a row — no row budget, so the
 * full picture is always present. The negligible tail collapses into one
 * aggregate row that keeps the folded names for hover.
 */
const rows = computed<LangRow[]>(() => {
  const entries = distribution.data.value?.entries ?? []
  const total = totalSeconds.value
  if (total <= 0) return []
  const longest = Math.max(...entries.map((e) => e.seconds), 1)
  const share = (seconds: number) => (seconds / longest) * 100

  const aboveFloor = entries.filter((e) => (e.seconds / total) * 100 >= MIN_PERCENT)
  const folded = entries.filter((e) => (e.seconds / total) * 100 < MIN_PERCENT)

  const out: LangRow[] = aboveFloor.map((e) => ({
    name: e.name,
    seconds: e.seconds,
    percent: (e.seconds / total) * 100,
    barPercent: share(e.seconds),
    folded: [],
  }))

  const foldedSeconds = folded.reduce((acc, e) => acc + e.seconds, 0)
  if (foldedSeconds > 0) {
    out.push({
      name: 'Others',
      seconds: foldedSeconds,
      percent: (foldedSeconds / total) * 100,
      barPercent: share(foldedSeconds),
      folded: folded.map((e) => ({ name: e.name, percent: (e.seconds / total) * 100 })),
    })
  }
  return out
})

/** How many languages are actually listed (Others counts as one row). */
const languageCount = computed(() => rows.value.length)

const ariaLabel = computed(() => {
  const parts = rows.value.map((r) => `${r.name} ${formatPercent(r.percent)}%`).join(', ')
  return `Language distribution, bar length is coding time: ${parts}`
})

// ── Scroll affordance: the list is scrollable, so say so when it is ──
const listEl = ref<HTMLElement | null>(null)
const moreBelow = ref(false)
const atTop = ref(true)
const revealed = ref(false)
/** True briefly while the list is being scrolled — reveals the thumb. */
const scrolling = ref(false)
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
  nextTick(syncOverflow)
  el.addEventListener('scroll', onScroll, { passive: true })
  if (typeof ResizeObserver !== 'undefined') {
    sizeObserver = new ResizeObserver(syncOverflow)
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

// Data arriving changes the scroll height — refresh the affordance.
watch(rows, () => {
  nextTick(syncOverflow)
})

/**
 * Hover detail for the aggregate row: the folded languages with their shares,
 * capped so the popover cannot grow without bound. The remainder is reported
 * as a count instead of being silently dropped.
 */
const FOLDED_SHOWN = 8
function foldedBreakdown(row: LangRow): { shown: { name: string; percent: number }[]; rest: number } {
  const all = row.folded
  return { shown: all.slice(0, FOLDED_SHOWN), rest: Math.max(0, all.length - FOLDED_SHOWN) }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Every language is listed; the card bounds the HEIGHT, not the data.
         The scroll viewport fades its own content with a mask instead of
         painting a card-coloured overlay on top: an overlay can never match a
         card that carries a gradient, which is what produced the visible seam
         in dark mode. A mask has no colour, so there is nothing to mismatch. -->
    <div class="relative">
      <ul
        ref="listEl"
        class="lang-scroll max-h-[19rem] overflow-y-auto"
        :class="{ 'is-scrolling': scrolling, 'fade-top': !atTop, 'fade-bottom': moreBelow }"
        role="list"
        :aria-label="ariaLabel"
        tabindex="0"
      >
        <li v-for="(row, i) in rows" :key="row.name" class="mb-2" data-testid="language-row">
          <TooltipProvider :delay-duration="200">
            <Tooltip>
              <TooltipTrigger as-child>
                <span
                  class="grid grid-cols-[5.5rem_minmax(0,1fr)_3.5rem_4.75rem] items-center gap-2.5"
                  data-testid="language-row-body"
                >
                  <!-- Label column -->
                  <span
                    class="truncate text-right text-[11px] font-medium text-muted-foreground"
                    data-testid="language-label"
                    >{{ row.name }}</span
                  >

                  <!-- Track: a measurement rail, not emptiness. Quarter ticks turn the
               unused length into a scale so bar lengths stay comparable.
               `@container/track` makes the track the gradient's coordinate
               space: the bar paints its background at 100cqw (the FULL track
               width) and clips it to its own width, so every row exposes the
               same single dark→bright ramp — a long bar sweeps it, a short bar
               only touches its deep end. -->
                  <span class="lang-track relative h-2 rounded-full bg-muted/50">
                    <span
                      v-for="tick in TICKS"
                      :key="tick"
                      class="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-border/70"
                      :style="{ left: `${tick}%` }"
                      aria-hidden="true"
                    />
                    <span
                      class="lang-bar absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                      :style="{
                        width: revealed ? `${row.barPercent}%` : '0%',
                        backgroundImage: barRamp,
                        transitionDelay: `${(i % 12) * 45}ms`,
                      }"
                      data-testid="language-bar"
                    />
                  </span>

                  <!-- Value columns: percent and duration each own a fixed, right-
               aligned lane so they stack down the list instead of trailing
               each bar at a different x. -->
                  <span class="text-right text-[11px] font-semibold tabular-nums text-foreground">
                    {{ formatPercent(row.percent) }}%
                  </span>
                  <span class="whitespace-nowrap text-right text-[11px] tabular-nums text-muted-foreground">
                    <template v-if="row.seconds > 0">{{ formatDuration(row.seconds) }}</template>
                    <template v-else>—</template>
                  </span>
                </span>
              </TooltipTrigger>

              <!-- Aggregate rows explain themselves: the folded languages and
                   their shares, rendered in the design-system popover rather
                   than a native browser tooltip. -->
              <TooltipContent v-if="row.folded.length" side="top" class="max-w-xs">
                <div class="flex flex-col gap-1">
                  <span class="font-semibold">{{ row.folded.length }} languages folded in</span>
                  <span
                    v-for="entry in foldedBreakdown(row).shown"
                    :key="entry.name"
                    class="flex justify-between gap-3 tabular-nums"
                  >
                    <span>{{ entry.name }}</span>
                    <span>{{ formatPercent(entry.percent) }}%</span>
                  </span>
                  <span v-if="foldedBreakdown(row).rest > 0" class="opacity-70">
                    +{{ foldedBreakdown(row).rest }} more below {{ formatPercent(MIN_PERCENT) }}%
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </li>
      </ul>
    </div>

    <p class="text-right text-[11px] tracking-wide text-muted-foreground">
      {{ languageCount }} {{ languageCount === 1 ? 'language' : 'languages' }}
      <span v-if="moreBelow" class="text-muted-foreground/70"> · scroll for more</span>
    </p>
  </div>
</template>

<style scoped>
/**
 * Scroll lane for the language list — same recipe as TermsDialog (thin,
 * transparent track, rounded thumb) tuned for a panel: the thumb rests at
 * reduced opacity and firms up on hover, and the lane is reserved up front so
 * the readout column never shifts when the list starts overflowing.
 */
.lang-scroll {
  scrollbar-width: thin;
  /* Hidden at rest — the mask fade and footer hint carry the affordance. */
  scrollbar-color: transparent transparent;
  scrollbar-gutter: stable;
  padding-right: 0.5rem;
  outline: none;
}

/* Content-space fade: the viewport masks its own children, so there is no
   painted colour to mismatch the card's gradient (a card-coloured overlay can
   never match a card that itself carries a gradient — that was the seam).
   Only the edges that actually hide content get a mask, so a short list that
   fits entirely is never touched. */
.lang-scroll.fade-top.fade-bottom {
  mask-image: linear-gradient(to bottom, transparent 0, #000 1.125rem, #000 calc(100% - 1.625rem), transparent 100%);
}

.lang-scroll.fade-top:not(.fade-bottom) {
  mask-image: linear-gradient(to bottom, transparent 0, #000 1.125rem, #000 100%);
}

.lang-scroll.fade-bottom:not(.fade-top) {
  mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - 1.625rem), transparent 100%);
}

/* Reveal on interaction: hover, keyboard focus, or while scrolling. */
.lang-scroll:hover,
.lang-scroll:focus-visible,
.lang-scroll.is-scrolling {
  scrollbar-color: color-mix(in oklab, var(--muted-foreground) 60%, transparent) transparent;
}

.lang-scroll:focus-visible {
  /* Region-level focus indicator: an inset ring marks the scrollable area
     without adding chrome around the whole card. */
  box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--ring) 45%, transparent);
}

.lang-scroll::-webkit-scrollbar {
  width: 6px;
}

.lang-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.lang-scroll::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 9999px;
}

.lang-scroll:hover::-webkit-scrollbar-thumb,
.lang-scroll:focus-visible::-webkit-scrollbar-thumb,
.lang-scroll.is-scrolling::-webkit-scrollbar-thumb {
  background-color: color-mix(in oklab, var(--muted-foreground) 60%, transparent);
}

/**
 * The track is the gradient's coordinate space. `container-type: inline-size`
 * makes `cqw` resolve against the track's width, so a bar can paint a ramp
 * sized to the WHOLE track while being clipped to its own width — that is what
 * turns many per-row sweeps into one shared scale across the panel.
 */
.lang-track {
  container-type: inline-size;
}

.lang-bar {
  /* Track-sized ladder: the bar paints rungs sized to the FULL track and its
     own width clips them, so every row climbs the same scale. */
  background-size: 100cqw 100%;
  background-repeat: no-repeat;
  background-position: left center;
}

/* Every row — aggregate included — paints the identical ramp at full
   strength. Length already encodes how much, and the label already says what
   it is; tinting or dimming the aggregate would reintroduce exactly the
   "colour means something" implication this panel avoids. */
</style>
