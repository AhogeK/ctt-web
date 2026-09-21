import { ref, computed, getCurrentScope, onScopeDispose } from 'vue'

/**
 * Scene-level underglow sync.
 *
 * One emitter serves all three cards, so a card's light is occluded by whichever card is in front of
 * it — the blocking that a card's own `::after` could never express, because `A < B` and `B < A`
 * cannot both hold and the card's inline `transform` pins the pseudo-element inside its own stacking
 * context.
 *
 * The box is anchored to the exciter card; only the bright core follows the pointer. Geometry is
 * written once per hover, the core once per pointer frame, and both go straight to CSS custom
 * properties so neither costs a Vue re-render or a gradient rebuild.
 */

/** The scene element, bound by `AuthLayout.vue`. */
const underglowSceneEl: { value: HTMLElement | null } = { value: null }

/**
 * Margin the emitter's box carries beyond the card on every side. It must exceed the light's own
 * reach (110px radius with its last stop at 80% = 88px, plus the 24px blur) so the energy reaches
 * zero before the box's edge — a box that ends mid-falloff reads as an invisible wall.
 */
export const UNDERGLOW_BOX_MARGIN = 136

function scene(): HTMLElement | null {
  return underglowSceneEl.value ?? (document.querySelector('.auth-3d-scene') as HTMLElement | null)
}

/**
 * Anchors the emitter to the card and shows the layer. Called once when the hover starts: the box
 * must not move with the pointer, only when the pointer changes cards.
 */
function anchorUnderglow(cardEl: HTMLElement | null): void {
  const sceneEl = scene()
  if (!sceneEl || !cardEl) return
  const sceneRect = sceneEl.getBoundingClientRect()
  const cardRect = cardEl.getBoundingClientRect()
  const layer = sceneEl.querySelector('.auth-underglow') as HTMLElement | null
  if (!layer) return

  sceneEl.style.setProperty('--ug-card-x', `${cardRect.left - sceneRect.left}px`)
  sceneEl.style.setProperty('--ug-card-y', `${cardRect.top - sceneRect.top}px`)
  sceneEl.style.setProperty('--ug-card-w', `${cardRect.width}px`)
  sceneEl.style.setProperty('--ug-card-h', `${cardRect.height}px`)
  layer.classList.add('is-active')
}

/**
 * Moves the bright core. Deliberately unclamped: braking at the card's edge reads as a mechanical
 * stop, and the blur plus the downward bleed already soften an overhanging core.
 */
function publishUnderglowCore(localX: number, localY: number): void {
  const sceneEl = scene()
  if (!sceneEl) return
  sceneEl.style.setProperty('--ug-spot-x', `${localX}px`)
  sceneEl.style.setProperty('--ug-spot-y', `${localY}px`)
}

function dismissUnderglow(): void {
  const sceneEl = scene()
  sceneEl?.querySelector('.auth-underglow')?.classList.remove('is-active')
}

export interface UseCardTiltOptions {
  /**
   * Whether the card itself moves (rotation + the hover lift).
   *
   * `false` keeps the glare tracking the pointer but writes no transform at all, so the panel stays
   * exactly where the layout put it. An identity transform would still open a stacking context, so
   * the transform is omitted rather than zeroed.
   */
  tilt?: boolean
  /**
   * Per-frame smoothing for the rendered pose, 0..1 — 1 tracks the pointer exactly.
   *
   * The tween is advanced in `requestAnimationFrame`, never by a CSS transition: a transition on
   * `transform` is restarted by every pointermove, and each restart begins from the current value with
   * zero velocity, so the card never leaves the flat start of the curve. That reads as a rubber-band
   * trail plus micro-stutter whenever event spacing jitters. An rAF integrator shares the compositor's
   * clock, so a lower value only adds a deliberate, constant weight instead of a moving target.
   */
  smoothness?: number
  /** Hover lift, reached through the same integrator as the angles (default 1.03). */
  maxScale?: number
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
    smoothness = 0.2,
    maxScale = 1.03,
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
  // Written by pointer events, approached per frame by the rAF integrator below.
  let targetRotateX = 0
  let targetRotateY = 0
  let targetScale = 1
  // Rendered values: scale is integrated alongside the angles so it cannot step in a single frame.
  const currentScale = ref(1)
  /** Largest angle change the integrator may apply in one frame. Caps the entry impulse (the pointer always
   *  crosses the border at an edge, so the raw target starts at full deflection), and never binds during
   *  normal tracking: a hand moving across the panel rarely asks for more than ~0.4°/frame. */
  const MAX_ROTATION_STEP = 0.65
  /** Scale advance per frame, matched to the angle ramp so the two read as one rigid body. */
  const SCALE_STEP = 0.0035
  let rafId: number | null = null

