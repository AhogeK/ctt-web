# ai-workflow — scenarios

## S1. Session start

1. Read `memory-bank/` in full (projectbrief, techContext, systemPatterns, activeContext, progress).
2. Read `AGENTS.md` rules — they are binding, not background.
3. Identify the applicable **domain(s)** in `memory-bank/domains/` and read that domain's
   `meta.md` → the file the task needs.
4. Only then plan. If the task spans 3+ steps or several modules, write the plan before editing.

Skipping step 3 is how the same mistake gets re-made: the rules say "no per-rank colour ramps",
but the *reasoning* and the rejected alternatives live in the domain file.

## S2. Changing code

1. Read the whole thing you are about to change (R19) — a partial read produces local fixes that
   break global invariants.
2. Match existing patterns; do not introduce a second convention beside an existing one (R9).
3. Verify per P3 — with evidence appropriate to the change type.
4. Update the **version** in `package.json` (R14) and the timeline layer (R2) in the same round.
5. Stop. Report state and ask about committing.

## S3. Committing

Triggered only by an explicit commit/push instruction (P2).

1. Inspect the diff; confirm nothing sensitive or unrelated is included.
2. Split into atomic commits: **code** (one coherent change), then **version bump**, then
   **memory** — version last, memory independent (R6.5).
3. Commit message: conventional prefix, subject ≤72 chars (commitlint enforces it), body explains
   *why*. Never add AI attribution or co-author trailers.
4. On `develop` first → cherry-pick the non-AI commits to `master` individually (never a branch
   merge; never a stale develop commit).
5. End state: both branches pushed and clean, working tree back on the working branch.

## S4. Receiving feedback about something just delivered

1. Treat it as a **report** (P7): get evidence before changing anything — measure the current
   behaviour (pixel, computed style, endpoint payload), do not argue from intent.
2. Separate the two failure modes: *the design direction is wrong* vs *the execution is wrong*.
   They have opposite fixes; guessing wrong wastes a round.
3. If the user proposes a direction ("use one global gradient", "add internal scrolling"), take it
   seriously — a previously dismissed suggestion returning means the dismissal was wrong.
4. State the tradeoff whenever a fix has one, instead of silently picking.

## S5. "I cannot make this work from the frontend"

1. Confirm with two contrasting direct calls (before assuming) — see `backend-contract` P7.
2. If it is genuinely a backend gap: write a **requirement text** and hand it over (R3). Do not
   fake it, do not work around it in the UI, do not touch the other repo.
3. Meanwhile, make the frontend honest about the limitation (documented comment / README) rather
   than silently inconsistent.

## S6. Knowledge upkeep after a round

1. Classify: is this a durable fact, a decision rule, a trap, or just recent history?
   - Durable → domain file (`principles` / `scenarios` / `practices` / `references`)
   - Recent history → `activeContext.md`
   - Milestone → `progress.md`
   - Nothing new → record nothing (do not pad)
2. Update the file's existing entry if the topic exists; never append a second, competing version.
3. Keep every memory file ≤200 lines. Over the limit → move history to `docs/archives/`, keep the
   current truth.

## S7. A file has grown beyond its limit

Precedent flow (used for `activeContext.md` 549 → 63 lines):

1. Split by nature: **durable judgement** → domains; **history** → a dated archive under
   `docs/archives/`; **status** → a short current-status block.
2. Rewrite the file as status + topic summaries + cross-cutting lessons.
3. Update the archive index line at the bottom so the chain stays traceable.

## S8. Starting/stopping background resources

- Long-running services: start them backgrounded with the log written to its own file; never let a
  command hang waiting for output.
- On finish: stop **only what you started**. Verify ownership by checking the actual listener
  process and its command line — a remembered PID file is not proof (a stale pid file once pointed
  at a process that was not ours).
- Temporary profiles/tokens/payloads: delete. Persistent helpers (test account, token script):
  keep and reuse.
