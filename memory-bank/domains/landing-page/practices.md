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

## Shipped so far (P3 stage A — the hero's product evidence, 2026-09-26)

| Fact | Where it lives |
| --- | --- |
| The hero's right column renders **the dashboard's own components** from example data — no screenshot, no illustration, no canvas | `src/features/landing/components/LandingHeroPreview.vue` |
| `SummaryStatGrid` is the **presentational half** of the dashboard's overview row (markup + testids), split out of `SummaryCards` so a surface with no query client can render the same cards: one implementation, two consumers | `src/features/dashboard/components/SummaryStatGrid.vue` + `summary-stat-fields.ts` |
| Language ranking reuses the real row model (`useRankedDistribution`) — share, bar length and the folded tail are derived, never hand-written | `LandingHeroPreview` + `src/features/dashboard/composables/useRankedDistribution.ts` |
| Example data is one module and **always labelled** (`Example data` badge + note); `total` is *derived* from the language list because two hand-written numbers drifted apart the first time (90h list beside a 3148h total ✗) | `src/features/landing/demo-data.ts` |
| Acceptance is now **asserted, not probed** (first screen: h1 + primary CTA + framed preview · `LCP = H1` · 0 img/canvas · 375 no overflow) | `e2e/landing/page.spec.ts` |<br>hero composition: **two interlocking planes** (left copy; product plane; a floating *statistics* card crossing 60px into it), the four reference measurements, the decorations the user rejected, and the `.dark [data-surface]` position trap → `hero-composition.md`
| The heatmap is **deliberately not** in the hero: it draws on ECharts' canvas and pulls the chart bundle, which contradicts the LCP criterion ✗ | recorded here so it is not retried |

## hero 动效：权威在 `DESIGN.md` §10，这里只记实测与陷阱（2026-09-21 ✓）

参照物按用户指定改用 **Apple 产品页**（不是首页 ✗）：`animation-timeline` 3 · `position:sticky` 12 条 · `prefers-reduced-motion` **27** 块 · 媒体层由滚动进度驱动 `translateY 180px → 0`，而 **h1 全程不动** ✗ → 挂在滚动上的是**媒体层**，不是文字 ✓。

- **入口构造** ✓：入场只在 `@media (prefers-reduced-motion: no-preference)` 里**声明** ✓，不靠"时长归零" ✗ —— `main.css` 的全局规则只归零 `duration` ✓，`animation-delay` 照常兑现 ✓ → "从隐藏出发"的入场会在延迟期一直不可见 ✗（技能点名的陷阱 ✓）。实测 reduce 下 `getAnimations() = []` ✓、`opacity: 1 / translate: none` ✓。
- **LCP 元素不做透明** ✓：h1 只位移不淡入 → 首帧即有像素 ✓。三次对照：无减动效 **252/256/252** vs reduce **256/260/256** ✓（入场不拖首绘 ✓）。
- **顶部 hero 没有"进入"滚动段** ✗（加载时已在视口内 ✓）→ 滚动叙事只能是**离场交棒** ✓（`animation-timeline: view()` + `animation-range: exit` ✓）。
- **交棒必须分级** ✗✓：exit 区间 = 一屏高，而本页可滚动量只有 **281px（37%）** → 未分级的淡出会让"滚到底"停在 `opacity 0.63` = 发灰 ✗ → 改为**位移全程 + 淡出只占后半段** ✓。实测 y=281：`opacity=1` / `translate=-14.86px` ✓（= −0.371 × 40，与公式逐点吻合 ✓）；回滚复原 ✓。
- **探针陷阱**：`browser.open({ viewport })` 仍不生效 ✗ → 用 `page.setViewport` ✓；页面比视口短时 `window.scrollTo` 恒为 0 ✗（先量 `scrollHeight > innerHeight` ✓）。
- **验证结论**：type-check ✓ · 单测 **1443/1443** ✓ · landing e2e **3/3** ✓（跑 `vp preview` 生产构建 → 证明 `@layer` + `@media` + `@supports` 嵌套与关键帧过了构建管线 ✓）。

## 主题首帧与粘性偏移的两条契约（2026-09-20 实测，均已交付）

**首帧主题脚本必须外链，不能内联** ✗：`index.html` 的 CSP 是 **`script-src 'self'`**（无 `unsafe-inline`）→ 内联脚本会被静默拦截。做法 = `public/theme.js`（**经典脚本**，非 `type=module` ✗，否则会延迟到解析后 ✗）+ `<head>` 内、**在 CSP meta 之后、应用模块之前**引用 ✓。

