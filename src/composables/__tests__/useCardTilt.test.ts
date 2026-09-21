import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useCardTilt, type UseCardTiltOptions } from '../useCardTilt'

/**
 * The tilt is a mouse-driven transform, so the contract under test is "the transform string
 * actually changes while the pointer is inside and returns to rest when it leaves".
 *
 * It is worth a test because it silently did neither for a long time: `currentRotate*` were plain
 * `let` variables, so the `computed` transform had no reactive dependency and was evaluated once,
 * and `rafId` was never cleared, so only the first animation loop could ever start. Nothing failed —
 * the panels simply never tilted (see the pause note in .plans/ctt-web-development-plan.md).
 */

type Tilt = ReturnType<typeof useCardTilt>

/**
 * The rendered pose is advanced in requestAnimationFrame now, not by a CSS transition, so the tests
 * drive the frames themselves instead of relying on wall-clock time.
 */
let pendingFrames: FrameRequestCallback[] = []
function flushFrames(count = 30): void {
  for (let i = 0; i < count; i++) {
    const batch = pendingFrames
    pendingFrames = []
    for (const cb of batch) cb(i * 16)
  }
}

beforeEach(() => {
  pendingFrames = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => pendingFrames.push(cb))
  vi.stubGlobal('cancelAnimationFrame', () => undefined)
})

function mountTilt(options: UseCardTiltOptions = { smoothness: 1 }) {
  const harness = defineComponent({
    setup() {
      const tilt = useCardTilt(options)
      return { tilt }
    },
    render: () => null,
  })
  const wrapper = mount(harness)
  return { wrapper, tilt: (wrapper.vm as unknown as { tilt: Tilt }).tilt }
}

function moveTo(clientX: number, clientY: number): MouseEvent {
  const target = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 200 }),
  } as unknown as HTMLElement
  return { currentTarget: target, clientX, clientY } as unknown as MouseEvent
}

/** Pull `rotateX(...)` / `rotateY(...)` out of the transform string. */
function angles(transform: string): { x: number; y: number } {
  const x = /rotateX\((-?[\d.]+)deg\)/.exec(transform)
  const y = /rotateY\((-?[\d.]+)deg\)/.exec(transform)
  return { x: Number(x?.[1] ?? NaN), y: Number(y?.[1] ?? NaN) }
}

