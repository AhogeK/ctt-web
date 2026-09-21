import { ref, computed, getCurrentScope, onScopeDispose } from 'vue'

export interface UseCardTiltOptions {
  /**
   * Whether the card itself moves (rotation + the hover lift).
   *
   * `false` keeps the glare tracking the pointer but writes no transform at all, so the panel stays
   * exactly where the layout put it. An identity transform would still open a stacking context, so
   * the transform is omitted rather than zeroed.
   */
  tilt?: boolean
  /** Maximum rotation angle from mouse movement in degrees (default: 8) */
  intensity?: number
  /** Base static rotation X in degrees — the card's resting 3D angle */
  baseRotateX?: number
  /** Base static rotation Y in degrees — the card's resting 3D angle */
  baseRotateY?: number
  /** Base static rotation Z in degrees — adds roll to the 3D angle */
  baseRotateZ?: number
  /** Z-depth offset in pixels — positive = closer, negative = further */
  translateZ?: number
  /** Parallax depth multiplier (0-1.5). Closer cards respond more to mouse. Default: 1.0 */
  depthMultiplier?: number
}

/**
 * Composable for mouse-follow 3D tilt effect with true depth layering.
 *
 * Supports base 3D rotations (static angle), Z-depth positioning, and
 * parallax mouse tracking where closer cards respond more to movement.
 *
 * @param options - Configuration for tilt behavior
 * @returns Reactive transform string, CSS variables for sheen, and event handlers
 */
