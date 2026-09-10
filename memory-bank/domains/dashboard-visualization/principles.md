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
