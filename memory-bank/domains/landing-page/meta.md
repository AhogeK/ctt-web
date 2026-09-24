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
| `src/features/landing/**` | The implementation: `views/LandingView.vue`, `components/LandingSection.vue` |
| `src/layouts/MarketingLayout.vue` | The marketing shell (header/footer, `--marketing-header-height` source) |

**Status: P2 complete (2026-09-24)** — P1 shipped the entry and routing shell; P2 shipped the visual primitives (section container · type scale · surface/divider tokens · hover guard · theme bootstrap · sticky contract · `motion-reduce` cover · token audit · the showcase-panel motion) and passed its three measured acceptance criteria. Later phases (P3 hero/value demo, P4 capability/open-source, P5 pricing, P6 tests/docs) remain open. `/` is public (`route-names.ts` `LANDING`, `router/modules/landing.ts`, `layouts/MarketingLayout.vue`) and the top-bar CTA switches on `authStore.isAuthenticated`. Sections that belong to later stages are **deliberately absent, not stubbed**.

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
| Checked against source | External: 6 sites probed, 4 read down to CSS token tables and JS bundles, **Supabase's open-source component source** (2026-09-19). Internal: `DESIGN.md` §3/§8, `src/stores/theme.ts`, `src/components/app/ThemeToggle.vue`, `src/` full scan. **Re-checked 2026-09-19 after P1**: `router/route-names.ts`, `router/modules/landing.ts`, `layouts/MarketingLayout.vue`, `features/landing/views/LandingView.vue` |
| Coverage | Container width, spacing/radius/font laws, breakpoints, motion policy, theme bootstrap, four component archetypes — each with hit counts or a source path. **Re-measured 2026-09-24 (P2 closure, 1440×900, dark/light/reduce)**: h1 `64px/510/−1.408px/64px` identical in both themes; 15 text probes (14 ≥ 4.5, one at 4.24 dark / 4.42 light); `getAnimations()` **0** under reduce vs **5** in the control |
| Known drift | The **P2 implementation gap is closed**; the external reference values are snapshots of other people's sites and will age with them. **Scroll-driven motion is not testable yet** — at 1440×900 the page's `scrollHeight` equals the viewport, so the P2 motion pass covers entry/hover only; do not cite it as covering scroll. |
