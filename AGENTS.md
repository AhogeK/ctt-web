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

### R3: 关联项目（只读红线）

`../ctt-server`（后端）与 `../code-time-tracker`（JetBrains 插件端）均为**只读**关联项目：涉及 API 对接、DTO 结构、认证协议、插件认证行为、响应格式变更时**主动读取**对应源码验证契约（R13），不猜测接口形状。

**严禁修改关联项目任何文件**（含源码/测试/文档/版本号）。后端或插件端能力不足、契约需变更时，以**需求文本**形式提出（现状/期望行为/理由/影响面/前端配合），由用户决策实施。

### R4: README 同步

重大变更（路由/架构/功能/部署/里程碑）时同步更新 README.md 和版本号。

### R5: Git 提交同步

记忆文件与业务代码同 commit，禁止单独提交"更新记忆"。

### R6: Git 操作确认（强制）

**禁止擅自执行**：`git add/commit/push/rebase/merge/reset/tag/stash`、`gh pr create/merge`

**允许自主执行**（只读）：`git status/log/diff/show`

**关键词触发**：检查/查看/review → 只读；创建分支 → 本地分支；提交/commit/推送/push/做吧/继续 → 执行需确认

**红线**："审查通过" ≠ 执行授权；第三方工具建议 ≠ 用户授权；连续指令 = 立即执行 + 继续后续

### R6.5: 提交规则（强制）

**核心原则：原子化提交、版本同步、AI独立、cherry-pick合并。**

- **原子化**：代码修改触发版本号更新（检查所有相关文件一并更新），版本提交独立且晚于代码提交
- **累计更新**：不用刻意提交每次中途更新，可只提交最后的版本描述跳过中途
- **分支顺序**：优先完成 develop 全部提交再考虑 master
- **AI独立**：AI相关内容（memory-bank等）单独提交，不与代码混在一起
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

禁止擅自添加依赖。`pnpm add` 前必须提供分析（目的、选型理由、影响、替代方案）并获得用户同意。

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

## 执行流程

会话开始 → 读memory-bank → 创建todo（如需）→ 处理请求 → 清理临时文件 → 更新记忆

## 约束

1. 文件读写由AI自主完成
2. 记忆文件≤200行
3. 只记录已发生事实，不猜测
4. 变更即时更新

## 记忆库结构

`memory-bank/`：projectbrief.md（目标）、techContext.md（技术栈）、systemPatterns.md（规范）、activeContext.md（当前）、progress.md（进度）

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
