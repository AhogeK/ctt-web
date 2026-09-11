# dashboard-visualization — meta

## Boundary

Everything that renders statistics as a visual on `/dashboard`: which chart type a dataset
gets, how colour encodes (or refuses to encode) data, the layout thresholds that decide how
wide a panel may be, and the hover/scroll interaction inside a panel.

**In scope**: panel composition, chart-type selection, colour ramps for data, axis/scale
helpers, panel-scoped interaction, ECharts config and registration, panel-level empty/loading
states.

**Out of scope** (belongs elsewhere):

- Fetching/parsing statistics → [`backend-contract`](../backend-contract/meta.md)
- Cross-cutting UI conventions (component structure, button variants, error boundaries) → `systemPatterns.md`
- The design tokens themselves → root `DESIGN.md`

## Owned paths

| Path                                                       | Role                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| `src/features/dashboard/views/DashboardHome.vue`           | Panel composition + which query window each panel receives   |
| `src/features/dashboard/composables/useDashboardFilters.ts` | URL filter state (period preset, device, IDE)                |
| `src/features/dashboard/components/*.vue`                  | One file per panel (pure renderer or query-owning, see below)|
| `src/features/dashboard/components/axis-scale.ts`          | Shared Y-axis scale helpers                                  |
| `src/features/dashboard/components/heatmap-window.ts`      | Pure helpers for the heatmap render window                   |
| `src/components/charts/echarts-setup.ts`                   | Tree-shaken ECharts registration (the only place to add one) |
| `e2e/dashboard/*.spec.ts`                                  | Layout/chart contracts under test                            |

## Panel architecture (two shapes)

1. **Pure renderer** — the panel receives data + filters as props and only draws.
   `HeatmapChart`, `TrendChart`, `TimeOfDayPanel`.
2. **Query owner** — the panel runs its own query and the parent still drives `ChartSection`'s
   loading/error/empty states: `LanguageDistributionPanel`, `ProjectDistributionPanel`.

The two categorical panels share the row model (`composables/useRankedDistribution.ts`) and the
list view (`RankedDistributionList.vue`), differing only in their query and their copy — so a
change to ranking, folding, the gradient or the readout precision cannot land in one and miss the
other.

A panel must never wrap itself in `ChartSection`: while its query pends the container ref stays
null, so the chart never initialises (learned the hard way, v0.25.0). One shape per panel,
declared in its JSDoc.

## Terminology

| Term              | Meaning here                                                                       |
| ----------------- | ---------------------------------------------------------------------------------- |
| Panel             | One `<ChartSection>` card in the dashboard grid                                    |
| Capsule strip     | The time-of-day 100% stacked bar (the day drawn as one horizontal bar)             |
| Track             | A bar's background rail; also the container-query context for the shared gradient  |
| Global gradient   | One ramp spanning the whole track width; each bar reveals its own slice of it      |
| Aggregate row     | The `Others` row that absorbs sub-threshold entries                                |
| Ranked list       | The shared ranking view for categorical dimensions (sub-0.1% folding, scrolling, popover) |
| Time-axis panel   | A panel where x is real time (heatmap, trend) — bucket sums must be conserved      |
| Categorical panel | A panel where each bucket is an independent category — sums may exceed real time   |

## Where to start

- Deciding a chart type or colour treatment → `principles.md`, then `scenarios.md`
- Implementing/tuning one → `practices.md`
- Looking up a panel, colour or data source → `references.md`
