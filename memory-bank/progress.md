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
## 落地页收尾各段的出场次序（2026-10-27 · v0.68.1 · 未提交）
- 用户报「后面的段先出现」；实测：快速滑动下中间段整段从未出现（opacity 0），而它下面两段正常显示。
- 根因 = 两套出场机制互不知情（第一段走接棒触发，其余走观察器）⇒ 快速滚动时后者抢先。
- 修法：从未入场的段被滚过直接显示 + 段按文档顺序出场（等上段**开始**显现）+ **一律淡入**（用户打回过「跳现」版）。
- 用户二次打回：向上滚时接棒段不淡出 ⇒ 补离场条件 + 等待条件放宽。
- 用户三次打回：两段渐入方向不一致 + 向下滚时下一段不见了 ⇒ 交接改**锁存**、方向统一为「从进入侧来」；
  最终机制收敛为「**每段进入视口时淡入、离开时淡出**」，顺序由行进方向自然决定 ✓；测量改用**缺陷探测器**（找「在屏内却看不见」的时刻）✓。
- 用户五次打回：向下滚时「它是怎么工作的」整段空白（高窗口下触发）⇒ 等待集合从未写入 ⇒ 补 `waiting.add` ✓。
- 顺带退休速度挂起机制；接棒交叉淡入契约未破坏（1400 处同为 0.61/0.62）✓；E2E 166（含新回归，修复前红）。

## 收尾各段的出场次序 —— 审查与定夺（2026-10-27 · v0.68.1）
- **两轴审查**（Standards / Spec）捞出的真问题：顺序断言**恒真**（拿「已到的段」互比）⇒ 藏了好几轮真实缺陷；
  释放路径与锁存/来向**零单测**；`useScrollFade` 的 JSDoc 描述的是**旧行为**；`dev-handbook` 685 行与代码矛盾；
  记忆里两处 U+FFFD 顶掉「一」字；R9 措辞（引用用户原话 / 变更叙事）7 处。
- **已修**：恒真断言改真（并带「上一段仍在屏内」的限定）· 删掉一条断言代码从不设置的属性的用例 ·
  补释放路径 / 锁存 / 来向三条单测（均验证**撒掉修复即红**）· JSDoc 重写 · 文档与记忆一致化。
- **两个决定（我定）**：① **E2E 改打生产构建** —— 保留但**单独成一笔提交**；构建挪进 `test:e2e` 脚本
  （否则复用旧 server 会**测旧产物**）· 撤掉热力图那条 45s 上限（根因既除，药不留）。
  ② **交接窗口的窄条空白保留**（约 66px 行程）—— 提前放行会让底边出现亮着的下一段而上面那段还黑着；
  提前交接线会破坏舞台交叉淡入 ✓。
- **补的仪器**：顺序断言改用 **MutationObserver 在到达那一刻判** + 手势拆成**细扫 40px（判顺序）**与
  **大跳 1200px（判跳过）**；原来的 340px 步长在 900px 视口下**跳不过任何一段** ⇒ 「不跳过」从未被考到 ✓。
  高窗口那条用例已验证：拆掉「扣住」机制 ⇒ 立刻红 ✓。
- **收尾状态**：单测 **1600** · E2E **169** · type-check · build · `check:i18n` · lint 0 错误 ✓。

## E2E 本地跑法改用生产构建（2026-10-27 · v0.68.1）
- 根因：本地 E2E 全打同一个 dev server（按需转译 ⇒ 瓶颈）⇒ 全量 153s 且重用例并行下超时；
  改打生产构建的 preview ⇒ **52s** 且无 flaky ✓（`playwright.config.ts` 本地也起 preview，端口 4173）。
