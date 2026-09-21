### AuthLayout 展示面板：指针光 + 场景级底光（2026-09-21，v0.51.0）

- **三层光各自归属** ✓：**掠光**属鼠标（卡内 ✓ 顶部卡 180px / 副卡 140·120px ✓ 暗色改用主题紫 0.10–0.13 + `blur` ✓ 去掉白核 = 去掉"灯泡感" ✓）；**聚光描边**属几何（SVG `<rect>` + `userSpaceOnUse` 渐变 ✓ r=160/145/130 ✓）；**底光**属**卡片** ✓ 指针只**激发**它 ✓。
- **架构定论** ✓：卡片自带的 `::after` **不可能**被相邻卡遮挡 ✗（`A<B` 与 `B<A` 不可同时成立 ✓ 且内联 `transform` 把它锁在卡的层叠上下文里 ✓）⇒ 底光改为**场景级单层**（`.auth-underglow`，z=0，位于三卡之下 ✓，显式类名取代 `nth-child` 位置规则 ✓）⇒ 三张卡**行为一致** ✓：光在上下间隙渗出 ✓、被相邻卡挡住 ✓、在下一段间隙继续出现 ✓、卡面 ≤1 count ✓。
- **"无形墙"两因** ✗→✓：① 盒子小于光的射程 ⇒ `blur` 把断崖涂成圆角"光盾" ✓ ⇒ 盒子改为**四周各外扩 136px**（= 110px 半径×80% 的 88px + 2×24px 模糊 ✓ 满足 `B ≥ R + 2σ` ✓）；② 祖先 `.auth-visual { overflow: hidden }` 在卡外 64px 处二次裁剪 ✓ ⇒ 释放 ✓。
- **测量方法（血泪 ✓）** ✗：悬停会改 `transform`（1.03 缩放+旋转 ✓）⇒ 朴素对照差量到的是**位移**不是光 ✗（"卡面穿透 25.3" 冻结 `transform` 后降到 **3.7** ✓）⇒ **差分前必须冻结几何** ✓（已入 `auth-layout/principles.md` P4 ✓）。
- **两次自伤事故（记账 ✓）** ✗：对 1783 行样式表用**删除正则**批量清洗 ⇒ ① 吃掉 41 行"值换行"声明的属性名（`font-family:` / `transition:` / `box-shadow:` ✓）② 第二阶段把文件削到 **187 行** ✓ ⇒ 两次都靠 `git show HEAD:` + 逐字写回恢复 ✓ ⇒ **新规矩：此文件只许"追加"或"精确整串替换"，每步立即构建** ✓（已入 AGENTS.md R27 ✓）。
- **用户级钩子改动** ✓（在 `~/.omp/packages/session-discipline/` ✓ 非本仓库 ✓）：软残留提醒加数据开关 `hooks/pre/closing-discipline.json`（采样时重读 ⇒ 无需重启 ✓ 坏配置回退为开启 ✓）；授权词表加 `add\s*it` 与 `\badd\b`（裸 `add` 被既有**否定/疑问守卫**压住 ✓ 实测 `先别 add` / `要不要 add?` 均不放行 ✓）。测试 `check-hooks` 35/35 ✓ · `check-git-policy` 61/61 ✓ · `check-todo-freshness` 16/16 ✓。

### AuthLayout 三块面板：静止契约 ✅ 已解决（2026-09-21，P2 最后一项）

