# Active Context: ctt-web

## Current Status

**Phase**: Scaffold complete — ready for feature development
**Version**: 0.1.0-beta.1 (2025-03-24)

## What Was Just Done

- Scaffold setup completed (Vite 8 + Vue 3 + Tailwind CSS v4 + shadcn-vue)
- Oxlint + ESLint toolchain configured and verified
- AGENTS.md updated with R14 (版本号管理)
- Version bumped: 0.0.0 → 0.1.0

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