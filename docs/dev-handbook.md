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

#### 2.3.1 Discriminated GET endpoints (action discriminator)

Some endpoints serve multiple semantically distinct flows via a query-param discriminator. The OAuth authorize endpoint is the canonical example:

```typescript
// 1. Schema + API function — src/lib/api/auth.ts
import { z } from 'zod'

export const GitHubAuthorizeResponseSchema = z.object({
  authUrl: z.url(),
})
export type GitHubAuthorizeResponse = z.infer<typeof GitHubAuthorizeResponseSchema>

export type GitHubOAuthAction = 'login' | 'bind'

export async function getGitHubAuthorizeUrl(action: GitHubOAuthAction = 'login'): Promise<GitHubAuthorizeResponse> {
  const response = await apiFetch<unknown>('/api/v1/auth/oauth/github/authorize', {
    method: 'GET',
    query: { action },
  })
  const wrapped = RestApiResponseSchema.parse(response)
  return GitHubAuthorizeResponseSchema.parse(wrapped.data)
}
```

```typescript
// 2. Consumer — LoginView.vue (login flow, no auth required)
import { getGitHubAuthorizeUrl } from '@/lib/api'

const githubMutation = useMutation({
  // Wrap in 0-arg arrow so TanStack Query infers TVariables = void
  // and `mutate()` works without arguments.
  mutationFn: () => getGitHubAuthorizeUrl('login'),
  onSuccess: (data) => {
    window.location.href = data.authUrl
  },
})

function handleGitHubLogin() {
  githubMutation.mutate()
}
```

```typescript
// 3. Consumer — ProfileView.vue (bind flow, auth required)
const githubMutation = useMutation({
  // Explicit 1-arg type so TVariables = 'bind'; mutate('bind') is type-safe.
  mutationFn: (_action: 'bind') => getGitHubAuthorizeUrl('bind'),
  onSuccess: (data) => {
    window.location.href = data.authUrl
  },
})

function handleBindGitHub() {
  githubMutation.mutate('bind')
}
```

**Key points:**

- The `action` query param switches backend behavior (LOGIN vs BIND).
- `apiFetch` automatically injects `Authorization: Bearer <token>` from localStorage. The BIND flow picks up JWT transparently; LOGIN doesn't need it (and the backend allows anonymous calls).
- **TanStack Query `mutationFn` shape matters for type safety:**
  - `() => api()` → `TVariables = void` → `mutate()` works without args.
  - `(args) => api(args)` → `TVariables = args` → `mutate(args)` is required.
  - Pick the shape that matches how the caller invokes `mutate`.
- For Zod-strict unions on the action param, use `z.enum(['login', 'bind'])` if the backend guarantees the enum; use `z.string()` if future providers will add new actions.

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
Object.defineProperty(window, 'matchMedia', {/* ... */})
global.ResizeObserver = vi.fn().mockImplementation(() => ({/* ... */}))
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

const pagedUsers = buildPagedResponse([{ id: '1' }, { id: '2' }], { total: 2, page: 1, pageSize: 10 })
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

---

## 5. 如何写 E2E 测试

### 5.1 E2E 测试基础设施

| 工具       | 版本 | 用途                              |
| ---------- | ---- | --------------------------------- |
| Playwright | 1.x  | 端到端测试运行器（仅 Chromium）    |

**关键配置**（`playwright.config.ts`）：

- `projects: [chromium]`：**只跑 Chromium**。脚手架默认带 firefox/webkit 但从未有人为其写断言，而 `playwright install` 只装 chromium，导致 `pnpm test:e2e` 对任何人都启动即失败。**未运行的项目不是覆盖率，是一个失败步骤**——要启用某引擎，先装该引擎并跑通它的用例。
- `webServer`: 自动启动 dev server（CI 用 `pnpm preview` + 4173，本地用 `pnpm dev` + 5173）

### 5.2 文件组织

```text
e2e/
├── achievements/            # 成就页 spec + 本地 fixture/helper
│   ├── fixtures.ts          # wire 形状的响应常量（不从 src/ 导入）
│   ├── helpers.ts           # setup + 断言助手
│   └── page.spec.ts
├── api-keys/                # API Key 各流程（list/create/revoke/delete/errors/a11y/rawkey）
├── auth/                    # auth flow specs
│   ├── login.spec.ts
│   ├── logout.spec.ts
│   ├── protected-routes.spec.ts
│   └── guest-guard.spec.ts
├── dashboard/               # 布局契约（heatmap-layout.spec.ts · summary-comparison.spec.ts）
├── devices/                 # 设备管理与撤销
├── leaderboard/             # 排行榜 spec + 本地 fixture/helper
├── fixtures/                # 共享测试数据（跨 feature）
│   └── auth.ts              # 规范化的 credentials + response shapes
├── mocks/                   # API contract reference
│   └── handlers/
│       └── auth.ts          # typed response constants for 9 auth endpoints + /users/me
├── utils/                   # 共享 helpers
│   └── auth-helpers.ts      # mockAuthApis, loginViaForm, clickLogout, readAuthStore
└── vue.spec.ts              # 旧的基础 smoke test
```

