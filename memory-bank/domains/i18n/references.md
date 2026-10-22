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

## 已迁移面（0.62.0）

`AppHeader` · `AppSidebar` · `PreferencesView` · `SettingsShell` · `ChoiceRadioGroup` ·
`LanguageMenu`（公共壳：营销顶栏 + 登录卡片；32px 方形按钮显示语言代码，菜单列全部语言）·
`MarketingLayout`（CTA 与源码链接文案）·
`LoginForm` · `LoginView`（含账号锁定 / 邮箱未验证对话框与重发倒计时）·
`HeatmapChart` / `TrendChart` / `LongTermTrendPanel`（日期标签）· 认证表单层（注册 / 忘记 / 重置表单、
强度计、条款对话框与正文、重置页、Zod 校验文案）·
落地页全页（首屏 / 年历 / 奖杯卡 / 能力 / 工作方式 / 免费与运行方式 / 开源 / 页脚 / 源码对话框）·
看板共享层（汇总字段与涨跌、最近会话与分组、奖杯卡家族与窗口）·
认证页全套（登录 / 注册 / 忘记 / 两个成功页 / 验证邮箱 / 变更邮箱 / OAuth 回调与错误页 / 重发验证提示）·
共享错误码表 `api.errors.*`（`mapApiErrorCode` 与 `getErrorMessage`）·
`CaptchaWidget`（hCaptcha `hl` 跟随界面语言：`en` / `zh-CN`）

## 未迁移面（批次见计划件）

设置各视图与对话框 · 统计面板文案 · 成就页自身文案 · 排行榜 / 设备 ·
`lib/schemas` 校验文案 · `components/ui` 默认文案 · 路由文档标题
