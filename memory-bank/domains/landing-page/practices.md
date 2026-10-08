# landing-page — practices

## Measured baseline (2026-09-19)

Same probe on every site; hit counts are how many elements/rules matched. **These are the values to
design against** — re-derive only if a source changes.

- Container width — **1200px** — hits 22 / 26 / 11 — Three-site consensus; narrow prose columns ~730–750px
- Spacing base — **8px grid** — `rowGap: 8px` hits 44 / 50 / 26 — Matches `DESIGN.md` "Base unit: 8px"
- Primary radius — **8px** — hits 22 / 67 / 89 — Pill/circle reserved for badges and avatars; matches `DESIGN.md`
  "Card (8px)"
- Transition duration — **0.15–0.2s** — Most elements declare `0s` (1142 / 1145 / 1092)
- h1 size — **64px** — 4 of 5 sites — Supabase 46px is the outlier
- h1 weight — **≤600** (510 / 500 / 600) — No reference uses 700+
- h1 line-height — **1.0–1.1** — 64/64, 64/70.4, 46/46 — never 1.5
- Letter-spacing — **size × −0.022em** for display sizes — Linear: 64 → −1.408px, 40 → −0.88px (exact)
- Breakpoints — **640 / 768 / 1024 / 1280** — Tailwind defaults; `DESIGN.md` §8's six tiers map onto them
- motion-reduce — `motion-reduce:transition-none` · `duration-0` · `animate-none` — The Tailwind form of
  `prefers-reduced-motion`
- Sticky positioning — 0 / 1 / 0 sites — Use sparingly

## Component archetypes

- Sticky nav — `sticky z-30` + `top-[header-height]` + `bg-background/90` + `backdrop-blur-xs` + `border-b`;
  absolute wrapper `pointer-events-none`, inner `pointer-events-auto`
- Dropdown — State in a hook (`{open, setOpen}`); `data-state` + `aria-selected` kept in sync; `Escape` / arrows handled
- Mobile menu — `{open, setOpen}` hook + Sheet/Dialog (focus trap, scroll lock, `aria-modal`)
- FAQ accordion — `data-state=open/closed` drives everything: icon via `[&[data-state=open]>svg]:rotate-180`,
  content via `animate-accordion-up/down`, `duration-200`, `motion-reduce:*` counterparts

## Traps

- **Do not copy a reference's numeric offset.** Supabase's `top-[65px]` is *its own* header height;
  take ours.
- **A gap in a document is not a gap in the code.** The `color-scheme` / `prefers-color-scheme`
  absence was in `DESIGN.md`; `src/` implements both.
- **Do not describe the mechanism from memory.** The accordion is driven by keyframe utilities, not
  by a CSS variable — the wrong version was nearly written as fact.
- **A frosted bar must not be pinned by `sticky`.** A `backdrop-filter` pass is dropped as one unit
  under repaint churn (tint included), so text flashes through a sticky bar at full strength; the
  same glass on a `fixed` bar survived identical stress (measured 2026-10-08). Keep the glass.
- **Screenshots are the weakest evidence.** Reading code, computed styles and source is what turned
  impressions into rules.

## Shipped so far (P2 first slice — the section primitive)

- One shell for every marketing band: container 1200px · prose 730px · rail 24→32px · rhythm none/sm/md/lg (80→48px)
  — `src/features/landing/components/LandingSection.vue`
- The primitive is the **only** place those four decisions are made — later sections pass `spacing`/`width` instead
  of inventing padding — same file
- Its test was falsified before being trusted (wrong container width ⇒ red) — `__tests__/LandingSection.test.ts`

## Shipped so far (P4 — the closing bands, 2026-10-04)

- Below the stage the page closes with three ordinary bands — capabilities, the pipeline, open source (the free band
  joined them in P5, below) — and all
  three carry the page's fade language, the phone's 600ms state fade extended to desktop (one `[data-reveal-band]`
  marker, looked up inside the view root; the footer deliberately stays plain — the page's last block needs no
  entrance; asserted); every figure is the product's own: 24 boards = the leaderboard contract's seven rankings ×
  the periods each supports, 67 badges × 14 ladders = the achievements contract, convergence = the sync engine,
  devices/keys = dashboard pages — `LandingCapabilities.vue` · `LandingHowItWorks.vue` + `leaderboard.schema.ts`
