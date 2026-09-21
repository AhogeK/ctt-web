# activeContext 归档（2026-09-22 瘦身）

源：`memory-bank/activeContext.md`，为守住 200 行上限迁出；
其中耐久判断已在 `landing-page/` 与 `progress.md` 中 ✓。

### 落地页 P2 第二段：手写 hover 守卫（2026-09-20，工作树未提交）

- **全仓 `src/` 手写 `:hover` 共 16 条 / 4 文件**（`ThemeToggle` 2 · `AuthLayout.css` 11 · `ScrollFadeList` 2 · `TermsDialog` 1）→ **全部包入 `@media (hover: hover)`** ✓；Tailwind 变体不动 ✓（v4 已编译 ✓）。
- **真机对照（决定性 ✓✓）**：桌面 hover → 变色 ✓（零回归 ✓）；触摸 `hover: none` hover → **不变** ✓✓。
- **⚠️ 测量陷阱** ✗✓：`page.emulateMediaFeatures([{name:'hover'}])` **不支持** ✗ 而我的 `.catch` 吞了它 ✗ → 上一轮"触摸"其实跑在桌面条件下、结论反了 ✗；**正解 = `page.emulate({ isMobile, hasTouch, userAgent: 移动端 })`** ✓✓（会把 `hover: hover→none`、`pointer: fine→coarse` ✓）。
- 单测 35/35 ✓ · `vue-tsc` 零错误 ✓ · 版本 `0.47.6`（PATCH）。

### 落地页 P2 第一段：区块基元（2026-09-20，工作树未提交）

- **新增** `src/features/landing/components/LandingSection.vue` —— 营销区块的唯一外壳：容器宽度 · 横向留白 · 纵向节奏
  （取值全部来自 `DESIGN.md`：容器 1200px §5 · 阅读列 ~730px · 8px 栅格横距 24→32px · 区块节奏 80→48px §8）
- **测试** `LandingSection.test.ts` 4 例，已**证伪**（改错容器宽度即红 ✓）· `vue-tsc` 零错误 ✓
- **计划文件已同轮更新** ✓：`.plans/ctt-web-development-plan.md` §P2 标记为「进行中（第一段已交付）」+ 完成记录（本文件约定：阶段完成就地更新 ✓）
- **阅读中发现的两处前提修正**：触摸目标 44×44 与 `@media (hover: hover)` 规则 **`DESIGN.md` §8 早已写入** ✓
  （P2 清单里"需确认后写入"作废 ✗）；剩下的真实 code 缺口只有 `ThemeToggle.vue` 的**手写** `:hover` 未包该媒体查询 ✓

**已提交**: v0.47.2 —— develop `e782010` ✓ / master `d73e493` ✓（均已推送 · clean · 代码面 0 差异 ✓）

### 落地页 P1：`/` 由「重定向登录」变为公开首页（2026-09-19，v0.47.0）

`RouteNames` 增 `MARKETING_LAYOUT` + `LANDING`（镜像 `AUTH_LAYOUT` 模式）· `/` 移入 `router/modules/landing.ts`（`constantRoutes` 随之删除）· 新增 `MarketingLayout` + `LandingView` · 死代码 `HomeView`/`AboutView` 删除 · 分包 `feature-landing` ✓。**关键语义**：守卫只在 `requiresAuth` 为真时拦；**`guestOnly` 会把已登录用户弹走** → `/` 绝不标它。完整交付记录见 [`.plans/ctt-web-development-plan.md`](../.plans/ctt-web-development-plan.md) §P1。

# Active Context: ctt-web

## Current Status

**已提交**: v0.47.0 —— develop `7704628` ✓ / master `2e22f5f` ✓（两分支均已推送、clean、代码面 0 差异 ✓）

**已提交**: v0.47.1 —— develop `7059fcb` ✓ / master `6ef9fa5` ✓（两分支均已推送、clean、代码面 0 差异 ✓）
  4 个 develop 提交：`b16a6cc` fix(router 父级重定向) · `5131f5d` feat(auth 登出提示) · `fa1ed27` chore(release) · `7059fcb` chore(memory)
  其中 3 个非 AI 提交**逐个** cherry-pick 进 master（`911412b` / `07ab46b` / `6ef9fa5`）✓ 零冲突 ✓；AI 内容未进 master ✓（已逐一核验：index.yaml / systemPatterns / AGENTS.md / .plans 在 master 上**均不存在** ✓）
  **钩子复核** ✓：pre-commit 跑过 `vp fmt`/`vp lint --fix` → 对**提交后**的状态重跑门禁：type-check ✓ lint ✓ unit **1437/1437** ✓ build ✓ E2E **104/104** ✓

