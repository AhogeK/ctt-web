# Active Context: ctt-web

## Current Status

**Phase**: Exception handling infrastructure complete — ready for dashboard implementation
**Version**: 0.4.0-beta.5 (2026-04-05)

- **Exception handling infrastructure (2026-04-05)**:
  - **404View refactored**: Uses RouteNames.HOME, shadcn-vue Button, professional Chinese copy
  - **ErrorBoundary created**: `src/components/app/ErrorBoundary.vue` with `onErrorCaptured`, retry mechanism, DEV mode error details
  - **Toaster integrated**: App.vue with Sonner Toaster (top-right, expand mode, rich colors)
  - **Global error handlers**: main.ts with `app.config.errorHandler` + `unhandledrejection` listener
  - **Hierarchical ErrorBoundary**: App.vue → AppLayout.vue (outer catches router errors, inner catches view errors)
  - **All verification passed**: type-check (0 errors), lint (0 errors)
- **Sonner Toaster integration (2026-04-05)**:
  - Integrated Toaster component into App.vue for global toast notifications
  - Positioned at top-right with expand mode and rich colors
  - Uses custom icons from Sonner.vue (success, info, warning, error, loading, close)
  - Provides centralized notification system for entire application
- **ErrorBoundary component (2026-04-05)**:
  - Created `src/components/app/ErrorBoundary.vue` for error containment
  - Uses `onErrorCaptured` to catch rendering errors in child components
  - Displays fallback UI with retry mechanism
  - Shows error details in development mode only
  - Prevents white-screen crashes in production
  - Follows Vue 3 Composition API best practices (shallowRef for primitives, ref for objects)
- **Git operations (2026-04-05)**:
  - Pushed develop to origin (9 commits: fb6ad91..13c6ace)
  - Cherry-picked 8 non-AI commits to master:
    - fb6ad91: feat(router): add route name constants
    - 6a25983: types(router): add RouteName type
    - 57bc6bf: refactor(router): use constants in index.ts
    - 70eb906: refactor(router): use constants in guard
    - 56f47a0: refactor(router): use constants in all modules
    - 7c2f343: test(router): use RouteNames in guard tests
    - 54c4b63: docs: update README
    - 05ed1b0: chore: bump version to 0.4.0-beta.3
  - Master is clean (no AI files: memory-bank/, AGENTS.md, etc.)
  - Master is 8 commits ahead of origin/master (ready for push)
- **Route names constants implementation (2026-04-05)**:
  - Created `src/router/route-names.ts` as Single Source of Truth for route identifiers
  - Refactored all router modules to use `RouteNames` constants (eliminated magic strings)
  - Updated `src/types/vue-router.d.ts` with `RouteName` type
  - Updated test file with route name constants
  - All verification passed: type-check (0 errors), lint (0 errors), 15 tests passing
- **Critical fixes (2026-04-05)**:
  - Router guard: `window` → `globalThis` (Oxlint lint fix, SSR-safe)
  - Zod v4 migration: `z.string().email()` → `z.email()` (API schema updates)
  - Vite 8 config: `rollupOptions` → `rolldownOptions` (Rolldown engine)
- **Lazy loading implementation (2026-04-05)**:
  - Route-level code splitting with dynamic imports
  - TanStack Query integration for auth state
  - Feature-based manual chunks (auth, dashboard, settings)
  - Chunk size optimization verified

- **Layout system refactor (2026-04-04)**:
  - Consolidated 3 legacy layouts → 2 modern layouts (AuthLayout, AppLayout)
  - Installed shadcn-vue sidebar component + sheet component
  - Mobile responsive at 768px breakpoint (SidebarProvider + Sheet pattern)
  - Charts slot added to AppLayout for dashboard flexibility
  - Legacy layouts removed: DefaultLayout, BlankLayout, DashboardLayout
- **Layout system critical fixes (2026-04-04)**:
  - Fixed vue-router.d.ts type definition: `layout?: 'auth' | 'app'` (was `'default' | 'blank' | 'dashboard'`)
  - Added AppLayout wrapper to Home route using nested routing pattern
  - Removed 5 redundant WHAT comments from guard.ts
  - Cleaned SidebarProvider.vue: removed commented code, added type assertion explanation
  - Fixed SidebarMenuSubItem.vue + SidebarMenuItem.vue: changed `<li>` to `<div>` for HTML semantic compliance
  - Fixed SidebarMenuButton.vue: added required TooltipContent attributes with template ref for collision-boundary
  - **Migrated to TypeScript 6.0+ module resolution**: removed deprecated `baseUrl` from tsconfig.app.json, using Vite `resolve.tsconfigPaths: true` to read path aliases
  - All verification passed: type-check (0 errors), lint (0 errors)
