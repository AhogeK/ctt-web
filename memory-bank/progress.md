# Progress: ctt-web

## Milestone Overview

| Milestone                         | Status      | Target Version |
| --------------------------------- | ----------- | -------------- |
| Project Scaffold                  | ✅ Complete | 0.1.0          |
| Router Architecture               | ✅ Complete | 0.2.0-beta.2   |
| Layout System                     | ✅ Complete | 0.2.0-beta.3   |
| Auth Module                       | ✅ Complete | 0.3.0-beta.1   |
| Lazy Loading + Chunk Optimization | ✅ Complete | 0.4.0-beta.2   |
| GitHub OAuth                      | ✅ Complete | 0.8.3          |
| hCaptcha Integration              | ✅ Complete | 0.7.6          |
| Terms Acceptance                  | ✅ Complete | 0.7.0          |
| Set Password                      | ✅ Complete | 0.10.0         |
| CSRF Protection                   | ✅ Complete | 0.10.2         |
| API Key Management                | ✅ Complete | 0.16.0         |
| Device Management                 | ✅ Complete | 0.18.3         |
| Dashboard (框架 + 面板迭代)       | ✅ Complete | 0.37.0         |
| Achievements (奖杯系统)           | ✅ Complete | 0.42.0         |
| Leaderboard                       | ✅ Complete | 0.41.0         |
| Settings                          | ⏳ Pending  | 1.0.0          |
| i18n (zh/en)                      | ⏳ Pending  | 1.0.0          |
| E2E Test Coverage                 | ⏳ Pending  | 1.0.0          |
| Production Deploy                 | ⏳ Pending  | 1.0.0          |

## Leaderboard

- [x] **v0.41.0 (2026-09-14)** 契约修复 — 该页**从未能工作**：契约层写的是一个**不存在的 API**（三个端点在真机上 `/global`、`/me` 均返 **HTTP 500**，而真实的单一端点 `GET /api/v1/leaderboard?dimension=…` 返 200），字段（`totalMinutes`/`totalUsers`/`updatedAt`/`avatarUrl`）后端从不返回，且没有 `dimension` 概念。按实测契约重建：五种维度 + 可选周期 + `limit`/`offset` 分页 + 自己的排名（在同一响应内，非第二个端点）。三个必须容忍的服务端行为：`displayName` 与 `currentUserRank` 对「账号已删」/「未上榜」是**键缺失而非 null**（写成 required-but-nullable 会让**整页解析失败**，实测第 2 页落入错误态）；非法维度×周期组合返 **400 `COMMON_003`**，故合法组合编码为数据（STREAK/NIGHT_OWL/EARLY_BIRD 仅 ALL，GROWTH 仅 WEEK），选择器据此生成，实测全程**零非法请求**。`rank` 原样显示（并列同名，实测 1,2,3,3,5,5…）、分数按维度格式化（秒 / 连击天数 / 带符号增长）、空页是状态非错误。路由补上 `AppLayout`（原先扁平注册导致**无侧边栏与导航**）。

## Achievements 奖杯系统

