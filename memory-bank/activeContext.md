# Active Context: ctt-web

## Current Status

**Phase**: Achievements 奖杯系统（v0.71.0 契约 / 周期截止 / 外圈几何）+ Leaderboard 契约修复 + Dashboard 面板迭代
**Version**: 0.43.0 (2026-09-15)
**Branch**: develop
**Tests**: 1400/1400 unit; vue-tsc + lint 0 error 0 warning; build green; e2e 75/75 chromium（achievements 8 + leaderboard 13 为新增）

> 本文件只记「现在与最近」。**跨轮次可复用的判断在 [`domains/`](./domains/README.md)**（R24）：
> `dashboard-visualization`（图表/配色/布局/交互）、`backend-contract`（接口契约与统计语义）、
> `achievements`（奖杯家族/阶级/进度语义）、`ai-workflow`（记忆/版本/提交/验证/资源）。

> **v0.28 – v0.37 的逐版本细节**已归档 → [`archives/2026-09-15-dashboard-era-archive.md`](./archives/2026-09-15-dashboard-era-archive.md)。
> 其中的耐久判断已回迁 [`domains/dashboard-visualization/`](./domains/dashboard-visualization/meta.md)（不该留在时间线层）。

### 知识库治理：维护 / 溯源 / 渐进式披露（2026-09-15）

- R24 补齐四项缺口：**回源**（不同事实回不同来源）、**维护机制**（增量 + 校准）、**元数据与核对基线**、**渐进式披露**；操作规程移入 `domains/README.md`。约定与 `../ctt-server` 的同类实现（commit `72ddbd5`）一致。
- 四领域 `meta.md` 各声明**核对基线**；内容早于当前后端版本的如实标注，不暗示刚核对过。
- **首次校准即发现真实漂移，当日修复**：后端 v0.73.0（`0111900`）改了 leaderboard 契约（新增 `ACTIVE_DAYS`、放宽周期组合、响应加 `totalParticipants`）—— 我们记录时是对的，是后端改了。已按 v0.73.0 重建契约（v0.43.0）；`totalParticipants` 顺带替掉「整页即可能还有」的旧启发式（此前整页倍数会多给一页）。

### 后端契约（只读核对，跨仓库只提需求）

- v0.66.0 起 `/distribution` 支持 `start`/`end`（闭区间，缺省全史，`end<start` → 400 COMMON_003），前端分布面板已接入筛选栏窗口。
- 语义分界：**时间轴分布守恒**（TIME_OF_DAY == summary.total）；**分类分布必然超线性**（多语言/多项目并行）。
- 历史缺口已闭环：曾因 `/distribution` 无窗口参数导致"分布面板恒全史 vs summary 卡随窗口变"被读作 total 不一致。

### 依赖与工具链

- **typescript 6.0.3 精确钉定**（TS7 移除 programmatic API，vue-tsc/compiler-sfc 崩）；**vitest + @vitest/coverage-v8 4.1.11 精确钉定**（vite-plus@0.3.0 硬钉）。每次 `vp update -L` 后都要重新钉定。
- 本轮升级：vue-router 5.3.1、zod 4.5.4、playwright 1.63.0（需 `playwright install chromium`）等。
- **`pnpm-workspace.yaml` 是 pnpm 11 的配置文件**（`.npmrc` 对 `verify-deps-before-run` 已失效）。

### pnpm 隐式安装污染受控文件（BUG，v0.36.1 修）

- `pnpm-workspace.yaml` 出现 `<包名>: set this to true or false` 占位符：`verifyDepsBeforeRun` 默认 `install`
  会在依赖不同步时隐式安装并写入。修法 `warn`。完整机制与取证见 `ai-workflow` S9。

### 奖杯外圈几何修正（v0.41.0）

- **用户报告属实**：外圈已是 24 网格极限（内沿 10.5），而**九个图形全部溢出**（最多 +2.58）、**六个偏心**
  （最多 2 单位）。修法：图形按自身包围盒中心缩放并映射到格心，统一入圈且居中。
