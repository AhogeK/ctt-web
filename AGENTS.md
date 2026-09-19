# AGENTS.md - 项目记忆与行为约束

> 本文件由 AI 自动维护，人类请勿手动编辑

## 核心规则

### R1: 会话初始化

每次会话开始立即读取 `memory-bank/` 下所有文件，缺失则创建。

### R2: 记忆更新（强制实时）

**严禁滞后更新** - 不在单次交互自动更新易造成断片。响应完成后**立即**评估更新：

| 触发条件        | 更新文件            |
| --------------- | ------------------- |
| 代码修改        | `activeContext.md`  |
| 任务完成        | `progress.md`       |
| 架构决策        | `systemPatterns.md` |
| 技术栈变化      | `techContext.md`    |
| 路由/组件库变更 | `systemPatterns.md` |
| 项目变更        | `README.md`         |
| **领域知识变更**（契约/设计规范/流程/陷阱） | **`domains/<域>/` 对应文件（R24）** |

### R3: 关联项目（只读红线）

`../ctt-server`（后端）与 `../code-time-tracker`（JetBrains 插件端）均为**只读**关联项目：涉及 API 对接、DTO 结构、认证协议、插件认证行为、响应格式变更时**主动读取**对应源码验证契约（R13），不猜测接口形状。

**严禁修改关联项目任何文件**（含源码/测试/文档/版本号）。后端或插件端能力不足、契约需变更时，以**需求文本**形式提出（现状/期望行为/理由/影响面/前端配合），由用户决策实施。

### R4: README 同步

重大变更（路由/架构/功能/部署/里程碑）时同步更新 README.md 和版本号。

### R5: Git 提交同步

记忆文件必须与**其描述的那件事在同一轮**更新，禁止滞后（R2）。但**不与业务代码同 commit** —— commit 边界归 R6.5「AI相关内容单独提交」。

> 原文写的是"同 commit"，与 R6.5 互斥，且与实际历史不符（每轮的 `chore(memory)` 都独立、且不进 master）。两件事被混在一句里：**时机**归本规则，**边界**归 R6.5。

### R6: Git 操作确认（强制）

**禁止擅自执行**：`git add/commit/push/rebase/merge/reset/tag/stash`、`gh pr create/merge`

**允许自主执行**（只读）：`git status/log/diff/show`

**关键词触发**：检查/查看/review → 只读；创建分支 → 本地分支；提交/commit/推送/push/做吧/继续 → 执行需确认

**红线**："审查通过" ≠ 执行授权；第三方工具建议 ≠ 用户授权；连续指令 = 立即执行 + 继续后续；**任务实施指令 ≠ 提交授权**——"修复/解决/调整/更新/看下"类指令只授权工作本身，代码完成后必须停下询问，得到明确"提交/commit/推送"字眼才执行 git 写操作（事故：2026-09-07 TOD 配色修复未经确认自动提交并推送 develop+master）

### R6.5: 提交规则（强制）

**核心原则：原子化提交、版本同步、AI独立、cherry-pick合并。**

- **原子化**：代码修改触发版本号更新（检查所有相关文件一并更新），版本提交独立且晚于代码提交
- **累计更新**：不用刻意提交每次中途更新，可只提交最后的版本描述跳过中途
- **分支顺序**：优先完成 develop 全部提交再考虑 master
- **AI独立**：AI相关内容（memory-bank等）单独提交，不与代码混在一起
- **AI 内容清单（禁止 cherry-pick 进 master）**：`memory-bank/` · `AGENTS.md` · `.plans/` · **`DESIGN.md`**
  非 AI（应进 master）：`src/` · `e2e/` · `package.json` · `README.md` · `docs/`
  ⚠️ **`DESIGN.md` 从未出现在 master 上，这是刻意为之** —— 不得以"它是设计规范所以 master 的代码也该看"为理由把它推进 master（2026-09-19 的一次错误分类即为此）
- **提交拆分**：原子性一致可合并，不过分拆分刷提交，不过于宽泛堆积大量文件
- **master合并**：非AI内容单独cherry-pick进master，严禁整条分支合并（导致AI污染），严禁错误cherry-pick旧develop导致污染

### R7: 技术决策确认