**两种 fixture 并存，用途不同**：跨 feature 共用的放 `e2e/fixtures/`；单个 feature 的放该 feature 目录下，
并**声明 wire 形状而非 schema 解析类型**——`src/` 的 schema 用 `.default(null)` 把
`windowStart`/`currentUserRank` 变成「必填」，而服务端是**整个键省略**，用解析类型就无法表达
fixture 存在要复现的那种情形。

### 5.3 编写新的 E2E 测试

典型的 auth spec 结构：

```typescript
import { test, expect, type Page } from '@playwright/test'
import { mockAuthApis, loginViaForm, clickLogout, readAuthStore } from '../utils/auth-helpers'
import { TEST_USER_CREDENTIALS } from '../fixtures/auth'

test.describe('Auth flow', () => {
  test('user can log in and log out', async ({ page }) => {
    // 1. 设置 mock API
    await mockAuthApis(page)

    // 2. 通过表单登录
    await loginViaForm(page, TEST_USER_CREDENTIALS)

    // 3. 验证登录状态
    expect(await readAuthStore(page, 'accessToken')).toBeTruthy()

    // 4. 登出
    await clickLogout(page)

    // 5. 验证 token 已清除
    expect(await readAuthStore(page, 'accessToken')).toBeNull()
  })
})
```

**辅助函数**（`e2e/utils/auth-helpers.ts`）：

| 函数                        | 用途                               |
| --------------------------- | ---------------------------------- |
| `mockAuthApis(page)`        | 注册默认 auth API mock（9 个端点） |
| `loginViaForm(page, creds)` | 通过表单提交登录                   |
| `clickLogout(page)`         | 点击登出按钮                       |
| `readAuthStore(page, key)`  | 读取 Pinia auth store 中的字段     |

**Fixture 数据**（`e2e/fixtures/auth.ts`）：

| 常量                    | 用途                            |
| ----------------------- | ------------------------------- |
| `TEST_USER_ID`          | 规范化的测试用户 UUID           |
| `TEST_USER_EMAIL`       | 测试邮箱                        |
| `TEST_USER_CREDENTIALS` | 登录表单使用的 email + password |
| `INVALID_CREDENTIALS`   | 触发 401 AUTH_001 的凭证        |
| `TEST_LOGIN_RESPONSE`   | 登录成功响应                    |
| `TEST_USER_PROFILE`     | `/users/me` 响应                |

### 5.4 自定义 Mock 覆盖

`mockAuthApis(page)` 默认注册全部 9 个端点的 happy path。如需在某个 test 中覆盖某个端点的行为，可在 `mockAuthApis` 之后追加 `page.route()`：

```typescript
test('rate-limit toast appears on 429', async ({ page }) => {
  await mockAuthApis(page)

  // 覆盖登录端点：返回 429
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        code: 'COMMON_002',
        message: 'Too many requests',
        timestamp: new Date().toISOString(),
      }),
    })
  })

  await loginViaForm(page, TEST_USER_CREDENTIALS)
  await expect(page.getByText('Too many requests')).toBeVisible()
})
```

**注意**：`page.route()` 的注册顺序决定优先级。后注册的 handler 优先匹配。如果只想覆盖一个端点的部分场景（例如 happy path + rate limit），用 `Promise.race` 或者先调用 `await page.unroute(...)` 再注册新的 handler。

### 5.5 E2E API Mocking 架构

Playwright E2E 测试使用 `page.route()` 进行 API mock（Playwright 官方推荐的一等公民 API）。

**当前架构（v0.10.13）**：

- `e2e/utils/auth-helpers.ts` — `mockAuthApis(page)` 注册 `page.route()` handlers，覆盖 9 个 auth 端点 + `/users/me`
- `e2e/fixtures/auth.ts` — 规范化测试数据（`TEST_USER`、`TEST_TOKENS`、`STORAGE_KEYS` 等）
- `e2e/mocks/handlers/auth.ts` — API 契约参考文档（typed response constants，无运行时依赖）

