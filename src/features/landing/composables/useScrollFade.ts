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
 *  - with `enterOnBand`: `out -> in` — a screen whose arrival must coincide with the band line (the
 *    anchor band itself, entering exactly when the beat starts dissolving);
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
 * entrance play together in both scroll directions: scrolling up flips the band back to `out` at the
 * same instant the beat fades back `in`, and nothing needs to touch another element's state.
 *
 * The element's markup carries its initial state (`out` for the beat, `in` for the hero), so the first
 * paint is correct without waiting for this script.
 *
 * @param target - the element carrying `data-scroll-fade`
 * @param thresholds - the optional `leaveSvh` flips state to `leaving`; `leaveOnBand` overrides it
 *   with the band line; `enterSvh` adds the `out` phase on a fixed mark; `enterOnBand` adds it on the
 *   band line instead; omitting both leave thresholds means the element only ever enters.
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
      next = enter !== null && scroll >= enter ? 'in' : 'out'
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
