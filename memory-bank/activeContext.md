# Active Context: ctt-web

## Current Status

**Phase**: Dashboard 面板迭代（Project distribution 上线 + 分布缓存键修复）
**Version**: 0.35.0 (2026-09-10)
**Branch**: develop
**Tests**: 1233/1233 unit; vue-tsc + lint 0 error 0 warning; build green

> 本文件只记「现在与最近」。**跨轮次可复用的判断在 [`domains/`](./domains/README.md)**（R24）：
> `dashboard-visualization`（图表/配色/布局/交互）、`backend-contract`（接口契约与统计语义）、
> `ai-workflow`（记忆/版本/提交/验证/资源）。

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

### Time of Day 垂直分布（v0.34.1）

- 卡片被同行更高的邻居拉伸时，TOD 的三块（胶囊/图例/Total）原本挤在垂直中间 → 面板根改为
  `flex flex-1 flex-col justify-around`，填满后按 space-around 分布（实测宽卡 66/68/68/26）。
- 随之加固：`space-around` 下首块上方只剩 free/6（居中时为 free/2），胶囊上方的 hover 信息条会
  更贴近卡片标题、短卡时压到标题 → 胶囊容器加 `mt-10`（32px 信息条 + 8px 间距）预留槽位。
  实测：宽卡信息条距顶 77px、窄卡 51px（标题底 35px），均不重叠。

### Project Distribution 面板（v0.35.0）

- 新增 Project distribution 卡片（`PROJECTS`，插件端 `projectDistribution` 对齐）。**形式与 Language 一致**：排名横条。否掉 donut（插件形式）——角度排序弱、长项目名在图例里被截断、且 `PieChart` 未注册会增包；否掉 treemap（此前语言面板已否：大值成色块、小格不可读，项目名更长更糟）。
- **抽出共享实现**（第二个分类维度出现时才做，非投机抽象）：`composables/useRankedDistribution.ts`（行模型/归一/0.1% 折叠）+ `components/RankedDistributionList.vue`（轨道/渐变/滚动/浮窗/a11y）+ `@/lib/utils` `formatPercent`；两个面板只保留各自 query 与文案。目的：排名、折叠、渐变、精度**不可能只改一处**。
- 列宽按「该列可能出现的最大值」定，不按常见值：百分比 `4.5rem`（容 `<0.000001%` = 69.5px）、时长 `6rem`（容 `10000h 59m 59s`）。实测 11px tabular-nums。长名截断后 hover 出全名（用 `scrollWidth > clientWidth` **实测**判定，不猜字符数）。
- 实测（langtail，2621 两列）：Language 33 行可滚动、Project 9 行且 39 字符名被正确判定截断；条形 rank1 满轨 784px、所有条共用 1 条渐变、`backgroundSize: 783.5px 100%`（证明 cqw 解析到轨道宽）。

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

### 正则回溯告警（v0.35.0）

- `percent.ts` 的 `/0+$/` 被 `S8786` 判为超线性：**实测属实**——量词在每个起始位置重试，结尾非 0 时退化为二次（长度 ×10 → 耗时 ×100：1.1µs → 27µs → 2.3ms → 228ms → 22s）。
- 反映到本处：读数是 `toFixed` 出来的几字符字符串，**从来不是热点**（实测 0.8µs vs 0.09µs）。
- 仍然改掉：提取 `trimTrailingZeros()`（单次反向扫描 + 一次 slice），线性且更直白地表达「去掉尾零，以及尾零掏空后悬挂的小数点」。全仓库仅此一处同类正则。
- 现有测试**已覆盖两条分支**（去掉跳零 → `'5.00'`/`'0.00040'` 失败；去掉悬挂点 → `'5.'` 失败），故未新增测试；另跑 15 例真实输出对照确认读数无变化。

### SonarLint 反馈处理（v0.35.0）

两轮共 12 条 IDE 告警，逐条取证后**真问题照修、误报写明依据并保留**。可复用的结论已沉淀，此处只留索引：

