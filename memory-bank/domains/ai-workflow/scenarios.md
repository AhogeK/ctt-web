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
3. Keep every memory file ≤200 lines. Over the limit → move history to `memory-bank/archives/`, keep the
   current truth.

## S7. A file has grown beyond its limit

Precedent flow (used for `activeContext.md` 549 → 63 lines):

1. Split by nature: **durable judgement** → domains; **history** → a dated archive under
   `memory-bank/archives/`; **status** → a short current-status block.
2. Rewrite the file as status + topic summaries + cross-cutting lessons.
3. Update the archive index line at the bottom so the chain stays traceable.

## S8. Starting/stopping background resources

- Long-running services: start them backgrounded with the log written to its own file; never let a
  command hang waiting for output.
- **A backgrounded command must also be detached from the caller's stdout, or the job never ends.**
  `cmd > log 2>&1 &` still leaves the framework waiting: the grandchild (`pnpm` → `vp` → `vue-tsc`)
  inherits the pipe and holds it open after the direct child exits, so the job is never observed to
  settle and a wait on it blocks forever. Write it as
  `nohup cmd > log 2>&1 < /dev/null &` — the call returns immediately — and then **poll the log**
  for completion. This one cost hours: it presented as "the machine is dying" (even `uptime` seemed
  to take two minutes) while the same command, detached, finished in about a second.
- **`timeout` kills only its direct child.** A grandchild that survives keeps the pipe open, so the
  command still never returns. Detach as above instead of reaching for a shorter timeout.
- On finish: stop **only what you started**. Verify ownership by checking the actual listener
  process and its command line — a remembered PID file is not proof (a stale pid file once pointed
  at a process that was not ours).
- Temporary profiles/tokens/payloads: delete. Persistent helpers (test account, token script):
  keep and reuse.

## S9. A tracked file shows as modified, with no edit by you

Symptom: `git status` lists a file you never opened — typically `pnpm-workspace.yaml` carrying
`<package>: set this to true or false` — and a later `git checkout` refuses to run because that
file has local changes.

That literal is **pnpm's placeholder**, not anyone's edit. `handleIgnoredBuilds()` writes it when an
install meets a dependency whose build script has no entry in `allowBuilds`. pnpm 11 reaches that
path from any `pnpm run`/`exec`, because `verifyDepsBeforeRun` defaults to `install` and implicitly
installs whenever `node_modules` is out of sync — and running a script at a **detached historical
commit** guarantees that mismatch, since `node_modules` is shared but the workspace config is
per-commit.

Do not "resolve" it by committing the file. Restore it and remove the cause:

1. `git checkout -- <file>`. The checkout you were attempting is safe to retry afterwards.
2. Confirm the guard is present: `verifyDepsBeforeRun: warn` in `pnpm-workspace.yaml` turns this into
   a warning instead of a write. `error` also stops the write, but it fails *every* script after a
   lone version bump (that alone flips the workspace-state hash) — a guard that cries wolf on a
   routine release step is one someone turns off.
3. For a genuinely new undecided build script, `pnpm approve-builds` and commit that decision — that
   one *is* a real config change, not noise.
4. Never run package-manager scripts at a historical commit; verify the tip. Per-commit verification
   needs a worktree **with its own install** — one that borrows the main `node_modules` reports
   phantom `TS2307: Cannot find module 'vite-plus'`.

## S10. Before designing anything with an external reference

Trigger: a task needs a visual/interaction/layout decision that the repo does not already answer.

1. **Decide what kind of evidence you need** — and label it: peer status quo, *design authority*
   (a reference whose craft is itself respected), or research (conversion/accessibility studies).
   These have different force; do not let one masquerade as another.
2. **Take ≥3 samples, same probe.** Measure the same fields on every site, or the comparison is
   not a comparison. Record hit counts, not impressions — "8px grid: 44/50/26 hits" is a finding.
3. **Read the layers in order of authority**: rendered pixels and computed styles → the
   stylesheets' own token tables → the JS bundles → **the open-source component source**. A
   screenshot shows the result; only source shows the mechanism.
4. **Cross-validate.** If CSS says "no animation elements" and JS says "no IntersectionObserver",
   that agreement is the finding. If they disagree, you have not understood one of them.
5. **Check the reference's stack against ours.** reka-ui / Tailwind 4 / VueUse already implement
   most Radix-era patterns — adopt the *pattern*, never a new dependency (R12).
6. **Write it down before building** — measured baseline in the domain file, plan approved by the
   user, then code. `.plans/` is a working artefact and is gitignored: anything that must survive
   belongs in the domain layer.

## S11. Closing a slice: the five questions

**Step 0 — sweep, and show it.** Run `bash .omp/tools/sweep.sh` and put its output in the report;
"clean ✓" is the only evidence of a clean round. It removes Playwright artifacts and scratch
profiles/browsers, and flags untracked files. `bash .omp/tools/check-knowledge.sh` does the same for
the knowledge base (index drift · size limits · dead links).

After that, answer all five **with evidence**. An unanswered one is a finding, not a formality.

| Question | Evidence that settles it |
| --- | --- |
| **What changed?** | The diff, scoped: which files, which contract |
| **Why this way?** | The decision and the alternative rejected |
| **Who is affected?** | Call sites, other pages, the E2E specs that assert the old behaviour |
| **How was it verified?** | The commands run and their output — not "should work" |
| **What is still unconfirmed?** | Listed explicitly, with what would settle it |

The last one is the one that gets dropped, and it is the most valuable: **an unlisted unknown is a
silent risk.** Writing it down is what makes the rest trustworthy.

**Index upkeep (same round).** `memory-bank/index.yaml` is the AI-facing map. After touching any
knowledge file: refresh its line count, add/remove entries for files that appeared or vanished, and
re-check that each `answers` line still describes what the file answers. A stale index is worse than
no index — it sends the next session to the wrong place.
