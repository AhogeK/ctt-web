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
| Landing Page (P2 视觉基元与版面节奏) | ✅ Complete (P2) · P3–P6 待做 | 0.51.0 |
| AuthLayout 展示面板 (指针光/3D)   | ✅ Complete | 0.51.0         |
| Settings                          | ⏳ Pending  | 1.0.0          |
| i18n (zh/en)                      | ⏳ Pending  | 1.0.0          |
| E2E Test Coverage                 | 🚧 Partial  | 1.0.0          |
| Production Deploy                 | ⏳ Pending  | 1.0.0          |

## E2E Coverage

- [x] **v0.42.2 (2026-09-14)** 成就页与排行榜页的 E2E — 此前两页**零 E2E 覆盖**（`e2e/auth/protected-routes.spec.ts` 只断言未登录跳转）。新增 `e2e/achievements/`（8 用例）与 `e2e/leaderboard/`（13 用例）：真实路由 + 真实 query + 真实 DOM。两条断言**只有真机能验**：① 奖杯图形是否落在完成圈内并从 `getBoundingClientRect` 反算（jsdom 的 `getBBox()` 全为 0，单测无能为力）；② 排行榜的 `dimension`/`period` 组合是否只发服务端接受的（非法对是 **400 `COMMON_003`**，故对**线上请求**断言而非渲染结果）。两者均已**注入缺陷验证可证伪**（改行号排名 / 恢复漏项公式 → 对应用例失败）。过程中确立 4 条 E2E 约定并写入 `systemPatterns.md`：fixture 声明 **wire 形状**而非 schema 解析类型（`.default(null)` 让输出类型要求键存在，而服务端是**省略键**）、每用例仅一次导航（内存态会话下 `reload`/新 `goto` 会退回登录页）、TanStack 按 key 缓存故回访**不发请求**、断言集合而非逐项 `if`（`no-conditional-expect`）。chromium 75/75。

## 知识库治理（2026-09-15）

- [x] **R24 补齐四项缺口 + 首次校准** — 领域树此前只记录「什么是真的」，不说**如何保持为真、每条事实从哪来、能信到什么程度**。补齐：**回源**（本仓库行为→代码/配置；界面呈现→**真实渲染**；后端契约→`../ctt-server` 源码 + 记录时版本；产品意图→用户表述；历史→git log）、**维护机制**（增量 + 校准，校准触发为后端 `appVersion` 变化）、**元数据与核对基线**、**渐进式披露**。约定对齐 `../ctt-server` 的同类实现（commit `72ddbd5`），两仓库不分裂成两套。规程入 `domains/README.md`，规则本身只留可裁决的约束。
- [x] **首次校准即发现真实漂移** — 后端 v0.73.0（`0111900`）改了 leaderboard 契约：新增 `ACTIVE_DAYS` 维度、`NIGHT_OWL`/`EARLY_BIRD` 放宽到全部周期、`GROWTH` 放宽到任意非 `ALL`、响应新增 `totalParticipants`；我们仍是旧契约（我们记录时**是对的**，是后端改了）。已记入 `backend-contract/meta.md`；修复需改 Zod schema（R7），**未擅动，待决策**。
- [x] **解掉一处规则互斥** — R5「记忆与业务代码同 commit」与 R6.5「AI 相关内容单独提交」互斥，且与实际历史不符 → R5 只约束**时机**（不滞后，R2），commit 边界归 R6.5。另写明 `ai-workflow` P5（文件无草稿态）与「待确认」标记（单条事实可标）的分工。

