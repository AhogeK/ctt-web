# Developer Handbook

> ctt-web developer guide — routing, API, testing, and commit conventions

## 1. Adding a route

### 1.1 Routing architecture overview

The project uses **feature-based automatic route module discovery**:

- `src/router/index.ts` loads every module file under `src/router/modules/` through `import.meta.glob('./modules/*.ts', { eager: true })`, with nothing to register by hand in `index.ts`
- **Constant routes** (inline in `index.ts`): top-level routes such as the home page `/` and the 404 `/:pathMatch(.*)*`
- **Feature routes** (the `modules/` directory): organized per feature module (auth, dashboard, settings, ...)

After the router instance is created, `setupRouterGuards(router)` installs the global guards, which cover:

- Automatic document title: `{meta.titleKey resolved in the current language, falling back to meta.title when missing} - Code Time Tracker`
- NProgress progress bar
- Auth guard: a route with `requiresAuth: true` redirects to the login page when the user is not signed in, carrying a `redirect` query parameter

### 1.2 Steps

1. **Add the route name constant in `src/router/route-names.ts`**
2. **Create or edit the module file under `src/router/modules/`** (e.g. `features/my-feature.ts`)
3. **Create the matching view component** (`src/features/<feature>/views/<Name>View.vue`)
4. **Verify the route works**: run `pnpm dev` and visit the path

### 1.3 Code example

A complete route module file (following the `settings.ts` pattern):

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

The matching additions to `route-names.ts`:

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

### 1.4 The RouteMeta type

Defined in `src/types/vue-router.d.ts`. Every available field:

| Field          | Type              | Required | Description                                                                                                                           |
|----------------|-------------------|----------|---------------------------------------------------------------------------------------------------------------------------------------|
| `title`        | `string`          | Yes      | Page title, used for the browser tab and the navigation menu                                                                          |
| `titleKey`     | `string`          | No       | Message key for the title; when present the tab resolves it in the current language and only falls back to `title` when it is missing |
| `requiresAuth` | `boolean`         | No       | Whether authentication is required; defaults to `false`                                                                               |
| `roles`        | `string[]`        | No       | RBAC role permissions (reserved)                                                                                                      |
| `layout`       | `'auth' \| 'app'` | No       | Layout template to use                                                                                                                |
| `hideInMenu`   | `boolean`         | No       | Whether to hide this route from the sidebar                                                                                           |

### 1.5 Caveats

- **Child routes use relative paths**: `path: 'profile'`, not `path: '/settings/profile'`
- **An empty-path child route, `path: ''`,** serves as the default child page (e.g. the dashboard home)
- **Route names must use the `RouteNames` constants**; magic strings are not allowed
- **The children of auth routes must also set `requiresAuth: true`**; the guard checks the meta of every level
- **Parent routes use a layout component** (`AppLayout.vue` or `AuthLayout.vue`); child routes use feature view components
- The auth module's child routes use absolute paths (e.g. `path: '/login'`). That is a legacy pattern; new modules should use relative paths

---

## 2. Adding an API call

### 2.1 API layer architecture overview

The layer uses a **three-tier architecture**:

```
HTTP Client (apiFetch) → API Functions → Schemas (Zod)
```

- **A single HTTP client**: `apiFetch`, exported from `src/lib/api/instance.ts` (an ofetch instance)
- **Automatic Bearer token injection**: reads `ctt_access_token` from `localStorage` and sets the `Authorization` header
- **Global error handling** (the `onResponseError` interceptor):

| Status | Behavior                                                                  |
|--------|---------------------------------------------------------------------------|
| 401    | Clears the token + toast + dispatches the `api:unauthorized` custom event |
| 403    | Toast "Permission denied"                                                 |
| 404    | `console.warn` (left to the component)                                    |
| 422    | Skipped (handled by the form validation component)                        |
| 500+   | Toast "Server error"                                                      |

### 2.2 Steps

1. **Define the Zod schema** (`src/lib/schemas/<domain>.schema.ts`)
2. **Create the API function** (`src/lib/api/<domain>.ts`)
3. **Export it from the barrel file** (`src/lib/api/index.ts`)
4. **Consume it in a store or composable**

### 2.3 Code example

The complete three-step pattern:

