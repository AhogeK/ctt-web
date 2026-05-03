# Plan: Terms of Service Acceptance Tracking (Frontend Only)

**Date**: 2026-05-02
**Status**: completed
**Version**: v0.6.0
**Last Updated**: 2026-05-03 (post-commit audit)

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
| `stores/auth.ts`                           | P0   | ✅ 完全实现 | login 检查 `termsExpired`，为 true 时 dispatch `TERMS_EXPIRED_EVENT`              |
| `lib/api/auth.ts`                          | P1   | ✅ 完全实现 | `acceptTerms()` 函数已实现                                                        |
| `lib/api/instance.ts`                      | P1   | ✅ 完全实现 | `TERMS_EXPIRED_EVENT` + 请求队列 + `resolveTermsQueue()`/`rejectTermsQueue()`     |
| `features/auth/components/TermsDialog.vue` | P1   | ✅ 完全实现 | Accept/Decline 按钮 + `acceptTerms()` API + loading + toast + emit                |

### 功能级别状态

| 功能                      | 状态      | 缺失内容                               |
| ------------------------- | --------- | -------------------------------------- |
| 注册获取并发送条款版本    | ✅ 完成   | 无                                     |
| 登录时检查 `termsExpired` | ❌ 未完成 | `stores/auth.ts` 未处理 `termsExpired` |
| 403 TERMS_EXPIRED 拦截    | ✅ 完成   | 无                                     |
| TermsDialog 版本显示      | ✅ 完成   | 无                                     |
| 同意条款后 token 刷新     | ✅ 完成   | 无                                     |
| 失败请求重放              | ✅ 完成   | 无                                     |
| TermsDialog 同意按钮      | ✅ 完成   | 无                                     |

### Git 状态

- **分支**: `develop` at `f4af3c8`, `master` at `3b4899a`
- **版本**: 0.6.0
- **状态**: working tree clean, 所有改动已提交并推送
- **提交**: 5 commits on develop, 4 cherry-picked to master

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
- [x] 前端登录时根据 `termsExpired` 决定是否弹条款对话框

### P1

- [x] 前端拦截 403 TERMS_EXPIRED，弹窗同意后重放失败请求
- [x] TermsDialog 支持版本显示

### 待补充标准

- [x] 登录流程正确处理 `termsExpired`（store/auth.ts）
- [x] 403 TERMS_EXPIRED 触发 TermsDialog 显示
- [x] TermsDialog 同意按钮调用 `acceptTerms()` 并存储新 token
- [x] 失败请求在同意后自动重放

---

## 风险与注意事项

1. **后端依赖**: 前端 P0 依赖后端完成 `GET /api/v1/config/public` 和注册流程改造
2. **部署顺序**: 后端先部署 → 前端后部署
3. **请求缓存**: 前端拦截器需缓存 403 期间的失败请求

---

## 待完成工作

### ✅ 全部完成

所有计划项已实现：

- `LoginResponseSchema` 添加 `termsExpired` 字段（默认 false）
- `stores/auth.ts` login 检查 `termsExpired`，为 true 时 dispatch `TERMS_EXPIRED_EVENT`
- `instance.ts` 403 TERMS_EXPIRED 处理 + 请求队列
- `TermsDialog.vue` Accept/Decline 按钮 + `acceptTerms()` API
- `App.vue` 事件监听 + TermsDialog 集成

### 端到端流程验证

5. **完整流程测试**
   - 登录返回 `termsExpired` → 显示 TermsDialog → 用户同意 → `acceptTerms()` → 新 token 存储 → 跳转 dashboard
   - API 调用返回 403 TERMS_EXPIRED → 缓存请求 → 显示 TermsDialog → 用户同意 → `acceptTerms()` → 重放原始请求

---

## 参考

- 后端计划: `../ctt-server/docs/plans/2026-05-02-terms-acceptance.md`
- 讨论时间: 2026-05-02
- 决策: 前后端职责分离，后端为版本权威
