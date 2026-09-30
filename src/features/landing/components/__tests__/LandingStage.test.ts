import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/vue'
import { createPinia } from 'pinia'
import LandingView from '../../views/LandingView.vue'

/** The beats render the dashboard's own components, and one of them reads the theme store. */
const mountOptions = { global: { plugins: [createPinia()] } }

/**
 * The stage contract, which is the user's own description of it: the hero is the first beat, and the
 * beat after it arrives **into the same centre** rather than being a band below it. jsdom has no scroll
 * timeline, so what is asserted here is structure and content — the beat exists, it carries its own
 * heading, its own line of explanation and its own example-data label, and the artefacts really are the
 * product's. The parked-at-centre geometry is measured in the browser probe instead, because it cannot
 * exist without a scroll timeline.
 *
 * One arriving beat, not two: the year grid and the ladders answer the same question ("what have I
 * built up"), so they share a stage screen. That is a user decision, not a layout accident.
 */
describe('LandingView stage', () => {
  it('renders the hero beat and one arriving beat', () => {
    render(LandingView, mountOptions)

    expect(screen.getByTestId('landing-beat-hero')).toBeInTheDocument()
    expect(screen.getByTestId('landing-beat-activity')).toBeInTheDocument()
    expect(screen.queryByTestId('landing-beat-trophies')).not.toBeInTheDocument()
  })

  it('gives the arriving beat a heading, a caption and an example-data label', () => {
    render(LandingView, mountOptions)

    const beat = screen.getByTestId('landing-beat-activity')
    expect(beat.querySelector('h2')?.textContent?.trim()).not.toBe('')
    const caption = beat.querySelector('p')
    expect(caption?.textContent?.trim().length ?? 0).toBeGreaterThan(20)
    expect(beat.textContent).toContain('Example data')
  })

  it('keeps the year and the ladders in that one beat', () => {
    render(LandingView, mountOptions)

    const beat = screen.getByTestId('landing-beat-activity')
    expect(beat.querySelectorAll('[data-date]')).toHaveLength(364)
    expect(beat.querySelectorAll('[data-testid="trophy-card"]')).toHaveLength(3)
  })
})
