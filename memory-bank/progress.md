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
- [x] AppSidebar Logout Integration: Added logout button in AppSidebar.vue with loading state and useAuthStore().logout() integration
- [x] AppSidebar Logout Tests: Added comprehensive unit tests for loading state and guard behavior
- [x] Terms Acceptance Integration (v0.7.0): P0 bug fixes (error code, endpoint path, schema), error code mapping (AUTH_019/USER_008), registration error handling, Chinese terms content, refresh token termsExpired check
- [x] TermsDialog scrollbar theme fix (v0.7.1): Added themed scrollbar styling using shadcn-vue CSS variables for light/dark mode adaptation
- [x] TermsDialog readOnly mode (v0.7.2): Added readOnly prop to prevent 401 on registration Accept click + fixed 7 pre-existing test failures
- [x] Logout Code Review & Fixes: any type removal, AppHeader logout addition, test coverage expansion (double-click/nav links/structure), unhandled rejection fix
- [x] Bump version 0.5.24
- [x] Bump version 0.5.25
- [x] Critical re-review of all logout fixes: verified correct, added AppHeader aria-label for WCAG compliance
- [x] Dashboard DESIGN.md compliance: replaced Tailwind light-mode classes with CSS variable tokens
- [x] Bump version 0.5.26
- [x] DESIGN.md CSS variable alignment: replaced all shadcn-vue default oklch values with DESIGN.md exact hex colors
- [x] Bump version 0.5.27
- [x] Sidebar light mode color fix: changed sidebar bg from #ffffff to #f3f4f5 (DESIGN.md Light Surface) for proper visual hierarchy
- [x] Bump version 0.5.28
- [x] Fix 8 lint/sonarlint warnings in AppSidebar.test.ts (vi.fn types, unused onClick, unnecessary assertions)
- [x] Bump version 0.5.29
- [x] Fix 4 CSS unknownAtRules false positives (Tailwind v4 directives in main.css — IDE config fix)
- [x] Notion dev plan tracking: Section C「3. 导航栏接入」checked complete (verified AppHeader logout + loading state)
- [x] Atomic git commits: 6 commits on develop (feat:auth/logout, feat:dashboard, fix:style/css-vars, docs:readme, chore:memory, version:0.5.29)
- [x] Cherry-pick 5 non-AI commits individually to master (no branch merge)
- [x] Auth Schema layer verification: ForgotPasswordRequestSchema + ResetPasswordRequestSchema + ResetPasswordFormSchema already implemented (v0.5 era). Notion Section D.1 schemas checked complete.
- [x] Auth Schema layer code review: 5-axis review complete. Schemas correct but missing unit tests (3 schemas uncovered). Full test suite 330/330 passes.
- [x] Schema layer review fixes: moved ForgotPasswordFormSchema to auth.schema.ts + added 16 unit tests. Tests 346/346 pass.
- [x] Auth API layer refactoring: `forgotPassword` and `confirmPasswordReset` (renamed from `resetPassword`) aligned with Architect Practice requirements. Promise<void> return type + object parameters. Tests 359/359 pass.
- [x] Bump version 0.5.31
- [x] ResetPasswordView page layer: Chinese error handling (401/409/429), useCooldown integration, success toast + redirect, 10 unit tests. Tests 369/369 pass.
- [x] Bump version 0.5.32
- [x] Post-review fixes: R8 violation (`as any` → `useFieldValue`), localization consistency (English → Chinese), test mock fix. Tests 369/369 pass.
- [x] Bump version 0.5.33
- [x] Double toast bug fix: removed generic "Connection failed" toast in instance.ts interceptor, updated test expectations. Tests 368/368 pass.
- [x] Bump version 0.5.34
- [x] Guest guard for auth routes: authenticated users now redirected to dashboard when accessing /auth/\* pages. Added guestOnly meta to all auth routes + guard logic. Tests 381/381 pass.
- [x] Bump version 0.5.35
- [x] Logout bug fix: interceptor now properly propagates errors after handling terminal AUTH_003, preventing stuck "Logging out" state. Tests 381/381 pass.
- [x] Bump version 0.5.36
- [x] Logout button color fix: changed from text-muted-foreground (#8a8f98) to text-secondary-foreground (#d0d6e0) per DESIGN.md Ghost Button spec. Tests 381/381 pass.
- [x] Bump version 0.5.37
- [x] Auth initialization: added initializeAuth() to validate tokens via refresh on app startup. Users with expired tokens are now redirected to login immediately. Tests 384/384 pass.
- [x] Bump version 0.5.38
- [x] Code quality fixes: added guestOnly to RouteMeta, created ApiFetchOptions type, consolidated AUTH_003 handling, updated README.md. Tests 384/384 pass.
- [x] Bump version 0.5.39
- [x] Password validation sync: REGEX_PASSWORD_CHARS whitelist + PasswordStrengthMeter 4-rule additive system. Tests 382/382 pass.
- [x] Bump version 0.5.40
- [x] Ghost button default text color: added `text-muted-foreground` to 6 "Back to sign in" buttons. Bump version 0.5.57

## In Progress

- [x] Auth pages premium redesign (mesh gradients, isometric visuals) — AuthLayout.vue base visual effects complete at beta.41, PasswordStrengthMeter UX improved (neutral state when empty in 0.5.0-beta.32)
- [x] AuthLayout.vue component split (0.5.0-beta.46) — 1773→52 lines, 4 child components + external CSS

## Completed (Recent)

- [x] Dependency Update (v0.8.16): Updated indirect dependencies (@typescript-eslint 8.60.1→8.61.0). All 490 tests pass, build successful.
- [x] Dependency Update (v0.8.15): Updated vue-tsc 3.3.3→3.3.4. All 490 tests pass, build successful.
- [x] Dependency Update (v0.8.14): Updated vue-i18n 11.4.4→11.4.5, @types/node 25.9.1→25.9.2. All 490 tests pass, build successful.
- [x] Dependency Update (v0.8.13): Updated vue 3.6.0-beta.13→3.6.0-beta.14, @vue/eslint-config-typescript 14.7.0→14.8.0, @vue/test-utils 2.4.10→2.4.11. All 490 tests pass, build successful.
- [x] Dependency Update (v0.8.12): Updated indirect dependencies (csstools, electron-to-chromium, enhanced-resolve, undici). All 490 tests pass, build successful.
- [x] Dependency Update (v0.8.11): Updated @tanstack/vue-query 5.100.14→5.101.0, reka-ui 2.9.8→2.9.9, eslint-plugin-vue 10.9.1→10.9.2. All 490 tests pass, build successful.
- [x] Dependency Update (v0.8.10): Updated vite-plus 0.1.23→0.1.24, @voidzero-dev/vite-plus-core 0.1.23→0.1.24, @voidzero-dev/vite-plus-test 0.1.23→0.1.24. All 490 tests pass, build successful.
- [x] Dependency Update (v0.8.9): Updated zod 3.x→4.4.3, @vitest/coverage-v8 4.1.7→4.1.8, @vitest/eslint-plugin 1.6.18→1.6.19. All 490 tests pass, build successful.
- [x] GitHub OAuth Frontend (v0.8.3): Complete OAuth login flow with authorize/callback/error pages. GitHub button in LoginForm, error handling with 13 error codes, URL param cleanup for security, GitHub binding button in ProfileView. Backend integration via GET /api/v1/auth/oauth/github/authorize.
- [x] hCaptcha Integration (v0.7.6): Frontend CaptchaWidget.vue + schema/API/form integration. Backend CaptchaService + DTOs + public config. Graceful degradation when captchaSiteKey=null. Code review passed — SECURITY_006/007 error codes added, config.test.ts fixed, ForgotPasswordView.test.ts mock fixed.

## Backlog

- [x] Auth: GitHub OAuth (complete — API + UI + error handling)
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
