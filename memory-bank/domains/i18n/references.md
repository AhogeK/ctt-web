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

`AppHeader` · `AppSidebar`（含四个设置分区链接）· `PreferencesView` · `ChoiceRadioGroup` ·
`LanguageMenu`（公共壳：营销顶栏 + 登录卡片；32px 方形按钮显示语言代码，菜单列全部语言）·
`MarketingLayout`（CTA 与源码链接文案）·
`LoginForm` · `LoginView`（含账号锁定 / 邮箱未验证对话框与重发倒计时）·
`HeatmapChart` / `TrendChart` / `LongTermTrendPanel`（日期标签）· 认证表单层（注册 / 忘记 / 重置表单、
强度计、条款对话框与正文、重置页、Zod 校验文案）·
落地页全页（首屏 / 年历 / 奖杯卡 / 能力 / 工作方式 / 免费与运行方式 / 开源 / 页脚 / 源码对话框）·
看板共享层（汇总字段与涨跌、最近会话与分组、奖杯卡家族与窗口）·
认证页全套（登录 / 注册 / 忘记 / 两个成功页 / 验证邮箱 / 变更邮箱 / OAuth 回调与错误页 / 重发验证提示）·
共享错误码表 `api.errors.*`（`mapApiErrorCode` 与 `getErrorMessage`）·
`CaptchaWidget`（hCaptcha `hl` 跟随界面语言：`en` / `zh-CN`）·
统计面板（页头 / 筛选器 / 九个面板标题 / 图表提示与无障碍摘要 / 年月选择器 / 图例单位词 / 时段命名）·
成就页（页头 / 汇总 / 分区 / 倒计时 / 67 个阶梯名按代码映射）·
排行榜（标题与副标题 / 维度与周期 / 空态错误态 / 分页 / 语言选择器 / 分数单位随语言 / 成长维度的正负说明）·
认证卡片展示层 `AuthDashboard` / `AuthMetricsCard` / `AuthTerminalCard`（品牌名、URL、语言名、终端标题保留英文）

## 收尾批次（2026-10-27 · v0.67.1）

应用级回退与异常面：`App.vue`（加载态、切块失败 toast 与重试）· `ErrorBoundary` · `404View` ·
`ThemeToggle` / `UserAvatar` 的 aria。`components/ui` 默认文案：dialog 与 sheet 的 `Close`、
sidebar 的标题与 `Toggle Sidebar`。路由标题：`meta.titleKey` + `guard.ts` 在**导航时**用
`i18n.global.t` 解析（不在模块加载时冻结语言）。图表：周时段的周几轴、tooltip 与小时单位。
数据层：store/API toast（退出登录、会话刷新、终端鉴权码）· 找回密码倒计时 · OAuth bind/unbind 文案；
`api-error` 兜底句。

**两条随本轮确立的机制**：
- 需要在切语言时立刻更新的东西（tab 标题、图表轴）必须挂 `onLocaleChange` 或 `watch(currentLocale)`；
  `setLocale` 只改实例/格式化器/`<html lang>`，不会重跑路由守卫。
- 同一后端错误码在不同端点含义不同（`AUTH_003`：重置链接失效 vs 会话失效）⇒ **不要**为了复用而共用
  一张文案表，按端点分表，各自指向语义准确的键。
- 组件若把本地化文案写进 `aria-label`，E2E 定位必须用稳定钩子（`data-testid`），不能用文案前缀。

## 有意保留的英文（不是遗漏）

品牌名（`Code Time Tracker` / `CTT`）· 认证展示卡的示例语言与终端行（TypeScript / Vue / Rust、
`TS 68%`）· 支持渠道名（Ko-fi / Afdian / Solana）· 落地页示例数据 ·
服务端返回的设备名/项目名/语言名 · `lib/schemas` 的响应解析消息（不渲染，仅用于失败定位）。
