# auth-layout — scenarios

## S1. About to change the showcase visuals

1. Read `practices.md` — the values are settled; do not re-derive from the stylesheet alone.
2. Change **one** knob at a time and re-measure with `P4`'s freeze; the layers interact (sheen ↔ ring ↔
   underglow are three different layers stacked on the same card).
3. Never bulk-edit the stylesheet with a delete regex — append a labelled block or replace an exact string.

## S2. Measuring any of these lights

1. Inject `.auth-card-3d, .auth-dashboard { transform: none !important; transition: none !important; }`.
2. Diff hover vs idle; sample **outside** the card for the underglow, **inside** for the sheen.
3. Report counts per band (above gap / card face / below gap); a card face that lights up is a bug — the
   faces are opaque and must read ≤1 count.

## S3. Adding a fourth card

1. Its `useCardTilt` preset needs `underglow` only if the default radius is wrong; the scene layer is
   shared, so no new markup is required.
2. Give it a unique spotlight gradient `id` and an inline `stroke="url(#…)"` on its `<rect>` — the
   geometry (`width/height: calc(100% - 1.5px)`) is shared CSS.
3. Re-run the S2 measurement; the new card must occlude / be occluded exactly like the other three.
