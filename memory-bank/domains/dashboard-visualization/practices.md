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
