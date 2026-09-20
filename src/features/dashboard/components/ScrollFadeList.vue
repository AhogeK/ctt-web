<script setup lang="ts">
/**
 * ScrollFadeList — the bounded-height scrolling region shared by the dashboard's
 * list panels (the two distributions and the recent-sessions log).
 *
 * Extracted at the second consumer, per the domain rule: the ranking, folding
 * and precision rules of the distribution panels could not be changed in one
 * place, and this shell is the same shape of problem — four behaviours that are
 * easy to get subtly wrong and expensive to keep in sync:
 *
 * 1. **Reachability.** The region scrolls and its rows are not focusable, so it
 *    carries a tab stop; without it a keyboard user cannot reach anything below
 *    the fold (WCAG 2.1.1, the standard scrollable-region pattern).
 * 2. **List semantics.** Tailwind's preflight sets `list-style: none`, which
 *    strips list semantics in Safari/VoiceOver, so `role="list"` is the
 *    documented fix rather than a redundant attribute.
 * 3. **Edge fades as a mask, never a painted gradient.** A coloured fade cannot
 *    match a card that itself carries a gradient — it reads as a seam. Only the
 *    edges that actually hide content get a mask, so a list that fits is never
 *    touched at all.
 * 4. **Overlay scrollbar.** The thumb rests hidden and appears on hover, focus or
 *    active scrolling: a standing grey bar on a card reads as chrome.
 *
 * The shell owns the region and its affordances; the consumer owns the rows and
 * whatever measurement they need (`measure`), because "which cell is cut off" is
 * panel-specific.
 */

import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  /** Accessible name for the scrollable region. */
  a11yLabel: string
  /**
   * Called on every refresh — mount, region resize, or when the consumer asks
   * via the exposed `refresh()` — with the live element. Consumers use it to
   * re-measure cell truncation; the shell runs its own overflow sync around it.
   */
  measure?: (root: HTMLElement) => void
}>()

/**
 * Emitted after every overflow recomputation, with the one fact consumers need:
 * whether content remains below the fold (a footer hint). `atTop` is not sent —
 * the shell already owns it for its own top fade, and no consumer reads it.
 */
const emit = defineEmits<{
  overflow: [state: { moreBelow: boolean }]
}>()

const listEl = ref<HTMLElement | null>(null)
/** More content below the fold (drives the bottom edge fade). */
const moreBelow = ref(false)
/** Still at the very top (drives the top edge fade). */
const atTop = ref(true)
/** Briefly true while scrolling — reveals the thumb. */
const scrolling = ref(false)
let sizeObserver: ResizeObserver | null = null
let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null

/** Recompute both edge fades from the live scroll position. */
function syncOverflow(): void {
  const el = listEl.value
  if (el === null) return
  atTop.value = el.scrollTop <= 2
  moreBelow.value = el.scrollHeight - el.scrollTop - el.clientHeight > 4
  emit('overflow', { moreBelow: moreBelow.value })
}

/** Overflow sync plus whatever the consumer needs to re-measure. */
function refresh(): void {
  syncOverflow()
  const el = listEl.value
  if (el !== null) props.measure?.(el)
}

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
  nextTick(refresh)
  el.addEventListener('scroll', onScroll, { passive: true })
  if (typeof ResizeObserver !== 'undefined') {
    // One observer for the region: a per-row observer would cost more than the
    // single measuring pass it replaces.
    sizeObserver = new ResizeObserver(refresh)
    sizeObserver.observe(el)
  }
})

onBeforeUnmount(() => {
  listEl.value?.removeEventListener('scroll', onScroll)
  if (scrollIdleTimer !== null) clearTimeout(scrollIdleTimer)
  scrollIdleTimer = null
  sizeObserver?.disconnect()
  sizeObserver = null
})

/** Consumers re-run measurement after their data changes. */
defineExpose({ refresh })
</script>

<template>
  <ul
    ref="listEl"
    class="scroll-fade h-full overflow-y-auto"
    :class="{
      'is-scrolling': scrolling,
      'fade-top': !atTop,
      'fade-bottom': moreBelow,
    }"
    role="list"
    :aria-label="props.a11yLabel"
    tabindex="0"
  >
    <slot />
  </ul>
</template>

<style scoped>
/**
 * Scroll lane — same recipe as TermsDialog (thin, transparent track, rounded
 * thumb) tuned for a panel: the thumb rests at reduced opacity and firms up on
 * hover, and the lane is reserved up front so a readout column never shifts when
 * the list starts overflowing.
 */
.scroll-fade {
  scrollbar-width: thin;
  /* Hidden at rest — the mask fade and the consumer's footer hint carry the
     affordance instead. */
  scrollbar-color: transparent transparent;
  scrollbar-gutter: stable;
  padding-right: 0.5rem;
  outline: none;
}

/* Content-space fade: the viewport masks its own children, so there is no painted
   colour to mismatch the card's gradient. */
.scroll-fade.fade-top.fade-bottom {
  mask-image: linear-gradient(to bottom, transparent 0, #000 1.125rem, #000 calc(100% - 1.625rem), transparent 100%);
}

.scroll-fade.fade-top:not(.fade-bottom) {
  mask-image: linear-gradient(to bottom, transparent 0, #000 1.125rem, #000 100%);
}

.scroll-fade.fade-bottom:not(.fade-top) {
  mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - 1.625rem), transparent 100%);
}

/* Reveal on interaction: hover, keyboard focus, or while scrolling. */
@media (hover: hover) {
  .scroll-fade:hover,
  .scroll-fade:focus-visible,
  .scroll-fade.is-scrolling {
    scrollbar-color: color-mix(in oklab, var(--muted-foreground) 60%, transparent) transparent;
  }
}

.scroll-fade:focus-visible {
  /* Region-level focus indicator: an inset ring marks the scrollable area without
     adding chrome around the whole card. */
  box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--ring) 45%, transparent);
}

.scroll-fade::-webkit-scrollbar {
  width: 6px;
}

.scroll-fade::-webkit-scrollbar-track {
  background: transparent;
}

.scroll-fade::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 9999px;
}

@media (hover: hover) {
  .scroll-fade:hover::-webkit-scrollbar-thumb,
  .scroll-fade:focus-visible::-webkit-scrollbar-thumb,
  .scroll-fade.is-scrolling::-webkit-scrollbar-thumb {
    background-color: color-mix(in oklab, var(--muted-foreground) 60%, transparent);
  }
}
</style>
