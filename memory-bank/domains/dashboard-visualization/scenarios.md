# dashboard-visualization — scenarios

Trigger → judgement → action. Each row is a situation already encountered in this project; the
right-hand column is what to do, not a suggestion to re-litigate.

## S1. "Which chart type should panel X use?"

1. Read the dataset's **shape**, not the user's wording: few categories? time series? share?
   distribution? matrix?
2. Audit at least three candidates on three axes — semantic fit (does each mark carry a real
   unit?), visual fit (do labels fit at card width?), narrative fit (does the shape carry a
   judgement, not just numbers?).
3. Prefer a type already registered in `echarts-setup.ts` — zero bundle growth. Adding a chart
   type is a deliberate, justified step.
4. Prefer horizontal ranked bars when labels are arbitrary-length text (language/project names):
   no legend squeeze, length ∝ value is honest.

**Rejections on record** (do not re-propose without new evidence):

| Candidate           | Rejected because                                                              |
| ------------------- | ----------------------------------------------------------------------------- |
| Treemap (area)      | One dominant value becomes a giant colour slab; small tiles unreadable        |
| Donut/pie           | Ring leaves dead space by construction; legend steals width; small slices mute |
| Dot waffle (1 = 1%) | Cannot encode sub-1% shares — directly contradicts "see everything"            |
| Per-rank colour ramp| Redundant with length, neighbours too close to tell apart                      |

## S2. "The colours do not match DESIGN.md / look muddy"

1. **Quantify first** — compute WCAG contrast between the stops and between each stop and the
   actual surface (card background, not white/black).
2. If a *sweep* looks muddy, the cause is usually a two-point interpolation whose midpoint drifts
   off the hue: add a brand-anchored midpoint stop instead of nudging the endpoints.
3. If an *endpoint* is invisible, the budget is wrong — see P3: move the seam/structural
   separator or accept a slightly lower contrast at one end, but never leave a mark under ~2.5:1.
4. Reuse an existing panel's stops before inventing new ones (P7).

## S3. "The numbers look wrong / totals do not match"

**Stop and identify the statistic family before touching any code** (P2):

| Symptom                                                   | Likely truth                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------- |
| Distribution panel unchanged while summary cards move      | Panel is not receiving the date window → check the query params      |
| `Others` sum looks larger than expected                    | Categorical accumulation with overlapping sessions — legal           |
| Totals differ across two panels that should agree          | One is time-axis, the other categorical — different statistics       |
| A panel reads zero / empty on a fresh account              | Seed that account; a fresh test account has no data by definition    |

Then verify with the real backend before touching the frontend: hit the endpoint directly with
the same parameters the panel sends (including `timezoneOffset`), and compare the raw payload
with what the panel renders.

## S4. "The card is too tall / too empty / rows are unreadable"

1. A card that grows with row count → bound the viewport, never the data (P6).
2. A card with dead space on one side → the marks are not using the available width. Either
   scale to the largest value (not the total) or split the list into columns; do not invent
   filler.
3. Rows trailing off to a hairline → length must be normalised to the **largest** value, and the
   small end needs the numeric readout to stay legible (the bar only carries position).

## S5. "Rows/segments are hard to distinguish"

1. Add a structural separator (paper seam) rather than more colour difference — P3.
2. For segments inside one stacked bar: ECharts paints over any border hack; render seams as an
   HTML overlay at cumulative positions.
3. Check contrast numerically; "looks fine to me" is not evidence in dark mode.

## S6. "The hover feels off / the tooltip is wrong"

1. Cursor-following tooltips on a wide stacked shape feel unstable → anchor the readout to the
   mark's own centre (clamped inside the card).
2. `undefined` in a tooltip almost always means the datum lacks the field the formatter reads:
   ECharts takes `params.name` from `data.name`/`series.name`, and `params.value` from `value` —
   check both before blaming the formatter.
3. For structured detail (a list inside the popover), use the design-system Tooltip component,
   never the native `title` attribute.

## S7. "The panel needs a different width / the grid breaks"

1. Width requirements are stated in **component width** (e.g. "a card must keep ≥830px"), not
   viewport width — implement with container queries, so sidebar collapse and layout changes stay
   honest.
2. A container element **cannot query itself** — the `@container` declaration must sit on an
   ancestor.
3. Verify at several real widths and record the measured column counts (see `references.md`).
