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
