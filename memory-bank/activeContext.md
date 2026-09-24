### `.omp/` markdown 统筹（2026-09-24 ✓）

- **根目录只留目录级文件** ✓：`README.md` · `ai-planning-method.md`；11 个业务产物归位 `delivery/`（7）· `requirements/`（2）· `design/`（2）✓ 与原 `plans/` · `report/` · `qa/` 并列 ✓；事故快照 `salvage/`（208K）按删除政策清理 ✗（内容与 git 版本重合 ✓ 教训已入 R27 ✓）。
- **新旧对照表 ⇒ `.omp/README.md`** ✓（`.omp/` 不入库 ⇒ 搬动**无版本控制安全网** ✗，已为该 README 规则 6 ✓）；搬动曾致归档断链 ✗ ⇒ 新规则 7：**移动后必须改写引用路径** ✗（闸门会解析 memory-bank 里每个 `.omp/…` 串 ✓）。
- **删除的代价（记账 ✗）**：删 `salvage/` 前引用检查**列出了 3 处**（`report/underglow-*.md` ✓）却被我忽略照删 ✗ ⇒ 三处悬空引用已改写为事实陈述 ✓，且快照**不可恢复** ✗ ⇒ README 规则 8：**跑检查、然后真的读它的输出** ✓。

### 落地页 P2 收官 + 目视验收（2026-09-24，v0.51.0）

- **P2「视觉基元与版面节奏」✅ 完成** ✓：唯一挂账项「面板动效」由 2026-09-21/22 的 AuthLayout 交付解除 ✓；**完成记录第五段**已补入计划 ✓（此前汇总行仍写 🚧、引用的第五段并不存在 ✗）。
- **验收 3/3 实测** ✓（1440×900 · spawned Chrome）：① 令牌全有出处 ✓（header 实测 **57px** = `border-box` 56 + 1px 底边 ✓）；② 双模成立 ✓（h1 **64px/510/−1.408px/64px** 两主题逐值相同 ✓ · 15 处文本 14 处 ≥ 4.5 ✓）；③ reduce `getAnimations()` **0** ⟷ 对照组 **5** ✓；**滚动动效不可测** ✗（`scrollHeight == viewport` ⇒ 无自证能力 ✗）。
- **目视验收 5 项 ✅ 已确认（"没啥问题" ✓）** ⇒ **一律维持现状** ✗：大标题大小（手机 64px 排 4 行 ✓ **不改** ✗）· 眉题（4.24/4.42 ✓ **不改** ✗）· 面板手感 · 亮色四项 · 留白 ✓。结论档 `.omp/qa/visual-qa.md` ✓；**防 churn 条款**入 `landing-page/scenarios.md` LS7 ✓。
- **P2 现仅剩 1 个开口项** ✗：`ghost` 按钮两串 `text-shadow` 字面值 —— 要不要为发光加一对令牌（R7 用户定 ✓）。
- **探针三坑**（已入领域 ✓）：`browser.open({ viewport })` **不生效** ✗ ⇒ 用 `page.setViewport` ✓；Tailwind v4 的 `color` 是 **`oklab(…)`** ✗ ⇒ 必须过 canvas 归一化 ✓（否则读出 **1.05 假象** ✗）；reduce 把 `transition-duration` 变成 **`0.01ms`** ✗ ⇒ 不能拿「≠ `0s`」当非零判据 ✓。

### AuthLayout 展示面板（2026-09-21，v0.48.1 → v0.51.0 ✓ 已完成）

- 三层光各归其主 ✓（掠光属鼠标 · 聚光描边属几何 · 底光属**卡片**且为**场景级单层** ✓）；一个 **rAF 运动学时钟** + **各向同性半径** `hypot(W,H)/2.4` ✓（此前竖直灵敏度 **2.64×** ✗）+ **静止契约**（恒等矩阵 ✓ `forwards→backwards` ✓ `currentRotate*` 改 `ref` + `rafId` 释放 ✓ —— 真因是 `useCardTilt` 曾是**死代码** ✗）。
- **耐久内容全在 [`domains/auth-layout/`](./domains/auth-layout/meta.md)** ✓（本文件不重复 ✗）；相关纪律入 AGENTS **R27/R28** ✓。

> 本文件只记「现在与最近」✓。**跨轮次可复用的判断在 [`domains/`](./domains/README.md)**（R24）：
> `dashboard-visualization`（图表/配色/布局）· `backend-contract`（契约与统计语义）· `achievements`（奖杯语义与几何）·
> `auth-layout`（面板三层光与运动）· `landing-page`（营销面视觉基线）· `ai-workflow`（记忆/版本/提交/验证/资源）。

## Archived History

- `memory-bank/archives/2026-09-24-activeContext-trim.md` — 2026-09-19 → 2026-09-21 的逐轮细节（P1 · 账号删除 · Leaderboard · 知识库治理 · hero 动效 · 用户级技能）；耐久判断已回迁领域 ✓。
- `memory-bank/archives/2026-09-15-dashboard-era-archive.md` — v0.28 – v0.37 Dashboard 面板迭代。
- `memory-bank/archives/2026-09-10-activeContext-archive.md` — v0.16.14 → v0.34.0 完整时间线。
- `memory-bank/archives/2026-08-16-activeContext-archive.md` — v0.16.13 及更早（v0.8.x 起）。
- 归档惯例：维持 200 行上限，溢出即裁剪 ✓（本次 187 → 30 行 ✓）。
