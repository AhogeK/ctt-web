# Progress: ctt-web

## Milestone Overview

| Milestone                         | Status      | Target Version |
| --------------------------------- | ----------- | -------------- |
| Project Scaffold                  | ✅ Complete | 0.1.0          |
| Router Architecture               | ✅ Complete | 0.2.0-beta.2   |
| Layout System                     | ✅ Complete | 0.2.0-beta.3   |
| Auth Module                       | ✅ Complete | 0.3.0-beta.1   |
| Lazy Loading + Chunk Optimization | ✅ Complete | 0.4.0-beta.2   |
| Dashboard                         | ⏳ Pending  | 0.4.0          |
| Device Management                 | ⏳ Pending  | 0.4.0          |
| Leaderboard                       | ⏳ Pending  | 0.5.0          |
| Settings                          | ⏳ Pending  | 0.5.0          |
| i18n (zh/en)                      | ⏳ Pending  | 0.5.0          |
| E2E Test Coverage                 | ⏳ Pending  | 0.6.0          |
| Production Deploy                 | ⏳ Pending  | 1.0.0          |

## Completed

- [x] Technology stack selection
- [x] package.json with full dependencies
- [x] README.md (project-specific, not template)
- [x] AGENTS.md (AI coding behavior constraints)
- [x] CONVENTIONS.md (engineering standards)
- [x] memory-bank initialization
- [x] Git repository initialized
- [x] Pushed to GitHub (https://github.com/AhogeK/ctt-web)
- [x] MIT License added
- [x] Router architecture (feature-based routing, type-safe meta, guards)
- [x] Layout system refactor (AuthLayout + AppLayout, mobile responsive)
- [x] Auth module (JWT login, token management, router guards)
- [x] Lazy loading (TanStack Query integration, route-level code splitting)
- [x] Chunk optimization (feature-based manual chunks: auth, dashboard, settings)
- [x] Error handling (ErrorBoundary component with retry mechanism)
- [x] API layer architecture (unified ofetch instance, JWT auth interceptor, global error handling, CustomEvent decoupling)
- [x] LoginView form submission fix (LoginFormSchema separation, loading state, redirect param)
- [x] Unified error code field (backend `code` vs frontend `error` alignment across all views)
- [x] User-friendly toast policy (no leaking HTTP methods/paths/status codes)
- [x] Vite+ migration (unified toolchain via `vp` CLI)
- [x] ofetch interceptor: token refresh (AUTH_002/AUTH_003) + terminal auth error handling (AUTH_004/005/006/007/008/009)
- [x] Interceptor code review: critical retry token bug fixed, JSDoc added, network error toast added
- [x] Interceptor test coverage: 18 new tests (refresh, terminal auth, mutex, retry guard, getErrorCode)
- [x] Vitest .agents exclusion: added `.agents/**` and `.claude/**` to vitest.config.ts exclude
- [x] AUTH_003 refresh trigger fix: backend never throws AUTH_002, all JWT failures return AUTH_003
- [x] Refactor `clearRefreshTimer` to module-level outer scope in `src/stores/auth.ts` to satisfy SonarQube rule S7721
- [x] Verified with `vp check` and `vp test` (319/319 passed)
- [x] Fixed SonarQube S7764 warning: replaced `global` with `globalThis` in `src/stores/__tests__/auth.test.ts` (lines 226-227)
- [x] Bump version 0.5.21

## In Progress

- [x] Auth pages premium redesign (mesh gradients, isometric visuals) — AuthLayout.vue base visual effects complete at beta.41, PasswordStrengthMeter UX improved (neutral state when empty in 0.5.0-beta.32)
- [x] AuthLayout.vue component split (0.5.0-beta.46) — 1773→52 lines, 4 child components + external CSS

## Backlog

- [ ] Auth: JWT login + GitHub OAuth
- [ ] Auth: Token refresh + expiry handling
- [ ] Dashboard: Coding heatmap (ECharts)
- [ ] Dashboard: Language distribution pie chart
- [ ] Dashboard: Hourly patterns chart
- [ ] Devices: Device list + last seen
- [ ] Devices: API key create / revoke
- [ ] Leaderboard: Redis ZSet ranking display
- [ ] Settings: Theme toggle (dark/light)
- [ ] Settings: Language switch (zh-CN / en-US)
- [ ] CI: GitHub Actions (lint + test + build)