describe('useCardTilt', () => {
  it('tilts toward the pointer while hovering', () => {
    const { wrapper, tilt } = mountTilt({ intensity: 8, depthMultiplier: 1 })
    expect(angles(tilt.transform.value)).toEqual({ x: 0, y: 0 })

    tilt.handleMouseEnter()
    flushFrames()
    tilt.handleMouseMove(moveTo(320, 60)) // right of centre, above centre
    flushFrames()

    const a = angles(tilt.transform.value)
    expect(a.y).toBeGreaterThan(1) // pointer right of centre → positive Y rotation
    expect(a.x).toBeGreaterThan(1) // pointer above centre → positive X rotation
    wrapper.unmount()
  })

  it('keeps following a pointer the browser no longer reports as hovering', () => {
    // The browser hit-tests the *projected* quad: while dragging across a tilted panel, `:hover` went
    // false after two frames and the angle froze — the gesture interrupted itself and pulsed. The
    // window listener is what keeps the gesture alive; without it the angles stop updating here.
    const target = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 200 }),
    } as unknown as HTMLElement
    const { wrapper, tilt } = mountTilt()

    tilt.handleMouseEnter({ currentTarget: target, clientX: 200, clientY: 100 } as unknown as MouseEvent)
    flushFrames()
    tilt.handleMouseMove({ currentTarget: target, clientX: 300, clientY: 100 } as unknown as MouseEvent)
    flushFrames()
    const afterMove = angles(tilt.transform.value).y

    // No further element events — only what a real browser sends while the pointer keeps moving.
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 340, clientY: 100 }))
    flushFrames()

    expect(angles(tilt.transform.value).y).toBeGreaterThan(afterMove)
    // And leaving the frozen box on the window stream still ends the gesture.
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 600, clientY: 100 }))
    flushFrames()
    expect(tilt.isHovering.value).toBe(false)
    expect(angles(tilt.transform.value)).toEqual({ x: 0, y: 0 })
    wrapper.unmount()
  })

  it('lifts the panel while hovered and drops the scale on leave', () => {
    // The "float" in the reference is its hover `scale3d(1.03, …)`, released back to 1 by `reset()`.
    // Without it the panel only rocks in place.
    const target = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 200 }),
    } as unknown as HTMLElement
    const at = (x: number, y: number) => ({ currentTarget: target, clientX: x, clientY: y }) as unknown as MouseEvent
    const scaleOf = (s: string) => Number(/scale\(([\d.]+)\)/.exec(s)?.[1])
    const { wrapper, tilt } = mountTilt()

    expect(scaleOf(tilt.transform.value)).toBe(1)
    tilt.handleMouseEnter(at(200, 100))
    flushFrames()
    tilt.handleMouseMove(at(320, 60))
    flushFrames()
    expect(scaleOf(tilt.transform.value)).toBeCloseTo(1.03, 3)
    tilt.handleMouseLeave(at(-50, -50)) // outside the frozen box AND its LEAVE_MARGIN: (0,0) is still "inside"
    expect(scaleOf(tilt.transform.value)).toBe(1)
    wrapper.unmount()
  })

  it('centres the glare where the pointer entered, not at 50% 50%', () => {
    // The gradient falls back to the middle, so an entry without publishing coordinates flashed a full
    // ball in the centre of the card before the first move. The disc has to unfold from the entry point.
    const target = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 200 }),
    } as unknown as HTMLElement
    const at = (clientX: number, clientY: number) =>
      ({ currentTarget: target, clientX, clientY }) as unknown as MouseEvent
    const { wrapper, tilt } = mountTilt()

    tilt.handleMouseEnter(at(12, 190)) // entering at the bottom-left corner
    expect(tilt.sheenX.value).toBe('12px')
    expect(tilt.sheenY.value).toBe('190px')
    wrapper.unmount()
  })

  it('keeps tilting when the card edge slides off the pointer, and resets only on a real leave', () => {
    // A tilt moves the card's own edge; CSS then reports `mouseleave` although the pointer never left
    // the gesture. Resetting there is the stutter this guards against.
    const box = { left: 0, top: 0, width: 400, height: 200 }
    const target = { getBoundingClientRect: () => box } as unknown as HTMLElement
    const at = (clientX: number, clientY: number) =>
      ({ currentTarget: target, clientX, clientY }) as unknown as MouseEvent
    const { wrapper, tilt } = mountTilt({ intensity: 8 })

    tilt.handleMouseEnter(at(320, 60))
    flushFrames()
    tilt.handleMouseMove(at(320, 60))
    flushFrames()

    tilt.handleMouseLeave(at(320, 202)) // 2px below the box: inside the 4px tolerance, so not a leave
    expect(angles(tilt.transform.value).y).toBeGreaterThan(1)

    tilt.handleMouseLeave(at(320, 400)) // genuinely away
    expect(angles(tilt.transform.value)).toEqual({ x: 0, y: 0 })
    wrapper.unmount()
  })

  it('keeps the angle stable while the card grows under the pointer (no self-feedback)', () => {
    // The projection grows as the card tilts (measured 448 → 453 px in the browser). Reading the
    // *transformed* box on every move fed that growth back into the maths and produced a jittering
    // wobble. The angle for one fixed pointer position must not depend on how big the card has become.
    let width = 400
    const target = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width, height: 200 }),
    } as unknown as HTMLElement
    const { wrapper, tilt } = mountTilt({ intensity: 8 })
    const at = (clientX: number) => ({ currentTarget: target, clientX, clientY: 100 }) as unknown as MouseEvent

    tilt.handleMouseEnter(at(300))
    flushFrames()
    tilt.handleMouseMove(at(300))
    flushFrames()
    const before = angles(tilt.transform.value)

    width = 420 // the tilt has grown the box, as the browser does
    tilt.handleMouseMove(at(300))
    flushFrames()
    const after = angles(tilt.transform.value)

    // Tolerance is 0.05° on purpose: the lerp may still be converging towards an unchanged target,
    // while the old code moved the target itself by ~0.6° (x went 0.5 → 0.43 as the box grew).
    expect(after.y).toBeCloseTo(before.y, 1)
    expect(after.x).toBeCloseTo(before.x, 1)
    wrapper.unmount()
  })

  it('returns to rest after the pointer leaves, and tilts again on the next entry', () => {
    const { wrapper, tilt } = mountTilt({ intensity: 8 })
    tilt.handleMouseEnter()
    flushFrames()
    tilt.handleMouseMove(moveTo(320, 60))
    flushFrames()

    tilt.handleMouseLeave()
    flushFrames()
    expect(angles(tilt.transform.value)).toEqual({ x: 0, y: 0 })

    // A second pass: the animation loop has to be restartable (rafId must be released).
    tilt.handleMouseEnter()
    flushFrames()
    tilt.handleMouseMove(moveTo(80, 160))
    flushFrames()
    const a = angles(tilt.transform.value)
    expect(a.y).toBeLessThan(-1)
    expect(a.x).toBeLessThan(-1)
    wrapper.unmount()
  })
})