```typescript
// 1. Schema definition — src/lib/schemas/item.schema.ts
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
// 2. API function — src/lib/api/item.ts
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
// 3. Export from the barrel — src/lib/api/index.ts
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

### 2.4 Error handling

The API layer's error handling is configured globally on the `apiFetch` instance:

- **401 Unauthorized**: clears `ctt_access_token` automatically, shows a toast and dispatches the `api:unauthorized` event. To listen:
  ```typescript
  globalThis.addEventListener(UNAUTHORIZED_EVENT, () => {
    // Handle unauthorized (e.g., redirect to login)
  })
  ```
- **403 Forbidden**: toast "Permission denied. You do not have access to this resource."
- **422 Unprocessable Entity**: skipped, handled by the Vee-Validate form validation layer
- **500+ Server Error**: toast "Server error. Please try again later."

The API functions themselves do not catch these errors; that is left to the caller (Pinia store / TanStack Query).

### 2.5 Consuming the API

**Pinia store** — auth/session state:

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

**TanStack Query** — data fetching (useQuery / useMutation):

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

Use it with `query-keys.ts` to manage cache invalidation through type-safe cache keys.

### 2.6 Shared schema helpers

`src/lib/schemas/api.schema.ts` provides the generic response wrapper factories:

```typescript
// Standard response wrapper
import { createApiResponseSchema, createPagedResponseSchema } from '@/lib/schemas/api.schema'

const UserResponseSchema = createApiResponseSchema(UserSchema)
// Validates: { code: 0, message: "Success", data: { ...user } }

const UsersPagedSchema = createPagedResponseSchema(UserSchema)
// Validates: { code: 0, message: "Success", data: { items: [...], total: 100, page: 1, pageSize: 20 } }
```

---

## 3. Writing component tests

### 3.1 Test infrastructure

| Tool                      | Version | Purpose                                 |
|---------------------------|---------|-----------------------------------------|
| Vitest                    | 5       | Test runner                             |
| @vue/test-utils           | 2       | Mounting Vue components                 |
| @testing-library/vue      | 8       | Semantic assertions                     |
| @testing-library/jest-dom | 7       | Extra matchers (toBeInTheDocument etc.) |
| @faker-js/faker           | 10      | Test data generation                    |
| jsdom                     | 30      | Browser environment simulation          |

**Key configuration** (`vitest.config.ts`):

- `environment: 'jsdom'`
- `globals: true` — `describe/it/expect` need no import
- `setupFiles: ['./src/test/setup.ts']` — automatic cleanup + browser API mocks
- `exclude: [...configDefaults.exclude, 'e2e/**']` — excludes the E2E tests

**Automatic cleanup** (`src/test/setup.ts`):

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

### 3.2 Test file layout

- **Component tests** live next to the source: `src/components/app/__tests__/ComponentName.test.ts`
- **Store tests**: `src/stores/__tests__/auth.test.ts`
- **API tests**: `src/lib/api/__tests__/instance.test.ts`
- **Schema tests**: `src/lib/schemas/__tests__/api.schema.test.ts`
- **Router guard tests**: `src/router/__tests__/guard.test.ts`

### 3.3 Testing a component

Using the `mount` style from `@vue/test-utils`:

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

### 3.4 Testing a Pinia store

The standard pattern: `setActivePinia` + `createPinia` + `vi.mock` + `localStorage.clear`:

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

### 3.5 Mocking patterns

**vi.mock() — a module-level mock**:

```typescript
vi.mock('ofetch', () => ({
  ofetch: {
    create: vi.fn((config) => {
      /* capture config */
    }),
  },
}))
```

**vi.hoisted() — share variables before the mock runs**:

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

**vi.mocked() — type-safe control of a mock**:

```typescript
vi.mocked(authApi.login).mockResolvedValue(mockResponse)
vi.mocked(authApi.refresh).mockRejectedValue(new Error('Token expired'))
```

**vi.spyOn() — spy on an existing method**:

```typescript
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn())
const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent').mockImplementation(vi.fn())
```

**vi.stubEnv() — mock an environment variable**:

```typescript
vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
```

**`mountWithQuery()` — a component that calls `useMutation`/`useQuery` itself**

A component that reaches for TanStack Query in its own `setup` throws `No 'queryClient' found in Vue context`
when it is mounted bare, because the test setup installs i18n but no query plugin. Mocking the composable
away hides the wiring under test, so mount it through the helper instead:

```typescript
import { mountWithQuery } from '@/test/mount-with-query'