| 告警 | 判定 | 结论去向 |
| --- | --- | --- |
| `S3863` 重复导入 ×3（含我上轮漏查的 `TimeOfDayPanel`） | 真问题 | 已修；`components/ui/` 的 value+type 分离是惯用写法，**不动** |
| `S4624` 嵌套模板字符串（TOD 圆角，4 层） | 真问题 | 提为 `capsuleCorners()`，`CAPSULE_RADIUS = BAR_WIDTH/2` 同源；补中间段用例 |
| `S8786` 正则超线性（`/0+$/`） | 真问题 | 实测确认二次退化，但输入仅几字符 → 提出 `trimTrailingZeros()`（表意 > 性能） |
| `S3358` 另一处嵌套三元 | — | 全仓库复扫无同类 |
| `Web:S6822` `role="list"` 冗余 | **误报** | → `dashboard-visualization/practices.md` 滚动列表节 |
| `Web:S6845` 非交互元素不该有 tabIndex | **误报** | 同上 |
| `Web:S6819` `role="img"` 应换 `<img>` | **误报** | → 同文件「Chart container a11y」节 |
| Tailwind `suggestCanonicalClasses` | **有意识拒绝** | 228px 是推导的高度预算而非 spacing 阶梯；canonical 形式编译为 `calc(var(--spacing)*57)`，主题化会静默破坏上限 |
| — | **新发现的真缺陷** | `TooltipTrigger as-child` 包 `<span>` → 键盘不可达（截断名/Others 明细）；修法见 practices 滚动列表节 |

误报的共同根因：**通用规则不知道本项目的约定**（preflight 去掉列表语义、ECharts 自设 role、推导值不是 spacing 阶梯）。遇到时先取证，不要照改。

### 格式化器归属纠正（v0.35.0）

- `formatPercent` 原放在 `features/dashboard/components/percent-format.ts`（相对导入）—— 与同类 `formatDuration`（`lib/utils/time.ts`，barrel 导出）**不同处**，违反 `systemPatterns` 明文的「共享格式化器放 `lib/utils/`，禁止 per-view inline」。
- 已迁至 **`src/lib/utils/percent.ts`** + barrel 导出，4 个消费者改 `@/lib/utils`；测试随之迁到 `lib/utils/__tests__/percent.test.ts`。
- 规则已写入 `systemPatterns.md`「**Value Formatters**」（含归属表 + 「格式化器的**规则**可以来自领域，**文件**不行」）。
- 附带澄清：`components/__tests__/` 里 Pascal/kebab 混排是**镜像源文件名**规则的正常结果（大小写携带「组件 vs 模块」信息），不应为「看起来统一」而重命名——已在 `systemPatterns.md` 写明。

### 测试文件命名对齐（v0.35.0）

- 约定「测试名 = 被测源文件名」：`.vue`→PascalCase；纯 `.ts`→沿用该模块自身命名（kebab/camel）。多套件按**方面**拆 `<Name>.<aspect>.test.ts`（既有 `CreateApiKeyDialog.form.test.ts` 先例）。**已写入 `systemPatterns.md`**。
- 修正 2 个名不副实的文件：`TermsCheckbox.test.ts` → **`RegisterForm.terms.test.ts`**（原名指向不存在的组件 `TermsCheckbox.vue`，实际测 `RegisterForm` 的条款勾选 + `TermsDialog`，8 例有效）；`lib/api/__tests__/password.test.ts` → **`user.password.test.ts`**（测 `user.ts` 的 `setPassword`）。
- 删除死重量：`src/__tests__/placeholder.test.ts`（7 行 `expect(true).toBe(true)` 恒真断言）+ 空目录 `src/components/charts/__tests__/`。单测 1254 → **1253**、文件 82 → **81**。

### 测试与 lint 门禁（v0.35.0）

- `expect(x.length).toBe(n)` → `expect(x).toHaveLength(n)`：修 3 处（Language 面板 1、TermsDialog 2），与项目主流写法（48 处 `toHaveLength`）对齐。
- 项目 lint **此前没有**这条规则（只有 SonarLint 会拦），已在 `vite.config.ts` 启用 `vitest/prefer-to-have-length`。实测双向生效：`vp lint <file>` 报错 exit 1、`pnpm lint` 自动修正。
- 教训：`pnpm lint` 带 `--fix`，新规则**不会报错只会静默改写**——验证规则是否真的启用必须用不带 `--fix` 的 `vp lint`。IDE 的 SonarLint 与项目 lint 是**两套不同规则集**，两者不可互相替代。

### AI 产物位置（v0.35.0）

- `.omp/README.md` 早已规定 AI 产物归 `.omp/`（gitignored），但 `AGENTS.md` 无此规则、`ai-workflow/references.md` 还把 `docs/plans/` 写成 plan 存放处 → 落地为 **R25**；plan 迁至 `.omp/plans/project-distribution-plan.md`（按约定不带日期）。
- `docs/archives/` 同类问题：AI 记忆归档移入 **`memory-bank/archives/`**（持久记忆、留在仓库），并明确它是**唯一豁免 200 行限制**的记忆文件；10 处引用同步更新。