- [x] **v0.42.0 (2026-09-14)** 周期成就历史（后端 v0.72.0）— 卡片新增两行事实：`totalUnlocks`（得过几次）与 `periodStreak`（连击，🔥）。**关键：这些字段由后端从 sessions 回算，不是数解锁行** —— 我先前给后端的需求报告判断「表里的行即达成历史」是**错的**：`insertIfAbsent` 仅 1 处调用 → `evaluate` 仅 1 处调用 → `getAchievements`（即 `GET /achievements`），push 只 `evictCache` 不评估，无定时任务。故表里的行 = 「用户访问过成就页的那些周期」，照我方案做会系统性偏低；后端改为回算 ∪ 表行（并集保证单调）后驳回正确。前端：字段为 **per-rung**（实测 day 阶梯 13/12/11），取**最低阶**作为阶梯对外值（构造上单调、且本期未达成时仍有值）。🔥 按用户要求**零也显示**（全零阶梯读 `🔥0 · 0 years reached`），终身卡不显示（字段对其无意义）。过程中我的两个真实缺陷均由**真机**发现：`1 months reached` 单复数、以及「三个零说同一件事」。测试 **1400/1400**。
- [x] **v0.41.0 (2026-09-14)** 奖杯外圈几何修正 — 用户报告「圈不一定包住图标、图标可能不在圈正中」经实测**属实且可量化**：完成阶梯后绘制的 `r=11`（内沿 10.5，已是 24 网格极限）**九个图形全部溢出**（+0.82 ~ **+2.58** 单位，日历类最远 13.08），且**六个偏心**（最多 2 单位）。修法：`<g>` 变换把每个图形按**自身包围盒中心**缩放并映射到格心（`translate(CENTER*(1-s) - s*offset) scale(s)`），统一进入圈内（最远 9.9 / 内沿 10.5）并精确居中。**注意我的第一版公式漏了 `CENTER*(1-s)` 项**，致每个奖杯整体位移 ≈4.7 单位 —— 审查看不出来，真机量渲染才暴露（圆心实测 21.6 而非 12）。几何知识入新文件 `achievements/trophy-geometry.md`（R24 单文件 ≤200 行）。真机：8 家族中心均 (12,12)，像素间隙 2.34–4.59px（修复前圈内沿 17.5px、图形达 21.8px）。新增 6 项几何测试（可证伪）→ **1384/1384**。
- [x] **v0.40.0 (2026-09-14)** 周期成就的截止呈现 — 「Current period」按窗口分子区（Today / This week / This month / This year），每区显示日期区间与倒计时；**截止期属于窗口而非奖杯**，故区间与倒计时只渲染在分组头一次（放卡片会重复 2–3 次并暗示每卡各有到期时间）。倒计时注入时钟（`useNow({ interval: 60_000 })`，`@vueuse/core` 已是依赖），否则页面跨午夜会一直显示昨天。紧迫感**只用既有 token 不引颜色**（收尾期 muted→foreground 且字重转 medium，明暗均已实测，非色彩信号可过灰度）——`DESIGN.md` 无紧急色，其状态色语义是成功，且 P3 已记录自造紧迫配色的代价。0 天写作 `Ends today`（「0 days left」在仍有效的当天读作已过期）。测试 **1350/1350**。
- [x] **v0.39.0 (2026-09-14)** 对接后端 v0.71.0 成就扩展 — 后端由 15 阶增至 **67 阶 / 14 阶梯**，新增响应字段 `type` / `tier` / `window` / `windowStart` / `windowEnd`（**向后兼容**，但 `PERFECT_MONTH` 的 `unit` 由 `month` 改 `percent`）。前端**删掉自维护的 code→家族映射表**（净删约 130 行）改为数据驱动，分组键取 `(type, window)`（`TOTAL_SECONDS` 五条阶梯各自 `tier` 从 1 起，按 `type` 分组会把日阶并成终身阶第 9–11 阶），阶序取服务端 `tier`（code 不可解析：`DAILY_BURST` 是第 3 阶而 `DAILY_BURST_4` 第 1 阶）。窗口字段对 LIFETIME 是**键缺失**（Jackson non_null）故 `.nullable().default(null)`。页面分「Lifetime / Current period」两区，卡片显示窗口名以区分五个同名「Total time」阶梯。双审查后修 7 处，含两项自测未覆盖的真实缺陷（同名卡不可区分、`activeDays` 图形从未绘制）。真机 14 卡 / 19 of 67 / 28%。1323/1323。
- [x] **v0.38.0 (2026-09-13)** Achievements 独立页面 — 后端 15 徽章实为 **7 家族 × 2–3 阶**且 progress 为家族级（实测同家族共享同一值），故按「一家族一奖杯 + 阶级阶梯」渲染（非 15 张卡）；内联 SVG 奖杯（每家族一个路径集，阶级只换填充，无图片资源）、纯函数 `trophy-model.ts`（分组/进度/排序）、进度按**当前阶→下一阶的跨度**度量、未知 code 仍以单阶奖杯渲染（新增成就无需前端改动）；配色不引第二套色，用既有靛蓝阶亮度递进（DESIGN.md 禁装饰性用靛蓝）。新增领域 `domains/achievements/`。1307/1307。

## Dashboard 面板迭代（v0.28 – v0.37）

- [x] **v0.37.0 (2026-09-12)** Recent sessions 面板 — 接上 v0.19.0 建好但无 UI 引用的 `/stats/recent` 契约层，成为第 8 张面板（与 Time of day 配对）。**本地日分组**的会话日志（`startTime` 是 UTC，切 ISO 串会归错天）；不显示日时长合计（并行会话叠加会超出真实墙钟）；并列时间加客户端确定性次级排序；不跟随筛选栏 Period（端点无日期参数）。抽出共享滚动外壳 `ScrollFadeList.vue`（分布列表回归 18/18 证明提取未改行为）。1284/1284。

- [x] **v0.36.0 (2026-09-11)** Coding trend 可选月份 — 默认保持 last 30 days，新增面板级窗口（本地状态、不进 URL，与热力图选年同级，筛选栏 Period 不影响；避免选月触发全外壳重渲染）；新增 `TrendMonthSelect`（Last 30 days / 年份行 / 12 格月份网格，无数据的月置灰）；消费后端 v0.67.0 新端点 `heatmap-months`（`heatmap-years` 同版本加 `timezoneOffset`，两者同源保证年月自洽）；新增 `ui/popover` 原语（无新依赖）；修 ChartSection 占位态高度塌陷（骨架替代图表 + loading 隐藏 actions 导致切年份卡片 379→188→379）。1266/1266。