- [x] **v0.45.3 (2026-09-18)** 排行榜两处修正。① **切榜时列表被骨架顶掉**（用户报告"闪烁一下"）：切到未访问过的维度 → 查询键无缓存 → `isPending` 为真 → 模板把可见列表整个换成骨架。**真机实测**：`rows:1` → `skel:20 rows:0 @3ms` → `rows:1 @33ms`。修法 `placeholderData: keepPreviousData` + 在 `isPlaceholderData` 期间**变暗并置 `aria-busy`**（变暗不是装饰：否则读者会在新标签下读到上一个榜的名次，比闪烁更糟）。回归用例**刻意挂起响应**，否则新数据可能在一帧内到达、断言无论怎么写都通过；**已验证可失败**（撤掉 `placeholderData` 即变红）。② **GROWTH 正负记法不对称**：正 `+1h 30m`（字形）、负 `1h 30m down`（词语）—— 同一轴上两种记法，且 `+` 违反了该文件自定原则"方向由词承载"。改为双向用符号 `+1h 30m` / `−1h 30m`（U+2212，与 `+` 等宽，适配 `tabular-nums`），零值仍不带符号（`+0s` 会读成增长）。**符号紧贴数字不加空格**是对的：符号是数字的一部分，而 `1h` 与 `30m` 之间的空格是词元分隔，二者职责不同。

- [x] **v0.46.0 (2026-09-18)** L3「我的行高亮 + 跳转到我的排名」— 任务书写的是 `useInfiniteQuery` 的 `fetchNextPage` 逐页累加，**本项目不是那个模型**（显式 offset 分页 + 上一页/下一页），故实现为**一次切到目标页偏移** `floor((rank-1)/20)*20`：同样的落点，不必把中间页拉下来再丢掉。高亮按 **`userId`** 而非 rank（并列同 rank 会点亮多行）；未上榜时不渲染控件（旁边已写「Not ranked」，禁用控件等于问一个问题却没有答案）。真机验证抓出一个我自己造成的缺陷：高亮原为 `bg-primary/5`，**暗色模式下几乎不可见** → 改为 `border-primary` + `bg-primary/12`（仍只用 `primary` 令牌）。测试：单测 +6（含并列 rank 只标一行、rank 45 → offset 40）、E2E +3（含 `aria-current` 唯一性、请求带 `offset=40`）。真机仅覆盖「未上榜 + 高亮」（无有排名的测试账号，跳转路径由单测/E2E 覆盖）。

- [x] **v0.46.0 L4 判定：不适用** — 原设计要求 `@tanstack/vue-virtual`，触发条件是「已加载行数 >100（≥2 页）」。本项目在 L3 采用**显式 offset 分页**（每页 20 行、切页替换而非累加），该前提**构造上不可达**；为其引入依赖即撞 R12 红线「禁止冗余依赖」，而诉求（长榜单流畅）已由结构解决。**不是"未做"而是"前提不存在"**，故在计划中标注为不适用并写明**复活条件**（若改为累积式无限滚动则重新评估）。本次不动代码、不加依赖、不升版本。

## AuthLayout 展示面板（v0.51.0）

- [x] **v0.51.0 (2026-09-21)** 指针光与底光的架构定论 — 三层光各自归属：掠光属鼠标（卡内）、聚光描边属几何、**底光属卡片**（指针只激发）。核心结论：卡片自带的 `::after` **不可能**被相邻卡遮挡（`A<B` 与 `B<A` 不可兼得 + 内联 `transform` 锁死层叠上下文）⇒ 底光改为**场景级单层**（z=0，位于三卡之下）⇒ 三张卡行为一致（间隙渗光 / 被相邻卡遮挡 / 被挡的光在下一段间隙继续 / 卡面 ≤1 count）。两处"无形墙"根因：盒子射程小于光（需 `B ≥ R + 2σ`）与祖先 `overflow: hidden` 的 64px 二次裁剪。测量教训：差分前必须冻结卡片 `transform`，否则量到的是位移（"卡面穿透 25.3" 冻结后为 3.7）。两次样式表自伤事故（删除正则吃掉属性行 / 把 1783 行削到 187 行）促使新规矩：该文件只许追加或精确整串替换 + 每步构建（AGENTS.md R27）。1450/1450 unit · auth e2e 21/21。
- 领域知识：新建 `domains/auth-layout/`（五件套 ✓ 含 P1–P4 原则与实测参数表）。

