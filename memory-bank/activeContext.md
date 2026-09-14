# Active Context: ctt-web

## Current Status

**Phase**: Achievements 奖杯系统（v0.71.0 契约 / 周期截止 / 外圈几何）+ Leaderboard 契约修复 + Dashboard 面板迭代
**Version**: 0.41.0 (2026-09-14)
**Branch**: develop
**Tests**: 1384/1384 unit; vue-tsc + lint 0 error 0 warning; build green; e2e layout 4/4

> 本文件只记「现在与最近」。**跨轮次可复用的判断在 [`domains/`](./domains/README.md)**（R24）：
> `dashboard-visualization`（图表/配色/布局/交互）、`backend-contract`（接口契约与统计语义）、
> `achievements`（奖杯家族/阶级/进度语义）、`ai-workflow`（记忆/版本/提交/验证/资源）。

## Dashboard 面板（v0.28 – v0.34）

> **v0.28 – v0.34 的细节**已入 `progress.md`（版本流水）与领域文件（可复用判断），此处只留当前仍生效的结论：
>
> - **布局**：面板网格 `@container/page` + `@[1684px]/page:grid-cols-2`（卡 ≥830px 才两列）；
>   SummaryCards `@container/sc` + `@[1430px]/sc:grid-cols-6`。实测 1600/1920/2048/2621 →
>   面板 1/1/2/2 列。**容器查询的声明必须在祖先层**（cannot self-query）。e2e 锁定该契约。
> - **Time of Day**：4 桶胶囊（后端 v0.65.0，本地时区，**桶和 == summary.total**）；固定信息条锚定
>   段中心；虚拟标尺已删（时钟刻度与占比天然错位）。色阶、缝线宽度见 `dashboard-visualization/references.md`。
> - **Language distribution**：全部语言逐行、卡片只限高（内部滚动 + `mask-image` 双端渐隐 + 页脚计数）；
>   <0.1% 折叠为 Others（hover 列明细）；条长按**最长语言**归一；**一条全局渐变**（轨道 `container-type` +
>   条 `background-size:100cqw`）；Others 与普通行完全一致（颜色不承载数据）。
> - **分类分布不展示 Total**（桶和 ≥ 真实活动时长）；**时间轴分布守恒**。详见 `backend-contract` P2。

### Project Distribution 面板（v0.35.0）

- 新增 Project distribution 卡片（`PROJECTS`，插件端 `projectDistribution` 对齐）。**形式与 Language 一致**：排名横条。否掉 donut（插件形式）——角度排序弱、长项目名在图例里被截断、且 `PieChart` 未注册会增包；否掉 treemap（此前语言面板已否：大值成色块、小格不可读，项目名更长更糟）。
- **抽出共享实现**（第二个分类维度出现时才做，非投机抽象）：`composables/useRankedDistribution.ts`（行模型/归一/0.1% 折叠）+ `components/RankedDistributionList.vue`（轨道/渐变/滚动/浮窗/a11y）+ `@/lib/utils` `formatPercent`；两个面板只保留各自 query 与文案。目的：排名、折叠、渐变、精度**不可能只改一处**。
- 列宽按「该列可能出现的最大值」定，不按常见值：百分比 `4.5rem`（容 `<0.000001%` = 69.5px）、时长 `6rem`（容 `10000h 59m 59s`）。实测 11px tabular-nums。长名截断后 hover 出全名（用 `scrollWidth > clientWidth` **实测**判定，不猜字符数）。
- 实测（langtail，2621 两列）：Language 33 行可滚动、Project 9 行且 39 字符名被正确判定截断；条形 rank1 满轨 784px、所有条共用 1 条渐变、`backgroundSize: 783.5px 100%`（证明 cqw 解析到轨道宽）。

### Coding trend 可选月份（v0.36.0）

- 趋势面板从「固定 last 30 days」改为「**默认 last 30 days + 可选自然月**」，与热力图选年同一层级（面板级窗口，筛选栏 Period 不动它）。状态为 **`useDashboardFilters` 内的本地 ref，不进 URL**（见下方「面板状态与路由隔离」）。
- 选择器 `TrendMonthSelect`：popover，内含 `Last 30 days`（默认/重置）+ 年份行（‹ ›，仅在有数据的年份间移动）+ **12 格月份网格**。用网格而非下拉：年份是单一步进，月份某年最多 12 项，铺开可见且选项数不随历史增长；无数据的月**置灰不隐藏**（隐藏会让网格在不同年份间跳动）。
- 契约：新增 `GET /stats/heatmap-months?timezoneOffset=` → 有数据的 `yyyy-MM` 降序（后端 v0.67.0）；`heatmap-years` 同版本加上 `timezoneOffset`。两者由后端**同一来源**导出，故年月自洽、且列出的窗口必有内容可画。
- 新 UI 原语：`src/components/ui/popover/`（reka-ui 原语 + 项目样式，**无新增依赖**）。
- 真机验证（langtail，2621 两列）：默认 `Last 30 days` → 请求 `start=2026-08-13&end=2026-09-11`；选 Aug 2026 → 请求 `start=2026-08-01&end=2026-08-31` 且 URL **不变**；切 Period 到 Last 90 days 后 `trendMonth` 保留且**趋势不重新请求**；重置回到 30 天；禁用月与后端列表一致（2026 仅 8/9 月可选）；暗色选中态 = 品牌靛蓝 `#5e6ad2`、禁用态 opacity 0.35。
- 实施中自查出一处同类缺陷：生成脚本给 months hook 误用了 `heatmapYears` 的缓存键（与本轮修的分布键同型），已改为独立键 `['stats','heatmap-months']`。

