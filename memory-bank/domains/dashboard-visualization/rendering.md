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

| Trap                                              | Correct approach                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Stacked bars have **no** inter-segment gap         | Draw seams as an HTML overlay at cumulative-percent positions; `borderWidth`/`itemGap` do not work |
| Tooltip shows `undefined` for the series name      | ECharts reads `params.name` from `data.name` or `series.name` — set one               |
| Tooltip duration empty                             | The datum carries seconds under `value`; read `params.value`, not a custom field      |
| Chart never renders / blank card                   | The container ref was null at init — the panel wrapped itself in `ChartSection`       |
| Chart type is "unknown" at runtime                 | Register it in `components/charts/echarts-setup.ts` (tree-shaken registry)            |
| Labels overlap in dense layouts                    | Drop the label (never shrink below the minimum size) and move detail into hover       |

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
