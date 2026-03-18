# AGENTS.md - 项目记忆与行为约束

> 本文件由 AI 自动维护，人类请勿手动编辑

## 🎯 核心规则

### 规则 1: 每次会话强制读取

每次用户发第一条消息时，**立即读取**以下记忆文件（如果不存在则自动创建）：

- `memory-bank/projectbrief.md` - 项目核心目标
- `memory-bank/techContext.md` - 技术栈与架构
- `memory-bank/systemPatterns.md` - 设计模式与规范
- `memory-bank/activeContext.md` - 当前工作焦点
- `memory-bank/progress.md` - 任务进度

### 规则 2: 自动更新评估

**每次响应完成后，必须评估**是否需要更新记忆文件：

- 如果进行了代码修改 → 更新 `activeContext.md`
- 如果完成了任务 → 更新 `progress.md`
- 如果确立了新的架构决策 → 更新 `systemPatterns.md`
- 如果技术栈有变化 → 更新 `techContext.md`
- **如果项目结构/功能有重大变更 → 同步更新 `README.md`**

### 规则 3: 自主初始化

首次对话时自动检查记忆库结构，缺失文件立即创建。

### 规则 4: 关联项目访问

**关联后端项目**：`../ctt-server` (Spring Boot API Server)

当任务涉及以下场景时，**主动读取**关联项目文件：

- API 接口变更需同步前端调用层
- 数据结构（DTO / Zod Schema）需对齐两端
- 认证协议版本更新（JWT / API Key）
- 任何跨项目协调工作

读取路径：`../ctt-server/` 下的相关文件

### 规则 5: README 与版本实时同步

**当以下情况发生时，必须同步更新 README.md**：

- 新增或修改页面/路由
- 变更技术栈或架构设计
- 添加新功能模块
- 修改项目结构
- 更新构建或部署方式
- 阶段性里程碑完成

**版本更新检查点**：
- 基建工程完成 → `0.0.0` → `0.1.0`
- 主要功能发布 → `0.1.0` → `0.2.0`
- 正式发布 → `1.0.0`

### 规则 6: Git 提交与记忆同步

**关键原则**: 记忆与业务同 Commit，保持提交历史干净和线性

- 记忆文件更新必须与相关业务代码在**同一个 commit**中提交
- 禁止单独提交"更新记忆"的 commit
- 执行流程：更新记忆 → 修改代码 → 一起提交

### 规则 7: Git 操作需人工确认（强制）

**⚠️ 严厉警告**: 所有 Git 操作必须获得用户明确批准

**禁止擅自执行的操作**:

- `git commit` - 创建提交
- `git push` - 推送到远程
- `git merge` / `git rebase` - 分支操作
- `git reset` / `git revert` - 撤销操作
- `git tag` - 标签操作
- `git stash` - 储藏更改
- `gh pr create` - 创建 Pull Request
- `git add`（除了明确获得授权时）
- 任何修改仓库状态的 Git 命令

**允许自主执行的操作**（只读）:

- `git status` - 查看状态
- `git log` - 查看历史
- `git diff` - 查看差异
- `git show` - 查看提交详情

**执行流程**:

1. **说明**: 清楚说明想执行什么操作及原因
2. **等待**: 等待用户明确确认（如"可以"、"继续"）
3. **确认**: 只有收到明确批准后才执行

**⚠️ 重要边界区分**:

| 用户指令      | AI 理解        | 是否执行 Git   |
|-----------|--------------|------------|
| "检查修改"    | 查看状态/差异      | ❌ 只读       |
| "查看变更"    | 查看 diff      | ❌ 只读       |
| "创建分支"    | 仅创建本地分支      | ❌ 不包含提交/推送 |
| "提交"      | commit       | ✅ 需明确确认    |
| "推送"      | push         | ✅ 需明确确认    |
| "创建 PR"   | gh pr create | ✅ 需明确确认    |
| "做吧"/"继续" | 继续之前的操作      | ✅ 按上下文     |

**🚨 红线清单 - 绝对禁止擅自执行**:

1. **提交相关**: `git add` / `git commit` / `git commit --amend`
2. **推送相关**: `git push` / `git push --force`
3. **PR 相关**: `gh pr create` / `gh pr merge`
4. **历史修改**: `git rebase` / `git merge` / `git reset` / `git revert`

**强制确认清单**（执行 Git 提交前必须自问）:

- [ ] 用户是否明确说了"提交"、"commit"或"做吧"？
- [ ] 我是否混淆了"审查建议"和"执行授权"？
- [ ] 如果用户事后说"我没让你提交"，我是否有证据证明用户授权了？

### 规则 8: 技术决策与重大变更需人工确认（强制）

**⚠️ 绝对禁止 AI 擅自修改**：

- **技术栈与版本**: 框架/依赖/构建工具版本（Vite、Vue、pnpm 等）
- **架构设计**: 目录结构/状态管理策略/渲染模式/认证机制
- **数据模型**: Zod Schema / API 类型定义 / 路由结构

**执行原则**:
1. 只读取，不猜测版本
2. 只实现，不决策架构
3. 有疑问必须问

### 规则 9: AI 边界（不懂就问 + 优先现代前端）

**1. 不懂就问原则**:
- 遇到不确定的技术问题，停下来问用户
- 禁止盲目猜测、擅自修改配置

**2. 优先现代前端原则**:
- ✅ 推荐：Vue 3 Composition API、`<script setup>`、`defineModel`、Pinia、TanStack Query
- ❌ 避免：Options API、Vuex、直接操作 DOM、`any` 类型

**3. 技术验证原则**:
- 对不确定的 API 行为，先验证再使用
- 引用用户提供的文档/链接时，直接使用而非假设

### 规则 10: 代码规范边界（国际开源标准）

**1. 语言规范（强制）**:
- 绝对禁止在代码中使用中文和 emoji
- 所有注释、变量名、类型定义必须使用英文
- 例外：仅 `.md` 文档文件可使用中文

**2. 注释规范（Clean Code）**:
- 不要过度注释，代码应当自解释
- 公共 composable / 组件 Props 必须有 JSDoc
- 复杂逻辑注释 "Why" 而非 "What"

**3. 命名规范**:
- 组件名：PascalCase（`UserCard.vue`）
- composable：camelCase + use 前缀（`useAuthStore`）
- 常量：UPPER_SNAKE_CASE（`MAX_RETRY_COUNT`）
- CSS class：kebab-case（`user-avatar`）
- 文件名：kebab-case（`user-profile.ts`）

---

## 🧠 记忆库结构

记忆文件位于 `memory-bank/` 目录，包含：
- `projectbrief.md` - 项目核心目标
- `techContext.md` - 技术栈与架构
- `systemPatterns.md` - 设计模式与规范
- `activeContext.md` - 当前工作焦点
- `progress.md` - 任务进度

---

## ⚡ 执行流程

**阶段 1: 会话开始**
- 检查并读取 memory-bank/ 下的所有文件

**阶段 2: 处理请求**
- 基于记忆文件理解项目背景
- 执行用户请求的任务

**阶段 3: 记忆更新**
- 代码修改 → 更新 `activeContext.md`
- 任务完成 → 更新 `progress.md`
- 架构决策 → 更新 `systemPatterns.md`
- 技术栈变化 → 更新 `techContext.md`

---

## ⚠️ 约束与边界

1. 禁止要求用户操作：所有文件读写由 AI 自主完成
2. 保持精简：每个 .md 文件控制在 200 行以内
3. 事实优先：只记录已发生的代码变更，不猜测未来
4. 实时性：变更必须在同一会话内更新到记忆文件

---

*最后更新：[自动维护，无需手动修改]*