const wrapper = mountWithQuery(DataExportCard)
```

The helper builds a fresh `QueryClient` per call with retries off. Retries would make a test that asserts a
rejected mutation wait out the library's back-off, and a shared client would carry one test's cache into the
next. Callbacks still run asynchronously, so `await flushPromises()` after the interaction.

### 3.6 Using the test factories

The project provides `@/test/factories` for generating standardized test data:

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

The factories live in `src/test/factories/index.ts` and use `@faker-js/faker` to generate random but valid test data.

### 3.7 Running the tests

```bash
pnpm test:unit                    # All unit tests
pnpm test:unit src/stores         # A specific directory
pnpm test:unit -- --coverage      # Coverage report
pnpm test:unit -- -t "Auth Store" # Run tests whose name matches
```

E2E tests (Playwright):

```bash
pnpm exec playwright install      # First run — install browsers
pnpm test:e2e                     # All E2E tests (builds and starts a local preview automatically)
pnpm test:e2e --project=chromium  # Chromium only
pnpm test:e2e --debug             # Debug mode
```

**E2E runs the production build** (`pnpm build` + `pnpm preview`, port 4173) ✓, so local and CI match ✓.
It used to hit the local dev server (5173) — a dev server transpiles modules on demand ⇒ the whole suite queued behind that one bottleneck: **153s** in total, and the heavy specs timed out under parallelism ✗;
against the production build it is **54s** with no flakes ✓. **It also stops occupying your own dev server** ✓.

---

## 4. Commit conventions

### 4.1 Conventional Commits format

```
<type>(<scope>): <subject>

<body>

<footer>
```

- `type`: the kind of change (required)
- `scope`: what it touches (optional, e.g. `auth`, `router`, `api`)
- `subject`: a short description, at most 72 characters (required)
- `body`: the detailed explanation (optional)
- `footer`: breaking changes or related issues (optional)

### 4.2 Available types

| Type       | Description                                 | Example                                                  |
|------------|---------------------------------------------|----------------------------------------------------------|
| `feat`     | New feature                                 | `feat(auth): add token refresh with concurrency control` |
| `fix`      | Bug fix                                     | `fix(router): preserve query params in redirect`         |
| `docs`     | Documentation changes                       | `docs: add development handbook`                         |
| `style`    | Code formatting (no behavior change)        | `style: format imports with oxfmt`                       |
| `refactor` | Refactor (neither a feature nor a fix)      | `refactor(api): extract error handling to interceptor`   |
| `perf`     | Performance improvement                     | `perf: lazy load dashboard charts`                       |
| `test`     | Test-related changes                        | `test(auth): add concurrent refresh dedup test`          |
| `build`    | Build system / external dependencies        | `build: upgrade vitest to v4`                            |
| `ci`       | CI configuration changes                    | `ci: add playwright e2e workflow`                        |
| `chore`    | Other changes that do not touch source code | `chore: update gitignore`                                |
| `revert`   | Revert an earlier commit                    | `revert: feat(auth): add token refresh`                  |

### 4.3 Examples

```bash
# Simple commit
git commit -m "feat(settings): add API keys management page"

# With scope and body
git commit -m "fix(router): handle chunk load errors with auto-retry

When a new deployment deletes old chunk files, the router detects
the dynamic import failure and automatically reloads the page with
a retried query parameter to prevent infinite loops."

# Breaking change
git commit -m "feat(api)!: migrate to Zod v4 schema validation

