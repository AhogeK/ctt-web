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
- Mobile stage-end: the stage carries **no bottom spacer** — the bands follow it directly and each band's own
  rhythm separates them (the pre-P4 `32svh` spacer read as a 292px empty screen on a phone; removed v0.55.15).
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

**粘性偏移只有一个来源**：`--marketing-header-height`（`main.css` 的 `:root` ✓ 3.5rem；v0.55.20 起两分支在 shell 之外 ⇒ 定义上移）→ 任何需要吸在顶栏之下的元素写
`sticky top-[var(--marketing-header-height)]` ✓。参照物用 `top-[65px]` 是**它们自己的 header 高度** ✗，抄数值就是两条栏重叠的成因 ✓。验收判据：
**变量解析值 == 顶栏内容高** ✓（56px；v0.55.20 拆分后含边框总剪影 57px = `calc(token+1px)` ✓ 已测钉），变量与类名一旦脱钩即红 ✓。

## 顶栏两固定分支（2026-10-11 · v0.55.20）

- 结构：body 级 mount `#marketing-header-root`（在 `#app` 前）下两个 fixed 分支——`blur 支`（`.marketing-backdrop`，仅模糊，
  `pointer-events:none`）与`可读支`（`.marketing-header`：80% tint + 边框 + 品牌/控件）；**tint/边框归可读支**（玻璃被跳过时，
  可读面必须独立存在 ✓）；两支互不为祖先（契约用例钉 ✓）。
- mount 保持无效果：无 transform/filter/containment（否则重耦合或改变 blur 采样 ✓ 已测钉）。
- 令牌：`--marketing-header-height` 上移 `:root`；层序 30/31 登记 `DESIGN.md` §6。
- **border-box 陷阱**：显式 `block-size` 连边框一起算 ⇒ 可读支须 `calc(token + 1px)`（57px 旧剪影）；漏掉即整条底边上移 1px
  （像素比对抓出 ✓）。
- 验收：像素比对 **threshold=0**（任何 1 单位色差即红）；覆盖 顶部+滚动位（背景过 blur 区）× 亮/暗 + 375；Tab 首个落点在栏内 ✓。
- 拆分后仍现的推进序：缺失范围 → 关闭提示单变量（will-change/translateZ；**代码中无 clip-path**，前文系转述错误）→
  reveal 有/无 → 并发 2。
## 收尾各段的出场次序（2026-10-27 · 五轮反馈后定稿）

**症状演变**：① 快速下滑时「它是怎么工作的」比上面那段先出现，中间整段从未出现；② 去掉跳现后变成「上面渐出、下面一下出来」；
③ 向上滚时上面那段整程全亮、下面那段在淡入；④ 向上滚时两段渐入方向不一致；⑤ 向下滚时「它是怎么工作的」不见了。

**最终机制（只有一条规则）**：**每段在进入视口时淡入、离开视口时淡出** ✓ —— 顺序由**行进方向决定的进入顺序**自然得到
（向下滚上面那段先进，向上滚下面那段先进）⇒ 两个方向都对，无需额外约束 ✓。
- **淡入方向统一为「从进入的那一侧来」** ✓：观察器段由 `above`/`below` 状态承担；接棒段另记来向 `data-fade-from="above|below"`，
  CSS 据此决定 `out` 态的起点（从上方来 ⇒ `translate: 0 -2.5rem`）✓ ⇒ 同屏两段不再一个上滑一个下滑 ✓。
- **接棒段（第一段，`data-band-anchor`）**另受**交接线**约束：与上方那屏交叉淡入（同一触发点）✓；
  「在视口内」= 与视口**有重叠**（✗ 不是 `top` 越过上沿 —— 段比一屏高，那样会提前清屏）✓。
- **交接是**一次性事实**，不随滚动位置回退 ✓ ⇒ 记为**锁存**（`data-handoff`）✓；
  早先写成「当前位置是否越过交接线」⇒ 向上滚回线以上时被重置 ⇒ 紧跟其后的那段被**永久扣住** ⇒ 那段再也不出现 ✓。
- 只有**紧跟接棒段的那一段**等交接线，且等的是**滚动位置**这个事实，不是可见性 ✓ ⇒ 向上滚时交接早已发生，它不被扣住 ✓。
- **一律淡入**：任何速度下都按同一个 600ms 时钟 ✗ 不跳过淡入 ✓（跳现会让「上面渐出、下面一下出来」，同样是观感故障 ✓）。

**被证伪的三个方案（别再走回头路）** ✗：
① **速度挂起 + 结算定时器**（相交段挂起、等滚动停下一起放行）✗ —— 段在屏内却是空白 ✓。
② **「后段等前段显现」** ✗ —— 强行固定一种顺序，会在另一个方向制造同样的故障 ✓（向上滚时下方段本该先淡入）✓。
③ **用透明度或 running 动画判「正在淡入」** ✗ —— 淡出时透明度也在下降、元素在屏内就挂着 transition ⇒ 两者都分不出 ⇒ 段在
   `in`/`out` 之间**反复横跳**（实测 1.00 → 0.65 → 0.91 → 1.00）✓；离场条件也**不得打断进行中的淡入**（两场争同一个透明度 ⇒ 永久半亮）✓。

**测量方法（这一轮才找到的）**：写一个**缺陷探测器** —— 采样每一步的「是否在屏内」与「透明度」，专门找
**在屏内却看不见**的时刻 ✓（比逐段读状态更接近读者看到的东西 ✓）。
**方向一致性怎么断言**：两段的淡入**不重叠**（下方段先淡完、上面段才开始）⇒ 取不到「同时在中途」的样本（断言会不稳）⇒
改为**各段自己开始淡入的那一刻**记录位移符号再比较 ✓。

