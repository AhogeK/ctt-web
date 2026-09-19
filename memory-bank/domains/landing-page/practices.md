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
| Hover gating — **was mis-measured** | Earlier: "`@media (hover: hover)` 0 hits in `src/`" ⇒ recorded as a repo-wide gap. **Wrong**: Tailwind v4 compiles the `hover:` variant *into* `@media (hover: hover)` — the built CSS carries **8** occurrences for **0** in source. The measurement looked at source and concluded about output. | The real instance is the **hand-written** CSS: `ThemeToggle.vue`'s `.theme-toggle:hover` (and `:root:not(.dark) …`) sit **outside** any `@media (hover: hover)` — verified in the built CSS — so a tap can leave the hover style stuck. Wrap hand-written `:hover`; Tailwind variants need nothing. |
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
| All external destinations live in one module (`src/lib/site-links.ts`), imported by both the shell and the hero — a second copy is how a link goes stale | `src/lib/site-links.ts` |
| **The top bar carries no repository entry.** A GitHub mark means "go to GitHub" and nothing else, so pointing it at one of three repositories is arbitrary, scrolling it to the footer breaks that promise, and a modal for three links is over-designed. The bar holds brand · theme · one account entry; open source is carried by the hero's `View source` (above the fold) and the footer's ecosystem list | `src/layouts/MarketingLayout.vue` |
| The footer lists the **ecosystem** (plugin · server · dashboard) with roles, not one repository — the project is more than one repo, and a single link cannot say what the product is made of | `src/layouts/MarketingLayout.vue` |
| The footer's copyright line is `© <year> AhogeK` with **no "All rights reserved"** — MIT already grants those rights, so the phrase would contradict the licence two lines above | `src/layouts/MarketingLayout.vue` |
| Hero copy makes no unverified product claims (`no telemetry` was removed: a time tracker syncs your data by design) | `src/features/landing/views/LandingView.vue` |
| Own build chunk (`feature-landing`), not merged into the app bundle | `vite.config.ts` |
| Guard semantics: public = `requiresAuth` absent/false; **`guestOnly` would bounce signed-in visitors off `/`** | `src/router/guard.ts` + the E2E case in `e2e/landing/page.spec.ts` |

The hero copy shipped in P1 is a placeholder for the *layout*, not the final messaging — the capability
walkthrough, open-source block and pricing structure are still open (see `meta.md`).

## AuthLayout 背景：审计发现（**仅记录，不实施** — 技能实验期间实测，非本轮任务）

登录/注册页背景由 `src/layouts/AuthLayout.css`（独立 CSS，不在 `.vue` 里）提供，实测：

- **10 处 `animation: … infinite`**：网格 `mesh-shift 20s`；光斑 `orb-drift-1..6` = **15/20/25/18/22/16 s**；假光标 **1.2s**
- 六个光斑周期互质组合 → 最小公倍数 ≈ **39600 s ≈ 11 小时** → **永不重同步**，背景从不静止
- 周期最短的 1.2s 元素最抢眼，与前景 3D 卡片争焦点
- 手写 `:hover` 未包 `@media (hover: hover)`：本域相关文件含 `AuthLayout.css`（11 处）与 auth 各表单/视图；是否构成缺陷取决于该 hover 是否承载**必需信息**（纯装饰则无害）

**处置**：这不是待办 —— 按项目节奏，既有页面的动效统一在后续阶段处理；届时用 `motion-spec` 技能生成方案，而非当作规则约束。
