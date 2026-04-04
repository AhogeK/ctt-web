# Architecture Overview

## Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Framework      | Vue 3.5 + TypeScript 6.0 (Strict mode)          |
| Build          | Vite 8 (Rolldown engine)                        |
| Routing        | Vue Router 5 (feature-based modules)            |
| Server State   | TanStack Query v5                               |
| Global State   | Pinia 3 (auth store with JWT management)        |
| UI             | Radix Vue + shadcn-vue + Tailwind CSS v4        |
| HTTP           | ofetch (centralized instance with interceptors) |
| Validation     | Vee-Validate + Zod                              |
| Charts         | Apache ECharts + vue-echarts                    |
| Icons          | Iconify Vue                                     |
| i18n           | Vue I18n v11                                    |

## Directory Structure

```
src/
├── features/           # Feature modules
│   ├── auth/           # Authentication (LoginView, RegisterView)
│   ├── dashboard/      # Dashboard analytics (DashboardHome)
│   └── settings/       # User settings (ProfileView, ApiKeysView)
├── layouts/            # Layout components
│   ├── AuthLayout.vue  # Login/Register layout (minimal, centered)
│   └── AppLayout.vue   # Main app layout (sidebar, responsive)
├── components/         # Shared components
│   ├── ui/             # shadcn-vue primitives (Button, Input, etc.)
│   └── app/            # App-specific components (Sidebar, Header)
├── lib/                # Core utilities
│   ├── api/            # API layer (instance.ts, auth.ts)
│   ├── schemas/        # Zod schemas (auth.schema.ts)
│   └── utils.ts        # Utility functions (cn, etc.)
├── stores/             # Pinia stores
│   ├── auth.ts         # Auth store (JWT token management)
│   └── counter.ts      # Example store (placeholder)
├── router/             # Vue Router configuration
│   ├── index.ts        # Main router setup + auto-import
│   ├── guard.ts        # Navigation guards (auth, NProgress)
│   └── modules/        # Feature route slices
│       ├── auth.ts     # /auth/login, /auth/register
│       ├── dashboard.ts # /dashboard
│       └── settings.ts # /settings/profile, /settings/api-keys
└── views/              # Top-level views
    ├── HomeView.vue    # Landing page
    └── Exception/      # Error pages (404View)
```

## Feature-Based Routing

Routes are organized by feature in `src/router/modules/`. Each module exports a `RouteRecordRaw[]` array that is auto-imported via Vite's `import.meta.glob`:

```typescript
// src/router/index.ts
const routeModules = import.meta.glob('./modules/*.ts', { eager: true })

const featureRoutes: RouteRecordRaw[] = []

Object.keys(routeModules).forEach((key) => {
  const mod = (routeModules[key] as { default: RouteRecordRaw[] }).default || []
  featureRoutes.push(...mod)
})
```

### Module Structure

Each route module follows a consistent pattern:

```typescript
// src/router/modules/auth.ts
import type { RouteRecordRaw } from 'vue-router'

const authRoutes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: 'AuthLayout',
    component: () => import('@/layouts/AuthLayout.vue'),
    redirect: '/auth/login',
    meta: { title: 'Authentication', hideInMenu: true },
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/features/auth/views/LoginView.vue'),
        meta: { title: 'Login', requiresAuth: false, layout: 'auth' },
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/features/auth/views/RegisterView.vue'),
        meta: { title: 'Register', requiresAuth: false, layout: 'auth' },
      },
    ],
  },
]

export default authRoutes
```

### Route Meta Fields

| Field          | Type      | Purpose                                    |
|----------------|-----------|--------------------------------------------|
| `title`        | `string`  | Page title (document.title + NProgress)    |
| `requiresAuth` | `boolean` | Auth guard check (redirect to Login)       |
| `layout`       | `string`  | Layout type ('auth' or 'app')              |
| `hideInMenu`   | `boolean` | Hide route from sidebar navigation         |

## Lazy Loading Strategy

All route components use dynamic imports for code splitting:

```typescript
// Layouts
component: () => import('@/layouts/AuthLayout.vue')
component: () => import('@/layouts/AppLayout.vue')

// Feature views
component: () => import('@/features/auth/views/LoginView.vue')
component: () => import('@/features/dashboard/views/DashboardHome.vue')
component: () => import('@/features/settings/views/ProfileView.vue')
```

### Benefits

- **Reduced initial bundle**: Only loads code for current route
- **Improved LCP**: Smaller initial JavaScript payload
- **Better INP**: Less main thread blocking during navigation
- **Cache efficiency**: Feature chunks cached independently

### Chunk Load Error Handling

Router handles deployment-induced chunk failures:

