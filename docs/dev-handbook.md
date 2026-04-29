# 开发手册

> ctt-web 项目开发指南 — 路由、API、测试与提交规范

## 1. 如何新增路由

### 1.1 路由架构概述

项目使用 **基于特性的路由模块自动发现机制**：

- `src/router/index.ts` 通过 `import.meta.glob('./modules/*.ts', { eager: true })` 自动加载 `src/router/modules/` 下所有模块文件，无需手动在 `index.ts` 中注册
- **常量路由**（`index.ts` 内联）：首页 `/`、404 `/:pathMatch(.*)*` 等顶级路由
- **特性路由**（`modules/` 目录）：按功能模块组织（auth、dashboard、settings 等）

路由实例创建后自动调用 `setupRouterGuards(router)` 设置全局守卫，包含：

- 文档标题自动设置：`{meta.title} - CTT`
- NProgress 进度条
- 认证守卫：`requiresAuth: true` 的路由未登录时重定向到登录页，并携带 `redirect` 查询参数

### 1.2 步骤

1. **在 `src/router/route-names.ts` 中添加路由名称常量**
2. **在 `src/router/modules/` 下新建或编辑模块文件**（如 `features/my-feature.ts`）
3. **创建对应的 View 组件**（`src/features/<feature>/views/<Name>View.vue`）
4. **验证路由可用**：运行 `pnpm dev`，访问对应路径

### 1.3 代码示例

完整的路由模块文件（参考 `settings.ts` 模式）：

```typescript
// src/router/modules/my-feature.ts
import type { RouteRecordRaw } from 'vue-router'
import { RouteNames } from '../route-names'

const myFeatureRoutes: RouteRecordRaw[] = [
  {
    path: '/my-feature',
    name: RouteNames.MY_FEATURE,
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { title: 'My Feature', requiresAuth: true, layout: 'app' },
    children: [
      {
        path: '',
        name: RouteNames.MY_FEATURE_HOME,
        component: () => import('@/features/my-feature/views/HomeView.vue'),
        meta: { title: 'Overview', requiresAuth: true },
      },
      {
        path: 'detail',
        name: RouteNames.MY_FEATURE_DETAIL,
        component: () => import('@/features/my-feature/views/DetailView.vue'),
        meta: { title: 'Detail', requiresAuth: true },
      },
    ],
  },
]

export default myFeatureRoutes
```

对应的 `route-names.ts` 新增：

```typescript
// src/router/route-names.ts
export const RouteNames = {
  // ... existing routes ...

  // My Feature
  MY_FEATURE: 'my-feature',
  MY_FEATURE_HOME: 'my-feature-home',
  MY_FEATURE_DETAIL: 'my-feature-detail',
} as const
```

### 1.4 RouteMeta 类型

在 `src/types/vue-router.d.ts` 中定义，所有可用字段：

| 字段           | 类型              | 必填 | 说明                                |
| -------------- | ----------------- | ---- | ----------------------------------- |
| `title`        | `string`          | 是   | 页面标题，用于浏览器 tab 和导航菜单 |
| `requiresAuth` | `boolean`         | 否   | 是否需要认证，默认 `false`          |
| `roles`        | `string[]`        | 否   | RBAC 角色权限（预留）               |
| `layout`       | `'auth' \| 'app'` | 否   | 使用的布局模板                      |
| `hideInMenu`   | `boolean`         | 否   | 是否在侧边栏隐藏此路由              |

### 1.5 注意事项

- **子路由使用相对路径**：`path: 'profile'` 而非 `path: '/settings/profile'`
- **空路径子路由 `path: ''`** 作为默认子页面（如 dashboard 首页）
- **路由名称必须使用 `RouteNames` 常量**，禁止魔法字符串
- **认证路由的子路由也需设置 `requiresAuth: true`**，守卫会检查每层 meta
- **父路由使用 Layout 组件**（`AppLayout.vue` 或 `AuthLayout.vue`），子路由使用 Feature View 组件
- auth 模块的子路由使用绝对路径（如 `path: '/login'`），这是历史模式，新模块应使用相对路径

---

## 2. 如何新增 API 调用

### 2.1 API 层架构概述

采用 **三层架构**：

```
HTTP Client (apiFetch) → API Functions → Schemas (Zod)
```

- **单一 HTTP 客户端**：`src/lib/api/instance.ts` 导出的 `apiFetch`（基于 ofetch 实例）
- **自动注入 Bearer token**：从 `localStorage` 读取 `ctt_access_token` 并设置 `Authorization` 头
- **全局错误处理**（`onResponseError` 拦截器）：