**脚本要读的键是 `vueuse-color-scheme`，不是 `theme-appearance`** ✗✓ —— 后者只是用户选择的模式（`light|dark|auto`），**视觉状态**由 VueUse `useDark`（`storageKey` 默认值 ✓ 已在其源码确证）持久化。两者取值均为**裸字符串**（无 JSON 引号 ✓）；缺失或 `auto` → 回落 `matchMedia('(prefers-color-scheme: dark)')` ✓；并同步 `documentElement.style.colorScheme` ✓（原生滚动条/表单控件跟随）。判据：**拦掉应用 bundle 后**仍能看到首帧 class 正确 ✓（无隔离则无法区分是谁设的 ✗）。

**粘性偏移只有一个来源**：`--marketing-header-height`（定义在 `MarketingLayout.vue` 壳元素 ✓ 3.5rem）→ 任何需要吸在顶栏之下的元素写 `sticky top-[var(--marketing-header-height)]` ✓。参照物用 `top-[65px]` 是**它们自己的 header 高度** ✗，抄数值就是两条栏重叠的成因 ✓。验收判据：**变量解析值 == header 的 `getBoundingClientRect().height`** ✓（56px ✓ 已测），变量与类名一旦脱钩即红 ✓。

## 可点击元素的光标：一处全局规则（2026-09-20 用户报缺 ✗）

**Tailwind v4 的 preflight 故意把 `button, [role=button]` 设成 `cursor: default`** ✗（v4 的既定破坏性变更 ✓），所以指针要逐处补回 ✓ —— 而"散补"漏掉了真的：**shadcn 的对话框关闭按钮**（= 每个对话框的 X ✗，用户举的例子 ✓）· `SidebarRail` · auth 表单的 `<label for>` ✗。全仓当时只有 24 处 `cursor-pointer` ✓。

**修法** ✓：在 `src/assets/main.css` 的 `@layer base` 里一条规则覆盖 `button:not(:disabled)` · `[role=button]` · `[role=tab]` · `[role=menuitem]` · `label[for]` · `summary` · `select:not(:disabled)` ✓✓ —— **禁用态不排除**（用 `:not(:disabled)` ✓ 保持 `default` ✓，禁用控件不该给手型 ✓）。

**验收判据（可失败 ✓）**：页面里**注入一个无任何类的裸 `<button>`** ✓ —— 那正是 shadcn 关闭按钮的处境 ✓ —— 计算 `cursor` 必须为 `pointer` ✓；同页所有 `button/[role=button]/label[for]` 扫一遍必须**全为 pointer** ✓，禁用按钮**保持 default** ✓。

## 颜色只有令牌一条路（2026-09-20，全仓清零 ✓）

三条债都清完了：**方括号字面量 245 → 0** ✓ · **Tailwind 调色板类 177 → 1** ✓（仅剩一个琥珀发光 ✗）。做法与可复用的判据：

- **先按角色映射，再动手** ✓：`gray-900 → foreground` ✓ · `gray-700/600 → foreground/90|80`（**令牌 alpha** ✓，与仓库既有的 `border-border/60` 同一手法 ✓）· `gray-500/400 → muted-foreground` ✓ · `red-* → destructive` ✓ · `green/emerald-* → success` ✓ · `amber/yellow-* → warning` ✓。
- **数字色阶不能压成一个令牌** ✗：`text-amber-900` 配 `bg-amber-50` 是高对比 ✓；压成单一 warning 色会变低对比 ✗ = 把无障碍改坏 ✓ → 所以警告要**三件套**（ink · surface · border ✓），取值直接取代码里**既有**色阶 → 近乎零视觉变化 ✓。
- **断言必须能失败** ✓：本次"非目标族残留 = 0"的断言抓出**两次漏网**（16 处 + 13 处 ✗✓）——没有它，那些前缀组合会静静留下 ✓。
- **每轮收尾复查 `git diff --name-only`** ✗：一次全仓 `vp fmt src/` 顺手重排了一个**无关文件**（`AuthLayout.css` 18 行纯格式 ✗）→ 已 `git restore` 撤掉 ✓。格式化只对**本轮改动的文件**跑 ✓。

