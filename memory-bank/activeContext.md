# Active Context: ctt-web

## Current Status

**Phase**: Dashboard 面板迭代（TOD 重设计 + Language distribution 完成）
**Version**: 0.34.0 (2026-09-10)
**Branch**: develop
**Tests**: 1233/1233 unit; vue-tsc + lint 0 error 0 warning; build green

## Dashboard 面板（v0.28 – v0.34）

### 布局：容器查询阈值（组件宽语义，非视口）

- 面板网格 `@container/page` + `@[1684px]/page:grid-cols-2`；SummaryCards `@container/sc` + `@[1430px]/sc:grid-cols-6`（否则 md 3 列 / base 2 列）。阈值来自用户口径：卡片 ≥830px 才两列，Summary 行 ≥1430px 才一行六张。
- 实测：1600/1920/2048/2621 → 面板 1/1/2/2 列、Summary 3/6/6/6 列。**1920 屏面板为单列**（卡 796 < 830）。
- 面板全部平权、无 span 特例；ChartSection 内容区 flex-1 + 居中，空态卡与邻居等高。
- e2e `heatmap-layout.spec.ts` 锁定阈值契约（collapse@1920 / pair@2100 / summary@2100 / @1600）。

### Time of Day（4 桶胶囊）

- 后端 v0.65.0 契约：Night 00-06 / Morning 06-12 / Daytime 12-18 / Evening 18-24（本地时区，跨桶切分）。**桶总和 == summary.total**（时间轴守恒，保留 Total 页脚做交叉校验）。
- 色阶（终值）：亮 `#1e2260 / #3f4ab0 / #939ff0 / #5e6ad2`，暗 `#333b9a / #4d59c9 / #bcc5ff / #8b95ea`；相邻可辨性由 2px 段缝承担，明度预算给"段 vs 卡底"。
- 交互：固定信息条锚定段中心（非跟随鼠标），图例用 Lucide 日相图标（Moon/Sunrise/Sun/Sunset）。
- 已删除刻度标尺（时钟刻度与占比位置天然错位；占比刻度零信息量）。

### Language Distribution（排名横条 + 全局渐变）

- **全部语言逐行呈现，不截断**；卡片只约束高度（`max-h-[19rem]` 内部滚动 + 双端 mask 渐隐 + 页脚计数）。
- 唯一折叠：<0.1% 进 Others（插件口径），hover 用项目 `Tooltip` 组件列明细（cap 8 + `+N more`）。
- 条长按**最长语言**归一（rank 1 铺满轨道）；轨道 25/50/75 刻度为测量家具。
- **全局渐变**：轨道 `container-type: inline-size` + 条 `background-size: 100cqw` —— 每行只截取同一条渐变的自己那一段。色标复用 TrendChart（亮 `#3d49ad/#8290f0/#8a97f2`，暗 `#4f58c0/#8290f0/#b9c1ff`，offset 0/48/100）。
- **Others 与语言行完全一致**（同渐变同透明度）——颜色不承载数据，长度与标签承载；任何 tint/alpha 差异都会重新暗示"颜色有含义"。
- 百分比 `formatPercent`：2 位小数 + 尾零剥离（41.67% / 0.21% / 5%），三处读数统一。
- 分类分布（LANGUAGES/PROJECTS/…）**不展示 Total**：桶总和 ≥ 真实活动时长（并行会话合法叠加），无业务含义。

### 后端契约（只读核对，跨仓库只提需求）

- v0.66.0 起 `/distribution` 支持 `start`/`end`（闭区间，缺省全史，`end<start` → 400 COMMON_003），前端分布面板已接入筛选栏窗口。
- 语义分界：**时间轴分布守恒**（TIME_OF_DAY == summary.total）；**分类分布必然超线性**（多语言/多项目并行）。
- 历史缺口已闭环：曾因 `/distribution` 无窗口参数导致"分布面板恒全史 vs summary 卡随窗口变"被读作 total 不一致。

### 依赖与工具链

- **typescript 6.0.3 精确钉定**（TS7 移除 programmatic API，vue-tsc/compiler-sfc 崩）；**vitest + @vitest/coverage-v8 4.1.11 精确钉定**（vite-plus@0.3.0 硬钉）。每次 `vp update -L` 后都要重新钉定。
- 本轮升级：vue-router 5.3.1、zod 4.5.4、playwright 1.63.0（需 `playwright install chromium`）等。

## Lessons（跨轮次教训）

- **容器查询不能自查询**：`@container/x` 与 `@[..]/x:` 写在同一元素上永不匹配，容器声明必须在祖先层。
- **暗色验证必须用 CDP** `page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}])` —— `App.vue` 挂载时 `setTheme('auto')` 会覆盖 localStorage 注入。
- **逐行渐隐不能用叠色**：遮罩颜色永远无法匹配带渐变的卡片（暗色下形成割裂带），改用 `mask-image`（无颜色）。
- **模板类文件大改用整文件 `write`**：增量 hunk 编辑在同一文件上反复错位（陈旧锚点 + 边界回声）已两次损坏模板；多 hunk 编辑后必须整文件复核。
- **dev server `504 Outdated Optimize Dep`**：依赖图变化后 `rm -rf node_modules/.vite` + 重启。
- **测试账号固定**：`.sisyphus/get-token.sh` 持久化 `<prefix>` 账号并复用（`FRESH=1` 强制重注册），避免堆积一次性账号。
- **服务归属**：只清理自己启动的进程，按实际监听者核对 PID 归属（PID 文件不足以证明），用户的服务不动。
- **图表设计依据**：DESIGN.md 为权威 + 项目既有图表（HourlyPanel/TrendChart）做先例 + 插件端源码参照；不再加载 lieflat-charts（其署名话术对内部 UI 无意义）。

## Archived History

- `docs/archives/2026-09-10-activeContext-archive.md` — v0.16.14 → v0.34.0 的完整时间线（含各轮反馈与决策细节）。
- `docs/archives/2026-08-16-activeContext-archive.md` — v0.16.13 及更早（v0.8.x 起，含事故与教训）。

归档于 2026-09-10（v0.34.0），以维持 AGENTS.md 的 200 行上限。