- [x] **v0.35.0 (2026-09-10)** Project distribution 上线 + 两处 bug 修复 — 抽出共享的排名分布实现（`useRankedDistribution` / `RankedDistributionList` / `@/lib/utils` `formatPercent`），Language 与 Project 两面板只保留各自 query 与文案；修 `distribution` 查询键漏窗口参数（切 Period 时分布面板不重取，屏幕留旧窗口数据）；修 TOD 段缝用取整百分比导致偏离颜色边界。1254/1254。

- [x] **v0.34.0 (2026-09-10)** Language distribution 收敛 — treemap 被否（大色块、小格不可读）→ 排名横条；**全部语言逐行呈现**（无行数上限），卡片用内部滚动 + 双端 mask 渐隐 + 页脚计数限高；唯一折叠为 <0.1% Others（hover 用项目 `Tooltip` 列出明细）；**全局渐变**（轨道 `container-type` + 条 `background-size:100cqw`，色标复用 TrendChart）；Others 与语言行完全一致（无 tint/alpha 差异）；行内原生 `title` 移除。1233/1233。
- [x] **v0.33.0 (2026-09-10)** Language 面板高度上限 — Top-8 窗口 + 其余并入 Others（后被 v0.34.0 的全量列表取代）。1227/1227。
- [x] **v0.32.0 (2026-09-10)** 分布面板接入筛选窗口 — 后端 v0.66.0 `/distribution` 支持 `start`/`end`，TOD + LANGUAGES 跟随筛选栏（此前恒全史，与 summary 卡口径分裂）；LANGUAGES 移除 Total 页脚（分类分布桶总和 ≥ 真实活动时长，无业务含义）。1226/1226。
- [x] **v0.31.0 (2026-09-10)** Language distribution 面板上线 — 排名横条（长度按最长语言归一）、0.1% 折叠 Others、`% · duration` 尾标、百分比 2 位小数。1226/1226。
- [x] **v0.30.0 (2026-09-10)** Time of Day 重设计 — 24h 标尺（后删）+ Lucide 日相图标图例 + 固定信息条（锚定段中心，取代跟随鼠标的 tooltip）+ 端点对比度调优 + JSDoc 对齐 v0.65 契约。1222/1222。
- [x] **v0.29.0 (2026-09-10)** 容器查询布局阈值 — 面板卡 ≥830px 才两列（`@container/page` 1684px），Summary 行 ≥1430px 才六列（`@container/sc`）；面板全部平权、ChartSection 内容垂直居中；e2e 锁定阈值契约。1222/1222。
- [x] **v0.28.1 (2026-09-04)** 占位清理 + 空白页守卫 — 删除 4 个占位 DistributionPanel、路由 Suspense 骨架 + chunk 失败 toast。1222/1222。
- [x] **v0.28.0 (2026-09-04)** Time of day distribution 上线 — 4 桶胶囊（后于 v0.30.0 重设计）。
- [x] **v0.27.0 (2026-09-04)** formatDuration — 时长封顶到小时（不显示天），保留秒级精度；SummaryCards + 各图表 tooltip 统一。1215/1215。
- [x] **v0.26.0 (2026-09-04)** HourlyPanel 接入日期窗口（后端 v0.64.0 `hourly` start/end）；修复面板内部 query 未接收窗口参数的接线 bug。1215/1215。
- [x] **v0.25.0 (2026-09-03)** Average hourly duration（24 柱图）— 抽出共享 Y 轴 helper；架构修正：面板改为纯图表组件、由父级持有 query 与 ChartSection（自包装会导致图表初始化失败）。1215/1215。
- [x] **v0.24.0 (2026-09-03)** Weekly activity by hour（7×24 热力图）— 后端 v0.63.0 `week-hour`；ECharts custom series 手绘方格（格子正方形、连续色阶按窗口峰值动态缩放，插件语义一致）。1210/1210。
- [x] **v0.23.0 (2026-09-02)** 30-day trend chart — 三轮反馈收敛为"线本身是垂直渐变"（`graphic.LinearGradient`）；`GraphicComponent` 未注册是二轮静默失效的根因。1203/1203。
- [x] **v0.22.1 / v0.22.0 (2026-09-02)** Heatmap 桶位重标定（`<15m…>8h`）+ 年份选择器（后端 v0.61.0 `heatmap-years`；热力图时间轴由年份选择器独占，与 Period 筛选正交）。1197/1197。
- [x] **v0.21.0 / v0.20.0 (2026-09-01)** Dashboard D2–D4 — URL 筛选状态（start/end/deviceId/ideName + 预设）、10 个插件对齐面板、SummaryCards 6 字段、GitHub 风格热力图。1172/1172。
- [x] **v0.19.0 (2026-08-31)** Stats API 契约层 — stats schema（7 响应 Schema + DistributionType 枚举）、`lib/api/stats.ts`（timezoneOffset 自动）、useStats composables + 查询键工厂。1142/1142。

