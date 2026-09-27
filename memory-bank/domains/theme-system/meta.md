# theme-system · meta

**Scope**: the light/dark token ladder, the structural border standard, surface elevation, and the depth
recipe for dark plates — plus the rules that keep `DESIGN.md` and the shipped CSS from drifting apart.

**Verified against** (the baseline for every claim here; re-read these before trusting an old note):
- `DESIGN.md` — §"Dark structure, as shipped" and §"Cards & Containers" (the design side)
- `src/assets/main.css` — the `.dark` token block and the `[data-surface='card']` rule (the code side)
- the rendered values captured 2026-09-25 with the Playwright probe (recipe in `scenarios.md`)

**Not in scope**: the landing page's marketing surfaces (frozen by user verdict) · the auth showcase's
three-layer light system (`domains/auth-layout/`) · chart palettes (`domains/dashboard-visualization/`).