**设计决策**：`page.route()` 是 Playwright 的原生网络拦截 API，无需额外依赖。MSW（Mock Service Worker）设计用于 vitest/jest 的单元/集成测试，与 Playwright E2E 的 Node.js test runner 架构不兼容（`setupWorker` 需要 `navigator.serviceWorker`）。

## 6. 动效 · 悬停 · 主题：动手前必须知道的三条横切规则

这三条是**全站约定**，写新 UI 时不必各自发明；漏了**不会报错** —— jsdom 测不出来，只有触摸设备或首帧才暴露 ✗。

### 6.1 悬停态：手写 `:hover` 必须包进 `@media (hover: hover)`

- Tailwind 的 `hover:` / `dark:hover:` 变体由 v4 自动编译进该媒体查询 ✓ **不用管**；裸露的是**手写 CSS** ✗
  （组件 `<style>` 里的 `:hover`）。
- 不包的后果：触摸设备上"悬停态粘连" —— 点过一次后样式一直停在按下态 ✓。
- 现状（2026-09-20 全仓审计 ✓）：`src/` 手写 `:hover` 共 **16 条 / 4 文件**，全部已包 ✓；**新增的必须同批包上** ✗。
- 判据：`@media (hover: hover)` 下生效 ✓、`hover: none` 下**不生效** ✓（真机用 `page.emulate({ hasTouch: true, isMobile: true })` 验 ✓，`emulateMediaFeatures({name:'hover'})` **不受支持** ✗）。

### 6.2 动效：全局 reduce 兜底 + 需要细控时用 `motion-reduce:`

- `src/assets/main.css` 有一条**全局** `@media (prefers-reduced-motion: reduce)`：`animation-duration` / `transition-duration`
  → `0.01ms !important`、`animation-iteration-count: 1`、`scroll-behavior: auto` ✓ ⇒ 任何动效**自动**被减掉 ✓，
  不依赖作者记得写 ✓。
- 需要更细的控制（`duration-0` / `animate-none` / `transition-none`）用 Tailwind 的 `motion-reduce:` 变体 ✓。
- 动效**按需做** ✓（不是"默认不做" ✗）：要做就过设计规范的七字段 + 4 条可失败判据 ✓。
- 判据：reduce 下 `document.getAnimations().length === 0` ✓，且位移/缩放归零 ✓（拿对照组证明探针能看见动效 ✗ 否则结论无效 ✓）。

### 6.3 主题：首帧由 `public/theme.js` 决定，不由 Vue 决定

**已存的用户选择绝不能被挂载逻辑覆盖** ✓ —— 页面加载初始化**只能**在"用户从未选过"时采用系统偏好 ✓；OAuth 登录是**整页加载** ✓，无条件 `setTheme('auto')` 会把用户显式选的 dark 悄悄改回跟随系统 ✗（2026-09-26 修 ✓ 实现落在 store 的 `initTheme()` ✓ 回归测试在 `src/stores/__tests__/theme.test.ts` ✓）。

- 首帧脚本**必须外链** ✗：`index.html` 的 CSP 是 `script-src 'self'`（无 `unsafe-inline`）⇒ 内联脚本被**静默拦截** ✗。
- `public/theme.js` 是**经典脚本**（不是 `type=module` ✗，否则会延后到解析之后 ✓），放在 `<head>`、**CSP meta 之后、应用模块之前** ✓。
- **读的键是 `vueuse-color-scheme`** ✗ 不是 `theme-appearance`：前者是**视觉状态**（VueUse `useDark` 的默认键，裸字符串
  `dark|light|auto` ✓），后者只是用户的模式偏好 ✓；缺失或 `auto` 时回落 `matchMedia('(prefers-color-scheme: dark)')` ✓，
  并同步 `documentElement.style.colorScheme` ✓（原生滚动条与表单控件跟随 ✓）。
- 判据：**拦掉应用 bundle** 后首帧 class 仍正确 ✓ —— 不隔离就分不清是谁设的 ✓。


### 6.4 按钮的 hover：按"族"分配能量，别换身份

| 族 | hover 时变什么 | 不许变什么 |
| --- | --- | --- |
| **实心主按钮**（`variant="default"`） | **只动 `box-shadow`**：1px 品牌外轮廓 + 沉降阴影（配方登记在设计规范 §6 / §10） | **填充与文字都不动** ✗ —— 换了填充或文字色，用户读到的就是"另一个按钮"✗ |
| **outline 家族**（`AlertDialogCancel` · 徽章 · 选择器 · 设置页操作按钮） | **边框色 + 阴影抬一档** | **不加底色** ✗ |
| **ghost** | 文字转强调色 + 一层柔和发光 | 不加底色 ✗ |
| **破坏性** | **红色边框** | 不用紫填充 ✗（与红框不搭） |