**验收**：向上滚「它是怎么工作」先淡入、「榜单…」后淡入，且**两段都从上方滑入** ✓；向下滚两段都从下方滑入且与上方那屏**交叉淡入**
（实测 1400 处 0.35 / 0.82）✓；缺陷探测器在快滑 / 上下 / 再下的序列里**无「在屏内却不见」** ✓（只剩 600ms 淡入的**第一帧**
与接棒段在屏幕最底边等交接线两种合法情形 ✓）；停下时**屏上每段都完全可读** ✓；回归用例两条（顺序 + 向上滚）均已验证
修复前红、修复后绿 ✓；方向断言亦已验证：方向改回固定下方即红 ✓。

### 第五轮（用户第五次反馈 · 高窗口下整段空白）

**症状**：往下滚，「它是怎么工作的」**整段空白** —— 占着位置，全透明。

**根因**：`useRevealOnScroll` 的**等待集合从未被写入** —— `show()` 把段扣在 `revealState='below'` 后只调 `startRelease()`，
**少了 `waiting.add(piece)`** ⇒ 释放循环遍历一个空集合 ⇒ 那段**永远不会被放出来** ⇒ 整个访问期都是空的 ✓。

**为什么之前没暴露**：被扣住的前提是「该段在交接点触发**之前**就进入视口」⇒ 需要
**(接棒段高 + 间距) < 0.4 × 视口高** ⇒ 只有**高窗口**才成立 ⇒ 我一直在 1440×900 测 ⇒ 永远走不到那条分支 ✓。
**教训**：**探测器的视口必须覆盖会改变事件先后顺序的那些** ✓ —— 1440×900 与 1507×1321 的差别不是尺寸，是**顺序** ✓。

**修法**：`show()` 里补 `waiting.add(piece)`（且**必须保留 `return`** —— 否则下一行又把它设成 `in`，扣留形同虚设）✓。

**验收**：高视口探针从 **14** 次「在屏内却不见」降到 **1** 次（剩的那次是**合法等待窗口**：该段刚露 66px 边、交接点还没到）✓；
新增回归用例「高窗口下屏上每一段都必须可读」（已验证撤掉修复即红 ✓）。

**顺带**：上一轮改判据时留下的辅助函数成了死代码 ⇒ 换方案时**连同旧辅助一起删** ✓（lint 抓到）。

### 审查轮（对未提交改动的两轴审查）

**审查捞出来的真问题**（都不是这一轮引入的，是前几轮留下的）：
① **断言恒真**：阅读顺序那条用例拿「已到的段」互相比较 ⇒ 恒为真 ⇒ **永远不会红** ✓。
改真之后立刻报出 7 处「违规」——真因是**接棒段已经滚出视口**（它的 `out` 是离开屏幕，不是没亮）⇒
正确的规则是「**上一段还在屏内且没亮时，下一段不许亮**」⇒ 断言必须带上「上一段仍在屏内」这个限定 ✓。
**教训**：**断言要证明自己会红** ✓ —— 恒真的断言比没有断言更糟（它给人虚假的安全感）✓。
② **单测的结构缺一环**：Host 里根本没有接棒段结构 ⇒ 释放路径（正是出问题的那条）**零覆盖** ✓。
补上「接棒段 + 其下一段」的 Host 之后，释放路径才有单测 ✓（撒掉修复即红 ✓）。
③ **JSDoc 描述的是旧行为**：`enterOnBand` 早已不是 `out -> in`，而是 `out -> in -> out` ✓。
④ **配置复用旧构建**：本地复用已在跑的 preview ⇒ `command` 里的构建被跳过 ⇒ **测的是旧产物** ✓ ⇒
构建挪进 `test:e2e` 脚本，复用的进程只提供刚构建出来的产物 ✓。
⑤ **原来的「快速滑动」名不副实**：340px 的步长在 900px 高的视口下**跳不过任何一段** ⇒ 「不跳过任何段」这条从未被考到 ✓。
现在拆成两个手势：**细扫（40px）判顺序** · **大跳（>视口高）判跳过** ✓。

### 顺序断言要「在到达那一刻」判（这一轮才想通）

「下一段在上一段还黑着的时候就亮了」是个**只持续几百毫秒**的故障 ⇒ 采样点会跨过它 ⇒ 断言要看**到达时刻**。
用 **MutationObserver** 监听 `data-reveal-state` / `data-scroll-fade` 的变化，在回调里就地判定 ✓。
**但**：回调在**帧末**才跑 ⇒ 同一帧内两段先后到达会被抹平（回调时上面那段已经亮了）⇒
**手势必须细到让故障留在单帧内**（40px 步长 ✓，340px ✗）✓。
**验证**：把「扣住」机制拆掉 ⇒ 高窗口那条用例**立刻红** ✓；装回去 ⇒ 两条都绿 ✓。

**交接窗口的窄条空白（保留的决定）**：高窗口下「它是怎么工作的」在露头到交接触发之间有 **约 66px 行程**不可读。
**保留**，因为：① 提前放行会让屏幕底边出现一段**亮着的**内容，而它上面那段还黑着 ✗（比空白更糟）；
② 提前交接线 ⇒ 舞台与接棒段的交叉淡入被破坏（年屏会在还占满屏幕时就开始溶解，而接棒段的淡入大半在屏外跑完）✗；
③ 屏幕底边露一条边还没到 = 滚动揭示的常态 ✓。

