# Active Context: ctt-web

## Current Status

**Phase**: Router architecture complete — ready for feature implementation
**Version**: 0.2.0-beta.2 (2026-04-03)

## What Was Just Done

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

**Phase**: Router architecture complete — ready for feature implementation
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
| 0.2.0 | 2026-04-03 | Router architecture complete (feature-based routing) |
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