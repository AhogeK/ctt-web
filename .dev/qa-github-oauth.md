# GitHub OAuth QA 测试文档

**版本**: 0.8.4  
**日期**: 2026-05-28  
**测试环境**: 本地开发 (localhost:5173)

---

## 前置条件

1. 后端 ctt-server 已启动并配置好 GitHub OAuth 凭据
2. 前端开发服务器已启动 (`vp dev`)
3. 浏览器打开开发者工具 (F12) → Network 面板
4. 准备一个 GitHub 账号用于测试

---

## 测试用例 1: 登录页 GitHub 按钮显示

**目的**: 验证 GitHub 登录按钮正确显示

**步骤**:
1. 打开浏览器访问 `http://localhost:5173/login`
2. 观察页面内容

**预期结果**:
- [x] 页面显示 "Welcome back" 标题
- [x] 显示 Email 输入框
- [x] 显示 Password 输入框
- [x] 显示 "Sign in" 按钮
- [x] 显示 "or" 分隔线（水平线 + 居中文字）
- [x] 分隔线下方显示 "Continue with GitHub" 按钮
- [x] GitHub 按钮左侧有 GitHub 图标（八爪猫图标）
- [x] GitHub 按钮样式为 outline 风格（边框 + 白色背景）

**视觉检查**:
- [x] 亮色主题下：GitHub 按钮边框可见，文字清晰
- [x] 暗色主题下：GitHub 按钮边框可见，文字清晰
- [x] 按钮 hover 时有视觉反馈（背景色变化）

---

## 测试用例 2: GitHub 登录按钮点击 → 授权页面跳转

**目的**: 验证点击 GitHub 按钮后正确跳转到 GitHub 授权页面

**步骤**:
1. 打开 `http://localhost:5173/login`
2. 打开开发者工具 → Network 面板
3. 点击 "Continue with GitHub" 按钮
4. 观察 Network 面板的请求

**预期结果**:
- [x] Network 面板显示 `GET /api/v1/auth/oauth/github/authorize` 请求
- [x] 请求状态码为 200
- [x] 响应包含 `authUrl` 字段，格式为 `https://github.com/login/oauth/authorize?...`
- [x] 浏览器自动跳转到 GitHub 授权页面
- [x] GitHub 页面显示 "Authorize {应用名}" 提示
- [x] GitHub 页面显示请求的权限范围 (read:user, user:email)

**Network 请求详情**:
```
Request: GET /api/v1/auth/oauth/github/authorize
Response: { "code": 200, "message": "OK", "data": { "authUrl": "https://github.com/login/oauth/authorize?..." } }
```

---

## 测试用例 3: GitHub 授权成功 → 回调处理

**目的**: 验证用户授权后正确回调并登录

**步骤**:
1. 在 GitHub 授权页面点击 "Authorize {应用名}" 按钮
2. 观察页面跳转

**预期结果**:
- [x] GitHub 重定向到后端 callback 地址
- [x] 后端处理后重定向到前端 `/oauth/callback`
- [x] 页面显示 "Completing sign in..." 加载提示
- [x] 页面显示旋转加载动画
- [x] 自动跳转到 Dashboard 页面 (`/dashboard`)
- [x] Dashboard 页面正常显示（不是空白页）

**验证 Token 存储**:
1. 打开开发者工具 → Application 面板 → Local Storage
2. 检查以下 key 是否存在:
   - [x] `ctt_access_token` - 非空字符串
   - [x] `ctt_refresh_token` - 非空字符串
   - [x] `ctt_user_id` - UUID 格式字符串

**验证 URL 清理**:
- [x] 浏览器地址栏 URL 不包含 `accessToken`、`refreshToken` 等查询参数
- [x] URL 应为 `http://localhost:5173/dashboard`（无参数）

---

## 测试用例 4: GitHub 授权拒绝 → 错误处理

**目的**: 验证用户拒绝授权时的错误处理

**步骤**:
1. 打开 `http://localhost:5173/login`
2. 点击 "Continue with GitHub"
3. 在 GitHub 授权页面点击 "Cancel" 或拒绝授权

**预期结果**:
- [ ] 浏览器跳转到 `/oauth/error` 页面
- [ ] 页面显示 "Sign in failed" 标题
- [ ] 页面显示错误信息 "GitHub authorization was cancelled or failed."
- [ ] 页面显示错误代码 `OAUTH_PROVIDER_ERROR`
- [ ] 显示 "Try again" 按钮
- [ ] 显示 "Back to home" 按钮

**交互测试**:
1. 点击 "Try again" 按钮
   - [ ] 跳转到登录页 `/login`
2. 返回错误页，点击 "Back to home" 按钮
   - [ ] 跳转到首页 `/`

---