### 分布缓存键缺失（BUG，v0.35.0 修）

- `STATS_QUERY_KEYS.distribution` 的键**漏了 `start`/`end`**（queryFn 一直在读它们）→ 切 Period 时 `week-hour`/`hourly` 会重取，**分布面板不重取**，屏幕上留着首次那个窗口的数据。实测：切「Last 90 days」后 UI 仍显示全史（Java 50.49% / 7 行），而后端该窗口真值是 Kotlin 42.49% / 10 行。
- 红绿验证：回退成旧键，新用例报 `expected ['stats','distribution','PROJECTS','auto','auto','all']` 与带窗口的键不等。

### Time of Day 缝线对齐（BUG，v0.35.0 修）

- 段缝位置用**取整后的百分比**累加，而 ECharts 段宽用**精确秒数** → 缝线必然偏离颜色边界。改为保留精确 `share` 供几何使用，读数才格式化（`formatPercent(share, 0)`）。
- 红绿验证：回退为取整累加，1h/1h/1h/5h 的缝线位置报 `['13','26','39']`，正确值 `['12.5','25','37.5']`；真机（langtail 全史）缝线 25.2763/43.1679/57.9021 == 86460/147660/198060 ÷ 342060。

### Language Distribution 极小份额读数（v0.34.3）

- 「Others」浮窗里小于 0.005% 的语言两位小数一律印成 `0%` → `formatPercent` 改为低于 0.01 时
  精度跟随数值：`min(6, ceil(-log10(v)) + 1)` 位小数（`0.0033 → 0.0033%`、`0.000004 → 0.000004%`）。
  上限 6 位对应「1 秒 / 约 6 年」，即永远不会把真实值舍回 `0`（新增原则 **P8**）。
- 随之加宽百分比列 3.5rem → **4.25rem**：上限输出 `0.000000%` 宽 62.5px，原 56px 列会溢出 6.5px
  落入列间隙（侥幸不碰轨道）；4.25rem = 68px 留 5.5px 余量。
- 红绿验证：回退为固定两位时新测试报 `Others0% 12s`（正是用户所述 bug）；修复后 `0.0033%`。
- 真机（拦截响应注入 1 秒级语言）：行读数 `0.000012%` 未溢出轨道，浮窗三条均为 `0.000004%`；
  真实账号 30 语言读数仍为两位小数（37.24% / 24.21% … Others 0.07%），卡片仍 321px，无回归。

### Language Distribution 高度收紧（v0.34.2）

- 两列布局下卡片 397px 偏高 → 列表视口 `19rem`(304px) → `228px`，卡片落 **321px**（用户口径「最高 320px 差不多」）。
- 高度预算公式（实测推导）：卡片 = 32 padding + 18 标题 + 16 标题间距 + (视口 + 8 间距 + 18 页脚)；即固定 chrome **92px**。
- 实测：2621 两列 → Language/TOD 同排均 321px（TOD 靠 flex-1 撑满）；1600 单列 → Language 321px、TOD 241px（各自单独成行，无拉伸）；两模式均 9 行可见且可滚动。

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
- **测试账号固定**：`.sisyphus/get-token.sh` 持久化 `<prefix>` 账号并复用（`FRESH=1` 强制重注册）。**必须选已有 prefix**——新 prefix 会注册真实账号（无删号接口）并需要重新灌数据。
- **浏览器会话**：`eval "$(SESSION=1 bash .sisyphus/get-token.sh <prefix>)"` 取 ACCESS+REFRESH，然后**裸串**写入 localStorage（JSON 引号会让 refresh 返回 AUTH_003）、**导航前**写入、**同一 profile 只留一个 tab**（旧 tab 的静默刷新会覆盖注入值）。详见 `domains/ai-workflow/practices.md`。
- **服务归属**：只清理自己启动的进程，按实际监听者核对 PID 归属（PID 文件不足以证明），用户的服务不动。
- **图表设计依据**：DESIGN.md 为权威 + 项目既有图表（HourlyPanel/TrendChart）做先例 + 插件端源码参照；不再加载 lieflat-charts（其署名话术对内部 UI 无意义）。

## Archived History

- `memory-bank/archives/2026-09-10-activeContext-archive.md` — v0.16.14 → v0.34.0 的完整时间线（含各轮反馈与决策细节）。
- `memory-bank/archives/2026-08-16-activeContext-archive.md` — v0.16.13 及更早（v0.8.x 起，含事故与教训）。

归档于 2026-09-10（v0.34.0），以维持 AGENTS.md 的 200 行上限。