- **Vue Router architecture implementation (2026-04-03)**:
  - Created `src/types/vue-router.d.ts` with type-safe RouteMeta
  - Created 3 layout components: DefaultLayout, BlankLayout, DashboardLayout
  - Created 3 feature route modules: auth.ts, dashboard.ts, settings.ts
  - Created `src/router/guard.ts` with auth guard + NProgress
  - Refactored `src/router/index.ts` to use Vite auto-import
  - Added NProgress dependency for route progress bar
  - Created 404 exception page
- **Vue Router critical fixes (2026-04-03)**:
  - Created 5 missing view components (LoginView, RegisterView, DashboardHome, ProfileView, ApiKeysView)
  - Fixed NProgress double call in guard.ts (removed duplicate from beforeEach)
  - Added title meta to home route
  - All type checks passing (TS5101 deprecation warnings are config-level, not router issues)
  - Production build succeeds (dist/ generated)
- **Cherry-pick non-AI commits to master (2026-04-03)**:
  - Cherry-picked 10 non-AI commits from develop to master (skipped memory-bank docs)
  - Master now has: types, layouts, router modules, guard, views, version bump (0.2.0-beta.2)
  - Master remains clean: NO AI files (.agents/, memory-bank/, AGENTS.md, etc.)
  - Develop retains AI files for continued development
- Scaffold setup completed (Vite 8 + Vue 3 + Tailwind CSS v4 + shadcn-vue)
- Oxlint + ESLint toolchain configured and verified
- AGENTS.md updated with R14 (版本号管理)
- **Branch management operations (2025-04-01)**:
  - Created `develop` branch from master for AI-assisted development
  - Cleaned AI-related files from master branch (AGENTS.md, memory-bank/, etc.)
  - Cherry-picked dependency update (ccc40f0) from develop to master (e9bc662)
  - memory-bank maintained only on develop branch

## Current Focus

**Phase**: Layout system fixes complete — ready for atomic commits
**Priority**: Implement actual auth forms, dashboard charts, and settings pages

## Known Blockers

None currently.

## Recent Decisions

- Oxlint as primary linter; ESLint for type-aware rules
- `vue/multi-word-component-names` disabled (shadcn-vue convention)
- oxfmt as sole formatter (no Prettier)

## Version History

| Version | Date | Change |
|---------|------|--------|
| 0.4.0-beta.5 | 2026-04-05 | Exception handling infrastructure (404View, ErrorBoundary, Toaster, global handlers) |
| 0.4.0-beta.4 | 2026-04-05 | ErrorBoundary component created |
| 0.4.0-beta.3 | 2026-04-05 | Route names constants (eliminated magic strings) |
| 0.4.0-beta.2 | 2026-04-05 | Critical fixes (globalThis, Zod v4, Vite rolldownOptions) |
| 0.4.0-beta.1 | 2026-04-05 | Lazy loading implementation (TanStack Query + route guards) |
| 0.3.0-beta.1 | 2026-04-04 | Auth module complete (JWT + forms) |
| 0.2.0-beta.3 | 2026-04-04 | Layout system refactor (AuthLayout + AppLayout) |
| 0.2.0-beta.2 | 2026-04-03 | Router architecture complete (feature-based routing) |
| 0.1.0 | 2025-03-24 | Scaffold complete, ready for development |
| 0.0.0 | - | Initial project creation |

## Branch History

| Date | Branch | Operation |
|------|--------|-----------|
| 2025-04-01 | develop | Created from master for AI-assisted development |
| 2025-04-01 | master | Cleaned AI files (AGENTS.md, memory-bank/) |
| 2025-04-01 | master | Cherry-picked dependency update from develop (ccc40f0 → e9bc662) |
| 2026-04-03 | master | Cherry-picked 10 Vue Router commits from develop (types, layouts, router, views, version) |
| 2026-04-03 | develop | Retains AI files (memory-bank/) for continued development |