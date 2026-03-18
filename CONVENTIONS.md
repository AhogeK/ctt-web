# Project Conventions & Standards

> Engineering scaffold for long-term maintainability — ctt-web frontend

---

## 1. Git Workflow

### Branch Naming

| Type     | Pattern                            | Example                          |
|----------|------------------------------------|----------------------------------|
| Feature  | `feat/{ticket-id}-{short-desc}`    | `feat/CTT-42-dashboard-charts`   |
| Bugfix   | `fix/{ticket-id}-{short-desc}`     | `fix/CTT-55-auth-redirect`       |
| Hotfix   | `hotfix/{version}-{short-desc}`    | `hotfix/v1.2.3-xss-fix`          |
| Release  | `release/v{major}.{minor}.{patch}` | `release/v1.0.0`                 |
| Docs     | `docs/{short-desc}`                | `docs/contributing-guide`        |
| Refactor | `refactor/{short-desc}`            | `refactor/extract-composable`    |
| Scaffold | `scaffold/{short-desc}`            | `scaffold/conventions`           |

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `chore`: Build, tooling, dependencies
- `ci`: CI/CD changes

**Examples:**

```
feat(dashboard): implement coding heatmap chart

- Add HeatmapChart component using vue-echarts
- Connect to /api/v1/stats/heatmap endpoint via TanStack Query
- Support device filter and date range URL params

Closes: CTT-42
```

```
fix(auth): handle JWT expiry redirect loop

Intercept 401 responses in ofetch instance and clear
auth store before redirecting to /login, preventing
infinite redirect when refresh token is also expired.

Fixes: CTT-78
```

---

## 2. Code Style

## TypeScript / Vue

**General:**

- Indent: 2 spaces (no tabs)
- Line length: 100 characters max
- Encoding: UTF-8
- Line endings: LF (Unix-style)
- Always use `strict: true` in tsconfig

**Naming:**

```
// Components: PascalCase
// UserDashboard.vue, HeatmapChart.vue

// Composables: camelCase with `use` prefix
const { data, isPending } = useStats()

// Stores: camelCase with `use` + `Store` suffix
const authStore = useAuthStore()

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3

// Types/Interfaces: PascalCase
interface CodingSession {
  sessionUuid: string
  startTime: string
  endTime: string
}

// Files: kebab-case
// user-profile.ts, coding-session.schema.ts
```

**Vue Component Rules:**

- Always use `<script setup lang="ts">`
- Props must be typed with `defineProps<{...}>()`
- Emits must be typed with `defineEmits<{...}>()`
- Use `defineModel` for two-way binding
- No Options API in new code

**Directory Structure:**

```
src/
├── assets/
├── components/
│   ├── ui/              # shadcn-vue base components
│   └── charts/          # ECharts wrappers
├── composables/         # use*.ts shared logic
├── features/
│   ├── auth/            # Login, OAuth, token management
│   ├── dashboard/       # Stats, heatmap, language dist
│   ├── devices/         # Device list, API key management
│   ├── leaderboard/     # Real-time ranking board
│   └── settings/        # User preferences
├── layouts/
├── lib/
│   ├── api/             # ofetch instance + typed API calls
│   └── schemas/         # Zod schemas (aligned with backend DTOs)
├── router/
├── stores/              # Pinia stores (UI state + auth session only)
├── i18n/                # zh-CN / en-US locale files
└── main.ts
```

---

## 3. State Management Strategy

| State Type   | Tool               | Scope                                  |
|--------------|--------------------|----------------------------------------|
| Server State | TanStack Query     | All API data: stats, sessions, devices |
| URL State    | vue-router query   | Filters, date range, pagination        |
| Global UI    | Pinia              | Auth session, theme                    |
| Local UI     | `ref` / `reactive` | Component-level toggles, forms         |

**Anti-patterns (strictly forbidden):**

- ❌ Storing API response data in Pinia
- ❌ Using `useEffect`-style watchers for event-driven logic
- ❌ Prop drilling beyond 2 levels — use composable or provide/inject

---

## 4. API Integration Conventions

## ofetch Instance

All HTTP calls go through the typed `lib/api/` layer. Never call `ofetch` directly in components.

## Zod Schemas

Every API response must have a corresponding Zod schema in `lib/schemas/`, aligned with `ctt-server` DTOs.

## Response Shape (mirrors ctt-server)

```
// Success
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

// Paginated
interface PagedResponse<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

// Error (from ErrorResponse)
interface ApiError {
  code: string       // e.g. "AUTH_001"
  message: string
  httpStatus: number
  details?: Array<{ field: string; message: string }>
  traceId: string
  timestamp: string
}
```

## Error Handling

Every query/mutation must handle the `error` state. No silent failures. Degraded UI is mandatory — no white screens.

---

## 5. Testing Standards

## Test Structure (AAA Pattern)

```
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import UserCard from './UserCard.vue'

describe('UserCard', () => {
  it('should display username and join date', () => {
    // Arrange
    const user = { username: 'AhogeK', joinedAt: '2026-01-01T00:00:00Z' }

    // Act
    render(UserCard, { props: { user } })

    // Assert
    expect(screen.getByText('AhogeK')).toBeInTheDocument()
  })
})
```

## Coverage Requirements

- Unit tests (composables, utils): > 80%
- Component tests: critical interaction paths
- E2E tests: login → view dashboard → manage devices

---

## 6. Routing Conventions

```
// Route names: kebab-case strings
{ name: 'dashboard', path: '/dashboard' }
{ name: 'device-list', path: '/devices' }
{ name: 'leaderboard', path: '/leaderboard' }

// All routes except /login and /register require auth guard
// Lazy-loaded per feature:
const Dashboard = () => import('@/features/dashboard/DashboardPage.vue')
```

---

## 7. Security Guidelines

- Never store JWT in localStorage — use `httpOnly` cookie or in-memory with refresh rotation
- Never expose API keys in client bundle
- Sanitize all user-generated content before rendering
- Use `v-bind` carefully — avoid binding untrusted HTML (`v-html` forbidden unless explicitly sanitized)

---

## 8. Performance Guidelines

- Route-level code splitting via `() => import(...)`
- Use `<Suspense>` + async components for heavy chart sections
- All images via `<picture>` with WebP/AVIF fallback
- Avoid watchers on large reactive objects — prefer computed
- Bundle analysis: run `pnpm vite-bundle-visualizer` before each release

---

## 9. Code Review Checklist

Before creating PR:

- [ ] All tests pass locally (`pnpm test:unit`)
- [ ] Type check passes (`pnpm type-check`)
- [ ] Lint & format clean (`pnpm lint && pnpm format`)
- [ ] No `any` types introduced
- [ ] No API data stored in Pinia
- [ ] Error states handled in all new queries
- [ ] No hardcoded strings — i18n keys used
- [ ] No `console.log` left in code
- [ ] Self-review completed

---

## 10. IDE Configuration

## VS Code

Recommended extensions (`.vscode/extensions.json`):

- `Vue.volar` — Vue official
- `oxc.oxc` — Oxlint
- `EditorConfig.EditorConfig`
- `bradlc.vscode-tailwindcss`
- `vitest.explorer`

## Setup

```
# Configure git commit template
git config commit.template .gitmessage

# Install browsers for E2E (first time)
pnpm exec playwright install
```

---

*Last updated: 2026-03-18*
*Maintainers: Project maintainers*
*Questions? Open an issue with label `conventions`*
