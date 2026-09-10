# dashboard-visualization — practices

Concrete how-to for this domain. Each entry: what to do, why, and the trap it avoids.

## Shared gradient across every bar (the accepted design)

Goal: one ramp spanning the whole bar region — deepest at the track's left edge, brightest at its
right — so a long bar sweeps the full scale while a short bar only touches the deep end, and every
row stays in the same colour family.

```
track:  container-type: inline-size        /* the ramp's coordinate space */
bar:    background-size: 100cqw 100%;
        background-repeat: no-repeat;
        background-position: left center;
        background-image: <the ramp>
```

The bar paints a **track-wide** gradient and its own width clips it. Stops: reuse the trend
chart's indigo ramp (`references.md`). Offsets `0 / 48% / 100%` mirror that chart.

**Do not**:
- give the aggregate row its own colour or opacity — same treatment as every other row (P1);
- hand a per-row gradient (each bar sweeping on its own) — that is a decoration, not a scale;
- build a hard-stop "ladder" — that reads as segments, not a gradient.

## Vertical distribution inside a card

A card stretches to its grid row, so a panel whose sibling is taller has spare height. Two
behaviours, chosen per panel:

- **Fixed-height plot** (trend, hourly) → leave it centred; stretching a chart's plot area is
  worse than empty space around it.
- **A stack of small blocks** (capsule + legend + footer) → fill the card and distribute:
  `flex flex-1 flex-col justify-around` on the panel root. The blocks then spread across the
  height instead of huddling in the vertical centre.

```
root:  flex flex-1 flex-col justify-around gap-4     /* panel opts in */
parent (ChartSection data area): flex flex-1 flex-col justify-center
```

`flex-1` makes the root fill the data area (measured: root height == parent height), after which
`justify-around` has space to distribute.

**Trap — reserve room for absolutely-positioned overlays.** `space-around` gives the first block
only `free/6` above it (with three children), where centring used to give it `free/2`. Any overlay
anchored *above* a block (`bottom-full` hover readout) therefore moves much closer to the card
header, and on a short card it lands on top of the title. Reserve the overlay's exact height as a
margin on that block (`mt-10` = 32px overlay + 8px gap); the margin is part of the flex item's
outer box, so the overlay always has somewhere to appear and the layout never shifts.

*Measured after the fix*: wide card (397px) → 66 / 68 / 68 / 26 px distribution with the readout
77px from the card top; short card (241px) → readout 51px, header bottom 35px, no overlap.

## Bounded-height scrolling list

```
scroll viewport: max-h-[19rem] overflow-y-auto
                 scrollbar-width: thin
                 scrollbar-color: transparent transparent   /* hidden at rest */
                 scrollbar-gutter: stable                    /* lane reserved, no reflow */
                 tabindex="0"                                /* keyboard reachable */
edge fades:      mask-image, applied per edge only
```

- **Fades must be `mask-image`, never a coloured overlay** — an overlay colour can never match a
  card that itself carries a gradient (in dark mode it bands visibly). A mask has no colour.
- Apply each edge's mask **only when that edge actually hides content** (track `atTop` /
  `moreBelow` on scroll); a short list must get no mask at all.
- Reveal the scrollbar thumb on hover/`:focus-visible`/while scrolling (idle timer ~900ms) — a
  standing grey bar reads as browser chrome.
- Give the scroll region `tabindex="0"` plus a `:focus-visible` inset ring, otherwise the content
  is unreachable by keyboard (WCAG 2.1.1).
- Report the row count in the footer; add "scroll for more" only while there is more.

## Numeric readouts

- Two decimals with trailing zeros trimmed for shares (`41.67%` / `0.21%` / `5%`) — integer
  rounding flattens small values to `0%`.
- Every readout path uses the **same** formatter. Missing one (e.g. the bar-end label) leaks
  float tails like `41.66666666666667%` straight into the render — screenshot it, don't assume.
- Give each value its own fixed, right-aligned, `tabular-nums` column so numbers stack down the
  list instead of trailing each bar at a different x.
- Duration column needs enough width and `whitespace-nowrap` or long values wrap and break row
  rhythm.

## Layout thresholds (container queries)

```
page column:  @container/page        grid: @[1684px]/page:grid-cols-2
summary row:  @container/sc          grid: @[1430px]/sc:grid-cols-6
```

- Threshold = twice the required card width plus the gap (`1684 = 2×830 + 24`).
- **A container cannot query itself.** Putting `@container/x` and `@[..]/x:` on the same element
  silently never matches — the declaration must be on an ancestor (page root or a wrapper div).
- Tailwind v4 gotcha: an arbitrary breakpoint like `min-[2400px]` can sort *before* `lg` in the
  emitted CSS, so a same-specificity `lg:` rule overrides it. Prefer real container queries here;
  if an arbitrary breakpoint is unavoidable, verify the computed value, not the class name.

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

## When the component file fights back

Multi-hunk edits on a template-heavy `.vue` file repeatedly mis-registered (stale anchors →
mangled template, twice). Once an edit has corrupted the structure: read the whole file, then
**rewrite it in one `write`** rather than patching hunks. Then re-verify with the full test run.
