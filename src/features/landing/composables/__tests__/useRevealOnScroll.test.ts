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

  it('leaves a piece that scrolled past as "above" and one still below as "below"', () => {
    const view = render(Host)
    const observer = FakeObserver.instances[0]!
    observer.fire([
      { target: view.getByTestId('a'), isIntersecting: false, top: -50 },
      { target: view.getByTestId('b'), isIntersecting: false, top: 900 },
    ])
    expect(view.getByTestId('a').getAttribute('data-reveal-state')).toBe('above')
    expect(view.getByTestId('b').getAttribute('data-reveal-state')).toBe('below')
  })

  it('holds a piece back while the scroll is fast, then reveals it once the scroll settles', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    try {
      const view = render(Host)
      const observer = FakeObserver.instances[0]!
      // jsdom rects are all zeros, which the flush reads as "not properly on screen yet"; stand in for a
      // piece sitting in the middle of the viewport.
      const piece = view.getByTestId('a')
      piece.getBoundingClientRect = () => ({ top: 100, bottom: 300 }) as DOMRect
      // Two events 16ms apart carrying 200px read as ~12500px/s, so the entry goes into the pending set
      // instead of fading mid-flight.
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(16)
      Object.defineProperty(window, 'scrollY', { value: 200, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      observer.fire([{ target: piece, isIntersecting: true, top: 100 }])
      expect(piece.getAttribute('data-reveal-state')).toBeNull()
      // The settle window (140ms) passes with no further scroll events: the held piece is revealed.
      vi.advanceTimersByTime(200)
      expect(piece.getAttribute('data-reveal-state')).toBe('in')
    } finally {
      vi.useRealTimers()
    }
  })

  it('drops a held piece that leaves before the scroll settles', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    try {
      const view = render(Host)
      const observer = FakeObserver.instances[0]!
      const piece = view.getByTestId('a')
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(16)
      Object.defineProperty(window, 'scrollY', { value: 200, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      observer.fire([{ target: piece, isIntersecting: true, top: 100 }])
      observer.fire([{ target: piece, isIntersecting: false, top: -50 }])
      vi.advanceTimersByTime(200)
      // A band flown past must not flash back into view on the settle.
      expect(piece.getAttribute('data-reveal-state')).toBe('above')
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