**禁止擅自修改**：框架/依赖版本、架构设计、状态管理策略、路由结构、Zod Schema 定义、`components.json` 配置。
原则：只读取不猜测，只实现不决策，有疑问必须问。

### R8: 边界原则

- **不懂就问**：不确定时停下来问，禁止盲目猜测
- **讨论信号**：用户提出"为什么/能不能/是否应该/你看呢"类问题 = 讨论与确认信号，先给分析+方案，**确认后才实施**；严禁把质疑性提问当作实施指令
- **现代 Vue**：强制 `<script setup>` + `defineModel` + Composition API，禁止 Options API
- **TypeScript 严格模式**：禁止 `any`，使用 Zod 做运行时校验，DTO 类型从 Schema 推导
- **验证优先**：不确定的 API 行为先对照 ctt-server 源码验证，再使用

### R9: 代码规范

- **语言**：项目内容强制英文（代码/注释/变量名/.md），中文仅用于AI与用户的交互输出
- **注释**：公共 composable / 组件 Props 必须有 JSDoc，复杂逻辑注释 Why
- **命名**：PascalCase(组件)、`use`camelCase(composable)、UPPER_SNAKE_CASE(常量)、kebab-case(文件/目录/CSS)
- **Vue**：`v-for` 必绑定 `:key`，禁 `v-if` + `v-for` 同元素
- **样式**：禁内联 `style`，优先 Tailwind，组件级用 CSS Modules
- **shadcn-vue**：`src/components/ui/` 可改源码，禁另引 UI 库
- **视觉**：遵循 `DESIGN.md`，禁文件外颜色/阴影/spacing，亮暗双模式覆盖

### R10: 任务规划（强制）

多步骤任务（3步以上）必须先创建todo list，规划后再执行，完成后清理。

### R11: 文件管理（强制）

禁止创建临时文件：❌ 重定向到文件（`> output.log`），❌ `.log/.txt/.tmp` 文件；✅ 输出到控制台。

任务完成检查是否误创建文件，发现立即删除。

### R12: 依赖管理（强制）

**添加依赖是「授权制」，不是「禁止制」** —— 与 R6 的 git 提交同一模式：先给出分析（目的 / 选型理由 / 影响面 / 替代方案 / 体积与维护成本），**用户同意后即可添加**。未经同意不得自行添加，但**不要把它读成"不能加"**而放弃本可做的方案。

**命令用 `vp`，不是 `pnpm`** —— 本项目用 Vite+，`vp` 是统一 CLI，包管理也在其中：

| 操作 | 命令 |
| --- | --- |
| 添加 | `vp add <pkg>` |
| 移除 | `vp remove <pkg>` |
| 安装全部 | `vp install`（或 `vp i`） |
| 查依赖来源 | `vp why <pkg>` |

红线：禁止冗余依赖，禁止重复功能包，优先复用现有依赖。

### R13: API 对接规范（强制）

对接ctt-server接口前必须：1.读取对应Controller/DTO确认字段 2.用Zod Schema描述请求/响应 3.通过`lib/api/`层调用。

测试地址：swagger-ui localhost:8080/ctt-server/swagger-ui，mailpit localhost:8025

### R14: 版本号管理（强制实时）

**核心原则：任何代码变更必须同步更新版本号，严禁滞后更新（防断片）。**

版本号位置：`package.json` 的 `version` 字段

格式：`MAJOR.MINOR.PATCH[-SUFFIX]`

变更规则：Bug修复→PATCH+1，新功能→MINOR+1，破坏性→MAJOR+1，开发中→`-beta`/`-rc`后缀

执行时机：每次代码修改后立即：1.确定新版本号 2.更新package.json 3.记录到activeContext.md

禁止：代码变更不更新、跳版本、未经确认升MAJOR

### R16: AI 文件保护（强制）

**禁止修改 `.agents/` 目录** — 该目录是 AI 技能工作区，不是项目代码的一部分。

- ❌ 禁止读取、修改、删除 `.agents/skills/` 下任何文件
- ❌ 禁止因"发现问题"而改动 skill 文件
- ❌ 禁止将 `.agents/` 纳入代码审查或重构范围
- ✅ 仅当用户明确要求时才可操作

