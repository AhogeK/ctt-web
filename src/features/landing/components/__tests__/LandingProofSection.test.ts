import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/vue'
import LandingProofSection from '../LandingProofSection.vue'

/**
 * The proof band's contract is the stage's own acceptance criteria, not its markup:
 * two fragments under the hero, each one real component plus one line of explanation,
 * each labelled as example data. Those are the parts a future edit could silently drop
 * (the caption is the first thing to go when someone tidies a layout), so they are what
 * this file asserts.
 */
describe('LandingProofSection', () => {
  it('renders both fragments, each with a caption and an example-data label', () => {
    render(LandingProofSection)

    expect(screen.getByTestId('landing-proof-summary')).toBeInTheDocument()
    expect(screen.getByTestId('landing-proof-trophies')).toBeInTheDocument()

    const captions = [
      screen.getByTestId('landing-proof-summary-caption'),
      screen.getByTestId('landing-proof-trophies-caption'),
    ]
    for (const caption of captions) expect(caption.textContent?.trim()).not.toBe('')

    // One label per fragment: a visitor must never be able to read either fragment as real data.
    expect(screen.getAllByText('Example data')).toHaveLength(2)
  })

  it('renders all six summary fields — the hero deliberately shows three', () => {
    render(LandingProofSection)

    expect(screen.getAllByTestId('summary-value')).toHaveLength(6)
  })

  it('renders the trophy ladders through the achievements card', () => {
    render(LandingProofSection)

    const cards = screen.getAllByTestId('trophy-card')
    expect(cards).toHaveLength(3)
    // A card without a ladder shape would mean the example data stopped going through
    // `buildTrophies`, which is the only thing keeping these numbers honest.
    const ladderLabel = cards[0]?.querySelector('[role="img"]')?.getAttribute('aria-label') ?? ''
    expect(ladderLabel).toMatch(/\d+ of \d+ tiers earned/)
  })
})
