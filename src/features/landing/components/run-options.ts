/**
 * The landing page's ways to run the system — data only.
 *
 * Every part of the product is free and open source, so neither entry carries a price: running
 * the whole system yourself is free, and the hosted entry states its status where a figure would
 * sit instead of inventing one. A change of wording is a data edit here; no component changes.
 *
 * A standing rule for this section: nothing here is ever for sale. The hosted entry must never be
 * replaced by a "contact sales" prompt, and while it is not offered it shows its status instead
 * of a button.
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

export const RUN_OPTIONS: readonly RunOption[] = [
  {
    id: 'self-host',
    name: 'Self-host',
    tagline: 'The whole system on your own machine or server.',
    cost: { kind: 'free', label: 'Free' },
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
    tagline: 'The same system, run by the project instead of by you.',
    cost: { kind: 'status', label: 'Not offered today' },
    features: [
      'The project does not operate a hosted instance today — this page will say so if that changes',
      'If one ever opens, it stays free, runs this same open source code, and is best effort — no uptime promises',
    ],
  },
] as const
