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
- Error containment: Wrap route views with ErrorBoundary

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
export const fetchStats = (params: StatsParams) =>
  apiFetch('/api/v1/stats', { query: params })
    .then(r => PagedResponseSchema(CodingSessionSchema).parse(r))
```

## Error Handling Pattern

### ErrorBoundary Component
- Catches errors via `onErrorCaptured`
- Displays fallback UI with retry mechanism
- Shows error details in dev mode only
- Prevents white-screen crashes in production

### TanStack Query Error State
```vue
<ErrorState v-if="isError" :error="error" />
<LoadingState v-else-if="isPending" />
<template v-else><!-- content --></template>
```

## Router Architecture

### Directory Structure
```
src/router/
├── index.ts           # Core router with auto-import
├── guard.ts           # Global guards (auth + progress bar)
└── modules/           # Feature-based route slices
    ├── auth.ts        # Authentication routes
    ├── dashboard.ts   # Dashboard routes
    └── settings.ts    # Settings routes
```

### Layout Switching Pattern
Routes specify layout via `meta.layout`:
- Auth routes: `{ path: '/login', meta: { layout: 'auth' } }`
- App routes: `{ path: '/dashboard', meta: { layout: 'app' } }`

AppLayout renders sidebar on desktop (≥768px), Sheet on mobile.

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
const routeModules = import.meta.glob('./modules/*.ts', { eager: true })
// Iterate and flatten module routes
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

Vite `manualChunks` configuration:
- `vendor.js` — Third-party dependencies
- `feature-auth.js` — Authentication module
- `feature-dashboard.js` — Dashboard analytics
- `feature-settings.js` — Settings pages

### Chunk Load Error Handling
Auto-reload for stale chunks after deployment:
```typescript
router.onError((error, to) => {
  if (isChunkLoadFailed && !to.query.retried) {
    window.location.href = `${to.fullPath}?retried=1`;
  }
});
```

Pattern: `?retried=1` query param prevents infinite reload loop.

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