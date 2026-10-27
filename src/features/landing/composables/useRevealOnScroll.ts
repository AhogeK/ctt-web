import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Fades marked pieces with a **timed** transition instead of one scrubbed by scroll distance.
 *
 * A distance-ranged fade is crossed by however far a gesture travels: one strong wheel flick or trackpad
 * coast covers about a screen, which is more than an element-anchored range spans, so the fade completes
 * between two frames and is never seen. Here each piece carries a state — `in`, `above` or `below` — and
 * CSS plays a fixed-duration transition between them, so no gesture can outrun it.
 *
 * **A piece fades in when it enters the viewport, and fades out when it leaves.** That single rule gives
 * the right order in both directions, because the order in which pieces enter the viewport depends on
 * the direction of travel: scrolling down, the section above is entered first; scrolling up, the
 * section below is entered first. A rule that forced one fixed order regardless of direction would
 * make a section wait for a neighbour it has no reason to wait for — the lower one held back while
 * the upper one sits lit — and the page would use two languages for the same motion.
 *
 * The one exception is the band's hand-off: the stage's outgoing screen and the first band must
 * dissolve and appear together, so the first band may not appear before the hand-off line has been
 * crossed. The band right below it waits for that, and for nothing else.
 *
 * The states are directional on purpose: a piece that leaves the viewport leaves *that way*, and one
 * still below the fold waits *below*, so a piece re-entering from the top never animates the wrong
 * way. A piece that leaves before it was ever shown is not fading out of anything, so it is shown
 * instead — it has nothing to fade back to.
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
  let releaseFrame = 0

  onMounted(() => {
    if (!root.value) return

    // Looked up inside the view root only: the pieces are landing-specific and all live here.
    const pieces = root.value.querySelectorAll(selectors.join(', '))
    if (pieces.length === 0) return

    // The anchor band is the stage's hand-off partner on desktop: its entrance runs on the stage's
    // own scroll-fade clock (so the beat's dissolve and the band's fade-in share one trigger), and
    // the observer must not pre-empt that with an early `in` — a band at full opacity while the beat
    // is still crisp is the two-stacked-blocks failure. On phones the observer stays its driver, so
    // the band keeps its fixed-clock fade there.
    const stageAnchored = (piece: Element) =>
      globalThis.matchMedia('(min-width: 1024px)').matches && piece.hasAttribute('data-band-anchor')

    /**
     * The band that follows the hand-off band, and the hand-off band itself.
     *
     * Only the band directly below the hand-off band waits for it: the hand-off line is the point
     * where the stage's outgoing screen starts dissolving, and a band that appeared before that
     * would stand crisp beside a screen that is still crisp.
     */
    const bands = [...pieces].filter((piece) => piece.hasAttribute('data-reveal-band')) as HTMLElement[]
    const anchorBand = bands.find((band) => band.hasAttribute('data-band-anchor'))
    const afterAnchor = anchorBand ? bands[bands.indexOf(anchorBand) + 1] : undefined

    /**
     * Whether the hand-off has happened.
     *
     * The hand-off band records it as a separate flag rather than through its fade state: its fade
     * state also says `out` while it is off screen, which is a different fact from "the stage has
     * handed over".
     */
    const handOffDone = (): boolean => anchorBand?.dataset.handoff === 'in'

    /**
     * Whether a piece has ever been shown.
     *
     * A piece that is scrolled past before it ever appeared must not be treated as one that faded
     * out: the `above` state hides it, and a piece that was never shown has nothing to fade back to.
     * The flag separates "faded out after being seen" from "never appeared".
     */
    const hasBeenSeen = new WeakSet<HTMLElement>()

    /**
     * Pieces waiting for the hand-off line to be crossed.
     *
     * A piece is put here when it is held back, and taken out when it is let go. The set is
     * what the release loop walks, so a held-back piece that is not in it can never be let
     * go — it would sit in its hidden state for the rest of the visit.
     */
    const waiting = new Set<HTMLElement>()

    /**
     * Show a piece.
     *
     * The only piece that may have to wait is the band below the hand-off band, and only until the
     * hand-off line has been crossed. That wait is a scroll-position fact, not a visual one, so it
     * holds in both directions: scrolling up, the hand-off has long since happened and the band is
     * free to appear the moment it enters the viewport.
     */
    const show = (piece: HTMLElement): void => {
      if (piece === afterAnchor && !handOffDone()) {
        // The hand-off has not happened yet: the stage is still handing over, and a band standing
        // at full opacity beside it would read as two sections stacked. It waits for the line.
        piece.dataset.revealState = 'below'
        waiting.add(piece)
        startRelease()
        return
      }
      piece.dataset.revealState = 'in'
      hasBeenSeen.add(piece)
    }

    /**
     * Release the pieces that are waiting for the hand-off.
     *
     * The hand-off flag is written on a scroll event, which is not an attribute change the observer
     * would report, so the check runs on every frame while something waits, and stops as soon as
     * nothing does.
     */
    const release = () => {
      if (releaseFrame === 0) return
      if (waiting.size === 0) {
        cancelAnimationFrame(releaseFrame)
        releaseFrame = 0
        return
      }
      // Deleting the element being visited is safe while a Set is iterated, so the set is
      // walked directly: copying it first would allocate on every frame of the wait.
      for (const piece of waiting) {
        if (!handOffDone()) continue
        waiting.delete(piece)
        piece.dataset.revealState = 'in'
        hasBeenSeen.add(piece)
      }
      releaseFrame = requestAnimationFrame(release)
    }

    const startRelease = () => {
      if (releaseFrame === 0) releaseFrame = requestAnimationFrame(release)
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const piece = entry.target as HTMLElement
          // Desktop: the anchor band's entrance belongs to the stage's scroll-fade clock (and a stale
          // state written while the window was narrow must not outlive the breakpoint). Clear it so
          // the reveal rules stop matching and the scroll-fade rules govern alone.
          if (stageAnchored(piece)) {
            piece.removeAttribute('data-reveal-state')
            continue
          }
          if (entry.isIntersecting) {
            show(piece)
          } else if (!hasBeenSeen.has(piece) && entry.boundingClientRect.top < 0) {
            // Scrolled past without ever appearing: a flick can carry a whole band out of the
            // viewport between two frames, so the observer never sees it intersect. Marking it `above`
            // would hide content the visitor has not read yet and would leave it hidden for the rest
            // of the visit, while the bands below it — which did intersect — showed normally, so the
            // page would read as if the skipped band came after them.
            //
            // Only a piece that has moved *above* the viewport qualifies: a piece still waiting
            // below has not been passed and must keep waiting.
            show(piece)
          } else {
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
    if (releaseFrame) cancelAnimationFrame(releaseFrame)
  })
}