BREAKING CHANGE: All schema imports must use the new Zod v4 API.
The createApiResponseSchema factory now returns a different shape."
```

### 4.4 The gate (commitlint checks it automatically)

The project validates commit messages automatically with `simple-git-hooks` + `commitlint`:

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

**The git hooks** (`package.json`):

```json
{
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged",
    "commit-msg": "npx --no -- commitlint --edit $1"
  }
}
```

Before each commit, `oxfmt --write` + `oxlint --fix` format the staged files automatically. A commit message that breaks the rules is rejected.

### 4.5 What the static checks catch — and what they cannot

`pnpm lint` runs oxlint (configured in `vite.config.ts` under `lint`): the `correctness` category plus an explicit
rule list. **It must end with zero output** — a warning is either fixed or suppressed with a stated reason, never
left for the next person to wonder about.

**SonarLint in the editor is not part of this chain.** It runs two analyzers: SonarJS (open source) and
SonarTypeScript (**closed source**). The latter's `typescript:S…` rules have no open implementation, so:

| Situation | What to do |
| --- | --- |
| oxlint has an equivalent rule (`S7760` ↔ `unicorn/prefer-default-parameters`) | Measure the blast radius on the existing code → prove the rule bites with a probe → add it to `lint.rules` |
| oxlint has no equivalent | **Say so plainly** — never claim coverage; the remaining option is SonarQube Cloud (free for public repositories, needs CI) |
| The finding is a false positive (e.g. the assertions live in a shared helper) | Configure the rule (`assertFunctionNames`), or suppress one line with `oxlint-disable-next-line` and a reason |

Do not add a heavy dependency to "cover more rules": `eslint-plugin-sonarjs` brings 13 transitive dependencies
(including a second copy of `typescript`) and does **not** include `S7760` — it cannot close the closed-source gap.

---

## 5. Writing E2E tests

### 5.1 E2E test infrastructure

| Tool       | Version | Purpose                                |
|------------|---------|----------------------------------------|
| Playwright | 1.x     | End-to-end test runner (Chromium only) |

**Key configuration** (`playwright.config.ts`):

- `projects: [chromium]`: **Chromium only**. The scaffold ships firefox/webkit by default, but nobody ever wrote assertions for them, while `playwright install` only installs chromium, so `pnpm test:e2e` failed at startup for everyone. **A project that never runs is not coverage, it is a failing step** — to enable an engine, install that engine and get its specs passing first.
- `webServer`: starts the **preview server** automatically (production build + 4173, so local and CI match); `pnpm test:e2e` does the build, so even a reused old process only serves the freshly built output ✓

### 5.2 File layout

```text
e2e/
├── achievements/            # Achievements page spec + local fixture/helper
│   ├── fixtures.ts          # Response constants in wire shape (not imported from src/)
│   ├── helpers.ts           # setup + assertion helpers
│   └── page.spec.ts
├── api-keys/                # API key flows (list/create/revoke/delete/errors/a11y/rawkey)
├── auth/                    # auth flow specs
│   ├── login.spec.ts
│   ├── logout.spec.ts
│   ├── protected-routes.spec.ts
│   └── guest-guard.spec.ts
├── dashboard/               # Layout contract (heatmap-layout.spec.ts · summary-comparison.spec.ts)
├── devices/                 # Device management and revocation
├── leaderboard/             # Leaderboard spec + local fixture/helper
├── fixtures/                # Shared test data (across features)
│   └── auth.ts              # Standardized credentials + response shapes
├── mocks/                   # API contract reference
│   └── handlers/
│       └── auth.ts          # typed response constants for 9 auth endpoints + /users/me
├── utils/                   # Shared helpers
│   └── auth-helpers.ts      # mockAuthApis, loginViaForm, clickLogout, readAuthStore
└── vue.spec.ts              # Legacy basic smoke test
```

**Two kinds of fixtures coexist, for different purposes**: fixtures shared across features live in `e2e/fixtures/`; a single feature's fixtures stay in that feature's directory,
and they **declare the wire shape rather than the parsed schema type** — the `src/` schemas use `.default(null)` to turn
`windowStart`/`currentUserRank` into "required" fields, while the server **omits the whole key**, so a parsed type cannot express
the situation the fixture exists to reproduce.

### 5.3 Writing a new E2E test

The typical shape of an auth spec:

```typescript
import { test, expect, type Page } from '@playwright/test'
import { mockAuthApis, loginViaForm, clickLogout, readAuthStore } from '../utils/auth-helpers'
import { TEST_USER_CREDENTIALS } from '../fixtures/auth'

