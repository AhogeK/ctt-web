import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Fades marked pieces on a phone with a **timed** transition instead of one scrubbed by scroll distance.
 *
 * A distance-ranged fade is crossed by however far a gesture travels: one strong wheel flick or trackpad
 * coast covers about a screen, which is more than an element-anchored range spans, so the fade completes
 * between two frames and is never seen. Here each piece carries a state — `in`, `above` or `below` — and
 * CSS plays a fixed-duration transition between them, so no gesture can outrun it.
 *
 * The states are directional on purpose: a piece that leaves upward leaves *upward*, and one still below
 * the fold waits *below*, so a piece re-entering from the top never animates the wrong way.
 *
 * Only the phone branch of the landing page reads these attributes; the desktop layout has its own stage.
 *
 * @param root - the element to search within; pieces are looked up once, on mount
 * @param selectors - CSS selectors for the pieces to fade
 */
export function useRevealOnScroll(root: Ref<HTMLElement | null>, selectors: string[]): void {
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    const scope = root.value
    if (!scope) return

    const pieces = scope.querySelectorAll(selectors.join(', '))
    if (pieces.length === 0) return

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const piece = entry.target as HTMLElement
          if (entry.isIntersecting) piece.dataset.revealState = 'in'
          else piece.dataset.revealState = entry.boundingClientRect.top < 0 ? 'above' : 'below'
        }
      },
      { threshold: 0 },
    )

    for (const piece of pieces) observer.observe(piece)
  })

  onBeforeUnmount(() => observer?.disconnect())
}
