# Active Context: ctt-web

## Current Status

**Phase**: 落地页 P1（公开入口与路由骨架）+ 账号删除 + Achievements + Leaderboard + Dashboard
**Version**: 0.47.0 (2026-09-19)
**Branch**: develop
**Tests**: 1437/1437 unit; vue-tsc + lint 0 error 0 warning; build green（`feature-landing` 独立 chunk ✓）; e2e 见下方条目

### 落地页 P1：`/` 由「重定向登录」变为公开首页（2026-09-19）

**动因**：`/` 原本是 `requiresAuth: true` 的 AppLayout 首页（`HomeView`），未登录访问即跳登录 —— 落地页计划的第一阶段要求它成为**公开入口**。

**改动面**：
- `RouteNames`：`HOME`/`HOME_INDEX` → **`MARKETING_LAYOUT` + `LANDING`**（镜像既有的 `AUTH_LAYOUT` 模式：布局级命名 + 视图级命名）
- 新增 `src/router/modules/landing.ts`（`/` + `MarketingLayout` + 子路由 `LandingView`，`requiresAuth: false`）→ `router/index.ts` 的 `constantRoutes` 因此**空置并被删除**（不留悬空结构）
- 新增 `MarketingLayout.vue`（顶栏 + 内容 + 页脚；**无侧边栏、无用户菜单**）+ `features/landing/views/LandingView.vue`
- 顶栏 CTA 随 `authStore.isAuthenticated` 切换：未登录 → `/auth/register`；已登录 → `/dashboard`
- **死代码清除**：`views/HomeView.vue`（仅被旧路由引用）、`views/AboutView.vue`（零引用）删除
- `404View` 与 `OAuthErrorView` 的 `RouteNames.HOME` 改指 `LANDING`（改名必须迁全部调用点）
- 分包：`vite.config.ts` 增加 `feature-landing` 分组

**用户复查后的两处改动（2026-09-19）**：
- **入口职责分离（最终）** ✓：**hero = 产品本身**（主按钮 `Install the plugin` → Marketplace 列表 ✓，次按钮 `View source` ✓）；**顶栏 = 账户**（唯一入口，未登录 `Sign in` → `/auth/login` ✓，已登录 `Open dashboard` → `/dashboard` ✓）。**两者都不指向注册页** ✗ —— 注册页没有 OAuth ✓，对 GitHub 人群是死路；新用户经登录页的 "Create account" 进入 ✓
  - 插件列表地址**已核实** ✓：`plugins.jetbrains.com/api/searchPlugins?search=Code Time Tracker` → xmlId `com.ahogek.code-time-tracker` → `https://plugins.jetbrains.com/plugin/29379`（302 downloads ✓）。**核实前我在 view 里只写了占位判断，未编造 URL** ✓
  - **我犯的两次设计错误（用户纠正）** ✗：① 先把 hero 指向**注册页** ✗（照搬"hero→signup"这个通用套路 —— 而该套路的前提是 **signup 页含 OAuth** ✓，ctt 的没有 ✗，前提不成立）；② 被纠正后又把 hero 也改成 **`Sign in`** ✗，让首屏主按钮**变成顶栏的复制品** ✗ —— 用户指出这是**盲目照搬我给的局部事实**（"绝大多数叫 Sign in" 是**顶栏**的事实 ✓，不是 hero 的结论 ✗）
  - **正解** ✓：**营销首屏卖产品，工具导航管账户** ✓ —— ctt 的产品本体是**插件** ✓（web 面板是配套 ✓），所以首屏核心动作是"装插件" ✓✓

- **删掉首屏 "no telemetry"** ✗ —— 该措辞是**我推的、未经核实** ✓，且对**时间追踪工具**自相矛盾 ✗（核心功能就是把统计同步到服务器 ✓）。换成可核实的事实：*"self-hostable if you would rather keep the data on your own server"* ✓
- **记录一条产品缺口**（未实施 ✗）：**注册页没有 GitHub OAuth** ✓ —— GitHub-first 的开发者工具里这是真实摩擦 ✓。若要做，**必须先只读核对 `../ctt-server` 的 OAuth 语义**（R3/R13 ✓）："用 GitHub 注册"究竟是 login 时自动建号 ✗ 还是独立流程 ✓。**归用户排期** ✓，AI 不得自行改动注册流程 ✓