```typescript
// src/router/index.ts
router.onError((error, to) => {
  const isChunkLoadFailed = error.message.includes('Failed to fetch dynamically imported module')
    || error.message.includes('Importing a module script failed');

  if (isChunkLoadFailed && !to.query.retried) {
    console.warn('[Router] New version detected, reloading page...', error);
    const targetPath = to.fullPath;
    const separator = targetPath.includes('?') ? '&' : '?';
    window.location.href = `${targetPath}${separator}retried=1`;
  }
});
```

## Chunk Optimization

Vite's `manualChunks` configuration groups related modules into separate bundles:

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        if (id.includes('node_modules')) {
          return 'vendor'
        }
        if (id.includes('src/features/auth')) {
          return 'feature-auth'
        }
        if (id.includes('src/features/dashboard')) {
          return 'feature-dashboard'
        }
        if (id.includes('src/features/settings')) {
          return 'feature-settings'
        }
      },
    },
  },
}
```

### Chunk Groups

| Chunk            | Contents                              | Load Trigger         |
|------------------|---------------------------------------|----------------------|
| `vendor`         | All `node_modules` dependencies       | Initial load         |
| `feature-auth`   | Auth views, components, logic         | Navigate to `/auth`  |
| `feature-dashboard` | Dashboard views, charts, analytics | Navigate to `/dashboard` |
| `feature-settings` | Settings views, forms, API key UI  | Navigate to `/settings` |

## State Management

### Layer Separation

| State Type   | Tool           | Use Case                                    |
|--------------|----------------|---------------------------------------------|
| **Server State** | TanStack Query | API data, caching, refetching, optimistic updates |
| **Global State** | Pinia          | Auth session, theme, UI state               |
| **URL State** | Vue Router     | Filters, pagination, search params          |

### Auth Store (Pinia)

```typescript
// src/stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const userId = ref<string | null>(null)
  const tokenExpiry = ref<number | null>(null)

  const isAuthenticated = computed(() => {
    if (!accessToken.value) return false
    if (!tokenExpiry.value) return true
    return Date.now() < tokenExpiry.value
  })

  function setAuth(response: LoginResponse): void {
    accessToken.value = response.accessToken
    refreshToken.value = response.refreshToken
    userId.value = response.userId
    tokenExpiry.value = Date.now() + response.expiresIn * 1000
  }

  function clearAuth(): void {
    accessToken.value = null
    refreshToken.value = null
    userId.value = null
    tokenExpiry.value = null
  }

  async function login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await loginApi(credentials)
    setAuth(response)
    return response
  }

  return { accessToken, refreshToken, userId, tokenExpiry, isAuthenticated, setAuth, clearAuth, login }
})
```

### When to Use Each

- **TanStack Query**: Fetching dashboard stats, API keys list, leaderboard data
- **Pinia**: Storing JWT tokens, user preferences, sidebar collapsed state
- **Vue Router**: Dashboard date range filter, settings tab selection

## API Layer

### Centralized Instance

```typescript
// src/lib/api/instance.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiFetch = ofetch.create({
  baseURL: BASE_URL,
  timeout: 30000,
  credentials: 'include',

  async onRequest({ options }) {
    const authStore = useAuthStore()
    if (authStore.accessToken) {
      const headers = new Headers(options.headers)
      headers.set('Authorization', `Bearer ${authStore.accessToken}`)
      options.headers = headers
    }
  },
})
```

### Request Flow

1. Component calls API function (e.g., `loginApi(credentials)`)
2. `apiFetch` intercepts request, injects `Authorization: Bearer <token>`
3. Request sent to `BASE_URL` (env-configured or `/api` proxy)
4. Response parsed, validated with Zod schema
5. TanStack Query caches result, triggers UI update

### API Module Pattern

```typescript
// src/lib/api/auth.ts
import { apiFetch } from './instance'
import type { LoginRequest, LoginResponse } from '@/lib/schemas/auth.schema'

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}
```

## Navigation Guards

```typescript
// src/router/guard.ts
export function setupRouterGuards(router: Router) {
  router.beforeEach((to, _from, next) => {
    const title = to.meta.title
    if (title) {
      document.title = `${title} - CTT`
    }

    NProgress.start()

    if (to.meta.requiresAuth && !isAuthenticated()) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }

    next()
  })

  router.afterEach(() => {
    NProgress.done()
  })
}
```

### Guard Responsibilities

- **Title update**: Set `document.title` from route meta
- **Progress bar**: NProgress start/stop for visual feedback
- **Auth check**: Redirect unauthenticated users to Login
- **Redirect preservation**: Store target path in query param for post-login redirect