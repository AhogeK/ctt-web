# ai-workflow — meta

## Boundary

How the agent behaves **inside this repository**: where knowledge lives, how it is kept honest,
how work is versioned and committed, how it is verified, and what it is allowed to touch.

This domain is about the *working process*, not the product. Product knowledge lives in the other
domains; this one governs how that knowledge gets written, trusted and delivered.

**In scope**: memory/knowledge upkeep, versioning, commit granularity, branch policy, verification
evidence, resource ownership, read-only boundaries.

**Out of scope**:

- What the dashboard should look like → [`dashboard-visualization`](../dashboard-visualization/meta.md)
- How to consume the backend → [`backend-contract`](../backend-contract/meta.md)
- The rules themselves (they live in `AGENTS.md`) — this domain holds the *practices and traps*
  behind them, and the reasoning that makes them stick

## Owned paths

| Path                        | Role                                                          |
| --------------------------- | ------------------------------------------------------------- |
| `AGENTS.md`                 | The binding rules (R1–R24). Agent-maintained.                 |
| `memory-bank/*.md`          | Timeline layer: status, progress, cross-cutting patterns      |
| `memory-bank/domains/`      | Domain layer: this knowledge graph                            |
| `memory-bank/archives/`            | Frozen history moved out of the timeline layer                |
| `.sisyphus/`                | Local dev helpers (token bootstrap, scratch verification)     |

## Terminology

| Term              | Meaning                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| Timeline layer    | `activeContext.md` / `progress.md` — chronological, superseded by time         |
| Domain layer      | `memory-bank/domains/<domain>/` — durable judgement, never a changelog          |
| Cross-cutting     | Conventions that apply everywhere → `systemPatterns.md`                         |
| Atomic commit     | One change in one commit; code and its version bump are separate commits        |
| Task-level rule   | A user instruction governs one task; it is not standing authorization to commit |
| Evidence          | A measured value, a screenshot, a test run — not "it should work"              |

## Where to start

- About to change anything → `scenarios.md` (which flow applies)
- Deciding how to record knowledge → `principles.md` P5–P7
- Committing / versioning → `practices.md`, then R6/R6.5 in `AGENTS.md`
- Looking up a remembered detail → `references.md`
