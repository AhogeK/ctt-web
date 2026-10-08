/**
 * The landing page's pricing structure — data only.
 *
 * The product's code is fully open source: running the whole system yourself is free forever and is
 * one of the page's two paths. The other path — a hosted sync service the project would operate —
 * has no final price yet, so its entry carries an explicit `in-design` status and **no number**.
 * When the business sets a figure it is edited here; no component changes.
 *
 * A standing rule for this section: prices are public. The hosted entry must never be replaced by a
 * "contact sales" prompt, and while it cannot be started it shows its status instead of a button.
 */

/** How an entry presents its cost — a deliberate state, never a placeholder figure. */
export type PricingPrice = { kind: 'free'; label: string } | { kind: 'in-design'; label: string }

export interface PricingPlan {
  /** Stable key for rendering and tests. */
  id: string
  name: string
  /** One line stating what the entry actually is. */
  tagline: string
  price: PricingPrice
  /** What it includes; each line checkable against the repositories or an explicit future promise. */
  features: readonly string[]
  /** Where it starts. Absent while the entry cannot be started. */
  cta?: { label: string; href: string }
}

export const PRICING_PLANS: readonly PricingPlan[] = [
  {
    id: 'self-host',
    name: 'Self-host',
    tagline: 'Run the whole system on your own machine or server.',
    price: { kind: 'free', label: 'Free' },
    features: [
      'The full system — plugin, sync server and this dashboard — with every feature included',
      'Your data stays on hardware you control; the server talks only to your own devices',
      'A documented Docker Compose quick start, and the source of all three repositories',
    ],
    cta: { label: 'Read the quick start', href: '#source' },
  },
  {
    id: 'hosted',
    name: 'Hosted sync',
    tagline: 'The same system, run for you. In design, not yet available.',
    price: { kind: 'in-design', label: 'In design' },
    features: [
      'We run the sync server: certificates, backups and upgrades are ours to keep current',
      'The same open source code underneath, so the data can be exported and moved out at any time',
      'Pricing is published on this page before it can be bought — never a "contact sales"',
    ],
  },
] as const
