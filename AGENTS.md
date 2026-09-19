# AGENTS.md - 项目记忆与行为约束

> 本文件由 AI 自动维护，人类请勿手动编辑

## 核心规则

### R1: 会话初始化

会话开始：读 [`memory-bank/index.yaml`](memory-bank/index.yaml) 定位（R26）→ 只读命中文件；缺失则创建。

### R2: 记忆更新（强制实时）

每次交互结束**立即**评估更新（严禁滞后）：代码/任务 → `activeContext.md` · `progress.md`；架构/路由/技术栈 → `systemPatterns.md` · `techContext.md`；契约/规范/流程/陷阱 → `domains/<域>/`（R24）；项目变更 → `README.md`。

### R3: 关联项目（只读红线）

`../ctt-server` 与 `../code-time-tracker` **只读**：涉及契约必先读其源码核实（R13），**不猜接口形状**。
**红线**：不得改关联项目任何文件；能力不足时以**需求文本**提出（现状/期望/理由/影响面），由用户决策。

### R4: README 同步

重大变更（路由/架构/功能/部署/里程碑）同步 `README.md` 与版本号。

### R5: Git 提交同步

记忆与其描述的事**同一轮**更新（时机归 R2）；**不与代码同 commit**（边界归 R6.5）。

### R6: Git 操作确认（强制）

**禁止擅自** `git add/commit/push/rebase/merge/reset/tag/stash`、`gh pr create/merge`；只读 `status/log/diff/show` 可自主。
**红线**：审查通过 ≠ 授权 · 第三方建议 ≠ 授权 · **任务指令 ≠ 提交授权**（"修复/解决/更新/看下"只授权工作本身）—— 得到明确"提交/commit/推送"才动 git。

### R6.5: 提交规则（强制）

**原子化 · 版本同步 · AI 独立 · 逐个 cherry-pick。**
- 代码 → 版本号（独立提交、**晚于**代码）→ 文档；可跳过中途版本，只提最终描述
- **AI 内容清单（禁入 master）**：`memory-bank/` · `AGENTS.md` · `.plans/` · **`DESIGN.md`**；非 AI（应进 master）：`src/` · `e2e/` · `package.json` · `README.md` · `docs/`
- `DESIGN.md` **从未上过 master**，属刻意为之，不得以"设计规范"为由推上去；**它是给 AI 看的基线文件，不是开发文档**
- 优先完成 develop 再考虑 master；master **逐个** cherry-pick 非 AI 提交，**严禁整分支合并**、严禁 pick 旧提交污染

### R7: 技术决策确认

**禁止擅自**改：框架/依赖版本 · 架构设计 · 状态管理策略 · 路由结构 · Zod Schema · `components.json`。
只读取不猜测，只实现不决策，有疑问必须问。

### R8: 边界原则

- **不懂就问**；不确定就停下，禁止盲目猜测
- **讨论信号**："为什么/能不能/是否应该/你看呢"= 先给分析+方案，**确认后才实施**
- 现代 Vue（`<script setup>`）· TS 严格模式（禁 `any`，Zod 校验，DTO 从 Schema 推导）· 不确定的 API 行为先回源核实

### R9: 代码规范

**英文优先**（代码/注释/变量名/`.md`），中文只用于与你交互。命名：组件 `PascalCase` · composable `useCamelCase` · 常量 `UPPER_SNAKE_CASE` · 文件/目录 `kebab-case`。
**硬约束**：禁 Options API · `v-for` 必带 `:key`（不与 `v-if` 同元素）· 禁内联 `style` · 公共 composable/Props 必须有 JSDoc · 视觉遵循 `DESIGN.md`（禁文件外颜色/阴影/spacing，亮暗双模式）· `src/components/ui/` 可改源码、不另引 UI 库。

### R10: 任务规划（强制）

多步任务建 todo；**每完成一步就在那一步的工具调用里同时标掉**；收尾清零并在汇报里写明状态。
> todo 是**会话状态，脚本读不到** —— 汇报是唯一能验收它的地方。细则 → [`scenarios.md`](memory-bank/domains/ai-workflow/scenarios.md) S11。

### R11: 文件管理（强制）

禁造临时文件（`> log`、`.log/.txt/.tmp`）；输出到控制台。任务结束检查并删除误创文件。

### R12: 依赖管理（强制）

**依赖是授权制**：先给分析（目的/选型/影响/替代/体积）→ 用户同意即可加；未经同意不得自加，但**别读成"不能加"**。
**红线**：禁冗余/重复功能包，优先复用。命令用 **`vp`**（不是 `pnpm`）→ 命令表见 [`techContext.md`](memory-bank/techContext.md)。

### R13: API 对接规范（强制）

对接接口前：① 读对应 Controller/DTO 确认字段 ② 用 Zod 描述请求/响应 ③ 经 `lib/api/` 调用。
测试地址：`localhost:8080/ctt-server/swagger-ui` · mailpit `localhost:8025`。

