# Progress: ctt-web

## Milestone Overview

| Milestone                         | Status      | Target Version |
| --------------------------------- | ----------- | -------------- |
| Project Scaffold                  | ✅ Complete | 0.1.0          |
| Router Architecture               | ✅ Complete | 0.2.0-beta.2   |
| Layout System                     | ✅ Complete | 0.2.0-beta.3   |
| Auth Module                       | ✅ Complete | 0.3.0-beta.1   |
| Lazy Loading + Chunk Optimization | ✅ Complete | 0.4.0-beta.2   |
| GitHub OAuth                      | ✅ Complete | 0.8.3          |
| hCaptcha Integration              | ✅ Complete | 0.7.6          |
| Terms Acceptance                  | ✅ Complete | 0.7.0          |
| Dashboard                         | ⏳ Pending  | 0.9.0          |
| Device Management                 | ⏳ Pending  | 0.9.0          |
| Leaderboard                       | ⏳ Pending  | 1.0.0          |
| Settings                          | ⏳ Pending  | 1.0.0          |
| i18n (zh/en)                      | ⏳ Pending  | 1.0.0          |
| E2E Test Coverage                 | ⏳ Pending  | 1.0.0          |
| Production Deploy                 | ⏳ Pending  | 1.0.0          |

## Completed (Recent)

- [x] **v0.9.0** Email Change Feature — Backend integration (ctt-server v0.31.2): 5 API endpoints, Zod schemas, composables (useEmailChange, useEmailStatus), AccountSection component (email/verification/display name/registration time), EmailChangeDialog (dynamic password field on USER_013), EmailVerificationBanner (resend with 60s cooldown), `/auth/change-email` route, error codes USER_009/010/011/013/014, auth store `createdAt` field; 751/751 tests pass (37 API + 16 composable + 57 component + ChangeEmailView)

- [x] **v0.8.44** User Profile API + AppHeader Display — `GET /api/v1/users/me` (ctt-server v0.30.0 + v0.30.1 lastLoginAt fix); `lastLoginAt` schema `.nullable().default(null)` for missing-field resilience; `fetchUserProfile()` wired into main.ts (conditional on auth) + login/loginWithOAuth (immediate); Promise lock dedup; 620/620 tests pass

- [x] UserAvatar in Header (v0.8.43): `src/lib/utils/avatar.ts` (stringToHue/stringToAvatarColor/getInitials) + `src/components/app/UserAvatar.vue` (36px circle, hash-derived HSL color, deterministic per user) integrated into `AppHeader.vue` via Tooltip+DropdownMenu. Logout moved into dropdown menu item. 14 new tests, 589/589 pass.

- [x] Sidebar Branding & Copyright (v0.8.42): `AppSidebar.vue` header CTT → "Code Time Tracker"; Logout button → "© 2026 AhogeK" copyright line. `AppSidebar.test.ts` removed 8 Logout tests, added 2 new tests. 575/575 tests pass.

- [x] OAuth Account Unbind Flow (v0.8.41): Closes ctt-server PR-B DELETE endpoint. `unbindOAuthAccount(provider)` in api; state-aware Connect/Disconnect button in ProfileView with Dialog confirmation; `getOAuthUnbindErrorMessage` for AUTH_017 (not linked) + AUTH_018 (last method). approximately 32 new tests (incl. 6 defensive cleanups: redundant @click removal, extractErrorCode helper, COMMON_001 mapping), 580/580 pass.
- [x] OAuth Account Binding Flow (v0.8.40): Closes ctt-server PR-A BIND endpoint. `getGitHubAuthorizeUrl` adds `action` param ('login' | 'bind'); ProfileView handles OAuth callback via `?linked=github` query (success toast + refetch, error toast via 8-code mapping + URL cleanup). 17 new tests, 548/548 pass.
- [x] OAuth Account Binding Status (v0.8.39): Closes `GET /api/v1/auth/oauth/accounts`. New schema/api/view files; `ProfileView` now drives binding state from the backend (loading / error / connected / disconnected) with TanStack Query caching + window-focus refetch. 531/531 tests pass.
- [x] Dependency Update (v0.8.38): Updated indirect dependencies (electron-to-chromium 1.5.379→1.5.380, js-yaml 4.2.0→4.3.0). All 495 tests pass.
- [x] Dependency Update (v0.8.37): Updated reka-ui 2.10.0→2.10.1, vite-plugin-vue-devtools 8.1.3→8.1.4. All 495 tests pass.
- [x] Dependency Update (v0.8.36): Updated vue 3.6.0-beta.16→3.6.0-beta.17, @playwright/test 1.61.0→1.61.1. All 495 tests pass.
- [x] Dependency Update (v0.8.35): Updated @tanstack/vue-query 5.101.0→5.101.1, @commitlint/cli 21.0.2→21.1.0, @commitlint/config-conventional 21.0.2→21.1.0. All 495 tests pass.
- [x] Dependency Update (v0.8.34): Updated @vue/eslint-config-typescript 14.8.0→14.9.0. All 495 tests pass.
- [x] Dependency Update (v0.8.33): Updated lint-staged 17.0.7→17.0.8. All 495 tests pass.
- [x] Dependency Update (v0.8.32): Updated reka-ui 2.9.10→2.10.0. All 495 tests pass.
- [x] Dependency Update (v0.8.31): Updated @types/node 25.9.3→25.9.4. All 495 tests pass.
- [x] Dependency Update (v0.8.30): Updated vue-i18n 11.4.5→11.4.6, @faker-js/faker 10.4.0→10.5.0. All 495 tests pass.
- [x] GitHub Button Loading & NProgress Spinner Fix (v0.8.29)
- [x] AppLayout Router Fix (v0.8.28)
- [x] Captcha Widget UX Fix (v0.8.26)
- [x] Captcha Validation Fix (v0.8.25)
- [x] GitHub Button Hover Fix (v0.8.24)
- [x] GitHub OAuth Frontend (v0.8.3)
- [x] hCaptcha Integration (v0.7.6)
- [x] Terms Acceptance (v0.7.0)
- [x] TermsDialog scrollbar/theme/readOnly fixes (v0.7.1–v0.7.2)
- [x] Accessibility fixes (v0.6.9)
- [x] Console warnings elimination (v0.6.8)
- [x] ResetPasswordView + TypeScript fixes (v0.6.6–v0.6.7)
- [x] Terms acceptance test coverage (v0.6.4)
- [x] UI polish: form spacing, cursor, compact layout (v0.5.75–v0.5.83)
- [x] Password validation sync (v0.5.40)
- [x] Auth initialization & guest guard (v0.5.35–v0.5.38)
- [x] Ghost button system (v0.5.43–v0.5.57)
- [x] Dependency updates (v0.8.9–v0.8.23) — routine updates via `vp update`

## Completed (Early)

- [x] Technology stack selection & project scaffold
- [x] Router architecture (feature-based, type-safe meta, guards)
- [x] Layout system (AuthLayout + AppLayout, mobile responsive)
- [x] Auth module (JWT login, token management, router guards)
- [x] Lazy loading & chunk optimization
- [x] Error handling (ErrorBoundary, 404View, Sonner toast)
- [x] API layer (ofetch instance, JWT interceptor, global error handling)
- [x] Vite+ migration (unified toolchain via `vp` CLI)

## Backlog

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
