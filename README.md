# ctt-web

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.x-42b883.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff.svg)](https://vite.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-10.x-f69220.svg)](https://pnpm.io/)

Web dashboard frontend for [CTT Server](https://github.com/AhogeK/ctt-server) — the cloud sync backend of
the [Code Time Tracker](https://github.com/AhogeK/code-time-tracker) JetBrains plugin.

Provides a personal analytics dashboard, device management, API key management, leaderboard, and multi-device sync
visualization.

## ✨ Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Framework      | Vue 3 + TypeScript (Strict)                     |
| Build          | Vite 8 (Rolldown engine)                        |
| Routing        | Vue Router 4                                    |
| Server State   | TanStack Query v5                               |
| Global State   | Pinia 3                                         |
| UI             | Radix Vue + shadcn-vue + Tailwind CSS v4        |
| Charts         | Apache ECharts + vue-echarts                    |
| HTTP           | ofetch                                          |
| Validation     | Vee-Validate + Zod                              |
| Icons          | Iconify Vue                                     |
| i18n           | Vue I18n v11                                    |
| Package Manger | pnpm v10 (via corepack)                         |
| Lint           | Oxlint v1 (primary) + ESLint                    |
| Format         | Oxfmt (100% Prettier compatible)                |
| Git Hooks      | simple-git-hooks + lint-staged                  |
| Unit Test      | Vitest 4 + Testing Library Vue                  |
| E2E Test       | Playwright                                      |
| Type Check     | vue-tsc (standalone CI step)                    |


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
- **pnpm** `>=10` — install via `corepack enable && corepack prepare pnpm@latest --activate`

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
pnpm test:e2e tests/example.spec.ts

# Debug mode
pnpm test:e2e --debug

# CI — must build first
pnpm build && pnpm test:e2e
```

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
