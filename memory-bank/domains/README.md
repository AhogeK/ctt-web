# Domain Knowledge Map — ctt-web

Structured, domain-first knowledge base for this project. Governed by **AGENTS.md R24** — that rule
carries the constraints; this file carries the operating procedure.

**Why structure beats search here.** The fixed file set is a *coverage constraint*: it states what
must be understood before acting in this domain. Retrieval can tell you what looks related; it
cannot tell you that you are missing the constraint that decides the answer. Structure first,
search for what the structure does not yet cover.

## How a domain is read (progressive disclosure)

Do not load a whole domain tree. Each file answers one question and the next file is chosen by the
previous answer — loading everything up front spends attention on knowledge the current judgement
does not need.

| Step | Read                       | To answer                                                    |
| ---- | -------------------------- | ------------------------------------------------------------ |
| 1    | `meta.md`                  | Does this domain own the problem? What is it called here? **And how current is it** (baseline) |
| 2    | `scenarios.md` → `principles.md` | Which judgement applies; what decides when two options conflict |
| 3    | `practices.md`             | How to actually do it — parameters, code shapes, traps        |
| 4    | `references.md`            | The facts: endpoints, codes, keys, paths                      |
| 5    | the source                 | Whether those facts are still true (R24 回源)                 |

Steps 2–4 are not a fixed sequence: a contract question can start at `references.md`, a "why is it
like this" question starts at `practices.md`.

A file you cannot fill honestly means the domain is not ready to exist — leave it unbuilt rather
than creating a stub.

## Maintenance

**Incremental — triggered by a change.** When a contract or structure moves (component API, route,
Zod schema, error-code mapping, design token), update the domain files that describe it, in the same
round. Automation's job is to notice the change, surface the affected files and block the omission —
never to rewrite the knowledge. A code change does not by itself redefine what a field means; for
high-risk knowledge the semantic confirmation is the user's (R24).

**Calibration — triggered by reflection.** After a large refactor, an incident review or a release
retrospective, read the domain files against the source and check for drift. Drift is found by
looking, not by waiting for someone to trip over stale guidance.

**The concrete trigger for this repo.** `backend-contract` facts are read out of `../ctt-server`,
which moves independently of us. When its `appVersion` (`gradle/libs.versions.toml`) changes, re-check
the facts in `backend-contract` and `achievements` that pin a version. A cheap first pass is the diff
itself:

```bash
git -C ../ctt-server diff --stat <old-bump> HEAD     # which packages moved?
```

**Drift handling.** When a domain file and the source disagree, decide which one is the fact source
*before* editing either:

| Situation                                             | Action                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Source is the current behaviour; the domain file is stale | Fix the domain file                                                                 |
| The domain file records an intended rule the source violates | That is a defect — report it; do not "fix" the knowledge to match the source        |
| Neither is clearly authoritative (intent unclear)     | Mark the claim **待确认** with what would settle it; do not silently pick one       |

When the drift implies a **code** change to a contract we are not allowed to redefine unilaterally
(R7: Zod schemas, routes, architecture), record it here and report it — do not edit the schema on
the strength of a knowledge task.

## Verification baseline

Every `meta.md` states when the domain was last checked against its source and at which version, so
a reader can judge how much to trust a fact **before** re-verifying it. The baseline is a claim like
any other: a domain whose content predates the current source version says so, rather than implying
it was just checked.

## Index integrity

This file is the map; a map that disagrees with the territory is worse than no map. After adding,
renaming or removing a domain, update the table below in the same change.

## Decisions already made — do not relitigate

| Question                                   | Decision                                                            | Why                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Co-locate with the code, or a separate repo? | **Co-located** (`memory-bank/` is git-tracked)                      | Knowledge must move in the same commit as the change it describes (R5/R6.5); no extra tooling or sync step             |
| Markdown or YAML?                          | **Markdown**                                                        | Read by a human *and* an agent; tables already carry the structure, and at this corpus size the density argument for YAML does not pay for the loss of readability. Revisit only if a large machine-only corpus appears |
| Store each fact here, or link to it?       | **Link**                                                            | Duplication is what makes knowledge drift; every fact gets one home (R24 分层分工)                                     |
| Structure first, or retrieval first?       | **Structure first**                                                 | Retrieval finds what looks related; it cannot tell you which constraint you are missing. Search is for corroboration   |
| Is our Zod schema the authority on the backend contract? | **No — `../ctt-server` source is**                     | The schema is a transcription. When they disagree the schema is wrong; `R13` requires reading the source, not our copy |

