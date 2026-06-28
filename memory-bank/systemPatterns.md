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
  apiFetch('/api/v1/stats', { query: params }).then((r) => PagedResponseSchema(CodingSessionSchema).parse(r))
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
    ├── devices.ts     # Device management routes
    ├── leaderboard.ts # Leaderboard routes
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
  title: string // Page title (required)
  requiresAuth?: boolean // Authentication required
  roles?: string[] // RBAC roles
  layout?: 'default' | 'blank' | 'dashboard'
  hideInMenu?: boolean // Hide from sidebar
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
    window.location.href = `${to.fullPath}?retried=1`
  }
})
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
- ❌ `error.error` for backend error code extraction (use `error.data.code`)
- ❌ Outer shadows for button elevation in dark mode (use luminance stepping)

## Button Variant System (Linear-style)

### 4-tier Hierarchy (0.5.45 refactor)

| Variant     | Purpose                         | Visual Weight                              | Usage Examples                                 |
| ----------- | ------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| `primary`   | Brand CTA (submit, confirm)     | Strongest — `bg-[#5e6ad2]` indigo          | Login submit, Register submit                  |
| `secondary` | Container actions (cancel)      | Medium — `bg-secondary`                    | Dialog cancel, Modal close                     |
| `ghost`     | Secondary CTAs, toolbar buttons | Invisible default, edge highlight on hover | Auth "Back to sign in", sidebar toggle, logout |
| `default`   | Minimal text-only (non-primary) | Weakest — no bg/border                     | Non-primary text links                         |

### Ghost Variant Behavior (0.5.45)

**ghost variant** — Invisible until interaction, edge highlight on hover:

- Default: `text-muted-foreground` (no bg, no border)
- Hover: `hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]` (light) or `hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]` (dark) — 1px inset shadow edge highlight
- Transition: `transition-all duration-200` (smooth shadow appearance)
- Use case: All secondary buttons — auth views, toolbar, sidebar toggle, logout

### Key Implementation Rules

1. **Ghost = invisible default + edge highlight hover** (not solid bg change)
2. **Edge highlight = inset shadow** (not border or background)
3. **Transition timing**: `duration-200` for smooth shadow appearance
4. **Light/Dark adaptation**: Different shadow opacity values for contrast
5. **All secondary buttons use ghost** (no subtle variant since 0.5.45)

## Discriminated API Endpoints

`mutationFn`'s signature drives TanStack Query's `TVariables` — without explicit literal annotation (e.g. `(_action: 'bind') => ...`), TS infers `undefined` and `mutate('bind')` fails type-check. BIND (`ProfileView.vue`): `mutationFn: (_action: 'bind') => getGitHubAuthorizeUrl('bind')` → `mutate('bind')`. LOGIN (`LoginView.vue`): `mutationFn: () => getGitHubAuthorizeUrl('login')` → `mutate()`. Shapes: literal discriminator → 1-arg form with literal type; structured payload → 1-arg with payload type; no args → 0-arg form.