**为什么**：`#5e6ad2` + 白字 = 4.70:1，已是 AA 的**上限**；只要把填充提亮一点，白字就跌破 4.5（混白 2% 就只剩 ≈4.53，混白 10% 只剩 3.90）⇒ "提亮 + 白字 + 达标"三者数学上不可兼得 ✓，所以能量只能给阴影/边框。

### 6.5 两个会让状态样式"静默失效"的陷阱 ✗

1. **Tailwind v4 会静默丢弃复杂的任意阴影** ✗：`hover:shadow-[0_4px_12px_rgba(0,0,0,0.35)]` 编不出来（同批的 `hover:ring-1` 却能编 ✓）。⇒ 复杂阴影写进 `src/assets/main.css` 的普通 CSS（本仓库用 `[data-slot='button'][data-variant='default']` 选择器 + `--btn-shadow-*` 变量 ✓），**改完必须查产物**（`grep` 构建后的 CSS 里有没有那条声明 ✓）。
2. **`data-variant` 只在调用点显式传了 `variant` 时才存在** ✗：九个调用点都没传 ⇒ 属性为 `null` ⇒ 按 `[data-variant='default']` 写的 CSS **永远匹配不上** ✓。已在 `Button.vue` 修为 `:data-variant="variant ?? 'default'"`（让属性反映**生效后**的变体 ✓）—— 新增 `data-*` 规则前先确认属性在 DOM 里真的存在 ✓。

### 6.6 暗色：区块靠色调、卡片靠材质、层级看边缘

- **区块之间靠"面"的明度差** ✓（导航/侧栏/面板 `#131419` 对画布 `#08090a` = **1.08:1**）—— **不要靠加粗边框** ✗（把边框令牌抬到 0.20 试过：全站读成铁丝网 ✗）。
- **暗色卡片是近黑板**（`--card` = `#0b0c10`，对画布仅 **1.02:1**，且低于外壳 ⇒ 内容更安静）✓。它的"高级感"来自**材质与光**：极轻灰噪（内联 SVG 噪声 ≈2–3%）、**受光渐变环**（顶部亮、向下衰减）、顶部柔光与三层沉降 ✓；**不靠更亮的填充** ✗（`#191a1e` / `#32333a` 都被判"太白、磨砂" ✗）。
- **层级判据：框架的边 ≥ 内容的边** ✓。外壳边框 0.09（1.27:1）／卡片受光环 0.095（1.25:1）—— 内容一旦比框架亮，用户读到的就是"卡片抢占了 navigation" ✗。
- **同一类线索不要叠加** ✗：受光环之外再加两条 1px 内嵌受光线 = 过量；"色差太重"的真因就在这里，不在填充 ✓。
- **面变暗时，边与光的 alpha 必须同步下调** ✓ —— 同一个 0.12 的边在更暗的面上**相对比更高** ✗，不动就会重新变成"边缘抢戏" ✗（0.12 → 0.09 · 光环 0.13 → 0.095 ✓）。
- **白天与夜间是两套标定** ✓：夜间档（当前）面更低一档（1.08 / 1.02）；亮环境屏上填充会失效、只剩发丝边承重 ✗ —— 白天档同样以令牌化标定表达 ✓，切换即令牌替换 ✓。
- **顶栏与内容同色** ✓（横贯全宽的亮带会挡在内容前 ✗）；**卡片不加 hover 光** ✓（静态容器没有"为什么动"，且品牌强调色的预算归 CTA 与激活态 ✓）。

> **已定稿的视觉不要顺手改** ✗ —— 已接受即冻结：重新量到同样的数字、再问"要不要改"，是在重复已经拒绝过的工作 ✗。

## 7. 国际化（i18n）

### 7.1 结构

| 位置 | 职责 |
|---|---|
| `src/i18n/locales/en.ts` | **源语言**词条（英文）。结构即类型：其他语言的包按它做类型约束 |
| `src/i18n/locales/zh-CN.ts` | 简体中文词条，类型为 `Messages`；英文新增键而这里没跟上 = **编译错误** |
| `src/i18n/locale.ts` | 当前 locale 的响应式状态、存储键 `ctt.locale`、启动解析（存储偏好 > 浏览器语言 > 英文）、`<html lang>` 同步 |
| `src/i18n/index.ts` | i18n 实例、词条包按需加载（英文常驻、中文单独 chunk）、`initI18n` / `setLocale`、跨标签同步 |
| `src/lib/utils/time.ts` | 与语言相关的日期格式化入口：`formatWeekdayShort` / `formatMonthShort` / `formatDateTime` |