**红线**：即使 skill 文件有问题（过时/错误/冗余），也不得自行修改，只能提醒用户。

### R15: 自我学习（强制）

当同一问题解决2次以上，创建skill记录方案。

存放位置：`.agents/skills/[skill-name]/SKILL.md`

创建流程：确认解决 → 用skill-creator创建 → 写入.agents/skills/ → 更新版本号

示例：`transient-ui-capture` — 捕获短暂UI元素的链式命令技巧

### R17: Git 恢复禁止（强制）

**禁止执行 git reset 恢复到初始状态** — 这会导致工作丢失且不可恢复，必须经由用户确认。

### R18: 资源清理（强制）

占用资源的工具/服务使用后必须关闭。持续服务需后台静默启动，日志单独输出至文件，避免超时/资源堆积。任务完成后立即清理。

### R19: 文件阅读原则（强制）

片段读取无法解决时直接读取整个文件，改文件前必须详细阅读原文件。不反复片段读取同一文件。

### R20: Skills 选择规范（强制）

使用某类型Skills前先列出所有同类Skills，可同时加载多个，不是只能选一个。

### R21: 外部 AI 咨询能力

可使用skills访问 gemini.google.com / perplexity.ai 咨询高级AI（需选择模型）及网络搜索。

### R22: 子任务只读约束（强制）

审查/检查/调查类子任务（code-review、explore 等）必须**严格只读**：禁止执行任何 `--fix` 类命令（`lint --fix`、`oxfmt`、`prettier --write`）或文件写入。需要验证时仅允许只读检查（`type-check`、不带 `--fix` 的 `lint`、不写文件系统的测试）。

红线：子 agent 运行 `--fix` 会全项目格式化污染工作区（2026-08-11 v0.16.5 审查事故：16 个无关文件被重排）。

### R23: AI 身份与职责边界（强制）

AI 身份：**ctt-web 前端开发者**。

- **唯一可写仓库 = ctt-web**（src/、e2e/、package.json、memory-bank/、docs/、README.md、AGENTS.md）；跨仓库（ctt-server、code-time-tracker 等）一律只读 + 提需求（R3）
- **架构/契约级变更**（API 行为、状态流转、跨模块设计）：先出方案+影响分析，经用户明确授权后实施
- **讨论 ≠ 指令**（R8）："审查通过"≠执行授权（R6）；用户提问"为什么不能/能不能"时先分析，不得直接动手
- 事故记录：2026-08-11 未经授权修改 ctt-server `deleteApiKey` 契约（用户仅质疑 EXPIRED 两步删除流程），越权跨仓库改动已回退并补强本规则

### R24: 领域知识库建设（强制）

**核心原则：知识按「领域」沉淀，不按「时间」堆积。** 时间线（activeContext/progress）只回答"现在/最近发生了什么"；跨轮次可复用的判断必须沉淀到领域图谱。

**位置与层次**：`memory-bank/domains/<domain>/` —— 第一层永远是**领域**（业务/技术能力面，如 `dashboard-visualization`、`backend-contract`、`ai-workflow`），**禁止**按文档类型建第一层（如 `principles/`、`practices/` 这类全局扁平目录）。

**每个领域五件套（缺一不可，建立即填实，禁止占位）**：

| 文件             | 职责                                                   | 判定标准                                     |
| ---------------- | ------------------------------------------------------ | -------------------------------------------- |
| `meta.md`        | 领域边界、负责范围、代码/文档入口、领域内术语          | 新人只看这一个文件就知道"这事归哪、从哪看起" |
| `principles.md`  | **不变量与第一性原理**（决策依据，几条即可）           | 能用来裁决新情况；冲突时以此为最高依据       |
| `scenarios.md`   | 触发场景 → 判断 → 动作（决策树/查表）                  | 遇到 X 该怎么做，不用重新推理                 |
| `practices.md`   | 具体做法、参数、代码模式、**踩过的坑与规避**           | 可直接照做；含反例与"为什么"                  |
| `references.md`  | 外部契约、端点、色值表、数据字典、相关文件路径         | 事实性查表内容，不含判断                      |

**五件套是覆盖约束，不是目录美观**：它规定「解决本领域一个问题，**至少**要理解哪些方面」。某个方面没有沉淀 → 说明它缺失，不是「不需要」。