- **构建挪进 `test:e2e` 脚本**（不在 `webServer` 的 command 里）⇒ 复用的旧 server 也会提供刚构建出来的产物 ✓。
- 撤掉热力图那条用例当年为该瓶颈加的 45s 上限（根因既除，药不留）；不再占用用户自己的 dev server ✓。
## 第六阶段 S6：设备与 API Keys 的关系说明与互链（2026-10-28 · v0.69.0）
- 回源：插件把 API Key 当 **bearer 凭据**调同步接口，**设备**是插件注册的同步主体（机器 + IDE + 插件版本），两页副标题都没讲到这层。
  做法：共享 `SettingsRelationNote.vue`（说明 + 对方链接，路由名定位、标签复用 `nav.*`、链接独占一行），两页间距统一 ✓。
- 测试：两条单测 + 一条 E2E（互链来回），均先看红 ✓。顺带更正计划里「侧栏收敛为单个 Settings 入口」的旧记录（实际是四段）。
- 验收：单测 1602 · E2E 170 · lint 0 错误 ✓；桌面 + 390 目视 ✓。

## 第六阶段 S4 阻塞解除：后端核对报告（2026-10-28 · v0.69.0）
- **核实**：R1–R3 的端点不仅实现，**线上也已部署**（`/v3/api-docs` 逐条核对 ✓ · 部署版本 **0.87.1** ✓）⇒ 计划里
  「等端点已可用通知」的前提**已过时** ✓。注：`curl` 这些端点只得 401（Spring Security 早于路由拦截）⇒ **401 不能
  证明端点存在**，确定性核对要看 OpenAPI ✓。
- **三处出入（以代码为准）**：会话列表返回**裸数组**（计划记 `{sessions:[...]}`）· 导出文件名带连字符 · **同名提交是 no-op**
  —— 都是我们记错。后端已有覆盖：同名 no-op · 吊销当前会话（含串行化进行中的刷新）· 导出可被插件端导入 ✓。
  产出 `.omp/requirements/2026-10-28/account-security-r1-r3-report.md`；计划里五处「等部署通知」的前提一并更正 ✓。
- **后端答复已回**：三项成立、**无后端新开发** ✓；新约定 **列表端点直接返回数组**（要分页元数据就新增端点，不改已有响应类型）✓。
  **我们回源抓到他们一处口径错**：三项功能的引入版本整体差一个发布（他们 0.79/0.81/0.82，实际 **0.80/0.82/0.83** ✓，
  结论不变：0.87.1 必含）。

## 第六阶段 S4a：账号与安全的契约层（2026-10-28 · 随 v0.70.1 发布）
- **回源核对已完成的契约**（线上 `/v3/api-docs` + 源码 ✓）：会话列表**裸数组**、`limit` 夹取 1..100、`kind` ∈ {WEB, PLUGIN}、
  `expiresAt`/`lastUsedAt`/`deviceName`/`ideName`/`userAgent` 可空 · 导出的 `timezoneOffset` 必填 ±720 ·
  文件名在 `Content-Disposition` ✓。
- **交付**：三个 schema 字段组 · 四个 API 函数 ·
  store 的 `termsVersion` / `emailChangePending` / `applyProfile` · 纯函数 `parseUserAgent` ✓。
- **两条实施裁决**：
  ① **显示名校验复用注册的正则**（`REGEX_DISPLAY_NAME`）⇒ 前端与服务端同一条规则；
     测试数据里带空格的名字因此被拒（服务端本来就不收 ✓）。
  ② **导出用 blob + 401 走安全兜底**：ofetch 的 `responseType` 对成功体与错误体一视同仁，且每请求错误钩子会顶掉全局钩子 ⇒
     拿不到错误码 ⇒ `handle401Error(null)` 落到「清令牌 + 登出」。代价是导出遇过期 token 会登出而非静默续期（罕见、无数据损失）✓；
     将来要兼得需把 `getErrorCode` 异步化支持 Blob，或给导出单独处理 ✓。
