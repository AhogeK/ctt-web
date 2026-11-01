- **第六阶段 S6（本轮 · v0.69.0）**：设备与 API Keys **两页互链 + 关系说明**已补完 ✓。
  事实回源：插件把 **API Key 当 bearer 凭据**调同步接口（`SyncApiServiceImpl`）· **设备**是插件注册的同步主体（机器 + IDE + 插件版本）✓。
  做法：共享组件 `SettingsRelationNote.vue`（一句说明 + 指向对方页面的链接）· 路由用**路由名**定位（改名会响 ✓）·
  链接标签复用 `nav.*`（侧栏与说明同名 ✓）· 链接**独占一行**（句子在两种语言里都保持是句子 ✓）。
  顺带更正**计划**的 S1 记录（`SettingsShell` 早已并入侧栏、记录停在中间态 ✓）⇒ **计划与代码不一致时以代码为准** ✓（计划文件自己的约定 ✓）。
- **第六阶段 S4 的阻塞已解除（2026-10-28 核实）**：R1–R3 **不只是源码实现，线上也已部署** ——
  从线上 `/v3/api-docs` 直接核对到四个端点（`PATCH /users/me` · `GET /users/me/sessions` ·
  `DELETE /users/me/sessions/{id}` · `GET /users/me/export`），部署版本 **0.87.1** ✓
  ⇒ 计划里「等端点已可用通知」的前提**已过时** ✓ ⇒ 改为直接接线 ✓。
  **核对出的三处出入（以代码为准，改我们的记录）**：会话列表返回**裸数组**（非 `{sessions:[...]}`）·
  导出文件名 `ctt-export-<yyyy-MM-dd>.json`（带连字符）· **同名提交是 no-op**（不写库不审计，仍 200 + 资料）✓。
  核对报告 → `.omp/requirements/2026-10-28/account-security-r1-r3-report.md` ✓。
- **第六阶段 S4a 契约层（2026-10-28 · 随 v0.70.1 发布）**：账号与安全的后端接线已备好（端点线上可用 ✓）。
  新增 `LoginSessionSchema`（kind 枚举 · 可空字段保键）/ `UpdateProfileRequestSchema`（**复用注册正则** ⇒ 前后端同一条规则 ✓）·
  API 四函数（改显示名 / 会话列表 / 吊销 / **导出按 blob 不解析**）· store 补 `termsVersion` / `emailChangePending` + `applyProfile` +
  **两者进 `clearAuth` 重置**（否则登出后残留上一个账号的条款版本 ✗）· 纯函数 `parseUserAgent`（返回 key 而非句子 ⇒ 界面可翻译 ✓）。
  **裁决**：ofetch 的 `responseType` 对成功体与错误体一视同仁、每请求错误钩子会顶掉全局钩子 ⇒ 导出用 blob 就拿不到错误码 ⇒
  401 走「清令牌 + 登出」的安全兜底（不是刷新重试 ✗）。代价：导出遇过期 token 会登出而非静默续期 —— 主动续期使它罕见且无数据损失 ✓。
- **第六阶段 S4b 完成（2026-10-28 · 随 v0.71.0 发布）⇒ 第六阶段收口**：新页 `/settings/security`（登录会话 + 数据导出）。
  撤销两条路径：顶栏登出吊销**全部**，安全页只吊销**那一条**，共用 store 的 `signOutLocally()` ✓。
  WEB 行标题由 UA 经词条派生（原文只作 tooltip）、PLUGIN 行用 `deviceName` + IDE 名；顺序与 `current` 原样渲染 ✓。
  顺带修：`UpdateProfileRequestSchema` 的英文硬编码文案 ⇒ 词条包惰性求值；`AUTH_020`/`AUTH_022` 补进错误码表 ✓。
  测试：单测 1646 · E2E 174 · 组件自己调 `useMutation` 时用 `mountWithQuery` 挂载（preview 不重建的旧 `dist` 陷阱也记进 progress）✓。
