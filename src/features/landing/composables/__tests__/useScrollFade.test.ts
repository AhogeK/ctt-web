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

const HeroHost = defineComponent({
  setup() {
    const el = ref<HTMLElement | null>(null)
    useScrollFade(el, { leaveSvh: 140 })
    return () => h('div', { ref: el, 'data-scroll-fade': 'in', 'data-testid': 'hero' })
  },
})

/** jsdom's default innerHeight is 768, so 200svh = 1536px and 400svh = 3072px. */
function setScroll(value: number) {
  Object.defineProperty(window, 'scrollY', { value, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

describe('useScrollFade', () => {
  afterEach(() => {
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

  it('stops listening after unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const view = render(Host)
    view.unmount()
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
    remove.mockRestore()
  })
})
