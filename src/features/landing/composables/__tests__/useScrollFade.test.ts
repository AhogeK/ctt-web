import { render } from '@testing-library/vue'
import { defineComponent, h, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useScrollFade } from '../useScrollFade'

const Host = defineComponent({
  setup() {
    const el = ref<HTMLElement | null>(null)
    useScrollFade(el, { enterSvh: 200, leaveSvh: 400 })
    return () => h('div', { ref: el, 'data-scroll-fade': 'out', 'data-testid': 'target' })
  },
})

/**
 * The hand-off band: its entrance is read off the live box of the band it is anchored to, and it
 * writes the hand-off fact and the side it came from onto itself.
 */
const BandHost = defineComponent({
  setup() {
    const target = ref<HTMLElement | null>(null)
    const band = ref<HTMLElement | null>(null)
    useScrollFade(target, { enterOnBand: band })
    return () =>
      h('div', [
        h('div', { ref: target, 'data-scroll-fade': 'out', 'data-testid': 'target' }),
        h('div', { ref: band, 'data-testid': 'band' }),
      ])
  },
})

const HeroHost = defineComponent({
  setup() {
    const el = ref<HTMLElement | null>(null)
    useScrollFade(el, { leaveSvh: 140 })
    return () => h('div', { ref: el, 'data-scroll-fade': 'in', 'data-testid': 'hero' })
  },
})

/**
 * The boxes the composable reads live positions from, in document coordinates: an element scrolls
 * up the viewport as the page scrolls, so the mock subtracts the scroll position. jsdom reports
 * zeros for every element, which would put a band line at the top of the viewport and latch the
 * hand-off on mount.
 */
const boxes: Record<string, { top: number; bottom: number }> = {}

/** jsdom's default innerHeight is 768, so 200svh = 1536px and 400svh = 3072px. */
function setScroll(value: number) {
  Object.defineProperty(window, 'scrollY', { value, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

describe('useScrollFade', () => {
  beforeEach(() => {
    boxes.target = { top: 0, bottom: 0 }
    boxes.band = { top: 0, bottom: 0 }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const box = boxes[this.getAttribute('data-testid') ?? ''] ?? { top: 0, bottom: 0 }
      const scroll = window.scrollY
      return { top: box.top - scroll, bottom: box.bottom - scroll } as DOMRect
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })
  })

  it('flips out → in → leaving as the scroll passes each threshold, and back', () => {
    const view = render(Host)
    const state = () => view.getByTestId('target').getAttribute('data-scroll-fade')

    setScroll(1500)
    expect(state()).toBe('out')

    setScroll(1600)
    expect(state()).toBe('in')

    setScroll(3000)
    expect(state()).toBe('in')

    setScroll(3200)
    expect(state()).toBe('leaving')

    setScroll(2000)
    expect(state()).toBe('in')

    setScroll(400)
    expect(state()).toBe('out')
  })

  it('a screen without an enter threshold starts visible and only leaves', () => {
    const view = render(HeroHost)
    const state = () => view.getByTestId('hero').getAttribute('data-scroll-fade')

    setScroll(1000)
    expect(state()).toBe('in')

    setScroll(1200)
    expect(state()).toBe('leaving')

    setScroll(500)
    expect(state()).toBe('in')
  })

  it('applies the state on mount, so a restored scroll position is honoured', () => {
    Object.defineProperty(window, 'scrollY', { value: 2000, configurable: true })
    const view = render(Host)
    expect(view.getByTestId('target').getAttribute('data-scroll-fade')).toBe('in')
  })

  it('re-applies its thresholds when the viewport height changes without a scroll', () => {
    Object.defineProperty(window, 'scrollY', { value: 1000, configurable: true })
    const view = render(Host)
    const state = () => view.getByTestId('target').getAttribute('data-scroll-fade')
    // 200svh is 1536px at the 768px default, so this scroll sits below the enter threshold.
    expect(state()).toBe('out')

    // At 400px tall the same threshold is 800px: the position is unchanged, the viewport is not.
    Object.defineProperty(window, 'innerHeight', { value: 400, configurable: true })
    window.dispatchEvent(new Event('resize'))
    expect(state()).toBe('in')
  })

  it('keeps the hand-off once it has happened, and records it on the band', () => {
    // The band line is read off the live box: at 500px from the top of the viewport and a 768px
    // tall window, the 60% line sits at scroll 39. The boxes are set before the mount, because the
    // composable reads them as it starts.
    boxes.band = { top: 500, bottom: 900 }
    boxes.target = { top: 100, bottom: 500 }
    const view = render(BandHost)
    const target = view.getByTestId('target')

    setScroll(0)
    expect(target.getAttribute('data-handoff')).toBe('out')
    expect(target.getAttribute('data-scroll-fade')).toBe('out')

    setScroll(200)
    expect(target.getAttribute('data-handoff')).toBe('in')
    expect(target.getAttribute('data-scroll-fade')).toBe('in')

    // Scrolling back above the line does not take the hand-off back: it is a one-off fact, and the
    // band below waits for it.
    setScroll(0)
    expect(target.getAttribute('data-handoff')).toBe('in')
  })

  it('records the side the band came from, so its entrance follows that side', () => {
    boxes.band = { top: 500, bottom: 900 }
    const view = render(BandHost)
    const target = view.getByTestId('target')

    // The band is below the fold, so it arrives from below.
    boxes.target = { top: 900, bottom: 1300 }
    setScroll(0)
    expect(target.getAttribute('data-fade-from')).toBe('below')

    // The band is above the viewport, so it arrives from above.
    boxes.target = { top: -400, bottom: -100 }
    setScroll(0)
    expect(target.getAttribute('data-fade-from')).toBe('above')
  })

  it('stops listening after unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const view = render(Host)
    view.unmount()
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
    remove.mockRestore()
  })
})
