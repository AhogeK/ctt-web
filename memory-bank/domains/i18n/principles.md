# i18n — principles

## P1 英语是源语言，也是兜底

`en.ts` 内置进主包；`zh-CN` 是独立分块，只有被选中才下载。缺键时回落到英文：任何一句
漏翻都只是"还是英文"，不会出现空字符串或键名。

## P2 解析顺序：存的选择 > 浏览器语言 > 英语

存储键 `ctt.locale`（与主题的 `theme-appearance` 同一套偏好模型）。`zh-TW`/`zh-Hans`/`zh`
一律收拢到唯一在售的中文词条，不再按地区分裂。存储里出现不支持的值时规范化回默认，
不信任外部写入。

## P3 只有 `setLocale` 写语言状态

切换语言 = 实例 → 格式化器读的 `currentLocale` → `<html lang>` → 存储，四步一次完成；
其他标签页通过 `storage` 事件跟随。**禁止**直接改 i18n 实例的 `locale`：会漏掉后三步。

## P4 组件内用组合式，模块级用全局实例

`<script setup>` 里用 `useI18n()`；**模块级**代码（Zod schema、字段表、常量表）在 setup
之外执行，只能读 `i18n.global.t`。这是把几份表单的词条抽到 schema 里时的唯一可行写法。

## P5 日期一律走共享格式化器

`formatWeekdayShort` / `formatMonthShort` / `formatDateTime` 等从 `@/lib/utils` 导入。
直接 `toLocale*String('en-US')` 会把界面钉死在英文 —— 检查器对此报错。

## P6 英文文案照抄原文

迁移时英文侧**逐字复制**现有字面量（含标点与大小写），中文侧才是新写的。这样既有单测与
E2E 的英文断言不需要改，迁移不会顺手改变产品语气。

## P7 检查器只允许一个例外

`scripts/check-i18n.mjs` 的 allowlist 目前只有中文条款正文（法律内容，不是界面文案）。
任何新增例外都要有同类理由，不得为了"先通过"而加文件。