  /** One integrator per frame; shares the compositor clock, so it cannot fight a transition. */
  function tickPhysics() {
    if (!isHovering.value) {
      rafId = null
      return
    }
    const stepX = Math.min(
      MAX_ROTATION_STEP,
      Math.max(-MAX_ROTATION_STEP, (targetRotateX - rotateX.value) * smoothness),
    )
    const stepY = Math.min(
      MAX_ROTATION_STEP,
      Math.max(-MAX_ROTATION_STEP, (targetRotateY - rotateY.value) * smoothness),
    )
    rotateX.value += stepX
    rotateY.value += stepY
    // One clock for both dimensions: the lift advances at a fixed rate instead of an independent LERP.
    if (currentScale.value < targetScale) currentScale.value = Math.min(targetScale, currentScale.value + SCALE_STEP)
    rafId = requestAnimationFrame(tickPhysics)
  }

  function startPhysics() {
    if (rafId === null) rafId = requestAnimationFrame(tickPhysics)
  }

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
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  /** End the gesture: back to rest, animated by the CSS transition. */
  function settle() {
    dismissUnderglow()
    stopTracking()
    isHovering.value = false
    hoverRect = null
    targetRotateX = 0
    targetRotateY = 0
    targetScale = 1
    // Zeroing here hands the return trip to the base rule's CSS transition (0.6s).
    rotateX.value = 0
    rotateY.value = 0
    currentScale.value = 1
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
    /* Isotropic reference radius. Normalising each axis by its own half-extent made the vertical
       axis of a flat card hypersensitive: the terminal is 448 x 170, so a 10px vertical move covers
       11.8% of the angle range against 4.5% horizontally (2.64x), and the two axes saturate at
       different rates on the way to a corner. Both axes now share the diagonal, so equal pointer
       travel in any direction yields the same angular increment and any aspect ratio puts its
       corner at the same normalised radius (2/2.4 = 1.2). */
    const referenceRadius = Math.hypot(rect.width, rect.height) / 2.4
    const nx = (clientX - rect.left - rect.width / 2) / referenceRadius
    const ny = (clientY - rect.top - rect.height / 2) / referenceRadius

    /* Clamp to the unit disk so a corner cannot ask for a composite tilt larger than an edge. There
       is deliberately no sine softening here: `sin(d * pi/2) / d` amplifies mid radii by 1.41x at
       d = 0.5 instead of softening them, and the temporal smoothing the eye actually reads comes
       from MAX_ROTATION_STEP in the integrator. */
    const distance = Math.hypot(nx, ny)
    const clampedX = distance > 1 ? nx / distance : nx
    const clampedY = distance > 1 ? ny / distance : ny

    publishUnderglowCore(clientX - rect.left, clientY - rect.top)

    // Parallax: depth multiplier amplifies/reduces mouse response
    targetRotateY = clampedX * intensity * depthMultiplier
    targetRotateX = -clampedY * intensity * depthMultiplier
    targetScale = maxScale

    // The glare stays event-driven on purpose: the light should sit exactly under the pointer even
    // while the card is still easing towards its pose. The lift scales the card about its centre, so a
    // local coordinate renders at `centre + (local - centre) * scale`; dividing by the current scale
    // cancels that drift (~7-9px at scale 1.03) and keeps the disc under the cursor.
    const scale = currentScale.value || 1

    sheenX.value = `${(clientX - rect.left - rect.width / 2) / scale + rect.width / 2}px`
    sheenY.value = `${(clientY - rect.top - rect.height / 2) / scale + rect.height / 2}px`

    startPhysics()
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
    // Start strictly at 1.00; the entry impulse is handled by MAX_ROTATION_STEP, not by an envelope.
    currentScale.value = 1
    targetScale = maxScale
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
      anchorUnderglow(el ?? null)
      const s = currentScale.value || 1
      sheenX.value = `${(e.clientX - hoverRect.left - hoverRect.width / 2) / s + hoverRect.width / 2}px`
      sheenY.value = `${(e.clientY - hoverRect.top - hoverRect.height / 2) / s + hoverRect.height / 2}px`
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
    // Perspective inlined so the vanishing point is this card's own centre; the ancestor used to supply
    // `perspective: 1000px` with `perspective-origin: 50% 30%`, which tilted every card off-axis.
    return `perspective(1200px) translateZ(${translateZ}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${currentScale.value})`
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