## 测试用例 5: 错误码显示验证

**目的**: 验证各种错误码的显示

**步骤**:
1. 手动访问以下 URL，检查显示的错误信息:

| URL | 预期错误信息 |
|-----|-------------|
| `/oauth/error?code=AUTH_013` | Authorization session expired. Please try again. |
| `/oauth/error?code=AUTH_015` | GitHub authorization failed. Please try again. |
| `/oauth/error?code=AUTH_016` | This GitHub account is already linked to another user. |
| `/oauth/error?code=AUTH_017` | This GitHub account is not linked to any user. |
| `/oauth/error?code=AUTH_018` | Cannot unlink the last login method. |
| `/oauth/error?code=AUTH_004` | Account is temporarily locked. Please try again later. |
| `/oauth/error?code=AUTH_005` | Account has been disabled. Please contact support. |
| `/oauth/error?code=AUTH_006` | Please verify your email address first. |
| `/oauth/error?code=AUTH_019` | Terms of service need to be accepted. |
| `/oauth/error?code=OAUTH_PROVIDER_ERROR` | GitHub authorization was cancelled or failed. |
| `/oauth/error?code=MISSING_OAUTH_PARAMS` | Invalid authorization request. Please try again. |
| `/oauth/error?code=INVALID_STATE_ACTION` | Invalid authorization request. Please try again. |
| `/oauth_ERROR?code=OAUTH_INTERNAL_ERROR` | Service error. Please try again later. |
| `/oauth/error` (无 code) | An unexpected error occurred. Please try again. |

**检查项**:
- [x] 每个错误码显示对应的错误信息
- [x] 页面底部显示错误代码
- [x] 错误代码格式正确（如 `AUTH_013`）

---

## 测试用例 6: Open Redirect 防护验证

**目的**: 验证恶意 redirect 参数被阻止

**步骤**:
1. 手动访问以下恶意 URL:

```
http://localhost:5173/oauth/callback?accessToken=fake&refreshToken=fake&redirect=https://evil.com
http://localhost:5173/oauth/callback?accessToken=fake&refreshToken=fake&redirect=//evil.com
http://localhost:5173/oauth/callback?accessToken=fake&refreshToken=fake&redirect=http://evil.com
```

**预期结果**:
- [x] 所有恶意 redirect 被忽略
- [x] 页面跳转到 Dashboard (`/dashboard`)，而不是恶意网站
- [x] 不会出现外站跳转

**合法 redirect 测试**:
```
http://localhost:5173/oauth/callback?accessToken=fake&refreshToken=fake&redirect=/settings
```
- [x] 跳转到 `/settings`（相对路径有效）

---

## 测试用例 7: GitHub 绑定按钮（设置页）

**目的**: 验证设置页的 GitHub 绑定功能

**步骤**:
1. 先正常登录（邮箱密码方式）
2. 访问 `http://localhost:5173/settings/profile`

**预期结果**:
- [x] 页面显示 "Profile Settings" 标题
- [x] 页面显示 "Connected Accounts" 区域
- [x] 显示 GitHub 图标和 "GitHub" 文字
- [x] 显示 "Not connected" 状态文字
- [x] 显示 "Connect GitHub" 按钮

**交互测试**:
1. 点击 "Connect GitHub" 按钮
2. 观察 Network 面板

**预期结果**:
- [x] Network 面板显示 `GET /api/v1/auth/oauth/github/authorize` 请求
- [x] 请求成功（200 状态码）
- [x] 浏览器跳转到 GitHub 授权页面

> ✅ v0.8.40 完成：ctt-web ProfileView Connect GitHub 按钮启用 BIND flow（action=bind），监听 `?linked=github` / `?linked=github&error={code}` 回调，展示成功/错误 toast 并清理 URL 参数。详见 ctt-server PR-A（commit c0d8f04）+ ctt-web v0.8.40 release notes。

---

## 测试用例 8: 重复点击防护

**目的**: 验证快速重复点击不会导致问题

**步骤**:
1. 打开 `http://localhost:5173/login`
2. 快速连续点击 "Continue with GitHub" 按钮 5 次

**预期结果**:
- [ ] 只发送 1 个 authorize 请求（不是 5 个）
- [ ] 页面正常跳转到 GitHub
- [ ] 不会出现错误或崩溃

---

## 测试用例 9: 网络错误处理

**目的**: 验证网络请求失败时的错误处理

**步骤**:
1. 打开开发者工具 → Network 面板
2. 勾选 "Offline" 模拟断网
3. 点击 "Continue with GitHub" 按钮

**预期结果**:
- [ ] 页面显示错误提示 "GitHub login failed"
- [ ] 错误描述显示 "Unable to start GitHub authorization. Please try again."
- [ ] 页面不崩溃，用户可以重试