| 状态码 | 行为                                                         |
| ------ | ------------------------------------------------------------ |
| 401    | 清除 token + toast 提示 + 派发 `api:unauthorized` 自定义事件 |
| 403    | toast 提示 "Permission denied"                               |
| 404    | `console.warn`（交由组件处理）                               |
| 422    | 跳过（由表单验证组件处理）                                   |
| 500+   | toast 提示 "Server error"                                    |

### 2.2 步骤

1. **定义 Zod Schema**（`src/lib/schemas/<domain>.schema.ts`）
2. **创建 API 函数**（`src/lib/api/<domain>.ts`）
3. **导出到 barrel 文件**（`src/lib/api/index.ts`）
4. **在 Store 或 Composable 中消费**

### 2.3 代码示例

完整的三步模式：

```typescript
// 1. Schema 定义 — src/lib/schemas/item.schema.ts
import { z } from 'zod'

export const CreateItemRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID'),
})

export const CreateItemResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  categoryId: z.string().uuid(),
  createdAt: z.string().datetime(),
})

export type CreateItemRequest = z.infer<typeof CreateItemRequestSchema>
export type CreateItemResponse = z.infer<typeof CreateItemResponseSchema>
```

```typescript
// 2. API 函数 — src/lib/api/item.ts
import { apiFetch } from './instance'
import {
  CreateItemRequestSchema,
  CreateItemResponseSchema,
  type CreateItemRequest,
  type CreateItemResponse,
} from '@/lib/schemas/item.schema'

export async function createItem(data: CreateItemRequest): Promise<CreateItemResponse> {
  const validatedRequest = CreateItemRequestSchema.parse(data)

  const response = await apiFetch<CreateItemResponse>('/api/v1/items', {
    method: 'POST',
    body: validatedRequest,
  })

  return CreateItemResponseSchema.parse(response)
}
```

```typescript
// 3. 导出到 barrel — src/lib/api/index.ts
export { apiFetch, type ApiFetchOptions } from './instance'
export { login, logout } from './auth'
export { createItem } from './item'
```

### 2.4 错误处理

API 层的错误处理策略已在 `apiFetch` 实例中全局配置：

- **401 Unauthorized**：自动清除 `ctt_access_token`，显示 toast，派发 `api:unauthorized` 事件。监听方式：
  ```typescript
  globalThis.addEventListener(UNAUTHORIZED_EVENT, () => {
    // Handle unauthorized (e.g., redirect to login)
  })
  ```
- **403 Forbidden**：toast 提示 "Permission denied. You do not have access to this resource."
- **422 Unprocessable Entity**：跳过处理，由 Vee-Validate 表单验证层处理
- **500+ Server Error**：toast 提示 "Server error. Please try again later."

API 函数本身不捕获这些错误，交由调用方（Pinia Store / TanStack Query）处理。

### 2.5 消费方式

**Pinia Store** — 认证/会话相关：

```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import { login } from '@/lib/api'
import type { LoginRequest } from '@/lib/schemas/auth.schema'

export const useAuthStore = defineStore('auth', {
  actions: {
    async login(credentials: LoginRequest) {
      const response = await login(credentials)
      this.setAuth(response)
      return response
    },
  },
})
```

**TanStack Query** — 数据获取（useQuery / useMutation）：

```typescript
// composables/useItems.ts
import { useMutation } from '@tanstack/vue-query'
import { createItem } from '@/lib/api'

export function useCreateItem() {
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      // invalidate queries, show toast, etc.
    },
  })
}
```

配合 `query-keys.ts` 使用类型安全的缓存键进行缓存失效管理。

### 2.6 通用 Schema 工具

`src/lib/schemas/api.schema.ts` 提供通用响应包装工厂：

```typescript
// 标准响应包装
import { createApiResponseSchema, createPagedResponseSchema } from '@/lib/schemas/api.schema'

const UserResponseSchema = createApiResponseSchema(UserSchema)
// Validates: { code: 0, message: "Success", data: { ...user } }

const UsersPagedSchema = createPagedResponseSchema(UserSchema)
// Validates: { code: 0, message: "Success", data: { items: [...], total: 100, page: 1, pageSize: 20 } }
```

---

## 3. 如何写组件测试

### 3.1 测试基础设施

