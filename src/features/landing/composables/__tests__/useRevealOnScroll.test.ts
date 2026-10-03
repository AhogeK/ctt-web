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

  it('disconnects when the host unmounts', () => {
    const view = render(Host)
    const observer = FakeObserver.instances[0]!
    view.unmount()
    expect(observer.disconnected).toBe(true)
  })
})