## 落地页 P2 收口（v0.51.0，2026-09-24）

- **P2「视觉基元与版面节奏」✅ 完成** ✓：区块容器（`LandingSection.vue`）· 手写 hover 守卫（手写 CSS 16 条全包 `@media (hover: hover)` ✓）· 主题首帧（`public/theme.js`，CSP 下必须外链 ✓）· 粘性契约（`--marketing-header-height` 单一来源 ✓）· 标题阶梯（`@theme` 令牌，h1 实测 **64px / 510 / −1.408px** ✓）· 表面与分隔（按 `DESIGN.md` §4 注册 `--surface` ✓）· 按钮复用（`components/ui/button`，未新建样式 ✓）· `motion-reduce` 全局覆盖 ✓ · 令牌审计（4 项例外各有出处 ✓）· **面板动效**（2026-09-21 复起 ✓ v0.48.1 → v0.51.0 ✓）。
- **验收实测**（1440×900 · 暗/亮/reduce）：② 双模成立 ✓（15 处文本 **14 处 ≥ 4.5** ✓；hero 眉题 `text-primary` **4.24 / 4.42** —— **用户目视裁定：可接受 ✓ 不改动**（2026-09-24））；③ reduce `getAnimations() = 0` ✓ vs 对照组 5 ✓。**滚动动效不可测** ✗（页面无可滚内容 ✓）。
- 后续阶段：P3 Hero 与价值演示 · P4 能力/开源 · P5 定价 · P6 测试与文档（见计划 §P3–P6 ✓）。

## UI 对比度与 hover 口径（v0.51.3，2026-09-24）

- **按钮 hover 定稿** ✓：实心主按钮 = 填充与文字不动、只动 `box-shadow`（1px 品牌外轮廓 + 沉降阴影，180ms）✓；outline 家族 = 边框 + 阴影、**不加底色** ✗；ghost = 文字 + 发光 ✓；破坏性 = 红边框 ✓。配方登记 `DESIGN.md` §6/§10 ✓，状态样式由 `main.css` 的 `[data-variant='default']` 规则独占（9 处调用点的旧 hover 全部撤除 ✓）。
- **暗色面层**：抬灰被否 ✗ ⇒ 只加强边框（`rgba(255,255,255,0.12)` ✓）。
- **两次组件级修复** ✓：`Button.vue` 的 `data-variant` 反映生效变体（否则按它写的 CSS 永不匹配 ✗）；复杂任意阴影改走纯 CSS（Tailwind v4 静默丢弃 ✗）。

## Leaderboard

- [x] **v0.41.0 (2026-09-14)** 契约修复 — 该页**从未能工作**：契约层写的是一个**不存在的 API**（三个端点在真机上 `/global`、`/me` 均返 **HTTP 500**，而真实的单一端点 `GET /api/v1/leaderboard?dimension=…` 返 200），字段（`totalMinutes`/`totalUsers`/`updatedAt`/`avatarUrl`）后端从不返回，且没有 `dimension` 概念。按实测契约重建：五种维度 + 可选周期 + `limit`/`offset` 分页 + 自己的排名（在同一响应内，非第二个端点）。三个必须容忍的服务端行为：`displayName` 与 `currentUserRank` 对「账号已删」/「未上榜」是**键缺失而非 null**（写成 required-but-nullable 会让**整页解析失败**，实测第 2 页落入错误态）；非法维度×周期组合返 **400 `COMMON_003`**，故合法组合编码为数据（STREAK/NIGHT_OWL/EARLY_BIRD 仅 ALL，GROWTH 仅 WEEK），选择器据此生成，实测全程**零非法请求**。`rank` 原样显示（并列同名，实测 1,2,3,3,5,5…）、分数按维度格式化（秒 / 连击天数 / 带符号增长）、空页是状态非错误。路由补上 `AppLayout`（原先扁平注册导致**无侧边栏与导航**）。

