# i18n — scenarios

## S1 给界面新增一句话

1. 在对应区域的命名空间下起键（`settings.apiKeys.emptyTitle` 这种层级）。
2. `en.ts` 与 `zh-CN.ts` **同一笔**写入。
3. 组件里 `t('…')`；需要变量用 `{count}` 这类命名插值。
4. `pnpm check:i18n` 必须干净（键漂移、空值都会被拦）。

## S2 迁移一个还含英文的组件

按 `practices.md` 的五步走。要点：英文照抄原文（既有断言不动）、同批验证、同批提交。
遇到模块级 schema/字段表 → 用 `i18n.global.t`（`t` 声明在 schema 之前）。

## S3 页面报 `Invalid linked format` 或整页空白

几乎一定是某个词条里有裸 `@` 或 `|`。定位：单测/控制台栈里会指向 message-compiler；
用 `grep -n '@' src/i18n/locales/*.ts` 找出来，改成 `{'@'}`。**不要**删词条绕过。

## S4 切换语言后日期仍是英文

查两处：① 该处是否用了直接 `toLocale*String('en-US', …)`（`check:i18n` 会报）；
② 格式化器是否读 `currentLocale`（`src/lib/utils/time.ts`）。图表里缓存过的 option 需要在
`watch` 里重建 —— 现有三张图已有该 watch。

## S5 需要再加一种语言

1. `locale.ts`：`SUPPORTED_LOCALES` 加值 + 规范化映射（如 `ja` → `ja-JP`）。
2. 新建 `src/i18n/locales/<code>.ts`，**类型由 `en.ts` 约束**（缺键即编译错）。
3. `index.ts` 的 `loaders` 加分块加载项。
4. 语言选择器（偏好页 + 头像菜单）读的是 `SUPPORTED_LOCALES` 与其标签表，补标签。
5. `e2e/settings/language.spec.ts` 加一条该语言的切换断言。

## S6 语言切换要不要出现在 E2E 的每个用例里

不要。语言默认跟随浏览器/英语，既有用例保持不变；语言行为只由 `language.spec.ts` 覆盖，
其他用例只在断言处使用页面上真实渲染出来的文案。
