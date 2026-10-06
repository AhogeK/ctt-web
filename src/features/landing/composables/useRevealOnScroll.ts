import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Fades marked pieces with a **timed** transition instead of one scrubbed by scroll distance.
 *
 * A distance-ranged fade is crossed by however far a gesture travels: one strong wheel flick or trackpad
 * coast covers about a screen, which is more than an element-anchored range spans, so the fade completes
 * between two frames and is never seen. Here each piece carries a state — `in`, `above` or `below` — and
 * CSS plays a fixed-duration transition between them, so no gesture can outrun it.
 *
 * **A fast gesture is held back rather than raced**: flipping a piece to `in` at its first pixel would
 * burn its 600ms fade while the piece is still mostly off screen, so a big scroll would land on fully
 * settled content. An entry observed while the scroll is faster than `FAST_PX_PER_S` goes into a pending
 * set and is revealed when the scroll slows below it (or 140ms after events stop), so whatever a
 * gesture lands on animates in front of the visitor. Slow, reading-pace scrolling is untouched: entries
 * reveal on sight.
 *
 * The states are directional on purpose: a piece that leaves upward leaves *upward*, and one still below
 * the fold waits *below*, so a piece re-entering from the top never animates the wrong way. A piece that
 * leaves while pending is dropped — a band flown past must not flash back into view on the next settle.
 *
 * The phone branch reads these attributes for every piece, and on desktop the closing bands read them
 * too; the stage's beats keep their scroll-driven animations, and the footer deliberately stays plain —
 * it is the page's last block, so an entrance fade there would only be something to scroll past.
 *
 * @param root - the view root; used as the mount guard (pieces are looked up inside it)
 * @param selectors - CSS selectors for the pieces to fade
 */
export function useRevealOnScroll(root: Ref<HTMLElement | null>, selectors: string[]): void {
  let observer: IntersectionObserver | undefined
  let settleTimer: ReturnType<typeof setTimeout> | undefined
  let onScroll: (() => void) | undefined

  onMounted(() => {
    if (!root.value) return

    // Looked up inside the view root only: the pieces are landing-specific and all live here.
    const pieces = root.value.querySelectorAll(selectors.join(', '))
    if (pieces.length === 0) return

    const pending = new Set<HTMLElement>()
    const flush = () => {
      for (const piece of pending) {
        // Only pieces that are properly on screen. A settle must not fade a piece that is still a sliver
        // at the bottom edge — that fade would play almost entirely off screen and be wasted; it stays
        // pending and is revealed by a later flush once it has risen.
        const rect = piece.getBoundingClientRect()
        if (rect.top < globalThis.innerHeight * 0.85 && rect.bottom > 0) {
          piece.dataset.revealState = 'in'
          pending.delete(piece)
        }
      }
    }

    // Speed is averaged over a ~120ms window rather than measured per event: a single event's delta over
    // its own dt is at the mercy of delivery jitter (one coalesced or delayed event reads as a stall and
    // would flush the pending set mid-coast). The trailing timer covers the coast's last stretch, where
    // events stop arriving altogether.
    const FAST_PX_PER_S = 2500
    const SETTLE_MS = 140
    const WINDOW_MS = 120
    const samples: Array<{ at: number; y: number }> = [{ at: performance.now(), y: globalThis.scrollY }]
    let speed = 0
    onScroll = () => {
      const now = performance.now()
      const y = globalThis.scrollY
      samples.push({ at: now, y })
      while (samples.length > 1 && now - samples[0]!.at > WINDOW_MS) samples.shift()
      const oldest = samples[0]!
      const span = now - oldest.at
      // A burst that just restarted (fewer than two samples inside the window, or too short a span) has
      // no speed yet — treat it as fast, so nothing is revealed in the gap between the first event and
      // the second, which is exactly where a flick's first crossing lands.
      speed = samples.length < 2 || span < 32 ? FAST_PX_PER_S : (Math.abs(y - oldest.y) / span) * 1000
      if (speed < FAST_PX_PER_S) flush()
      clearTimeout(settleTimer)
      settleTimer = setTimeout(() => {
        speed = 0
        flush()
      }, SETTLE_MS)
    }
    globalThis.addEventListener('scroll', onScroll, { passive: true })

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const piece = entry.target as HTMLElement
          if (entry.isIntersecting) {
            if (speed >= FAST_PX_PER_S) pending.add(piece)
            else piece.dataset.revealState = 'in'
          } else {
            pending.delete(piece)
            piece.dataset.revealState = entry.boundingClientRect.top < 0 ? 'above' : 'below'
          }
        }
      },
      { threshold: 0 },
    )

    for (const piece of pieces) observer.observe(piece)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    if (onScroll) globalThis.removeEventListener('scroll', onScroll)
    clearTimeout(settleTimer)
  })
}
