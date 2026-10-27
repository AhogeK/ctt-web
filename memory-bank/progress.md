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
| Dashboard (框架 + 面板迭代)       | ✅ Complete | 0.58.0         |
| Achievements (奖杯系统)           | ✅ Complete | 0.42.0         |
| Leaderboard                       | ✅ Complete | 0.41.0         |
| Landing Page (P1–P4 交付：基元 / hero / 演示 / 收口三区) | ✅ Complete (P1–P4) · P5–P6 待做 | 0.54.0 |
| README / docs refresh | ✅ Complete (2026-10-27 · `5a19822`) | 0.67.0 |
| AuthLayout 展示面板 (指针光/3D)   | ✅ Complete | 0.51.0         |
| Settings                          | 🚧 In progress (shell + 4 sections) | 1.0.0     |
| Interface Language (zh/en)        | ✅ Complete (2026-10-27 · v0.67.1) | 1.0.0 |
| E2E Test Coverage                 | 🚧 Partial  | 1.0.0          |
| Production Deploy                 | ⏳ Pending  | 1.0.0          |

## E2E Coverage

- [x] **v0.42.2 (2026-09-14)** 成就页与排行榜页的 E2E — 此前两页**零 E2E 覆盖**（`e2e/auth/protected-routes.spec.ts` 只断言未登录跳转）。新增
  `e2e/achievements/`（8 用例）与 `e2e/leaderboard/`（13 用例）：真实路由 + 真实 query + 真实 DOM。两条断言**只有真机能验**：① 奖杯图形是否落在完成圈内并从
  `getBoundingClientRect` 反算（jsdom 的 `getBBox()` 全为 0，单测无能为力）；② 排行榜的 `dimension`/`period` 组合是否只发服务端接受的（非法对是 **400
  `COMMON_003`**，故对**线上请求**断言而非渲染结果）。两者均已**注入缺陷验证可证伪**（改行号排名 / 恢复漏项公式 → 对应用例失败）。过程中确立 4 条 E2E 约定并写入
  `systemPatterns.md`：fixture 声明 **wire 形状**而非 schema 解析类型（`.default(null)` 让输出类型要求键存在，而服务端是**省略键**）、
  每用例仅一次导航（内存态会话下 `reload`/新 `goto` 会退回登录页）、TanStack 按 key 缓存故回访**不发请求**、断言集合而非逐项 `if`（`no-conditional-expect`）。
  chromium 75/75。

## 落地页 P2 收口（v0.51.0，2026-09-24）
落地页 P2 收口逐轮记录（v0.51.0 – v0.55.13：源码入口五版后定案弹窗 · 手机淡入淡出按时长 ·
顶栏 fixed 与 1px 边线回归 · 版块宽度统一 1440）→ `memory-bank/archives/2026-10-27-landing-p2-trim.md`。

## 商业转向（2026-10-08 · 文档轮 · 零代码）

- **完全免费 + 自愿捐赠（所有者裁定 ✓）**：不采用收费制度（理由：服务器无法承诺付费产品应有的保障）；
  三件套全免费、无功能分级、赞助无特权；渠道沿用插件端三渠道（**Ko-fi / 爱发电 / Solana** ✓ 核自 plugin.xml
  + README）；`business-plan.md` 与 `pricing-strategy.md` 重写为免费/赞助版，**旧收费研究 v2 原样归档**
  `pricing-strategy-archive-2026-10-07.md`；ctt-web README 加「Support」节。**捐赠者徽标评估 = 暂不做**
  （瓶颈在人工对账：Ko-fi 仅收款通知、爱发电接口开放度 `[待验证]`、Solana 无身份 ⇒ 替代 = opt-in 名单；复活条件已写明）。**落地页/页脚融入 ✓ v0.55.11**：定价带
  改为免费陈述 + 两运行方式 + 支持行（Blender 式：带内 + 页脚，无横幅）；托管格改「Not offered today」无控件、
  "数据可搬走"句删除；`SUPPORT_CHANNELS` 单源；**托管定位已决（2026-10-09）：将部署，尽力而为/无可用性承诺**。**提交**：0.55.11 四笔 → develop；
  master pick `2ac952f`/`06289e4`/`c461e90` ✓。**页脚对齐 + 宽度统一（v0.55.12–13）**：页脚曾自带容器 + 24 内缩（180 vs 156）⇒ 改用版块
  外壳 ✓；用户裁定 1440 为唯一宽 ⇒ `LandingSection` 改顶栏/首屏同款（1440 盒 + 轨内置、prose 折入）⇒ 实测全轴一致（文字 60 · 盒 36..1476）✓、E2E 钉三缘相等 ✓。
