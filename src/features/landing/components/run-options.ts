/**
 * The landing page's ways to run the system — data only.
 *
 * Every part of the product is free and open source, so neither entry carries a price: running
 * the whole system yourself is free, and the hosted entry states its status where a figure would
 * sit instead of inventing one. A change of wording is a data edit here; no component changes.
 *
 * A standing rule for this section: nothing here is ever for sale. The hosted entry must never be
 * replaced by a "contact sales" prompt; until it opens it shows its status instead of a button, and
 * once it runs it stays free with best-effort availability rather than an uptime promise.
 */

/** How an entry presents its cost — a deliberate state, never a placeholder figure. */
export type RunOptionCost = { kind: 'free'; label: string } | { kind: 'status'; label: string }

export interface RunOption {
  /** Stable key for rendering and tests. */
  id: string
  name: string
  /** One line stating what the entry actually is. */
  tagline: string
  cost: RunOptionCost
  /** What it includes; each line checkable against the repositories or an explicit promise. */
  features: readonly string[]
  /** Where it starts. Absent while the entry cannot be started. */
  cta?: { label: string; href: string }
}

export function buildRunOptions(t: (key: string) => string): readonly RunOption[] {
  return [
    {
      id: 'self-host',
      name: t('landing.runOptions.selfHostName'),
      tagline: t('landing.runOptions.selfHostTagline'),
      cost: { kind: 'free', label: t('landing.runOptions.free') },
      features: [
        t('landing.runOptions.selfHostFeature1'),
        t('landing.runOptions.selfHostFeature2'),
        t('landing.runOptions.selfHostFeature3'),
      ],
      cta: { label: t('landing.runOptions.selfHostCta'), href: '#source' },
    },
    {
      id: 'hosted',
      name: t('landing.runOptions.hostedName'),
      tagline: t('landing.runOptions.hostedTagline'),
      cost: { kind: 'status', label: t('landing.runOptions.hostedStatus') },
      features: [t('landing.runOptions.hostedFeature1'), t('landing.runOptions.hostedFeature2')],
    },
  ]
}