**渐进式披露（强制 —— 不一次全读）**：按需加载，下一步由上一步的结论触发：
`meta.md` 判归属 → `scenarios.md`/`principles.md` 定判断 → `practices.md` 拿做法 → `references.md` 查事实 → **回源**核对。一次性读完整个领域树是反模式：注意力被当前判断用不到的知识占用。

**回源（强制 —— 不同事实回不同来源）**：

| 事实类型                  | 回源到                                                                  |
| ------------------------- | ----------------------------------------------------------------------- |
| 本仓库行为（组件/状态/路由/样式） | `src/` 代码 + 配置                                                |
| **界面实际呈现**（颜色/几何/交互态） | **真实浏览器渲染**（计算样式、实测几何、截图）——声明的 CSS 不是证据 |
| 后端契约（端点/字段/错误码/语义） | `../ctt-server` 源码（只读，R13）+ **记录时的 `appVersion`**       |
| 用户/产品意图             | 用户本人的表述；禁止从现有实现反推「需求本来就是这样」                    |
| 历史原因                  | `git log` / `memory-bank/archives/`                                     |

禁止两种推定：①「代码这么实现了 → 它必然是正确的业务规则」②「旧文档/旧知识这么写过 → 可以忽略代码已经变了」。

**维护机制（知识不是一次性生成）**：

- **增量**：本仓库契约/结构变更（组件 API、路由、Zod schema、错误码映射、设计令牌）时，**同一轮**更新受影响领域文件。
- **校准**：重大改造或复盘后，回看领域文件是否已漂移 —— 漂移靠主动看发现，不是等谁撞上过时指引。**本仓库的具体触发**二处：
  ① `../ctt-server` 的 `appVersion`（`gradle/libs.versions.toml`）变化后，复核 `backend-contract` 与 `achievements` 中钉住旧版本的契约事实；
  ② **每轮收尾**（写记忆时）：逐个领域读其 `meta.md` 的**核对基线**，本轮若动过该领域的来源（代码/契约/规范/流程），当场更新基线并复核实受影响的事实 —— **基线早于本轮来源即为滞后，必须当轮处理**，不得留待下轮（`ai-workflow` 曾滞后 4 天，靠人工发现）。
- **新知识先归类，无家则建档**：本轮产生的可复用判断，先判归属领域（`meta.md` 判边界）；已有则更新对应文件，无则**按需**新建五件套（R24「生长规则」）。**只活在 `.plans/`（gitignored）里的知识等于没有** —— 它是工作产物，不是知识库。
- **高风险知识**（后端契约、Zod schema、错误码、状态流转、无障碍与暗色模式约束）**语义确认归用户**；自动化只负责「发现变化、生成候选、阻止遗漏」，**禁止「代码一变就自动覆盖知识」**——那会把知识库变成当前 bug 的镜像。

**元数据（让信任可审计）**：

- 关键事实标注**来源**；后端契约事实还须标注**可复核定位**（`../ctt-server` 的文件 + 符号）——**只记版本号无法机械复核**，后端一动只能从头重推。
- 每个领域在其 `meta.md` 声明**核对基线**：最后对照来源核对的日期与版本、覆盖范围、已知漂移。内容早于当前来源版本的，**如实说明**，不得暗示刚核对过。

**骨架优先于检索**：领域文件是骨架，定义必须理解的核心事实；检索（grep / 历史文档 / RAG）只用于**补证**与长尾发现。补证结论经确认后**回写**领域文件，否则下次仍要重新检索。

**生长规则**：

- **按需建档**：只在某领域确有可复用知识时创建；宁可少而实，不可多而空。禁止为凑结构建空领域。
- **先归类**：新知识产生时先判断归属领域；已有领域则更新对应文件，无则以领域名新建五件套。
- **索引同步**：`memory-bank/domains/README.md` 是图谱入口，必须与目录实际内容同步（新增/删除领域时更新）。
- **分层分工**：横切规范（命名、组件架构、错误处理）留在 `systemPatterns.md`；领域专属判断进领域文件，**不得两处重复**（重复即需合并并互相引用）。操作规程（读取顺序、漂移处置、索引校验、已定取舍）见 [`memory-bank/domains/README.md`](memory-bank/domains/README.md)——本规则只留可裁决的约束，不膨胀成手册。