- **会话列表首版被退回后重做（同日）**：14 条同类会话把整页占满 ⇒ 改为**当前会话单独一行 + 其余按客户端归组**（计数 + 展开，
  组内逐条撤销）· 不做组级批量撤销（`DELETE` 限速 10 次/小时）· 页内说明「清 Cookie 未登出会留旧记录」✓。
  实测折叠后 14 条 = **97px**（旧版约 810px）· 窄屏 390 溢出 0、标题不截断 ✓；E2E 加高度护栏 ✓。
- **两轴审查（同日）**：14 条（Standards 8 · Spec 6）全部成立并已修 —— 最关键的是 **blob 请求读不到错误码**
  （导出 429 文案从未生效 ✗）⇒ 改按 `statusCode` 分支 · 401 短路不再借重置链接文案 · 未识别 UA 不再折成一组 ✓。
- **批量撤销接线（2026-10-30 · 随 v0.72.0 发布）**：后端 0.88.0 的 `POST /users/me/sessions/revoke` 已接：
  折叠行「全部撤销」→ 确认 → 只报计数（`skipped` 不解释）；429 后按钮禁用一小时；重算列表走 `onSettled` ✓。
- **第六阶段收口复核（2026-10-30）**：计划自身五处失真已纠正（总览配色、章节标题、键数与部署版本、功能地图、依赖图）✓。
  **R4 通知偏好：否决（不做）** —— 用户指出周报会吃免费额度；评估后同意且理由更硬：后端只有三个身份类发信入口、
  **无全局配额保护** ⇒ 超额即「账号找不回」。连带关闭偏好域/时区/语言偏好与退订入口；重开前提 = 先做配额保护与分级。
  **R5 两步验证：契约已对齐（2026-10-30）** —— 对方接受方向、五项决策已定，并纠正我方 4 处（① 插件**只有 API key**，我方写成
  deviceId + refresh 是事实错误 ② 202 必须走统一信封 ③ `AUTH_026` = 挑战/setup 失效 ④ **`AUTH_025` 不会自动生效**：
  `getActiveUserRequired()` 接受 API key，全仓仅 `DELETE /users/me` 显式判 `authType`）。已回源逐条核实并改写文档；
  另提三条补充建议（`DELETE` 带 body → 改 POST disable · 启用/关闭时吊销其他会话 ·
  **启用时必须再验证身份**，否则攻击者用被劫会话绑自己的验证器后**重置密码也解不开**）⇒ 回函
  `.omp/requirements/2026-10-30/two-factor-auth-reply.md`，**未采纳则是一条挂着的安全缺口** ✓。
- **门禁补一条 Sonar 等价规则（2026-10-28 · v0.70.1）**：IDE 的 SonarLint 报 `typescript:S7760`（参数规整成中间变量）⇒
  查得 **oxlint 已内置** `unicorn/prefer-default-parameters`（同一行同一句建议 ✓）⇒ 既有代码**零命中**、探针复现被拦 ⇒ 启用 ✓。
  **不引入** `eslint-plugin-sonarjs`（13 个传递依赖含一份 `typescript`，且**不含** `S7760` —— 它属**闭源**的 SonarTypeScript ✓）；
  真·全量只能走 SonarQube Cloud（已记入第七阶段）✓。立为 **R39** ✓。
  顺带：`pnpm lint` 现在**零输出** ✓（4 条既有 warning 已清：`expect-expect` 配 `assertFunctionNames` ·
  纯映射函数提到模块级 · 双分支断言的定向 disable ✓）。
- **两条新边界（AGENTS.md R37 / R38）**：**断言必须能红**（破坏实现看它是否变红；断言不得指向代码从不写出的东西）·
  **故障的时长决定断言的粒度**（采样粒度要细于故障范围 · 观察器回调在帧末跑 ⇒ 手势要细到故障留在单帧内 ·
  探测器的视口必须覆盖会改变事件先后顺序的那些）✓。
