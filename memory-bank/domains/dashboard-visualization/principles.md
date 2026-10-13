# dashboard-visualization — principles

Invariants for this domain. When two options conflict, these decide. They override taste,
convenience and "it looks nicer".

## P1. Length/length-like encoding is the truth; colour must not repeat it

A bar's length, a tile's area, a cell's position — these already encode the value. If colour
encodes the same number again, it is redundant at best and misleading at worst.

**Consequence**: one hue for all data marks, distinguished by position/length/label. A
per-rank colour ramp is a violation (it implies meaningful tiers that do not exist). An
aggregate row may not be tinted or dimmed either — that re-imports "colour means something".

*Evidence*: three rejected designs in one session — an 8-step rank ramp (neighbouring steps
measured only 1.2–1.4:1 apart, and it wrapped back to step 1 after eight rows), a single accent
plus grey for the rest (read as "every other language is disabled"), and a tinted aggregate row
(read as a different kind of data). The accepted design: identical treatment for every row.

## P2. Two distribution families are not the same statistic

- **Time-axis** (time-of-day, heatmap, trend): answers "how much time did activity occupy".
  Overlapping sessions are the same activity, so they are merged/deduped.
  **Invariant: bucket sum == `summary.total`.** Keep a Total readout as the cross-check.
- **Categorical** (languages, projects, devices, IDEs): answers "how much did each contributor
  contribute". Same-second concurrency is genuine concurrent usage, so nothing is merged.
  **Bucket sum ≥ real activity, legally.** Never print a Total — the number has no meaning.

*Backend ruling (ctt-server v0.66.0):* time-axis must be conservative, categorical is
necessarily super-linear. Mixing them up produces "totals do not match" reports that are not bugs.

## P3. Spend the luminance budget on the constraint that cannot be solved any other way

Every chart has exactly one contrast problem worth colour: here, "does the mark separate from
the card surface". Adjacent-mark separation is instead solved **structurally** — a 2px paper
seam between segments — which frees the entire luminance range for mark-vs-surface contrast.

**Consequence**: measure both ends against the surface and keep them above ~2.5–3:1; do not
shrink the ramp to make neighbours differ when a seam can do that job.

## P4. Colour is either brand or meaning — never decoration

- Data marks carry the brand indigo family; the ramp may run deep→bright to give direction.
- Aggregate/derived marks are the **same** treatment (P1) — they are data too.
- Status colours (green/emerald) belong to status, not to charts.

## P5. A chart's axis must match what it actually encodes

If the marks encode *share*, an axis of clock positions is a lie — the two can never align.
Either label the real quantity or remove the axis. When in doubt: less axis, more label.

*Evidence*: a 24h ruler over a share-based capsule was removed twice (clock ticks misalign with
share positions; percent ticks carry no information the segments don't already show).

## P6. The card constrains height, never the data

A panel must never hide rows to protect its height. Bound the viewport (scroll + edge fades +
count footer) and let every entry exist. Truncating data to fit a layout is a correctness bug
in disguise.

*Evidence*: a "top 8 rows" cap hid languages 9+ behind `Others`; the user's actual requirement was
"see every language". The list now scrolls and reports the total count instead.

## P7. DESIGN.md and existing panels are the style authority
`DESIGN.md` (Linear-style, light/dark dual mode) is authoritative for colour, spacing and
elevation; existing charts are the precedent for gradient language. Inventing a new third
gradient or a colour outside the file is not a design choice, it is drift.

*Consequence*: a new chart reuses an existing panel's gradient stops verbatim rather than
picking "similar" values.

## P8. A readout must never render as its own absence

A value that is present must not print as `0` (or `—`, or blank) because the display resolution
was too coarse. "No data" and "a vanishingly small amount of data" are different facts and the
readout has to keep them apart — otherwise the UI reports the opposite of the truth for exactly
the rows a user opened the detail view to inspect.

**Consequence**: precision is not a fixed property of the panel; it follows the value down until
the value is visible. Uniform precision is a tie-breaker, never a constraint that justifies
printing `0%`. Applies to any unit that can sit orders of magnitude below its display step
(percent shares, durations, rates).

*Evidence*: shares in the "Others" popover printed as `0%` at two decimals; the user's report was
"hiding data behind a 0%". See `practices.md` → Numeric readouts for the formula and the lane
sizing it forces.

## P9. Only page-level state goes in the URL

State that **every** panel on the page follows — the date range, the source filter — belongs in the
URL: it is the page's context, it should survive a reload, and it should be shareable.

A window that belongs to **one card** does not. The heatmap's year and the trend's month live in
local refs inside `useDashboardFilters`, never in the query string.

**Why it is an invariant and not a preference**: vue-router's `currentRoute` is a wholesale
`shallowRef`, so *any* query change re-renders `RouterView` and the entire shell beneath it. Measured
on a month selection: the sidebar, `SidebarProvider`, `TooltipProvider` and every `SidebarMenuItem`
re-rendered for a change that touched one card. Keeping per-panel windows out of the URL is what makes
those re-renders impossible rather than merely infrequent.

*Corollary*: a shell component that reads route state must read it through `computed(() => route.path)`
so an unrelated query change cannot propagate into it.

*Measurement*: component-instance render counts plus per-canvas `toDataURL()` fingerprints — not
screenshots, whose noise made the first attempt inconclusive. Regression guard: the filter store's
`setHeatmapYear`/`setTrendMonth` assert `router.replace` is never called.

## P10. One daily dataset may deserve two charts — with different reading tasks

The same dense daily points feed two cards on purpose: the 30-day trend reads **shape** (smooth
line + gradient area, plugin-parity), the long-term trend reads **level** (daily dots, a centered
7-day average, and the window mean as the single dashed reference). The differences are deliberate,
not drift:

- no gradient area on the long-term card — its dots live below the average line and a fill washes
  out the lower half of the cloud;
- one baseline, not two: the recent-30-day-vs-window comparison is **DOM text** (the badge above
  the chart, the caption's values) — readable by screen readers and honest to the summary cards'
  single colour-convention helpers (`summary-comparison.ts`);
- the caption names the layers and prints the baseline value with two-digit seconds
  (`4h 32m 08s`; the field drops at :00). Minute-rounding proved too coarse (user ruling,
  2026-10-13) — values round to whole seconds first, since `formatDuration` takes whole seconds.

Do not "restore consistency" by copying one card's treatment onto the other. The shared language
is the stroke palette, the axis recipe and the panel shell — not identical layers.

**Window and width are part of the same call** (evaluated 2026-10-13; the window gained a picker
by user ruling the same day):

- **Default rolling 12 months + the heatmap's year picker** (shared `YearSelect`, window held in a
  local ref like the other panel windows). A 30-day option stays rejected: it would duplicate the
  Coding trend card — same data, same window, two cards telling one story. A picked year shows its
  calendar frame, **clamped to today for the current year**: future zero days would poison every
  average the card prints (the heatmap keeps its future cells because a calendar strip and a trend
  chart read differently — do not "unify" them).
- **Full row, not a half card** — nine panels mean one card spans anyway, and this is the one that
  gains: measured dot pitch ≈ 5px at the full row (a readable cloud), ≈ 3px at a 996px card
  (still reads), ≈ 1.6px at 596px (sand — which is why the dots drop at phone widths).

Revisit the width if a tenth panel ever gives the page even pairings, or if the 30-day card
adopts the dots + baseline itself — then this card would be the duplicate.
