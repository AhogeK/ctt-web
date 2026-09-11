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
| Dashboard (框架 + 面板迭代)       | ✅ Complete | 0.36.0         |
| Leaderboard                       | ⏳ Pending  | 1.0.0          |
| Settings                          | ⏳ Pending  | 1.0.0          |
| i18n (zh/en)                      | ⏳ Pending  | 1.0.0          |
| E2E Test Coverage                 | ⏳ Pending  | 1.0.0          |
| Production Deploy                 | ⏳ Pending  | 1.0.0          |

## Dashboard 面板迭代（v0.28 – v0.36）

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
