# Active Context: ctt-web

## Current Status

**Phase**: Scaffold complete — ready for feature development
**Version**: 0.1.0-beta.1 (2025-03-24)

## What Was Just Done

- Scaffold setup completed (Vite 8 + Vue 3 + Tailwind CSS v4 + shadcn-vue)
- Oxlint + ESLint toolchain configured and verified
- AGENTS.md updated with R14 (版本号管理)
- Version bumped: 0.0.0 → 0.1.0
- **Branch management operations (2025-04-01)**:
  - Created `develop` branch from master for AI-assisted development
  - Cleaned AI-related files from master branch (AGENTS.md, memory-bank/, etc.)
  - Cherry-picked dependency update (ccc40f0) from develop to master (e9bc662)
  - memory-bank maintained only on develop branch

## Current Focus

Ready for next phase:
- Authentication flow (login/logout)
- Dashboard layout
- API integration with ctt-server

## Known Blockers

None currently.

## Recent Decisions

- Oxlint as primary linter; ESLint for type-aware rules
- `vue/multi-word-component-names` disabled (shadcn-vue convention)
- oxfmt as sole formatter (no Prettier)

## Version History

| Version | Date | Change |
|---------|------|--------|
| 0.1.0 | 2025-03-24 | Scaffold complete, ready for development |
| 0.0.0 | - | Initial project creation |

## Branch History

| Date | Branch | Operation |
|------|--------|-----------|
| 2025-04-01 | develop | Created from master for AI-assisted development |
| 2025-04-01 | master | Cleaned AI files (AGENTS.md, memory-bank/) |
| 2025-04-01 | master | Cherry-picked dependency update from develop (ccc40f0 → e9bc662) |