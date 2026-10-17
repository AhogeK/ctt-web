# dashboard-visualization — rendering

How a chart gets drawn and verified. Split out of `practices.md` (which keeps panel composition,
layout and data presentation) when that file outgrew the 200-line limit.

## Placeholder states must not change the card's height

`ChartSection` swaps the whole body between loading / error / empty / data, so whatever the
placeholder renders becomes the card's height. Two things changed it on every refetch that had to
fetch (the card dipped and sprang back — measured 379px → 188px → 379px on the heatmap):

1. a fixed-height skeleton replacing a taller chart;
2. `#actions` hidden while loading, shrinking the header by the control's height — the selector the
   user had just clicked both disappeared and moved the layout.

Fix: measure the data branch and carry its height into the placeholders, and keep the actions
mounted in every state.

```
data branch:  ref + ResizeObserver → lastHeight (px)
placeholders: :style="{ minHeight: lastHeight || undefined }"
#actions:     always rendered
```

- **Measure with a ResizeObserver, not a lifecycle hook**: the slot's chart finishes sizing
  asynchronously (ECharts measures its container; the heatmap derives height from that width), so
  hook-time measurements saw a partial size and left an 18px jump.
- **No height means no `minHeight`** — on first load there is nothing to preserve, and inventing a
  value would misrepresent a panel that has never rendered.
- **Why two-across layouts hid it**: the grid stretches a row to its tallest card, so a dipping card
  was held up by its sibling. Single-column has no sibling — where it became obvious. Verify layout
  fixes at BOTH widths.
- **Detection**: a height jump is invisible in one screenshot. rAF-sample the card's height while
  performing the interaction; the set of distinct values must contain exactly one.

## ECharts specifics (traps hit in this project)

- Tooltip surface follows the THEME — `chart-tooltip.ts` (`tooltipSurface`) carries the popover
  recipe: popover bg, border/60, 8px radius, shadow-md, mirroring the time-of-day info chip.
  The old inverted pill (near-white in dark mode) glowed against the dark card — user-reported
  2026-10-13. Verify with computed styles on the tooltip element, not by reading the option.
  Hover-point HALOS are the opposite case and stay per-panel palette values: a ring must contrast
  with the surface, so it must not ride the tooltip's surface token.
- Readout wording: one state, one name, and averages say "avg". The week-hour legend's quiet tile
  says "No coding", so its tooltip says "No coding" too — a "0s coded" reading claims a measured
  zero the grid cannot show (the backend sends non-zero cells only, and `≤0` renders as the quiet
  tile, so a flat "0" swatch is a state that never occurs). Measured cells read `avg 1m 58s across
  4 Mondays` — the divisor is the per-row weekday count, which no footer note can carry; the
  hourly panel reads `avg 1h 30m` with its divisor in the footer, and its zero buckets stay
  `avg 0s` (no named quiet state exists there — never import a state name a panel does not use).
  State the continuous ramp as ONE gradient chip with its range (`0 – 0.033 h`), never as endpoint
  swatches that read as extra states. The visualMap `formatter` keeps handle labels and the hover
  indicator in the legend's unit — without it raw seconds leak ("118" beside "0.033 h").
- Stacked bars have **no** inter-segment gap — Draw seams as an HTML overlay at cumulative-percent positions;
  `borderWidth`/`itemGap` do not work
- Tooltip shows `undefined` for the series name — ECharts reads `params.name` from `data.name` or `series.name` —
  set one
- Tooltip duration empty — The datum carries seconds under `value`; read `params.value`, not a custom field
- Chart never renders / blank card — The container ref was null at init — the panel wrapped itself in `ChartSection`
- Chart type is "unknown" at runtime — Register it in `components/charts/echarts-setup.ts` (tree-shaken registry)
- `markLine` never draws, with no error anywhere — the tree-shaken registry also needs
  `MarkLineComponent` from `echarts/components`; the option-shape unit test passes while the
  canvas stays empty (long-term trend card, 2026-10-13)
- Labels overlap in dense layouts — Drop the label (never shrink below the minimum size) and move detail into hover

## Entrance animation

- Reveal on scroll into view (`IntersectionObserver`, threshold ~.25), stagger rows ~45–55ms.
- Honour reduced motion: `motion-reduce:transition-none` on width/opacity transitions.

## Theme verification (non-negotiable for charts)

Headless dark-mode screenshots **must** use CDP media emulation:

```js
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
```

Injecting the theme into `localStorage` does not work — the app calls `setTheme('auto')` on mount
and overwrites it. Verify colours by sampling rendered pixels or computed styles, never by
reading the source values back.

## Chart container a11y (do not "fix" role="img")

Every chart panel puts `role="img"` + `aria-label` on its ECharts container. Generic linters flag
this (`Web:S6819`, "use <img>/<svg>") and are wrong here:

- it is **ECharts' own pattern** — `visual/aria.js` sets exactly these two when the `aria` option
  is enabled (echarts 6.1.0:132), so writing them by hand reproduces the library with a better label;
- an `<img>`/`<svg>` cannot replace a live canvas the library draws into;
- `role="img"` *requires* the label — a bare `<div aria-label>` is ignored by many screen readers.

Charts that also expose their values as DOM text (the time-of-day legend) are readable either way;
that is the pattern to prefer when the data is small enough to show.

## Screenshots must wait out the update animation

ECharts morphs every series between option updates (~1s by default). A capture taken right after
the data lands reads a **mid-morph frame** — a curve at a height its data never has (an average
line was read as "drawn several times too high" this way). Before believing a rendered position,
read the option back (`getOption()` / `convertToPixel()`) and capture only after the animation
settles (~1.5s); the same applies to pixel-diff baselines.

## Time readings are sampled per evaluation, never cached in a computed

A dependency-free `computed(() => formatDate(new Date()))` never re-evaluates — a session that
crosses midnight and then refetches keeps yesterday's "today", silently dropping the current-hour
marker and drawing the new day's unwritten hours as zeros. Sample `new Date()` **inside** the
computation that consumes it (it re-evaluates when its data changes); `HeatmapChart` already
follows this pattern.

## Fixed-size glyphs in flex rows need shrink-0

A `h-3 w-3` icon or legend chip inside a `flex items-center` row is a flex item with default
`flex-shrink: 1`: when the row runs out of room, the glyph — the one item with no min-content floor —
is squeezed flat (measured 8.8×12 on a phone card whose class said 12×12, so the trend arrow read as
a cramped scribble). The row-level assertions could not see it: the row still stayed inside its card
because the glyph absorbed the overflow. Protect the glyph (`shrink-0`) and make the LABEL the
flexible item (`min-w-0 truncate`) — the metric and its direction stay whole, and only the trailing
wording ellipsises on the narrowest cards.

## Axis labels: pick the kept set, never leave it to the overlap rule

A dense day axis with month-boundary ticks had its label set left to ECharts' `hideOverlap`: the drop
pattern depends on the card width, so a phone card showed December and March missing while ten other
months stayed — indistinguishable from missing data (user report). Choose the kept dates in the
component — wide cards label every month; narrow ones fall back to a stride counted back from the
newest, so the current month always stays labelled — and drop `hideOverlap`; the same set then holds
at every width instead of a pattern that changes with it.

## The y-scale follows the layers actually drawn

Scaling a chart to its raw maximum is only honest when that maximum is visible: with the daily dots
dropped at phone widths, a lone tall day (6h among 1h days) stretched the axis to 7h while the drawn
7-day average hugged the bottom third (user report). On narrow panels scale to what is drawn — the
average line and the reference mean — and keep the raw maximum for wide panels, where the dots show
it.
