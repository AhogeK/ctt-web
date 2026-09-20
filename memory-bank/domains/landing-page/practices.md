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
| Hover gating — **closed 2026-09-20** ✓ | All **16 hand-written** `:hover` rules in `src/` are now wrapped (`ThemeToggle` 2 · `AuthLayout.css` 11 · `ScrollFadeList` 2 · `TermsDialog` 1). Tailwind variants need nothing — v4 compiles them into the same query (counted in the served CSS ✓). | Proof: real browser, same element, `hover: hover` → colour changes; `hover: none` → **unchanged** ✓✓ |
| **Emulating `hover: none`** | `page.emulateMediaFeatures([{ name: 'hover' }])` is **unsupported** (throws `Unsupported media feature: hover`) — and swallowing that error makes a "touch" run silently execute under desktop conditions, inverting the conclusion ✗ | Use `page.emulate({ viewport: { isMobile: true, hasTouch: true }, userAgent: <mobile> })`, which does flip `hover: hover → none` and `pointer: fine → coarse` ✓ |
| Hover gating — the measurement story | Earlier: "`@media (hover: hover)` 0 hits in `src/`" ⇒ recorded as a repo-wide gap. **Wrong**: Tailwind v4 compiles the `hover:` variant *into* `@media (hover: hover)` — the built CSS carries **8** occurrences for **0** in source. The measurement looked at source and concluded about output. | The real instance is the **hand-written** CSS: `ThemeToggle.vue`'s `.theme-toggle:hover` (and `:root:not(.dark) …`) sit **outside** any `@media (hover: hover)` — verified in the built CSS — so a tap can leave the hover style stuck. Wrap hand-written `:hover`; Tailwind variants need nothing. |
| Touch targets — **already specified** | `DESIGN.md` §8 now carries "**Minimum target: 44×44 CSS px for anything clickable**" with its basis (Apple HIG 44pt · Material 48dp · WCAG 2.5.8’s 24px as the floor) | Nothing to propose — components read §8 |
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

## Shipped so far (P2 first slice — the section primitive)

| Fact | Where it lives |
| --- | --- |
| One shell for every marketing band: container 1200px · prose 730px · rail 24→32px · rhythm none/sm/md/lg (80→48px) | `src/features/landing/components/LandingSection.vue` |
| The primitive is the **only** place those four decisions are made — later sections pass `spacing`/`width` instead of inventing padding | same file |
| Its test was falsified before being trusted (wrong container width ⇒ red) | `__tests__/LandingSection.test.ts` |

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

## AuthLayout 三块 3D 面板的**静止契约**（2026-09-20 实测）

`.auth-dashboard` + 两张 `.auth-card-3d` 的静止外观由**入场动画的填充分布**决定，**不是**由
`useCardTilt` 的参数决定：

- 入场关键帧 `to` 是 `translateZ(0) rotateX(0) rotateY(0) rotateZ(0) scale(1)` = **平且同深度**
- `animation-fill-mode: forwards` 让它在播完后**永久占据 `transform`** ⇒ 组件的
  `baseRotate*`（15/-20/-3 · 10/-15/2 · 18/-25/-4）与 `translateZ`（**40 / 0 / −60**）**从未生效**
  ⇒ 原设计里三块静止时**一律平正、同尺度**
- 场景 `perspective: 1000px` 的作用只在播放中：`from` 的 `translateZ(-200px)` 把它们从远处拉近

**把 `forwards` 改成 `backwards` 会解锁内联 transform** ⇒ 顶面板立刻按 `translateZ(40px)` 朝观察者
放大、并因透视发虚（另两张 Z=0/−60，肉眼只在最上面那张看到）。症状原话：**"进场停下后突然卡片
变大一圈变模糊"**。用户的判据是"**静止必须方方正正**"。

**要让静止保持原样、同时让悬停能动，两条必须同时成立（方案 · 待用户确认）**：
1. `baseRotateX/Y/Z` 与 `translateZ` **全部归零** ⇒ 静止 = 恒等矩阵 = 与原像素同一
2. 再把 `forwards` → `backwards`（否则动画播完后仍压住悬停的 transform）

**验收判据（针对该症状）**：静止时 `getBoundingClientRect()` 尺寸 == 布局尺寸，且
`getComputedStyle(el).transform` 为恒等矩阵；一旦出现放大/模糊即红。

**探针陷阱（都实测过）**：`browser.open({ viewport })` **未生效**（页面报 `vw=1200` ⇒ 低于左栏断点
⇒ 面板 `display:none` ⇒ 0×0，所有断言都在量隐藏元素）；必须 `page.setViewport({width:1440,height:1000})`
显式设置。`page.mouse.move` 移到卡片**正中**时倾斜量恒为 0（`x−0.5` 就是零点），必须量**偏心**位置。

## AuthLayout 背景：审计发现（**仅记录，不实施** — 技能实验期间实测，非本轮任务）

登录/注册页背景由 `src/layouts/AuthLayout.css`（独立 CSS，不在 `.vue` 里）提供，实测：

- **10 处 `animation: … infinite`**：网格 `mesh-shift 20s`；光斑 `orb-drift-1..6` = **15/20/25/18/22/16 s**；假光标 **1.2s**
- 六个光斑周期互质组合 → 最小公倍数 ≈ **39600 s ≈ 11 小时** → **永不重同步**，背景从不静止
- 周期最短的 1.2s 元素最抢眼，与前景 3D 卡片争焦点
- 手写 `:hover` 未包 `@media (hover: hover)`：本域相关文件含 `AuthLayout.css`（11 处）与 auth 各表单/视图；是否构成缺陷取决于该 hover 是否承载**必需信息**（纯装饰则无害）

**处置**：这不是待办 —— 按项目节奏，既有页面的动效统一在后续阶段处理；届时用 `motion-spec` 技能生成方案，而非当作规则约束。