- **两步验证（TOTP）登录（2026-11-01 · v0.73.0 · 未提交）**：契约取自 `ctt-server` 源码 —— 密码步骤 `202` +
  `LoginChallengeResponse(twoFactorRequired, challengeToken, expiresIn)`，第二步 `POST /auth/login/2fa`；
  OAuth 带 TOTP 时重定向 `/oauth/callback?twoFactorRequired=true#challengeToken=…&expiresIn=…`。
  `login()` 改**判别联合** `LoginResult`（`authenticated | two-factor`）⇒ "2xx 即已登录"这个假设交给编译器拦 ✓；
  store 遇 202 **不写 token、不拉 profile**，challenge 只存内存（单次有效五分钟，落盘只会给旧标签页一个可重放凭证）。
  新页 `/auth/login/2fa`：码与恢复码同一输入框、倒计时到点禁用；`AUTH_027` 就地报错**保留挑战**，
  `AUTH_026`/`429` 清挑战回登录，无挑战直访回登录，成功沿用 `resolvePostAuthTarget` ✓。
  **真正的坑（E2E 才暴露）**：`AUTH_026/027` 原被当成会话级 401 ⇒ 清令牌 + `UNAUTHORIZED_EVENT` ⇒ 第二步被踢回登录 ✗；
  与 `AUTH_010`/`USER_014` 同类，已归入 `RESOURCE_LEVEL_401_CODES` ✓。文档 → `docs/architecture.md`「Two-Step Login (TOTP)」✓。
- **两轴审查后的收口（同日）**：两个审查各一份上下文，独立跑 —— 都指向同一处 OAuth 守卫缺陷：片段缺 `expiresIn`
  时 `Number(null)` 得 0、`isFinite(0)` 为真 ⇒ 挑战被塞进 schema 后抛错、回调页转圈不跳 ✓。另修：`oauth_redirect`
  既没转发也没清理（受保护页的目的地丢失 + 残留会误导下一次登录）· 一步登录与登出不清残留挑战（直访第二步会看到死表单）·
  `redirectQuery` 去重成 `redirectQueryOf()` · 错误码改用 `extractErrorCode` · 删 6 处冗余内联 `font-feature-settings`
  （`.auth-root` 已继承同值，改后截图像素一致 ✓）。文档同轮：`dev-handbook` 的 `login` 返回类型、`architecture` 片段、
  mocks 的第二步骤契约常量 ✓。
- **真机联调通过（2026-11-01）**：后端在 `localhost:8080` 开着，我按自己的口径建了一个一次性账号（浏览器过 hCaptcha 注册 →
  mailpit 取验证链接 → 校验），再用密钥本地算 TOTP 打开 2FA（**该账号随后已删**：`DELETE /users/me` 200，旧 token → 404）⇒ 实测：
  密码登录 **202** + `challengeToken` → 前端落 `/auth/login/2fa` → 正确码 **200** 进看板、错码**就地报错不跳页**、**恢复码**同样能进 ✓。
  **新踩到的契约事实**：`/users/me/2fa/totp/start` 的 `currentPassword` 要 **base64**（明文得 `USER_014`），带口令账号缺它得 `USER_013`；
  注册/登录都强制 hCaptcha（`SECURITY_006`）。**未验**：OAuth 回跳带着 2FA 的那一段（需要你的 GitHub 账号，我不动）。
- **两步验证开启侧（v0.74.0）**：安全页多了 2FA 卡与三步向导 —— 密码 → 密钥 → 确认码 → 十串恢复码（勾选「已保存」才可关），
  关闭与重新生成共用一个字段（6 位判为动态码，其余当恢复码）；密钥那步给**二维码**（`qrcode.vue`，白底黑模块 + 4 模块静区）
  并保留复制退路 ✓。视觉上刻意与同页两张卡同表面，否则一眼就看出是后加的 ✓。
- **依赖边界重写（2026-11-01，用户指令）**：不再走授权制 ⇒ **多维度判断**（周下载 · 维护状态 · 传递依赖 · 安全 · 与项目架构贴近 ·
  选中即装最新版），并区分「做完就不动的基础件」与「没人维护的过时包」✓。
- **二维码能被扫**（2026-11-01 追加）：服务端密钥带 Base32 填充，前端在展示/复制/二维码三处去掉 `=` 后才交给验证器；
  并加了一条**真解码**的 E2E（页面渲染的 canvas → 取 `getImageData` → `jsqr` 解码 ⇒ 断言等于服务端给的 `otpauth` 串）✓；
  二维码用 canvas 而非 SVG（模块落在整像素上，扫描更稳），密钥与 URI **原样使用、不改写**（后端 v0.89.1 已保证 32 字符无填充）✓。
