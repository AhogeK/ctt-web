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
- **门禁补一条 Sonar 等价规则（2026-10-28 · v0.70.1）**：IDE 的 SonarLint 报 `typescript:S7760`（参数规整成中间变量）⇒
  查得 **oxlint 已内置** `unicorn/prefer-default-parameters`（同一行同一句建议 ✓）⇒ 既有代码**零命中**、探针复现被拦 ⇒ 启用 ✓。
  **不引入** `eslint-plugin-sonarjs`（13 个传递依赖含一份 `typescript`，且**不含** `S7760` —— 它属**闭源**的 SonarTypeScript ✓）；
  真·全量只能走 SonarQube Cloud（已记入第七阶段）✓。立为 **R39** ✓。
  顺带：`pnpm lint` 现在**零输出** ✓（4 条既有 warning 已清：`expect-expect` 配 `assertFunctionNames` ·
  纯映射函数提到模块级 · 双分支断言的定向 disable ✓）。
- **两条新边界（AGENTS.md R37 / R38）**：**断言必须能红**（破坏实现看它是否变红；断言不得指向代码从不写出的东西）·
  **故障的时长决定断言的粒度**（采样粒度要细于故障范围 · 观察器回调在帧末跑 ⇒ 手势要细到故障留在单帧内 ·
  探测器的视口必须覆盖会改变事件先后顺序的那些）✓。
- 验证（当前基线）：单测 **1654** · E2E **175** · type-check · build · `check:i18n` **991 键** · `pnpm lint` **零输出** ✓。

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