诉求"静止方方正正 ✓ 悬停才浮起 ✓"卡了两轮 ✗ → **真因两层**：① 入场关键帧 `to` 是恒等、`forwards` **永久占住 `transform`** ✗；② `useCardTilt` 本身是**死代码** ✗（`currentRotate*` 用普通 `let` ⇒ `computed` 无依赖只求值一次；`rafId` 从不复位 ⇒ 循环起不来 ✓）。修法三处 ✓：组件删掉从未生效的 `baseRotate*`/`translateZ` · fill `forwards→backwards` · `currentRotate*` 改 `ref` + `rafId` 释放 ✓。**真机**：静止三块 `matrix(1,0,0,1,0,0)` 且 rect == 布局 ✓ · 悬停偏心点 → `matrix3d(0.998…)`、448×421→453×425（浮起 ✓）· 移开回恒等 ✓ · reduce 静止 ✓。回归测试 `useCardTilt.test.ts` **先红后绿**（旧实现 2/2 全红 ✓）。版本 0.48.1（PATCH ✓）。
### 用户级技能 `user-chrome-tabs`（2026-09-21 ✓）
一天里我在**用户真 Chrome** 上犯满三次 ✗：① relay 不带 `target` **劫持他正在读的页** ×2 ✓ ② 启发式筛选**关掉了他的登录页** ✗ ③ 两个我开的页**没关**（闸门只认 `/tmp` profile ✓ 看不见浏览器标签页 ✗）。工具实况：relay **默认接管** ✓ · 桥只给页面级 CDP ✗ · `browser-use` 才能建页 ✓ · **分组由 relay 扩展做**（组名写死 `{title:"omp",color:"cyan"}` ✓）但**只对真实页面生效** ✗（`about:` 跳过 ✓）。
已落盘 `~/.agents/skills/user-chrome-tabs/`（跨项目 ✓ 且含第四条：relay 会话不释放 ⇒ Chrome 顶部留 'started debugging' 横幅 ✗ ⇒ 收尾必 `browser.close({all:true})` ✓）：仪式 = `new_tab(真实URL?omp=标记)` → relay 按标记 adopt ⇒ **进 `omp` 组** ✓ → 释放 ⇒ 自动退组 ✓ → **精确整串关闭** ✓；附三条红线与收尾自检 ✓。仓内规则缩为一行指针 ✓（`ai-workflow/practices.md:192` ✓ 195 行 ✓）；收尾闸门加 `new_tab(`/`close_tab(` 计数 ✓（`check-hooks` 23 → **26** ✓ 含 3 条行为断言 ✓）。
### 落地页 hero 动效（2026-09-21，工作树未提交，v0.48.0）

- **规格权威 = `DESIGN.md` §10 Motion** ✓（七字段 + 4 条可失败判据 ✓）；实测与陷阱记在 `domains/landing-page/practices.md` ✓。
- 参照物按用户指定用 **Apple 产品页**（不是首页 ✗）：`animation-timeline` 3 · sticky 12 · reduce 27 块 · 媒体层随滚动 `180px → 0` ✓，**h1 全程不动** ✗ → 挂在滚动上的是媒体层 ✓。
- 交付两效：**入场**（4 层 · 320ms = 实测的 `0.32s` ✓ · h1 只位移不透明 ✓）与 **交棒**（`view()` exit · 位移全程 + 淡出只占后半段 ✓）。
- **两处构造性决策**：① 入场只在 `no-preference` 里**声明**（全局 reduce 规则只归零时长 ✗，`animation-delay` 照常兑现 → 延迟期不可见 ✗）；② 顶部 hero 没有"进入"滚动段 ✓ → 滚动叙事只能是**离场** ✓。
- 证据：reduce 下 `getAnimations()=[]` ✓ · `opacity:1 / translate:none` ✓ · 交棒映射与公式逐点吻合 ✓ · LCP 三次对照 252/256/252 vs 256/260/256 ✓ · type-check ✓ 单测 **1443/1443** ✓ landing e2e **3/3** ✓（跑的是 `vp preview` 生产构建 ✓）。 **计划勘误（2026-09-21 用户修正 ✗）**：计划里"默认不做滚动动画 ✓"是错的 ✗（那只是参考站点现状统计 ✓ 不是规则 ✗）—— 规则 = **按需做 ✓**；两处已改正 ✓；受保护的 `~/.agents/skills/motion-spec/` 有同源说法 ✗ → 按 R16 只提醒 ✓。
- ⚠️ **未提交** ✗（R6 无授权 ✓）；`vp check` 报的是**仓内既有** 105 文件格式问题 ✓（与本轮无关 ✓，只对自己的文件跑了 `vp fmt --check` ✓）。

**已提交**: v0.47.4 —— develop `b585fcf` ✓ / master `fe9b5bc` ✓（已推送 · clean · 代码面 0 差异 ✓）
  `fix(auth): make bare /auth land on the login page` + `chore(release): 0.47.4`（逐个 cherry-pick ✓）
  **新增回归测试** `src/router/__tests__/parent-redirect.test.ts`（2 断言：有 children 必须 redirect · `/auth` 必须指向 LOGIN）

### 登录后 Dashboard 空白（用户报告 → 已修，2026-09-19）

症状：登录后落在 `/dashboard`，**侧边栏与顶栏正常、主内容区全空**，刷新即恢复。根因：登录页按**父级名**跳转（`{name: DASHBOARD}`）→ 只解析出父级记录，**空路径子路由不附带** → 内层 `<router-view>` 无匹配 → 静默空白（控制台**零错误**）。判别实验：同 URL 点侧边栏链接即恢复 ✓。

