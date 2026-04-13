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
import { RouteNames } from '../route-names'

const authRoutes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: RouteNames.AUTH_LAYOUT,
    component: () => import('@/layouts/AuthLayout.vue'),
    redirect: { name: RouteNames.LOGIN },
    meta: { title: 'Authentication', hideInMenu: true },
    children: [
      {
        path: '/login',
        name: RouteNames.LOGIN,
        component: () => import('@/features/auth/views/LoginView.vue'),
        meta: { title: 'Login', requiresAuth: false, layout: 'auth' },
      },
      {
        path: '/register',
        name: RouteNames.REGISTER,
        component: () => import('@/features/auth/views/RegisterView.vue'),
        meta: { title: 'Register', requiresAuth: false, layout: 'auth' },
      },
    ],
  },
]

export default authRoutes
```

### Absolute Child Paths Pattern

When defining child routes, use **absolute paths** (starting with `/`) instead of relative paths:

```typescript
// ✅ Correct: Absolute child path
{
  path: '/login',  // Resolves to /login (clean URL)
  component: () => import('@/features/auth/views/LoginView.vue'),
}

// ❌ Avoid: Relative child path
{
  path: 'login',  // Resolves to /auth/login (nested URL)
  component: () => import('@/features/auth/views/LoginView.vue'),
}
```

**Benefits:**

- Cleaner URLs (`/login` instead of `/auth/login`)
- Independent navigation (URL doesn't expose internal module structure)
- Product-friendly (matches industry-standard URL patterns)
- Backward compatible (still renders in parent AuthLayout)

**How it works:**

In Vue Router, child routes with paths starting with `/` are treated as **root paths**, bypassing parent path concatenation. The child still renders in the parent's `<router-view>`, maintaining layout hierarchy while exposing clean URLs.

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

| Chunk               | Contents                           | Load Trigger             |
|---------------------|------------------------------------|--------------------------|
| `vendor`            | All `node_modules` dependencies    | Initial load             |
| `feature-auth`      | Auth views, components, logic      | Navigate to `/auth`      |
| `feature-dashboard` | Dashboard views, charts, analytics | Navigate to `/dashboard` |
| `feature-settings`  | Settings views, forms, API key UI  | Navigate to `/settings`  |

## State Management

### Layer Separation

| State Type       | Tool           | Use Case                                          |
|------------------|----------------|---------------------------------------------------|
| **Server State** | TanStack Query | API data, caching, refetching, optimistic updates |
| **Global State** | Pinia          | Auth session, theme, UI state                     |
| **URL State**    | Vue Router     | Filters, pagination, search params                |

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

### API Error Utility

- **Location**: `src/lib/utils/api-error.ts`
- **Functions**:
  - `getErrorMessage(error)` — Extracts user-friendly message from API errors
  - `isApiError(error)` — Type guard for structured API error responses
  - `mapApiErrorCode(code)` — Maps server error codes to localized messages
- **Usage**: Centralized error handling across auth views (LoginView, RegisterView)
- **Benefits**:
  - Consistent error message formatting
  - Type-safe error handling
  - Single source for error code mapping

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

## Exception Handling Architecture

### Error Boundary Hierarchy

| Level       | Location        | Scope                    | Purpose                                    |
|-------------|-----------------|--------------------------|--------------------------------------------|
| **Root**    | `App.vue`       | Entire application       | Catch-all for uncaught rendering errors    |
| **Layout**  | `AppLayout.vue` | Main content area (slot) | Isolate page failures, keep nav functional |
| **Feature** | Feature views   | Individual components    | Optional, for critical feature isolation   |

### ErrorBoundary Component

```vue
<!-- src/components/app/ErrorBoundary.vue -->
<script setup lang="ts">
interface Props {
  /** Whether to stop error propagation to parent error boundaries */
  stopPropagation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  stopPropagation: true,
})

const hasError = shallowRef(false)
const errorInfo = ref<Error | null>(null)

onErrorCaptured((error, instance, info) => {
  hasError.value = true
  errorInfo.value = error
  console.error('[ErrorBoundary Captured]', error, { instance, info })
  return !props.stopPropagation // false = stop propagation
})

function handleReset() {
  hasError.value = false
  errorInfo.value = null
}
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <h3>Component Render Error</h3>
    <p>Please refresh the page or contact administrator</p>
    <details v-if="isDev && errorInfo">
      <!-- Error details in development mode -->
    </details>
    <Button @click="handleReset">Try Again</Button>
  </div>
  <slot v-else />