- **踩到的两个坑**：`z.uuid()` 在 zod v4 会校验版本位 ⇒ 测试里的假 UUID（`1111…`）不合法，要用合法 v4 ✓；
  ofetch 的 `$Fetch<T, R>` **显式给了 `T` 后 `R` 退回默认 `'json'`** ⇒ 必须写 `apiFetch<Blob, 'blob'>` ✓。
- 验证：单测 **1619**（+17）· type-check · build · `check:i18n` 924 键 · lint 0 错误 ✓；store 的两条新断言均已证明能红 ✓。

## 第六阶段 S4b：账号与安全的界面（2026-10-28 · 随 v0.71.0 发布）
- **新页 `/settings/security`**（侧栏「安全」· 路由名 `settings-security`）：登录会话卡 + 数据导出卡 —— 账号范围内的资源，
  与外观页分开 ✓。
- **两条撤销路径**：顶栏登出走 `logoutAll`（吊销**全部**）；安全页只吊销**点的那一条**，再走共用收尾 `signOutLocally()`
  （清令牌/资料/缓存 → 提示 → 跳登录）✓ —— 原计划写「删除当前会话 = 走登出流程」，实做更精确，已记账 ✓。
- **列表首版被当场退回（同日）**：14 条会话全是同一客户端 ⇒ 三行一条 + 每行一个「撤销」占满整页 ✗。回源：服务端只返回未撤销
  且未过期的会话（上限 100、最近使用倒序）⇒ 14 条 = 14 次仍有效的登录（登出再登入算新的一次；清 Cookie 未登出则列到到期）。
  改法：当前会话单独一行 + 其余按客户端归组，组内才逐条撤销；实测 14 条折叠 = **2 行 / 97px**（旧版约 810px），窄屏 390 溢出 0 ✓。
- **行内信息**：WEB 标题由 UA **经词条**派生（原文只作 tooltip）；PLUGIN 用 `deviceName`，IDE 名接在种类行（同机多 IDE 是不同会话）·
  顺序与 `current` 标记原样渲染（不重排）· 导出 blob 原样落盘、文件名取 `Content-Disposition`、429 用导出自己的额度文案 ✓。
- **条款版本**：`GET /users/me` 优先，**只在为空时**才取 `publicConfig.termsVersion` 兜底 ✓。
- **顺带修**：`UpdateProfileRequestSchema` 硬编码英文文案 ⇒ 词条包惰性求值 + 复用注册文案；`AUTH_020` / `AUTH_022` 补映射 ✓。
- **测试**：单测 **1654** · `mountWithQuery` 辅助（真 QueryClient、关重试、每例新实例）· 关键断言已证能红 ·
  E2E **175**（含「九条会话 < 260px」高度护栏 + navigation 覆盖新节）· type-check / build / lint 零输出 / `check:i18n` 991 键 ✓。
- **两轴审查 14 条全部成立并已修**：最重的是 **blob 请求读不到错误码** ⇒ 导出 429 文案从未生效 ✗（改按 `statusCode` 分支，
  401 交拦截器）；另有未识别 UA 合并成一组、`AUTH_020` 文案过窄、凭证互斥说明缺失、按钮样式三处重复、`architecture.md` 清单陈旧；
  自查出撤销失败后列表不重算 ⇒ `onSettled` ✓。
- **批量撤销（2026-10-30 · 随 v0.72.0）**：后端 0.88.0 的 `POST /users/me/sessions/revoke`（去重后 ≤100 · 部分成功
  `{revoked, skipped}` · skipped 不区分原因 · 锁按 UUID 升序 · 10 次/时按账号）已接：折叠行「全部撤销」→ 确认 → 只报计数；
  429 按服务端 `Retry-After` 禁用（固定窗口 ⇒ 头即剩余秒数），并记住截止时间 ✓。
- **工具链陷阱（复发一次）**：`playwright.config` 的 `webServer` 只跑 `preview`、**不重建** ⇒ 直接 `playwright test` 拿旧 `dist` ✗
  ⇒ 一律走 `pnpm test:e2e`（内含 build-only）✓。