## Domains

| Domain                                             | Scope                                                                                 | Entry point                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [`dashboard-visualization`](./dashboard-visualization/meta.md) | Chart panels under `/dashboard`: chart-type choice, colour ramps, layout thresholds, hover/scroll interaction, ECharts specifics (see its `rendering.md`) | `dashboard-visualization/meta.md`                   |
| [`backend-contract`](./backend-contract/meta.md)   | Consuming ctt-server APIs: contract-first workflow, Zod/API-layer patterns, distribution semantics, raising backend requests | `backend-contract/meta.md`                          |
| [`ai-workflow`](./ai-workflow/meta.md)             | How the agent itself works in this repo: memory upkeep, versioning, atomic commits, verification, resource ownership | `ai-workflow/meta.md`                               |
| [`achievements`](./achievements/meta.md)           | The trophy cabinet at `/achievements`: badge → `(family, window)` grouping, tier ladders, resetting windows, rank paint, progress semantics | `achievements/meta.md`                              |

## File set inside every domain (AGENTS.md R24 — build it filled, never as a stub)

| File             | Holds                                                        | Read it when                                        |
| ---------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `meta.md`        | Boundary, owned paths, terminology, where to start, **verification baseline** | You do not yet know whether this domain applies      |
| `principles.md`  | Invariants and first principles — the tie-breakers           | Two options conflict and you need the deciding rule  |
| `scenarios.md`   | Trigger → judgement → action                                 | A familiar-looking problem appears                   |
| `practices.md`   | Concrete how-to, parameters, code patterns, traps avoided    | You know what to do and need to do it correctly      |
| `references.md`  | Facts: endpoints, colour values, file paths, data dictionary | You need to look something up, not decide            |

## Where a fact comes from (回源 — R24)

Different facts have different authorities; checking one against the wrong source is how a claim
ends up confidently wrong.

| Fact about | Confirm against |
| --- | --- |
| This repo's behaviour (components, state, routes, styles) | `src/` and its config |
| **What the UI actually renders** (colour, geometry, interaction) | **A real browser render** — computed styles, measured geometry. Declared CSS is not evidence. |
| Backend contract (endpoints, fields, error codes, semantics) | `../ctt-server` source (read-only, R13) + the `appVersion` at the time of recording |
| User / product intent | The user's own words — never infer it backwards from what the code happens to do |
| Why something is the way it is | `git log`, `memory-bank/archives/` |

Two inferences are forbidden: ① "the code does X, therefore X is the correct business rule";
② "an old document said X, so the code cannot have changed".

**High-risk knowledge** (backend contract, Zod schemas, error codes, state transitions, accessibility
and dark-mode constraints) is **confirmed by the user**; automation only detects the change and
proposes the edit.

## Growing the map

- Create a domain only when real reusable knowledge exists — an empty domain is a violation, not a placeholder.
- New knowledge: find its domain → update the matching file. No domain fits → create one with the full five-file set.
- Keep `README.md` (this table) in sync with the directory tree.
- Every file stays **≤200 lines** (AGENTS.md). Over that → split or compress, never truncate judgement.

## Domain inventory

| Domain | Answers |
| --- | --- |
| `dashboard-visualization` | What the authenticated dashboard looks like, and how it is measured |
| `backend-contract` | How to consume `../ctt-server` — endpoints, DTOs, error codes |
| `achievements` | The achievements/trophy model, rungs, history fields |
| `ai-workflow` | How the agent works in this repo — commits, verification, knowledge upkeep |
| `landing-page` | The public marketing surface: measured visual baseline, component archetypes, responsive rules |

## Domain inventory conventions

- Domain name: `kebab-case`, names a **capability or knowledge area**, not a document kind.
- One domain = one coherent thing a developer could be responsible for end to end.
- If two domains start sharing most of their `principles.md`, they are one domain — merge them.