- **状态标识重做**：`On/Off` 从徽标换成「圆点 + 词」（文档里 Success Pill 本就是圆点），开=emerald 实心 + 柔光晕、关=空心环；
  图标底色改用文档的安全紫（新 token `--color-security`）✓。
- **卡片改成设置行结构**：左=身份（图标 + 标题 + 副标 + 元信息），右=控制簇（状态点 + 动作），宽屏不再是一行内容贴左、按钮与提示散开；
  阻塞原因收成一条**带动作的提示条**（窄屏上下堆叠，否则句子被挤成十个字一列）。顺带发现单测的 mock 用普通对象冒充 TanStack ref ⇒
  `status.value` 恒为 undefined、所有 computed 静默失效（断言却一直绿）⇒ 改成返回 `ref` ✓。
- **设置页宽度统一（2026-11-02）**：个人资料 / 设备 / API 密钥 三页此前都没有上限，21:9 下卡片被拉到 1568 ⇒ 全部改用
  `mx-auto w-full max-w-[1120px] p-6 lg:p-8`（与偏好/安全页一致）；顺带把「注册时间」从带秒的完整时间改成只到日 ✓。
- **中文术语定名**：2FA 统一叫**双因素认证**（英文同步为 `Two-factor authentication`，登录第二步页不再叫 Two-step）；
  「二因验证」不是通行说法，不采用。同页不地道的中文也重写（少说「服务端」、被动句改主动）✓。
- **账号卡改成"定义表"（2026-11-02，两轮）**：先是三种动作位置并存（行内 / 底部按钮群 / 无）⇒ 改成每行自带动作，仍然"怪" ——
  因为标签与值上下堆叠、动作贴最右，一行两头有东西、中间 800px 空 ✗。最终形态：**150px 标签列 / 值列 / 动作列**，
  行间细线分隔，只读行保留空动作格以对齐；窄屏按标签→值→动作堆叠 ✓。顺带补了「密码 · 已设置/未设置」行。
  **踩到的坑**：新词条按 `displayName:` 锚点插入，该锚点 `register` 块里也有 ⇒ 三条键落进错误命名空间，界面直接显示原始键名；
  `check:i18n` 只查键数对齐，抓不到错位 ✗。
- **后端修了双重 Base32（v0.89.1）**：`SecretGenerator.generate(160)` 返回的已是 Base32 字节，`TotpService` 又编码一次 ⇒ 52 字符 + `====`
  （我曾判成"部署漂移"，错 ✗）。现在固定 **32 字符、无填充**。真机验收（§8）：新账号 `start` → 32 字符 ✓、`confirm` → 10 个恢复码 ✓、
  `disable` → **204** ✓、再 `start` → **不同**的新 32 字符密钥 ✓、重设后 `confirm` ✓，测试账号已删。
  前端配套：夹具改 32 字符、断言改成"服务端本来就不填充"；安全页新增**「重新设置验证器」**入口（disable → 向导重开，文案告知旧密钥/旧恢复码失效）✓。
- **两轴审查（2026-11-02）抓到 5 处真缺陷，全修**：① `reset` 模式读了 regenerate 的 pending ⇒ 按钮不禁用、可重复提交；
  ② 请求进行中仍可关闭对话框 ⇒ 恢复码落在已关闭的组件里 / `reset` 被关闭后照样交接（现由公共守卫 `useDismissalGuard` 统一拒绝关闭，
  并抽掉了两份重复函数）；③ 复制密钥绕过 `useCopyToClipboard` ⇒ 自托管 http（不安全上下文）下必失败；④ 前端仍在改写 `otpauthUri`
  与去填充 secret ⇒ 违背后端契约，且服务端已不填充 ⇒ 死分支删除；⑤ 重置入口未按能力门控 ⇒ OAuth-only 会话会停在一个空密钥步。
  另修：卡片改用 `SETTINGS_ACTION_BUTTON_CLASS`、去掉未登记的柔光晕、英文恢复码单复数、路由标题残留 "Two-step"、注释变更叙事。
  测试：新增 pending/关闭后不交接/剪贴板降级/守卫/重置 E2E 各一条，均先证明"破坏实现会变红" ✓。
