# System Patterns: ctt-web

## Component Architecture

### Naming & File Conventions
- Component files: `PascalCase.vue` (e.g., `HeatmapChart.vue`)
- Composable files: `camelCase.ts` with `use` prefix (e.g., `useStats.ts`)
- Schema files: `kebab-case.schema.ts` (e.g., `coding-session.schema.ts`)
- All code in English — no Chinese, no emoji

### Component Patterns
- Always `<script setup lang="ts">`
- Props: `defineProps<{ ... }>()`
- Emits: `defineEmits<{ ... }>()`
- Two-way binding: `defineModel`
- Headless UI logic via Radix Vue; styling via Tailwind

## State Management Layers

```
┌─────────────────────────────────────────────────────┐
│ Server State → TanStack Query                       │
│ /stats, /sessions, /leaderboard, /devices           │
├─────────────────────────────────────────────────────┤
│ URL State → vue-router SearchParams                 │
│ date range, device filter, leaderboard page         │
├─────────────────────────────────────────────────────┤
│ Global Store → Pinia                                │
│ useAuthStore: JWT, user info, expiry refresh        │
│ useThemeStore: dark/light, persisted localStorage   │
└─────────────────────────────────────────────────────┘
```

## API Layer Pattern

```typescript
// lib/api/stats.ts
import { apiFetch } from './instance'
import { PagedResponseSchema } from '../schemas/common.schema'
import { CodingSessionSchema } from '../schemas/coding-session.schema'

export const fetchStats = (params: StatsParams) =>
  apiFetch('/api/v1/stats', { query: params })
    .then(r => PagedResponseSchema(CodingSessionSchema).parse(r))
```

## Error Handling Pattern

Every TanStack Query usage must render error state:

```
<template>
  <ErrorState v-if="isError" :error="error" />
  <LoadingState v-else-if="isPending" />
  <template v-else>
    <!-- actual content -->
  </template>
</template>
```

## Router Architecture

### Directory Structure

```
src/
├── router/
│   ├── index.ts           # Core router with auto-import
│   ├── guard.ts           # Global guards (auth + progress bar)
│   └── modules/           # Feature-based route slices
│       ├── auth.ts        # Authentication routes
│       ├── dashboard.ts   # Dashboard routes
│       └── settings.ts    # Settings routes
├── layouts/               # Layout templates
│   ├── AuthLayout.vue     # Minimal layout for login/register
│   └── AppLayout.vue      # Main app shell with sidebar + charts slot
└── types/
    └── vue-router.d.ts    # Type-safe RouteMeta
```

### Layout Switching Pattern

Routes specify layout via `meta.layout`:
```typescript
// Auth routes use AuthLayout
{ path: '/login', meta: { layout: 'auth' } }

// App routes use AppLayout
{ path: '/dashboard', meta: { layout: 'app' } }
```

AppLayout renders sidebar on desktop (≥768px), Sheet on mobile.

### Mobile Responsive Pattern

```vue
<!-- AppLayout.vue -->
<SidebarProvider>
  <Sidebar class="hidden md:flex" />
  <Sheet class="md:hidden">
    <SheetContent side="left">
      <!-- Mobile sidebar content -->
    </SheetContent>
  </Sheet>
</SidebarProvider>
```

Breakpoint: 768px (Tailwind `md:`)

### Charts Slot Pattern

AppLayout provides named slot for dashboard charts:
```vue
<template #charts>
  <HeatmapChart />
  <LanguagePieChart />
</template>
```

### Route Meta Type Definition

```typescript
interface RouteMeta {
  title: string              // Page title (required)
  requiresAuth?: boolean     // Authentication required
  roles?: string[]          // RBAC roles
  layout?: 'default' | 'blank' | 'dashboard'
  hideInMenu?: boolean      // Hide from sidebar
}
```

### Auto-Import Pattern

```typescript
// src/router/index.ts
const routeModules = import.meta.glob('./modules/*.ts', { eager: true })

const featureRoutes: RouteRecordRaw[] = []
Object.keys(routeModules).forEach((key) => {
  const mod = (routeModules[key] as { default: RouteRecordRaw[] }).default || []
  featureRoutes.push(...mod)
})
```

### Route Guards

- **Authentication**: Redirects to `/login` if `requiresAuth` and no token
- **Page Title**: Sets `document.title` from `to.meta.title`
- **Progress Bar**: NProgress starts on `beforeEach`, stops on `afterEach`

### Code Splitting

All route components use lazy loading:
```typescript
component: () => import('@/features/auth/views/LoginView.vue')
```

---

## Route Structure

```
/                   → Home (constant route)
/login              → AuthPage (public)
/dashboard          → DashboardPage (auth required)
/devices            → DeviceListPage (auth required)
/leaderboard        → LeaderboardPage (auth required)
/settings           → SettingsPage (auth required)
/:pathMatch(.*)*    → 404 Not Found
```

## Forbidden Patterns

- ❌ `v-html` without explicit sanitization
- ❌ `any` type
- ❌ Options API
- ❌ Storing API response in Pinia
- ❌ `console.log` in committed code
- ❌ Hardcoded strings (use i18n keys)
- ❌ Direct `ofetch` calls in components
