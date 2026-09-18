# landing-page — scenarios

## LS1. About to design a section

1. Read `practices.md`'s measured baseline — the values for container, spacing, radius, type and
   motion are already settled; do not re-derive them.
2. Read the archetype closest to what you are building (nav / dropdown / sheet / accordion).
3. Only then reach for a reference site, and check its **tier** first (L3).
4. Anything the baseline does not cover → `待确认` plus what would settle it. Never invent a value.

## LS2. Tempted to add a token

Stop. `DESIGN.md` is the owner (L5). Check it: if the token exists, use it; if not, the proposal
goes to the user — and if accepted it lands **in `DESIGN.md`**, not in a component.

## LS3. Adding motion

Default answer is **none** — three of five measured sites ship zero animated elements, and the two
that animate do so as a style choice. If motion is genuinely needed:

- duration ≤200ms (the measured baseline), `transition` over `animation` where possible;
- every motion utility carries its `motion-reduce:` counterpart
  (`motion-reduce:transition-none` / `duration-0` / `animate-none`);
- hover-driven styles are wrapped in `@media (hover: hover)` so touch devices do not get stuck in
  a hover state.

## LS4. A reference site does something clever

Ask three questions before adopting it: *which tier is this evidence* (L3), *does it survive ≥3
samples* (L2), *is it already available in our stack* (L4). A pattern that fails any of them is an
observation, not a decision.

## LS5. Recording what was learned

The research is worthless if it lives only in `.plans/` (gitignored). Durable rules → this domain;
the measured values → `practices.md`; which site taught what, with paths → `references.md`.
