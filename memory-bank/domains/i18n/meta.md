# i18n — meta

## 域职责

界面语言的**机制层**：locale 解析与持久化、词条包的组织与加载、日期/时间的本地化格式化、
以及"文案不得硬编码"的检查器。视觉与排版不在此域（归各自的视觉域）。

## 当前版本基线

- 引入版本 **0.60.0**（2026-10-21，develop）
- 覆盖状态：机制 + 外壳 + 偏好页 + 登录表单已迁移；其余界面仍在迁移（批次见
  `.omp/plans/i18n-full-coverage-plan.md`）
- 支持语言：`en`（源语言 + 内置兜底）/ `zh-CN`（独立分块）

## 核对基线

| 事实 | 回源 |
| --- | --- |
| locale 解析顺序 / 存储键 / 主文档同步 | `src/i18n/locale.ts` |
| 实例工厂、分块加载、挂载前初始化 | `src/i18n/index.ts` + `src/main.ts` |
| 词条内容与键集合 | `src/i18n/locales/en.ts` · `zh-CN.ts` |
| 日期格式化器 | `src/lib/utils/time.ts` |
| 三条检查规则 | `scripts/check-i18n.mjs` |
| 测试约定 | `src/i18n/__tests__/*` · `src/test/setup.ts` |

## 何时读本域

- 新增/修改任何界面文案
- 迁移一个还含硬编码英文的组件
- 出现 `Invalid linked format` / 词条缺失 / 语言切换后日期不跟随
- 需要新增一种界面语言