**为什么此时才暴露**：这条路一直存在，但此前 `/` 受保护 → 未登录必带 `?redirect=/` → 登录后按**路径**跳而正常；**P1 把 `/` 变公开**且新入口直连 `/auth/login`（无 redirect 参数）→ 埋着的路成了主路径。

修复：**全部 7 个父级路由都补 `redirect` 指向默认子页**。`auth` 曾在 P1 被**有意排除** ✗（注释理由："静默转发会掩盖访客真正请求的 URL"），但裸 `/auth` 因此渲染出**空壳**（装饰栏 + 主题按钮、无表单）✗ —— 2026-09-20 用户报告后**加回** ✓，并按仓库规则补 `src/router/__tests__/parent-redirect.test.ts`（先红后绿 ✓）钉住"有 children 的父级必须声明 redirect" ✓（v0.47.4 已进 develop 与 master）。回归守卫：`protected-routes.spec.ts` 断言**内容区非空**（修复前连红两次、修复后转绿）——原断言只覆盖 URL，这正是它长期隐身的原因。约定与推论（**URL 断言不是"页面渲染了"的证据**）已入 [`systemPatterns.md`](./systemPatterns.md)。

### 登出落点与提示（用户提问 → 已定，2026-09-19）

结论（用户认可）✓：**登出落点维持 `/auth/login`**（登出是结束会话；换账号零点击可达；`/` 的职责是介绍产品，给刚登出的人看营销页是错配）；已说明反方观点，属产品取向。并补上缺失反馈 ✓：`logout()` 发 `Signed out` toast（没有它，页面无声变化，用户分不清"主动退出"与"会话掉了"；`logoutAll` 失败也照发，fail-safe 本义即本地已退出）。守卫：`e2e/auth/logout.spec.ts` 断言该提示可见。

### 顶栏仓库入口：**移除**（用户追问 → 已定，2026-09-19）

用户追问：「既然有多个（仓库），顶部那个 GitHub 逻辑还有必要吗？点击后还是只去 ctt-web」✓ —— **问题成立** ✓：三个仓库里挑一个是**武断** ✗。

**三个候选与判断** ✓：
- **删** ✓✓ **采纳** —— 顶栏回归「品牌 · 主题 · 账户入口」✓，每个位置一个明确职责 ✓；"开源"由 **hero 的 `View source`（首屏可见 ✓）** 与 **页脚生态清单** 承载 ✓✓
- **点击滚到页脚** ✗ —— **GitHub 图标的公认含义是"跳去 GitHub"** ✓，让它原地滚动是**违背承诺** ✓；纯图标也无法表达"向下滚" ✓
- **弹窗列出所有项目** ✗ —— 为 3 个链接上模态是**过度设计** ✓；与页脚清单**重复** ✗（P6）；这类内容在落地页的标准形态是**区块** ✓✓

**正确归属是 P4** ✓：计划里 P4 本就含「开源区：仓库入口 + 最小部署命令」✓ → 届时若需导航入口，应是**指向该区块的文本导航项** ✓（页内跳转用文字才诚实 ✓），而非 GitHub 图标 ✗。
**验证** ✓：真机截图确认顶栏仅剩两项 ✓、`View source` 仍在首屏 ✓、页脚三仓库 + `© 2026 AhogeK` ✓；E2E **25/25** ✓。

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

### pnpm 隐式安装污染受控文件（BUG，v0.36.1 修）

- `pnpm-workspace.yaml` 出现 `<包名>: set this to true or false` 占位符：`verifyDepsBeforeRun` 默认 `install`
  会在依赖不同步时隐式安装并写入。修法 `warn`。完整机制与取证见 `ai-workflow` S9。

### 奖杯外圈几何修正（v0.41.0）

- **用户报告属实**：外圈已是 24 网格极限（内沿 10.5），而**九个图形全部溢出**（最多 +2.58）、**六个偏心**
  （最多 2 单位）。修法：图形按自身包围盒中心缩放并映射到格心，统一入圈且居中。
- **我的第一版公式错了**：漏 `CENTER*(1-s)` 项 → 每个奖杯整体位移 ≈4.7 单位。审查看不出来，**真机量渲染**才暴露。
- 细节与「几何必须真机测」的教训入 `achievements/trophy-geometry.md`。1384/1384。

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