</template>
```

### Error Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.vue                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ErrorBoundary (Root)                                       │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ RouterView                                           │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │ AppLayout.vue                                  │  │  │  │
│  │  │  │  ┌─────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │ Sidebar + Header (unprotected)          │  │  │  │  │
│  │  │  │  └─────────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌─────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │ ErrorBoundary (Layout)                  │  │  │  │  │
│  │  │  │  │  ┌───────────────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │ Main Content (slot)               │  │  │  │  │  │
│  │  │  │  │  │  ┌─────────────────────────────┐  │  │  │  │  │  │
│  │  │  │  │  │  │ Feature View Component     │  │  │  │  │  │  │
│  │  │  │  │  │  │  ❌ Error thrown here       │  │  │  │  │  │  │
│  │  │  │  │  │  └─────────────────────────────┘  │  │  │  │  │  │
│  │  │  │  │  └───────────────────────────────────┘  │  │  │  │  │
│  │  │  │  └─────────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  Toaster (Sonner)                                               │
└─────────────────────────────────────────────────────────────────┘

Error propagation: Feature → Layout Boundary → Root Boundary → Global Handler
```

### Router Chunk Load Errors

```typescript
// src/router/index.ts
router.onError((error, to) => {
  const isChunkLoadFailed =
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed')

  if (isChunkLoadFailed && !to.query.retried) {
    console.warn('[Router] New version detected, reloading page...', error)
    const targetPath = to.fullPath
    const separator = targetPath.includes('?') ? '&' : '?'
    globalThis.location.href = `${targetPath}${separator}retried=1`
  } else if (isChunkLoadFailed) {
    console.error('[Router] Chunk load failed after retry, manual refresh required:', error)
  }
})
```

Handles deployment-induced failures when old chunks are deleted after new deployment.

### 404View

```vue
<!-- src/views/Exception/404View.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router/route-names'

const router = useRouter()

function handleGoHome() {
  router.push({ name: RouteNames.HOME })
}

function handleGoBack() {
  router.back()
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center">
    <h1 class="text-8xl font-bold text-primary/20">404</h1>
    <h2 class="mt-4 text-3xl font-bold">Page Not Found</h2>
    <p class="mt-4 max-w-md text-muted-foreground">
      The page you are looking for does not exist or has been removed.
    </p>
    <div class="mt-8 flex gap-4">
      <Button variant="default" @click="handleGoHome">Go Home</Button>
      <Button variant="outline" @click="handleGoBack">Go Back</Button>
    </div>
  </div>
</template>
```

Route configuration:

```typescript
// src/router/index.ts
{
  path: '/:pathMatch(.*)*',
  name: RouteNames.NOT_FOUND,
  component: () => import('@/views/Exception/404View.vue'),
  meta: { title: 'Not Found', hideInMenu: true },
}
```

### Global Error Handlers

```typescript
// src/main.ts
function handleVueError(err: unknown, instance: unknown, info: string): void {
  // TODO: Integrate with Sentry/Datadog for production error tracking
  console.error('[Vue Global Error]', { error: err, component: instance, info })
}

function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  // TODO: Integrate with Sentry/Datadog for production error tracking
  console.error('[Unhandled Promise Rejection]', event.reason)
  event.preventDefault()
}

app.config.errorHandler = handleVueError
window.addEventListener('unhandledrejection', handleUnhandledRejection)
```

### Toast Notifications (Sonner)

```vue
<!-- src/App.vue -->
<template>
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
  <Toaster position="top-right" :expand="true" rich-colors />
</template>
```

Usage in components:

```typescript
import { toast } from 'vue-sonner'

// Success notification
toast.success('API key created successfully')

// Error notification
toast.error('Failed to save settings')

// Promise-based (shows loading → success/error)
toast.promise(saveSettings(), {
  loading: 'Saving...',
  success: 'Settings saved',
  error: 'Failed to save',
})
```

### Best Practices

1. **Wrap critical sections**: Use ErrorBoundary around components that may fail (data fetching, complex rendering)
2. **Keep navigation functional**: Layout-level boundary ensures sidebar/header remain usable during page errors
3. **Provide retry options**: `handleReset()` allows users to attempt recovery without full page refresh
4. **Log with prefixes**: Use `[ErrorBoundary Captured]`, `[Router]`, `[Vue Global Error]` for easy log filtering
5. **Dev mode details**: Show error stack in development, hide in production for security
6. **Chunk error recovery**: Auto-reload on deployment-induced chunk failures with single retry
7. **Type-safe navigation**: Use `RouteNames` constants for 404 navigation actions
8. **TODO integration**: Mark Sentry/Datadog integration points for future production monitoring