- The `#source` anchor lives on the open-source band (`scroll-mt-16`): the no-JavaScript destination of both source
  entries; the footer keeps its ecosystem list as the catalogue — `LandingOpenSource.vue` + `MarketingLayout.vue`
- The deploy snippet is the server README's quick start verbatim; the copy action sits in a bar row inside the
  block — an overlaying button covered the first line's tail at phone widths (measured) — and per-repo licences
  (Apache-2.0 plugin, MIT server & dashboard) sit beside the repos; the footer's blanket "under the MIT license"
  sentence was dropped because it flattened them — `LandingOpenSource.vue`

## Shipped so far (P5 — the free band & support channels, 2026-10-08 · v0.55.11)

- The pricing band became the **free band**: `LandingFree.vue` states "Free, every part of it" and renders
  `run-options.ts` — self-host (`Free`, starts at `#source`) and hosted sync (`Not offered today`, no control at
  all). The price-card shape was a paid-model artefact, and the hosted entry's "price published before it can be
  bought" copy went stale under the free model.
- **Nothing is ever for sale** stays the section's standing rule: a `status` entry renders its label where a
  figure would sit; the unit test still forbids digits in the shipped entries.
- Donation placement (researched against Blender, 2026-10-08): one calm block inside the free band plus a footer
  line — never the hero, never the top bar, no banners. Channels are data in `site-links.ts`
  (`SUPPORT_CHANNELS` — Ko-fi / Afdian / Solana, the same list the plugin uses).
- The "data can be exported and moved out at any time" sentence was **dropped**: intended as no-lock-in, it read
  as a data-risk hint (user review). Self-host keeps the positive form — "your data stays on hardware you control".
- e2e: the `landing-free` test (statement, two options, hosted carries no control, support hrefs); the footer
  link count is now 6 (3 repos + 3 channels).
- One shell recipe for the whole page (2026-10-08): every group — top bar, hero, bands, footer — renders the same
  1440px box with the shell's own rail (16px, 24px from `sm`). The rail sits *inside* the box; a rail on the outer
  element shifts the box itself, which is exactly what kept the edges apart. Measured at 1512: header text, h1, every
  band heading and the footer all start at 60; boxes 36..1476; no overflow. History: bands were a 1200px grid and the
  footer briefly carried its own 1200 container plus a 24px inset (180 vs 156) until 1440 became the one width.

## hero 动效实测与陷阱 → 已迁入 [`hero-composition.md`](hero-composition.md) ✓（同类实测只留一个家 ✓）

## 主题首帧与粘性偏移的两条契约（2026-09-20 实测，均已交付）

**首帧主题脚本必须外链，不能内联** ✗：`index.html` 的 CSP 是 **`script-src 'self'`**（无 `unsafe-inline`）→ 内联脚本会被静默拦截。做法 =
`public/theme.js`（**经典脚本**，非 `type=module` ✗，否则会延迟到解析后 ✗）+ `<head>` 内、**在 CSP meta 之后、应用模块之前**引用 ✓。

**脚本要读的键是 `vueuse-color-scheme`，不是 `theme-appearance`** ✗✓ —— 后者只是用户选择的模式（`light|dark|auto`），**视觉状态**由 VueUse
`useDark`（`storageKey` 默认值 ✓ 已在其源码确证）持久化。两者取值均为**裸字符串**（无 JSON 引号 ✓）；缺失或 `auto` → 回落
`matchMedia('(prefers-color-scheme: dark)')` ✓；并同步 `documentElement.style.colorScheme` ✓（原生滚动条/表单控件跟随）。判据：**拦掉应用
bundle 后**仍能看到首帧 class 正确 ✓（无隔离则无法区分是谁设的 ✗）。

**粘性偏移只有一个来源**：`--marketing-header-height`（定义在 `MarketingLayout.vue` 壳元素 ✓ 3.5rem）→ 任何需要吸在顶栏之下的元素写
`sticky top-[var(--marketing-header-height)]` ✓。参照物用 `top-[65px]` 是**它们自己的 header 高度** ✗，抄数值就是两条栏重叠的成因 ✓。验收判据：
**变量解析值 == header 的 `getBoundingClientRect().height`** ✓（56px ✓ 已测），变量与类名一旦脱钩即红 ✓。

