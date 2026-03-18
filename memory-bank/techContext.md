# Tech Context: ctt-web

## Core Stack

| Layer          | Technology                         | Version     |
|----------------|------------------------------------|-------------|
| Build          | Vite + Rolldown                    | ^8.0        |
| Framework      | Vue 3 + TypeScript Strict          | ^3.5        |
| Routing        | Vue Router                         | ^4          |
| Server State   | TanStack Query                     | ^5          |
| Global State   | Pinia                              | ^3          |
| UI             | Radix Vue + shadcn-vue             | latest      |
| Styles         | Tailwind CSS + @tailwindcss/vite   | ^4          |
| Charts         | Apache ECharts + vue-echarts       | ^6 / ^8     |
| HTTP           | ofetch                             | ^1          |
| Validation     | Vee-Validate + Zod                 | ^4 / ^4     |
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

## Key Architectural Decisions

- Server State (API data) → TanStack Query only, never Pinia
- URL state (filters, pagination) → vue-router SearchParams
- Global state (auth session, theme) → Pinia
- All API types defined as Zod schemas in `lib/schemas/`, aligned with ctt-server DTOs
- `ofetch` instance in `lib/api/` is the single HTTP boundary
