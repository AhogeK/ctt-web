# i18n — references

## 源码

| 文件 | 职责 |
| --- | --- |
| `src/i18n/locale.ts` | 支持列表、存储键 `ctt.locale`、解析与规范化、`<html lang>`、跨标签页 |
| `src/i18n/index.ts` | `createAppI18n` 工厂、`initI18n`、中文分块加载、`setLocale` |
| `src/i18n/locales/en.ts` | 英文词条（源语言；中文键的强制类型来源） |
| `src/i18n/locales/zh-CN.ts` | 中文词条（独立分块） |
| `src/lib/utils/time.ts` | `formatWeekdayShort` / `formatMonthShort` / `formatDateTime` / `formatDuration` |
| `src/main.ts` | 挂载前 `await initI18n()`（首帧即为正确语言） |
| `src/test/setup.ts` | 每个组件测试挂载应用实例 |
| `scripts/check-i18n.mjs` | 三条检查规则 + 唯一 allowlist（中文条款正文） |

## 命令

```sh
pnpm check:i18n        # 中文硬编码 / 键漂移 / 直接 en-US 格式化
pnpm test:unit --run src/i18n
pnpm exec playwright test e2e/settings/language.spec.ts --project=chromium
```

## 已迁移面（0.60.0）

`AppHeader` · `AppSidebar` · `PreferencesView` · `SettingsShell` · `ChoiceRadioGroup` ·
`LoginForm` · `HeatmapChart` / `TrendChart` / `LongTermTrendPanel`（日期标签）

## 未迁移面（批次见计划件）

认证其余页面 · 设置其余页面 · 统计面板文案 · 落地页 · 成就/排行榜/设备 · 错误码文案表 ·
`lib/schemas` 校验文案 · `components/ui` 默认文案
