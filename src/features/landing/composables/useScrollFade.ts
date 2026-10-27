import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Flips `data-scroll-fade` as the scroll crosses its thresholds, so CSS can play fixed-duration fades.
 *
 * The pinned stage's animations are scrubbed by the scroll — right for position, wrong for a fade: a
 * scrubbed fade is crossed between two frames by any flick and reads differently for every visitor,
 * since how far a gesture travels is the device's business. The stage screens keep their rises scrubbed
 * (that is the pinned choreography) and their fades play on fixed clocks instead, like the flow pieces
 * below the stage; these thresholds are the triggers.
 *
 * Three shapes, one state attribute:
 *  - with `enterSvh`: `out -> in` — a screen that waits below the fold on a fixed scroll mark (the
 *    year beat);
 *  - with `enterOnBand`: `out -> in -> out` — the hand-off band, which appears once the band line has
 *    been crossed and dissolves again when it leaves the viewport, the way the observer-driven bands
 *    do;
 *  - without either: the element starts `in` and only ever leaves — a screen visible at load (the hero).
 *
 * Two ways to name a threshold, and the difference matters: `enterSvh`/`leaveSvh` are scroll marks in
 * viewport units (the hero's exit and the year beat's entrance share one trigger at 60svh), while the
 * band-anchored triggers read the band's live box — its top crossing the viewport's 60% line,
 * converted to a scroll position on every event. Shared triggers are the contract: when two blocks'
 * boxes overlap, their fades must start on the same threshold so one is always dissolving while the
 * other appears — a block that sits at full opacity while its neighbour fades in reads as two sections
 * stacked rather than a hand-off. Anchoring both ends of the lower hand-off to the same live line is
 * what keeps that pairing exact on every screen height and after any layout shift: a fixed svh paired
 * with a layout-derived line drifts apart the moment the band moves.
 *
 * The year beat's exit is `leaveOnBand` for the reason above — a fixed trigger dissolves the beat
 * while the stage's tail is still on screen, and on tall viewports that tail is a full screen of
 * nothing between the gone beat and the band still below the fold (measured: ~1000px blank at
 * vh=1250). The band's entrance (`enterOnBand`) reads the very same line, so the dissolve and the
 * entrance play together: the beat fades out as the band fades in.
 *
 * The hand-off band writes two attributes of its own. `data-handoff` records the one-off fact that
 * the stage has handed over to it — the band below waits for that fact and for nothing else — and
 * `data-fade-from` records the side it came from, so that it slides in from that side and the two
 * bands sharing the screen arrive in the same direction. The hand-off is a latch: crossing the line
 * hands over once and for all, and scrolling back above the line does not take the hand-off back.
 *
 * The element's markup carries its initial state (`out` for the beat, `in` for the hero), so the first
 * paint is correct without waiting for this script.
 *
 * @param target - the element carrying `data-scroll-fade`
 * @param thresholds - the optional `leaveSvh` flips state to `leaving`; `leaveOnBand` overrides it
 *   with the band line; `enterSvh` adds the `out` phase on a fixed mark; `enterOnBand` adds it on the
 *   band line instead, and the element then leaves again once it goes off screen; omitting the leave
 *   thresholds means the element never takes the `leaving` phase.
 */
export function useScrollFade(
  target: Ref<HTMLElement | null>,
  thresholds: { enterSvh?: number; leaveSvh?: number; leaveOnBand?: Ref<unknown>; enterOnBand?: Ref<unknown> },
): void {
  /** The ref may be the exposed component proxy (`{ el }`) or the element itself. */
  const bandEl = (r: Ref<unknown> | undefined): HTMLElement | null => {
    const v = r?.value
    if (!v) return null
    return (v as { el?: HTMLElement }).el ?? (v as HTMLElement)
  }
  /** Whether the stage has handed over to this band. A latch: it never un-happens. */
  let handedOver = false
  /** Which side the band last came from, which decides where it fades in from. */
  let cameFrom: 'above' | 'below' = 'below'

  function apply(): void {
    const el = target.value
    if (!el) return
    const scroll = globalThis.scrollY
    let next: 'out' | 'in' | 'leaving'
    // The band's top crossing 60% of the viewport, as a scroll position: the element's document
    // offset minus 60% of the height. Recomputed per event, so it tracks the layout live.
    const line = (r: Ref<unknown> | undefined): number | null => {
      const b = bandEl(r)
      return b ? scroll + b.getBoundingClientRect().top - globalThis.innerHeight * 0.6 : null
    }
    let leave: number
    if (thresholds.leaveOnBand) leave = line(thresholds.leaveOnBand) ?? Infinity
    else leave = thresholds.leaveSvh === undefined ? Infinity : (thresholds.leaveSvh / 100) * globalThis.innerHeight
    if (scroll >= leave) next = 'leaving'
    else if (thresholds.enterOnBand) {
      const enter = line(thresholds.enterOnBand)
      // The hand-off is a one-off fact, not a function of where the scroll is now: once the stage
      // has handed over to the band, scrolling back above the line does not un-hand it over.
      // A hand-off recomputed from the current position would be reset on the way up, and the band
      // below — which waits for the hand-off — would then be withheld with nothing to release it,
      // so it would never appear at all.
      if (enter !== null && scroll >= enter) handedOver = true
      el.dataset.handoff = handedOver ? 'in' : 'out'
      // The band fades in when it enters the viewport and fades out when it leaves, like the
      // observer-driven bands — the hand-off line only says *when* it may appear, not that it
      // stays lit for the rest of the visit.
      //
      // "On screen" is the band overlapping the viewport at all: the band is taller than the fold,
      // so it starts scrolling away long before its top edge is gone, and treating that as "left"
      // would blank the screen while the band was still being read.
      const box = el.getBoundingClientRect()
      const onScreen = box.bottom > 0 && box.top < globalThis.innerHeight
      // Where the band came from decides where it fades in from, so that it uses the same
      // language as the observer-driven bands: a band that arrived from above slides down into
      // place, one that arrived from below slides up. Without this the hand-off band would always
      // arrive from below while its neighbour arrives from above, and the two would meet on screen
      // moving in opposite directions.
      if (box.bottom < 0) cameFrom = 'above'
      else if (box.top > globalThis.innerHeight) cameFrom = 'below'
      el.dataset.fadeFrom = cameFrom
      // Off screen it fades out, on screen it fades in once the hand-off has happened. There is
      // deliberately no third case: a rule that held the band lit while its entrance was still
      // playing made it oscillate between the two states, because "the entrance is still
      // playing" and "the departure is under way" look the same from the outside.
      //
      // Cutting an entrance short is harmless here, because the band is off screen when it
      // happens — and it cannot happen while the band is being read, because the band stays
      // "on screen" until its bottom edge passes the top of the viewport.
      next = onScreen && handedOver ? 'in' : 'out'
    } else if (thresholds.enterSvh === undefined) next = 'in'
    else next = scroll >= (thresholds.enterSvh / 100) * globalThis.innerHeight ? 'in' : 'out'
    if (el.dataset.scrollFade !== next) el.dataset.scrollFade = next
  }

  onMounted(() => {
    apply()
    globalThis.addEventListener('scroll', apply, { passive: true })
    // The thresholds are viewport-relative, so a resize with no scroll of its own must be able to move
    // the state too.
    globalThis.addEventListener('resize', apply)
  })

  onBeforeUnmount(() => {
    globalThis.removeEventListener('scroll', apply)
    globalThis.removeEventListener('resize', apply)
  })
}
