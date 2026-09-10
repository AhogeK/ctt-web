# ai-workflow — references

Lookup facts about the working environment and project conventions. No judgement here.

## Memory & docs layout

| Path                                          | Contents                                                    |
| --------------------------------------------- | ----------------------------------------------------------- |
| `AGENTS.md`                                   | Binding rules R1–R24 (agent-maintained)                      |
| `memory-bank/projectbrief.md`                 | Goal and scope of the project                                |
| `memory-bank/techContext.md`                  | Stack, versions, toolchain pins, API/auth basics             |
| `memory-bank/systemPatterns.md`               | Cross-cutting conventions (components, state, errors, routing)|
| `memory-bank/activeContext.md`                | Current status + recent rounds + cross-cutting lessons        |
| `memory-bank/progress.md`                     | Milestone table + compressed version history                  |
| `memory-bank/domains/`                        | Domain knowledge graph (see `domains/README.md`)              |
| `docs/archives/`                              | Frozen timeline history (dated files)                         |
| `docs/plans/`                                 | Written plans — created only when a change spans enough files to need one (R10 keeps routine planning in the todo list) |
| `.sisyphus/`                                  | Local dev helpers (token bootstrap, verification scratch)      |

## Limits and formats

| Rule                    | Value                                                      |
| ----------------------- | ---------------------------------------------------------- |
| Memory file size        | ≤200 lines each (AGENTS.md 约束 2)                          |
| Commit subject          | ≤72 characters (commitlint `subject-max-length`)            |
| Version location        | `package.json` → `version` (single source)                  |
| Version bump semantics  | fix → PATCH, feature → MINOR, breaking → MAJOR               |
| Todo threshold          | 3+ steps → todo list first (R10)                             |

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