**实施中的自纠**：P1 清单里「移除 `/auth` → LOGIN 的重定向」我**首轮漏做** ✗，复查时发现并补上 ✓（`auth.ts` 的 `redirect` 已删 ✓，并加了注释说明为何不加回：没人链接裸 `/auth`，静默转发反而隐藏了访客真正请求的 URL）。**教训**：清单式任务要**逐条对账**，不能凭印象认为已覆盖。

**docs 同步（R25）**：`docs/architecture.md` 受影响并已更新 ✓ —— 目录树补 `landing/`、`MarketingLayout.vue`、`router/modules/landing.ts` ✓；删除「`HomeView.vue # Landing page`」（文件已删 ✓）✓；`auth.ts` 代码样例去掉 `redirect` 行 ✓；元字段表补 **`guestOnly`**（此前未记录却由 guard 实际使用 ✓）✓；Lazy Loading 样例补 `MarketingLayout` ✓。顺带发现文档里的 `stores/` 清单**陈旧**（`counter.ts` 早已不存在 ✓，真实存在的 `theme.ts`/`publicConfig.ts` 反而没写 ✓）→ 一并更正 ✓。

**关键语义（勿踩）**：guard 只在 `requiresAuth` 为真时拦截 → **公开 = 不设该标志或显式 false**；而 **`guestOnly` 会把已登录用户弹去 dashboard** —— 故 `/` **绝不能**标 `guestOnly`（那会把已登录访客从根路径弹走）。已在 `landing.ts` 的 JSDoc 与 E2E 用例中钉住。

> 本文件只记「现在与最近」。**跨轮次可复用的判断在 [`domains/`](./domains/README.md)**（R24）：
> `dashboard-visualization`（图表/配色/布局/交互）、`backend-contract`（接口契约与统计语义）、
> `achievements`（奖杯家族/阶级/进度语义）、`ai-workflow`（记忆/版本/提交/验证/资源）。

> **v0.28 – v0.37 的逐版本细节**已归档 → [`archives/2026-09-15-dashboard-era-archive.md`](./archives/2026-09-15-dashboard-era-archive.md)。
> 其中的耐久判断已回迁 [`domains/dashboard-visualization/`](./domains/dashboard-visualization/meta.md)（不该留在时间线层）。

### E2E 会话被真实 401 清空（根因，2026-09-17）

settings/profile 的 E2E 曾长期表现为「分支选错、`hasPassword` 永远是 false」。逐边界取证后定位：

**`GET /api/v1/auth/oauth/accounts` 未被 mock → 打到真服务端 → 401 → 全局 `handle401Error` → `clearAuth()` → token 从 localStorage 删除、store 归默认。** 因果链：`initializeAuth()` 返回 false → `main.ts` 不调用 `fetchUserProfile()` → `hasPassword` 停在默认 false → 对话框渲染邮箱分支。**不是产品缺陷，是测试夹具不完整。**

同一个 mock 缺口还掩盖了第二处：`e2e/utils/auth-helpers.ts` 的 refresh 响应**漏了 `userId`**，而 `LoginResponseSchema` 要求它是 UUID —— 任何整页重载都会因解析失败清空会话。

两处均修（`userId` + oauth mock 移入共享 `mockAuthApis`）。相关 spec 改为**只读** auth store：分支必须来自应用自身的启动拉取，而不是测试写进去的值。

**已修复**：`mockAuthApis` 增加**最先注册**的兜底路由（未 mock 的 `/api/v1/**` 返 200），`leaderboard` helper 改为仅在无会话时登录。**93/93 e2e 全绿**。