### R14: 版本号管理（强制实时）

任何代码变更**同步**更新版本号（`package.json` 的 `version`，严禁滞后/跳版本）。
规则：修复 → PATCH · 新功能 → MINOR · 破坏性 → MAJOR（须经确认）· 开发中 → `-beta`/`-rc`。
时机：改完立即写版本号，并在 `activeContext.md` 记一笔。

### R15: 自我学习（强制）

同一问题解决 2 次以上 → 用 skill-creator 建 skill，写入 `~/.agents/skills/<name>/`（**用户级公共库**，跨项目可用）。

### R16: AI 文件保护（强制）

**禁止修改 `.agents/` 目录**（AI 技能工作区）：不读、不改、不删、不纳入审查；发现问题只提醒。✅ 仅当用户明确要求时才可操作。

### R17: Git 恢复禁止（强制）

**禁止 `git reset` 回到初始状态** —— 会丢失且不可恢复，必须经用户确认。

### R18: 资源清理（强制）

用过的资源必须关；持续服务后台静默启动、日志单独输出。**收尾必跑** `bash ~/.omp/packages/session-discipline/tools/sweep.sh` 与 `check-knowledge.sh`，并**在汇报里贴输出** —— 空输出才算干净。
**收尾顺序（一步都不许跳）**：① **todo 对齐**（一次真实 tool 调用，不是只在汇报里写）→ ② 停服务/杀进程 → ③ 删 profile/临时物 → ④ `sweep.sh` + `check-knowledge.sh`（贴输出）→ ⑤ 汇报。
**顺序不可颠倒** ✗：**先杀进程、再删 profile**（活着的 Chrome 会立刻重建目录，删完立刻查是**假干净**）。细节 → 读 `~/.omp/packages/session-discipline/README.md`。

### R19: 文件阅读原则（强制）

片段读取解决不了就直接读整个文件；改文件前必须详读原文；不反复片段读同一文件。

### R20: Skills 选择规范（强制）

用某类 skill 前先**列全同类**再选（可同时多载）。

### R21: 外部 AI 咨询能力

可经 skill 访问 gemini / perplexity 咨询高级 AI 及网络检索。

### R22: 子任务只读约束（强制）

审查/检查/调查类子任务**严格只读**：禁 `--fix`、禁格式化、禁写文件；验证只用只读检查。
**红线**：子 agent 跑 `--fix` 会全项目格式化污染工作区（事故：16 个无关文件被重排）。

### R23: AI 身份与职责边界（强制）

身份：**ctt-web 前端开发者**；唯一可写仓库 = ctt-web，跨仓库一律只读 + 提需求（R3）。
**架构/契约级变更**先出方案 + 影响分析，经明确授权再实施；**讨论 ≠ 指令**（R8）。

### R24: 领域知识库建设（强制）

知识按**领域**沉淀（`memory-bank/domains/<域>/`，第一层永远是领域）；跨轮次判断进领域文件，时间线只记"最近"。
**硬要求**：五件套缺一不可且**禁占位** · **回源**（不同事实回不同来源）· **渐进式披露**（不全读）· `meta.md` 声明**核对基线** · **不把推断当事实**（标「待确认」+ 什么能定论）· 单文件 **≤200 行**。
**红线**：占位 / changelog 化 / 与代码不一致 / **代码一变就覆盖高风险知识**（后端契约 · Zod · 错误码 · 状态流转 · 无障碍与暗色 —— **语义确认归用户**）。
细则 → [`domains/README.md`](memory-bank/domains/README.md)。

### R25: AI 产物位置（强制）

`docs/` 只放**面向用户**文档；AI 产物放 `.omp/`：计划 `.omp/plans/<feature>-plan.md`（不带日期）· 报告/需求 `.omp/<topic>-{delivery-report,requirement}.md` · 记忆 `memory-bank/`（**需提交**）· **工具脚本在公共包 `~/.omp/packages/session-discipline/tools/`（本仓库不再有）**。
**红线**：禁止把实施计划写进 `docs/plans/`。

### R26: AI 索引（强制）

**`memory-bank/index.yaml` 是定位层**：先读它判断"该读哪个文件"，**再只读命中项** —— 不遍历目录树，也不靠记忆猜（早期上下文会被丢弃）。
只定位不写结论 · **同轮维护** · 收尾校验行数 · **索引里没有 = 该知识尚未沉淀**（回写领域文件）。

## 执行流程

读 `index.yaml` 定位 → 读命中文件 → 建 todo（3 步以上）→ 处理 → 收尾双向检查（`sweep.sh` + `check-knowledge.sh`，R18）→ 同轮更新记忆（R2）。

结构说明与操作规程 → [`domains/README.md`](memory-bank/domains/README.md) · [`ai-workflow/meta.md`](memory-bank/domains/ai-workflow/meta.md)。

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
