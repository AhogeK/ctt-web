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

**2026-09-21 已解决 ✓（真因比当初的记录深一层 ✗）**：除了下面那条 `forwards` 之外，`useCardTilt` 自身就是**死代码** ✗ —— `currentRotateX/Y` 是普通 `let`（非响应式 ✓）⇒ `computed` 的 `transform` **没有响应式依赖**、只求值一次 ✓；且 `rafId` **从不复位** ⇒ 动画循环只有第一次能起来 ✓。两处都改掉后才通 ✓。修法 = ① 三块组件删掉从未生效的 `baseRotate*`/`translateZ`（默认 0 ✓）② `AuthLayout.css` 两处 fill `forwards → backwards` ③ `currentRotate*` 改 `ref` + `rafId` 归零释放 ✓。**真机实测** ✓（1440×1000 ✓ 派生无头 ✓）：静止三块均 `matrix(1,0,0,1,0,0)` 且 rect == 布局尺寸 ✓；**悬停偏心点 → `matrix3d(0.998…)` 且 448×421 → 453×425（浮起 ✓）**；移开回恒等 ✓；reduce 下静止 ✓。**回归测试** `src/composables/__tests__/useCardTilt.test.ts` ✓（先红后绿 ✓ —— 旧实现两条全红 ✓）。 **同日再修一层：悬停"鬼畜"抖动** ✗✓（用户实测 ✓）—— `handleMouseMove` 每次读 `getBoundingClientRect()` ✓ 而那是**被 transform 之后**的盒子 ✓（倾斜会让它长大 448→453 ✓）⇒ 指针不动也会"盒子变大→归一化偏移变→目标角变→盒子再变"**自激振荡** ✓（单元测得旧写法同一点的目标角漂移 **0.55°** ✓）。修法 = 矩形在 `mouseenter` 取一次 ✓ 悬停期间冻结 ✓ + `mouseleave` 清空 ✓；真机复测同一位置连采 6 次（2s）**逐次完全一致** ✓✓。契约写死：**归一化必须用未变换的几何** ✗ 用投影后的矩形喂回 transform 必抖 ✓。 **还有一层：离开判定要迟滞** ✗✓ —— 倾斜会让卡片自己的边缘**从指针下滑走** ✓ ⇒ CSS 触发 `mouseleave` ⇒ 复位 ⇒ 指针又"在里面" ⇒ `mouseenter` ⇒ **每移一下就翻一次** ✓（连带 `:hover` 一开一关 ⇒ **光斑与边框闪烁** ⇒ 用户说"光斑不见了" ✓✓）。修法 = 指针只要仍在**冻结矩形 ±16px** 内就**不算离开** ✓ 且**重入不重采样** ✓；真机步进序列由"identity ↔ matrix3d 反复翻"变为 **0.998939 → 0.998745 → 0.998734 稳定收敛** ✓✓，三张卡各自悬停也均**有动/有光斑/有高亮** ✓（e2e 逐卡断言 ✓）。 **第三次修正（2026-09-21 用户给了参考实现 ✓）**：机制换成参考那套 —— **值只设目标、平滑交给 CSS** ✓（`transition: transform .6s cubic-bezier(.23,1,.32,1)` ✓）⇒ 逐帧 lerp 的"一段一段"✓ 与"离开不复原"✓ 一起消失（真机实测：跟随过程有 **5 个不同中间态** ✓ 离开后 **-0.029→-0.010→-0.003→-0.001→0** 逐步归零 ✓）；**分层 `translateZ`** 补回纵深 ✓（sheen 4 / inner 24 / content 30 ✓ 容器 `perspective:1000px` ✓）—— 旋转单独存在时读起来就是"平卡" ✓；**光斑 0.08 → 0.16** ✓（暗面板上 0.08 等于看不见 ✓）+ **悬停辉光 `0 0 28px 6px rgba(94,106,210,.18)`** ✓（只换边框色不叫"发光" ✓）。规格已入 `DESIGN.md` §10 ✓。 **指针光的四坑（2026-09-21 像素级实测 ✗✓✓）**：① **`mask-composite` 描边环在"自身或祖先带 `transform`"时完全不画** ✗（隔离复现：0–2 个 indigo 像素 ✓ 暗色真页同样 0 ✓）⇒ 而且它**照样要每帧重新栅格化** ✓ = 用着用着"一卡一卡"的真凶 ✓✓（删掉后 dev 与构建产物都锁 **60fps** ✓ 平均 16.7ms ✓ p95 17.4ms ✓）；② `overflow: hidden` 会把 `inset: -44px` 的泛光层**整个裁掉** ✗（实测卡外偏蓝 0 ✓）⇒ 面板改 `overflow: visible`（装饰层都是 `inset:0` ✓ 不会溢出 ✓）；③ 面板相关的 `background:` **简写**会**重置 `background-image`** ✗✓ —— 浅色悬停规则曾因此把指针光清成 `none` ✓（e2e 跑浅色 ⇒ 把它抓出来 ✓）；④ 正确的实现是**三层**：面板背景承载 1px 边框带的光（`border: 1px solid transparent` + `background-clip: border-box` ✓ 背景被 `border-radius` 裁剪 ⇒ **贴合圆角** ✓）、不透明 `__surface` 子层盖住内部（**无需遮罩** ✓）、`::before`（`inset: -44px`）做**卡外泛光** ✓；阴影里那圈均匀 indigo `box-shadow` 必须去掉 ✗（它画在边框盒**外**且**永不移动** ✓ = 用户说的"边框没贴合""没跟着光球走" ✓）。实测（面板 448×421 ✓ 指针在左下角内 18px ✓）：边框带偏蓝 暗 **+99** / 浅 **+102** ✓ 卡外泛光 暗 **+64** / 浅 **+61** ✓ 下一张卡污染 **0** ✓ 远端不亮 ✓ — 卡片需显式 `z-index`（1/2/3 ✓）才能让上方卡的泛光**不盖**到下方卡 ✗✓。 **用户对光斑的原始观感（2026-09-21 补充 ✓）**：光斑**不大不小 ≈ 卡片 1/4~1/5** ✓、**中心就是鼠标位置**（移进卡片时从指针处"展开" ✓ 贴边时只露约 1/4 ✓ —— 这是背景渐变被元素盒**天然裁剪**的结果 ✓ 不需要额外逻辑 ✓）、且**边框发光要跟着光斑走** ✓（实现 = 同一渐变 + `padding:1px` 与 `mask-composite: exclude` 蒙出 1px 环 ✓ 共享 `--sheen-x/y` ✓）。速度也定了调：**悬停期 `transform .16s`**（每次 mousemove 都会重启补间 ✓ 长了就显得"一段一段" ✓）、**基准 0.45s 只用于离开复原** ✓。 **还要在 `mouseenter` 就发布坐标** ✗✓ —— 渐变中心读的是 `--sheen-x/y` ✓ 而它们的**回退值是 `50% 50%`** ✓：只在 mousemove 里更新的写法会让"从边缘进入"的瞬间**在正中闪出一个完整的球** ✓（用户原话"鼠标进去也不是直接一个球" ✓）。进入时即按入口点发布 ⇒ 圆从**指针跨过边框的位置**展开 ✓，贴角时天然只露约 1/4 ✓（实测左边缘进入：`--sheen-x/y = 3px / 337px` ✓ 光斑与边框环同点 ✓）。回归测试：`useCardTilt.test.ts` 第 5 条 ✓（去掉该发布即红 ✓）。 **跟随/回正照 vanilla-tilt 源码对齐（2026-09-21 ✓ 逐字读过 1.8 版 ✓）**：① **"浮动"= 悬停 `scale(1.03)` ✓**（它的 `update()` 写 `scale3d` ✓，`reset()` 再收回 1 ✓）—— 没有缩放就只是原地摇晃 ✗；② **跟随 0.6s `cubic-bezier(.23,1,.32,1)`**（它自己的 CSS ✓）**回正 0.5s `cubic-bezier(.03,.98,.52,.99)`**（`mouseleave → setTransition()` 重挂的默认缓动 ✓ speed 被 `data-tilt-speed="500"` 覆写 ✓）—— 两条曲线**不同**才能又跟手又落得柔 ✓（CSS 的 transition 取"当前状态"那条 ✓ 所以 `:hover` 规则管跟随 ✓ 基规则管回正 ✓）；③ **手势绝不能用被变换元素的 `:hover`/`mouseleave` 判定** ✓✓✓（本轮最重要的一条 ✗✓）：浏览器对**投影后的四边形**做命中测试 ✓ ⇒ 面板一倾斜/一放大，自己的可点区域就从指针下跑掉 ✗ ⇒ `mouseleave` → 复位 → 四边形回来 → `mouseenter` ⇒ **面板自己打断自己** ✓✓ 实测拖动时 `:hover` 两帧即 false、`rotateY` 冻结在 -6.11°、整块落回 `0/0/1` 并每几百毫秒循环一次 ✓ = 用户说的"**一抖一抖一抖**" ✓。修法：**入场时冻结布局盒（此时面板处于静止态 ✓ 盒就是布局盒 ✓）+ 窗口级 `pointermove` 追踪** ✓ "指针是否还在里"只按那个冻结盒判定（容差 4px ✓）✓；**视觉（辉光/光斑/环/跟随曲线）改由我们自己的 `is-tilting` 类驱动** ✓ 不再挂 `:hover` ✓。实测：三次全程拖拽 391 帧 ⇒ `is-tilting` 翻转 **0** ✓ `scale` 变化 **0** ✓ 辉光翻转 **0** ✓ 中途落回 **0** ✓ `rotateY` 覆盖 ±6.56° ✓；④ 回正实测为**真补间** ✓（离开后采样 1.03 → 1.0201 → 1.0109 → 1.0056 → 1 ✓）。

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
