# Plan: Terms of Service Acceptance Tracking (Frontend Only)

**Date**: 2026-05-02
**Status**: in-progress (data layer complete, UI integration pending)
**Version**: v0.5.84 (P0) + v0.5.85 (P1)
**Last Updated**: 2026-05-03 (implementation audit)

---

## Objective

实现服务条款（Terms of Service）的前端追踪机制：

- 注册时从后端获取条款版本并发送
- 登录时根据 `termsExpired` 决定是否弹条款对话框
- 条款过期时拦截 403，弹窗同意后重放失败请求

---

## Architecture (Frontend Perspective)

### 前端职责

| 组件     | 职责       | 实现方式                                         |
| -------- | ---------- | ------------------------------------------------ |
| 条款内容 | 展示       | 前端 i18n (`locales/zh.json`)                    |
| 当前版本 | 从后端获取 | `GET /api/v1/config/public` → `{ termsVersion }` |
| 注册发送 | 附加版本   | RegisterRequest 含 `termsVersion`                |
| 登录处理 | 检查过期   | AuthResponse 含 `termsExpired`                   |
| 过期拦截 | 弹窗同意   | interceptor 处理 403 TERMS_EXPIRED               |

### 后端依赖（参考后端计划）

| 接口                         | 说明                    | 状态       |
| ---------------------------- | ----------------------- | ---------- |
| `GET /api/v1/config/public`  | 返回当前条款版本        | 需后端完成 |
| `POST /api/v1/auth/register` | 注册时校验 termsVersion | 需后端完成 |
| `POST /api/v1/auth/login`    | 返回 termsExpired       | 需后端完成 |
| `POST /api/v1/terms/accept`  | 同意后返回新 JWT        | 需后端完成 |

---

## P0: 基础实现

### 1. 前端 API 层

**文件**: `src/lib/api/config.ts` (新建)

```typescript
import { ofetch } from 'ofetch'
import { z } from 'zod'

const PublicConfigSchema = z.object({
  termsVersion: z.string(),
})

export async function getPublicConfig() {
  const data = await ofetch('/api/v1/config/public')
  return PublicConfigSchema.parse(data)
}
```

**文件**: `src/lib/schemas/auth.schema.ts`

```typescript
// RegisterRequestSchema 新增 termsVersion
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(50),
  password: z.string().min(8),
  termsVersion: z.string(), // 新增
})

// 新增 AuthResponseSchema
export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  termsExpired: z.boolean(),
})
```

### 2. 前端注册流程改造

**文件**: `src/features/auth/views/RegisterView.vue`

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPublicConfig } from '@/lib/api/config'
import { useAuthStore } from '@/stores/auth'

const termsVersion = ref<string>('')
const authStore = useAuthStore()

onMounted(async () => {
  const config = await getPublicConfig()
  termsVersion.value = config.termsVersion
})

