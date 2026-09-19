# landing-page — practices

## Measured baseline (2026-09-19)

Same probe on every site; hit counts are how many elements/rules matched. **These are the values to
design against** — re-derive only if a source changes.

| Dimension | Measured | Note |
| --- | --- | --- |
| Container width | **1200px** — hits 22 / 26 / 11 | Three-site consensus; narrow prose columns ~730–750px |
| Spacing base | **8px grid** — `rowGap: 8px` hits 44 / 50 / 26 | Matches `DESIGN.md` "Base unit: 8px" |
| Primary radius | **8px** — hits 22 / 67 / 89 | Pill/circle reserved for badges and avatars; matches `DESIGN.md` "Card (8px)" |
| Transition duration | **0.15–0.2s** | Most elements declare `0s` (1142 / 1145 / 1092) |
| h1 size | **64px** — 4 of 5 sites | Supabase 46px is the outlier |
| h1 weight | **≤600** (510 / 500 / 600) | No reference uses 700+ |
| h1 line-height | **1.0–1.1** | 64/64, 64/70.4, 46/46 — never 1.5 |
| Letter-spacing | **size × −0.022em** for display sizes | Linear: 64 → −1.408px, 40 → −0.88px (exact) |
| Breakpoints | **640 / 768 / 1024 / 1280** | Tailwind defaults; `DESIGN.md` §8's six tiers map onto them |
| motion-reduce | `motion-reduce:transition-none` · `duration-0` · `animate-none` | The Tailwind form of `prefers-reduced-motion` |
| Sticky positioning | 0 / 1 / 0 sites | Use sparingly |

## Component archetypes

| Archetype | Mechanism (verified) |
| --- | --- |
| Sticky nav | `sticky z-30` + `top-[header-height]` + `bg-background/90` + `backdrop-blur-xs` + `border-b`; absolute wrapper `pointer-events-none`, inner `pointer-events-auto` |
| Dropdown | State in a hook (`{open, setOpen}`); `data-state` + `aria-selected` kept in sync; `Escape` / arrows handled |
| Mobile menu | `{open, setOpen}` hook + Sheet/Dialog (focus trap, scroll lock, `aria-modal`) |
| FAQ accordion | `data-state=open/closed` drives everything: icon via `[&[data-state=open]>svg]:rotate-180`, content via `animate-accordion-up/down`, `duration-200`, `motion-reduce:*` counterparts |

## Gaps this work identified in ctt

| Gap | Evidence | Fix |
| --- | --- | --- |
| `@media (hover: hover)` absent | `src/` scan: **0 hits** (vs 20 / 7) | Wrap hover styles; `ThemeToggle.vue:83` already affected |
| Touch targets not numeric | `DESIGN.md` §8 is qualitative; the four "44" are colour hexes | Propose **44×44 CSS px** minimum → into `DESIGN.md`, not a component |
| `motion-reduce:` not used as variants | 3 `prefers-reduced-motion` occurrences, none as Tailwind variants | Convert to variant form |
| No mounted guard on theme-aware first paint | `src/stores/theme.ts` has no `mounted` gate | Add it where the first screen renders theme-dependent UI (see the reference's `use-mounted.ts`) |

## Traps

- **Do not copy a reference's numeric offset.** Supabase's `top-[65px]` is *its own* header height;
  take ours.
- **A gap in a document is not a gap in the code.** The `color-scheme` / `prefers-color-scheme`
  absence was in `DESIGN.md`; `src/` implements both.
- **Do not describe the mechanism from memory.** The accordion is driven by keyframe utilities, not
  by a CSS variable — the wrong version was nearly written as fact.
- **Screenshots are the weakest evidence.** Reading code, computed styles and source is what turned
  impressions into rules.

## Shipped so far (P1 — entry and routing shell)

| Fact | Where it lives |
| --- | --- |
| `/` is public and renders `LandingView` under `MarketingLayout` | `src/router/modules/landing.ts` |
| Route names: `MARKETING_LAYOUT` (layout) + `LANDING` (view) | `src/router/route-names.ts` |
| Top-bar CTA switches on auth state: register → dashboard | `src/layouts/MarketingLayout.vue` |
| Top bar carries **one** account entry, signed out = `Sign in` → `/auth/login` (sign-in, not sign-up: no signup wall here, and the login page holds both GitHub OAuth and the "Create account" link) | `src/layouts/MarketingLayout.vue` + `e2e/landing/page.spec.ts` |
| Hero copy makes no unverified product claims (`no telemetry` was removed: a time tracker syncs your data by design) | `src/features/landing/views/LandingView.vue` |
| Own build chunk (`feature-landing`), not merged into the app bundle | `vite.config.ts` |
| Guard semantics: public = `requiresAuth` absent/false; **`guestOnly` would bounce signed-in visitors off `/`** | `src/router/guard.ts` + the E2E case in `e2e/landing/page.spec.ts` |

The hero copy shipped in P1 is a placeholder for the *layout*, not the final messaging — the capability
walkthrough, open-source block and pricing structure are still open (see `meta.md`).