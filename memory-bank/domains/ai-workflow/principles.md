# ai-workflow — principles

## P1. User-reported state is ground truth; do not re-verify it

If the user says "the panel is empty" or "colours do not match", that is data. Spend effort
explaining and fixing it, not reproducing it to convince yourself. Re-running a check the user
already performed wastes the turn and reads as not listening.

Corollary: *my* claims get the opposite treatment — they need evidence (measured value, screenshot,
test output) before being stated as fact.

## P2. Discussion is not instruction; task instruction is not commit authorization

- A question ("为什么不能…", "你能不能…") asks for analysis. Answer with options and a
  recommendation; do not start editing.
- A work directive ("修复/调整/更新/看下") authorizes **the work only**. When the code is done,
  stop and ask.
- Only explicit "提交 / commit / 推送 / push" authorizes git writes — and it covers that one
  submission, not future ones.

*Incident on record*: a colour fix was committed and pushed on the strength of "你看下解决下".
The rules were tightened afterwards (R6 red line) so this cannot repeat.

## P3. Verification scale matches the change

| Change                          | Evidence required                                             |
| ------------------------------- | ------------------------------------------------------------- |
| Visual/UI                       | Screenshot or measured computed styles in **both** themes      |
| Color/contrast                  | Numeric contrast values, not "looks fine"                      |
| Data semantics                  | A direct endpoint call with the panel's exact params           |
| Logic                           | The specific test/command that covers it, output shown         |
| Layout                          | Measured geometry at the real widths (not just one)            |

Tests are a permanent asset, not proof-of-work: a test earns its place only if a plausible bug
would fail it. Behaviour, boundaries and invariants yes; wiring, defaults and source text no.

## P4. The timeline layer is not storage for knowledge

`activeContext.md` / `progress.md` answer "what changed recently". Durable knowledge — invariants,
decision trees, ranges, traps — belongs in the domain layer, or it will be lost the next time the
timeline is archived.

*Evidence*: `activeContext.md` grew to 549 lines of accumulated stream-of-consciousness (well past
the 200-line limit) because every round appended instead of classifying. The fix was not editing —
it was moving the durable parts into domains and archiving the rest.

## P5. Write knowledge only in its final form

A knowledge file is either **true now** or factually wrong — there is no "draft" state:

- No placeholders, no `TODO: fill`, no empty sections. If it cannot be written truthfully, the
  knowledge does not exist yet; do not create the file.
- No changelog voice ("v0.34.0 changed X to Y"). Record the *current* truth plus the reasoning
  that makes it stable; version history belongs to `progress.md` and the git log.
- No duplication:横切 conventions stay in `systemPatterns.md`, domain judgement in the domain file.
  Two copies drift; the answer is a link, not a second copy.

## P6. One fact, one owner

Every piece of state has exactly one owner. URL state owns filters, TanStack Query owns server
data, Pinia owns auth/theme. In knowledge, the same applies: a fact has one canonical file, and
everything else points at it.

*Why it matters*: the same drift appears in both places. A duplicated rule becomes two divergent
rules; a duplicated fact becomes a stale tab in someone's memory.

## P7. Classify before you touch

Every incoming item is one of: a **requirement** (needs doing), a **question** (needs analysis),
a **report** (needs diagnosis), or a **rule change** (needs the rule itself updated). The
classification decides the whole response shape — misclassifying a question as a directive is the
most common and most expensive error.

## P8. Boundaries are hard, not preferences

Read-only means read-only: related repositories are never edited, not even to fix something
obviously wrong — a requirement text goes to the user instead. Resources are only torn down when
*you* started them; ownership is verified against the actual listener, not a remembered PID.

## P9. Keep the workspace clean and reproducible

Temporary artifacts (probe scripts, seeded accounts, verification servers) are removed when the
task ends; persistent accounts and helpers are reused rather than recreated. A dirty workspace
makes the next verification unreliable.
