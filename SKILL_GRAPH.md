# SKILL GRAPH — AI Agent 技能索引

> **用途**：AI 在会话开始时快速扫描本文件，了解所有可用技能并按需加载。
> **维护**：当新增/删除/修改 skill 时同步更新本文件；技能集合以磁盘目录为准（每条技能都必须能在下列八个来源目录中找到同名目录）。
> **位置**：项目根目录，与 `AGENTS.md`、`DESIGN.md` 同级。
> **来源**：`~/.agents/skills` (377) · `~/.claude/skills` (229) · `~/.config/opencode/skills` (65) · 项目 `.agents/skills` (38) · 项目 `.claude/skills` (35) · 项目 `skills/` (2) · `~/.omp/agent/skills` (2) · omp `superpowers` 扩展包 (14) → 去重后合计 486。


---

## 快速导航

| 领域 | 技能数量 | 跳转 |
| --- | --- | --- |
| 🧠 思维与流程 | 30 | [→](#思维与流程) |
| 🎨 前端与UI | 55 | [→](#前端与ui) |
| 🔧 工程与Git | 36 | [→](#工程与git) |
| 🧪 测试与质量 | 20 | [→](#测试与质量) |
| 🔒 安全与审查 | 3 | [→](#安全与审查) |
| 📝 文档与写作 | 22 | [→](#文档与写作) |
| 🌐 浏览器与自动化 | 19 | [→](#浏览器与自动化) |
| 🔬 研究与分析 | 22 | [→](#研究与分析) |
| 🛠️ CLI工具集 | 76 | [→](#cli工具集) |
| 📚 学术与出版 | 15 | [→](#学术与出版) |
| 🚀 GStack | 55 | [→](#gstack) |
| 🧬 生物与化学 | 34 | [→](#生物与化学) |
| 🧫 基因组学 | 26 | [→](#基因组学) |
| 🤖 机器学习 | 18 | [→](#机器学习) |
| 📐 科学计算 | 19 | [→](#科学计算) |
| ✍️ 科研写作 | 16 | [→](#科研写作) |
| 💾 数据与基础设施 | 8 | [→](#数据与基础设施) |
| 🧩 其他 | 12 | [→](#其他) |


---

## 思维与流程

| Skill                         | 触发词                                       | 说明                                         |
| ----------------------------- | -------------------------------------------- | -------------------------------------------- |
| `arbor`                       | 假设树、迭代优化、评测器、防过拟合           | 用假设树精炼迭代优化产物并做评测防过拟合     |
| `ask-matt`                    | 技能路由、选择流程、求助                     | 询问哪种技能或流程适合当前处境               |
| `brainstorming`               | 创作前、创建功能、构建组件、新增功能、改行为 | 任何创作前先探索用户意图、需求与设计         |
| `claude-handoff`              | 交接、后台代理、上下文转移                   | 把当前对话交接给新后台代理立即接手继续       |
| `consciousness-council`       | 多视角审议、决策、专家视角、换位思考         | 用多角色委员会对问题做多视角审议决策         |
| `context-engineering`         | 上下文配置、规则文件、会话                   | 优化agent上下文与规则配置                    |
| `dispatching-parallel-agents` | 并行任务、独立任务、无共享状态、无顺序依赖   | 同时派发2个以上独立任务的子代理              |
| `domain-modeling`             | 领域模型、术语、CONTEXT.md、ADR              | 构建与打磨项目领域模型术语与ADR              |
| `executing-plans`             | 实施计划、独立会话、审查检查点、分步执行     | 在带审查检查点的独立会话中执行书面计划       |
| `grill-me`                    | 追问、方案打磨、设计评审                     | 用连续追问打磨计划或设计                     |
| `grill-with-docs`             | 追问、方案打磨、ADR、术语表                  | 通过追问打磨方案并同步产出ADR与术语表        |
| `grilling`                    | 追问、压力测试、想法打磨                     | 就计划决策或想法持续追问以压测思考           |
| `handoff`                     | 交接文档、上下文压缩、后续代理               | 把当前对话压缩成交接文档供其他代理接手       |
| `idea-refine`                 | 想法打磨、发散收敛、假设压测                 | 用发散收敛把模糊想法打磨成可行动概念         |
| `implement`                   | 实现、规格、票据、执行                       | 依据规格或票据集合实现具体工作               |
| `loop-me`                     | 工作流设计、追问、规格                       | 就你想构建的工作流反复追问并澄清规格         |
| `planning-and-task-breakdown` | 任务拆分、排期、范围估算、并行               | 把规格拆成有序可实现的开发任务               |
| `prototype`                   | 原型、一次性验证、状态模型、UI探索           | 构建一次性原型以验证状态模型或UI设计         |
| `sisyphus-execution-rules`    | 会话开始、执行规则、Agent边界、委托规则      | 会话开始加载：Agent 分工、Git 限制与资源管理 |
| `spec-driven-development`     | 规格先行、PRD、需求分解、能力图              | 在编码前创建规格与需求分解文档               |
| `subagent-driven-development` | 实施计划、独立任务、当前会话、子代理执行     | 在当前会话中用子代理执行独立任务的计划       |
| `teach`                       | 讲解、教学、理解而非背诵、知识推导           | 用两条原则讲解、确保真正理解而非记忆         |
| `think`                       | 出方案、架构规划、可行性判断、交接           | 编码前把粗略想法变成可执行的完整方案         |
| `to-spec`                     | 转规格、issue、对话综合                      | 把当前对话综合成规格并发布到issue跟踪器      |
| `to-tickets`                  | 拆票、阻塞边、跟踪器、计划                   | 把计划或对话拆成带依赖关系的工作票据         |
| `using-agent-skills`          | 技能发现、会话开始、工作流选择               | 会话开始时发现并调用合适的agent技能          |
| `using-superpowers`           | 会话开始、技能调用、回答前、澄清问题前       | 会话开始即确立技能查找与调用规则             |
| `wayfinder`                   | 大型工作地图、决策票据、issue                | 把超大工作量规划成决策票据地图并逐条攻克     |
| `what-if-oracle`              | 情景分析、what-if、分支推演、决策、压力测试  | 对不确定未来做4-6分支情景推演与决策压力测试  |
| `writing-plans`               | 规格需求、多步任务、写代码前                 | 动手写代码前先为多步任务写计划               |

---

## 前端与UI

| Skill                           | 触发词                                         | 说明                                     |
| ------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| `a11y-debugging`                | 无障碍、a11y、ARIA、焦点状态、键盘导航、对比度 | 用 Chrome DevTools 做无障碍审计与调试    |
| `algorithmic-art`               | 生成艺术、p5.js、流场、粒子系统                | p5.js 生成艺术与交互参数探索             |
| `animation-vocabulary`          | 动画术语、动效命名、反查词汇、描述模糊         | 把模糊动效描述反查成准确术语             |
| `archify`                       | 架构图、流程图、时序图、数据流、导出           | 生成可交互HTML架构与流程图               |
| `archimate`                     | ArchiMate、企业架构、TOGAF、PlantUML           | 用PlantUML画ArchiMate企业架构            |
| `architecture`                  | 架构图、技术栈、微服务、分层图                 | 用HTML/CSS模板画分层架构图               |
| `bpmn`                          | BPMN、业务流程、审批流、价值流、PlantUML       | 用PlantUML画业务流程与审批流             |
| `brand-guidelines`              | 品牌色、排版、Anthropic、视觉规范              | 应用 Anthropic 官方品牌配色与字体        |
| `brandkit`                      | 品牌套件、logo、身份系统、视觉板               | 生成高端品牌规范与logo系统图             |
| `canvas`                        | 概念图、知识图谱、坐标定位、JSON               | 用JSON坐标画自由布局概念图               |
| `canvas-design`                 | 海报、视觉艺术、设计哲学、PNG/PDF              | 用设计哲学创作海报等静态视觉作品         |
| `chart-designer`                | 图表设计、ECharts、Chart.js、仪表盘            | 设计图表配置与仪表盘报告                 |
| `data-analytics`                | 数据管线、ETL、数据湖、PlantUML                | 用PlantUML画数据管线架构图               |
| `design-taste-frontend`         | 落地页、作品集、重设计、反模板                 | 反模板前端设计并严格预检                 |
| `design-taste-frontend-v1`      | v1兼容、旧版、落地页                           | 保留原v1行为的反模板前端                 |
| `emil-design-eng`               | UI打磨、组件设计、动效决策、细节               | 按Emil Kowalski理念打磨UI细节与动效      |
| `frontend-design`               | 视觉设计、审美方向、排版、新 UI                | 新 UI 或重塑时的视觉设计指导             |
| `frontend-ui-engineering`       | 前端组件、响应式、WCAG、状态管理               | 构建生产级可访问响应式界面与组件         |
| `gpt-taste`                     | GSAP、AIDA、bento、排版                        | 精英UX/UI与GSAP动效工程                  |
| `graphviz`                      | DOT、依赖图、调用图                            | 用DOT画依赖与调用关系图                  |
| `high-end-visual-design`        | 高端、精品、字体、阴影                         | 按高端机构标准设计网页                   |
| `image-to-code`                 | 图片转代码、设计还原                           | 先出设计图再精确实现网页                 |
| `imagegen-frontend-mobile`      | 移动端设计、iOS、Android                       | 生成移动端应用界面概念图                 |
| `imagegen-frontend-web`         | 网页设计、分区出图、转化                       | 按分区生成落地页设计参考图               |
| `industrial-brutalist-ui`       | 工业、机械、瑞士印刷、终端                     | 工业粗野主义机制化界面                   |
| `infocard`                      | 信息卡、HTML/CSS、杂志排版                     | 用HTML/CSS做杂志风信息卡                 |
| `infographic`                   | 信息图、KPI、时间线、SWOT                      | 模板化信息图KPI与时间线                  |
| `iot`                           | IoT、智能家居、边缘计算、传感器                | 画IoT与边缘计算架构图                    |
| `mindmap`                       | 思维导图、头脑风暴、PlantUML                   | 用PlantUML画思维导图                     |
| `minimalist-ui`                 | 极简、编辑风、单色                             | 干净编辑风极简界面                       |
| `motion-spec`                   | 动效、过渡、微交互、丝滑                       | 把模糊动效需求变成可执行规格             |
| `network`                       | 网络拓扑、LAN/WAN、数据中心                    | 画网络拓扑与机房互联图                   |
| `nuxt`                          | Nuxt、SSR、useFetch、中间件                    | Nuxt 全栈开发：路由与服务端渲染          |
| `pinia`                         | Pinia、状态管理、store、actions                | Pinia 状态管理与 store 模式              |
| `redesign-existing-projects`    | 升级现有站点、去AI味                           | 将现有网站升级到高级质量                 |
| `review-animations`             | 动效评审、动画代码、工艺标准                   | 按高工艺标准评审动画与动效代码           |
| `security`                      | 安全架构、IAM、零信任、加密                    | 画安全架构与零信任流程图                 |
| `slack-gif-creator`             | Slack GIF、动图、尺寸校验、动画                | 制作符合 Slack 规格的动态 GIF            |
| `slidev`                        | Slidev、技术演讲、幻灯片、代码高亮             | 用 Slidev 制作开发者技术演示幻灯片       |
| `stitch-design-taste`           | Google Stitch、DESIGN.md                       | 为Google Stitch生成设计规范              |
| `theme-factory`                 | 主题、配色、字体、幻灯片样式                   | 用预设或自建主题为制品统一样式           |
| `transitions-dev`               | CSS 过渡、下拉、模态、页面切换                 | 九种即插即用的生产级 CSS 过渡            |
| `ui`                            | 组件美化、排版、截图反馈、视觉打磨             | 产出有辨识度界面并基于截图做视觉打磨     |
| `uml`                           | UML、类图、时序图                              | 用PlantUML画UML图                        |
| `unocss`                        | UnoCSS、原子 CSS、预设、快捷方式               | UnoCSS 原子化 CSS 配置与使用             |
| `vega`                          | Vega-Lite、图表、统计                          | 用Vega-Lite画数据驱动图表                |
| `vercel-react-view-transitions` | View Transition、页面转场、共享元素、Next.js   | 用React视图转换API实现页面与列表动画过渡 |
| `vite`                          | Vite 配置、插件、SSR、Rolldown                 | Vite 配置、插件、SSR 与迁移              |
| `vitepress`                     | VitePress、文档站点、主题、Markdown            | VitePress 文档站点与主题配置             |
| `vue`                           | Vue SFC、组合式 API、响应式、watcher           | 编写 Vue SFC、脚本宏与内置组件           |
| `vue-best-practices`            | Vue 任务、组合式 API、TypeScript、SSR          | 任何 Vue 任务的强制最佳实践流程          |
| `vue-router-best-practices`     | Vue Router、导航守卫、路由参数、生命周期       | Vue Router 4 模式与常见陷阱              |
| `vueuse-functions`              | VueUse、组合式函数、Vue、Nuxt                  | 用 VueUse 组合式函数实现 Vue/Nuxt 需求   |
| `web-artifacts-builder`         | HTML 制品、React、Tailwind、shadcn/ui          | 构建多组件 claude.ai HTML 制品           |
| `web-design-guidelines`         | UI 审查、可访问性、设计审计、UX                | 按 Web 界面指南审查 UI 代码合规性        |

---

## 工程与Git

| Skill                            | 触发词                                                 | 说明                                        |
| -------------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| `antfu`                          | Anthony Fu、工具约定、ESLint、monorepo                 | Anthony Fu 的 JS/TS 工具与代码约定          |
| `api-and-interface-design`       | API设计、模块边界、REST、GraphQL、类型契约、前后端边界 | 指导稳定的API、模块边界与前后端接口契约设计 |
| `archify-review`                 | issue审查、PR审查、代码评估、价值成本                  | 从价值成本影响评估issue与PR                 |
| `ci-cd-and-automation`           | CI/CD、流水线、质量门禁、部署策略                      | 搭建CI/CD流水线与质量门禁                   |
| `ci-fix`                         | CI失败、GitHub Actions、红灯、修复                     | 诊断并修复GitHub Actions失败                |
| `code-simplification`            | 简化代码、重构、可读性                                 | 在不改行为前提下简化代码                    |
| `codebase-design`                | 深模块、模块接口、接缝、可测试                         | 用深模块词汇设计模块接口与可测试边界        |
| `create-pull-request`            | 创建PR、提交审查、gh CLI                               | 按项目约定创建GitHub PR                     |
| `deploy-to-vercel`               | 部署Vercel、预览部署                                   | 部署应用到Vercel并给链接                    |
| `deprecation-and-migration`      | 弃用、迁移、数据库变更、下线                           | 管理旧系统弃用、迁移与在线schema变更        |
| `finishing-a-development-branch` | 实现完成、测试通过、合并分支、集成工作                 | 实现完成且测试通过后决定如何合并分支        |
| `git-guardrails-claude-code`     | git钩子、危险命令、拦截、push保护                      | 用Claude Code钩子拦截危险git命令            |
| `git-workflow-and-versioning`    | 提交、分支、PR、语义化版本、变更日志                   | 规范提交分支、PR、版本与变更日志            |
| `github-bug-report-triage`       | bug报告、可操作性、缺信息                              | 评估bug报告可操作性                         |
| `github-issue-dedupe`            | 重复issue、语义搜索                                    | 检测重复的GitHub issue                      |
| `improve-codebase-architecture`  | 架构改进、深化机会、HTML报告                           | 扫描代码库找出架构深化机会并生成报告        |
| `incremental-implementation`     | 增量交付、小步验证、特性开关                           | 把改动拆成薄的、可验证的增量切片交付        |
| `mcp-builder`                    | MCP 服务器、FastMCP、工具设计、外部 API                | 构建高质量 MCP 服务器与工具                 |
| `migrate-to-shoehorn`            | shoehorn、类型断言、测试数据、迁移                     | 把测试中的as类型断言迁移到shoehorn          |
| `performance-optimization`       | 性能优化、核心网页指标、N+1、剖析                      | 从前端到数据库定位并优化性能瓶颈            |
| `pnpm`                           | pnpm、工作区、catalogs、patches                        | pnpm 命令与工作区依赖管理                   |
| `receiving-code-review`          | 评审反馈、技术严谨、核实、不盲从                       | 收到评审意见时先核实再实施、不盲从          |
| `requesting-code-review`         | 完成任务、重大功能、合并前、核对需求                   | 完成任务或合并前请求评审以核对需求          |
| `resolving-merge-conflicts`      | 合并冲突、rebase、冲突解决                             | 解决进行中的git合并或rebase冲突             |
| `setup-matt-pocock-skills`       | 仓库配置、issue跟踪器、标签、文档布局                  | 为仓库配置issue跟踪器、标签与文档布局       |
| `setup-pre-commit`               | Husky、lint-staged、预提交、类型检查                   | 为仓库配置Husky预提交钩子与检查             |
| `shipping-and-launch`            | 上线、发布检查、监控、回滚                             | 准备生产发布:清单、监控、灰度与回滚         |
| `triage`                         | issue分诊、外部PR、状态机、简报                        | 按状态机分诊issue与外部PR并产出简报         |
| `tsdown`                         | tsdown、库打包、类型声明、tsup 迁移                    | 打包 TS/JS 库并生成类型声明                 |
| `turborepo`                      | Turborepo、monorepo、任务流水线、缓存                  | Turborepo 单体仓库任务编排与缓存            |
| `using-git-worktrees`            | 功能隔离、独立工作区、执行计划前、worktree             | 需要与当前工作区隔离时建立独立工作区        |
| `vercel-cli-with-tokens`         | Vercel令牌、环境变量                                   | 用令牌认证操作Vercel CLI                    |
| `vercel-composition-patterns`    | React组合、复合组件                                    | React组合模式与组件架构                     |
| `vercel-optimize`                | Vercel成本、性能、缓存                                 | 优化Vercel成本与性能                        |
| `vercel-react-best-practices`    | React、Next.js、性能                                   | React/Next.js性能优化规范                   |
| `vercel-react-native-skills`     | React Native、Expo、列表                               | React Native/Expo最佳实践                   |

---

## 测试与质量

| Skill                            | 触发词                                       | 说明                                     |
| -------------------------------- | -------------------------------------------- | ---------------------------------------- |
| `api-contract-verification`      | API 集成、ctt-server、ofetch、Zod            | ctt-web 与 ctt-server 接口契约验证       |
| `check`                          | 代码评审、发布就绪、PR分诊、评分卡           | 评审diff与PR、发布就绪度及发布后跟进     |
| `code-review`                    | 代码评审、规范、规格、并行子代理             | 对照规范与规格双轴评审分支或PR改动       |
| `code-review-and-quality`        | 代码评审、多维度质量、合并前                 | 在合并前从多维度评审代码质量             |
| `debugging-and-error-recovery`   | 根因调试、测试失败、构建失败、回归           | 系统化定位根因并修复失败与异常           |
| `diagnosing-bugs`                | 疑难缺陷、性能回归、诊断循环、根因           | 对疑难缺陷与性能回归做诊断循环定位根因   |
| `hunt`                           | 报错、崩溃、回归、根因                       | 在修复前先定位报错崩溃或回归的根因       |
| `memory-leak-debugging`          | 内存泄漏、堆快照、OOM、DevTools              | 诊断并修复JS/Node内存泄漏与堆快照        |
| `qa`                             | QA测试、评分、本地站点                       | 用云浏览器QA站点并给1-5分                |
| `systematic-debugging`           | bug、测试失败、异常行为、提出修复前          | 遇 bug/测试失败/异常行为时先系统排查     |
| `tdd`                            | TDD、红绿重构、先写测试、集成测试            | 以测试先行方式开发功能或修复缺陷         |
| `terraform-style-check`          | Terraform、HCL、风格                         | 按HashiCorp风格生成Terraform             |
| `test-auth-bootstrap`            | 获取token、绕过登录、集成测试鉴权、注册验证  | 开发/测试环境自动获取鉴权凭证以便 E2E    |
| `test-driven-development`        | 实现功能、修复 bug、写实现前                 | 写实现代码前先写测试                     |
| `verification-before-completion` | 宣称完成、宣称修复、提交前、创建PR、验证输出 | 宣称完成/修复/通过前必须跑验证并确认输出 |
| `vitest`                         | Vitest、单元测试、mock、覆盖率               | Vitest 单元测试与覆盖率配置              |
| `vue-testing-best-practices`     | Vue 测试、Vitest、组件测试、E2E              | Vue 组件测试与 E2E 最佳实践              |
| `web-accessibility-audit`        | WCAG、可访问性、违规                         | 审计WCAG可访问性并给整改                 |
| `web-performance-audit`          | 性能审计、Lighthouse                         | 用DevTools审计页面性能                   |
| `webapp-testing`                 | Playwright、本地 Web 测试、截图、浏览器日志  | 用 Playwright 测试本地 Web 应用          |

---

## 安全与审查

| Skill                                      | 触发词                                   | 说明                                   |
| ------------------------------------------ | ---------------------------------------- | -------------------------------------- |
| `reverse-engineering`                      | 逆向、macOS私有API、Mach-O、Ghidra、LLDB | 逆向 macOS 私有 API/二进制并定位函数   |
| `security-and-hardening`                   | 漏洞、OWASP、输入校验、依赖审计、供应链  | 加固代码抵御漏洞并审计依赖与供应链风险 |
| `software-engineering-laws-and-philosophy` | 工程定律、架构决策、技术债               | 用56条工程定律指导技术决策             |

---

## 文档与写作

| Skill                      | 触发词                                      | 说明                                  |
| -------------------------- | ------------------------------------------- | ------------------------------------- |
| `diagram-design`           | 架构图、流程图、时序图、UML、数据流         | 生成架构、流程、时序、ER等品牌化图表  |
| `doc-coauthoring`          | 写文档、提案、技术规格、决策文档            | 结构化文档共创工作流（三阶段）        |
| `docs-update`              | 更新文档、代码变更、文档任务                | 代码变更时更新用户文档                |
| `documentation-and-adrs`   | ADR、架构决策、API变更、文档                | 记录架构决策、公共API变更与项目文档   |
| `docx`                     | Word、.docx、模板、修订批注                 | Word 文档的创建、读取与编辑           |
| `infographics`             | 信息图、AI生成、可视化、调色板              | 用AI生成并迭代优化专业信息图          |
| `internal-comms`           | 内部通信、3P 更新、周报、事故报告           | 按公司模板撰写各类内部沟通文稿        |
| `kami`                     | 做PDF、排版、简历、一页纸、PPT              | 用Kami模板排版简历、白皮书与幻灯片    |
| `liteparse`                | PDF解析、DOCX、OCR、版面还原、RAG           | 本地解析文档PDF并输出带坐标版面文本   |
| `markdown-mermaid-writing` | Markdown、Mermaid、图表、文档模板、风格指南 | 按风格指南写Markdown与Mermaid技术文档 |
| `markitdown`               | 文档转Markdown、批量转换、RAG、OCR          | 用MarkItDown把多种文档转换为Markdown  |
| `pdf`                      | PDF、合并拆分、表单填写、OCR                | PDF 处理：提取、合并、表单与 OCR      |
| `pptx`                     | PPT、.pptx、幻灯片、演讲备注                | PowerPoint 演示文稿创建与编辑         |
| `read`                     | 抓取网页、读取PDF、引用、转Markdown         | 抓取URL与PDF并摘要或转成干净Markdown  |
| `show-me`                  | 图解、代码草图、HTML                        | 用图解与HTML制品讲清主题              |
| `visualize`                | 配图、示意图、几何图、依赖图                | 为课程配一张正确的最小图示并内联渲染  |
| `write`                    | 改稿、润色、去AI味、本地化、文案            | 重写润色中英文文案与文稿并去除AI腔    |
| `writing-beats`            | 写作、节拍、叙事、术语铺垫                  | 把素材编排成有节奏文章并先定义术语    |
| `writing-fragments`        | 写作、素材挖掘、片段、无结构                | 挖掘原始素材片段、暂不组织结构        |
| `writing-guidelines`       | 文档审查、写作风格                          | 按写作指南审查文档与文风              |
| `writing-shape`            | 写作、成文、段落组织                        | 把素材逐段塑形成一篇文章              |
| `xlsx`                     | 电子表格、xlsx、公式、图表、数据清洗        | 电子表格创建、编辑与数据清洗          |

---

## 浏览器与自动化

| Skill                           | 触发词                                                     | 说明                                        |
| ------------------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| `ai-chat-browser`               | Gemini、Perplexity、AI对话、浏览器自动化                   | 浏览器自动化与 Gemini/Perplexity 交互取回复 |
| `browser-harness`               | 真实浏览器、CDP、登录态、反爬页面                          | 通过CDP控制真实浏览器完成点击输入与访问     |
| `browser-testing-with-devtools` | 浏览器测试、DOM、控制台、网络、性能                        | 用DevTools MCP在真实浏览器中测试与调试      |
| `browser-use`                   | 浏览器控制、CDP、自动化、抓取、截图                        | 通过CDP直接控制浏览器做自动化与测试         |
| `chrome-devtools`               | 调试网页、性能分析、网络请求、MCP                          | 用DevTools MCP调试与自动化浏览器            |
| `chrome-devtools-cli`           | 浏览器自动化、Chrome DevTools、命令行、shell脚本、脚本任务 | 用CLI或脚本驱动Chrome DevTools自动化浏览器  |
| `cloud`                         | Browser Use Cloud、REST API、SDK、会话                     | Browser Use Cloud API与SDK文档              |
| `debug-optimize-lcp`            | LCP、页面加载、CWV、性能                                   | 用DevTools调试优化LCP                       |
| `doko-search`                   | 网页搜索、免费搜索、搜索引擎、无API搜索                    | 借真实 Chrome 读搜索结果页、免密钥无配额    |
| `doko-summarize`                | 总结网页、提炼要点、网页摘要、文章总结                     | 用真实 Chrome 读取网页并按需输出结构化摘要  |
| `doko-translate`                | 翻译网页、网页翻译、保留格式、逐节翻译                     | 用真实 Chrome 读网页并保留结构逐节翻译      |
| `dokobot`                       | 读取网页、动态页面、JS渲染、抓正文                         | 用真实 Chrome 读取含 JS 渲染的动态页面内容  |
| `open-source`                   | browser-use、Python、Agent                                 | browser-use开源库Python代码指南             |
| `opencli-browser`               | Chrome、填表、已登录流程                                   | 用opencli驱动真实Chrome操作                 |
| `opencli-browser-sitemap`       | sitemap、站点导航、状态签名                                | 用站点sitemap避免盲导航                     |
| `remote-browser`                | 云端浏览器、沙箱、CLI                                      | 从沙箱控制云端浏览器                        |
| `transient-ui-capture`          | 短暂 UI、Toast、截图、链式命令                             | 用 browser-use 链式命令抓拍瞬时 UI          |
| `troubleshooting`               | 连接失败、页面枚举                                         | 用DevTools排查MCP连接问题                   |
| `x402`                          | 加密支付、USDC、Browser Use                                | 用x402钱包按次支付云浏览器                  |

---

## 研究与分析

| Skill                          | 触发词                                       | 说明                                       |
| ------------------------------ | -------------------------------------------- | ------------------------------------------ |
| `analysis-artifacts`           | BigQuery、数据分析、SQL、可视化、深度分析    | 生成可复现的SQL与可视化分析制品            |
| `database-lookup`              | 数据库API、端点查询、分页、来源溯源          | 从具名公共数据库API可复现检索事实数据      |
| `dbt-model-index`              | dbt、BigQuery、数据仓库、查表                | dbt模型查找索引辅助写查询                  |
| `dhdna-profiler`               | 思维风格、认知画像、写作分析、文本解析       | 从文本提取认知模式与思维指纹做画像         |
| `doko-research`                | 深度研究、多轮检索、资料交叉核对、带引用报告 | 多轮网页检索并交叉核对、产出带引用研究报告 |
| `exa-search`                   | 网络搜索、URL提取、学术过滤、Exa             | 用Exa做网络搜索与URL内容提取               |
| `experimental-design`          | 实验设计、随机化、区组、因子设计、DOE        | 收集数据前设计实验:随机化、区组与因子      |
| `exploratory-data-analysis`    | 探索性分析、缺失值、离群点、数据画像         | 对支持的科研文件做有界本地探索性分析       |
| `hypothesis-generation`        | 科学假设、竞争解释、预测、预注册             | 把观察转成可检验科学假设与预注册计划       |
| `learn`                        | 深入学习、六阶段、材料汇编、长文             | 用六阶段研究流程把材料汇编成可发布长文     |
| `market-research-reports`      | 市场研究、市场规模、竞争格局、TAM、预测      | 产出可溯源的市场研究报告与规模预测         |
| `open-notebook`                | 研究笔记本、资料摄取、播客生成、文档问答     | 自建研究库:摄取资料、生成笔记与播客并问答  |
| `parallel-web`                 | 网络搜索、深度研究、实体查询、监控           | 用Parallel CLI做网络检索与深度研究         |
| `research`                     | 调研、一手来源、Markdown报告、后台代理       | 用后台代理调研问题并把结论写成仓库内文档   |
| `research-lookup`              | 文献取证、背景证据、Parallel、来源核验       | 为科研稿件检索当前学术证据并核验来源       |
| `scientific-brainstorming`     | 科研头脑风暴、假设生成、对抗评审、决策记录   | 用结构化讨论与对抗评审做循证科研选题       |
| `scientific-critical-thinking` | 证据评估、偏倚、混杂、GRADE、研究设计        | 评估科学主张与证据质量、识别偏倚与设计缺陷 |
| `seo-aeo-audit`                | SEO、AEO、结构化数据                         | 优化搜索排名与AI引用                       |
| `slack-qa-investigate`         | 只读调查、仓库问答                           | 只读模式调查仓库问题                       |
| `smart-search`                 | OpenCLI搜索、指定网站                        | 基于opencli的智能搜索路由                  |
| `statistical-analysis`         | 假设检验、方差分析、效应量、贝叶斯、APA报告  | 指导研究数据的检验选择、假设检查与结果报告 |
| `statistical-power`            | 样本量、功效分析、最小可检测效应、预注册     | 为研究规划计算所需样本量与统计功效         |

---

## CLI工具集

> 完整目录请参阅 `cli-hub-meta-skill`。

| Skill                            | 触发词                                           | 说明                                        |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------- |
| `cli-anything`                   | CLI-Anything、harness、GUI                       | 构建校验CLI-Anything harness                |
| `cli-anything-adguardhome`       | AdGuard Home、DNS、广告过滤、客户端              | CLI 管理 AdGuard Home 过滤与DNS             |
| `cli-anything-anygen`            | AnyGen、幻灯片、文档生成                         | CLI 用 AnyGen 生成幻灯片与文档              |
| `cli-anything-audacity`          | 音频编辑、Audacity、命令行                       | 有状态CLI编辑音频（Audacity）               |
| `cli-anything-blender`           | 3D场景、Blender、建模                            | 有状态CLI编辑Blender 3D场景                 |
| `cli-anything-browser`           | 浏览器自动化、DOMShell、无障碍树                 | 用无障碍树映射做浏览器自动化CLI             |
| `cli-anything-calibre`           | 电子书、元数据、格式转换                         | CLI 管理Calibre电子书与转换                 |
| `cli-anything-ccswitch`          | AI工具配置、CC Switch、切换                      | CLI 管理AI编码工具配置切换                  |
| `cli-anything-chromadb`          | 向量库、ChromaDB、语义搜索                       | CLI 管理ChromaDB向量库与检索                |
| `cli-anything-cloudanalyzer`     | 点云评估、轨迹、质量门禁                         | CLI 做点云与轨迹质量评估                    |
| `cli-anything-cloudcompare`      | 点云、网格、距离计算、配准                       | CLI 处理点云网格与距离配准                  |
| `cli-anything-comfyui`           | ComfyUI、图像生成、工作流队列                    | CLI 排队ComfyUI图像生成工作流               |
| `cli-anything-dify-workflow`     | Dify、工作流DSL、校验导出                        | CLI 创建校验导出Dify工作流                  |
| `cli-anything-drawio`            | Draw.io、图表、导出                              | CLI 创建编辑导出Draw.io图表                 |
| `cli-anything-eez-studio`        | EEZ Studio、LVGL、SCPI                           | CLI 编辑EEZ Studio与LVGL界面                |
| `cli-anything-eth2-quickstart`   | 以太坊节点、共识客户端、部署                     | 部署加固以太坊节点并查健康                  |
| `cli-anything-exa`               | Exa、网页搜索、内容获取                          | 用Exa做网页搜索与内容检索                   |
| `cli-anything-firefly-iii`       | 个人财务、Firefly III、记账                      | CLI 管理Firefly III个人财务                 |
| `cli-anything-freecad`           | FreeCAD、参数化CAD、草图、导出                   | CLI 驱动FreeCAD参数化建模导出               |
| `cli-anything-gimp`              | GIMP、图像编辑、图层                             | 有状态CLI编辑图像（GIMP）                   |
| `cli-anything-godot`             | Godot、游戏引擎、场景导出                        | CLI 管理Godot项目场景与导出                 |
| `cli-anything-hermes`            | Hermes、自动化、CLI-Anything                     | 用Hermes构建校验CLI-Anything                |
| `cli-anything-inkscape`          | Inkscape、矢量图、SVG                            | 有状态CLI编辑矢量图（Inkscape）             |
| `cli-anything-intelwatch`        | 竞争情报、尽调、OSINT                            | CLI 做竞争情报与OSINT尽调                   |
| `cli-anything-iterm2`            | iTerm2、终端会话、tmux                           | CLI 控制iTerm2会话与分屏                    |
| `cli-anything-iterm2-ctl`        | iTerm2、终端会话、tmux                           | CLI 控制iTerm2会话与分屏                    |
| `cli-anything-joplin`            | Joplin、笔记、终端后端                           | CLI 用Joplin终端后端管理笔记                |
| `cli-anything-jumpserver`        | 堡垒机、JumpServer、资产权限                     | CLI 管理JumpServer资产与权限                |
| `cli-anything-kdenlive`          | 视频编辑、Kdenlive、MLT                          | 有状态CLI编辑视频（Kdenlive）               |
| `cli-anything-krita`             | Krita、绘画、图层、导出                          | 自动化Krita绘画图层与导出                   |
| `cli-anything-libreoffice`       | 文档编辑、ODF、LibreOffice                       | 有状态CLI生成编辑ODF文档                    |
| `cli-anything-live2d`            | Live2D、模型、校验、部署                         | CLI 检查校验部署Live2D模型                  |
| `cli-anything-lldb`              | LLDB、调试、Python API                           | CLI 通过LLDB Python API调试                 |
| `cli-anything-macrocli`          | GUI宏、宏执行、参数化                            | 定义并执行参数化GUI宏                       |
| `cli-anything-mailchimp`         | Mailchimp、营销、邮件                            | CLI 管理Mailchimp营销资源                   |
| `cli-anything-mermaid`           | Mermaid、图表、渲染                              | CLI 创建编辑渲染Mermaid图表                 |
| `cli-anything-minimax`           | MiniMax、对话、TTS、命令行                       | 用CLI调用MiniMax对话与语音合成API           |
| `cli-anything-mubu`              | Mubu、大纲、笔记桥                               | CLI 连接Mubu大纲笔记                        |
| `cli-anything-musescore`         | 乐谱、移调、导出、分谱                           | CLI 处理乐谱移调导出与分谱                  |
| `cli-anything-n8n`               | n8n、工作流、执行、凭据                          | CLI 管理n8n工作流与执行                     |
| `cli-anything-notebooklm`        | NotebookLM、笔记本、来源                         | CLI 管理NotebookLM笔记本与产物              |
| `cli-anything-novita`            | Novita、DeepSeek、GLM、API                       | CLI 调用Novita兼容OpenAI接口                |
| `cli-anything-nsight-graphics`   | Nsight、GPU捕获、图形调试                        | CLI 捕获分析Nsight GPU跟踪                  |
| `cli-anything-nslogger`          | NSLogger、日志解析、导出                         | CLI 解析过滤导出NSLogger日志                |
| `cli-anything-obs-studio`        | OBS、场景集合、直播                              | 有状态CLI编辑OBS场景集合                    |
| `cli-anything-obsidian`          | Obsidian、笔记库、搜索、命令                     | CLI 管理Obsidian笔记库与搜索                |
| `cli-anything-ollama`            | Ollama、本地模型、推理、嵌入                     | CLI 管理Ollama本地模型与推理                |
| `cli-anything-openrefine`        | OpenRefine、数据清洗、操作历史、导入导出、行检查 | 用CLI导入脏数据、复用操作历史并导出清洗结果 |
| `cli-anything-openscreen`        | 录屏、剪辑、缩放、导出                           | CLI 剪辑录屏与导出成片                      |
| `cli-anything-pm2`               | PM2、进程管理、Node.js、日志                     | CLI 管理PM2进程与日志                       |
| `cli-anything-qgis`              | QGIS、图层、要素、导出                           | CLI 操作QGIS项目图层与导出                  |
| `cli-anything-quietshrink`       | 录屏压缩、HEVC、macOS                            | 硬件HEVC压缩macOS录屏                       |
| `cli-anything-rekordbox`         | Rekordbox、DJ、播放列表、MIDI                    | CLI 管理DJ库并控制实时混音                  |
| `cli-anything-renderdoc`         | RenderDoc、图形调试、捕获                        | CLI 分析RenderDoc捕获帧                     |
| `cli-anything-rms`               | Teltonika、RMS、设备监控                         | CLI 管理Teltonika RMS设备                   |
| `cli-anything-safari`            | Safari、自动化、macOS、MCP                       | CLI 通过safari-mcp自动化Safari              |
| `cli-anything-sbox`              | s&box、游戏引擎、项目、C#                        | CLI 管理s&box引擎项目与场景                 |
| `cli-anything-seaclip`           | SeaClip、项目管理、流水线                        | CLI 管理SeaClip看板与流水线                 |
| `cli-anything-shotcut`           | Shotcut、视频编辑、MLT XML                       | 有状态CLI编辑视频（Shotcut）                |
| `cli-anything-siyuan`            | 思源笔记、文档、块、搜索                         | CLI 管理思源笔记文档与块                    |
| `cli-anything-slay-the-spire-ii` | 游戏、杀戮尖塔、状态、操作                       | CLI 读取游戏状态并发送操作                  |
| `cli-anything-threemf`           | 3MF、网格、修复、3D打印                          | CLI 编辑修复3MF打印网格                     |
| `cli-anything-tigris`            | Tigris、对象存储、桶、预签名                     | CLI 管理Tigris对象存储与密钥                |
| `cli-anything-unimol-tools`      | Uni-Mol、分子性质、训练推理                      | CLI 跑Uni-Mol分子性质预测                   |
| `cli-anything-unrealinsights`    | Unreal、跟踪、性能分析                           | CLI 捕获分析Unreal Insights跟踪             |
| `cli-anything-videocaptioner`    | 视频字幕、转录、翻译、烧录                       | CLI 转录翻译并烧录视频字幕                  |
| `cli-anything-wavetone`          | WaveTone、JSON清单、Windows                      | CLI 用JSON清单驱动WaveTone                  |
| `cli-anything-web-yu-pri`        | 日本邮政、浏览器、表单                           | CLI 驱动浏览器填日本邮政单                  |
| `cli-anything-wiremock`          | WireMock、Mock服务、HTTP                         | CLI 管理WireMock模拟服务                    |
| `cli-anything-zoom`              | Zoom、会议、录制                                 | CLI 管理Zoom会议与录制                      |
| `cli-anything-zotero`            | Zotero、文献、引用                               | CLI 管理Zotero文献库                        |
| `cli-hub-meta-skill`             | CLI目录、工具发现、目录检索                      | 发现agent原生CLI工具目录                    |
| `opencli-adapter-author`         | OpenCLI适配器、新站点                            | 为新站点编写OpenCLI适配器                   |
| `opencli-autofix`                | 适配器修复、失败、trace                          | 自动修复失败的OpenCLI适配器                 |
| `opencli-sitemap-author`         | sitemap、站点知识、维护                          | 创建维护OpenCLI站点sitemap                  |
| `opencli-usage`                  | OpenCLI、适配器、命令发现、输出格式              | OpenCLI入门:能做什么与如何找命令            |

---

## 学术与出版

| Skill                        | 触发词                                       | 说明                                       |
| ---------------------------- | -------------------------------------------- | ------------------------------------------ |
| `bgpt-paper-search`          | 论文检索、实验数据、BGPT、全文提取           | 用BGPT检索论文并提取全文实验数据           |
| `citation-management`        | 引用管理、OpenAlex、PubMed、BibTeX、DOI      | 检索论文校验元数据并生成规范BibTeX引用     |
| `literature-review`          | 系统综述、文献检索、PubMed、元分析、引用     | 跨库开展系统综述并输出带引用的成稿         |
| `nature-academic-search`     | 文献检索、引文核对、MeSH、引用影响           | 多源检索文献、核对引文并构建MeSH策略       |
| `nature-citation`            | Nature引用、CNS文献、claim映射、导出         | 查找与核验支撑稿件论断的CNS系文献          |
| `nature-downloader`          | 全文下载、CNKI、OA、机构访问                 | 合法获取学术全文:OA、出版商API与机构访问   |
| `nature-literature-pipeline` | 文献发现、六维评分、推送、定时任务           | 自动多源文献发现打分精读与格式化推送归档   |
| `nature-reader`              | 全文翻译、中英对照、论文精读、溯源           | 生成图文表公式对齐的中英对照论文精读稿     |
| `nature-reviewer`            | 模拟审稿、投稿前自审、审稿视角               | 对稿件做循证的模拟同行评审与问题分级       |
| `paper-lookup`               | 论文检索、DOI、PMID、arXiv、开放获取、引用图 | 检索18个学术API获取论文、引用与开放全文    |
| `paperzilla`                 | Paperzilla、论文推荐、项目、摘要、Atom订阅   | 通过Paperzilla查项目推荐、论文详情与订阅源 |
| `peer-review`                | 同行评审、稿件评估、报告规范、方法审查       | 起草循证建设性的同行评审意见与稿件评估     |
| `pyzotero`                   | Zotero、文献管理、引用导出、附件、自动化     | 用pyzotero读写Zotero文献库并自动化引用管理 |
| `scholar-evaluation`         | 学术评价、发展性评审、评分表、低风险         | 对学术作品做定性可溯源的评审与发展反馈     |
| `venue-templates`            | 期刊模板、会议论文、LaTeX、投稿规范、匿名    | 按期刊会议要求准备稿件模板与格式           |

---

## GStack

> GStack 是一套集成的开发工具套件，平铺于 `~/.config/opencode/skills/`（54 个 `gstack-*` 目录 + 路由本体 `gstack`）。

| Skill                          | 触发词                                         | 说明                                           |
| ------------------------------ | ---------------------------------------------- | ---------------------------------------------- |
| `gstack`                       | gstack、哪个技能、技能路由、套件入口           | gstack 套件路由：把请求分派到对应技能          |
| `gstack-autoplan`              | 自动评审、autoplan、跑全部评审、替我决定       | 自动串行跑四类评审并在末尾汇总决策             |
| `gstack-benchmark`             | 性能、基准测试、页面速度、lighthouse           | 建立页面加载/CWV/体积基线并检测回归            |
| `gstack-benchmark-models`      | 模型对比、跨模型基准、模型横评、哪个模型好     | 同提示跨多模型比对延迟、成本与质量             |
| `gstack-browse`                | 打开浏览器、看这个页面、截图、走查流程         | 用真实浏览器开页、点击、截图、查报错           |
| `gstack-canary`                | 部署监控、金丝雀、部署后检查、盯线上           | 部署后金丝雀监控：截图对比并异常告警           |
| `gstack-careful`               | 谨慎模式、安全模式、生产模式、危险命令         | 危险命令（rm -rf、强推等）执行前告警           |
| `gstack-claude-code`           | claude评审、问claude、claude挑战、第二意见     | 在非 Claude 宿主调用 Claude 做第二意见         |
| `gstack-codex`                 | codex评审、codex挑战、问codex、第二意见        | 封装 Codex CLI 做独立评审与对抗挑战            |
| `gstack-context-restore`       | 恢复上下文、继续工作、我之前在哪、接续         | 恢复此前保存的工作上下文继续推进               |
| `gstack-context-save`          | 保存进度、保存状态、保存工作、存档             | 保存 git 状态、决策与剩余工作以便续接          |
| `gstack-cso`                   | 安全审计、威胁建模、OWASP、漏洞复查            | 安全审计：静态发现、合规配置下给复现与修复候选 |
| `gstack-design-consultation`   | 设计系统、品牌规范、建立DESIGN.md              | 产出完整设计系统并写入 DESIGN.md               |
| `gstack-design-html`           | 定稿设计、转HTML、写页面、实现设计             | 把已定设计转成生产级原生 HTML/CSS              |
| `gstack-design-review`         | 设计审计、视觉QA、好看吗、设计打磨             | 设计师视角 QA：找视觉与层次问题并修复          |
| `gstack-design-shotgun`        | 探索设计、看方案、设计变体、视觉头脑风暴       | 生成多个设计变体、比对板与结构化反馈迭代       |
| `gstack-devex-review`          | 测试DX、DX审计、上手体验、开发者体验           | 在浏览器实测开发者体验并出 DX 评分卡           |
| `gstack-diagram`               | 画图、架构图、流程图、可视化流程               | 由描述或 mermaid 生成图源与渲染图              |
| `gstack-document-generate`     | 写文档、生成文档、写教程、说明模块             | 按 Diataxis 从零生成缺失的文档                 |
| `gstack-document-release`      | 更新文档、同步文档、发布后文档                 | 发布后同步各类项目文档与变更日志               |
| `gstack-freeze`                | 冻结、限制编辑、只改这个目录、锁定编辑         | 本会话内把文件编辑限制在指定目录               |
| `gstack-guard`                 | 守护模式、全面安全、锁定、最高安全             | 全安全模式：危险命令告警 + 限定编辑目录        |
| `gstack-health`                | 健康检查、代码质量、质量分、跑全部检查         | 汇总类型检查/测试/死代码算加权质量分           |
| `gstack-investigate`           | 调试、修bug、为什么坏了、根因分析              | 四阶段系统化调试、无根因不下修复               |
| `gstack-ios-clean`             | 清理iOS调试桥、移除DebugBridge、剥离插桩       | 移除 iOS DebugBridge 调试插桩与接线            |
| `gstack-ios-design-review`     | iOS设计审查、iPhone视觉审查、界面打分          | 真机 iOS 视觉设计审查并按 HIG 逐项打分         |
| `gstack-ios-fix`               | 修iOS bug、打补丁、自动修复iOS、回归验证       | 自动修复 iOS bug 并在真机重编译验证            |
| `gstack-ios-qa`                | iOS测试、真机测试、iPhone找bug、iOS QA         | 真机 iOS QA：截图→分析→操作→验证循环           |
| `gstack-ios-sync`              | 重生成iOS桥、更新accessor、iOS调试桥           | 按最新模板重生成 iOS 调试桥与访问器            |
| `gstack-land-and-deploy`       | 合并、落地、部署、合并并验证                   | 合并 PR、等 CI 与部署并用金丝雀验证线上        |
| `gstack-landing-report`        | 落地报告、排队情况、查看PR、VERSION占用        | 只读展示版本号占用与待合并队列快照             |
| `gstack-learn`                 | 项目经验、查看学习、清理经验、导出经验         | 管理跨会话项目学习记录：查看、清理、导出       |
| `gstack-make-pdf`              | 生成PDF、导出PDF、markdown转PDF、做PDF         | 把 markdown 转成出版级 PDF 文档                |
| `gstack-office-hours`          | 头脑风暴、有个想法、值不值得做、office hours   | YC 六问检验想法并留存设计文档                  |
| `gstack-open-gstack-browser`   | 打开浏览器、启动浏览器、连接chrome、控制浏览器 | 启动带侧边栏的 AI 可控 Chromium 浏览器         |
| `gstack-pair-agent`            | 配对agent、连接agent、共享浏览器、远程浏览器   | 让远程 agent 通过配对密钥接入你的浏览器        |
| `gstack-plan-ceo-review`       | 想大一点、扩范围、战略评审、重新思考           | CEO 视角计划评审、质疑前提并调整范围           |
| `gstack-plan-design-review`    | 设计计划评审、设计评审、设计批判               | 设计视角计划评审、逐维度打分并改进计划         |
| `gstack-plan-devex-review`     | DX评审、开发者体验、API设计评审、上手体验      | 开发者体验计划评审：画像、对标、摩擦点         |
| `gstack-plan-eng-review`       | 架构评审、工程评审、锁定计划、技术评审         | 工程管理视角计划评审：架构、数据流、测试覆盖   |
| `gstack-plan-tune`             | 调问题、少问点、开发者画像、关闭提问           | 自调提问敏感度与开发者画像（观测式）           |
| `gstack-qa`                    | QA测试、找bug、测试站点、测试并修复            | 系统化 QA 并自动修复发现的 bug                 |
| `gstack-qa-only`               | 只报告bug、仅QA报告、测试不修复                | 仅报告型 QA：出报告与健康分但不改代码          |
| `gstack-retro`                 | 周度回顾、工程复盘、团队贡献、趋势跟踪         | 基于提交历史的周度工程复盘与趋势跟踪           |
| `gstack-review`                | 评审PR、代码审查、上线前审查、检查diff         | 合并前审查 diff 查 SQL 安全与信任边界          |
| `gstack-scrape`                | 抓取数据、提取页面、拉数据、读取网页           | 通过真实已登录浏览器只读抓取页面数据           |
| `gstack-setup-browser-cookies` | 导入cookies、登录站点、浏览器鉴权、认证        | 导入本机浏览器 cookies 以测试登录页            |
| `gstack-setup-deploy`          | 配置部署、部署平台、健康检查、部署状态         | 检测部署平台并写入配置供自动部署用             |
| `gstack-setup-gbrain`          | 配置gbrain、安装gbrain、连接gbrain、启动gbrain | 安装配置 gbrain 并注册 MCP 与信任策略          |
| `gstack-ship`                  | 发布、部署、推main、建PR、合并推送             | 跑测试、改版本号、提交推送并建 PR 的发布流     |
| `gstack-skillify`              | 固化抓取、保存脚本、skillify、永久化           | 把最近成功的 /scrape 流程固化为常驻脚本        |
| `gstack-spec`                  | 写规格、建issue、提工单、转待办项              | 五阶段把模糊意图转为可执行规格并提 issue       |
| `gstack-sync-gbrain`           | 同步gbrain、刷新索引、重建索引、gbrain搜不到   | 让 gbrain 跟上仓库代码并刷新检索指引           |
| `gstack-unfreeze`              | 解除冻结、解锁编辑、移除冻结、允许所有编辑     | 解除 /freeze 设置的编辑目录限制                |
| `gstack-upgrade`               | 升级gstack、更新gstack、获取最新版本、更新工具 | 升级 gstack 到最新版并显示更新内容             |

---

## 生物与化学

| Skill                       | 触发词                                            | 说明                                        |
| --------------------------- | ------------------------------------------------- | ------------------------------------------- |
| `adaptyv`                   | 蛋白实验、结合测定、BLI/SPR、热稳定性、提交       | 经Adaptyv API提交蛋白实验并取回结果         |
| `benchling-integration`     | Benchling、SDK、ELN、库存、数据仓库               | 用Benchling SDK自动化实验室注册与ELN数据    |
| `bids`                      | BIDS、神经影像、数据集组织、DICOM转换、校验       | 按BIDS规范组织、校验与转换神经影像数据      |
| `clinical-decision-support` | 临床决策支持、循证档案、队列、治理                | 准备仅研究用途的临床决策支持评估材料        |
| `clinical-reports`          | 临床报告、脱敏、结构校验、安全性                  | 为临床与研究报告生成受限草稿并本地校验      |
| `cobrapy`                   | 代谢模型、FBA、FVA、基因敲除、通量                | 用COBRA做代谢建模、通量分析与基因敲除       |
| `datamol`                   | RDKit封装、SMILES、标准化、聚类、构象             | 用datamol简化RDKit分子解析、标准化与聚类    |
| `depmap`                    | 癌症依赖、CRISPR、基因效应、药敏、靶点            | 查询DepMap癌症细胞系基因依赖与药敏数据      |
| `diffdock`                  | 分子对接、位姿预测、虚拟筛选、蛋白-配体           | 用DiffDock预测蛋白-小分子对接位姿与筛选     |
| `esm`                       | 蛋白语言模型、ESM3、折叠、Forge、Biohub           | 用esm SDK与ESM3模型做蛋白序列与折叠任务     |
| `flowio`                    | 流式细胞术、FCS、通道、事件提取                   | 用FlowIO读写与检查FCS流式细胞术文件         |
| `ginkgo-cloud-lab`          | Ginkgo、云实验室、蛋白表达                        | 提交并管理Ginkgo云实验室协议                |
| `glycoengineering`          | 糖基化、序列扫描、O-糖基化、抗体优化、疫苗        | 分析蛋白糖基化位点并辅助糖工程与抗体优化    |
| `histolab`                  | 全切片、瓦片提取、染色归一化、H&E                 | 用histolab做全切片组织检测与瓦片提取        |
| `imaging-data-commons`      | 癌症影像、IDC、DICOM、CT、病理数据集              | 查询下载NCI癌症影像数据与元数据             |
| `labarchive-integration`    | LabArchives、ELN、签名请求、授权、容器            | 安全对接LabArchives ELN与库存API            |
| `matchms`                   | 质谱、MS/MS、谱图比对、库匹配、相似度             | 用matchms清洗比对与检索串联质谱数据         |
| `medchem`                   | 药物相似性、Lipinski、PAINS、复杂度、库筛选       | 用medchem规则与结构警报筛选分诊化合物库     |
| `molecular-dynamics`        | 分子动力学、OpenMM、MDAnalysis、轨迹、RMSD        | 用OpenMM/MDAnalysis搭建与分析MD模拟         |
| `molfeat`                   | 分子特征化、ECFP、描述符、ChemBERTa、QSAR         | 把SMILES转成100+分子特征用于QSAR建模        |
| `neurokit2`                 | 生理信号、时间序列、事件分析、变异性              | 用NeuroKit2做生理信号预处理与事件分析       |
| `neuropixels-analysis`      | Neuropixels、电生理、尖峰排序、Kilosort、单元筛选 | 分析Neuropixels记录并做尖峰排序与筛选       |
| `omero-integration`         | OMERO、显微影像、元数据、ROI、标注                | 用omero-py安全巡查与自动化显微影像流程      |
| `opentrons-integration`     | Opentrons、移液、协议API、仿真、Flex              | 编写与校验Opentrons移液协议并做仿真         |
| `pathml`                    | 计算病理、瓦片、多重成像、空间图                  | 用PathML做计算病理切片处理与空间分析        |
| `primekg`                   | 知识图谱、精准医学、基因、药物、疾病              | 查询PrimeKG知识图谱获取多尺度生物医学关系   |
| `protocolsio-integration`   | protocols.io、协议、导出、REST/MCP、只读          | 读取校验protocols.io协议数据与变更计划      |
| `pydicom`                   | DICOM、医学影像、像素数据、去标识                 | 用pydicom读取转换与安全预检DICOM数据        |
| `pylabrobot`                | 实验室自动化、移液、仿真、设备集成                | 开发与审查PyLabRobot移液方案与离线仿真      |
| `pyopenms`                  | 质谱、蛋白组学、代谢组学、定量、特征检测          | 用pyOpenMS做蛋白/代谢组学质谱数据处理与定量 |
| `rdkit`                     | 化学信息学、SMILES、描述符、指纹、子结构          | 用RDKit做分子解析、描述符、指纹与子结构检索 |
| `rowan`                     | pKa预测、构象、对接、共折叠、分子动力学           | 在Rowan云平台做分子建模、性质预测与筛选     |
| `tamarind`                  | 蛋白设计、结构预测、分子对接、抗体、云平台        | 在Tamarind云平台跑蛋白设计与结构预测工具    |
| `treatment-plans`           | 治疗计划、临床记录、溯源、发布门禁                | 格式化并结构校验本地治疗计划文档            |

---

## 基因组学

| Skill                  | 触发词                                       | 说明                                       |
| ---------------------- | -------------------------------------------- | ------------------------------------------ |
| `anndata`              | h5ad、注释矩阵、scverse、数据格式            | 处理单细胞注释矩阵与.h5ad数据格式          |
| `arboreto`             | 基因调控网络、GRN、GRNBoost2、转录组         | 从表达数据推断基因调控网络与调控关系       |
| `biopython`            | 序列处理、文件解析、Entrez、BLAST、系统发育  | 用Biopython做序列操作、文件解析与NCBI检索  |
| `bioservices`          | 生物数据库、UniProt、KEGG、Reactome、ID映射  | 用bioservices统一访问40+生物数据库         |
| `bulk-rnaseq`          | RNA-seq、FASTQ、比对、定量、差异表达         | 从FASTQ到差异表达与富集出图的RNA-seq流程   |
| `cellxgene-census`     | 单细胞普查、元数据、表达切片、图谱           | 查询CELLxGENE普查的单细胞与空间数据        |
| `deeptools`            | ChIP-seq、ATAC-seq、bigWig、热图、质量评估   | 用deepTools做NGS转换、质控与热图可视化     |
| `dnanexus-integration` | DNAnexus、dxpy、应用、工作流、数据传输       | 在DNAnexus上构建运行可复现基因组学负载     |
| `etetoolkit`           | 系统发育树、Newick、拓扑比较、分类学         | 用ETE4分析比较与可视化系统发育及层次树     |
| `geniml`               | 区间模型、Region2Vec、scEmbed、宇宙          | 用Geniml审计基因组区间工作流与区域嵌入     |
| `gget`                 | 基因查询、BLAST、AlphaFold、数据库、COSMIC   | 用gget快速查询20+生物信息数据库            |
| `gtars`                | 基因组区间、交集、共识、分词、覆盖度         | 用Gtars做基因组区间集合运算与分词建模      |
| `latchbio-integration` | Latch、工作流、Nextflow、注册、运行监控      | 在Latch平台构建注册与运行生信工作流        |
| `nextflow`             | Nextflow、nf-core、流水线、DSL2、执行器      | 构建、运行与调试Nextflow及nf-core流程      |
| `onekgpd`              | 千人基因组、变异查询、个体、等位基因频率     | 查询1000 Genomes个体级变异与亲缘关系       |
| `pacsomatic`           | nf-core、肿瘤配对、样本表、Nextflow、调度器  | 为pacsomatic肿瘤配对流程生成样本表并排障   |
| `pathway-enrichment`   | 通路富集、GO、KEGG、GSEA、基因集             | 对基因列表做通路/GO/GSEA富集分析并解读     |
| `phylogenetics`        | 系统发育、序列比对、IQ-TREE、建树、进化分析  | 用MAFFT/IQ-TREE等构建与分析系统发育树      |
| `polars-bio`           | 基因组区间、重叠、BED、VCF、流式处理         | 在Polars上做基因组区间运算与生信文件IO     |
| `pydeseq2`             | 差异表达、RNA-seq、Wald检验、FDR、收缩       | 用PyDESeq2做bulk RNA-seq差异表达与可视化   |
| `pysam`                | SAM、BAM、CRAM、VCF、pileup、覆盖度          | 用pysam读写查询基因组文件并做覆盖度统计    |
| `scanpy`               | 单细胞、质控、降维、聚类、差异表达           | 用Scanpy完成单细胞RNA-seq标准分析与可视化  |
| `scikit-bio`           | 序列分析、比对、系统发育、多样性、微生物组   | 做序列、系统发育树与微生物组多样性分析     |
| `scvelo`               | RNA速率、轨迹推断、潜变量时间、驱动基因      | 从剪接动态推断单细胞状态转换与轨迹方向     |
| `scvi-tools`           | 单细胞、批次校正、迁移学习、多模态、差异表达 | 用深度生成模型做单细胞批次校正与多模态整合 |
| `tiledbvcf`            | 变异数据、VCF、BCF、TileDB、群体基因组       | 用TileDB入库存储与并行查询VCF/BCF变异数据  |

---

## 机器学习

| Skill                 | 触发词                                        | 说明                                         |
| --------------------- | --------------------------------------------- | -------------------------------------------- |
| `aeon`                | 时间序列、分类、回归、聚类、异常检测          | 用aeon做时间序列分类、聚类与异常检测         |
| `claude-api`          | Claude API、Anthropic SDK、模型选型、工具调用 | Claude API/SDK 参考与模型选型                |
| `deepchem`            | 分子ML、特征化、MoleculeNet、ADMET、毒性      | 用DeepChem做分子性质与毒性预测及基准         |
| `hugging-science`     | HuggingFace、科学数据集、模型、科研AI         | 用Hugging Science查找科学数据集与模型        |
| `hypogenic`           | LLM假设生成、HypoGeniC、文本数据集、审计      | 规划与审计用LLM从标注文本生成假设的流程      |
| `pufferlib`           | 强化学习、环境向量化、PuffeRL、检查点         | 用PufferLib做RL环境向量化、训练与检查点审查  |
| `pyhealth`            | 电子病历、MIMIC、临床预测、用药推荐、训练器   | 用PyHealth构建临床预测与用药推荐深度学习流程 |
| `pytdc`               | 治疗数据、数据集、基准、评估器、分子          | 用PyTDC访问治疗数据集、基准与评估指标        |
| `pytorch-lightning`   | LightningModule、Trainer、多GPU、分布式训练   | 用Lightning组织训练循环与分布式训练配置      |
| `scikit-learn`        | 分类、回归、聚类、模型评估、超参调优          | 用scikit-learn完成监督/无监督学习与调优      |
| `scikit-survival`     | 生存分析、删失、竞争风险、模型评估            | 构建与评估删失或竞争风险生存分析模型         |
| `shap`                | 可解释性、特征归因、SHAP、可视化              | 用SHAP解释与审计模型预测的特征贡献           |
| `stable-baselines3`   | 强化学习、PPO、SAC、DQN、Gymnasium            | 用SB3做单智能体强化学习实验与训练            |
| `timesfm-forecasting` | 时间序列、预测、TimesFM、零样本、预测区间     | 用TimesFM对单变量时间序列做零样本预测        |
| `torch-geometric`     | 图神经网络、PyG、消息传递、异构图、邻居采样   | 用PyG构建图神经网络、异构图表征与采样        |
| `torchdrug`           | 分子图、性质预测、预训练、逆合成、知识图谱    | 用TorchDrug做分子图、蛋白与知识图谱建模      |
| `transformers`        | HF、pipeline、微调                            | HuggingFace模型推理与微调                    |
| `umap-learn`          | 降维、UMAP、嵌入、聚类预处理、DensMAP         | 用UMAP做非线性降维、二维三维嵌入与聚类预处理 |

---

## 科学计算

| Skill              | 触发词                                       | 说明                                       |
| ------------------ | -------------------------------------------- | ------------------------------------------ |
| `astropy`          | 天文、坐标、单位、FITS、WCS、宇宙学          | 用Astropy处理天文单位、坐标、FITS与宇宙学  |
| `cirq`             | 量子电路、噪声建模、Google量子硬件           | 用Cirq设计噪声感知量子电路并面向Google硬件 |
| `fluidsim`         | 流体仿真、CFD、FFT、MPI、重启                | 规划与运行有界FluidSim流体仿真并校验       |
| `geomaster`        | 遥感、GIS、空间分析、卫星影像、点云          | 处理遥感、GIS空间分析与地球观测数据        |
| `geopandas`        | 地理数据、矢量、空间操作、GeoDataFrame       | 用GeoPandas做矢量数据IO与空间操作审计      |
| `matlab`           | MATLAB、Octave、数值计算、MAT文件、互操作    | 编写与审查MATLAB/Octave数值计算与互操作    |
| `matplotlib`       | 绘图、自定义图表、矢量导出、子图             | 用Matplotlib精细控制绘图并导出出版级图形   |
| `networkx`         | 图算法、网络分析、中心性、社区发现、复杂网络 | 用NetworkX创建分析并可视化复杂网络与图     |
| `optimize-for-gpu` | GPU加速、CUDA、RAPIDS、性能剖析、内存瓶颈    | 用GPU加速科学Python并验证更快且结果正确    |
| `pennylane`        | 量子机器学习、自动微分、VQE、QAOA、混合模型  | 用PennyLane训练量子电路与混合量子经典模型  |
| `pymatgen`         | 材料结构、相图、对称性、电子结构、MP         | 用pymatgen分析转换材料结构与计算材料数据   |
| `pymc`             | 贝叶斯、层次模型、MCMC、变分推断、后验检验   | 用PyMC构建贝叶斯模型并做MCMC/变分推断      |
| `pymoo`            | 多目标优化、NSGA-II、帕累托前沿、约束处理    | 用pymoo求解多目标优化与工程设计问题        |
| `qiskit`           | 量子电路、Qiskit、IBM量子、转译、误差缓解    | 用Qiskit构建模拟并执行IBM量子电路          |
| `qutip`            | 量子动力学、开放系统、稳态、谱分析           | 用QuTiP 5模拟与审计开放量子系统模型        |
| `seaborn`          | 统计图、箱线、分布                           | 快速统计可视化与分布比较                   |
| `simpy`            | 离散事件、仿真、资源、监控、复现             | 用SimPy构建与分析离散事件仿真模型          |
| `statsmodels`      | 统计模型、回归、GLM、时间序列、残差诊断      | 用statsmodels构建统计模型并输出诊断与推断  |
| `sympy`            | 符号计算、代数、微积分、方程求解、代码生成   | 用SymPy做精确符号数学计算与公式生成        |

---

## 科研写作

| Skill                      | 触发词                                    | 说明                                     |
| -------------------------- | ----------------------------------------- | ---------------------------------------- |
| `latex-posters`            | LaTeX海报、beamerposter、tikzposter、排版 | 用LaTeX制作学术会议海报并设计版式        |
| `nature-data`              | 数据可用性、数据共享、仓库选择、FAIR      | 起草或审核论文数据与代码可用性声明       |
| `nature-experiment-log`    | 实验日志、图片语音、Markdown、飞书        | 把图片语音文字标准化成带元数据的实验日志 |
| `nature-figure`            | 论文配图、科研绘图、多面板图、图形摘要    | 用Python/R创建修订与导出论文用科研图     |
| `nature-paper-to-patent`   | 专利、技术交底书、现有技术、中文DOCX      | 把论文或发明材料转成中文专利草稿与交底书 |
| `nature-paper2ppt`         | 论文做PPT、文献汇报、组会、备注           | 从论文或阅读笔记生成中文科研PPTX         |
| `nature-polishing`         | 论文润色、学术翻译、正文精简、LaTeX       | 润色翻译与精简已有学术文本并修排版       |
| `nature-response`          | 审稿回复、逐点回复、返修信、校样          | 起草与审核审稿回复、返修信与稿件包       |
| `nature-writing`           | 论文写作、章节起草、论证重构、投稿        | 从作者证据起草或重构论文各章节与投稿材料 |
| `pptx-posters`             | 学术海报、PowerPoint、可编辑、打印检查    | 在PowerPoint中创建与审查可编辑学术海报   |
| `research-grants`          | 基金申请、研究计划、NSF、NIH、预算、合规  | 撰写NSF/NIH等机构基金申请书与预算材料    |
| `researchwrite`            | 研究计划、开题报告、项目申请、论证        | 撰写与修订研究计划、开题报告与申请书     |
| `scientific-schematics`    | 科学示意图、神经网络图、通路图、流程图    | 用AI生成神经网络、通路等科研示意图       |
| `scientific-slides`        | 学术演讲、幻灯片、会议报告、答辩、Beamer  | 搭建学术演讲幻灯片并做结构与视觉校验     |
| `scientific-visualization` | 出版级图表、多面板、配色、期刊导出        | 制作与审查真实可发表的科研图表           |
| `scientific-writing`       | 论文写作、证据溯源、投稿、声明、一致性    | 起草修订科研论文并做溯源与投稿一致性检查 |

---

## 数据与基础设施

| Skill                     | 触发词                                        | 说明                                        |
| ------------------------- | --------------------------------------------- | ------------------------------------------- |
| `dask`                    | 分布式、超内存、并行、集群、DataFrame         | 用Dask把pandas/NumPy负载扩展到集群          |
| `get-available-resources` | 资源盘点、CPU内存、调度器、加速器             | 探测主机可用CPU内存加速器以做资源规划       |
| `lamindb`                 | LaminDB、数据血缘、注册、本体注释、存储       | 用LaminDB管理生物数据集的血缘与查询         |
| `modal`                   | 无服务器、云端Python、GPU、批处理、部署       | 用Modal SDK在云端按需运行Python与GPU任务    |
| `polars`                  | DataFrame、表达式、惰性查询、流式、pandas迁移 | 用Polars做表达式式ETL、惰性查询与数据分析   |
| `usfiscaldata`            | 美国财政部、国债、利率、财政报表、API         | 查询美国财政部财政数据API获取国债与利率统计 |
| `vaex`                    | 超大表格、超出内存、懒加载、聚合、大数据集    | 处理超出内存的十亿行级表格数据与外存聚合    |
| `zarr-python`             | Zarr、分块数组、云存储、并行IO、S3/GCS        | 用Zarr-Python 3做云端分块数组存储与IO       |

---

## 其他

| Skill                     | 触发词                                       | 说明                                     |
| ------------------------- | -------------------------------------------- | ---------------------------------------- |
| `autoskill`               | 屏幕观察、技能发现、工作流检测、screenpipe   | 观察屏幕轨迹发现重复流程并起草新技能     |
| `find-skills`             | 技能发现、安装、能力扩展                     | 帮用户发现并安装可能满足需求的技能       |
| `full-output-enforcement` | 完整输出、反截断、占位符                     | 强制完整输出禁止占位截断                 |
| `generate-image`          | 图像生成、AI绘图、配图、图像编辑、OpenRouter | 经OpenRouter图像API生成或编辑图片素材    |
| `health`                  | 配置检查、指令漂移、hooks、MCP               | 审计agent配置、指令漂移与hooks/MCP健康度 |
| `notion-mcp`              | Notion、创建页面、查询数据库、更新页面       | 通过 MCP 操作 Notion 页面/数据库/评论    |
| `pi-agent`                | Pi、终端编码代理、扩展、SDK、RPC             | 安装配置Pi终端编码代理、扩展包与SDK集成  |
| `scaffold-exercises`      | 练习脚手架、课程、章节、解答                 | 生成含章节题目与解答的练习目录结构       |
| `scheduler`               | 提醒、定时、本地任务                         | 安排设备端提醒与本地任务                 |
| `skill-creator`           | 创建技能、改进技能、eval、基准测试           | 创建/迭代技能并做 eval 与基准测试        |
| `template-skill`          | 技能模板、占位描述、待填写                   | 技能模板占位符（描述与指令待填写）       |
| `writing-skills`          | 创建技能、编辑技能、验证技能、部署前         | 创建/编辑技能并在部署前验证其可用        |

---
## 流程速查

### 会话开始

```
1. 读取 memory-bank/（R1 强制）
2. 浏览本 SKILL_GRAPH.md 了解可用技能
3. using-superpowers / using-agent-skills → 确立技能查找与调用顺序
```

### 新功能开发

```
1. brainstorming → 探索用户意图、需求与设计
2. think / idea-refine → 出方案与打磨想法
3. planning-and-task-breakdown / writing-plans → 拆成有序任务
4. tdd / test-driven-development → 红绿重构
5. vp test / pnpm test:unit → 验证
6. code-review / check → 审查
```

### Bug 修复

```
1. systematic-debugging → 无根因不下修复
2. hunt / diagnosing-bugs → 假设驱动调查与诊断循环
3. tdd → 先把复现固化为测试
4. vp test / pnpm test:unit → 验证
5. verification-before-completion → 宣称修复前先跑验证
```

### 前端 UI 工作

```
1. frontend-design → 视觉方向
2. ui / frontend-ui-engineering → 实现生产级界面
3. motion-spec / transitions-dev → 动效规格与过渡实现
4. gstack-design-review / web-design-guidelines → 设计与合规审查
5. a11y-debugging / web-accessibility-audit → 可访问性验证
```

### API 集成

```
1. api-contract-verification → 验证 ctt-web ↔ ctt-server 契约
2. test-auth-bootstrap → 集成测试缺鉴权时先自举凭证
3. vitest / vue-testing-best-practices → 单测与组件测试
4. webapp-testing → Playwright 端到端验证
```

### 发布与上线

```
1. gstack-ship → 跑测试、改版本号、提交推送并建 PR
2. gstack-land-and-deploy → 合并 PR、等 CI 与部署
3. gstack-canary → 部署后金丝雀监控
```

---

## 技能优先级规则

1. **用户指令** > **技能** > **默认行为**
2. **流程技能优先**：`tdd`、`systematic-debugging`、`hunt` 等先于实现技能
3. **项目技能优先**：`vue-best-practices` 优先于通用 `frontend-design`
4. **同名去重**：本机 486 个技能名中有相当一部分同时安装在两个以上来源目录（如 `~/.agents/skills` 与 `~/.claude/skills` 均含 `vue`、`pdf` 等）；同名即同一技能，本文件只保留一行，分类取唯一口径
5. **多技能可叠加**：可同时加载多个相关技能

---

## 技能加载模式

```typescript
// 单技能
task(category="quick", load_skills=["vue-best-practices"], ...)

// 多技能叠加
task(category="visual-engineering", load_skills=["frontend-design", "vue-best-practices", "transitions-dev"], ...)

// 流程 + 实现组合
task(category="deep", load_skills=["tdd", "vue", "vitest"], ...)
```

> 只能加载本文件中列出的技能名。历史文档中的 `frontend`、`git-master`、`debugging`、`visual-qa`、`playwright`、`remove-ai-slops` 等名字在磁盘上已无对应目录，加载会失败；`tdd` 与 `test-driven-development`、`hunt` 与 `systematic-debugging` 是来自不同来源的两个独立技能。

---

_最后更新: 2026-09-21_
_技能总数: 486（去重后）_
_来源: ~/.agents/skills (377) · ~/.claude/skills (229) · ~/.config/opencode/skills (65) · 项目 .agents/skills (38) · 项目 .claude/skills (35) · 项目 skills/ (2) · ~/.omp/agent/skills (2) · omp superpowers 扩展包 (14)（与本文件头一致）_
_来源标签: `omp 原生` = omp native provider 目录 `~/.omp/agent/skills`（teach、visualize）；`superpowers 扩展包` = omp 插件 superpowers 6.3.0 随包技能 `~/.omp/plugins/node_modules/superpowers/skills`（brainstorming、dispatching-parallel-agents、executing-plans、finishing-a-development-branch、receiving-code-review、requesting-code-review、subagent-driven-development、systematic-debugging、test-driven-development、using-git-worktrees、using-superpowers、verification-before-completion、writing-plans、writing-skills，共 14 个）_
_口径: 每行 = 磁盘上一个技能目录，名称取目录名；跨来源同名只保留一行（486 个名称中 260 个出现在两个以上来源）。omp 不内置任何技能，仅提供发现机制。_
