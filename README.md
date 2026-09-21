# ctt-web

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.5-42b883.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-11.x-f69220.svg)](https://pnpm.io/)

Web dashboard frontend for [CTT Server](https://github.com/AhogeK/ctt-server) — the cloud sync backend of
the [Code Time Tracker](https://github.com/AhogeK/code-time-tracker) JetBrains plugin.

Provides a personal analytics dashboard, device management, API key management, leaderboard, and multi-device sync
visualization.

## ✨ Tech Stack

| Layer          | Technology                                                  |
| -------------- | ----------------------------------------------------------- |
| Framework      | Vue 3.5 + TypeScript 6.0 (Strict, modern module resolution) |
| Build          | Vite 8 (Rolldown engine)                                    |
| Routing        | Vue Router 5 (feature-based routing, type-safe meta)        |
| Server State   | TanStack Query v5                                           |
| Global State   | Pinia 3 (auth + theme stores with VueUse persistence)       |
| UI             | Radix Vue + shadcn-vue + Tailwind CSS v4                    |
| Charts         | Apache ECharts + vue-echarts                                |
| HTTP           | ofetch                                                      |
| Validation     | Vee-Validate + Zod                                          |
| Captcha        | hCaptcha (bot protection via @hcaptcha/vue3-hcaptcha)       |
| Icons          | Iconify Vue                                                 |
| i18n           | Vue I18n v11                                                |
| Package Manger | pnpm v11 (standalone install)                                     |
| Lint           | Oxlint v1 (primary) + ESLint                                |
| Format         | Oxfmt (100% Prettier compatible)                            |
| Git Hooks      | simple-git-hooks + lint-staged                              |
| Unit Test      | Vitest 4 + Testing Library Vue                              |
| E2E Test       | Playwright                                                  |
| Mock           | Playwright `page.route()` (E2E API mocking)                 |
| Type Check     | vue-tsc (standalone script)                                 |

## ✅ Implemented Features

| Feature                 | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication          | JWT login, logout, token management, router guards, startup token validation, CSRF protection                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| CSRF Protection         | XSRF-TOKEN cookie reading, header injection for state-changing requests, 403 handling with toast + reload                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| CSP Hardening           | Defense-in-depth Content-Security-Policy meta tag (same-origin + hCaptcha + clickjacking protection)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Auth Initialization     | Startup token validation via refresh endpoint, redirects expired sessions to login                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Guest Guard             | Redirects authenticated users away from auth pages (login, register, forgot-password)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Password Reset          | Forgot password + reset password flows with error mapping, rate limit cooldown, anti-enumeration                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Set Password            | Set password for OAuth users; Account section integration with Email Change flow                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Auth Showcase           | Login page's three stacked panels: pointer-tracked 3D tilt with one kinematic clock, an SVG-stroke spotlight that lights only the arc nearest the pointer, and a card-anchored underglow in a scene-level layer below every card — so any card occludes it, light appears in the gaps and travels behind a panel instead of washing its face; every knob measured (isotropic tilt radius, 136px glow box margin against a 110px/80% gradient, blur budget) and asserted in the unit suite |
| Layout System           | AuthLayout + AppLayout + MarketingLayout (public shell), mobile responsive sidebar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Routing                 | Feature-based modules, type-safe meta, NProgress, **route name constants**, **absolute child paths**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Form Validation         | Vee-Validate + Zod, real-time feedback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Lazy Loading            | Route-level code splitting, dynamic imports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Chunk Optimization      | Feature-based manual chunks (auth, dashboard, settings)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Exception Handling**  | Hierarchical ErrorBoundary (App.vue → AppLayout.vue), global handlers, 404View, Sonner toast                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Token Refresh           | JWT refresh with concurrency control, Promise deduping, Thundering Herd prevention                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Server State Management | TanStack Query v5 with 30s staleTime, SWR pattern, automatic caching                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Device Management       | Device list view (name/platform/IDE/last-active, Active-Inactive badge), revoke with confirmation dialog, empty-state "Install the JetBrains plugin" guide, error mapping (DEVICE_001 / COMMON_002 / RATE_LIMIT_001), first-load skeleton anti-flicker, shared relative-time formatting |
| Leaderboard             | `/leaderboard` rankings over the backend's five **dimensions** — Total time, Streak, Night owl, Early bird, Growth — each filterable by the periods it actually supports (Total time: all four; Streak/Night owl/Early bird: all-time only; Growth: week only, mirroring the server's `COMMON_003` for unsupported pairs, so the selectors can never send one); `limit`/`offset` paging with Previous/Next (the response carries no total, so a full page is the only end signal, and the empty page past a full last page offers a way back); the caller's own rank read from the same response rather than a second endpoint; the caller's own row marked by `userId` (not by rank — ties share one) and a "Find me" control that moves straight to the page holding their rank rather than walking the pages between; scores formatted per dimension (duration, streak days, or a signed growth delta); ties share the server's rank so a position is never derived from the row index; a deleted account renders as "Deleted account" rather than an empty cell (its `displayName` key is absent, not null — a required-but-nullable field failed to parse the whole page) |
| Landing Page            | Public `/` (no session required) rendering `LandingView` under `MarketingLayout` — top bar + content + footer, no sidebar and no user menu; the top-bar CTA follows auth state (register when signed out, dashboard when signed in); own `feature-landing` build chunk; `/` is deliberately **not** `guestOnly`, so a signed-in visitor stays on the marketing page instead of being bounced to the dashboard |
| Theme System            | Light/dark mode toggle, Pinia theme store with VueUse persistence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Terms Acceptance        | Terms version tracking on registration, expiration handling on login, 403 interception with request replay                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Bot Protection          | hCaptcha integration on auth forms with graceful degradation (captchaSiteKey=null disables)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| GitHub OAuth            | OAuth login + account BIND/UNBIND flow from ProfileView with Dialog confirmation; 8-code BIND + 2-code UNBIND error mapping; TanStack Query status                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| User Profile            | `GET /api/v1/users/me` — displayName/email resolution; AppHeader dropdown shows user identity; avatar hash seeded from displayName; Account section integration                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Email Change            | Email change flow with verification; Account section displays email/verification status/display name/registration time; EmailVerificationBanner for unverified users; integrated with Set Password for OAuth users                                                                                                                                                                                                                                                                                                                                                                      |
| API Key Management      | API Keys list view at `/settings/api-keys` with GitHub PAT-style table, status badges, scope chips, relative time; create flow with one-time raw key display (copy-gated close, hard-to-dismiss dialog); revoke flow with AlertDialog confirmation, idempotent DELETE + BOLA-safe AUTH_010 handling; permanent delete for REVOKED and EXPIRED keys (row removed entirely; ACTIVE keys require revoke first — 409 AUTH_023 guard); error mapping (key-limit banner, rate-limit countdown, generic BOLA message), first-load skeleton anti-flicker, table a11y, header shortcut, responsive mobile card view (<768px) |
| Achievements            | `/achievements` trophy cabinet — one card per **(family, window)** ladder (v0.71.0 returns 67 badges across 14 ladders — 7 lifetime families of 5–9 tiers plus 7 resetting ones of 2–3; the measured value is per ladder, so one card per badge would repeat it many times over); grouping and tier order are **data-driven** from the server's `type`/`tier` (the codes are not parseable — `DAILY_BURST` is tier 3 while `DAILY_BURST_4` is tier 1, so no client code table is needed or possible); the page is split into **Lifetime** (never resets) and **Current period** (Day/Week/Month/Year, each card labelled with its window) since a permanent record and an expiring goal must not read as the same kind of thing; each card shows inline SVG artwork whose paint rises through the existing indigo ladder (`#3d49ad` → `#8290f0` → `#b9c1ff`, plus a ring when maxed) with no second palette and no image assets, the earned tier's name, a rung strip for the ladder's shape, and progress measured **between the current and next rung** (a bar against the current rung alone would read 100% the moment it unlocked); header totals count tiers (`19 / 67 · 28%`); cards ordered nearest-to-next-rung first with completed ladders last, compared as a unit-free fraction so unlike units never compete; an unrecognised family still renders (generic medallion) rather than being dropped; each resetting card also reports **how many periods the ladder has been reached in** and its current **run of consecutive periods**, both computed server-side from session history — counting unlock rows would measure how often the page was opened, since those rows are written only on a visit; the values are per rung, so the card reports its base rung, which is monotone and still defined when the current period is unmet |
| Stats Dashboard         | `/dashboard` with All-time default and date-range presets + device/IDE origin filters (mutually exclusive, URL-state `?start&end&deviceId&ideName` shareable/refresh-preserving); 6-field summary cards (Today/Daily avg/week/month/year/Total); plugin-parity panel set (heatmap, 30-day trend, language/project/weekday/IDE distributions, time-of-day capsule, hourly stats) with per-panel loading/error/empty states; GitHub-style heatmap year selector (`?year=`, "Last 12 months" default, years from backend v0.61.0 `heatmap-years`); coding trend chart live (smooth line + indigo gradient area, filter-independent like the plugin panel; defaults to the plugin's Last 30 Days and accepts a calendar-month window via the card's own picker — `?trendMonth=yyyy-MM`, options limited to months that actually have data via backend v0.67.0 `heatmap-months`); weekly activity by hour live (7×24 heatmap, filter-range driven via backend v0.63.0 `week-hour`, dynamic color scale + calculable scroll bar); average hourly duration live (24 bars, indigo gradient, active-day note, filter-range driven via backend v0.64.0 `hourly` start/end); time of day distribution live (4-bucket capsule strip Night/Morning/Daytime/Evening, indigo daylight ramp, fixed clock order — via `distribution?type=TIME_OF_DAY`, full-history until backend ships window params); language distribution live (ranked horizontal bars, indigo luminance ramp decaying with rank, % · duration end labels, 0.1% Others folding — via `distribution?type=LANGUAGES`); project distribution live (same ranked-bar treatment via a shared `RankedDistributionList` — ranking, folding floor, gradient and percent precision have one implementation across both categorical panels — via `distribution?type=PROJECTS`); recent sessions live (local-day grouped session log — newest first, `HH:mm` + project + language + duration per row, 40-char names truncate with the full name on hover, no day total because parallel sessions overlap in real time; grouped list region extracted to a shared `ScrollFadeList` with the distribution list; endpoint `/stats/recent` takes no date window so this panel follows the origin filters only, not the period — via `limit=20`); single panel grid driven by container queries — cards pair two-across only when each keeps ≥830px (row ≥1684px), otherwise full-width rows (heatmap included — cell renderer clamps to available width; no placeholder cards, streak stats live in the heatmap footer); summary cards go 6-across only at ≥1430px row width, else 3-across; summary cards durations capped at hours with seconds precision; route-level Suspense skeleton + chunk-failure toast (no blank view); filter changes re-key every stats query (backend v0.60.0 `ideName` + `ide-filters`) |

## 🗺 Project Structure

```text
src/
├── features/       # Feature modules (achievements/, auth/, dashboard/, devices/, landing/, leaderboard/, settings/)
├── layouts/        # Layout components (AuthLayout, AppLayout, MarketingLayout)
├── components/     # Shared components (ui/, app/)
├── lib/            # Core utilities (api/, schemas/)
├── stores/         # Pinia stores (auth)
├── router/         # Vue Router + guards
└── views/          # Top-level views
```

## 🔗 Related Projects

- [ctt-server](https://github.com/AhogeK/ctt-server) — Spring Boot 4 backend (JWT + API Key auth, sync engine,
  leaderboard)
- [code-time-tracker](https://github.com/AhogeK/code-time-tracker) — JetBrains IDE plugin

## 🛠 Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

> Disable **Vetur** if previously installed — it conflicts with the official Vue extension.

**Browser DevTools:**

- Chromium (Chrome / Edge /
  Brave): [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) · [Enable Custom Object Formatter](http://bit.ly/object-formatters)
- Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/) · [Enable Custom Object Formatter](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## 🚀 Getting Started

### Prerequisites

- **Node.js** `^20.19.0 || >=22.12.0`
- **pnpm** `>=10` (v11 in use) — install standalone via `npm i -g pnpm` or
  `corepack enable && corepack prepare pnpm@latest --activate`

### Install

```sh
pnpm install
```

### Development

```sh
pnpm dev
```

### Type Check + Production Build

```sh
pnpm build
```

### Preview Production Build

```sh
pnpm preview
```

## 🧪 Testing

### Unit Tests (Vitest)

### Test Infrastructure

- **Setup**: `src/test/setup.ts` auto-cleanup + browser API mocks
- **Environment**: jsdom with matchMedia + ResizeObserver mocks for Radix UI / shadcn-vue
- **Globals**: Vitest globals enabled (no import needed for describe/it/expect)
- **Assertions**: @testing-library/jest-dom provides semantic matchers (toBeInTheDocument, etc.)

```sh
pnpm test:unit
```

### E2E Tests (Playwright)

```sh
# First run — install browsers
pnpm exec playwright install

# Run all E2E tests
pnpm test:e2e

# Chromium only
pnpm test:e2e --project=chromium

# Specific file
pnpm test:e2e e2e/example.spec.ts

# Debug mode
pnpm test:e2e --debug

# Against a production build
pnpm build && pnpm test:e2e
```

**Coverage.** Each feature folder under `e2e/` mocks its own endpoints with `page.route()` and
drives the real router, so a spec exercises the page the way a user reaches it. Fixtures declare
the **wire** shape locally (never imported from `src/`), which is what lets them reproduce the
server's omitted-key cases — a LIFETIME badge with no `windowStart`, a deleted leaderboard account
with no `displayName`.

Two assertions are worth knowing about before editing them, because they are the only place the
claim can be checked: the trophy artwork's fit inside its completion ring is measured from the
rendered geometry (jsdom reports every `getBBox()` as zero, so the unit tests cannot), and the
leaderboard's period selector is asserted against the requests actually put on the wire — an
unsupported dimension/period pair is a `400 COMMON_003` rather than a fallback, so the selector
must never be able to build one.

The suite runs on **chromium only** — the engine `playwright install` provisions. The scaffold's `firefox`/`webkit` projects were removed because no assertion was ever
written against them and `pnpm test:e2e` therefore failed at launch for everyone; a project that
is never run is a failing step, not coverage. Re-enable one only after installing its engine and
running its suite.

## 🔍 Lint & Format

```sh
# Lint (Oxlint primary, ESLint supplemental)
pnpm lint

# Format with Oxfmt
pnpm format

# Type check only
pnpm type-check
```

Pre-commit hooks run automatically via `simple-git-hooks` + `lint-staged` on staged `*.ts`, `*.vue`, `*.js` files.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ☕ by [AhogeK](https://github.com/AhogeK)