## 工具链

- [x] **依赖更新 (2026-09-12)** `vp update -L` — @lucide/vue 1.45.0、zod 4.6.2、@types/node 26.5.1、lint-staged 17.5.1、eslint-plugin-oxlint 1.82.0、**vite-plus + vite 0.3.1**。`-L` 同时把 typescript 升到 7.0.2、vitest 升到 5.0.0，**均已回退**（TS7 被 @typescript-eslint 的 peer `>=4.8.4 <6.1.0` 拒绝且移除 vue-tsc 依赖的 programmatic API；vite-plus 0.3.1 仍硬钉 vitest 4.1.11）。五项门禁全绿，未改版本号（用户指令）。
- [x] **v0.36.1 (2026-09-11)** 阻止 pnpm 隐式安装污染受控配置 — `pnpm-workspace.yaml` 设 `verifyDepsBeforeRun: warn`（v11 默认 `install` 会让 `pnpm run` 隐式安装，遇未决策的构建脚本时把非布尔占位符写入该受控文件；`warn` 只报告不写入，且不像 `error` 那样被版本号变更误触发）。1266/1266。

## 更早里程碑（v0.8 – v0.18）

- [x] **v0.18.3 → v0.18.0 (2026-08-29/30)** Device Management N/O — `revokedAt` 撤销态、错误码映射（COMMON_002 / DEVICE_001）、共享时间工具、E2E 覆盖（9/9）。1128/1128。
- [x] **v0.17.3 → v0.17.0 (2026-08-23/24)** 密码可见性切换；SetPasswordDialog 服务端错误改为字段级映射（不再底部横幅）；USER_014 资源级 401 不再登出；Change Password 双模式对话框。1078/1078。
- [x] **v0.16.19 → v0.16.14 (2026-08-14/21)** 限流 429 验证 + E2E 表单保留；错误码拆分 AUTH_014→AUTH_024；删除约束防御验证；vee-validate 卸载崩溃修复（`keepValuesOnUnmount`）；自定义日期字段点击唤起选择器；Custom 模式 scope 描述常显。1057/1057。
- [x] **v0.16.6 → v0.16.0 (2026-08-14)** 移动端侧栏 UX 收敛、RawKeyDialog a11y 修复、hCaptcha CSP 修复、API Key 永久删除（REVOKED/EXPIRED）+ 共享确认对话框。1041/1041。
- [x] **v0.15.5 → v0.15.0 (2026-08)** API Key schema `NON_NULL` 兼容（`.nullable().default(null)`）、侧栏布局回归修复（Rolldown SFC 丢弃 defineProps）、E2E 套件 + 响应式卡片视图。1026/1026。
- [x] **v0.14.0 → v0.10.9 (2026-08)** API Key 创建/撤销/一次性密钥展示全流程、429 倒计时、骨架屏防闪烁、CSRF 保护、CSP、OAuth 绑定与解绑、User Avatar、邮件修改、Set Password。897–1008 测试。
- [x] **SKILL_GRAPH.md 重建 (2026-08-24)** — 按实测重建技能索引（465 去重），修 52 处幽灵引用。AI 内容，仅 develop。
- [x] **依赖更新（多次）** — `vp update -L` 例行走查；TS7 尝试失败 → 精确钉定 6.0.3（红线加固）。

## Completed (Early)

- [x] Technology stack selection & project scaffold
- [x] Router architecture (feature-based, type-safe meta, guards)
- [x] Layout system (AuthLayout + AppLayout, mobile responsive)
- [x] Auth module (JWT login, token management, router guards)
- [x] Lazy loading & chunk optimization
- [x] Error handling (ErrorBoundary, 404View, Sonner toast)
- [x] API layer (ofetch instance, JWT interceptor, global error handling)
- [x] Vite+ migration (unified toolchain via `vp` CLI)

## Backlog

- [ ] Auth: Token refresh + expiry handling
- [ ] Dashboard: Weekday / IDE / Devices distribution panels（后端已就绪；Project 已随 v0.35.0 上线，其余复用共享排名列表）
- [ ] Leaderboard: Redis ZSet ranking display
- [ ] Settings: Language switch (zh-CN / en-US)
- [ ] CI: GitHub Actions (lint + test + build)

## Archived History

v0.16.14 → v0.34.0 的完整时间线见 `memory-bank/archives/2026-09-10-activeContext-archive.md`；
v0.16.13 及更早见 `memory-bank/archives/2026-08-16-activeContext-archive.md`。

归档于 2026-09-10（v0.34.0）。