- [x] **v0.43.0 (2026-09-15)** 按 ctt-server v0.73.0 重建排行榜契约 — 知识库首次校准发现的漂移，**当日修完**。三处：① 新增第六维度 `ACTIVE_DAYS`（有记录的天数）；② 周期组合放宽到 `supports()` 的真实范围（只有 `STREAK` 限 `ALL`、只有 `GROWTH` 排除 `ALL`，此前把 NIGHT_OWL/EARLY_BIRD 限死 `ALL`、GROWTH 限死 `WEEK`，**少给用户合法选项**）；③ 响应新增 `totalParticipants`，分页判定由「整页即可能还有」的启发式改为精确计数——**整页倍数时多给一页**的旧缺陷随之消失。三处断言均注入缺陷验证可证伪（`ACTIVE_DAYS` 掉出天数分支 / 退回旧启发式 → 对应用例失败）。1405/1405 unit + e2e 13/13。

- [x] **v0.44.0 (2026-09-16)** 排行榜接入 ctt-server v0.75.0 — 第七维度 `LANGUAGE`（按语言分区）与 `GET /leaderboard/languages`。前端一个组件驱动全部 24+ 种榜单：分数按维度格式化（穷尽 switch，新维度必须显式决定单位，不再有 `default` 兜底）、周期由矩阵驱动、请求类型做成判别联合使两种非法组合不可构造。语言选择器按 Linguist 分类分组（`Select` 提供键盘导航与 ARIA）。三处顺带修复：① 未上榜从「留空」改为明说并给出「第 N 名 / 共 M 人」；② 在途请求接入 `AbortSignal`（限流 60/分钟，切维度必须取消旧请求，E2E 断言 `ERR_ABORTED`）；③ 清掉 `LEADERBOARD_001/002` 的陷阱文案——两码在后端枚举里定义但**全后端零抛出**，其中「未上榜」被写成错误提示，而服务端恰恰把它建模为 `null`。**发现并上报一个后端缺陷**（详情见 `backend-contract/references.md`）：`/languages` 会列出查询必 400 的 `Other` 条目。1417 unit + e2e 84/84。

- [x] **v0.44.0 适配 ctt-server v0.76.0 (2026-09-17)** 语言目录改为词表全集 — 842 条（原为「有成员分的榜」，24 条），每条新增 `hasMembers`。**这是我在上一轮判断后提出的需求，后端已按此实现**：原实现的过滤理由是「避免列出空榜」，但实测它既没反映活动（`Python`/`Go`/`Rust`/`Shell` 查榜返 **200** 却缺席），又依赖「谁在功能上线后推过数据」。前端改动：删除 `selectableLanguageBoards`（`canonical ∩ nonLanguages = ∅` ⇒ 死代码）、选择器改为分类内 `hasMembers` 优先 + 分隔线（否则 29 个有榜的淹没在 842 项里）。真机实测可滚动、分界正确、空榜可打开；`Next` 在「3 行 / 共 3 人」下确实禁用（DOM 实测，我目视截图曾误判）。

- [x] **v0.44.1 跟进 ctt-server v0.76.1 (2026-09-17)** 目录默认回到「只有成员分的榜」 — v0.76.0 的全量默认作废，全量需 `?includeEmpty=true`。**前端零改动**（我们从未请求该参数，选择器照常分组渲染 29 条、无分隔线）。修正的是**测试失真**：fixture 含默认响应不会返回的无成员条目；「打开空榜」用例断言的路径已不可达（默认不列出空榜），改为独立的「`includeEmpty` 形态排序」用例。另记录：删除会话现在真会移除榜上成员，`totalParticipants` 可下降（分页已按精确总数处理）。

## 账号与设置