### 卡片高度塌陷（BUG，v0.36.0 修）

用户报告「热力图切年份卡片高度动一下，仅第一次」。**属实**：rAF 逐帧量到卡片 **379 → 188 → 379**。

两层根因（都在 `ChartSection`，既有缺陷）：
1. **loading 用固定高骨架替换图表** —— 骨架 120px vs 图表 241px；
2. **`#actions` 在 loading 时被 `v-if` 隐藏** —— header 少了年份选择器（h-7=28px），且用户刚点的控件消失。

**仅第一次**：只有未缓存的年份才真取数（60s staleTime 内重复点击命中缓存，无 loading）。

修法：`dataArea` 用 **ResizeObserver** 测高 → 占位态带 `minHeight`（首屏无值则不设，不臆造）；`#actions` 全程挂载。
复测：**272 帧只有一个高度值 379**，选择器全程可见。

**为何之前没被发现**：两列布局下 grid stretch 让同排邻居撑住行高，掩盖了塌陷；单列才显形。**布局类修复必须在两种宽度都验。**

### 面板状态与路由隔离（v0.36.0）

用户报告「选月份导致全页重新渲染」，**属实**。第一轮我用截图像素对比得出「只有趋势卡片变化」——**测量无效**（无交互时基线同样在变，截图受滚动偏移/合成噪声影响）。换两种可靠判据后取证到位：

- **各图表 canvas 的 `toDataURL()` 指纹**（先测噪声基线：静止时全等）
- **包装每个组件实例的 `render` 函数计数**

选一次月份的真实代价：
```
RouterView ×2  AppLayout  ErrorBoundary  SidebarInset
SidebarProvider  SidebarMenuItem ×4  TooltipProvider  DashboardHome ×2
```

**两层根因**：① 面板状态存在 `router.replace` 里 → vue-router 的 `currentRoute` 是整体替换的 shallowRef，任何 query 变化都让 `RouterView` 重渲染，整条布局链跟着走；② `AppSidebar` 在模板里直接读 `route.path`，于是**侧栏也被无关的 query 变化拖着重渲染**。对照实验：热力图选年是**同一个病**（预先存在，非本轮引入）。

**修法**：
- 面板窗口（`heatmapYear`/`trendMonth`）改为**本地 ref，不读也不写 URL**。规则：**每个面板都跟随的页面级状态（日期范围、来源筛选）才进 URL；单卡片自己的窗口不进**。
- `AppSidebar` 改走 `computed(() => route.path)`（computed 按值比较，path 未变即不再传播）。

**复测**：`history` 写入 0 次；外壳组件重渲染**全部归零**（`shellStillRerendering: {}`）；仅 `DashboardHome ×2` + 其子树（`ChartSection ×3`、picker）；趋势 canvas 正常重绘（91470 → 92218 字节）。回归守卫已入测试：`setHeatmapYear`/`setTrendMonth` 断言 `mockReplace` **未被调用**。

### Dashboard 卡片顺序（v0.35.1）

- 按行分组重排：**第 1 行 Language / Project distribution**（两个分类占比）、**第 2 行 Coding heatmap / Coding trend (last 30 days)**（日历 + 趋势），第 3 行 Weekly by hour / Average hourly，第 4 行 Time of day（奇数第 7 张独占）。
- 顺序在 `DashboardHome.vue` 模板中即为布局（单 grid，无 span 特例），改动即 DOM 顺序；已在网格注释写明「按行配对」的意图。
- **e2e `heatmap-layout.spec.ts` 钉住了配对关系**：`TITLES` 必须是**渲染顺序**（y 单调性断言依赖它），2 列测试断言第 1/2/3 行各自共行、TOD 在最后。改顺序必须同步更新它——已一并改并跑通（4 passed）。

### 记忆分层整理（v0.35.0）

`systemPatterns.md` 一度到 199/200 行，其中三节其实是**图表领域专属**而非横切规范，已按 R24 迁移：

| 内容 | 去向 |
| --- | --- |
| Scrollable List a11y（`role="list"` / `tabindex` 为何必要、Tooltip 可达性） | **并入** `dashboard-visualization/practices.md` 的「Bounded-height scrolling list」（同一组件，合并而非并列） |
| Chart container a11y（`role="img"` 是 ECharts 官方模式，勿改成 `<img>`） | 新增节 → 同文件 |
| Tailwind scans comments（注释里的类名 token 会进产物） | **保留**在 `systemPatterns.md`（跨切面构建行为，非领域专属），压缩到 8 行 |

