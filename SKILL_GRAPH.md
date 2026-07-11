# SKILL GRAPH — AI Agent 技能索引

> **用途**：AI 在会话开始时快速扫描本文件，了解所有可用技能并按需加载。
> **维护**：当新增/删除/修改 skill 时同步更新本文件。
> **位置**：项目根目录，与 `AGENTS.md`、`DESIGN.md` 同级。
> **来源**：`~/.agents/skills/` (221) + `~/.config/opencode/skills/` (60) + 项目 `.agents/skills/`

---

## 快速导航

| 领域 | 技能数量 | 跳转 |
|------|---------|------|
| 🧠 思维与流程 | 25 | [→](#思维与流程) |
| 🎨 前端与 UI | 22 | [→](#前端与-ui) |
| 🔧 工程与 Git | 22 | [→](#工程与-git) |
| 🧪 测试与质量 | 14 | [→](#测试与质量) |
| 🔒 安全与审查 | 8 | [→](#安全与审查) |
| 📝 文档与写作 | 20 | [→](#文档与写作) |
| 🌐 浏览器与自动化 | 15 | [→](#浏览器与自动化) |
| 🔬 研究与分析 | 13 | [→](#研究与分析) |
| 🛠️ CLI 工具集 | 60+ | [→](#cli-工具集) |
| 📊 学术与出版 | 14 | [→](#学术与出版) |
| 🍎 iOS 开发 | 5 | [→](#ios-开发) |
| 🚀 GStack 工具套件 | 40+ | [→](#gstack-工具套件) |
| 🎯 项目专属 | 15 | [→](#项目专属技能) |
| 🧬 生物与化学 | 35 | [→](#生物与化学) |
| 🧬 基因组学 | 33 | [→](#基因组学与生物信息学) |
| 🤖 机器学习 | 22 | [→](#机器学习与深度学习) |
| 📐 科学计算 | 15 | [→](#科学计算) |
| 📊 科研写作 | 25 | [→](#研究与写作) |
| 💾 数据与基础设施 | 11 | [→](#数据与基础设施) |
| 🧬 生物与化学 | 35 | [→](#生物与化学) |
| 🧬 基因组学 | 33 | [→](#基因组学与生物信息学) |
| 🤖 机器学习 | 22 | [→](#机器学习与深度学习) |
| 📐 科学计算 | 15 | [→](#科学计算) |
| 📊 科研写作 | 25 | [→](#研究与写作) |
| 💾 数据与基础设施 | 11 | [→](#数据与基础设施) |

---

## 思维与流程

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `using-superpowers` | 会话开始、技能发现 | **会话开始时强制加载**，建立技能使用规则 |
| `using-agent-skills` | 技能发现、任务匹配 | 发现并调用 agent 技能 |
| `brainstorming` | 新功能、创建组件、修改行为 | **必须**在任何创造性工作前使用 |
| `think` | 规划、架构、设计方向、可行性 | 将粗略想法转化为结构化计划 |
| `idea-refine` | 精炼想法、压力测试、发散收敛 | 结构化发散/收敛思维 |
| `planning-and-task-breakdown` | 任务分解、工作量估算 | 将工作分解为有序任务 |
| `writing-plans` | 多步骤任务、编写代码前 | 创建结构化计划 |
| `executing-plans` | 执行计划、分步实施 | 在独立会话中执行实现计划 |
| `incremental-implementation` | 多文件变更、渐进式交付 | 逐步交付变更 |
| `subagent-driven-development` | 当前会话、独立任务 | 使用并行子代理执行计划 |
| `dispatching-parallel-agents` | 2+独立任务、并行化 | 并行分发多个独立任务 |
| `using-git-worktrees` | 功能隔离、独立工作区 | 确保隔离工作区存在 |
| `implement` | PRD、问题集、实现 | 基于 PRD 或问题集实现工作 |
| `prototype` | 原型、设计问题、验证 | 构建一次性原型回答设计问题 |
| `spec-driven-development` | 规格先行、新项目、新功能 | 创建规格后再编码 |
| `handoff` | 交接、上下文压缩 | 将当前对话压缩为交接文档 |
| `claude-handoff` | 交接、新 agent | 将当前对话交给新 agent |
| `context-engineering` | 上下文设置、规则文件 | 优化 agent 上下文设置 |
| `context-save` | 保存进度、保存状态 | 捕获 git 状态和决策 |
| `context-restore` | 恢复上下文、继续工作 | 恢复之前保存的工作上下文 |
| `loop-me` | 工作流规格、压力测试 | 在工作区内压力测试工作流规格 |
| `grilling` | 压力测试、设计审查 | 对计划或设计进行无情质询 |
| `grill-me` | 压力测试、计划审查 | 对计划进行无情采访 |
| `grill-with-docs` | 压力测试、文档创建 | 压力测试同时创建 ADR 和术语表 |
| `wizard` | 交互式向导、手动流程 | 生成交互式 bash 向导引导人工操作 |

---

## 前端与 UI

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `frontend` | UI、UX、设计、样式、动画 | **必须**用于任何前端/UI/UX 工作 |
| `frontend-design` | 审美方向、排版、视觉设计 | 新 UI 或重塑时的视觉设计指导 |
| `frontend-ui-engineering` | 生产级 UI、组件、布局 | 构建或修改用户界面 |
| `ui` | UI、页面、组件、排版 | 生成独特、生产级的 UI |
| `design-taste-frontend` | 落地页、作品集、重新设计 | 反模板前端技能 |
| `design-taste-frontend-v1` | 向后兼容、v1 版本 | 原始 v1 味道技能 |
| `high-end-visual-design` | 高端、精品、奢华 | 教 AI 像高端设计机构一样设计 |
| `minimalist-ui` | 极简、编辑风格、温暖单色 | 干净的编辑风格界面 |
| `industrial-brutalist-ui` | 工业、机械、军事 | 原始机械界面融合瑞士印刷美学 |
| `gpt-taste` | GSAP、AIDA、bento grid | 精英 UX/UI 和高级 GSAP 运动工程 |
| `stitch-design-taste` | Google Stitch、语义设计 | 为 Google Stitch 生成 DESIGN.md |
| `redesign-existing-projects` | 升级、高质量、现有项目 | 将现有网站升级到高级质量 |
| `emil-design-eng` | UI 打磨、组件设计 | Emil Kowalski 的 UI 打磨哲学 |
| `design-an-interface` | 设计接口、并行子代理 | 为模块生成多个不同接口设计 |
| `animation-vocabulary` | 动画术语、运动效果命名 | 将模糊描述转为精确动画术语 |
| `review-animations` | 动画审查、运动代码 | 对动画代码进行高标准审查 |
| `transitions-dev` | CSS 过渡、通知、下拉、模态 | 生产就绪的 CSS 过渡实现 |
| `image-to-code` | 图片转代码、设计还原 | 将设计图片转为精确实现 |
| `imagegen-frontend-mobile` | 移动端设计、iOS/Android | 精英移动端应用图片生成 |
| `imagegen-frontend-web` | Web 设计、落地页、营销 | 精英前端图片方向技能 |
| `web-design-guidelines` | UI 审查、可访问性 | 检查 Web 界面指南合规性 |
| `web-artifacts-builder` | 复杂 HTML 制品 | 创建精致的多组件 HTML 制品 |
| `a11y-debugging` | 无障碍、a11y、焦点、键盘导航 | 使用 Chrome DevTools 进行无障碍调试 |
| `brandkit` | 品牌套件、logo、身份 | 高端品牌套件图片生成 |
| `diagram-design` | 架构图、流程图、时序图 | 创建技术/产品图表（HTML + SVG） |
| `design-an-interface` | 设计接口、并行子代理 | 为模块生成多个不同接口设计 |

---

## 工程与 Git

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `git-master` | commit、rebase、squash、blame | **必须**用于任何 git 操作 |
| `git-workflow-and-versioning` | 提交、分支、冲突解决 | 结构化 git 工作流实践 |
| `git-guardrails-claude-code` | 阻止危险 git、安全钩子 | 设置 Claude Code 钩子阻止危险 git 命令 |
| `resolving-merge-conflicts` | 合并/变基冲突 | 解决进行中的合并/变基冲突 |
| `create-pull-request` | 创建 PR、提交审查 | 遵循项目约定创建 GitHub PR |
| `requesting-code-review` | 完成任务、合并前 | 验证工作符合需求 |
| `receiving-code-review` | 收到代码审查反馈 | 接收代码审查反馈前使用 |
| `code-review` | 代码审查、PR 审查 | 沿两个轴审查：标准和规格 |
| `check` | 代码审查、PR 分类、发布门控 | 审查代码差异、PR、发布就绪性 |
| `code-review-and-quality` | 多维度代码审查 | 合并前评估代码质量 |
| `code-simplification` | 简化代码、重构、清晰度 | 为清晰度简化代码 |
| `deprecation-and-migration` | 移除旧系统、API 迁移 | 管理弃用和迁移 |
| `api-and-interface-design` | API 设计、接口设计、模块边界 | 引导稳定的 API 和接口设计 |
| `codebase-design` | 深度模块、接口设计、可测试性 | 深度模块设计词汇 |
| `improve-codebase-architecture` | 架构改进、深度机会 | 扫描代码库寻找深度化机会 |
| `code-simplification` | 简化代码、重构、清晰度 | 为清晰度简化代码 |
| `ci-cd-and-automation` | CI/CD、流水线 | 自动化 CI/CD 流水线设置 |
| `ci-fix` | CI 失败、红灯、诊断 | 诊断并修复 GitHub Actions CI 失败 |
| `setup-pre-commit` | Husky、lint-staged | 设置 pre-commit 钩子 |
| `deploy-to-vercel` | 部署到 Vercel | 部署应用到 Vercel |
| `vercel-cli-with-tokens` | Vercel CLI、令牌认证 | 使用令牌认证部署到 Vercel |
| `vercel-optimize` | Vercel 成本、性能优化 | Vercel 成本和性能优化 |
| `vercel-composition-patterns` | React 组合模式、组件架构 | React 组合模式指南 |
| `vercel-react-best-practices` | React、Next.js、性能 | React/Next.js 性能优化指南 |
| `vercel-react-native-skills` | React Native、Expo、移动端 | React Native/Expo 最佳实践 |
| `vercel-react-view-transitions` | 视图过渡、页面动画 | React 视图过渡 API 实现 |
| `shipping-and-launch` | 生产部署、预发布检查 | 准备生产发布 |
| `finish-a-development-branch` | 完成开发、合并、PR | 引导完成开发工作的集成 |
| `to-issues` | 拆分问题、issue tracker | 将计划拆分为独立可抓取的问题 |
| `to-prd` | 转为 PRD、发布到 tracker | 将对话转为 PRD 并发布 |
| `to-spec` | 转为规格、发布到 tracker | 将当前对话合成为规格并发布到 issue tracker |
| `to-tickets` | 拆分票、tracer-bullet | 将计划/规格拆分为 tracer-bullet tickets（含阻塞边）|
| `spec` | 规格化、文件问题 | 将模糊意图转为精确可执行规格 |
| `wayfinder` | 大块工作、调查票 | 将大块工作规划为共享调查票地图 |
| `request-refactor-plan` | 重构计划、RFC、增量步骤 | 创建详细的重构计划 |
| `finishing-a-development-branch` | 完成开发、合并、PR | 引导完成开发工作的集成 |
| `triage` | 问题分类、外部 PR | 将问题和外部 PR 通过分类角色状态机 |
| `github-bug-report-triage` | GitHub bug、问题评估 | 评估 bug 报告的可操作性 |
| `github-issue-dedupe` | 重复问题、语义搜索 | 检测重复 GitHub 问题 |
| `scaffold-exercises` | 练习目录、课程章节 | 创建练习目录结构 |

---

## 测试与质量

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `test-driven-development` | 实现功能、修复 bug、红绿重构 | **必须**在编写实现代码前使用 |
| `tdd` | 红绿重构、集成测试 | 测试驱动开发 |
| `systematic-debugging` | bug、测试失败、意外行为 | 遇到任何 bug 前使用 |
| `debugging-and-error-recovery` | 系统化调试、根因分析 | 引导系统化根因调试 |
| `diagnosing-bugs` | 诊断、调试、根因分析 | 硬 bug 和性能回归的诊断循环 |
| `hunt` | 错误、崩溃、回归、失败测试 | 在应用修复前找到根因 |
| `verification-before-completion` | 声称完成、修复、通过 | 声称工作完成前必须运行验证 |
| `vitest` | Vitest、单元测试、覆盖率 | Vitest 快速单元测试框架 |
| `vue-testing-best-practices` | Vue 测试、组件测试 | Vue.js 测试最佳实践 |
| `webapp-testing` | Web 应用测试、Playwright | 使用 Playwright 测试本地 Web 应用 |
| `web-accessibility-audit` | WCAG、可访问性检查 | 审计 WCAG 可访问性合规 |
| `web-performance-audit` | Lighthouse、页面加载 | 使用 Chrome DevTools 审计性能 |
| `performance-optimization` | 性能优化、Core Web Vitals | 优化应用性能 |
| `memory-leak-debugging` | 内存泄漏、堆快照 | 诊断和解决内存泄漏 |
| `api-contract-verification` | API 集成、后端对接 | **必须**用于 ctt-web 与 ctt-server API 集成 |
| `qa` | QA 测试、系统化测试、bug 发现 | 系统化 QA 测试 Web 应用并修复 bug |
| `full-output-enforcement` | 完整输出、截断、token 限制 | 强制完整代码生成，禁止截断 |
| `migrate-to-shoehorn` | shoehorn、类型断言、测试迁移 | 将测试文件从 `as` 断言迁移到 shoehorn |
| `terraform-style-check` | Terraform、HCL、基础设施 | 生成遵循 HashiCorp 风格的 Terraform 代码 |

---

## 安全与审查

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `security-research` | 安全审查、漏洞研究 | 编排 3 个漏洞猎人并行审计 |
| `security-review` | 安全审查、漏洞审计 | security-research 的别名 |
| `security-and-hardening` | 用户输入、认证、数据存储 | 加固代码抵御漏洞 |
| `cso` | 安全审计、威胁模型、OWASP | 首席安全官模式 |
| `careful` | 安全护栏、rm -rf、DROP TABLE | 在破坏性命令前发出警告 |
| `guard` | 完整安全模式、目录范围编辑 | 破坏性命令警告 + 目录限制 |
| `reverse-engineering` | 逆向工程、二进制分析 | 逆向工程和二进制分析 |
| `software-engineering-laws-and-philosophy` | 工程定律、架构决策 | 56 条软件工程定律指导决策 |

---

## 文档与写作

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `write` | 起草、重写、校对、润色 | 重写和润色中文或英文散文 |
| `edit-article` | 编辑、修改、改进文章 | 重组章节和改进清晰度 |
| `writing-beats` | 写作、素材组装 | 将原始素材组装成节拍旅程 |
| `writing-fragments` | 写作、原始片段 | 挖掘原始片段 |
| `writing-shape` | 写作、段落成型 | 将素材逐段成型为文章 |
| `writing-guidelines` | 审查文档、写作风格 | 检查写作指南合规性 |
| `writing-great-skills` | 编写技能、技能参考 | 编写和编辑技能的参考 |
| `writing-skills` | 创建技能、验证技能 | 创建新技能或验证现有技能 |
| `docs-update` | 更新文档、文档变更 | 代码变更时更新用户文档 |
| `documentation-and-adrs` | 架构决策、API 变更 | 记录决策和文档 |
| `doc-coauthoring` | 写文档、提案、技术规格 | 结构化文档共同编写工作流 |
| `internal-comms` | 内部通信、状态报告 | 编写各种内部通信 |
| `research` | 研究主题、收集文档 | 调查问题并捕获发现 |
| `researchwrite` | 科学写作、提案优先 | 提案优先的科学写作流水线 |
| `make-pdf` | 制作 PDF、导出 PDF | 将 Markdown 转为出版级 PDF |
| `kami` | 排版、简历、白皮书、落地页、PPT | 专业文档排版（羊皮纸+墨蓝+衬线） |
| `document-generate` | 生成文档、教程 | 从头生成缺失文档 |
| `document-release` | 发布后文档、同步文档 | 发布后更新文档 |
| `read` | 读取 URL、PDF、摘要 | 读取 URL 和 PDF 内容 |
| `teach` | 教授技能、概念 | 在工作区内教授新技能或概念 |
| `ubiquitous-language` | DDD、术语表、领域模型 | 提取 DDD 风格的通用语言术语表 |
| `domain-modeling` | 领域模型、术语、ADR | 构建和锐化项目的领域模型 |

---

## 浏览器与自动化

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `playwright` | 浏览器相关任务 | **必须**用于任何浏览器相关任务 |
| `browser` | 自动化、抓取、测试 | 通过 CDP 直接控制浏览器 |
| `browser-harness` | 点击、截图、填写表单 | 通过 CDP 自动化浏览器 |
| `browser-use` | Web 交互、自动化 | 始终使用 browser-use 进行 Web 交互 |
| `browser-testing-with-devtools` | DOM 检查、控制台错误 | 在真实浏览器中测试 |
| `chrome-devtools` | 调试、自动化、性能分析 | 通过 MCP 使用 Chrome DevTools |
| `chrome-devtools-cli` | Shell 脚本、浏览器自动化 | 编写 Shell 脚本自动化浏览器 |
| `open-gstack-browser` | 打开浏览器、启动浏览器 | 启动 AI 控制的 Chromium |
| `transient-ui-capture` | Toast、动画、加载态 | 捕获短暂 UI 元素的技巧 |
| `scrape` | 抓取、提取数据 | 从网页拉取数据 |
| `dokobot` | 读取网页、搜索 | 使用真实 Chrome 读取网页 |
| `doko-search` | 免费网页搜索 | 通过 Chrome 读取搜索引擎结果 |
| `doko-summarize` | 网页摘要 | 生成网页的简洁摘要 |
| `doko-translate` | 翻译网页 | 翻译网页内容同时保留结构 |
| `doko-research` | 迭代网页研究 | 多轮搜索并构建研究报告 |
| `ai-chat-browser` | Gemini、Perplexity、AI 聊天 | 通过浏览器自动化与 AI 聊天 |
| `troubleshooting` | 连接问题、目标问题 | 使用 Chrome DevTools 排查连接问题 |
| `debug-optimize-lcp` | LCP、页面加载、CWV | 调试和优化最大内容绘制 |
| `slack-qa-investigate` | Slack QA、只读调查 | 以只读模式调查仓库问题 |

---

## 研究与分析

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `find-skills` | 查找技能、发现功能 | 帮助用户发现和安装 agent 技能 |
| `skill-creator` | 创建技能、编辑技能 | 创建新技能、修改和改进 |
| `skillify` | 固化、保存抓取 | 将成功的抓取流固化为永久技能 |
| `opencli-usage` | OpenCLI、发现适配器 | OpenCLI 会话开始时使用 |
| `cli-hub-meta-skill` | CLI 工具目录、发现工具 | 发现 agent 原生 CLI |
| `analysis-artifacts` | SQL、Python 可视化、BigQuery | 生成可重现的分析制品 |
| `dbt-model-index` | dbt 模型、BigQuery、数据仓库 | 提供 dbt 模型查找索引 |
| `health` | 代码质量、健康检查 | 代码质量仪表板 |
| `learn` | 项目学习、经验教训 | 管理项目学习 |
| `retro` | 周回顾、工程回顾 | 每周工程回顾 |
| `scheduler` | 定时提醒、本地操作 | 安排设备端提醒和本地操作 |
| `seo-aeo-audit` | SEO、优化搜索、结构化数据 | 优化搜索引擎可见性 |
| `ask-matt` | 技能路由、哪个技能 | 询问哪个技能或流程适合当前情况 |
| `obsidian-vault` | Obsidian、笔记、知识库 | 在 Obsidian vault 中搜索/创建/管理笔记 |
| `setup-matt-pocock-skills` | 配置仓库、工程技能 | 为工程技能配置仓库 |
| `notion-mcp` | Notion、MCP、页面管理 | 通过 MCP 与 Notion 工作区交互（创建/搜索/更新页面、数据库、视图、评论） |

---

## CLI 工具集

> 完整目录请参阅 `cli-hub-meta-skill`。

### 创意与媒体

| Skill | 用途 |
|-------|------|
| `cli-anything-gimp` | GIMP 图像编辑 |
| `cli-anything-inkscape` | Inkscape 矢量图形 |
| `cli-anything-blender` | Blender 3D 场景 |
| `cli-anything-krita` | Krita 数字绘画 |
| `cli-anything-audacity` | Audacity 音频编辑 |
| `cli-anything-shotcut` | Shotcut 视频编辑 |
| `cli-anything-kdenlive` | Kdenlive 视频编辑 |
| `cli-anything-openscreen` | 屏幕录制编辑 |
| `cli-anything-videocaptioner` | 视频字幕 |
| `cli-anything-quietshrink` | macOS 录制压缩 |
| `cli-anything-musescore` | MuseScore 乐谱 |
| `cli-anything-mubu` | Mubu 实时桥接 |
| `cli-anything-wavetone` | WaveTone 音频 |

### 3D 与 CAD

| Skill | 用途 |
|-------|------|
| `cli-anything-freecad` | FreeCAD 参数化 3D CAD |
| `cli-anything-threemf` | 3MF 网格编辑 |
| `cli-anything-eez-studio` | EEZ Studio LVGL |
| `cli-anything-renderdoc` | RenderDoc 图形调试 |
| `cli-anything-nsight-graphics` | Nsight Graphics |

### 游戏引擎

| Skill | 用途 |
|-------|------|
| `cli-anything-godot` | Godot 游戏引擎 |
| `cli-anything-sbox` | s&box 游戏引擎 |
| `cli-anything-slay-the-spire-ii` | Slay the Spire 2 |

### 图表与文档

| Skill | 用途 |
|-------|------|
| `cli-anything-mermaid` | Mermaid 图表 |
| `cli-anything-drawio` | Draw.io 图表 |
| `cli-anything-libreoffice` | LibreOffice 文档 |
| `cli-anything-calibre` | Calibre 电子书 |

### 数据库与存储

| Skill | 用途 |
|-------|------|
| `cli-anything-chromadb` | ChromaDB 向量数据库 |
| `cli-anything-tigris` | Tigris 对象存储 |

### AI 与 LLM

| Skill | 用途 |
|-------|------|
| `cli-anything-ollama` | 本地 LLM 推理 |
| `cli-anything-minimax` | MiniMax AI |
| `cli-anything-novita` | Novita AI |
| `cli-anything-comfyui` | ComfyUI 图像生成 |
| `cli-anything-anygen` | AnyGen 演示文稿 |
| `cli-anything-dify-workflow` | Dify 工作流 DSL |
| `cli-anything-notebooklm` | NotebookLM |

### 自动化与集成

| Skill | 用途 |
|-------|------|
| `cli-anything-n8n` | n8n 工作流自动化 |
| `cli-anything-mailchimp` | Mailchimp 营销 API |
| `cli-anything-zoom` | Zoom 会议管理 |
| `cli-anything-firefly-iii` | Firefly III 个人财务 |
| `cli-anything-joplin` | Joplin 笔记 |
| `cli-anything-obsidian` | Obsidian 知识管理 |
| `cli-anything-siyuan` | 思源笔记 |
| `cli-anything-zotero` | Zotero 参考文献 |

### 系统与运维

| Skill | 用途 |
|-------|------|
| `cli-anything-pm2` | PM2 进程管理 |
| `cli-anything-lldb` | LLDB 调试 |
| `cli-anything-nslogger` | NSLogger 日志 |
| `cli-anything-obs-studio` | OBS Studio 场景 |
| `cli-anything-live2d` | Live2D 模型 |
| `cli-anything-rekordbox` | Rekordbox DJ |
| `cli-anything-qgis` | QGIS 地理信息 |
| `cli-anything-wiremock` | WireMock HTTP mock |
| `cli-anything-jumpserver` | JumpServer 堡垒机 |
| `cli-anything-rms` | Teltonika RMS |
| `cli-anything-seaclip` | SeaClip-Lite 项目管理 |
| `cli-anything-unrealinsights` | Unreal Engine 追踪 |
| `cli-anything-unimol-tools` | Uni-Mol 分子预测 |
| `cli-anything-cloudanalyzer` | CloudAnalyzer QA |
| `cli-anything-cloudcompare` | CloudCompare 点云 |

### 浏览器与 Web

| Skill | 用途 |
|-------|------|
| `cli-anything-browser` | 浏览器自动化 CLI |
| `cli-anything-safari` | Safari 浏览器自动化 |
| `cli-anything-exa` | Exa 网页搜索 |
| `cli-anything-web-yu-pri` | 日本邮政 Web Yu-pri |
| `cli-anything-adguardhome` | AdGuard Home DNS |
| `cli-anything-intelwatch` | 竞争情报 OSINT |
| `cli-anything-eth2-quickstart` | Ethereum 节点部署 |
| `cli-anything-openrefine` | OpenRefine 数据清洗 |

### 其他

| Skill | 用途 |
|-------|------|
| `cli-anything` | 为 GUI 应用构建 CLI 包装器 |
| `cli-anything-hermes` | Hermes Agent CLI 构建 |
| `cli-anything-macrocli` | GUI 宏 CLI |
| `cli-anything-ccswitch` | CC Switch 配置管理 |
| `cli-anything-iterm2` | iTerm2 终端控制 |
| `cli-anything-iterm2-ctl` | iTerm2 终端控制 (ctl) |

---

## 学术与出版

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `nature-writing` | 学术写作、论文写作 | 起草 Nature 风格稿件 |
| `nature-polishing` | 论文润色、语言编辑 | 润色学术散文 |
| `nature-reviewer` | 模拟审稿、预审 | 模拟 Nature 风格审稿人评估 |
| `nature-response` | 回复审稿人、rebuttal | 起草逐点审稿人回复信 |
| `nature-citation` | 添加引用、文献支撑 | 添加 Nature/CNS 引用 |
| `nature-figure` | 论文配图、科研绘图 | 创建 Nature 级别论文图表 |
| `nature-data` | 数据可用性声明 | 准备数据可用性声明 |
| `nature-reader` | 读论文、翻译论文 | 构建中英文对照论文阅读器 |
| `nature-paper2ppt` | 论文做 PPT、组会汇报 | 从论文构建中文 PPTX |
| `nature-paper-to-patent` | 论文转专利 | 将论文转为中国发明专利草案 |
| `nature-downloader` | 下载论文、图书馆访问 | 下载学术全文/PDF |
| `nature-academic-search` | 文献检索、引文核对 | 多源文献搜索 |
| `nature-literature-pipeline` | 文献发现、自动推送 | 自动化文献发现流水线 |
| `nature-experiment-log` | 实验日志、标准化记录 | 标准化实验日志记录 |

---

## iOS 开发

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `ios-qa` | iOS QA、iPhone 测试、设备测试 | 真实设备 iOS QA |
| `ios-fix` | iOS bug、修复 iPhone 应用 | 自主 iOS bug 修复器 |
| `ios-sync` | 同步 iOS 调试桥 | 重新生成 iOS 调试桥 |
| `ios-clean` | 清理 iOS 调试桥 | 移除 DebugBridge SPM 包 |
| `ios-design-review` | iOS 设计审查、iPhone UI | iOS 应用视觉设计审计 |

---

## GStack 工具套件

> GStack 是一套集成的开发工具套件。以下为 `~/.config/opencode/skills/` 中的 gstack 技能。

### 核心路由

| Skill | 说明 |
|-------|------|
| `gstack` | GStack 技能套件路由器 |
| `gstack-upgrade` | 升级 GStack 到最新版本 |

### 规划与审查

| Skill | 说明 |
|-------|------|
| `gstack-autoplan` | 自动审查流水线 |
| `gstack-plan-ceo-review` | CEO/创始人模式计划审查 |
| `gstack-plan-design-review` | 设计师视角计划审查 |
| `gstack-plan-devex-review` | 开发者体验计划审查 |
| `gstack-plan-eng-review` | 工程经理模式计划审查 |
| `gstack-plan-tune` | 问题灵敏度自调优 |
| `gstack-review` | 着陆前 PR 审查 |
| `gstack-spec` | 将模糊意图转为精确规格 |

### QA 与测试

| Skill | 说明 |
|-------|------|
| `gstack-qa` | 系统化 QA 测试并修复 bug |
| `gstack-qa-only` | 仅报告 QA 测试 |
| `gstack-browse` | 快速无头浏览器 QA |
| `gstack-benchmark` | 性能回归检测 |
| `gstack-benchmark-models` | 跨模型基准测试 |

### 设计

| Skill | 说明 |
|-------|------|
| `gstack-design-consultation` | 设计咨询 |
| `gstack-design-html` | 设计定稿：生成 HTML/CSS |
| `gstack-design-review` | 设计师视角 QA |
| `gstack-design-shotgun` | 设计探索：多变体生成 |
| `gstack-diagram` | 英文描述转图表 |

### 文档

| Skill | 说明 |
|-------|------|
| `gstack-document-generate` | 从头生成缺失文档 |
| `gstack-document-release` | 发布后文档更新 |
| `gstack-make-pdf` | Markdown 转出版级 PDF |
| `gstack-learn` | 管理项目学习 |

### 部署与运维

| Skill | 说明 |
|-------|------|
| `gstack-ship` | Ship 工作流 |
| `gstack-land-and-deploy` | 合并 PR、等待 CI、验证生产 |
| `gstack-landing-report` | 只读队列仪表板 |
| `gstack-setup-deploy` | 配置部署设置 |
| `gstack-canary` | 部署后金丝雀监控 |

### 调试与安全

| Skill | 说明 |
|-------|------|
| `gstack-investigate` | 系统化调试根因调查 |
| `gstack-cso` | 首席安全官模式 |
| `gstack-careful` | 破坏性命令安全护栏 |
| `gstack-guard` | 完整安全模式 |
| `gstack-freeze` | 限制文件编辑到特定目录 |
| `gstack-unfreeze` | 解除冻结边界 |

### 上下文与状态

| Skill | 说明 |
|-------|------|
| `gstack-context-save` | 保存工作上下文 |
| `gstack-context-restore` | 恢复工作上下文 |
| `gstack-health` | 代码质量仪表板 |
| `gstack-retro` | 每周工程回顾 |
| `gstack-learn` | 管理项目学习 |

### 开发者体验

| Skill | 说明 |
|-------|------|
| `gstack-devex-review` | 实时开发者体验审计 |
| `gstack-office-hours` | YC 办公时间 |
| `gstack-open-gstack-browser` | 启动 GStack Browser |
| `gstack-pair-agent` | 远程 agent 配对浏览器 |
| `gstack-setup-browser-cookies` | 导入浏览器 cookies |
| `gstack-setup-gbrain` | 设置 gbrain |
| `gstack-sync-gbrain` | 同步 gbrain |
| `gstack-skillify` | 固化成功的抓取流 |
| `gstack-claude` | Claude Code CLI 包装器 |

### iOS

| Skill | 说明 |
|-------|------|
| `gstack-ios-qa` | 真实设备 iOS QA |
| `gstack-ios-fix` | 自主 iOS bug 修复 |
| `gstack-ios-sync` | 同步 iOS 调试桥 |
| `gstack-ios-clean` | 清理 iOS 调试桥 |
| `gstack-ios-design-review` | iOS 设计审查 |

### 其他 GStack

| Skill | 说明 |
|-------|------|
| `gstack-scrape` | 从网页拉取数据 |
| `gstack-diagram` | 英文描述转图表 |
| `gstack-upgrade` | 升级 GStack |
| `sisyphus-execution-rules` | Sisyphus 执行规则 |

---

## 生物与化学

| Skill | 用途 |
|-------|------|
| `adaptyv` | Adaptyv Bio 蛋白质实验设计与提交 |
| `anndata` | 单细胞注释矩阵数据结构 |
| `arboreto` | 基因调控网络推断（GRNBoost2, GENIE3） |
| `benchling-integration` | Benchling 实验室数据管理 SDK |
| `biopython` | 分子生物学工具包（序列/文件/NCBI） |
| `bioservices` | 40+ 生物信息学服务统一接口 |
| `cellxgene-census` | CZ CELLxGENE 单细胞数据查询 |
| `cobrapy` | 约束代谢建模（COBRA） |
| `datamol` | RDKit 分子处理简化包装 |
| `deepchem` | 分子机器学习（ADME/毒性预测） |
| `diffdock` | DiffDock 分子对接 |
| `esm` | ESM 蛋白质语言模型 |
| `flowio` | FCS 流式细胞术文件解析 |
| `geniml` | 基因组区间数据机器学习 |
| `glycoengineering` | 蛋白质糖基化分析与工程 |
| `gget` | 20+ 生物信息学数据库快速查询 |
| `ginkgo-cloud-lab` | Ginkgo 云实验室协议管理 |
| `histolab` | 组织病理切片提取与预处理 |
| `imaging-data-commons` | NCI 癌症影像数据查询 |
| `labarchive-integration` | 电子实验笔记本 API |
| `lamindb` | 生物数据集 lineage-native lakehouse |
| `latchbio-integration` | Latch 生物信息学工作流 |
| `matchms` | 代谢组学质谱相似性匹配 |
| `medchem` | 药物化学过滤器（Lipinski, PAINS） |
| `molfeat` | 分子特征化（100+ featurizers） |
| `omero-integration` | 显微镜数据管理平台 |
| `opentrons-integration` | Opentrons 实验室机器人 API |
| `pathml` | 计算病理学工具包 |
| `pydicom` | DICOM 医学影像处理 |
| `pyhealth` | 临床医疗深度学习流水线 |
| `pylabrobot` | 实验室自动化框架 |
| `rdkit` | 化学信息学工具包 |
| `rowan` | 云端分子建模平台 |
| `tamarind` | Tamarind Bio 分子设计工具 |
| `torchdrug` | PyTorch 分子图神经网络 |

---

## 基因组学与生物信息学

| Skill | 用途 |
|-------|------|
| `bgpt-paper-search` | 科学论文结构化实验数据搜索 |
| `bids` | 脑影像数据结构（BIDS） |
| `bulk-rnaseq` | 批量 RNA-seq 端到端流水线 |
| `citation-management` | 学术引用管理 |
| `clinical-decision-support` | 临床决策支持文档生成 |
| `clinical-reports` | 临床报告撰写 |
| `deeptools` | NGS 分析工具包 |
| `depmap` | 癌症依赖图谱查询 |
| `dnanexus-integration` | DNAnexus 云基因组学平台 |
| `etetoolkit` | 系统发育树工具包 |
| `experimental-design` | 实验设计（DOE） |
| `gtars` | 基因组区间分析 Rust 工具 |
| `iso-13485-certification` | 医疗器械 QMS 文档 |
| `nextflow` | Nextflow 数据流水线 |
| `onekgpd` | 千人基因组计划查询 |
| `pacsomatic` | nf-core/pacsomatic 肿瘤正常匹配 |
| `pathway-enrichment` | 通路/基因集富集分析 |
| `phylogenetics` | 系统发育树构建与分析 |
| `polars-bio` | Polars 基因组区间操作 |
| `primekg` | 精准医学知识图谱 |
| `protocolsio-integration` | protocols.io 科学协议管理 |
| `pydeseq2` | 批量 RNA-seq 差异表达分析 |
| `pyopenms` | 质谱分析平台 |
| `pysam` | SAM/BAM/VCF 基因组文件处理 |
| `pytdc` | 治疗数据通用标准 |
| `pyzotero` | Zotero 参考文献 Python 接口 |
| `scanpy` | 单细胞 RNA-seq 标准流水线 |
| `scikit-bio` | 生物数据工具包 |
| `scikit-survival` | 生存分析工具包 |
| `scvelo` | RNA 速度分析 |
| `scvi-tools` | 单细胞深度生成模型 |
| `tiledbvcf` | TileDB 基因组变异存储 |
| `treatment-plans` | 医疗治疗方案生成 |

---

## 机器学习与深度学习

| Skill | 用途 |
|-------|------|
| `aeon` | 时间序列机器学习 |
| `arbor` | 假设树优化（HTR） |
| `cirq` | Google 量子计算框架 |
| `hugging-science` | HuggingFace 科学 AI 资源 |
| `modal` | Modal 无服务器 GPU 平台 |
| `molecular-dynamics` | 分子动力学模拟（OpenMM） |
| `networkx` | 复杂网络/图分析 |
| `neurokit2` | 生物信号处理（ECG/EEG/EDA） |
| `optimize-for-gpu` | Python GPU 加速 |
| `pennylane` | 量子机器学习框架 |
| `pufferlib` | 高性能强化学习框架 |
| `pymc` | 贝叶斯建模 |
| `pymoo` | 多目标优化框架 |
| `pytorch-lightning` | PyTorch Lightning 深度学习 |
| `qiskit` | IBM 量子计算框架 |
| `qutip` | 量子物理模拟 |
| `scikit-learn` | 机器学习标准库 |
| `shap` | 模型可解释性（SHAP） |
| `stable-baselines3` | 强化学习算法库 |
| `torch-geometric` | 图神经网络（PyG） |
| `transformers` | HuggingFace Transformers |
| `umap-learn` | 非线性降维 |

---

## 科学计算

| Skill | 用途 |
|-------|------|
| `astropy` | 天文天体物理计算 |
| `dask` | 分布式计算（超内存） |
| `fluidsim` | 计算流体动力学 |
| `geomaster` | 地理空间科学综合技能 |
| `geopandas` | 地理空间矢量数据 |
| `matlab` | MATLAB/Octave 数值计算 |
| `matplotlib` | Python 底层绘图库 |
| `pymatgen` | 材料科学工具包 |
| `polars` | 高性能 DataFrame |
| `seaborn` | 统计可视化 |
| `simpy` | 离散事件仿真 |
| `statsmodels` | 统计模型库 |
| `sympy` | 符号数学 |
| `vaex` | 超内存 DataFrame |
| `zarr-python` | 云端 N-D 数组存储 |

---

## 研究与写作

| Skill | 用途 |
|-------|------|
| `consciousness-council` | 多视角意识委员会审议 |
| `dhdna-profiler` | 认知模式/思维指纹提取 |
| `exploratory-data-analysis` | 探索性数据分析 |
| `generate-image` | AI 图像生成（FLUX） |
| `hypothesis-generation` | 结构化假设生成 |
| `hypogenic` | LLM 驱动假设测试 |
| `infographics` | 专业信息图生成 |
| `latex-posters` | LaTeX 研究海报 |
| `literature-review` | 系统文献综述 |
| `market-research-reports` | 市场研究报告（McKinsey 风格） |
| `paper-lookup` | 10 学术数据库论文搜索 |
| `paperzilla` | 论文推荐与摘要 |
| `peer-review` | 结构化同行评审 |
| `pptx-posters` | PPTX 研究海报 |
| `research-grants` | 研究资助提案撰写 |
| `research-lookup` | 科研信息检索 |
| `scholar-evaluation` | 学术成果评估 |
| `scientific-brainstorming` | 科学创意头脑风暴 |
| `scientific-critical-thinking` | 科学批判性思维 |
| `scientific-schematics` | 科学示意图生成 |
| `scientific-slides` | 科学演示幻灯片 |
| `scientific-visualization` | 出版级科学图表 |
| `scientific-writing` | 科学论文写作 |
| `venue-templates` | 期刊/会议 LaTeX 模板 |
| `what-if-oracle` | What-If 场景分析 |

---

## 数据与基础设施

| Skill | 用途 |
|-------|------|
| `autoskill` | 屏幕观察自动技能发现 |
| `database-lookup` | 公开数据库 API 查询 |
| `get-available-resources` | 系统资源检测 |
| `liteparse` | 本地 PDF/文档解析 |
| `markdown-mermaid-writing` | Markdown + Mermaid 图表写作 |
| `markitdown` | 文件转 Markdown |
| `neuropixels-analysis` | Neuropixels 电生理分析 |
| `open-notebook` | 自托管 NotebookLM 替代 |
| `parallel-web` | 并行 Web 工具套件 |
| `timesfm-forecasting` | Google 时间序列预测 |
| `usfiscaldata` | 美国财政部数据查询 |

---

## 项目专属技能

> 位于项目 `.agents/skills/` 和 `.claude/skills/` 目录。

| Skill | 项目 | 说明 |
|-------|------|------|
| `vue` | ctt-web | Vue 3 Composition API |
| `vue-best-practices` | ctt-web | **必须**用于 Vue.js 任务 |
| `vue-router-best-practices` | ctt-web | Vue Router 4 模式 |
| `vueuse-functions` | ctt-web | VueUse 组合式函数 |
| `pinia` | ctt-web | Pinia 状态管理 |
| `vite` | ctt-web | Vite 构建工具 |
| `vitest` | ctt-web | Vitest 测试框架 |
| `nuxt` | ctt-web | Nuxt 全栈框架 |
| `vitepress` | ctt-web | VitePress 静态站点 |
| `slidev` | ctt-web | Slidev 开发者幻灯片 |
| `unocss` | ctt-web | UnoCSS 原子 CSS |
| `tsdown` | ctt-web | TypeScript 库打包 |
| `turborepo` | ctt-web | Turborepo 单体仓库 |
| `pnpm` | ctt-web | pnpm 包管理器 |
| `antfu` | ctt-web | Anthony Fu 工具约定 |
| `claude-api` | ctt-web | Claude API 参考 |
| `api-contract-verification` | ctt-web | API 契约验证 |
| `transient-ui-capture` | ctt-web | 捕获短暂 UI 元素 |
| `theme-factory` | ctt-web | 工件主题化 |
| `canvas-design` | ctt-web | 视觉艺术设计 |
| `brand-guidelines` | ctt-web | Anthropic 品牌 |
| `doc-coauthoring` | ctt-web | 文档共同编写 |
| `internal-comms` | ctt-web | 内部通信 |
| `pptx` | ctt-web | PowerPoint 处理 |
| `xlsx` | ctt-web | 电子表格处理 |
| `pdf` | ctt-web | PDF 处理 |
| `docx` | ctt-web | Word 文档处理 |
| `mcp-builder` | ctt-web | MCP 服务器构建 |
| `skill-creator` | ctt-web | 技能创建优化 |
| `slack-gif-creator` | ctt-web | Slack GIF 创建 |
| `algorithmic-art` | ctt-web | p5.js 算法艺术 |
| `frontend-design` | ctt-web | 前端视觉设计 |
| `template-skill` | ctt-web | 技能模板 |

---

## 流程速查

### 会话开始
```
1. using-superpowers (强制)
2. 读取 memory-bank/
3. 根据任务加载相关技能
```

### 新功能开发
```
1. brainstorming → 探索意图
2. think / planning-and-task-breakdown → 规划
3. test-driven-development → 红绿重构
4. verification-before-completion → 验证
5. code-review / check → 审查
```

### Bug 修复
```
1. systematic-debugging → 系统化调试
2. hunt → 假设驱动调查
3. test-driven-development → 测试先行
4. verification-before-completion → 验证
```

### 前端 UI 工作
```
1. frontend → 路由到正确规则集
2. frontend-design → 视觉方向
3. ui → 实现生产级 UI
4. visual-qa → 视觉验证
```

### API 集成
```
1. api-contract-verification → 验证后端契约
2. Zod Schema → 运行时校验
3. ofetch instance → 统一 HTTP 边界
```

---

## 技能优先级规则

1. **用户指令** > **技能** > **默认行为**
2. **流程技能优先**：brainstorming、systematic-debugging 等先于实现技能
3. **项目技能优先**：`vue-best-practices` 优先于通用 `frontend`
4. **用户安装优先**：用户安装的技能覆盖内置默认
5. **多技能可叠加**：可同时加载多个相关技能

---

## 技能加载模式

```typescript
// 单技能
task(category="quick", load_skills=["git-master"], ...)

// 多技能叠加
task(category="visual-engineering", load_skills=["frontend", "vue-best-practices", "transitions-dev"], ...)

// 流程 + 实现组合
task(category="deep", load_skills=["test-driven-development", "vue", "vitest"], ...)
```

---

*最后更新: 2026-07-14*
*技能总数: 432+*
*来源: ~/.agents/skills/ (371) + ~/.config/opencode/skills/ (61) + 项目 .agents/skills/*