**红线**：

- ❌ 占位文件、`TODO: fill`、空章节 —— 建了就写实，写不出来说明还没形成知识。
- ❌ 把领域文件当 changelog 用（"v0.34.0 改了 X"）——版本流水账属于 `progress.md`；领域文件只写**当前有效**的结论。
- ❌ 与代码/契约不一致的表述 —— 领域文件是事实，涉及后端契约必须先只读核对源码（R13）。
- ❌ **把推断当事实写入** —— 无法证实的标「待确认」并写出「什么能定论它」，不得静默升级为领域事实。
- ❌ **代码一变就自动覆盖高风险知识** —— 语义确认归用户，自动化只发现变化。
- 单文件仍受 **≤200 行**约束；超出即拆分或压缩（参考 activeContext 归档做法）。

### R25: AI 产物位置（强制）

**`docs/` 只放面向用户的项目文档**（如 `docs/architecture.md`、`docs/dev-handbook.md`）；AI 工作产物一律放 `.omp/`（**已被 .gitignore 忽略，不进仓库**）：

| 产物 | 位置 |
| --- | --- |
| 实施计划 | `.omp/plans/<feature>-plan.md`（**不带日期**，日期写在文件内 `Date:` 字段） |
| 交付报告 / 需求草案 | `.omp/<topic>-delivery-report.md`、`.omp/<topic>-requirement.md` |
| Agent 记忆 | `memory-bank/`（受 R1/R2/R24 治理，**需要提交**） |
| 面向用户的项目文档 | `docs/` |

红线：禁止把实施计划写进 `docs/plans/`。`.omp/README.md` 是该目录的权威说明。

### R26: AI 索引（强制）

**`memory-bank/index.yaml` 是给 AI 用的定位层** —— 先读它（≈170 行）判断"该读哪个文件"，**再只读命中项**；不要为了找答案遍历目录树，也不要凭上下文记忆猜自己写过什么（长会话的早期上下文会被丢弃，这种"记忆"不可靠）。

- **索引只做定位，不写结论** ✓ —— 结论属于被指向的文件（P6：一处一责）。
- **同轮维护** ✓：本轮新增/删除/改名知识文件、或改变其职责 → 立即更新索引对应条目与其行数。
- **收尾校验** ✓：索引里 `files`/`domains` 的行数必须与实际文件一致；不一致即为索引漂移（R24 校准②的一部分）。
- **索引里查不到的知识 → 说明它还没沉淀** ✓：检索补证后回写领域文件（R24），并把入口加进索引。

## 执行流程

会话开始 → 读memory-bank → 创建todo（如需）→ 处理请求 → 清理临时文件 → 更新记忆

## 约束

1. 文件读写由AI自主完成
2. 记忆文件≤200行
3. 只记录已发生事实，不猜测
4. 变更即时更新

## 记忆库结构

**时间线层**（回答"现在/最近发生了什么"）：

`memory-bank/`：projectbrief.md（目标）、techContext.md（技术栈）、systemPatterns.md（横切规范）、activeContext.md（当前）、progress.md（进度）、`memory-bank/archives/`（冻结的历史）

> `memory-bank/archives/` 是**唯一豁免 200 行限制**的记忆文件——它的存在就是为了装时间线溢出（现 979 行）。任何「记忆文件≤200 行」的检查都应排除该目录。

**领域层**（回答"这里什么是真的、该怎么做、能不能信"，由 R24 治理）：

`memory-bank/domains/<domain>/` — 每领域五件套 `meta.md`（边界 + **核对基线**）/ `principles.md`（不变量）/ `scenarios.md`（触发→判断→动作）/ `practices.md`（做法与坑）/ `references.md`（事实查表）；入口 `domains/README.md`（**操作规程**：读取顺序、漂移处置、已定取舍）。

> 领域层**不一次全读**（R24 渐进式披露）：先读 `meta.md` 判归属与其核对基线，再按判断需要取用其余文件，最后回源核对。
> 基线告诉你这个领域「上次对照来源核对是什么时候、哪个版本」—— 依赖某条事实前先看它。


<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