export function useCardTilt(options: UseCardTiltOptions = {}) {
  const {
    tilt = true,
    intensity = 8,
    baseRotateX = 0,
    baseRotateY = 0,
    baseRotateZ = 0,
    translateZ = 0,
    depthMultiplier = 1,
  } = options

  const sheenX = ref('50%')
  const sheenY = ref('50%')
  const isHovering = ref(false)

  /**
   * Values are set straight from the pointer and the **CSS transition** does the smoothing, the way
   * the reference implementation does it (`transition: transform .6s cubic-bezier(.23,1,.32,1)`).
   *
   * The previous version lerped towards a target frame by frame: the motion advanced in visible steps
   * , and a leave snapped to zero with no animation at all. A transition gives
   * both the follow and the restore for free, and it runs on the compositor.
   */
  const rotateX = ref(0)
  const rotateY = ref(0)

  /**
   * The card's box, sampled once per hover.
   *
   * Sampling it on every move fed the tilt back into itself: a tilt grows the projected box (448 → 453
   * in the real measurement), the bigger box changes the normalised pointer offset, that changes the
   * target angle, and the box changes again — an oscillation that reads as a stutter instead of a
   * follow. Captured on enter, the geometry stays fixed for the whole gesture and the card simply
   * tracks the pointer.
   */
  let hoverRect: DOMRect | null = null

  /**
   * Tolerance for the end of a gesture, in pixels, measured against the box frozen at mouseenter.
   *
   * Small on purpose. The gesture is decided by *geometry against that frozen box*, never by the
   * browser's hit-testing of this element — see `track()` for why that distinction is the whole fix.
   */
  const LEAVE_MARGIN = 4

  /**
   * The gesture is tracked with a window-level `pointermove`, not the element's.
   *
   * The browser hit-tests the *projected* quad of a transformed element, so a tilt (or the hover
   * scale) moves the element's own hit area out from under the pointer. Measured while dragging
   * across a panel: `:hover` goes false two frames in, the angle freezes, the panel settles to its
   * resting transform, and the cycle repeats every few hundred ms — the panel interrupts its own
   * gesture. Tracking on the window with the frozen box as the only reference makes the transform
   * unable to affect its own hit area.
   */
  let trackingPointer = false

  function stopTracking() {
    if (!trackingPointer) return
    window.removeEventListener('pointermove', handleWindowPointerMove)
    document.removeEventListener('pointerleave', stopTracking)
    trackingPointer = false
  }

  /** End the gesture: back to rest, animated by the CSS transition. */
  function settle() {
    stopTracking()
    isHovering.value = false
    hoverRect = null
    rotateX.value = 0
    rotateY.value = 0
  }

  function insideHoverRect(e: MouseEvent): boolean {
    const r = hoverRect
    if (!r) return false
    // Derive the far edges from left/top + size so any box-shaped rect works (a real DOMRect and a
    // test double agree); `right`/`bottom` are undefined on a plain object.
    return (
      e.clientX >= r.left - LEAVE_MARGIN &&
      e.clientX <= r.left + r.width + LEAVE_MARGIN &&
      e.clientY >= r.top - LEAVE_MARGIN &&
      e.clientY <= r.top + r.height + LEAVE_MARGIN
    )
  }

  /**
   * One entry point for every pointer position, whether it arrived on the element or on the window.
   * Writes the angles and the glare coordinates, and ends the gesture when the pointer is outside the
   * frozen box — the only leave test there is.
   */
  function track(clientX: number, clientY: number) {
    const rect = hoverRect
    if (!rect) return
    if (
      clientX < rect.left - LEAVE_MARGIN ||
      clientX > rect.left + rect.width + LEAVE_MARGIN ||
      clientY < rect.top - LEAVE_MARGIN ||
      clientY > rect.top + rect.height + LEAVE_MARGIN
    ) {
      settle()
      return
    }
    const x = (clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const y = (clientY - rect.top - rect.height / 2) / (rect.height / 2)

    // Parallax: depth multiplier amplifies/reduces mouse response
    rotateY.value = x * intensity * depthMultiplier
    rotateX.value = -y * intensity * depthMultiplier

    sheenX.value = `${clientX - rect.left}px`
    sheenY.value = `${clientY - rect.top}px`
  }

  function handleWindowPointerMove(e: PointerEvent) {
    track(e.clientX, e.clientY)
  }

  function handleMouseMove(e: MouseEvent) {
    // The element path may be the first contact (enter without an event, or a box never sampled);
    // the window path must not — it has no element to sample from.
    if (!hoverRect) {
      const el = e.currentTarget as HTMLElement | null
      if (el?.getBoundingClientRect) hoverRect = el.getBoundingClientRect()
    }
    track(e.clientX, e.clientY)
  }

  /** `e` is optional so a caller (or a test) may enter without an event: the first move then samples. */
  function handleMouseEnter(e?: MouseEvent) {
    isHovering.value = true
    // Re-entering while still inside the frozen box must not re-sample it: the box already grew with
    // the tilt, and re-sampling on every stutter is drift that shows up as a wobble.
    const resample = !(hoverRect && e && insideHoverRect(e))
    const el = e?.currentTarget as HTMLElement | undefined
    if (resample) hoverRect = el ? el.getBoundingClientRect() : null
    /**
     * Publish the glare coordinates HERE, not only on the first move.
     *
     * The gradient is centred on `--sheen-x/y`, and their fallback is `50% 50%` — so entering from an
     * edge used to flash a full ball in the middle of the card before the first mousemove moved it to
     * the pointer. The disc has to unfold from where the pointer crossed the border, which at a
     * corner shows about a quarter of a circle.
     */
    if (e && hoverRect) {
      sheenX.value = `${e.clientX - hoverRect.left}px`
      sheenY.value = `${e.clientY - hoverRect.top}px`
    }
    // From here on the gesture lives on the window: it must survive the pointer leaving the
    // *projected* quad, which is what the tilt is about to change.
    if (!trackingPointer) {
      trackingPointer = true
      window.addEventListener('pointermove', handleWindowPointerMove, { passive: true })
      document.addEventListener('pointerleave', stopTracking)
    }
  }

  /**
   * The element's own `mouseleave` is a fast path only: the same geometric test decides, so a leave
   * that the browser reports because *the element moved* (rather than the pointer) changes nothing.
   */
  function handleMouseLeave(e?: MouseEvent) {
    if (!e) {
      settle()
      return
    }
    track(e.clientX, e.clientY)
  }

  /**
   * Combined transform string: base rotation + mouse delta + Z-depth + the hover lift.
   *
   * The `scale` is what makes the panel lift: vanilla-tilt's `update()` writes
   * `scale3d(1.03, 1.03, 1.03)` while hovered and `reset()` puts `scale = 1` back on leave. Without
   * it the panel only rocks in place and never leaves the page plane.
   *
   * 2D `scale()` on purpose, not `scale3d`: it leaves the Z axis alone, so the children's
   * `translateZ` depths are unaffected, and a resting panel still computes to a flat
   * `matrix(1, 0, 0, 1, 0, 0)` (what the e2e asserts).
   */
  const transform = computed(() => {
    if (!tilt) return ''
    const rx = baseRotateX + rotateX.value
    const ry = baseRotateY + rotateY.value
    const rz = baseRotateZ
    const scale = isHovering.value ? 1.03 : 1
    return `translateZ(${translateZ}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`
  })

  // The window listener must not outlive the component (guarded: a plain call has no scope).
  if (getCurrentScope()) onScopeDispose(stopTracking)

  return {
    transform,
    sheenX,
    sheenY,
    isHovering,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
  }
}