---

## 测试用例 10: Terms Expired 处理

**目的**: 验证 terms 过期时的处理

**前提**: 后端配置 terms 版本过期

**步骤**:
1. 使用 GitHub 登录一个 terms 已过期的账号

**预期结果**:
- [ ] 回调页正常处理 token
- [ ] 弹出 Terms of Service 对话框
- [ ] 用户必须接受条款才能继续
- [ ] 拒绝条款后跳转到登录页

---

## 测试用例 11: 亮暗主题切换

**目的**: 验证两个主题下 UI 正确显示

**步骤**:
1. 打开 `http://localhost:5173/login`
2. 检查亮色主题下的 GitHub 按钮
3. 切换到暗色主题
4. 检查暗色主题下的 GitHub 按钮

**预期结果**:
- [ ] 亮色主题：按钮边框深色，文字深色，背景白色
- [ ] 暗色主题：按钮边框浅色，文字浅色，背景深色
- [ ] hover 效果在两个主题下都正常

---

## 测试用例 12: 移动端响应式

**目的**: 验证移动端显示正常

**步骤**:
1. 打开开发者工具
2. 切换到移动端模拟（如 iPhone 14）
3. 访问 `http://localhost:5173/login`

**预期结果**:
- [ ] GitHub 按钮完整显示，不被截断
- [ ] 按钮宽度适应屏幕
- [ ] 点击区域足够大（至少 44px 高度）
- [ ] 文字不换行

---

## 测试用例 13: Token 刷新机制

**目的**: 验证 OAuth 登录后 token 刷新正常

**步骤**:
1. 通过 GitHub 登录
2. 等待 accessToken 过期（或手动修改 localStorage 中的过期时间）
3. 执行需要认证的操作（如访问 Dashboard）

**预期结果**:
- [ ] 自动使用 refreshToken 刷新 accessToken
- [ ] 用户无感知，操作正常继续
- [ ] localStorage 中的 token 已更新

---

## 测试用例 14: 并发请求防护

**目的**: 验证多个并发请求时 token 刷新不会重复

**步骤**:
1. 通过 GitHub 登录
2. 让 accessToken 过期
3. 同时触发多个 API 请求（如快速切换页面）

**预期结果**:
- [ ] 只发送 1 个 refresh 请求
- [ ] 所有并发请求使用同一个新 token
- [ ] 不会出现 "Thundering Herd" 问题

---

## 测试用例 15: 登出后 OAuth 状态清理

**目的**: 验证登出后 OAuth 相关状态被清理

**步骤**:
1. 通过 GitHub 登录
2. 点击登出按钮
3. 检查 localStorage

**预期结果**:
- [ ] localStorage 中的 `ctt_access_token` 被清除
- [ ] localStorage 中的 `ctt_refresh_token` 被清除
- [ ] localStorage 中的 `ctt_user_id` 被清除
- [ ] 页面跳转到登录页
- [ ] 可以重新通过 GitHub 登录

---

## 已知限制

1. **GitHub 绑定状态**: 当前 "Not connected" 是硬编码，需要后端 API 支持才能显示实际绑定状态
2. **AUTH_019 处理**: 错误页显示 "Terms of service need to be accepted"，但没有自动跳转到条款页面
3. **AUTH_017/AUTH_018**: 这些错误码仅在解绑场景出现，当前前端未实现解绑功能

---

## 测试完成检查表

| 测试用例 | 状态 | 备注 |
|---------|------|------|
| 1. GitHub 按钮显示 | ⬜ | |
| 2. 授权页面跳转 | ⬜ | |
| 3. 授权成功回调 | ⬜ | |
| 4. 授权拒绝处理 | ⬜ | |
| 5. 错误码显示 | ⬜ | |
| 6. Open Redirect 防护 | ⬜ | |
| 7. GitHub 绑定按钮 | ⬜ | |
| 8. 重复点击防护 | ⬜ | |
| 9. 网络错误处理 | ⬜ | |
| 10. Terms Expired | ⬜ | |
| 11. 亮暗主题 | ⬜ | |
| 12. 移动端响应式 | ⬜ | |
| 13. Token 刷新 | ⬜ | |
| 14. 并发请求防护 | ⬜ | |
| 15. 登出状态清理 | ⬜ | |

---

## 问题报告格式

如发现问题，请按以下格式报告:

```
**测试用例**: [编号]
**问题描述**: [简要描述]
**复现步骤**: 
1. [步骤1]
2. [步骤2]
**预期结果**: [应该发生什么]
**实际结果**: [实际发生了什么]
**截图**: [如有]
**浏览器**: [Chrome/Firefox/Safari]
**版本**: [浏览器版本]
```
