import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/vue'
import LandingSection from '../LandingSection.vue'

// Queries are read off the render result rather than destructured: a destructured
// Testing Library query is an unbound method reference, which the lint rules reject.
describe('LandingSection', () => {
  it('renders its content', () => {
    const view = render(LandingSection, { slots: { default: 'A capability list' } })
    expect(view.getByText('A capability list')).toBeInTheDocument()
  })

  it('defaults to a semantic section wrapping the 1200px marketing container', () => {
    const view = render(LandingSection, { slots: { default: 'x' } })
    const root = view.container.firstElementChild as HTMLElement
    expect(root.tagName.toLowerCase()).toBe('section')
    expect(root.querySelector('div')?.className).toContain('max-w-[1200px]')
  })

  it('lets a band change its element, measure and rhythm', () => {
    const view = render(LandingSection, {
      props: { as: 'footer', width: 'prose', spacing: 'sm' },
      slots: { default: 'x' },
    })
    const root = view.container.firstElementChild as HTMLElement
    expect(root.tagName.toLowerCase()).toBe('footer')
    expect(root.className).toContain('py-8')
    expect(root.querySelector('div')?.className).toContain('max-w-[730px]')
  })

  it('drops the vertical rhythm when a nested band owns its own padding', () => {
    const view = render(LandingSection, { props: { spacing: 'none' }, slots: { default: 'x' } })
    const root = view.container.firstElementChild as HTMLElement
    expect(root.className).not.toMatch(/py-\d/)
  })
})