test.describe('Auth flow', () => {
  test('user can log in and log out', async ({ page }) => {
    // 1. Set up the mock API
    await mockAuthApis(page)

    // 2. Sign in through the form
    await loginViaForm(page, TEST_USER_CREDENTIALS)

    // 3. Verify the signed-in state
    expect(await readAuthStore(page, 'accessToken')).toBeTruthy()

    // 4. Sign out
    await clickLogout(page)

    // 5. Verify the token was cleared
    expect(await readAuthStore(page, 'accessToken')).toBeNull()
  })
})
```

**Helper functions** (`e2e/utils/auth-helpers.ts`):

| Function                    | Purpose                                            |
|-----------------------------|----------------------------------------------------|
| `mockAuthApis(page)`        | Registers the default auth API mocks (9 endpoints) |
| `loginViaForm(page, creds)` | Signs in by submitting the form                    |
| `clickLogout(page)`         | Clicks the logout button                           |
| `readAuthStore(page, key)`  | Reads a field from the Pinia auth store            |

**Fixture data** (`e2e/fixtures/auth.ts`):

| Constant                | Purpose                                 |
|-------------------------|-----------------------------------------|
| `TEST_USER_ID`          | Standardized test user UUID             |
| `TEST_USER_EMAIL`       | Test email                              |
| `TEST_USER_CREDENTIALS` | Email + password used by the login form |
| `INVALID_CREDENTIALS`   | Credentials that trigger a 401 AUTH_001 |
| `TEST_LOGIN_RESPONSE`   | Successful login response               |
| `TEST_USER_PROFILE`     | `/users/me` response                    |

### 5.4 Custom mock overrides

`mockAuthApis(page)` registers the happy path for all 9 endpoints by default. To override one endpoint's behavior inside a single test, add a `page.route()` after `mockAuthApis`:

```typescript
test('rate-limit toast appears on 429', async ({ page }) => {
  await mockAuthApis(page)

  // Override the login endpoint: return 429
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

**Note**: the order in which `page.route()` handlers are registered decides their priority; the most recently registered handler matches first. To override only part of one endpoint's cases (for example happy path + rate limit), use `Promise.race`, or call `await page.unroute(...)` first and then register the new handler.

### 5.5 E2E API mocking architecture

The Playwright E2E tests mock the API with `page.route()` (the first-class API Playwright recommends).

**Current architecture (v0.10.13)**:

- `e2e/utils/auth-helpers.ts` — `mockAuthApis(page)` registers the `page.route()` handlers covering 9 auth endpoints + `/users/me`
- `e2e/fixtures/auth.ts` — standardized test data (`TEST_USER`, `TEST_TOKENS`, `STORAGE_KEYS` and friends)
- `e2e/mocks/handlers/auth.ts` — API contract reference (typed response constants, no runtime dependency)

**Design decision**: `page.route()` is Playwright's native network interception API and needs no extra dependency. MSW (Mock Service Worker) is designed for vitest/jest unit and integration tests and is incompatible with the Node.js test runner architecture of Playwright E2E (`setupWorker` needs `navigator.serviceWorker`).

## 6. Motion · hover · theme: three cross-cutting rules to know before you start

These three are **site-wide conventions**; a new UI does not have to invent them again, and missing them **throws no error** — jsdom cannot see it, and only a touch device or the first frame exposes it ✗.

### 6.1 Hover state: a hand-written `:hover` must be wrapped in `@media (hover: hover)`

- Tailwind's `hover:` / `dark:hover:` variants are compiled into that media query by v4 automatically ✓ **nothing to do**; what is left exposed is **hand-written CSS** ✗
  (the `:hover` inside a component's `<style>`).
- What happens without the wrapper: "hover stickiness" on touch devices — after a single tap the style stays stuck in its pressed state ✓.
- Current state (full-repo audit on 2026-09-20 ✓): `src/` has **16 hand-written `:hover` rules across 4 files**, all already wrapped ✓; **a new one must be wrapped in the same change** ✗.
- Test criterion: it applies under `@media (hover: hover)` ✓ and **does not apply** under `hover: none` ✓ (verify on a real device with `page.emulate({ hasTouch: true, isMobile: true })` ✓; `emulateMediaFeatures({name:'hover'})` is **not supported** ✗).

### 6.2 Motion: a global reduce backstop + the motion preference in settings

- `src/assets/main.css` has one **global** `html[data-motion='reduce']` rule: `animation-duration` / `transition-duration`
  → `0.01ms !important`, `animation-iteration-count: 1`, `scroll-behavior: auto` ✓ ⇒ every animation is **automatically** removed ✓,
  without relying on the author remembering to write it ✓.
- **The trigger is a document attribute, not a media query** ✓: `<html data-motion>` is written by `src/stores/motion.ts`, and the value is the **conclusion**
  (`reduce` means turn it down · `full` means play it · no attribute = no requirement) ✓ — CSS cannot combine a media query with a stored value ⇒ the combining has to happen in the store ✓.
  ⇒ a user choosing "full motion" in settings **overrides** what the system asks for; choosing "reduced motion" likewise **overrides** what the system allows ✓ (both directions must hold ✗ one alone does not count).
- **Do not use Tailwind's `motion-reduce:` variant as the override** ✗: that variant only reads the media query, not the user's explicit choice ⇒ when the user picked "reduced motion" while the system allows motion,
  elements carrying the variant **still animate** ✗. To override, rely on the global rule (it applies automatically) ✓, or add your own `html:not([data-motion='reduce'])` guard where needed ✓.
- Motion is **built when it is needed** ✓ (not "off by default" ✗): when you build it, go through the design spec's seven fields + 4 falsifiable criteria ✓.
- Test criterion: under reduce, `document.getAnimations().length === 0` ✓, and translation/scale are zeroed ✓ (prove with a control group that the probe can see motion ✗ otherwise the conclusion is void ✓).
  **Note**: asserting only "duration ≈ 0" is not enough ✗ — an animation with zero duration **still honors `animation-delay`** ⇒ it pins the first frame (invisible) for a while ✗
  ⇒ the assertion must land on "`animation-name` is absent" or "the number of running animations is 0" ✓.

### 6.3 Theme: the first frame is decided by `public/theme.js`, not by Vue

**A stored user choice must never be overwritten by mount logic** ✓ — page-load initialization **may only** adopt the system preference when "the user has never chosen" ✓; OAuth login is a **full page load** ✓, and an unconditional `setTheme('auto')` silently turns a user's explicit dark choice back into following the system ✗ (fixed on 2026-09-26 ✓ the implementation lives in the store's `initTheme()` ✓ the regression test is in `src/stores/__tests__/theme.test.ts` ✓).

- The first-frame script **must be external** ✗: the CSP in `index.html` is `script-src 'self'` (no `unsafe-inline`) ⇒ an inline script is **silently blocked** ✗.
- `public/theme.js` is a **classic script** (not `type=module` ✗, which would defer it until after parsing ✓) and sits in `<head>`, **after the CSP meta and before the app module** ✓.
- **The key it reads is `vueuse-color-scheme`** ✗ not `theme-appearance`: the former is **visual state** (the default key of VueUse's `useDark`, a bare string
  `dark|light|auto` ✓), while the latter is only the user's mode preference ✓; when it is missing or `auto`, it falls back to `matchMedia('(prefers-color-scheme: dark)')` ✓,
  and syncs `documentElement.style.colorScheme` ✓ (native scrollbars and form controls follow ✓).
- Test criterion: with the **app bundle blocked**, the first-frame class is still correct ✓ — without that isolation you cannot tell who set it ✓.


### 6.4 Button hover: spend the energy by "family", not by changing identity

| Family                                                                             | What changes on hover                                                                                                     | What must not change                                                                                                    |
|------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| **Solid primary button** (`variant="default"`)                                     | **Only `box-shadow` moves**: a 1px brand outline + a settling shadow (the recipe is recorded in the design spec §6 / §10) | **Neither the fill nor the text moves** ✗ — change the fill or the text color and the user reads "a different button" ✗ |
| **outline family** (`AlertDialogCancel` · badge · picker · settings action button) | **Border color + shadow one step up**                                                                                     | **No background added** ✗                                                                                               |
| **ghost**                                                                          | Text turns the accent color + one soft glow                                                                               | No background added ✗                                                                                                   |
| **destructive**                                                                    | **Red border**                                                                                                            | No purple fill ✗ (it clashes with the red border)                                                                       |

**Why**: `#5e6ad2` + white text = 4.70:1, already the **ceiling** for AA; lighten the fill even slightly and white text drops below 4.5 (2% white mixed in leaves only ≈4.53, 10% leaves 3.90) ⇒ "lighter fill + white text + passing contrast" cannot be had together mathematically ✓, so the energy can only go to the shadow/border.

### 6.5 Two traps that make state styles fail "silently" ✗

1. **Tailwind v4 silently drops complex arbitrary shadows** ✗: `hover:shadow-[0_4px_12px_rgba(0,0,0,0.35)]` compiles to nothing (while `hover:ring-1` in the same batch does compile ✓). ⇒ Put complex shadows into plain CSS in `src/assets/main.css` (this repo uses the `[data-slot='button'][data-variant='default']` selector + `--btn-shadow-*` variables ✓), and **always check the output after the change** (`grep` the built CSS for that declaration ✓).
2. **`data-variant` only exists when the call site passes `variant` explicitly** ✗: none of the nine call sites passed it ⇒ the attribute was `null` ⇒ CSS written against `[data-variant='default']` **never matched** ✓. `Button.vue` now sets `:data-variant="variant ?? 'default'"` (so the attribute reflects the **effective** variant ✓) — before adding any `data-*` rule, confirm the attribute really exists in the DOM ✓.

### 6.6 Dark mode: sections by tone, cards by material, hierarchy by edges

- **Sections separate through the lightness difference between "surfaces"** ✓ (nav/sidebar/panel `#131419` against the canvas `#08090a` = **1.08:1**) — **do not separate them with heavier borders** ✗ (raising the border token to 0.20 was tried: the whole site read as barbed wire ✗).
- **The dark card is close to a blackboard** (`--card` = `#0b0c10`, only **1.02:1** against the canvas and below the shell ⇒ the content sits quieter) ✓. Its "premium feel" comes from **material and light**: very light gray noise (inline SVG noise ≈2–3%), a **lit gradient ring** (bright at the top, decaying downwards), a soft top light and three layers of settling ✓; **not from a brighter fill** ✗ (`#191a1e` / `#32333a` both read as "too white, frosted" ✗).
- **Hierarchy criterion: the frame's edge ≥ the content's edge** ✓. Shell border 0.09 (1.27:1) / card lit ring 0.095 (1.25:1) — the moment the content is brighter than the frame, the user reads "the card is stealing the navigation" ✗.
- **Do not stack cues of the same kind** ✗: the lit ring plus two more 1px inset lit lines = too much; that is the real cause of "the color contrast is too heavy", not the fill ✓.
- **When a surface gets darker, the alpha of borders and light must come down with it** ✓ — the same 0.12 border has **higher relative contrast** on a darker surface ✗; leave it alone and "the edges steal the scene" again ✗ (0.12 → 0.09 · ring 0.13 → 0.095 ✓).
- **Day and night are two separate calibrations** ✓: the night setting (current) keeps surfaces one step lower (1.08 / 1.02); on a bright screen in a bright room the fill collapses and only hairline borders carry the structure ✗ — the day setting is expressed as tokenized calibration too ✓, and switching is just swapping tokens ✓.
- **The top bar shares the content's color** ✓ (a bright band across the full width sits in front of the content ✗); **cards get no hover light** ✓ (a static container has no "why it moves", and the brand accent budget belongs to CTAs and active states ✓).

> **Do not casually change a settled visual** ✗ — accepted means frozen: measuring the same numbers again and asking "should we change it?" repeats work that was already rejected ✗.

## 7. Internationalization (i18n)

### 7.1 Structure

| Location                    | Responsibility                                                                                                                                               |
|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `src/i18n/locales/en.ts`    | The **source language** messages (English). The structure is the type: every other language pack is type-constrained by it                                   |
| `src/i18n/locales/zh-CN.ts` | Simplified Chinese messages, typed as `Messages`; a new English key with no match here = **a compile error**                                                 |
| `src/i18n/locale.ts`        | Reactive state for the current locale, the `ctt.locale` storage key, startup resolution (stored preference > browser language > English), `<html lang>` sync |
| `src/i18n/index.ts`         | The i18n instance, on-demand message loading (English always loaded, Chinese in its own chunk), `initI18n` / `setLocale`, cross-tab sync                     |
| `src/lib/utils/time.ts`     | The language-aware date formatting entry points: `formatWeekdayShort` / `formatMonthShort` / `formatDateTime`                                                |

### 7.2 Adding a single UI string

1. Add the key in `en.ts` first (grouped by page or area, e.g. `settings.preferences.title`).
2. `zh-CN.ts` then fails with a missing-type error — add the matching Chinese message; the key set is guaranteed by both the types and `pnpm check:i18n`.
3. In the component use `const { t } = useI18n()` and write `{{ t('settings.preferences.title') }}` in the template.
4. Do not write Chinese string literals inside components; tests may (for assertions), application source may not.

**Validation messages (module-level schema)**: a schema is evaluated when the module loads, so it cannot reach `useI18n` — use the global instance,
and resolve the message **lazily**, otherwise the message stays in the old language after a switch:

```ts
const t = (key: string) => i18n.global.t(key)

z.string().min(1, { error: () => t('auth.validation.passwordRequired') })
```

`t` must be declared before the schema; pass a function to `error` (Zod 4 calls it on every parse), never the result of `t(…)`.
Known leftover: the `LoginForm` schema still captures its message at load time; switch it to the lazy form when that view is migrated.

**Legal copy**: `src/features/auth/content/index.ts` returns the English or Chinese terms for the current language; do not import
`terms-en` directly, or Chinese readers get the whole thing in English.

### 7.3 Dates and numbers

Do not call `toLocaleString('en-US', …)` directly: that pins the UI to English. Dates go through
`formatWeekdayShort` / `formatMonthShort` / `formatDateTime` (all in `@/lib/utils`), which read the current locale and
re-render automatically after a language switch.

### 7.4 Switching language and persisting it

There are three entry points: the **preferences page**, the **avatar menu → Language**, and the **language menu on the public shell** (the marketing top bar and the top-right corner of the login card,
a 32px square button showing the current language code (`EN` for English, a single character for Chinese) that opens a list of every supported language) — signed-out visitors have no avatar menu,
so public pages must carry their own entry point, otherwise the only way to change language is to sign in first.
They all call `setLocale()` (the single writer):
load the message bundle → publish it to the instance/formatters/`<html lang>` → write `ctt.locale`. Other tabs follow through the `storage` event.

### 7.5 The guard

```sh
pnpm check:i18n
```

Three rules: (1) no Chinese string literals in files under `src/` that are not message files (tests, `src/i18n/locales/` and the Chinese legal copy are exempt);
(2) the English and Chinese key sets must match; (3) no direct `toLocale*String('en-US')` calls. Run it after each batch of migrated copy.

### 7.6 Special characters in copy

vue-i18n treats `@` as the "linked message" syntax and `|` as the plural separator — copy such as an email placeholder has to use the literal syntax:
`you{'@'}example.com`. Get it wrong and the whole message bundle fails to parse, so the component throws `Invalid linked format` the moment it mounts (it does not render garbage).

**Localization is not word-by-word replacement**: understand the fact the English states first, then rewrite it the way Chinese is actually spoken.

- When the source copy does not match the facts, **fix the English first**, then write the Chinese (example: the example data covers a whole-year heatmap and two days of sessions, while the original
  "from a pretend week" was wrong and is now "Example data — not a real account.").
- Do not carry English word order across: the literal `five-hour week` / `two weeks straight` were rewritten as "5 hours coded in one week" / "14 days of continuous coding".
- Take each word at its meaning: `figures` means "data", not "numbers"; when what the product claims changes (say, how the hosted service is positioned), change the source copy first.
- The test: would a Chinese reader who never saw the English find this sentence awkward?

### 7.7 User-facing error messages and third-party components

- **Error codes are not user-facing**: backend codes (such as `AUTH_005`) exist for troubleshooting only, and the page shows human wording mapped from the code; the raw code stays in the
  address bar at most. Tests must assert the opposite: "the code never appears on the page". The shared mapping lives in `lib/utils/api-error.ts` (`api.errors.*`), so
  one change takes effect in the auth pages, the settings page and the dialogs at once.
- **hCaptcha follows the UI language**: its default language comes from the browser, not from the site's choice; the wrapper component passes the current locale as `hl`
  to the script (`en` / `zh-CN`). The vendor script only reads the language on first load, so after a language switch you have to enter the page again.
- **A full-page long screenshot swallows the cross-origin captcha frame**: capture evidence in viewport-sized pieces (top part + scrolled to the bottom) rather than judging spacing from one long screenshot,
  otherwise the empty spot where the iframe sits is misread as a layout defect.

### 7.8 Chart copy counts as UI copy

English on the statistics pages often hides in three places a template scan cannot reach: **the tooltip formatter**, **the code that generates axes and legends**,
and **the `aria-label` summary**. Changing a chart page means looking at all three and routing them through the same messages:

- Charts read their values in a `computed` or a builder function, so `useI18n().t` recomputes on a language switch with no manual redraw;
- weekdays and months use the formatters in `lib/utils`; the English plural of a weekday gets its own message (Chinese has no plurals);
- screen-reader summaries use a whole-sentence message with parameters rather than half a sentence assembled in the component — word order differs between languages.

Display names returned by the server (achievement tier names, trophy family names) are English too: map them to messages by **code**
(`STREAK_7` → `achievements.tiers.streak7`), and treat the server string as a fallback only, or a new language ends up half English.

### 7.9 Time-of-day names and unit words

- Time-of-day names must follow the backend's hour split: `NIGHT 00–06 / MORNING 06–12 / DAYTIME 12–18 / EVENING 18–24`
  ⇒ the Chinese labels are **early morning / morning / afternoon / evening**. Translating the English words literally ("night", "dusk") lands on the opposite slot.
- Use **minutes / hours** for units in legends and footnotes, never uppercase abbreviations such as `MIN` or `H`; write a run of days as "41 days", not `41d`.
- The duration value itself still goes through the shared `formatDuration` (`1h 30m`), which is language-independent; only the natural-language part goes into messages;
  leaderboard scores are the exception — they are shown to readers, so Chinese uses "690 hours / 33 days", with `formatScore` choosing the unit per language;
  a signed metric (growth = current period − previous period) must state its arithmetic on the page, otherwise a negative number reads as an error.
