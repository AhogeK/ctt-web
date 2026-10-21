# i18n — practices

## 迁移一个组件的标准动作

1. 枚举该文件的字面量（模板属性 + 脚本内字符串），按界面分组起键：`auth.login.*`、
   `settings.preferences.*` 这类"区域.页面.部件"的层级。
2. **同一次编辑**里写两份词条：`en.ts` 逐字复制原英文，`zh-CN.ts` 写中文译法。
3. 组件改用 `t('…')`；带参数的用命名插值（`{name}`），不要拼字符串。
4. 该批验证：`pnpm test:unit --run <目录>` → `pnpm check:i18n` → `pnpm type-check` →
   `pnpm build` → `pnpm lint`。
5. 再按同一批提交（一批一笔），不跨批攒提交。

## 陷阱：`@` 与 `|` 是 vue-i18n 的语法

词条里出现裸 `@` 会被当成"链接消息"，裸 `|` 会被当成复数分隔符。一个写错的值会让**整个
词条包解析失败**，组件一挂载就抛 `Invalid linked format` —— 表现是页面空白/报错，而不是
那一句显示不对。

- 正确写法：`you{'@'}example.com`（字面量插值）
- 邮箱占位符、含 `@` 的示例文本都要这样写
- 检查手段：单测会立刻炸（登录表单那次就是被 10 个用例抓到）

## 模块级代码的词条

`defineComponent` 之外的 Zod schema、字段表、常量数组在模块加载时求值，拿不到 `useI18n`。
写法：模块顶部 `const t = i18n.global.t`，schema 里用 `t('…')`。顺序上 **`t` 必须在
schema 之前声明**（`const` 不提升，反过来会 TS2448 并让运行期抛错）。

校验消息若要随语言切换而更新，schema 需要包成函数或在 `computed` 里构造；当前登录表单
的 schema 是模块级常量，**校验消息在页面生命周期内不跟随切换**（已知取舍，迁移到需要
跟随的页面时再改成工厂）。

## 测试约定

- `src/test/setup.ts` 给每个挂载装好了应用 i18n 实例 —— **组件测试不要再自己创建实例**
  或用 `global.plugins` 重复挂载。
- 词条包本身的测试在 `src/i18n/__tests__/`：键集合一致、无空值、解析规则。
- E2E 语言用例：`e2e/settings/language.spec.ts`（切换、持久化、跨页面文案）。

## 日期与时间

`formatWeekdayShort(date)` / `formatMonthShort(date)` / `formatDateTime(value)` 接
`Date`；图表（ECharts）的 tooltip/axisLabel 里同样走它们。**不要**在图表里写
`toLocaleString('en-US', …)`：`check:i18n` 会拦，且它正是本次迁移中真实存在的残留。

## 文案里的数字与单位

时长仍走 `formatDuration`（`1h 30m` 这类紧凑写法与语言无关）；只有**自然语言**部分
（"coded"、星期、月份）进词条。不要为了翻译把时长格式也改成随语言变化 —— 图例宽度已按
现格式布局。
