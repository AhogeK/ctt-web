# Domain Knowledge Map — ctt-web

Structured, domain-first knowledge base for this project. Governed by **AGENTS.md R24**.

## Two layers, different jobs

| Layer                   | Location                  | Answers                          | Nature                                |
| ----------------------- | ------------------------- | -------------------------------- | ------------------------------------- |
| Timeline                | `memory-bank/*.md`        | "what is happening / just changed" | Chronological, superseded by time     |
| **Domain (this tree)**  | `memory-bank/domains/<domain>/` | "what is true and what to do here" | Durable, judged, never a changelog    |

Cross-cutting conventions (naming, component architecture, error handling) stay in
`systemPatterns.md`. Domain files hold the **domain-specific judgement** and must not
duplicate it — link instead.

## Domains

| Domain                                             | Scope                                                                                 | Entry point                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [`dashboard-visualization`](./dashboard-visualization/meta.md) | Chart panels under `/dashboard`: chart-type choice, colour ramps, layout thresholds, hover/scroll interaction, ECharts specifics | `dashboard-visualization/meta.md`                   |
| [`backend-contract`](./backend-contract/meta.md)   | Consuming ctt-server APIs: contract-first workflow, Zod/API-layer patterns, distribution semantics, raising backend requests | `backend-contract/meta.md`                          |
| [`ai-workflow`](./ai-workflow/meta.md)             | How the agent itself works in this repo: memory upkeep, versioning, atomic commits, verification, resource ownership | `ai-workflow/meta.md`                               |

## File set inside every domain (AGENTS.md R24 — build it filled, never as a stub)

| File             | Holds                                                        | Read it when                                        |
| ---------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `meta.md`        | Boundary, owned paths, terminology, where to start           | You do not yet know whether this domain applies      |
| `principles.md`  | Invariants and first principles — the tie-breakers           | Two options conflict and you need the deciding rule  |
| `scenarios.md`   | Trigger → judgement → action                                 | A familiar-looking problem appears                   |
| `practices.md`   | Concrete how-to, parameters, code patterns, traps avoided    | You know what to do and need to do it correctly      |
| `references.md`  | Facts: endpoints, colour values, file paths, data dictionary | You need to look something up, not decide            |

## Growing the map

- Create a domain only when real reusable knowledge exists — an empty domain is a violation, not a placeholder.
- New knowledge: find its domain → update the matching file. No domain fits → create one with the full five-file set.
- Keep `README.md` (this table) in sync with the directory tree.
- Every file stays **≤200 lines** (AGENTS.md). Over that → split or compress, never truncate judgement.

## Domain inventory conventions

- Domain name: `kebab-case`, names a **capability or knowledge area**, not a document kind.
- One domain = one coherent thing a developer could be responsible for end to end.
- If two domains start sharing most of their `principles.md`, they are one domain — merge them.
