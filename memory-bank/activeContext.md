# Active Context: ctt-web

## Current Status

**Phase**: Project scaffold — initial setup

## What Was Just Done

- Technology stack finalized (Vite 8 + Vue 3 + VoidZero toolchain)
- package.json dependencies established
- README written
- CONVENTIONS.md, AGENTS.md, memory-bank initialized
- Git repository initialized and pushed to GitHub
- MIT License added via GitHub API

## Current Focus

Setting up project scaffold:
- [ ] vite.config.ts
- [ ] tsconfig.json (strict mode)
- [ ] tailwind.config / CSS entry
- [ ] oxlint.json
- [ ] .oxfmtrc / oxfmt config
- [ ] eslint.config.ts (supplemental)
- [ ] src/ directory structure
- [ ] Router setup
- [ ] Pinia store stubs
- [ ] API layer (ofetch instance)
- [ ] i18n setup (zh-CN / en-US)

## Known Blockers

None currently.

## Recent Decisions

- Oxlint as primary linter; ESLint retained only for @vitest/eslint-plugin and eslint-plugin-playwright
- pnpm via corepack for reproducible installs
- TanStack Query for all server state; Pinia only for auth + theme
