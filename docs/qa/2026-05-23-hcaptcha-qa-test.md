# hCaptcha 集成 QA 测试文档

**项目**: Code Time Tracker (ctt-web)  
**版本**: 0.7.6  
**日期**: 2026-05-23  
**测试范围**: hCaptcha 人机验证集成（前端 + 后端）

---

## 目录

1. [测试环境准备](#1-测试环境准备)
2. [前端组件测试](#2-前端组件测试)
3. [表单集成测试](#3-表单集成测试)
4. [配置加载测试](#4-配置加载测试)
5. [错误处理测试](#5-错误处理测试)
6. [后端集成测试](#6-后端集成测试)
7. [浏览器兼容性测试](#7-浏览器兼容性测试)
8. [性能测试](#8-性能测试)
9. [安全测试](#9-安全测试)
10. [边界情况测试](#10-边界情况测试)

---

## 1. 测试环境准备

### 1.1 前端环境

**测试站点密钥（hCaptcha 官方提供）**:
- 正常通过: `10000000-ffff-ffff-ffff-000000000001`
- 始终失败: `10000000-ffff-ffff-ffff-000000000002`

**配置方式**:
```bash
# 后端 application.yml
ctt:
  captcha:
    enabled: true
    site-key: 10000000-ffff-ffff-ffff-000000000001
    secret-key: 0x0000000000000000000000000000000000000000
```

### 1.2 后端环境

**验证端点**: `POST https://api.hcaptcha.com/siteverify`

**测试密钥**:
- 正常通过: `0x0000000000000000000000000000000000000000`
- 始终失败: `0x0000000000000000000000000000000000000001`

---

## 2. 前端组件测试

### 2.1 CaptchaWidget.vue 组件

**文件位置**: `src/components/CaptchaWidget.vue`

#### 测试用例 2.1.1: 基本渲染

**前置条件**:
- 后端 `captcha.enabled = true`
- `captchaSiteKey` 有效

**测试步骤**:
1. 访问登录页面 `/login`
2. 观察密码输入框下方

**预期结果**:
- [ ] hCaptcha 组件正常渲染
- [ ] 显示 hCaptcha 复选框
- [ ] 组件高度约 78px（标准尺寸）

#### 测试用例 2.1.2: 验证成功

**测试步骤**:
1. 访问登录页面 `/login`
2. 勾选 hCaptcha 复选框
3. 完成图片验证（如果有）
4. 观察复选框状态

**预期结果**:
- [ ] 复选框显示绿色勾选
- [ ] 验证令牌已生成（可通过 Vue DevTools 查看 `captchaToken` ref）

#### 测试用例 2.1.3: 验证令牌过期

**测试步骤**:
1. 完成 hCaptcha 验证
2. 等待约 120 秒（令牌有效期）
3. 观察组件状态

**预期结果**:
- [ ] 令牌自动过期
- [ ] 组件触发 `expire` 事件
- [ ] `captchaToken` 重置为 `null`

#### 测试用例 2.1.4: 手动重置

**测试步骤**:
1. 完成 hCaptcha 验证
2. 调用 `captchaRef.value.reset()` 方法

**预期结果**:
- [ ] hCaptcha 组件重置为未验证状态
- [ ] `captchaToken` 重置为 `null`

---

## 3. 表单集成测试

### 3.1 登录表单 (LoginForm.vue)

**文件位置**: `src/features/auth/components/LoginForm.vue`

#### 测试用例 3.1.1: hCaptcha 显示条件

**测试步骤**:
1. 后端配置 `captcha.enabled = true`
2. 访问 `/login`

**预期结果**:
- [ ] hCaptcha 组件显示在密码框和提交按钮之间
- [ ] 无 `captchaSiteKey` 时组件不显示

#### 测试用例 3.1.2: 登录成功（带验证码）

**测试步骤**:
1. 输入有效邮箱和密码
2. 完成 hCaptcha 验证
3. 点击 "Sign in"

**预期结果**:
- [ ] 表单提交成功
- [ ] 请求体包含 `captchaToken` 字段
- [ ] 跳转到 Dashboard 或指定页面

#### 测试用例 3.1.3: 登录失败后重置验证码

**测试步骤**:
1. 输入错误密码
2. 完成 hCaptcha 验证
3. 点击 "Sign in"
4. 等待错误提示

**预期结果**:
- [ ] 登录失败
- [ ] hCaptcha 自动重置（可再次验证）
- [ ] 错误提示正常显示

#### 测试用例 3.1.4: 未完成验证码提交

**测试步骤**:
1. 输入有效邮箱和密码
2. 不勾选 hCaptcha
3. 点击 "Sign in"

**预期结果**:
- [ ] 表单提交（前端不拦截）
- [ ] 后端返回错误码 `SECURITY_006` 或 `SECURITY_007`
- [ ] 前端显示相应错误提示

---

### 3.2 注册表单 (RegisterForm.vue)

**文件位置**: `src/features/auth/components/RegisterForm.vue`

#### 测试用例 3.2.1: hCaptcha 显示位置

**测试步骤**:
1. 访问 `/register`

**预期结果**:
- [ ] hCaptcha 显示在 "I agree to Terms" 复选框和 "Create account" 按钮之间
- [ ] 布局无错位

#### 测试用例 3.2.2: 注册成功（带验证码）

**测试步骤**:
1. 填写所有必填字段
2. 勾选 "I agree to Terms"
3. 完成 hCaptcha 验证
4. 点击 "Create account"

**预期结果**:
- [ ] 注册成功
- [ ] 请求体包含 `captchaToken` 字段
- [ ] 跳转到注册成功页面

---

### 3.3 忘记密码表单 (ForgotPasswordForm.vue)

**文件位置**: `src/features/auth/components/ForgotPasswordForm.vue`

#### 测试用例 3.3.1: hCaptcha 显示位置

**测试步骤**:
1. 访问 `/forgot-password`

**预期结果**:
- [ ] hCaptcha 显示在邮箱输入框和 "Send reset link" 按钮之间

#### 测试用例 3.3.2: 发送重置链接成功

**测试步骤**:
1. 输入有效邮箱
2. 完成 hCaptcha 验证
3. 点击 "Send reset link"

**预期结果**:
- [ ] 请求成功发送
- [ ] 请求体包含 `captchaToken` 字段
- [ ] 跳转到忘记密码成功页面

---

### 3.4 重置密码表单 (ResetPasswordForm.vue)

**文件位置**: `src/features/auth/components/ResetPasswordForm.vue`

#### 测试用例 3.4.1: 无 hCaptcha

**测试步骤**:
1. 通过邮件链接访问 `/reset-password?token=xxx`

**预期结果**:
- [ ] 无 hCaptcha 组件显示
- [ ] 仅显示新密码和确认密码字段
- [ ] 表单正常提交（无需验证码）

**说明**: 重置密码使用邮件中的令牌保护，无需人机验证。

---

## 4. 配置加载测试

### 4.1 PublicConfig API

**端点**: `GET /api/v1/config/public`

#### 测试用例 4.1.1: 配置返回 captchaSiteKey

**测试步骤**:
1. 启动后端服务
2. 访问 `GET /api/v1/config/public`

**预期结果**:
- [ ] 响应包含 `captchaSiteKey` 字段
- [ ] `captchaSiteKey` 为字符串或 `null`
- [ ] 验证通过（Zod Schema 校验）

**示例响应**:
```json
{
  "code": "SUCCESS",
  "message": "OK",
  "data": {
    "termsVersion": "1.0.0",
    "captchaSiteKey": "10000000-ffff-ffff-ffff-000000000001"
  }
}
```

#### 测试用例 4.1.2: captchaSiteKey 为 null（禁用验证码）

**测试步骤**:
1. 后端配置 `captcha.enabled = false`
2. 访问 `GET /api/v1/config/public`

**预期结果**:
- [ ] `captchaSiteKey` 为 `null`
- [ ] 前端不显示 hCaptcha 组件

---

## 5. 错误处理测试

### 5.1 后端错误码

#### 测试用例 5.1.1: SECURITY_006 — 验证码缺失

**测试步骤**:
1. 使用 curl 或 Postman 直接调用登录 API
2. 不传 `captchaToken` 字段

**预期结果**:
- [ ] 返回 HTTP 400
- [ ] 错误码: `SECURITY_006`
- [ ] 错误信息: "Captcha token is required"

#### 测试用例 5.1.2: SECURITY_007 — 验证码验证失败

**测试步骤**:
1. 使用测试站点密钥 `10000000-ffff-ffff-ffff-000000000002`（始终失败）
2. 完成 hCaptcha 验证
3. 提交登录表单

**预期结果**:
- [ ] 后端验证失败
- [ ] 返回 HTTP 400
- [ ] 错误码: `SECURITY_007`
- [ ] 错误信息: "Captcha verification failed"

#### 测试用例 5.1.3: 验证码令牌过期

**测试步骤**:
1. 完成 hCaptcha 验证
2. 等待 120 秒（令牌有效期）
3. 提交表单

**预期结果**:
- [ ] 后端验证失败（令牌过期）
- [ ] 返回 HTTP 400
- [ ] 错误码: `SECURITY_007`

---

### 5.2 前端错误处理

#### 测试用例 5.2.1: hCaptcha 加载失败

**测试步骤**:
1. 断开网络连接（或屏蔽 `hcaptcha.com` 域名）
2. 访问登录页面

**预期结果**:
- [ ] hCaptcha 组件不显示或显示加载错误
- [ ] 表单仍可提交（降级处理）
- [ ] 后端根据配置决定是否强制要求验证码

#### 测试用例 5.2.2: hCaptcha 服务不可用

**测试步骤**:
1. 模拟 hCaptcha 服务返回错误
2. 尝试完成验证

**预期结果**:
- [ ] 触发 `error` 事件
- [ ] `captchaToken` 保持 `null`
- [ ] 用户可重试

---

## 6. 后端集成测试

### 6.1 CaptchaService

#### 测试用例 6.1.1: 验证成功

**测试步骤**:
1. 使用有效令牌调用 `CaptchaService.verify()`
2. 传入用户 IP 地址

**预期结果**:
- [ ] 返回 `true`
- [ ] 调用 `https://api.hcaptcha.com/siteverify`
- [ ] 请求包含 `secret`、`response`、`remoteip` 参数

#### 测试用例 6.1.2: 验证失败（无效令牌）

**测试步骤**:
1. 使用无效令牌调用 `CaptchaService.verify()`

**预期结果**:
- [ ] 返回 `false`
- [ ] 不抛出异常

#### 测试用例 6.1.3: 超时处理

**测试步骤**:
1. 模拟 hCaptcha 服务超时（>5 秒）
2. 调用 `CaptchaService.verify()`

**预期结果**:
- [ ] 返回 `false`（降级处理）
- [ ] 不阻塞请求
- [ ] 记录警告日志

---

### 6.2 认证端点集成

#### 测试用例 6.2.1: 登录端点

**端点**: `POST /api/v1/auth/login`

**请求体**:
```json
{
  "email": "test@example.com",
  "password": "ValidPass123!",
  "captchaToken": "10000000-ffff-ffff-ffff-000000000001"
}
```

**预期结果**:
- [ ] 验证码验证通过后才进行业务逻辑
- [ ] 验证码验证失败返回 400 + SECURITY_007

#### 测试用例 6.2.2: 注册端点

**端点**: `POST /api/v1/auth/register`

**请求体**:
```json
{
  "email": "new@example.com",
  "displayName": "Test User",
  "password": "ValidPass123!",
  "termsVersion": "1.0.0",
  "captchaToken": "10000000-ffff-ffff-ffff-000000000001"
}
```

**预期结果**:
- [ ] 验证码验证通过后才创建用户
- [ ] 验证码验证失败返回 400 + SECURITY_007

#### 测试用例 6.2.3: 忘记密码端点

**端点**: `POST /api/v1/auth/forgot-password`

**请求体**:
```json
{
  "email": "user@example.com",
  "captchaToken": "10000000-ffff-ffff-ffff-000000000001"
}
```

**预期结果**:
- [ ] 验证码验证通过后才发送重置邮件
- [ ] 验证码验证失败返回 400 + SECURITY_007

#### 测试用例 6.2.4: 重置密码端点（无验证码）

**端点**: `POST /api/v1/auth/password-reset/confirm`

**请求体**:
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewValidPass123!"
}
```

**预期结果**:
- [ ] 无需 `captchaToken` 字段
- [ ] 使用邮件令牌保护
- [ ] 正常重置密码

---

## 7. 浏览器兼容性测试

### 7.1 桌面浏览器

| 浏览器 | 版本 | 测试结果 | 备注 |
|--------|------|----------|------|
| Chrome | 最新版 | ⬜ 待测试 | |
| Firefox | 最新版 | ⬜ 待测试 | |
| Safari | 最新版 | ⬜ 待测试 | |
| Edge | 最新版 | ⬜ 待测试 | |

### 7.2 移动浏览器

| 浏览器 | 设备 | 测试结果 | 备注 |
|--------|------|----------|------|
| Chrome Mobile | Android | ⬜ 待测试 | |
| Safari Mobile | iOS | ⬜ 待测试 | |
| 微信内置浏览器 | Android/iOS | ⬜ 待测试 | 中国用户常用 |
| QQ 浏览器 | Android/iOS | ⬜ 待测试 | |

### 7.3 测试要点

- [ ] hCaptcha iframe 正常加载
- [ ] 触摸操作正常（移动端）
- [ ] 键盘导航正常（Tab 键切换）
- [ ] 屏幕阅读器兼容性

---

## 8. 性能测试

### 8.1 加载性能

#### 测试用例 8.1.1: hCaptcha 脚本加载时间

**测试步骤**:
1. 打开 Chrome DevTools → Network
2. 访问登录页面
3. 记录 `hcaptcha.com/api.js` 加载时间

**预期结果**:
- [ ] 脚本大小 < 100KB（gzip）
- [ ] 加载时间 < 2 秒（正常网络）
- [ ] 不阻塞页面渲染

#### 测试用例 8.1.2: 页面加载影响

**测试步骤**:
1. 使用 Lighthouse 审计登录页面
2. 对比有/无 hCaptcha 的性能分数

**预期结果**:
- [ ] Performance 分数下降 < 5 分
- [ ] First Contentful Paint 无明显延迟
- [ ] Largest Contentful Paint 无明显延迟

---

## 9. 安全测试

### 9.1 前端安全

#### 测试用例 9.1.1: 站点密钥暴露

**测试步骤**:
1. 查看页面源代码
2. 搜索 `sitekey` 属性

**预期结果**:
- [ ] 站点密钥可见（这是正常的，站点密钥设计为公开）
- [ ] 无 secret-key 暴露

#### 测试用例 9.1.2: 绕过前端验证

**测试步骤**:
1. 使用 curl 直接调用 API
2. 不传 `captchaToken`

**预期结果**:
- [ ] 后端拒绝请求
- [ ] 返回 `SECURITY_006` 错误

### 9.2 后端安全

#### 测试用例 9.2.1: 重放攻击

**测试步骤**:
1. 获取一个有效令牌
2. 使用同一令牌多次提交

**预期结果**:
- [ ] 第一次提交成功
- [ ] 后续提交失败（令牌已使用）

#### 测试用例 9.2.2: 伪造令牌

**测试步骤**:
1. 使用随机字符串作为 `captchaToken`
2. 提交表单

**预期结果**:
- [ ] 后端验证失败
- [ ] 返回 `SECURITY_007` 错误

---

## 10. 边界情况测试

### 10.1 网络异常

#### 测试用例 10.1.1: 弱网环境

**测试步骤**:
1. Chrome DevTools → Network → Throttle → Slow 3G
2. 访问登录页面
3. 尝试完成 hCaptcha 验证

**预期结果**:
- [ ] hCaptcha 最终加载完成
- [ ] 验证过程可完成（可能较慢）
- [ ] 无超时错误

#### 测试用例 10.1.2: 网络中断

**测试步骤**:
1. 完成 hCaptcha 验证
2. 断开网络
3. 提交表单

**预期结果**:
- [ ] 前端显示网络错误
- [ ] hCaptcha 令牌仍有效（未过期）
- [ ] 恢复网络后可重新提交

### 10.2 用户操作

#### 测试用例 10.2.1: 快速连续点击

**测试步骤**:
1. 快速连续点击 hCaptcha 复选框多次

**预期结果**:
- [ ] 无重复验证弹窗
- [ ] 组件状态正常

#### 测试用例 10.2.2: 页面刷新

**测试步骤**:
1. 完成 hCaptcha 验证
2. 刷新页面

**预期结果**:
- [ ] hCaptcha 重置为未验证状态
- [ ] 令牌失效

#### 测试用例 10.2.3: 表单重置

**测试步骤**:
1. 完成 hCaptcha 验证
2. 点击表单重置按钮（如果有）

**预期结果**:
- [ ] hCaptcha 重置
- [ ] 令牌清空

---

## 测试检查清单

### 前端检查

- [ ] CaptchaWidget.vue 正确渲染
- [ ] LoginForm.vue 集成正确
- [ ] RegisterForm.vue 集成正确
- [ ] ForgotPasswordForm.vue 集成正确
- [ ] ResetPasswordForm.vue 无 hCaptcha
- [ ] PublicConfig 正确加载 captchaSiteKey
- [ ] 错误处理正常（SECURITY_006/007）

### 后端检查

- [ ] CaptchaService 验证逻辑正确
- [ ] 登录端点集成正确
- [ ] 注册端点集成正确
- [ ] 忘记密码端点集成正确
- [ ] 重置密码端点无需验证码
- [ ] 错误码返回正确

### 浏览器检查

- [ ] Chrome 测试通过
- [ ] Firefox 测试通过
- [ ] Safari 测试通过
- [ ] Edge 测试通过
- [ ] 移动端测试通过

---

## 测试报告模板

**测试人员**: ____________  
**测试日期**: ____________  
**测试环境**: ____________  

| 测试项 | 预期结果 | 实际结果 | 是否通过 | 备注 |
|--------|----------|----------|----------|------|
| | | | | |

**总体结论**: ⬜ 通过 / ⬜ 不通过  
**备注**: ____________

---

## 附录

### A. hCaptcha 测试密钥

| 类型 | 站点密钥 | 密钥 |
|------|----------|------|
| 正常通过 | `10000000-ffff-ffff-ffff-000000000001` | `0x0000000000000000000000000000000000000000` |
| 始终失败 | `10000000-ffff-ffff-ffff-000000000002` | `0x0000000000000000000000000000000000000001` |

### B. 后端错误码

| 错误码 | 含义 | HTTP 状态码 |
|--------|------|-------------|
| `SECURITY_006` | 验证码缺失 | 400 |
| `SECURITY_007` | 验证码验证失败 | 400 |

### C. 相关文件

**前端**:
- `src/components/CaptchaWidget.vue` — hCaptcha 包装组件
- `src/lib/api/config.ts` — PublicConfig Schema
- `src/features/auth/components/LoginForm.vue` — 登录表单
- `src/features/auth/components/RegisterForm.vue` — 注册表单
- `src/features/auth/components/ForgotPasswordForm.vue` — 忘记密码表单

**后端**:
- `CaptchaService.java` — 验证码服务
- `application.yml` — 配置文件
- `AuthController.java` — 认证控制器

---

**文档版本**: 1.0  
**最后更新**: 2026-05-23