**方法论教训**：`initializeAuth` 的 `catch {}` 把原因吞掉了，只有逐边界插桩（refresh 响应 → profile 响应 → console → 非 2xx URL）才看得到 401。另外 `e2e/dashboard` + `e2e/leaderboard` 有**既有 flaky**（A/B 对照：有该 mock 时 2 failed / 25 passed，无 mock 时 4 failed / 23 passed，且失败用例名每次不同）——与本次改动无关。

### 账号删除 v0.45.0 —— Danger zone（2026-09-17）

- **契约核实（`../ctt-server`，只读）**：`DELETE /api/v1/users/me`，body `{password?}`（base64）。`AccountDeletionService` 有密码未给 → **403** `USER_013`；密码不符 → **401** `USER_014`；非 Web 会话 → `AUTH_025`。**401 不触发登出**（资源级 401 已被 `handle401Error` 豁免，E2E 用真实 401 mock 实测确认）。
- **两个分支**：有密码 → 验密码；无密码 → **打字确认邮箱**（后端无从验证，这是误触防护而非认证）。邮箱未知时**禁用删除按钮** —— 用空串兜底会让"空输入"匹配上。
- **`clearAuth()` 补 `queryClient.clear()`**：此前全仓库无人清理 TanStack 缓存，登出后同标签页换账号会在 30s `staleTime` 内读到上个账号数据（既有缺陷，非本次引入）。
- **危险区必须是页面最后一块** → 提为独立组件 `DangerZone.vue`，由 `ProfileView` 决定位置。块放在 `AccountSection` 内时不可能排到兄弟组件 `Connected Accounts` 之后（我的首个实现就错在这里，E2E 的位置断言也因此**通过了却没抓到**，已改为"必须在 Connected Accounts 之后"）。
- **测试失真两处**（都是测试的错，不是代码的错）：① 把 `USER_013` 当"密码错误"（实为"未给密码"）；② mock 用 400 而真实是 401，**跳过了唯一可能把人踢出登录的路径**。
- **真机实测抓出类型检查/lint/单测都漏掉的 4 个缺陷**：裸 Zod 内部报错泄漏给用户（`expected string, received undefined`）、`email: string | null` 传进要求 `string` 的 prop、`useQueryClient` 打断 27 个既有测试、em dash 与组件"空值占位符 `—`"语义冲突。

### 知识库治理：维护 / 溯源 / 渐进式披露（2026-09-15）

- R24 补齐四项缺口：**回源**（不同事实回不同来源）、**维护机制**（增量 + 校准）、**元数据与核对基线**、**渐进式披露**；操作规程移入 `domains/README.md`。约定与 `../ctt-server` 的同类实现（commit `72ddbd5`）一致。
- 四领域 `meta.md` 各声明**核对基线**；内容早于当前后端版本的如实标注，不暗示刚核对过。
- **首次校准即发现真实漂移，当日修复**：后端 v0.73.0（`0111900`）改了 leaderboard 契约（新增 `ACTIVE_DAYS`、放宽周期组合、响应加 `totalParticipants`）—— 我们记录时是对的，是后端改了。已按 v0.73.0 重建契约（v0.43.0）；`totalParticipants` 顺带替掉「整页即可能还有」的旧启发式（此前整页倍数会多给一页）。

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
- **v0.42.2** 成就页 / 排行榜页 E2E（此前两页零覆盖）→ 8 + 13 用例，两条断言只有真机能验（环几何、非法组合不外发），均已注入缺陷验证可证伪。
- **v0.42.0** 周期成就历史（`totalUnlocks` / `periodStreak`）→ 卡片显示「得过几次 + 🔥连击」。
  我给后端的需求报告**判断错了**（以为数解锁行即可，实则那些行只在访问页面时写入）—— 详见 `references.md` 与 `practices.md`。
- 各轮的可复用判断已入领域文件（P6、practices、trophy-geometry.md）；流水见 `progress.md`。

## Leaderboard（v0.75.0 契约）

