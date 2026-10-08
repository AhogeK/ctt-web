import { render, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import RunOptions from '../RunOptions.vue'
import { RUN_OPTIONS, type RunOption } from '../run-options'

describe('landing run options', () => {
  it('ships both ways to run it, with the hosted entry deliberately status-only and unstartable', () => {
    expect(RUN_OPTIONS.map((option) => option.id)).toEqual(['self-host', 'hosted'])
    const hosted = RUN_OPTIONS.find((option) => option.id === 'hosted')
    expect(hosted?.cost.kind).toBe('status')
    expect(hosted?.cta).toBeUndefined()
  })

  it('puts no figure anywhere in the shipped entries — free is the only cost the page states', () => {
    const { container } = render(RunOptions, { props: { options: RUN_OPTIONS } })
    expect(container.textContent ?? '').not.toMatch(/[\d$€£]/)
  })

  it('renders whatever the data says — names, labels and features all come from the prop', () => {
    const options: readonly RunOption[] = [
      {
        id: 'probe',
        name: 'Probe option',
        tagline: 'A stand-in used by this test.',
        cost: { kind: 'status', label: 'On the way' },
        features: ['A probe feature'],
      },
    ]
    render(RunOptions, { props: { options } })
    expect(screen.getByText('Probe option')).toBeInTheDocument()
    expect(screen.getByText('On the way')).toBeInTheDocument()
    expect(screen.getByText('A probe feature')).toBeInTheDocument()
  })

  it('labels a free entry where a figure would sit', () => {
    const options: readonly RunOption[] = [
      {
        id: 'freebie',
        name: 'Free probe',
        tagline: 'A stand-in used by this test.',
        cost: { kind: 'free', label: 'On the house' },
        features: ['A probe feature'],
      },
    ]
    render(RunOptions, { props: { options } })
    expect(screen.getByTestId('run-option-cost')).toHaveTextContent('On the house')
  })

  it('grows no purchase control on an entry that cannot be started', () => {
    render(RunOptions, { props: { options: RUN_OPTIONS } })
    const hosted = screen.getByTestId('run-option-hosted')
    expect(within(hosted).queryByRole('link')).not.toBeInTheDocument()
    expect(within(hosted).queryByRole('button')).not.toBeInTheDocument()
  })
})