- **手机端间隙修复（v0.55.15）**：阶段末 32svh 留白是 P4 前"末块接页脚"的遗留 ⇒ 版块前 292px 空段（用户报 ✓）⇒ 删除后 72px ✓；单测 1481 · landing 26/26；S4666 ✓。
- **P5 计划改写 ✓**：定价节改「免费与赞助」（v0.55.11–13；托管定位已决：将部署）；其余行同步；业务文档 6 处 ✓；**条款文案已修 v0.55.14 ✓**（版本标识不单边动 ✓、防回退测试）。
- **P6 收口（2026-10-10 · v0.55.16）** ✓：真机截图基线 **26 张**（首屏/窗口特写/能力/怎么工作/免费/开源/页脚 × 亮/暗 × 1440/390，生产构建实拍）存
## 界面语言 · 认证 / 统计 / 设置 Profile（2026-10-25 · v0.65.1）
- 九页文案迁移 + 重发验证提示 + 共享 `api.errors.*`（42 码）；hCaptcha 按界面语言传 `hl`。
- OAuth 错误页不显示原始错误码；验证页失败态面板加 12px 间距、列宽 448px；截图分上下两段（整页长图会吞掉跨域验证码框）。
- 登录展示卡（仪表盘三格、实时指标、终端四行）标签本地化；品牌名、URL、语言名保留英文。
- 统计面板（0.63.0 ✓）：页头/筛选器/面板标题/空态错误态/图表提示与无障碍摘要/年月选择器走词条；0.63.2 修单位词与命名。
- 成就页（0.63.1）：页头/汇总/两分区/倒计时；67 个阶梯名按 code 映射；周期日期走本地化月日；排行榜（0.64.0）周期扩到本季/半年、连续天数按窗口、活跃天数默认本月、不展示成长。
## 界面语言收尾（2026-10-27 · v0.67.1）：应用回退/404/ui 默认/标签标题/周几轴
  /小时单位/store·API toast/OAuth 文案全清零；914 键 · 1589 单测 · E2E 161/161 ✓。
## 设置导航（2026-10-26 · v0.66.0）
- 侧栏设置分组直列四分区，删页内分区栏与 `SettingsShell`；`/settings` 落资料、旧 `/devices` 保留；E2E 10/10、桌面/375px 抽屉目视 ✓。
- **偏好设置页重设计（v0.66.1 · 已提交）**：主题三瓦片 + 语言双卡；1120px 7/5 分栏；焦点 2px；375 无溢出；单测 1584、设置 E2E 10/10。
## 减少动效偏好（2026-10-27 · v0.68.0 · 已提交）
- 三态 `system|reduce|full` + 独立键 `ctt.motion` + `<html data-motion>`；**属性承载结论**（reduce / full / 无），
  合并由 store 负责，CSS 只读属性 ⇒ 「完整动效」能压过系统要求，「减少动效」也能压过系统允许。
- 审查中实测抓出两处真缺陷并已修：full 无法恢复落地页入场；reduce 时文案先隐身 70ms（`animation-delay` 仍生效）。
- 四处 `no-preference` 媒体查询门控改属性驱动；5 处 `motion-reduce:` 变体删除；画布动画改读 `isReduced`。
- Preferences 第三区 + 首帧脚本同步 + 两条新回归 E2E。
## 工具链
- [x] **依赖更新（三轮）** `vp update -L`：TS7 每轮回退 6.0.3；vite-plus 1.3.0→1.4.0（vitest pin 仍 5.0.5）·
  新 peers 警告 = `@opentelemetry/api`（上游声明滞后）⇒ workspace 有界规则 · 未改版本号 · 详见 techContext · `53fd376`。
- [x] **session-discipline 1.1.0→1.1.5**：汇报形状两处漏网 + 拒绝后完整重发；词表补「评审/看什么/算错」；批准含命令的计划=授权（R6 ✓）；停机句全量重发 ⇒ 契约 **60**。
- [x] **v0.36.1 (2026-09-11)** 阻止 pnpm 隐式安装污染受控配置 — `pnpm-workspace.yaml` 设 `verifyDepsBeforeRun: warn`（v11 默认
  `install` 会让 `pnpm run` 隐式安装，遇未决策的构建脚本时把非布尔占位符写入该受控文件；`warn` 只报告不写入，且不像 `error` 那样被版本号变更误触发）。1266/1266。
## Backlog
- [ ] **统计页手机端（10-11 · v0.55.29 · 待评估）**：列表/过滤栏/时长✓；热力图 ⇒ 条带（锚今天/整年）；周时段/柱/时段 ⇒ 减负（条/线/2×2）；悬停片/点选 ⇒ 不出/可恢复；桌面零变化；验证 ✓。
