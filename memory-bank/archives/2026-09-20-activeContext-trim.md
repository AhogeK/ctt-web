# activeContext 溢出归档（2026-09-20）

> 自 `activeContext.md` 迁出，仅保留事件本身；耐久判断早已回迁领域层（R24）。

### E2E 会话被真实 401 清空（根因，2026-09-17）

settings/profile 的 E2E 曾长期表现为「分支选错、`hasPassword` 永远是 false」。逐边界取证后定位：

**`GET /api/v1/auth/oauth/accounts` 未被 mock → 打到真服务端 → 401 → 全局 `handle401Error` → `clearAuth()` → token 从 localStorage 删除、store 归默认。** 因果链：`initializeAuth()` 返回 false → `main.ts` 不调用 `fetchUserProfile()` → `hasPassword` 停在默认 false → 对话框渲染邮箱分支。**不是产品缺陷，是测试夹具不完整。**

同一个 mock 缺口还掩盖了第二处：`e2e/utils/auth-helpers.ts` 的 refresh 响应**漏了 `userId`**，而 `LoginResponseSchema` 要求它是 UUID —— 任何整页重载都会因解析失败清空会话。

两处均修（`userId` + oauth mock 移入共享 `mockAuthApis`）。相关 spec 改为**只读** auth store：分支必须来自应用自身的启动拉取，而不是测试写进去的值。

**已修复**：`mockAuthApis` 增加**最先注册**的兜底路由（未 mock 的 `/api/v1/**` 返 200），`leaderboard` helper 改为仅在无会话时登录。**93/93 e2e 全绿**。

**方法论教训**：`initializeAuth` 的 `catch {}` 把原因吞掉了，只有逐边界插桩（refresh 响应 → profile 响应 → console → 非 2xx URL）才看得到 401。另外 `e2e/dashboard` + `e2e/leaderboard` 有**既有 flaky**（A/B 对照：有该 mock 时 2 failed / 25 passed，无 mock 时 4 failed / 23 passed，且失败用例名每次不同）——与本次改动无关。

---

### 落地页外壳：仓库入口与页脚（用户设计反馈，2026-09-19）

用户关键判断 **「开源的项目不止一个」** ✓。**页脚**：单个 `github.com/…` 链接 ✗ → **生态三仓库清单**（插件 / 后端 / 本看板，各带图标与角色说明）+ 版权行 **`© <年> AhogeK`** ✓。**未写 "All rights reserved"** ✗ —— 与上方 MIT 授权自相矛盾（MIT 已授予所有人权利）；取其版权行之意、弃其法律措辞。**结构**：三处外部地址原散在布局与视图 ✗ → 收进 **`src/lib/site-links.ts`** 单一来源 ✓。**真机验证** ✓：页脚三条链接各含 `<svg>` ✓、版权行存在 ✓（Iconify 是运行时拉取，DOM 断言证明不了渲染 ✗）。