- **我的第一版公式错了**：漏 `CENTER*(1-s)` 项 → 每个奖杯整体位移 ≈4.7 单位。审查看不出来，**真机量渲染**才暴露。
- 细节与「几何必须真机测」的教训入 `achievements/trophy-geometry.md`。1384/1384。

### Achievements 三轮迭代（v0.39.0 → v0.41.0）

- **v0.39.0** 后端 67 阶 / 14 阶梯（原 15 / 7）→ 前端 code→家族表删除，改数据驱动。真机 14 卡 / `19 / 67 · 28%`。
- **v0.40.0** 「Current period」按窗口分子区，每区日期区间 + 倒计时；截止期属**窗口**而非奖杯，故只在分组头渲染一次。
- **v0.41.0** 外圈未包住图形（九个全溢出、六个偏心）→ 图形按自身中心缩放并映射到格心，统一入圈且居中。
- **v0.41.0** Leaderboard 契约修复（该页原调用不存在的端点，永远只能报错）→ 按实测契约重建 + 路由补 `AppLayout`。
- **v0.42.2** 成就页 / 排行榜页 E2E（此前两页零覆盖）→ 8 + 13 用例，两条断言只有真机能验（环几何、非法组合不外发），均已注入缺陷验证可证伪。
- **v0.42.0** 周期成就历史（`totalUnlocks` / `periodStreak`）→ 卡片显示「得过几次 + 🔥连击」。
  我给后端的需求报告**判断错了**（以为数解锁行即可，实则那些行只在访问页面时写入）—— 详见 `references.md` 与 `practices.md`。
- 各轮的可复用判断已入领域文件（P6、practices、trophy-geometry.md）；流水见 `progress.md`。

## Lessons（跨轮次教训）

- **容器查询不能自查询**：`@container/x` 与 `@[..]/x:` 写在同一元素上永不匹配，容器声明必须在祖先层。
- **暗色验证必须用 CDP** `page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}])` —— `App.vue` 挂载时 `setTheme('auto')` 会覆盖 localStorage 注入。
- **逐行渐隐不能用叠色**：遮罩颜色永远无法匹配带渐变的卡片（暗色下形成割裂带），改用 `mask-image`（无颜色）。
- **模板类文件大改用整文件 `write`**：增量 hunk 编辑在同一文件上反复错位（陈旧锚点 + 边界回声）已两次损坏模板；多 hunk 编辑后必须整文件复核。
- **dev server `504 Outdated Optimize Dep`**：依赖图变化后 `rm -rf node_modules/.vite` + 重启。
- **测试账号固定**：复用 `.sisyphus/get-token.sh` 的**已有** prefix（`FRESH=1` 强制重注册）；新 prefix 会注册真实账号（无删号接口）并需重新灌数据。
- **浏览器会话**：`eval "$(SESSION=1 …)"` 取 ACCESS+REFRESH，**裸串**写 localStorage（JSON 引号 → refresh 返 AUTH_003）、**导航前**写、**同 profile 只留一个 tab**。详见 `ai-workflow/practices.md`。
- **服务归属**：只清理自己启动的进程，按实际监听者核对归属（PID 文件不足以证明）；用户的服务与浏览器不动。
- **图表设计依据**：DESIGN.md 权威 + 项目既有图表做先例 + 插件端源码参照；不加载 lieflat-charts。

## Archived History

- `memory-bank/archives/2026-09-15-dashboard-era-archive.md` — v0.28 – v0.37 Dashboard 面板迭代（2026-09-15 自本文件冻结；耐久判断已回迁领域层）。
- `memory-bank/archives/2026-09-10-activeContext-archive.md` — v0.16.14 → v0.34.0 完整时间线。
- `memory-bank/archives/2026-08-16-activeContext-archive.md` — v0.16.13 及更早（v0.8.x 起）。
- 归档于 2026-09-10（v0.34.0），以维持 AGENTS.md 的 200 行上限；新溢出继续按此方式迁移。
