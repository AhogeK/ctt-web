import { render, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import RunOptions from '../RunOptions.vue'
import { buildRunOptions, type RunOption } from '../run-options'
import en from '@/i18n/locales/en'

/** Resolve a dotted key against the English catalogue, so the assertions run on shipped copy. */
const translate = (key: string): string =>
  key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], en) as string

describe('landing run options', () => {
  it('ships both ways to run it, with the hosted entry deliberately status-only and unstartable', () => {
    expect(buildRunOptions(translate).map((option) => option.id)).toEqual(['self-host', 'hosted'])
    const hosted = buildRunOptions(translate).find((option) => option.id === 'hosted')
    expect(hosted?.cost.kind).toBe('status')
    expect(hosted?.cta).toBeUndefined()
  })

  it('puts no figure anywhere in the shipped entries — free is the only cost the page states', () => {
    const { container } = render(RunOptions, { props: { options: buildRunOptions(translate) } })
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
    render(RunOptions, { props: { options: buildRunOptions(translate) } })
    const hosted = screen.getByTestId('run-option-hosted')
    expect(within(hosted).queryByRole('link')).not.toBeInTheDocument()
    expect(within(hosted).queryByRole('button')).not.toBeInTheDocument()
  })
})
