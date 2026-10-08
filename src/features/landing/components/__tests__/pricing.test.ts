import { render, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PricingTable from '../PricingTable.vue'
import { PRICING_PLANS, type PricingPlan } from '../pricing-plans'

describe('landing pricing', () => {
  it('ships the two ways to run it, with the hosted entry deliberately unpriced and unstartable', () => {
    expect(PRICING_PLANS.map((plan) => plan.id)).toEqual(['self-host', 'hosted'])
    const hosted = PRICING_PLANS.find((plan) => plan.id === 'hosted')
    expect(hosted?.price.kind).toBe('in-design')
    expect(hosted?.cta).toBeUndefined()
  })

  it('puts no figure anywhere in the shipped entries — the page cannot show a price before one is set', () => {
    const { container } = render(PricingTable, { props: { plans: PRICING_PLANS } })
    expect(container.textContent ?? '').not.toMatch(/[\d$€£]/)
  })

  it('renders whatever the data says — names, labels and features all come from the prop', () => {
    const plans: readonly PricingPlan[] = [
      {
        id: 'probe',
        name: 'Probe plan',
        tagline: 'A stand-in used by this test.',
        price: { kind: 'in-design', label: 'On the way' },
        features: ['A probe feature'],
      },
    ]
    render(PricingTable, { props: { plans } })
    expect(screen.getByText('Probe plan')).toBeInTheDocument()
    expect(screen.getByText('On the way')).toBeInTheDocument()
    expect(screen.getByText('A probe feature')).toBeInTheDocument()
  })

  it('shows a real figure when the data carries one', () => {
    const plans: readonly PricingPlan[] = [
      {
        id: 'paid',
        name: 'Paid plan',
        tagline: 'A stand-in used by this test.',
        price: { kind: 'free', label: 'On the house' },
        features: ['A probe feature'],
      },
    ]
    render(PricingTable, { props: { plans } })
    expect(screen.getByTestId('pricing-price')).toHaveTextContent('On the house')
  })

  it('grows no purchase control on an entry that cannot be started', () => {
    render(PricingTable, { props: { plans: PRICING_PLANS } })
    const hosted = screen.getByTestId('pricing-plan-hosted')
    expect(within(hosted).queryByRole('link')).not.toBeInTheDocument()
    expect(within(hosted).queryByRole('button')).not.toBeInTheDocument()
  })
})