- **校验文案漏出 Zod 原文（2026-11-02 · v0.74.1）**：登录第二步空提交显示 `Invalid input: expected string, received undefined`。
  根因是 `z.string()` **基类型**先于 `.min()` 执行：未触碰的字段是 `undefined` ⇒ 基类型失败 ⇒ 英文原文直出。
  修法：**基类型也带惰性消息**（密码、2FA 码、确认密码、显示名、作用域、同意条款、API Key 名称、删除账号的密码与确认邮箱），
  并新增类级测试 `schemas/__tests__/form-messages.test.ts`（已证明破坏实现会红）；顺带删掉 `SetPasswordDialog.form.test`
  里把 Zod 原文当预期的那条断言 ✓。
- **两轴审查补齐的三处（2026-11-02 同日）**：① `LoginForm` 的邮箱文案仍是**模块加载时求值** ⇒ 切语言后消息不跟随（现改惰性，
  并加"同一次挂载里两次提交跨语言"的单测 + 登录页 E2E）；② 删除账号的**确认邮箱**仍只靠 `initialValues` 兜基类型（现补消息）；
  ③ 规范示例本身在教旧写法（`docs/dev-handbook.md` 与 `domains/i18n/practices.md` 已改成"基类型 + 规则各写一次"）✓。
- **邮箱文案顺序（2026-11-02 同日）**：`z.email(…)` 的格式检查排在 `.min(1)` 之前 ⇒ 空邮箱得到「格式不对」而不是「必填」✗。
  全站四个邮箱字段（注册 / 找回密码 / 登录 / 改邮箱）改成 `.string({ error: 必填 }).min(1, { error: 必填 }).pipe(z.email({ error: 格式 }))` ✓；
  两条把旧行为当预期的断言（`EmailChangeDialog.form.test`、登录页 E2E）一并改真；删除账号对话框补了空提交单测（两个分支）✓。
- 验证（当前基线）：单测 **1717** · E2E **181** · type-check · build · `check:i18n` **1068 键** · `pnpm lint` **零输出** ✓。

## Archived History

- `memory-bank/archives/2026-09-24-activeContext-trim.md` — 2026-09-19 → 2026-09-21 的逐轮细节（P1 · 账号删除 · Leaderboard ·
  知识库治理 · hero 动效 · 用户级技能）；耐久判断已回迁领域 ✓。
- `memory-bank/archives/2026-09-15-dashboard-era-archive.md` — v0.28 – v0.37 Dashboard 面板迭代。
- `memory-bank/archives/2026-09-10-activeContext-archive.md` — v0.16.14 → v0.34.0 完整时间线。
- `memory-bank/archives/2026-08-16-activeContext-archive.md` — v0.16.13 及更早（v0.8.x 起）。
- `memory-bank/archives/2026-09-29-activeContext-trim.md` — 2026-09-24 的两节（光标抖动 · 亮色 hover 对比度 ✓ 已结案）。
- `memory-bank/archives/2026-10-07-activeContext-trim.md` — 2026-09-26 的三节（暗色续改 3/4 · 按端口杀进程事故；规则已分别入 R31/R18 与领域 ✓）。
- `memory-bank/archives/2026-10-08-scroll-rounds-trim.md` — 滚动编排轮（v0.55.1–0.55.10）progress/activeContext
  两巨条原文（裁剪后条目已回链 ✓）。
- `memory-bank/archives/2026-10-28-activeContext-trim.md` — v0.67.1 → v0.69.0 的已定论条目（i18n 收口 · 依赖更新 · README 轮 ·
  落地页出场次序五轮与两个决定 · E2E 生产构建 · 减少动效 · 偏好页重设计 · 界面语言）逐字原文 ✓。
- 归档惯例：维持 200 行上限，溢出即裁剪 ✓。
