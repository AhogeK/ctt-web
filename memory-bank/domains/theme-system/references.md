# theme-system · references

- The design baseline — `DESIGN.md` §"Dark regions, as shipped" · §"Cards & Containers" — written from the shipped
  values; the place a future change must be recorded
- Shipped tokens — `src/assets/main.css` `.dark { … }` — the single source for every colour in the app
- The two card sites that now use `--card` in dark — `AccountSection.vue` · `ProfileView.vue`
  (`bg-muted dark:bg-card`) — the settings cards; the light fill is untouched
- Before/after captures — `.omp/qa/dark-regions-2026-09-25/` — the rendered evidence for the ladder
- The measurement recipe — `domains/ai-workflow/references.md` (Playwright in this shell: `CI=true` ⇒ stale dist) —
  the one procedure that makes these numbers trustworthy
- Contrast math — WCAG relative-luminance formula over the resolved token values — every ratio quoted in `practices.md`

Related domains: `domains/auth-layout/` (the auth showcase's own light system) · `domains/landing-page/`
(frozen marketing surfaces) · `domains/dashboard-visualization/` (chart colour).
