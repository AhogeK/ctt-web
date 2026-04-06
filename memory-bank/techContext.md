# Tech Context: ctt-web

## Core Stack

| Layer          | Technology                         | Version     |
|----------------|------------------------------------|-------------|
| Build          | Vite + Rolldown                    | ^8.0 (beta) |
| Framework      | Vue 3 + TypeScript Strict          | ^3.5        |
| Routing        | Vue Router                         | ^4          |
| Server State   | TanStack Query                     | ^5          |
| Global State   | Pinia                              | ^3          |
| UI             | Radix Vue + shadcn-vue             | latest      |
| Styles         | Tailwind CSS + @tailwindcss/vite   | ^4          |
| Charts         | Apache ECharts + vue-echarts       | ^6 / ^8     |
| HTTP           | ofetch                             | ^1          |
| Validation     | Vee-Validate + Zod                 | ^4 / ^4.3.6 |
| Icons          | @iconify/vue                       | ^5          |
| i18n           | Vue I18n                           | ^11         |
| Package Mgr    | pnpm (via corepack)                | ^10         |

## Dev Toolchain (VoidZero Ecosystem)

| Tool                   | Version  | Role                        |
|------------------------|----------|-----------------------------|
| Oxlint                 | ~1.50    | Primary linter              |
| Oxfmt                  | ^0.35    | Formatter (Prettier compat) |
| ESLint                 | ^10      | Supplemental (vitest/pw)    |
| Vitest                 | ^4       | Unit + component tests      |
| @testing-library/vue   | ^8       | Component behavior tests    |
| Playwright             | ^1.58    | E2E tests                   |
| vue-tsc                | ^3       | Type checking               |
| simple-git-hooks       | ^2       | Pre-commit hooks            |
| lint-staged            | ^16      | Staged file lint/format     |

## API Authentication

- Web users: JWT Bearer token (from ctt-server `/api/v1/auth/login`)
- GitHub OAuth: supported via ctt-server OAuth flow
- Device API keys: managed in devices section (for plugin pairing display)

## API Layer Architecture

- **HTTP Client**: `ofetch` instance in `src/lib/api/instance.ts`
- **Token Injection**: Request interceptor reads from localStorage, injects `Authorization: Bearer <token>`
- **Error Handling**: Global `onResponseError` interceptor handles 401/403/500 with toast notifications
- **Decoupling**: CustomEvent (`api:unauthorized`) dispatched on 401, listened in `main.ts` for auth cleanup + redirect
- **Token Persistence**: localStorage with `ctt_` prefix keys (`ctt_access_token`, `ctt_refresh_token`, `ctt_user_id`)

## Key Architectural Decisions

- Server State (API data) → TanStack Query only, never Pinia
- URL state (filters, pagination) → vue-router SearchParams
- Global state (auth session, theme) → Pinia
- All API types defined as Zod schemas in `lib/schemas/`, aligned with ctt-server DTOs
- `ofetch` instance in `lib/api/` is the single HTTP boundary