- **2026-09-16** 接入第七维度 `LANGUAGE`（分区）与 `GET /leaderboard/languages`。三处设计决定：
  ① `language` 只在 `LANGUAGE` 下发送——服务端对另三种组合都回 400，且**刻意不静默忽略**多余参数；
  ② 请求类型做成**判别联合**，让这两种错误在编译期不可构造（与 `DIMENSION_PERIODS` 同一手法）；
  ③ `LANGUAGE` 标签页**仅在目录非空时出现**——目录惰性填充，空目录是真实状态，此时该维度的任何选择都是 400。
- **发现并上报一个后端缺陷（潜伏，非当前可见）**：`/languages` 可列出 `{"name":"Other","type":"OTHER"}`
  且重复，而查询它必 400。成因是 `LanguageVocabulary.OTHER` 的 `recognized = true`，而目录只按
  `recognized` 过滤，写入点又直接采用客户端原始语言值（`nonLanguages` 76 项）。当前数据 24 榜无 `OTHER`，
  但只要有用户带这类数据就会触发。前端在 `selectableLanguageBoards` 过滤掉；**修复应在后端的过滤条件**。
- **分页与状态**：`totalParticipants` 使「是否还有下一页」精确；名次卡在未上榜时**明说**而非留空
  （留空无法区分「不在榜上」与「没加载出来」），并给出「第 N 名 / 共 M 人」——小榜的分母信息量最大。
- **请求取消**：端点限流 60/分钟，切维度时在途请求必须中航取消。已把 TanStack 的 `signal` 接到
  `apiFetch`，并用 E2E 断言 `requestfailed` 带 `ERR_ABORTED`（去掉 signal 该用例即失败）。
- **2026-09-17 v0.76.1 再变（前端零改动）**：默认回到「只有成员分的榜」（29 条），全量词表需
  `?includeEmpty=true`（842 条）—— v0.76.0 的全量默认作废。**前端无需改动**：我们从未请求该参数。
  但**测试需修正**：fixture 原先含无成员条目（默认响应不会返回），且「打开空榜」用例断言的能力已不存在
  （默认下不可达）；空态仍可由「榜有成员、但本周期为空」触达。另：删除会话现在真的把人从榜上移除，
  `totalParticipants` 会下降 —— 分页按精确总数判定，已正确处理（「board shrinks」用例从理论变为常态）。
- **2026-09-17 适配 v0.76.0**：语言目录从「有成员分的榜」改为**词表全集（842 条，含 `hasMembers`）**。
  证据驱动：改前 `Python`/`Go`/`Rust`/`Shell` 查榜返 200 却不在目录里（旧实现只覆盖功能上线后推过数据的用户）。
  前端据此**删除 `selectableLanguageBoards`** —— 词表 `canonical ∩ nonLanguages = ∅`，列表里每条都可查询，
  该过滤器已成永不触发的死代码。选择器改为**两级排序**：分类内 `hasMembers` 优先 + 分隔线，
  否则 842 项里那 29 个有榜的会被淹没。真机实测：可滚动（27100px 内容 / 262px 视口）、
  分界线正确、空榜可打开（`totalParticipants: 0`，文案「No one is ranked yet」）。
- **侧边栏入口已加**（NAVIGATION 组，`ListOrdered` 图标）。此前记录的「无入口是正确状态」已随之作废：
  那时页面只能渲染错误态，给入口比不给更糟；契约重建后补上。
- **E2E 默认无头**（原 `!!process.env.CI` 让本地跑测试时开窗口抢焦点）。调试用 `--headed`。

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

- `memory-bank/archives/2026-09-15-dashboard-era-archive.md` — v0.28 – v0.37 Dashboard 面板迭代（2026-09-15 自本文件冻结；耐久判断已回迁领域层）。
- `memory-bank/archives/2026-09-10-activeContext-archive.md` — v0.16.14 → v0.34.0 完整时间线。
- `memory-bank/archives/2026-08-16-activeContext-archive.md` — v0.16.13 及更早（v0.8.x 起）。
- 归档于 2026-09-10（v0.34.0），以维持 AGENTS.md 的 200 行上限；新溢出继续按此方式迁移。
