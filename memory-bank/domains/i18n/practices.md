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

`defineComponent` 之外的 Zod schema、字段表、常量数组在模块加载时求值，拿不到 `useI18n`。写法：

```ts
const t = (key: string) => i18n.global.t(key)   // declared above the schemas

z.string().min(1, { error: () => t('auth.validation.passwordRequired') })
```

两条要求：

1. `const t = …` **声明在 schema 之前**（`const` 不提升，反过来 TS2448 且运行期抛错）。
2. 校验文案用 **`error: () => t(…)` 惰性求值**，不要直接写成 `t(…)` 的返回值 —— 后者在模块加载时
   就固定成当时的语言，切换语言后校验消息仍是旧语言。Zod 4 在每次解析时调用该函数，所以惰性写法的
   消息（以及随后重新校验产生的消息）都跟随当前语言。

已知残留：`LoginForm` 的 schema 仍取模块加载时的文案，切换语言后不会更新；迁移该视图时一并改成
惰性写法。

## 条款正文随语言切换

`src/features/auth/content/index.ts` 按当前语言返回 `terms-en` 或 `terms-zh`（`computed`），
`TermsDialog` 用 `termsContent` 时模板自动解包。**不要**直接 import `terms-en` —— 那会让中文用户
读到整篇英文法务文本。两份正文的结构由 `TermsContent` 类型约束，缺字段即编译错。

## 删除前先确认没有第二个消费方

`ResetPasswordForm.vue` 曾在迁移后被保留在词条体系里，但没有任何模块导入它 —— 真实页面是
`ResetPasswordView.vue` 的内联表单。净效果是新词条不可达、真实页面仍英文。改动一个"看起来在用"的
组件前，先 `grep -rn "<ComponentName>" src e2e`：只有 schema 共享不算消费方。

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