## 门禁：Sonar 等价规则进门禁（2026-10-28 · v0.70.1）
- IDE 的 SonarLint 报 `typescript:S7760` ⇒ 查得 `S7760` 属**闭源** SonarTypeScript，开源工具链没有实现 ✗，
  但 oxlint 有**行为等价**的 `unicorn/prefer-default-parameters` ✓ ⇒ 量误伤（既有代码**零命中**）+ 探针复现被拦 ⇒ 启用
  （`vite.config.ts` 的 `lint.rules`）；**不启用** `unicorn/no-null`（API 层刻意用 `null`）。否决 `eslint-plugin-sonarjs`
  （13 个传递依赖含重复 `typescript` · peer 风险 · **且不含 `S7760`**）；完整规则集只能走 SonarQube Cloud（记入第七阶段）。
  顺带把 `pnpm lint` 从 4 条 warning 清到**零输出** ✓。规则化为 **R39** · 事实入 `techContext` · 贡献者向 `dev-handbook` §4.5 ✓。

## docs/ 语种归位：开发手册改成英文（2026-10-28 · 纯文档轮 · 不升版本）
- 触发：`docs/` 是面向开源读者、项目约定写英文，但 `dev-handbook.md` 漂成中英混排（994 行里 313 行含中日韩字符，连标题都是）。
  做法：逐行译、**代码块只译注释**；校验用我自己的脚本（不采信子代理自述）：CJK 313 → **0**、全角标点 200 → **0**、
  行 976 → 994（+18 = 新增 §4.5）、表格只增不减、代码块 **代码层改动 0**、无死链 ✓。
  一处判断：§7.x 讲「怎么写中文文案」⇒ 中文例句改**英文释义**，精确原话以 `src/i18n/locales/zh-CN.ts` 为准 ✓。

## 两步验证登录（2026-11-01 · v0.73.0）
- **契约回源**（源码 ✓）：密码步骤 `202` + 挑战对象；第二步 `POST /auth/login/2fa`；OAuth 回跳用 query 标记 + 片段带挑战 ✓。
- **`login()` 改判别联合** `LoginResult = authenticated | two-factor`（`202` 信封里没有 token ⇒ 交给编译器拦）· store 遇 202
  **不写 token、不拉 profile** · challenge 只存内存（单次五分钟，重载无法兑现 ⇒ `AUTH_026`）✓。
- **新页 `/auth/login/2fa`**（码与恢复码同框 · 倒计时到点禁用）：`AUTH_027` 就地报错**保留挑战**；`AUTH_026`/`429` 清挑战回登录；
  无挑战直访回登录；成功后沿用 `resolvePostAuthTarget`；OAuth 入口在回调页读到片段后先清 hash 再转**同一张页** ✓。
- **拦截器补一条（本轮真坑）**：`AUTH_026/027` 原落进通用 401 分支 ⇒ 清令牌 + 广播会话失效 ⇒ 第二步被踢回登录 ✗；与
  `AUTH_010`/`USER_014` 同为**资源级** 401 ⇒ 归入 `RESOURCE_LEVEL_401_CODES` ✓（E2E 先暴露，补 2 条单测守住）。
- **两轴审查（2026-11-01）**：两轴都抓到同一处 OAuth 守卫缺陷（缺 `expiresIn` ⇒ `Number(null)=0` 绕过 ⇒ 转圈）；另修
  `oauth_redirect` 不转发不清理 · 登录/登出不清残留挑战 · 2 处注释 · 2 处去重、6 处冗余内联样式 ✓。
- **真机联调（`localhost:8080` 实测）**：一次性账号开 TOTP（密钥本地算码）⇒ 真实 `202` + `challengeToken` 落第二步；正确码 200 进
  看板、错码就地报错、恢复码也能进 ✓（账号随后已删）。坑：`2fa/totp/start` 的 `currentPassword` 也要 base64，注册/登录强制 hCaptcha。
