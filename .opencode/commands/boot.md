---
description: 初始化会话 - 读取项目文件了解上下文（按 AGENTS.md R1 强制执行）
---

**⚠️ 强制规则**: 此命令必须严格按照 AGENTS.md 执行，任何偏离都被视为违规。

## 执行流程

### 阶段 1: 读取核心配置文件

**必须**按顺序读取以下文件：

1. **行为约束** - @AGENTS.md（**优先读取，作为后续所有操作的准则**）
2. **项目记忆**（R1）:
    - @memory-bank/projectbrief.md
    - @memory-bank/techContext.md
    - @memory-bank/systemPatterns.md
    - @memory-bank/activeContext.md
    - @memory-bank/progress.md
3. **项目说明** - @README.md

**注意**: 如记忆文件不存在，按 AGENTS.md 模板创建。

### 阶段 2: 读取项目规范文档

**必须**读取 `docs/` 目录下的所有 `.md` 文件（如存在）。

这些文档定义了项目的强制约定（组件规范、API 调用层规范、状态管理边界等），**违反规范视为代码缺陷**。

### 阶段 2.5: 关联项目读取（条件触发）

若 `activeContext.md` 中有正在进行的 API 对接任务，**必须读取** `../ctt-server` 对应文件：

- 对接认证接口 → 读取 `AuthController`、`LoginRequest`、`LoginResponse` 相关 DTO
- 对接统计接口 → 读取 `StatsController` 相关文件
- 其他接口 → 按实际任务读取对应 Controller / DTO

**原则**：不读 ctt-server 源码就不写 Zod Schema，不猜测字段结构。

### 阶段 3: 扫描实际代码结构

**必须使用 Glob 工具**扫描实际项目代码：

- 源代码: `src/**/*.ts`, `src/**/*.vue`
- UI 组件库: `src/components/ui/**/*.vue`
- 配置文件: `vite.config.ts`, `tsconfig*.json`, `package.json`, `components.json`
- 样式: `src/**/*.css`
- 测试: `e2e/**/*.spec.ts`, `src/**/*.test.ts`, `src/**/*.spec.ts`
- 工具配置: `.oxfmtrc.json`, `.oxlintrc.json`, `eslint.config.*`

**禁止假设**: 不要假设代码"应该"存在或不存在，必须通过 Glob 确认。

### 阶段 4: 检查 .gitignore

**必须读取** @.gitignore 了解哪些文件被排除在版本控制外。

`.env.local` 等本地配置通常被 ignore，这是正常的，不要指出"问题"。

### 阶段 5: 读取发现的代码文件

根据阶段 3 的扫描结果，读取实际存在的代码文件以了解：

- 项目结构与已实现的功能
- 技术栈版本（**只读取，不质疑，不升级** - 遵守 R7）
- shadcn-vue 已安装的组件列表（通过 `src/components/ui/` 目录确认）
- 路由结构（通过 `src/router/` 确认）

**版本处理规则**（R7）:

- ✅ "当前使用 Vite 6.3.0"（仅陈述事实）
- ❌ "Vite 6 已过期，建议升级到 7"（禁止！）

### 阶段 6: 确认边界情况

**必须读取** @memory-bank/activeContext.md 确认：

1. **当前正在处理的任务** - 避免偏离当前工作焦点
2. **已知错误/障碍** - 避免重复踩坑（如已知的 Hydration mismatch、类型错误）
3. **最近变更** - 了解最新进展
4. **下一步行动** - 明确接下来的任务

### 阶段 7: 输出摘要

```
=== 项目状态 ===

项目: [来自 projectbrief.md / README.md]

当前进度:
- [来自 progress.md]

正在处理:
- [来自 activeContext.md]

技术栈（按 techContext.md + 实际代码确认）:
- [列出实际使用的技术栈，原样读取版本号]

实际代码结构（按 Glob 扫描结果）:
- [列出发现的源文件和目录结构]

shadcn-vue 组件库（按 src/components/ui/ 确认）:
- [列出已安装的组件；目录不存在则标注"尚未初始化"]

规范文档（按 docs/ 目录）:
- [列出读取的文档名称，摘要关键约定；目录不存在则标注"暂无"]

核心约束（按 AGENTS.md）:
- Git 操作需人工确认（R6）
- 技术决策需人工确认（R7）
- API 对接必须读 ctt-server 源码（R13）
- 自动更新记忆文件（R2）
- 只读取不猜测版本（R7）
```

## 核心原则

### 原则 1: 事实优先

目标是**了解项目当前状态**，不是 review 代码质量。

- ✅ "src/features/ 目录尚未建立，符合 scaffold 初始化阶段"
- ❌ "组件结构混乱，缺少业务逻辑，需要重构"

### 原则 2: 版本只读

仅陈述实际使用的版本号，不质疑、不建议升级。

### 原则 3: 遵循项目规范

`docs/` 目录下的文档是**强制约定**，不是建议。新增功能时必须符合规范要求。

### 原则 4: 结合上下文理解

参考 progress.md 中的开发阶段判断代码完备性，不要孤立评判"缺了什么"。

### 原则 5: 确认边界情况

启动时必须确认当前边界：

1. **当前任务边界**: 根据 activeContext.md 确认当前工作范围，不跨越到无关任务
2. **技术决策边界**: 涉及版本/架构/数据模型/Schema 变更必须人工确认（R7）
3. **Git 操作边界**: 所有 commit/push 必须获得明确授权（R6）
4. **API 对接边界**: 接口字段必须读 ctt-server 源码确认，不猜测（R13）
5. **已知障碍**: 根据 activeContext.md 中的错误记录，避免重复踩坑
6. **规范约束边界**: 根据 docs/ 文档，新增功能必须符合既定约定

## 禁止事项

1. **质疑版本**: "XX 版本不稳定/已过期，建议升级到 YY"
2. **主观评判**: 对代码现状做"好/坏"评价（review 任务除外）
3. **大惊小怪**: 对被 .gitignore 的文件指出"问题"
4. **跳读文件**: 不读取 AGENTS.md 就执行操作
5. **不扫描代码**: 仅凭记忆文件假设代码状态
6. **跳读规范**: 不读取 docs/ 目录就开发新功能
7. **猜测接口**: 不读 ctt-server 源码就定义 Zod Schema

---

**区分场景**: `/boot` → 了解项目状态（客观陈述）｜`/review` → 审查代码质量（可做价值判断）
