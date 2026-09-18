# landing-page — meta

## Boundary

The **public marketing surface** of ctt-web: what a first-time visitor sees before they have an
account. Covers its visual baseline, component archetypes, responsive rules and the evidence those
rest on.

**In scope**: first-screen composition, typography/spacing/radius laws, motion policy, the
marketing component archetypes (nav / dropdown / mobile sheet / accordion), responsive behaviour,
and the reference research behind all of it.

**Out of scope**:

- The authenticated dashboard → [`dashboard-visualization`](../dashboard-visualization/meta.md)
- Design tokens themselves → `DESIGN.md` (this domain *uses* them, never adds to them)
- The working process → [`ai-workflow`](../ai-workflow/meta.md)

## Owned paths

| Path | Role |
| --- | --- |
| `.plans/ctt-web-development-plan.md` | The working plan (gitignored — never the only home of a fact) |
| `DESIGN.md` | Token/typography/spacing authority; this domain cites it, never overrides it |
| `src/features/landing/**` (future) | The implementation, once the plan is approved |

**Status: not yet built.** This domain currently records the *research*, not shipped code — say so
plainly rather than implying an implementation exists.

## Terminology

| Term | Meaning |
| --- | --- |
| Reference site | An external site measured for a specific decision (see `references.md`) |
| Evidence tier | Peer status quo · design authority · conversion research — different force, never interchangeable |
| Measured baseline | A value taken from computed styles or source, recorded with its hit count |
| Archetype | A component shape the landing page needs (sticky nav, sheet menu, accordion…) |

## Where to start

- Designing a section → `principles.md` (what may and may not be decided by taste), then
  `practices.md` (the measured baseline), then `references.md` (which site taught what)
- Tempted to add a token or a dependency → `principles.md` L4/L5 first
- Adding motion → `scenarios.md` LS3

## Verification baseline

| | |
| --- | --- |
| Checked against source | External: 6 sites probed, 4 read down to CSS token tables and JS bundles, **Supabase's open-source component source** (2026-09-19). Internal: `DESIGN.md` §3/§8, `src/stores/theme.ts`, `src/components/app/ThemeToggle.vue`, `src/` full scan (367 files) |
| Coverage | Container width, spacing/radius/font laws, breakpoints, motion policy, theme bootstrap, four component archetypes — each with hit counts or a source path |
| Known drift | **No implementation exists yet**, so nothing here can have drifted from code. Re-measure when the page ships; the external values are snapshots of other people's sites and will age. |
