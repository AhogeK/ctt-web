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
 * Two shapes, one state attribute:
 *  - with `enterSvh`: `out → in → leaving` — a screen that waits below the fold (the year beat);
 *  - without it: the element starts `in` and only ever leaves — a screen visible at load (the hero).
 *
 * The thresholds are expressed in viewport units because the stage's whole choreography is (the hero's
 * exit begins at 120svh; the year beat enters on the same trigger and exits at 300svh, as the stage
 * releases and the first closing band enters); pixel values or intersection ratios would fire at
 * different moments on different screen heights.
 *
 * The element's markup carries its initial state (`out` for the beat, `in` for the hero), so the first
 * paint is correct without waiting for this script.
 *
 * @param target - the element carrying `data-scroll-fade`
 * @param thresholds - `leaveSvh` flips state to `leaving`; the optional `enterSvh` adds the `out` phase
 */
export function useScrollFade(
  target: Ref<HTMLElement | null>,
  thresholds: { enterSvh?: number; leaveSvh: number },
): void {
  function apply(): void {
    const el = target.value
    if (!el) return
    const leave = (thresholds.leaveSvh / 100) * globalThis.innerHeight
    const scroll = globalThis.scrollY
    let next: 'out' | 'in' | 'leaving'
    if (scroll >= leave) next = 'leaving'
    else if (thresholds.enterSvh === undefined) next = 'in'
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
