# AI tools — what they are for, when to run them, how to extend them

Two kinds of check, deliberately split by what can be *proved*:

| Kind | Artifact | Why |
| --- | --- | --- |
| Enumerable, mechanical | **script** (`sweep.sh`, `check-knowledge.sh`) | Deterministic, exit-coded, and *fails closed*: a step the agent forgot to think of still runs |
| Judgement-bearing | **prose, in the rules** (R18, `ai-workflow` S11) | No script can answer "is this actually rendered" or "is this claim verified" |

## `sweep.sh` — resources I started must not outlive the round

Run it at the end of every round and **show its output** (R18). Empty output is the only clean
signal. Each check exists because a specific thing went wrong:

1. **Browser processes with a scratch profile** — kill them *first*.
2. **Scratch profiles** (`/tmp/*profile*`) — delete them *after* step 1.
   *Why the order matters*: a live Chrome recreates its profile directory the instant it is
   deleted, so a "0 profiles" reading taken right after an `rm` is a lie. That is exactly how a
   headed Chrome window survived a round that reported "clean" (2026-09-19).
3. **Playwright artifacts** (`test-results/`, `playwright-report/`) — regenerable, they pile up.
4. **Temp files** — R11 forbids creating them at all.
5. **Untracked files** — reported, never deleted: they may be the user's.

## `check-knowledge.sh` — the knowledge base must not silently rot

Run it whenever a knowledge file changed, and in the round's closing check. It proves three things:

1. **Index drift** — every line count in `memory-bank/index.yaml` matches the file (R26).
2. **Size limit** — no file over 200 lines, `archives/` exempt (R24).
3. **Dead relative links** — every `](path)` inside `memory-bank/` and `.omp/` resolves.
   *Why*: this caught two links the agent itself had just written wrong.

## Extending them

When a round introduces a **new class of resource** or a **new kind of knowledge drift**, add its
pattern to the matching script *in that round* — a check that only covers what someone once
anticipated is how the next stray survives. If a check needs judgement rather than a pattern, it
belongs in the rules as prose instead, with the reason stated.
