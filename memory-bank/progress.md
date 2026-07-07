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
| Set Password                      | ✅ Complete | 0.10.0         |
| CSRF Protection                   | ✅ Complete | 0.10.2         |
| Settings                          | ⏳ Pending  | 1.0.0          |
| i18n (zh/en)                      | ⏳ Pending  | 1.0.0          |
| E2E Test Coverage                 | ⏳ Pending  | 1.0.0          |
| Production Deploy                 | ⏳ Pending  | 1.0.0          |

## Completed (Recent)

- [x] **v0.10.12** E2E MSW wiring + auth spec refactor — Threaded shared fixtures through every auth spec and aligned spec data shapes with the MSW handlers; added `e2e/global-setup.ts` (Playwright `globalSetup`, no-op body in Node) and `public/mockServiceWorker.js` (generated via `pnpm exec msw init public/ --save`); `e2e/mocks/browser.ts` rewritten as a lazy `Proxy<SetupWorkerApi>` that defers `setupWorker()` until first property access (avoids `Invariant Violation` when imported from Node); refactored `login.spec.ts`/`logout.spec.ts`/`protected-routes.spec.ts` to use `e2e/utils/auth-helpers.ts` + `e2e/fixtures/auth.ts` (replaces 150+ lines of inline `page.route()` mock data with shared `okEnvelope` / `STORAGE_KEYS` / `TEST_*` constants); added `e2e/auth/guest-guard.spec.ts` + 4 extra tests (429 rate-limit toast, network-drop toast, `termsExpired` TermsDialog, guest-guard redirect). MSW handlers exist as infrastructure but specs still use `page.route()` via helpers — runtime interception is a follow-up. 18 files changed, 18/18 auth specs pass (chromium, 8.9s); vue-tsc + `tsc --noEmit -p e2e/tsconfig.json` + `vp lint e2e/` clean.
- [x] **v0.10.11** MSW (Mock Service Worker) integration for E2E auth mocking — Installed `msw@2.14.6`; created `e2e/mocks/handlers/auth.ts` (9 endpoints + `/users/me` with `RestApiResponse<T>` envelopes matching Zod schemas), `e2e/mocks/browser.ts` (`setupWorker` singleton), `e2e/fixtures/auth.ts` (canonical credentials + response shapes). Added `dom` lib to `e2e/tsconfig.json`. 4 files changed, vue-tsc + tsc clean.
- [x] **v0.10.10** OAuth sessionStorage redirect + test coverage — Added sessionStorage storage for redirect target before GitHub OAuth redirect; added 15 tests for OAuthCallbackView (happy path, missing tokens, termsExpired, safe/unsafe redirect, URL cleanup); added 10 tests for OAuthErrorView (error code mapping, button navigation, fallback messages). 4 files changed, 928/928 tests pass.
- [x] **v0.10.9** hasPassword integration + code review fixes — Integrated backend `hasPassword` field from API; deprecated `usePasswordDetection` composable; fixed SetPasswordDialog @success regression; added schema type-rejection test; fixed JSDoc field order. 8 files changed, 903/903 tests pass.
- [x] **v0.10.8** Password button label: Set Password → Change Password — button now always visible; label dynamically changes based on `hasPassword` state (null/false → "Set Password", true → "Change Password"). 1 file changed.
- [x] **v0.10.7** Tab title unified to "Code Time Tracker" — browser tab title suffix changed from `- CTT` to `- Code Time Tracker` for brand consistency. `guard.ts` + `guard.test.ts` updated. 2 files changed.
- [x] **v0.10.6** Favicon replaced with PluginIcon SVG — Browser tab icon now uses the Code Time Tracker plugin icon (SVG) instead of the default Vite favicon. `public/favicon.svg` created from `PluginIcon.vue` SVG; `index.html` updated to reference SVG favicon + title changed to "Code Time Tracker". 2 files changed.
- [x] **v0.10.5** Bug fix: remove auto-call of `/api/v1/users/me/password/set` on mount — `usePasswordDetection` had `onMounted` that called `setPassword('')` automatically. Removed auto-call, changed `hasPassword` initial to `null` (tri-state: null/unknown, false/no-password, true/has-password), `isChecking` starts `false`. Detection now lazy via `recheck()` called on "Set Password" button click. 4 files changed, 897/897 tests pass.
- [x] **v0.10.5** Appearance submenu: state-adaptive subtitle color (Round 5) — Round 4's `!text-muted-foreground` was still unreadable on the strong purple accent bg (muted-foreground = dark gray, low contrast on purple). Fixed with Tailwind `group-` variants: subtitle now `text-muted-foreground` in normal state + `group-focus:!text-accent-foreground/80` + `group-data-[state=open]:!text-accent-foreground/80` in highlighted states. SubTrigger gets `class="group"` to enable the selectors. Tests unchanged; 897/897 pass; type-check clean.
- [x] **v0.10.5** Appearance submenu: vertical two-line trigger (Round 4 — SUPERSEDED by Round 5) — Perplexity-style subtitle layout: title "Appearance" + subtitle "System (Light)" below as muted secondary text. Layout correct but static muted-foreground color was unreadable on purple accent bg; Round 5 replaces with state-adaptive coloring.
- [x] **v0.10.5** Appearance submenu: show current theme on trigger (Round 3 — SUPERSEDED by Round 4) — added inline right-aligned current-theme label to SubTrigger. Rejected: cramped on right side + subtitle re-colored on highlight due to specificity loss. Computed + 4-variant tests kept (reused by Round 4).
- [x] **v0.10.5** `lucide-vue-next` → `@lucide/vue` migration — package deprecated upstream. API identical (same icon names, same default-import). 25 source files + 4 test files updated via sed; `package.json` dep + `pnpm-lock.yaml` regenerated. User explicitly approved (R7 dependency change). 895/895 tests pass (pre-Round 3 baseline).
- [x] **v0.10.5** Appearance submenu in avatar dropdown — Round 2 of v0.10.5: replaced standalone ThemeToggle with Perplexity-style `Appearance` submenu inside the avatar dropdown (Light/Dark/System radio group with Circle indicator). Round 1's standalone button was rejected ("有点丑"). Type-check clean (vue-tsc exit 0); vitest runner pre-existing pnpm 11 / `builtin:vite-wasm-fallback` breakage (same as v0.10.4).
- [x] **v0.10.5** ThemeToggle in AppHeader — **SUPERSEDED by Round 2 submenu** — Round 1 added standalone ThemeToggle button to AppHeader (left of avatar). Rejected as visually unpolished; ThemeToggle component kept in tree for AuthLayout use.
- [x] **v0.10.4** Sidebar Icon & Collapse Enhancement — JetBrains plugin icon in sidebar header; `collapsible="icon"` mode with icon swap on hover; Perplexity-style compact layout (sidebar 14rem, menu text 15px, icon 18px); mobile sidebar trigger restored in AppHeader for Sheet overlay accessibility; removed duplicate plugin-icon.svg; SVG cleanup (aria-label, remove hardcoded dimensions); test fixture emailChangePending field added; type-check clean (0 errors)
- [x] **v0.10.2** CSRF Protection — XSRF-TOKEN cookie reading, X-XSRF-TOKEN header injection for state-changing requests, 403 CSRF error handling (toast + page reload); 815/815 tests pass (12 interceptor + 10 cookie parsing + 8 error handling)
- [x] **v0.10.1** CSP Meta Tag — `index.html` defense-in-depth CSP fallback (same-origin + hCaptcha + inline styles + data URIs + clickjacking protection); HTML-only, no code changes; 785/785 tests pass
- [x] **v0.10.0** Set Password Feature — Backend integration (ctt-server Set Password API): `POST /api/v1/users/me/password/set`; Zod schemas, composable (useSetPassword), SetPasswordDialog component (password form with validation), AccountSection updated with Set Password button (shown only for OAuth users); error code USER_015 (password already set); 785/785 tests pass (8 API + 12 composable + 14 component)

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
- [ ] Settings: Language switch (zh-CN / en-US)
- [ ] CI: GitHub Actions (lint + test + build)