- 全量：单测 **1677** · E2E **178** · type-check / build / lint 零输出 / `check:i18n` 1004 键 ✓。

## 两步验证开启侧（2026-11-01 · v0.74.0）
- 安全页新增 2FA 卡 + 三步向导（密码 → 密钥 → 确认码 → 恢复码）+ 关闭/重生成/重设共用「码或恢复码」字段；恢复码只出现一次，
  勾选「已保存」才允许关闭 ✓。**二维码**用 `qrcode.vue@3.11.0`：canvas + 白底黑模块 + 4 模块静区（选型数字见 techContext）✓。
- **状态用信号不用标签**：`On/Off` 由徽标改成「圆点 + 词」（文档里 Success Pill 本就是圆点）——开=实心点，关=空心环；
  图标底色改用文档的**安全紫** `#7a7fad`（新增 token `--color-security`），免得安全控件借品牌色被读成行动号召 ✓。
- 全量：单测 **1717** · E2E **181** · type-check / build / lint 零输出 / `check:i18n` 1068 键 ✓。

## 表单校验文案（2026-11-02 · v0.74.1）
- 登录第二步空提交露出 `Invalid input: expected string, received undefined`：`z.string()` 基类型先于 `.min()` 跑，
  未触碰的字段是 `undefined` ⇒ 基类型失败、消息是 Zod 英文原文（与界面语言无关）✓。
- 修法：基类型与最小长度各写一次惰性消息；覆盖密码、2FA 码、确认密码、显示名、作用域、同意条款、API Key 名称、删除账号 ✓。
- 类级测试 `src/lib/schemas/__tests__/form-messages.test.ts` 守住"表单 schema 不得回退到 Zod 原文"（已证明会红）✓；
  同时把 `SetPasswordDialog.form.test` 里"断言出现 Invalid input"的错误预期改成词条句子 ✓。
- 审查补齐：`LoginForm` 邮箱文案改为惰性（切语言后消息跟随，单测比对两次提交 + 登录页 E2E 覆盖）；删除账号确认邮箱补基类型消息；
  `docs/dev-handbook.md` 与 `domains/i18n/practices.md` 的示例纠正为"基类型 + 规则各写一次" ✓。
- 邮箱文案顺序：格式检查不再替空值回答（注册 / 找回密码 / 登录 / 改邮箱四个字段改 `.pipe` 写法），两条旧断言改真；
  删除账号对话框补空提交单测（密码 / 确认邮箱两支）✓。
- 全量：单测 **1735** · E2E **185**（含 2FA 中英空提交、登录页跨语言空提交）✓。

## 工具链
- [x] **依赖更新（三轮）** `vp update -L`：TS7 每轮回退 6.0.3；vite-plus 1.3.0→1.4.0（vitest pin 仍 5.0.5）·
  新 peers 警告 = `@opentelemetry/api`（上游声明滞后）⇒ workspace 有界规则 · 未改版本号 · 详见 techContext · `53fd376`。
- [x] **session-discipline 1.1.0→1.1.5**：汇报形状两处漏网 + 拒绝后完整重发；词表补「评审/看什么/算错」；批准含命令的计划=授权（R6 ✓）；停机句全量重发 ⇒ 契约 **60**。
- [x] **v0.36.1 (2026-09-11)** 阻止 pnpm 隐式安装污染受控配置 — `verifyDepsBeforeRun: warn`（只报告不写入；`error` 会被版本号变更误触发）✓。
## Backlog
- [ ] **统计页手机端（10-11 · v0.55.29 · 待评估）**：列表/过滤栏/时长✓；热力图 ⇒ 条带（锚今天/整年）；周时段/柱/时段 ⇒ 减负（条/线/2×2）；悬停片/点选 ⇒ 不出/可恢复；桌面零变化；验证 ✓。