| 工具                      | 版本 | 用途                               |
| ------------------------- | ---- | ---------------------------------- |
| Vitest                    | 4    | 测试运行器                         |
| @vue/test-utils           | 2    | Vue 组件挂载                       |
| @testing-library/vue      | 8    | 语义化断言                         |
| @testing-library/jest-dom | 6    | 额外匹配器（toBeInTheDocument 等） |
| @faker-js/faker           | 9    | 测试数据生成                       |
| jsdom                     | 29   | 浏览器环境模拟                     |

**关键配置**（`vitest.config.ts`）：

- `environment: 'jsdom'`
- `globals: true` — `describe/it/expect` 无需 import
- `setupFiles: ['./src/test/setup.ts']` — 自动清理 + 浏览器 API mocks
- `exclude: [...configDefaults.exclude, 'e2e/**']` — 排除 E2E 测试

**自动清理**（`src/test/setup.ts`）：

```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/vue'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// Mock matchMedia + ResizeObserver for Radix UI / shadcn-vue
Object.defineProperty(window, 'matchMedia', {
  /* ... */
})
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  /* ... */
}))
```

### 3.2 测试文件组织

- **组件测试** 与源码同目录：`src/components/app/__tests__/ComponentName.test.ts`
- **Store 测试**：`src/stores/__tests__/auth.test.ts`
- **API 测试**：`src/lib/api/__tests__/instance.test.ts`
- **Schema 测试**：`src/lib/schemas/__tests__/api.schema.test.ts`
- **路由守卫测试**：`src/router/__tests__/guard.test.ts`

### 3.3 测试组件

使用 `@vue/test-utils` 的 `mount` 模式：

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import MyComponent from '../MyComponent.vue'

describe('MyComponent', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('renders slot content when no error', () => {
    const wrapper = mount(MyComponent, {
      slots: {
        default: () => h('div', { class: 'child-content' }, 'Normal content'),
      },
    })

    expect(wrapper.find('.child-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Normal content')
  })

  it('displays fallback UI when child throws error', async () => {
    const ThrowError = defineComponent({
      setup() {
        throw new Error('Test error')
      },
      template: '<div>Should not render</div>',
    })

    const wrapper = mount(MyComponent, {
      slots: {
        default: () => h(ThrowError),
      },
    })

    await nextTick()

    expect(wrapper.find('.error-boundary').exists()).toBe(true)
    expect(wrapper.text()).toContain('Component Render Error')
  })
})
```

### 3.4 测试 Pinia Store

标准模式：`setActivePinia` + `createPinia` + `vi.mock` + `localStorage.clear`：

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore, STORAGE_KEYS } from '../auth'
import * as authApi from '@/lib/api/auth'
import type { LoginResponse } from '@/lib/schemas/auth.schema'

vi.mock('@/lib/api/auth', () => ({
  login: vi.fn<() => Promise<LoginResponse>>(),
  refresh: vi.fn<() => Promise<LoginResponse>>(),
}))

describe('Auth Store', () => {
  let store: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    store = useAuthStore()
  })

  it('initializes with null values when no stored data', () => {
    expect(store.accessToken).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('calls login API and stores auth data', async () => {
    const mockResponse = {
      accessToken: 'token',
      refreshToken: 'refresh',
      userId: 'user',
      expiresIn: 3600,
      tokenType: 'Bearer',
    }

    vi.mocked(authApi.login).mockResolvedValue(mockResponse)

    const result = await store.login({
      email: 'test@example.com',
      password: 'password123',
      // deviceId injected transparently by store
    })

    expect(authApi.login).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com', deviceId: expect.any(String) }),
    )
    expect(result).toStrictEqual(mockResponse)
    expect(store.accessToken).toBe('token')
  })
})
```

### 3.5 Mocking 模式

**vi.mock() — 模块级 mock**：

```typescript
vi.mock('ofetch', () => ({
  ofetch: {
    create: vi.fn((config) => {
      /* capture config */
    }),
  },
}))
```

**vi.hoisted() — 在 mock 之前共享变量**：

```typescript
const capturedConfig = vi.hoisted(() => ({
  baseURL: '',
  onRequest: null as ((ctx: any) => Promise<void>) | null,
}))

vi.mock('ofetch', () => ({
  ofetch: {
    create: vi.fn((config) => {
      capturedConfig.baseURL = config.baseURL
      capturedConfig.onRequest = config.onRequest
      return mockInstance
    }),
  },
}))
```

**vi.mocked() — 类型安全的 mock 控制**：

```typescript
vi.mocked(authApi.login).mockResolvedValue(mockResponse)
vi.mocked(authApi.refresh).mockRejectedValue(new Error('Token expired'))
```

**vi.spyOn() — spy 现有方法**：