## 字重工具类被「无层」重置压死（2026-09-20 实测，已修 ✓）

`src/assets/base.css` 曾有 `*, *::before, *::after { box-sizing: border-box; font-weight: normal; }` ✗ —— **无层（unlayered）CSS 的优先级高于任何 `@layer`** ✗✓，而 Tailwind 的工具类都住在 `@layer utilities` 里 ⇒ 这条通配符把**全站 98 处** `font-*` 一并压成 400 ✓✓（实测：连自己构造的 `.font-bold` 探针计算值都是 400 ✓）。

- **为什么难发现** ✓：`font-size` / `letter-spacing` 不在那条重置里 ✓ → 它们照常生效 ✓，现象只剩「字看着偏细」✗，不报错、不漂移 ✓；而且它是**既有**问题 ✗ —— `8413845 fix(css): remove unlayered margin reset for Tailwind v4` 只修了同一块里的 `margin` ✗✓，另一半留在原地 ✓。
- **修法** ✓：删掉那一行 ✓。preflight 本就负责标题字重 ✓（`h1,h2,h3,h4,h5,h6{ font-size:inherit; font-weight:inherit }` ✓），那条通配符实际只会削掉 `<b>` / `<strong>` / `<th>` 的字重 ✗。
- **验收判据（可失败 ✓）**：`getComputedStyle` 上 `.font-medium` → 500 · `.font-semibold` → 600 · `.font-bold` → 700 ✓；这条修好之后，标题阶梯要求的 **510** 才可能生效 ✓（同轮实测 h1 = 64px / 510 / −1.408px / 行高 1 ✓✓）。
- **通用教训** ✓：写下 `*` 选择器前先问「它会不会压掉一整层工具类」✓；同一个块里出现过的同类错误，**要一次查完该块的每个属性** ✗ —— `8413845` 的教训写在 commit 里了 ✓，但只修了一半 ✓。

## ThemeToggle 的对比度告警是**假阳性**（2026-09-20 实测，不要再改颜色 ✗）

SonarLint `css:S7924` 报了 `ThemeToggle.vue` 的四条 `color:` 声明（两个主题 × 静止/悬停）。**四条全部不成立** ✓，原因有两条，都可复现：

1. **该元素没有文字** ✗ —— 按钮里只有一个 `<Icon>`（实测 `textContent.trim().length === 0` ✓）。所以规则引用的 WCAG **1.4.3 文本对比（4.5:1）不适用** ✗；真正适用的是 **1.4.11 非文本对比（图形与 UI 组件 ≥ 3:1）** ✓。
2. **静态分析没有把半透明背景叠加到页面底色** ✗ —— 它按元素自身的 `rgba(255,255,255,0.02)` / `rgba(0,0,0,0.02)` 判 ✗，于是深色底上的近白色图标被误判 ✓。

**稳态实测**（等过 0.2s 颜色过渡后再读 ✓ —— 早读会读到过渡中间值 ✗，例如深色静止曾读到 `rgb(143,148,156)`）：

| 状态 | 图标色 | 有效底色 | 比值 |
| --- | --- | --- | --- |
| 深色·静止 | `#d0d6e0` | `rgb(20,21,22)` | **12.54 : 1** |
| 深色·悬停 | `#f7f8f8` | `rgb(27,28,29)` | **16.05 : 1** |
| 亮色·静止 | `#62666d` | `rgb(249,249,249)` | **5.49 : 1** |
| 亮色·悬停 | `#1a1a2e` | `rgb(244,244,244)` | **15.54 : 1** |

四种状态**连更严的文本标准 4.5:1 都通过** ✓（最差 5.49 ✓）→ 结论：**不要为一个坏分析器调色** ✗；而是要消灭"手写两套主题"这个温床 ✓。

**处置（2026-09-20，已执行 ✓）**：组件改成**全部走语义令牌**（`src/assets/main.css` 的 `@theme` ✓），手写的 `<style scoped>` 与 `:root:not(.dark)` 复制块**整体删除** ✓：

| 角色 | 令牌 | 暗 / 亮 |
| --- | --- | --- |
| 图标·静止 | `text-muted-foreground` | `#8a8f98` / `#62666d` |
| 图标·悬停 | `text-foreground` | `#f7f8f8` / `#08090a` |
| 表面 | `bg-transparent` → `hover:bg-secondary` | `#0f1011` / `#f3f4f5` |
| 边框 | `border-border` | `rgba(255,255,255,0.08)` / `#d0d6e0` |
| 焦点 | `focus-visible:ring-2 ring-ring` | 与全应用同一套 ✓ |