async function handleSubmit(data: { email: string; displayName: string; password: string }) {
  await authStore.register({
    ...data,
    termsVersion: termsVersion.value,
  })
}
</script>
```

### 3. 前端登录响应处理

**文件**: `src/stores/auth.ts`

```typescript
async login(credentials: LoginCredentials) {
  const response = await authApi.login(credentials)
  // AuthResponse 含 termsExpired
  if (response.termsExpired) {
    // 标记需要同意条款
    this.termsExpired = true
    // 不跳转，先弹条款对话框
    return
  }
  // 正常跳转
  this.setTokens(response.accessToken, response.refreshToken)
  router.push('/dashboard')
}
```

---

## P1: 条款过期拦截

### 1. 前端同意条款 API

**文件**: `src/lib/api/auth.ts`

```typescript
export async function acceptTerms(): Promise<AuthResponse> {
  const response = await apiFetch<unknown>('/api/v1/terms/accept', { method: 'POST' })
  const wrapped = RestApiResponseSchema.parse(response)
  return AuthResponseSchema.parse(wrapped.data)
}
```

### 2. 前端拦截器处理

**文件**: `src/lib/api/instance.ts`

```typescript
// 在 403 处理中增加 TERMS_EXPIRED
if (response.status === 403) {
  if (errorCode === 'TERMS_EXPIRED') {
    // 弹窗同意 + 重放请求
    return handleTermsExpired(request, options)
  }
  // ... 其他处理
}
```

### 3. 前端 TermsDialog 改造

**文件**: `src/features/auth/components/TermsDialog.vue`

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPublicConfig } from '@/lib/api/config'

const currentVersion = ref('')

onMounted(async () => {
  const config = await getPublicConfig()
  currentVersion.value = config.termsVersion
})

function open() {
  show.value = true
}

defineExpose({ open })
</script>

<template>
  <Dialog :open="show">
    <DialogContent>
      <DialogTitle>服务条款 (版本 {{ currentVersion }})</DialogTitle>
      <div v-html="termsContent"></div>
      <DialogFooter>
        <Button @click="agree">我同意</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

---

## 实现状态 (2026-05-03 审计)

### 文件级别状态

| 文件                                       | 阶段 | 状态        | 详情                                                                              |
| ------------------------------------------ | ---- | ----------- | --------------------------------------------------------------------------------- |
| `lib/api/config.ts`                        | P0   | ✅ 完全实现 | 新建文件，包含 `PublicConfigSchema` 和 `getPublicConfig()`                        |
| `lib/schemas/auth.schema.ts`               | P0   | ✅ 完全实现 | `RegisterRequestSchema` 含 `termsVersion`，`AuthResponseSchema` 含 `termsExpired` |
| `features/auth/views/RegisterView.vue`     | P0   | ✅ 完全实现 | `onMounted` 获取 `termsVersion`，`handleSubmit` 发送                              |
| `stores/auth.ts`                           | P0   | ❌ 未实现   | login 流程未处理 `termsExpired`，仍使用 `LoginResponseSchema`                     |
| `lib/api/auth.ts`                          | P1   | ✅ 完全实现 | `acceptTerms()` 函数已实现                                                        |
| `lib/api/instance.ts`                      | P1   | ⚠️ 部分实现 | 检测到 `TERMS_EXPIRED` 但仅 `console.warn`，无 UI 触发机制                        |
| `features/auth/components/TermsDialog.vue` | P1   | ✅ 完全实现 | 获取并显示版本号                                                                  |

### 功能级别状态

| 功能                      | 状态        | 缺失内容                               |
| ------------------------- | ----------- | -------------------------------------- |
| 注册获取并发送条款版本    | ✅ 完成     | 无                                     |
| 登录时检查 `termsExpired` | ❌ 未完成   | `stores/auth.ts` 未处理 `termsExpired` |
| 403 TERMS_EXPIRED 拦截    | ⚠️ 部分完成 | 检测到错误码但无 UI 触发               |
| TermsDialog 版本显示      | ✅ 完成     | 无                                     |
| 同意条款后 token 刷新     | ❌ 未完成   | `acceptTerms()` 返回 token 但未存储    |
| 失败请求重放              | ❌ 未完成   | 无请求缓存和重放机制                   |
| TermsDialog 同意按钮      | ❌ 未完成   | 无 "Accept" 按钮绑定 `acceptTerms()`   |

### Git 状态

- **分支**: `develop` at `34bbc43`
- **未提交改动**: 6 files changed, +66/-3 lines
- **已实现但未提交**: config.ts, auth.schema.ts, RegisterView.vue, auth.ts, instance.ts, TermsDialog.vue

---

## 文件清单 (Frontend Only)

| 文件                                       | 操作 | 阶段 |
| ------------------------------------------ | ---- | ---- |
| `lib/api/config.ts`                        | 新建 | P0   |
| `lib/schemas/auth.schema.ts`               | 修改 | P0   |
| `features/auth/views/RegisterView.vue`     | 修改 | P0   |
| `stores/auth.ts`                           | 修改 | P0   |
| `lib/api/auth.ts`                          | 修改 | P1   |
| `lib/api/instance.ts`                      | 修改 | P1   |
| `features/auth/components/TermsDialog.vue` | 修改 | P1   |

---

## 成功标准

### P0

- [x] 前端注册页自动获取条款版本并发送
- [ ] 前端登录时根据 `termsExpired` 决定是否弹条款对话框

### P1

- [ ] 前端拦截 403 TERMS_EXPIRED，弹窗同意后重放失败请求
- [x] TermsDialog 支持版本显示

### 待补充标准

- [ ] 登录流程正确处理 `termsExpired`（store/auth.ts）
- [ ] 403 TERMS_EXPIRED 触发 TermsDialog 显示
- [ ] TermsDialog 同意按钮调用 `acceptTerms()` 并存储新 token
- [ ] 失败请求在同意后自动重放

---

## 风险与注意事项

1. **后端依赖**: 前端 P0 依赖后端完成 `GET /api/v1/config/public` 和注册流程改造
2. **部署顺序**: 后端先部署 → 前端后部署
3. **请求缓存**: 前端拦截器需缓存 403 期间的失败请求

---

## 待完成工作

### P0 缺失

1. **`stores/auth.ts` — login 流程处理 `termsExpired`**
   - 当前 login 使用 `LoginResponseSchema`（不含 `termsExpired`）
   - 需改为使用 `AuthResponseSchema` 或添加后检查逻辑
   - 当 `termsExpired === true` 时：不跳转 dashboard，显示 TermsDialog

### P1 缺失

2. **`lib/api/instance.ts` — TERMS_EXPIRED UI 触发机制**
   - 当前仅 `console.warn`，无实际 UI 交互
   - 需添加触发机制（参考现有 `UNAUTHORIZED_EVENT` 模式）
   - 方案：自定义事件 / Pinia store flag / 回调注册

3. **TermsDialog — 同意按钮绑定**
   - 当前无 "Accept" 按钮调用 `acceptTerms()`
   - 同意后需存储新 token（`setAuth()`）
   - 关闭对话框并恢复用户操作

4. **`lib/api/instance.ts` — 失败请求缓存与重放**
   - 缓存 TERMS_EXPIRED 期间的原始请求
   - 同意后重放失败请求
   - 处理重放失败/成功两种情况

### 端到端流程验证

5. **完整流程测试**
   - 登录返回 `termsExpired` → 显示 TermsDialog → 用户同意 → `acceptTerms()` → 新 token 存储 → 跳转 dashboard
   - API 调用返回 403 TERMS_EXPIRED → 缓存请求 → 显示 TermsDialog → 用户同意 → `acceptTerms()` → 重放原始请求

---

## 参考

- 后端计划: `../ctt-server/docs/plans/2026-05-02-terms-acceptance.md`
- 讨论时间: 2026-05-02
- 决策: 前后端职责分离，后端为版本权威