```typescript
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn())
const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent').mockImplementation(vi.fn())
```

**vi.stubEnv() — 环境变量 mock**：

```typescript
vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
```

### 3.6 使用 Test Factories

项目提供 `@/test/factories` 用于生成标准化测试数据：

```typescript
import { buildLoginRequest, buildLoginResponse } from '@/test/factories'
import { buildApiResponse, buildPagedResponse, buildApiError } from '@/test/factories'

// Auth fixtures
const request = buildLoginRequest() // generates valid email, password, deviceId
const requestWithOverride = buildLoginRequest({ email: 'custom@test.com' })
const response = buildLoginResponse() // generates valid tokens, userId, expiresIn

// API response fixtures
const userResponse = buildApiResponse({ id: '1', name: 'Test' })
// { code: 0, message: 'Success', data: { id: '1', name: 'Test' } }

const pagedUsers = buildPagedResponse([{ id: '1' }, { id: '2' }], {
  total: 2,
  page: 1,
  pageSize: 10,
})
// { code: 0, message: 'Success', data: { items: [...], total: 2, page: 1, pageSize: 10, totalPages: 1 } }

const errorResponse = buildApiError('Not found', { statusCode: 404 })
// { message: 'Not found', statusCode: 404 }
```

Factory 位于 `src/test/factories/index.ts`，使用 `@faker-js/faker` 生成随机但有效的测试数据。

### 3.7 运行测试

```bash
pnpm test:unit                    # 所有单元测试
pnpm test:unit src/stores         # 指定目录
pnpm test:unit -- --coverage      # 覆盖率报告
pnpm test:unit -- -t "Auth Store" # 运行匹配名称的测试
```

E2E 测试（Playwright）：

```bash
pnpm exec playwright install      # 首次运行 — 安装浏览器
pnpm test:e2e                     # 所有 E2E 测试
pnpm test:e2e --project=chromium  # 仅 Chromium
pnpm test:e2e --debug             # 调试模式
pnpm build && pnpm test:e2e       # CI — 必须先构建
```

---

## 4. 提交规范

### 4.1 Conventional Commits 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

- `type`：变更类型（必填）
- `scope`：影响范围（可选，如 `auth`、`router`、`api`）
- `subject`：简短描述，不超过 72 字符（必填）
- `body`：详细说明（可选）
- `footer`：破坏性变更或关联 issue（可选）

### 4.2 可用类型

| 类型       | 说明                     | 示例                                                     |
| ---------- | ------------------------ | -------------------------------------------------------- |
| `feat`     | 新功能                   | `feat(auth): add token refresh with concurrency control` |
| `fix`      | Bug 修复                 | `fix(router): preserve query params in redirect`         |
| `docs`     | 文档变更                 | `docs: add development handbook`                         |
| `style`    | 代码格式（不影响功能）   | `style: format imports with oxfmt`                       |
| `refactor` | 重构（非新功能、非修复） | `refactor(api): extract error handling to interceptor`   |
| `perf`     | 性能优化                 | `perf: lazy load dashboard charts`                       |
| `test`     | 测试相关                 | `test(auth): add concurrent refresh dedup test`          |
| `build`    | 构建系统/外部依赖        | `build: upgrade vitest to v4`                            |
| `ci`       | CI 配置变更              | `ci: add playwright e2e workflow`                        |
| `chore`    | 其他不修改源码的变更     | `chore: update gitignore`                                |
| `revert`   | 撤销之前的提交           | `revert: feat(auth): add token refresh`                  |

### 4.3 示例

```bash
# 简单提交
git commit -m "feat(settings): add API keys management page"

# 带 scope 和 body
git commit -m "fix(router): handle chunk load errors with auto-retry

When a new deployment deletes old chunk files, the router detects
the dynamic import failure and automatically reloads the page with
a retried query parameter to prevent infinite loops."

# 破坏性变更
git commit -m "feat(api)!: migrate to Zod v4 schema validation

BREAKING CHANGE: All schema imports must use the new Zod v4 API.
The createApiResponseSchema factory now returns a different shape."
```

### 4.4 门禁（commitlint 自动校验）

项目通过 `simple-git-hooks` + `commitlint` 在提交时自动校验：

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'scope-case': [2, 'always', 'lower-case'],
  },
}
```

**pre-commit 钩子**（`package.json`）：

```json
{
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged",
    "commit-msg": "npx --no -- commitlint --edit $1"
  }
}
```

提交前自动运行 `oxfmt --write` + `oxlint --fix` 格式化暂存文件。不符合规范的提交信息将被拒绝。
