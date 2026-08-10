# Contributing to ctt-web

Thanks for contributing! This guide covers everything you need to know.

## Getting Started

```bash
# Clone and install
git clone https://github.com/AhogeK/ctt-web
cd ctt-web
pnpm install

# Start development server
pnpm dev
```

**Prerequisites:**

- Node.js `^20.19.0 || >=22.12.0`
- pnpm `>=10` — install via `corepack enable && corepack prepare pnpm@latest --activate`

## Code Style

**Linting:** Oxlint (primary) + ESLint (type-aware rules)

```bash
pnpm lint        # Check and fix
pnpm lint:oxlint # Oxlint only
pnpm lint:eslint # ESLint only
```

**Formatting:** Oxfmt (Prettier compatible)

```bash
pnpm format      # Format all files
pnpm format:check # Check without writing
```

**TypeScript:** Strict mode, no `any`

```bash
pnpm type-check  # Verify types
```

**Vue Conventions:**

- Always use `<script setup lang="ts">`
- Props typed with `defineProps<{...}>()`
- Emits typed with `defineEmits<{...}>()`
- Use `defineModel` for two-way binding
- No Options API in new code

**Naming:**

- Components: `PascalCase.vue`
- Composables: `use*.ts` (camelCase)
- Stores: `use*Store.ts` (camelCase)
- Constants: `UPPER_SNAKE_CASE`
- Files/dirs: `kebab-case`

## Commit Messages

Follow Conventional Commits with optional scope:

```
feat(dashboard): implement coding heatmap chart
fix(auth): handle JWT expiry redirect loop
docs: update README installation steps
refactor: extract auth logic to composable
test: add auth store unit tests
chore: update pnpm-lock.yaml
```

**Format:** `<type>(<scope>): <subject>` (lowercase, no period)

**Types:**

- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `style` — Formatting (no logic change)
- `refactor` — Code refactor
- `perf` — Performance improvement
- `test` — Test additions/changes
- `chore` — Maintenance, config, deps
- `ci` — CI/CD changes

**Setup commit template:**

```bash
git config commit.template .gitmessage
```

## Pull Requests

**Before submitting:**

- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] Tests added/updated for new features
- [ ] No `any` types introduced
- [ ] No API data stored in Pinia
- [ ] Error states handled in all queries
- [ ] i18n keys used (no hardcoded strings)
- [ ] No `console.log` left in code

**Branch naming:**

| Type     | Pattern                         | Example                        |
| -------- | ------------------------------- | ------------------------------ |
| Feature  | `feat/{ticket-id}-{short-desc}` | `feat/CTT-42-dashboard-charts` |
| Bugfix   | `fix/{ticket-id}-{short-desc}`  | `fix/CTT-55-auth-redirect`     |
| Docs     | `docs/{short-desc}`             | `docs/contributing-guide`      |
| Refactor | `refactor/{short-desc}`         | `refactor/extract-composable`  |

**PR Process:**

1. Create branch from `develop`
2. Make changes and commit
3. Push and create PR to `develop`
4. Wait for review/approval
5. Merge (squash merge preferred)

## Testing

**Run tests:**

```bash
pnpm test:unit     # Unit tests (Vitest)
pnpm test:e2e      # E2E tests (Playwright)
pnpm test          # All tests
```

**First-time E2E setup:**

```bash
pnpm exec playwright install
```

**Coverage expectations:**

- Unit tests (composables, utils): > 80%
- Component tests: critical interaction paths
- E2E tests: login → dashboard → device management

**Test structure (AAA pattern):**

```typescript
describe('UserCard', () => {
  it('should display username', () => {
    // Arrange
    const user = { username: 'AhogeK' }
    // Act
    render(UserCard, { props: { user } })
    // Assert
    expect(screen.getByText('AhogeK')).toBeInTheDocument()
  })
})
```

## Project Structure

```
src/
├── features/       # Feature modules (auth, dashboard, devices, leaderboard)
├── layouts/        # Layout components
├── components/     # Shared components
│   ├── ui/         # shadcn-vue base components
│   └── charts/     # ECharts wrappers
├── composables/    # use*.ts shared logic
├── lib/
│   ├── api/        # ofetch instance + typed API calls
│   └── schemas/    # Zod schemas (aligned with backend DTOs)
├── stores/         # Pinia stores (auth session, theme only)
├── router/         # Vue Router + guards
├── i18n/           # zh-CN / en-US locale files
└── views/          # Top-level views
```

**State management:**

| State Type   | Tool               | Scope                   |
| ------------ | ------------------ | ----------------------- |
| Server State | TanStack Query     | All API data            |
| URL State    | vue-router query   | Filters, pagination     |
| Global UI    | Pinia              | Auth session, theme     |
| Local UI     | `ref` / `reactive` | Component-level toggles |

**Anti-patterns (forbidden):**

- Storing API response data in Pinia
- Prop drilling beyond 2 levels
- Using `v-html` without sanitization

## Resources

- [Vue 3 Docs](https://vuejs.org/)
- [Vite 8 Docs](https://vitejs.dev/)
- [shadcn-vue](https://www.shadcn-vue.com/)
- [Pinia](https://pinia.vuejs.org/)
- [TanStack Query](https://tanstack.com/query)
- [Zod](https://zod.dev/)