### 7.2 新增一条界面文案

1. 先在 `en.ts` 加键（按页面/部位分组，如 `settings.preferences.title`）。
2. `zh-CN.ts` 会因类型缺失报错——补上对应中文即可；键集合由类型与 `pnpm check:i18n` 双重保证。
3. 组件里用 `const { t } = useI18n()`，模板写 `{{ t('settings.preferences.title') }}`。
4. 不要在组件里写中文字面量；测试可以（断言用），应用源码不行。

**校验文案（模块级 schema）**：schema 在模块加载时求值，拿不到 `useI18n` —— 用全局实例，
且文案要**惰性解析**，否则切语言后消息停在旧语言：

```ts
const t = (key: string) => i18n.global.t(key)

z.string().min(1, { error: () => t('auth.validation.passwordRequired') })
```

`t` 必须声明在 schema 之前；`error` 传函数（Zod 4 在每次解析时调用），不要传 `t(…)` 的结果。
已知残留：`LoginForm` 的 schema 仍取加载时文案，迁移该视图时一并改惰性写法。

**法务正文**：`src/features/auth/content/index.ts` 按当前语言返回英文或中文条款；不要直接引
`terms-en`，否则中文用户读到整篇英文。

### 7.3 日期与数字

不要直接调用 `toLocaleString('en-US', …)`：那会把界面钉死在英文。日期走
`formatWeekdayShort` / `formatMonthShort` / `formatDateTime`（都在 `@/lib/utils`），它们读当前 locale，
切换语言后自动重渲染。

### 7.4 切换语言与持久化

入口有三处：**偏好设置页**、**头像菜单 → 语言**，以及**公共外壳上的语言菜单**（营销顶栏与登录卡片右上角，
32px 方形按钮显示当前语言代码 `EN`/`中`，点开列出全部支持语言）—— 未登录的访客没有头像菜单，
公共页面必须自带入口，否则只能先登录才能换语言。
它们都调用 `setLocale()`（唯一写入方）：
加载词条包 → 发布到实例/格式化层/`<html lang>` → 写入 `ctt.locale`。跨标签页通过 `storage` 事件跟随。

### 7.5 守卫

```sh
pnpm check:i18n
```

三条规则：① `src/` 内非词条文件禁止中文字面量（测试、`src/i18n/locales/`、中文条款内容除外）；
② 英文与中文词条键集合必须一致；③ 禁止 `toLocale*String('en-US')` 直调。每批文案迁移后跑一次。

### 7.6 文案里的特殊字符

vue-i18n 把 `@` 当作「链接消息」语法、`|` 当作复数分隔符 —— 邮箱占位符这类文案要用字面量语法：
`you{'@'}example.com`。写错时整个词条包解析失败，组件一挂载就抛 `Invalid linked format`（不是渲染出乱码）。

**本地化不是逐词替换**：先读懂英文表达的事实，再用中文的说话方式重写。

- 源文案与事实不符时**先改英文**，再写中文（示例：示例数据覆盖整年热力图和两天会话，原文
  “from a pretend week” 是错的，已改为 “Example data — not a real account.”）。
- 不搬英文词序：`五小时周` / `两周连续` 改成「单周编码 5 小时」「连续编码 14 天」。
- 用词取本义：`figures` 是「数据」不是「数字」；产品口径变化（如托管服务的定位）先改源文案。
- 判断标准：没看过英文的中文用户读这句话，会不会觉得别扭。

### 7.7 面向用户的错误信息与第三方组件

- **错误码不面向用户**：后端码（`AUTH_005` 之类）只用于排障，页面显示按码映射后的人话；原始码最多留在
  地址栏。测试要反过来断言「页面上不出现码」。共享映射在 `lib/utils/api-error.ts`（`api.errors.*`），
  改一处，认证页、设置页与对话框同时生效。
- **hCaptcha 跟随界面语言**：它的默认语言来自浏览器，不是站点选择；包装组件把当前 locale 作为 `hl`
  传给脚本（`en` / `zh-CN`）。厂商脚本只在首次加载时读语言，所以切换语言后要重新进入页面。
- **整页长截图会吞掉跨域验证码框**：拍证据时按视口分段（上段 + 滚到底部），不要用一张 long screenshot
  判断间距，否则空出来的 iframe 位置会被误读成布局缺陷。
