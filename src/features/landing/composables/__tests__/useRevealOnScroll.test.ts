import { render } from '@testing-library/vue'
import { defineComponent, h, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRevealOnScroll } from '../useRevealOnScroll'

/** Minimal IntersectionObserver stand-in: records observers so a test can drive their callbacks. */
class FakeObserver {
  static instances: FakeObserver[] = []

  observed: Element[] = []
  disconnected = false

  constructor(private callback: IntersectionObserverCallback) {
    FakeObserver.instances.push(this)
  }

  observe(el: Element): void {
    this.observed.push(el)
  }

  unobserve(): void {}

  disconnect(): void {
    this.disconnected = true
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  fire(entries: { target: Element; isIntersecting: boolean; top: number }[]): void {
    this.callback(
      entries.map(
        (entry) =>
          ({
            target: entry.target,
            isIntersecting: entry.isIntersecting,
            boundingClientRect: { top: entry.top } as DOMRectReadOnly,
          }) as unknown as IntersectionObserverEntry,
      ),
      this as unknown as IntersectionObserver,
    )
  }
}

const Host = defineComponent({
  setup() {
    const root = ref<HTMLElement | null>(null)
    useRevealOnScroll(root, ['[data-piece]'])
    return () =>
      h('div', { ref: root }, [
        h('div', { 'data-piece': 'a', 'data-testid': 'a' }),
        h('div', { 'data-piece': 'b', 'data-testid': 'b' }),
      ])
  },
})

/**
 * The hand-off pair: the band the stage hands over to, and the band right below it, which waits for
 * that hand-off and for nothing else. The plain host above carries no band attributes, so it can
 * never reach the waiting path.
 */
const BandHost = defineComponent({
  setup() {
    const root = ref<HTMLElement | null>(null)
    useRevealOnScroll(root, ['[data-reveal-band]'])
    return () =>
      h('div', { ref: root }, [
        h('div', { 'data-reveal-band': '', 'data-band-anchor': '', 'data-testid': 'anchor' }),
        h('div', { 'data-reveal-band': '', 'data-testid': 'after' }),
      ])
  },
})

describe('useRevealOnScroll', () => {
  beforeEach(() => {
    FakeObserver.instances = []
    vi.stubGlobal('IntersectionObserver', FakeObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('observes every matching piece inside the root', () => {
    const view = render(Host)
    const observer = FakeObserver.instances[0]!
    expect(observer.observed).toEqual([view.getByTestId('a'), view.getByTestId('b')])
  })

  it('ignores matching pieces outside the root', () => {
    const outside = document.createElement('div')
    outside.setAttribute('data-piece', 'outside')
    document.body.appendChild(outside)
    try {
      const view = render(Host)
      const observer = FakeObserver.instances[0]!
      expect(observer.observed).toEqual([view.getByTestId('a'), view.getByTestId('b')])
      expect(observer.observed).not.toContain(outside)
    } finally {
      outside.remove()
    }
  })

  it('marks a piece in view as "in"', () => {
    const view = render(Host)
    const observer = FakeObserver.instances[0]!
    observer.fire([{ target: view.getByTestId('a'), isIntersecting: true, top: 100 }])
    expect(view.getByTestId('a').getAttribute('data-reveal-state')).toBe('in')
  })

  it('shows a piece that was scrolled past without ever appearing, and leaves one still below waiting', () => {
    const view = render(Host)
    const observer = FakeObserver.instances[0]!
    observer.fire([
      { target: view.getByTestId('a'), isIntersecting: false, top: -50 },
      { target: view.getByTestId('b'), isIntersecting: false, top: 900 },
    ])
    // A piece that was carried past the viewport before it ever appeared has nothing to fade out
    // of, so it is shown. Marking it `above` would hide it for the rest of the visit, while the
    // pieces below it show normally — the page reads as if the skipped one came after them.
    expect(view.getByTestId('a').getAttribute('data-reveal-state')).toBe('in')
    // A piece still below the fold has not been passed: it keeps waiting.
    expect(view.getByTestId('b').getAttribute('data-reveal-state')).toBe('below')
  })

  it('lets a piece that has been shown fade out when it leaves, instead of flashing back', () => {
    const view = render(Host)
    const observer = FakeObserver.instances[0]!
    const piece = view.getByTestId('a')
    // The piece is shown first, so it has something to fade out of.
    observer.fire([{ target: piece, isIntersecting: true, top: 100 }])
    expect(piece.getAttribute('data-reveal-state')).toBe('in')

    observer.fire([{ target: piece, isIntersecting: false, top: -50 }])

    // A piece that has been seen and then leaves fades out upward, and does not flash back.
    expect(piece.getAttribute('data-reveal-state')).toBe('above')
  })

  it('holds the band below the hand-off back, and lets it go once the hand-off has happened', async () => {
    // The band below the hand-off band may not appear before the hand-off line is crossed, so it
    // waits. The wait has to end: a band that waits without being let go stays out of sight for the
    // rest of the visit, which is a section of the page that simply never appears.
    vi.useFakeTimers({ toFake: ['requestAnimationFrame'] })
    try {
      const view = render(BandHost)
      const observer = FakeObserver.instances[0]!
      const after = view.getByTestId('after')
      observer.fire([{ target: after, isIntersecting: true, top: 100 }])
      await vi.advanceTimersByTimeAsync(16)
      // The hand-off has not happened yet, so the band below waits.
      expect(after.getAttribute('data-reveal-state')).toBe('below')
      // The stage hands over: the anchor band records the fact on itself.
      view.getByTestId('anchor').setAttribute('data-handoff', 'in')
      await vi.advanceTimersByTimeAsync(16)
      // The waiting band is let go.
      expect(after.getAttribute('data-reveal-state')).toBe('in')
    } finally {
      vi.useRealTimers()
    }
  })

  it('disconnects when the host unmounts', () => {
    const view = render(Host)
    const observer = FakeObserver.instances[0]!
    view.unmount()
    expect(observer.disconnected).toBe(true)
  })
})
