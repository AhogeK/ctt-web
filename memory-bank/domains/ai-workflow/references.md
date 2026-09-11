# ai-workflow — references

Lookup facts about the working environment and project conventions. No judgement here.

## Memory & docs layout

| Path                                          | Contents                                                    |
| --------------------------------------------- | ----------------------------------------------------------- |
| `AGENTS.md`                                   | Binding rules R1–R25 (agent-maintained)                      |
| `memory-bank/projectbrief.md`                 | Goal and scope of the project                                |
| `memory-bank/techContext.md`                  | Stack, versions, toolchain pins, API/auth basics             |
| `memory-bank/systemPatterns.md`               | Cross-cutting conventions (components, state, errors, routing)|
| `memory-bank/activeContext.md`                | Current status + recent rounds + cross-cutting lessons        |
| `memory-bank/progress.md`                     | Milestone table + compressed version history                  |
| `memory-bank/domains/`                        | Domain knowledge graph (see `domains/README.md`)              |
| `memory-bank/archives/`                       | Frozen timeline history (dated files); **the one memory artifact exempt from the 200-line limit** |
| `docs/`                                       | **User-facing project docs only** — `architecture.md`, `dev-handbook.md`. Never AI artifacts (R25) |
| `.omp/`                                       | AI working directory (**gitignored** — nothing here is committed)                             |
| `.omp/plans/`                                 | Implementation plans: `<feature>-plan.md` (no date — recency is mtime)                         |
| `.omp/*.md`                                   | Delivery reports (`<feature>-delivery-report.md`), requirement drafts (`<topic>-requirement.md`) |
| `.sisyphus/`                                  | Local dev helpers (token bootstrap, verification scratch)      |

## Limits and formats

| Rule                    | Value                                                      |
| ----------------------- | ---------------------------------------------------------- |
| Memory file size        | ≤200 lines each — `memory-bank/archives/` exempt (AGENTS.md 约束 2) |
| Commit subject          | ≤72 characters (commitlint `subject-max-length`)            |
| Version location        | `package.json` → `version` (single source)                  |
| Version bump semantics  | fix → PATCH, feature → MINOR, breaking → MAJOR               |
| Todo threshold          | 3+ steps → todo list first (R10)                             |

## Lint gates (two, and they are not identical)

| Gate                  | Where            | Notes                                                                 |
| --------------------- | ---------------- | --------------------------------------------------------------------- |
| `pnpm lint`           | CLI / pre-commit | `vp lint . --fix` (oxlint + `plugins: [eslint, typescript, unicorn, oxc, vue, vitest]`); **auto-fixes**, so a violation never surfaces as an error |
| `vp lint <path>`      | CLI, read-only   | Same rules without `--fix` — errors and exits 1. Use this to prove a rule is actually enabled |
| SonarLint             | IDE (editor)     | A **different** rule set (SonarJS/SonarTS, e.g. `typescript:S5906`). It flags things the project lint does not, so an IDE squiggle is worth reading rather than assuming the CLI would have caught it |

Both live in `vite.config.ts` (`lint.rules`); adding a rule is a one-line change but a config
decision, so confirm before doing it.

## Commands used routinely

| Task                | Command                                                        |
| ------------------- | -------------------------------------------------------------- |
| Dev server (bg)     | `vp dev` (log to a file; it is long-running)                     |
| Type check          | `pnpm type-check`                                               |
| Lint (+format)      | `pnpm lint`                                                     |
| Unit tests          | `pnpm test:unit --run`                                          |
| Build               | `pnpm build`                                                    |
| E2E one spec        | `env -u CI pnpm test:e2e e2e/<spec>.ts --project=chromium`       |
| Dependency update   | `vp update -L` then re-pin TS and vitest (see `techContext.md`)  |

Scripts must not implicitly install dependencies while verifying — the guard and its rationale live
in `techContext.md` (pnpm workspace settings); the regression symptom is S9.

## Git facts

| Item                | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| Working branch      | `develop` (AI branch; all work lands here first)                |
| Release branch      | `master` (non-AI commits only, cherry-picked one by one)        |
| Read-only git ops   | `status`, `log`, `diff`, `show`                                 |
| Never without ask   | `add`, `commit`, `push`, `rebase`, `merge`, `reset`, `stash`, `tag` |
| Forbidden outright  | `git reset` restoring the tree to an earlier state (R17)         |

## Headless Chrome (verification)

Launch pattern used throughout this project:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=<port> --user-data-dir=/tmp/<profile> \
  --no-first-run --no-default-browser-check --headless=new about:blank
```

- Record the PID; on teardown match the command line against `<profile>`, then stop it.
- Each profile directory is scratch — delete it after use.
- Theme switching requires CDP media emulation (see `dashboard-visualization/practices.md`).

## Domain inventory (current)

| Domain                                                    | Covers                                     |
| --------------------------------------------------------- | ------------------------------------------ |
| [`dashboard-visualization`](../dashboard-visualization/meta.md) | Charting, colour, layout, panel interaction |
| [`backend-contract`](../backend-contract/meta.md)         | ctt-server consumption and semantics        |
| [`ai-workflow`](./meta.md)                                | This domain — how the agent works here      |