顺带修掉一处 **R24 违规**：`dashboard-visualization/practices.md` 的「When the component file
fights back」与 `ai-workflow/practices.md` 的「When an edit tool corrupts a file」是同一事实两处
存放 —— 删除前者，保留更完整的 ai-workflow 版本（该事实属「agent 如何编辑文件」，非领域知识）。

结果：`systemPatterns.md` 164 行、`dashboard-visualization/practices.md` 200 行，均在限内。

### v0.35.0 的其余收敛（可复用结论已入领域文件）

- **超线性正则**：`percent.ts` 的 `/0+$/` 被 `S8786` 判为二次退化，**实测属实**（长度 ×10 → 耗时 ×100，最坏 22s）；
  虽读数从来不是热点，仍改为线性扫描 `trimTrailingZeros()`。全仓库仅此一处同类正则。
- **SonarLint 判断法**：12 条告警中真问题照修、误报写明依据保留（`role="list"`/`tabIndex`/`role="img"` 三条是通用规则
  不懂本项目约定）。**遇到告警先取证，不要照改。**
- **格式化器归属**：`formatPercent` 归 `lib/utils/percent.ts`（与 `formatDuration` 同类同处），规则入 `systemPatterns.md`。
- **测试命名**：Pascal=组件、小写=模块；**不要为"看起来统一"重命名**（约定入 `systemPatterns.md`）。
- **lint 门禁**：`pnpm lint` 带 `--fix`，新规则只会静默改写不报错——验证规则是否启用必须用不带 `--fix` 的 `vp lint <file>`。IDE 的 SonarLint 与项目 lint 是**两套规则集**。
- **AI 产物位置（R25）**：计划归 `.omp/plans/`（gitignored、不带日期）；记忆归档移入 `memory-bank/archives/`
  （唯一豁免 200 行的记忆文件）。`docs/` 只放面向用户文档。

### 分布缓存键缺失（BUG，v0.35.0 修）

- `STATS_QUERY_KEYS.distribution` 的键**漏了 `start`/`end`**（queryFn 一直在读它们）→ 切 Period 时 `week-hour`/`hourly` 会重取，**分布面板不重取**，屏幕上留着首次那个窗口的数据。实测：切「Last 90 days」后 UI 仍显示全史（Java 50.49% / 7 行），而后端该窗口真值是 Kotlin 42.49% / 10 行。
- 红绿验证：回退成旧键，新用例报 `expected ['stats','distribution','PROJECTS','auto','auto','all']` 与带窗口的键不等。

### Time of Day 缝线对齐（BUG，v0.35.0 修）

- 段缝位置曾用**取整百分比**累加，而 ECharts 段宽用**精确秒数** → 缝线必然偏离颜色边界。改为保留精确 `share`
  供几何使用，读数才格式化。红绿验证：取整累加时缝线报 `13/26/39`，正确值 `12.5/25/37.5`。

### Language Distribution 高度与读数（v0.34.2 / v0.34.3）

- 列表视口 `228px`（卡片 321px，chrome 92px）、百分比列 `4.5rem`、精度规则 **P8**（有效值不印成 `0`）——推导与
  实测值在 `dashboard-visualization/{practices,references}.md`。

### Recent sessions 面板（v0.37.0）

- 接上 `D1` 建好但**无 UI 引用**的 `/stats/recent` 契约层（触发条件：端点**不接受日期参数**，故不跟随 Period、
  只跟随来源筛选）。设计取舍与实测值在 `dashboard-visualization/references.md` 与面板 docblock。
- **插件端无此视图**（其 `RecentActivityDataProvider` 是 30 天活动图）→ 非 parity，按数据独立设计；抽出共享滚动
  外壳 **`ScrollFadeList.vue`**（第二个列表需要它时抽），分布列表回归 18/18 证明提取未改行为。
- **自查出的自身缺陷**：日标题原设 `sticky top-0`，文本落在滚动区 2–20px 正处顶部渐隐带内 → 刚钉住就被淡化，
  改为正常滚动（教训入 `dashboard-visualization/practices.md`）。
- **两轴审查后修正**：日分组测试原为**同义反复**（断言由被测函数自身推导，UTC 环境永不失败）→ 固定
  `TZ=Asia/Shanghai` 并断言字面量，已用「改回 UTC 切片」验证会红；排序补 `sessionId` 成**全序**；不可解析
  `startTime` 会产出 `Invalid Date NaN` 分组 → 过滤；复用 `DEFAULT_RECENT_LIMIT` / `formatDateTime`。

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

- `memory-bank/archives/2026-09-10-activeContext-archive.md` — v0.16.14 → v0.34.0 完整时间线。
- `memory-bank/archives/2026-08-16-activeContext-archive.md` — v0.16.13 及更早（v0.8.x 起）。
- 归档于 2026-09-10（v0.34.0），以维持 AGENTS.md 的 200 行上限；新溢出继续按此方式迁移。