**改后实测**（同样的叠加与稳态方法 ✓）：**5.86 / 17.90 / 5.74 / 18.10** ✓ —— **最差 5.74:1** ✓（比改前的最差 5.49 **更好** ✓✓，因为亮色悬停文字从手写的 `#1a1a2e` 换成令牌 `#08090a` ✓）。原先那 12 个手写值里有 **10 个**就是这些令牌的精确值或 ΔE<1.7 的近似 ✓ —— 所以这次迁移的**可见差异几乎为零** ✓，换来的是：一套主题定义、悬停守卫由 Tailwind 的 `hover:` 变体自动获得（不再需要手写 `@media (hover: hover)` ✓）。**`DESIGN.md` 无需新增令牌** ✓（每个角色都已有归属 ✓；为不存在的东西造一个 token 只会留下死规范 ✗）。

- **一个真案例（2026-09-24 ✓ 勿与上条混为一谈 ✗）**：hero 眉题 `text-primary`（`#5e6ad2`，14px/500）**运行时**实测 **4.24（暗）/4.42（亮）** ✗ —— 判据三重独立吻合：canvas 归一化运行时读数 ✓ · 逐层 alpha 叠加 ✓ · 解析式计算 **4.243 / 4.416** ✓；与上条不同在于上条是**静态分析**未叠加背景 ✗ 且元素无文字 ✗，本条元素确有 14px 文本 ✓ 且为稳态令牌值 ✓。**单一紫色令牌无法双主题同时过线** ✓（`--accent` 暗 5.19 ✓ 亮 3.61 ✗；`--accent-hover` 暗 6.95 ✓ 亮 2.69 ✗）⇒ 修法属设计决策 ✓ —— **用户 2026-09-24 已目视确认"不改"** ✗（R30 冻结 ✓ 记录见 `.omp/qa/visual-qa.md` ✓）。

> **AuthLayout 三块 3D 面板的静止契约 · 指针光三层 · 探针陷阱**已迁出 → [`archives/2026-09-30-landing-practices-trim.md`](../../archives/2026-09-30-landing-practices-trim.md) ✓（属 auth 面；2026-09-21 已交付 ✓）


## 首屏可见性的两条**视口例外**（P0，2026-10-01）

「构图完全不动」与「把视口外的 h1 放回首屏」**不可能同时成立** ⇒ 例外必须显式、按视口限定 ✓（评审结论）。

- **手机（<1024px）退出舞台** ✓：`.stage` / `.stage-pin` / `.beat` / 两条 `animation` 全部限定在 `@supports (animation-timeline: scroll())` + `no-preference` + `min-width: 1024px` 内 ⇒ 退回文档流。实测 375×812：h1 `113→369` 完整可见 · CTA 在首屏 · 产品窗自 `693` 露出 · `overflow = 0` ✓。
- **矮桌面（`max-height: 840px`）** ✓：hero 幕加 `margin-block-start: 1.25rem`（**非 transform** ⇒ 不与动画的 `translate` 竞争）；整幕一起下移 ⇒
  相对构图不变。实测 1440×800 净空 **11.6px**（1rem 时仅 7.59px ✗ 差 0.41）；**900/1080 与改动前快照逐值相同** ✓。
- **后备态布局坑** ✗：`.stage-pin` 的 `flex items-center` 在舞台关闭时会把节拍**并排**（375 实测第二条 `left=375` ⇒ 多出 375px 横向滚动 ✗，
  此前被 `overflow: clip` 掩盖 ✗）⇒ 无条件 `flex-direction: column` ✓（两种模式都对 ✓）。
- **门禁（`e2e/landing/composition.spec.ts`，现 11 条）** ✓：关系 2 · 亮暗几何一致 · CTA/平面折叠线 · **快照逐矩形比对（900/1080）** · 800 净空 ≥8px · 手机文档流三要素 · 手机动效 · 桌面不受影响 · reduce 终态；反向验证：把浮卡压回文档流即变红 ✓。
## 手机滚动动效（2026-10-01：拆成一步一屏，逐件错开）