- [x] **v0.45.1 (2026-09-17)** 终结 E2E 会话被"附带请求"摧毁 —— 曾被当作 `dashboard`/`leaderboard` 的既有 flaky，实为**同一个根因**：任何未被 mock 的请求打到真服务端返 **401** → 全局处理器 `clearAuth()` → 会话消失 → 守卫把标签页踢回登录页 → 失败落在离断言很远处（典型是等一个永不出现的登录输入框 `fill` 超时）。**失败用例名轮换**正是因为"哪个页面先发出未 mock 的调用"是随机的。修法：`mockAuthApis` **最先注册**一条兜底路由（特定路由仍优先），附带请求返 200 而非结束会话；`leaderboard` helper 改为**仅在无会话时登录**（会话活着时 `goto('/auth/login')` 会被守卫弹回，登录表单永不出现 —— 这个假设此前被"已死的会话"掩盖着）。结果：**93/93 全绿**，套件 1.4m → 59.5s。
- [x] **v0.45.0 E2E 夹具修复 (2026-09-17)** settings E2E 的两处**测试基础设施**缺陷：① `mockAuthApis` 未 mock `/auth/oauth/accounts`，该请求打到真服务端返 401 → 全局处理器 `clearAuth()` → **会话被清空、store 归默认**，表现为「删除对话框分支选错」这一假象；② refresh mock 漏 `userId`（`LoginResponseSchema` 要求 UUID），使任何整页重载都解析失败并清空会话。修复后 settings/api-keys/devices/auth 共 **57 passed / 0 failed**。`e2e/settings/delete-account.spec.ts` 改为**只读** store（分支由应用自身启动拉取决定）。另记录：`dashboard`/`leaderboard` 曾表现为 **flaky**，**已定位并修复**（见下条）。
- [x] **v0.45.0 (2026-09-17)** 账号删除（Danger zone）— 新增 `DangerZone.vue` + `DeleteAccountDialog.vue`：有密码验密码、无密码打字确认邮箱（邮箱未知则禁用按钮，不用空串兜底）；成功后本地清态并跳登录，**绝不调用登出接口**（账号已不存在，那会 401）。三处连带修复：① `clearAuth()` 补清 TanStack 缓存（既有缺陷：登出后同标签页换账号会读到上个账号数据）；② 危险区提为独立组件并由 `ProfileView` 置于页面最后（放在 `AccountSection` 内时排在 `Connected Accounts` 之前，与「最后一块」的意图矛盾）；③ 对话框空输入不再泄漏裸 Zod 报错。测试失真两处已改：`USER_014` 不是 `USER_013`；mock 状态码改为真实的 401（400 会跳过唯一可能踢人下线的路径）。1431/1431 unit、93/93 e2e 全绿。

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
- [x] Leaderboard: Redis ZSet ranking display (v0.41.0 — contract rebuilt against `GET /leaderboard`)
- [ ] Settings: Language switch (zh-CN / en-US)
- [x] CI: GitHub Actions — workflow 早已存在，但触发条件写的是从未存在的 `main` 分支，**因此一次也没跑过**；v0.42.3 修正为 `develop`/`master` 并显式 `--project=chromium`。本机已用 CI 的命令验证（`pnpm test:e2e` 75/75）。**v0.45.2 已移除该 workflow**：三个 job 都止步于 `pnpm install --frozen-lockfile`、6 秒内失败 —— 是死在校验安装而非测试，lockfile 与 workspace 配置已漂移（即本地那条 WARN 的同源问题）。从未观察到它通过，故其红灯无法据以行动。`.nvmrc` 保留（本地 Node 版本约定，与 runner 无关）。

## Archived History

v0.16.14 → v0.34.0 的完整时间线见 `memory-bank/archives/2026-09-10-activeContext-archive.md`；
v0.16.13 及更早见 `memory-bank/archives/2026-08-16-activeContext-archive.md`。

归档于 2026-09-10（v0.34.0）。
