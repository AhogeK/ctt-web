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

**Motion is made on demand — this is the rule; "most reference sites ship none" is only a status-quo
statistic, not a constraint** ✗ (user, 2026-09-21 — confirmed after I had written the opposite here).
When motion is needed:

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

The research is worthless if it lives only in `.plans/` (tracked, but AI content — never on `master`). Durable rules → this domain;
the measured values → `practices.md`; which site taught what, with paths → `references.md`.

## LS6. Measuring this page's computed styles

Three constraints, each paid for on 2026-09-24 during the P2 acceptance run:

1. **Use `page.setViewport()`** — `browser.open({ viewport })` does **not** take effect (measured
   800×513), so breakpoints, scroll height and grid readings are all polluted until you set it.
2. **Normalise every colour through canvas** — Tailwind v4 emits `oklab(…)`; regex-grabbing the
   numbers reads them as rgb and produces contrast figures like **1.05** that look like findings.
   `ctx.fillStyle = color; fillRect; getImageData` gives exact sRGB **and** alpha; then composite
   each ancestor's `background-color` alpha **from the top down** before computing a ratio.
3. **`transition-duration` ≠ `0s` does not mean "has motion"** — the global reduce rule turns it into
   `0.01ms`, so the reduce state reads as *more* animated than the control.

**And prove the probe can fail before quoting it** — inject known samples (black/white = **21.00**,
same-on-same = **1.00**) and keep a control: `getAnimations()` was **0** under reduce and **5** in the
control. A metric whose control is also flat (e.g. `movedOnScroll` while the page has no scrollable
content) is **not evidence** — do not cite it.

## LS7. Reviewed and accepted — do not "improve" it again

The user reviewed the landing/auth surface on 2026-09-24 and accepted **all five** items as they are:
the mobile h1 size (it wraps to four lines at 390 and that is fine), the violet eyebrow above it
(the ratio measures just under AA and that is fine), the showcase panels' feel, the light-theme panel
pass, and the overall spacing.

**Accepted means frozen** ✗ — do not re-open these as "findings". A future session that re-measures
the same numbers and reports them as new defects is repeating work the user has already declined.
If a change to one of them is genuinely needed for another reason, say so explicitly and re-ask;
never bundle a "fix" for these into unrelated work.