手机（≤1023px）**第一屏只放"是什么 + 按钮"**（`.hero-copy` 占满一屏并居中 ✓），其余都是后续步骤：演示窗① → 演示窗② → 年网格 → 每张奖杯卡；**动的是每一件**（标题/说明/按钮/各块标题/格子/卡片/两个演示窗），区间各自相对自身位置 ⇒ 顺序与错开由版面自然产生 ✓。
实测 375×812：载入时标题·说明·按钮 `1 / 0`、两个窗与内容 `0 / +48px` 在下方等；0.8 屏 **窗① `0.9` 而窗②仍 `0`** ✓；1.4 屏 窗① `1`、窗② `0.87` ✓；出场**整块一起**（`1.00 → 0.90 → 0.73 → 0.56 → 0.39 → 0.22 → 0.05`；逐件退场会把引言撕开：标题 `0.43` 时按钮仍 `1.00` ✗）；三张奖杯卡 `0.43 → 0.06 → 0` ✓。桌面：标题/说明仍是原来两个动画、五个新挂钩全 `none` ✓；reduce 全 `none` 且不透明 1 ✓。
> 八条纪律：**"读起来是一块"的内容就按一块做动画** ✗（年网格 + 奖杯阶梯是一个区 ⇒ 整块渐入渐出，逐件做会让一半在淡、一半清晰 ✗）；**距离规则分两种** ✗：不高于一屏的件用 `cover 0–30% / 65–100%`（距离 ≈ 高度+一屏的 30%/35% ✓），高于一屏的大块用自身 `entry 0–45% / exit 55–100%`（cover 百分比会让大块长时间半淡 ✗）；**不许突然出现/消失** ✗（判据：每 100px 变化 ≤0.35，实测 ≤0.29 ✓）；**中段必须 ≥0.95** ✗；**每件都要有退场** ✗；**引言那种"读起来是一块"的退场整块** ✗；**进场逐件、容器不参与** ✗；**两条动画 fill 不能都是 `both`** ✗（须 `both, forwards`）；**"占满一屏"只用高度、绝不居中** ✗。
## Shipped so far (P3 stage B — the staged landing, 2026-09-30)

| Fact | Where it lives |
| --- | --- |
| The landing is a **pinned stage**, not a stack of bands: a track (300svh) holds a sticky full-height stage, and each beat is positioned in it | `src/assets/main.css` (`.stage` / `.stage-pin` / `.beat-*`) |
| A beat **parks at the centre** and stays — the blog's own maths (`translateY` 120 → 50 in viewport units, `-50%` of its own height cancelling out) | `beat-lead` / `beat-hold` keyframes |
| The hand-off is **sequential, never superimposed**: hero fades out over `0→90svh`, the beat arrives `80→180svh`. Measured: the product of the two opacities is 0.000 at every sampled scroll | same file |
| The **last** beat holds to the end of the track — a beat that reused the "leave upward" keyframe faded the page's own content out at the bottom | `beat-hold` |
| Degradation is structural: the absolute layout lives **inside** `@supports (animation-timeline: scroll())`, so without it (or under reduce) the beats are ordinary sections in normal flow | same file |
| One arriving beat, holding **both** the year grid and the trophy ladders: they answer the same question, so they share a screen | `LandingActivityBeat.vue` |
| The grid is the product's own ladder — `<15m · 15–60m · 1–2h · 2–5h · 5–8h · >8h` — in DOM, because the dashboard's version is an ECharts option that cannot be extracted | `LandingActivityGrid.vue` |
| Example data must survive a reader's eye: **no week column may be all-zero**, Sunday is light (0.9h base, 34% off) not empty, and the daily multiplier must span more than one bucket or a weekday row is one flat colour for a year | `demo-data.ts` + `__tests__/demo-data.test.ts` |
| The year's trailing seven days **are** `EXAMPLE_SUMMARY_SECONDS.thisWeek`, and the trophies are built by `buildTrophies()` — cross-surface arithmetic cannot drift | `demo-data.ts` |
| Acceptance asserted: beat top == viewport centre (±4px) · 364 painted days · 3 trophy cards · no horizontal overflow at 375 | `e2e/landing/page.spec.ts` |
| Reference measurements behind the layout (5 product pages probed): none uses `position: sticky` for its tour (Linear 0, Supabase 1 = header); they use scroll-driven animation (Linear 5018 elements, Supabase 7746); one beat ≈ 1–1.5 screens and the artefact spans the container | this session's probe, `/tmp/ref-verify` |
