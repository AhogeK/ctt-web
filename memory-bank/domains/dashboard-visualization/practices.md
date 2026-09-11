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
chart's indigo ramp (`references.md`), offsets `0 / 48% / 100%`.

**Do not**: tint or dim the aggregate row (P1); hand a per-row gradient (decoration, not a scale);
build a hard-stop "ladder" (reads as segments).

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
only `free/6` above it (centring gave `free/2`), so an overlay anchored *above* it (`bottom-full`
hover readout) moves closer to the header and can land on the title. Reserve the overlay's exact
height as a margin (`mt-10` = 32px + 8px gap): the margin is part of the flex item's outer box, so
the overlay always has room and the layout never shifts. Measured: readout 77px from the top on a
397px card, 51px on a 241px card (header ends at 35px).

## One implementation for the categorical panels

A second categorical dimension must not be built by copying the first panel. Copying duplicates
every hard-won detail (mask edges, the `cqw`-clipped gradient, the readout precision, the folding
popover, the overlay scrollbar), and the next fix then lands in one copy only — the same failure
mode the percent formatter already had, where one readout path was missed and leaked float tails.

```
composables/useRankedDistribution.ts   rows: ranking, shares, 0.1% folding, aggregate
components/RankedDistributionList.vue  view: lanes, track, gradient, scroll, popovers, a11y
lib/utils/percent.ts (@/lib/utils)     readout: precision follows the value (P8)
panels/<X>DistributionPanel.vue        only: the query + the panel's own copy
```

The extraction is worth it as soon as the second dimension exists — it is not speculative
structure, it is the removal of a guaranteed divergence.

## Card height budget

A card's height = its own chrome + whatever the body needs, and the grid row then follows the
tallest card. Work out the budget from the measured chrome before choosing a viewport cap:

```
card = 32 padding (p-4) + 18 header + 16 header gap (mb-4) + body
body = scroll viewport + 8 gap (gap-2) + 18 footer
=> chrome = 92px   (so a 228px viewport lands the card at ~320px)
```

Measured for the language panel: 228px viewport → 321px card, 9 rows visible, still scrollable.
State the derivation in a comment next to the cap — the numbers are otherwise unexplainable six
months later.

## Bounded-height scrolling list

```
scroll viewport: max-h-[228px] overflow-y-auto
                 scrollbar-width: thin
                 scrollbar-color: transparent transparent   /* hidden at rest */
                 scrollbar-gutter: stable                    /* lane reserved, no reflow */
                 tabindex="0"                                /* keyboard reachable */
edge fades:      mask-image, applied per edge only
```

- **Fades must be `mask-image`, never a coloured overlay** — an overlay colour can never match a
  gradient card (it bands in dark mode); a mask has no colour.
- Apply each edge's mask **only when that edge hides content** (track `atTop` / `moreBelow`); a
  short list gets none.
- Reveal the scrollbar thumb on hover/`:focus-visible`/scrolling (idle ~900ms) — a standing grey bar
  reads as browser chrome.
- Give the region `tabindex="0"` + a `:focus-visible` inset ring, else it is keyboard-unreachable
  (WCAG 2.1.1).
- Report the row count in the footer; "scroll for more" only while there is more.

**Two attributes here are deliberate though linters call them redundant.** `role="list"`:
preflight sets `list-style: none`, dropping list semantics in Safari/VoiceOver (`Web:S6822` misses
this). `tabindex="0"`: rows are not focusable, so without it the keyboard cannot reach rows below
the fold (`Web:S6845` misses this).

**Tooltip triggers must be reachable too.** reka-ui's `TooltipTrigger` opens on `focus` as well as
hover, but `as-child` on a plain `<span>` is unfocusable — so pointer-only detail (truncated name,
folded breakdown) becomes keyboard-unreachable. Give those elements a tab stop **only when they
have something to reveal** (a per-row predicate — 33 dead stops beat none), plus a `:focus-visible`
indicator (WCAG 2.4.7). Every other `TooltipTrigger` here wraps a real `<button>`; follow that.

## Numeric readouts

- Two decimals with trailing zeros trimmed for shares (`41.67%` / `0.21%` / `5%`) — integer
  rounding flattens small values to `0%`.
- **Below that resolution the precision follows the value.** A share can legitimately sit far
  under 0.01 (the "Others" popover exists precisely to show that tail), and a fixed two decimals
  prints each of them as `0%` — indistinguishable from a language with no time at all. Extend one
  digit past the value's first significant digit, capped at 6:

  ```
  decimals = v >= 0.01 ? 2 : min(6, ceil(-log10(v)) + 1)
  ```

  `0.0033 → 0.0033%`, `0.000004 → 0.000004%`. Zero itself still prints `0`. The cap of 6 stays
  non-zero down to one second in ~6 years of tracked time, so the readout can never round a real
  value back to `0` — which is the whole point of the rule (P8).
- **Size the value lane for the longest output, not the common one**: the worst case is
  `0.000000%` = 62.5px at 11px `tabular-nums`, so a 3.5rem lane spilled 6.5px into the column gap
  (survivable only by luck). Lane widths are tabulated in `references.md`.
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
