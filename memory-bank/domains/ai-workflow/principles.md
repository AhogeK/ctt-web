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

**The file has no draft state; a claim may be marked.** The two are different granularities, and
R24's `待确认` red line does not reopen the door this principle closes:

- The *file* is always written in its final form — no half-filled sections.
- A single *claim* whose authority has not been consulted is written **with** the marker plus what
  would settle it (`待确认 — 需读 ctt-server X 的 Y`), because recording "we looked, we could not
  confirm, this is what would confirm it" is itself the final form of that fact.
- A marked claim is **not usable as a premise**: no code change is justified by it. It is a lead to
  check, not a fact to build on.

What stays forbidden is the third thing: guessing, and writing the guess in the assertive voice
without the marker. An unmarked claim asserts its authority; a marked one declares the gap.

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

## P10. Research precedes design; evidence precedes the ruling

A decision that sets a **tone, a rule, or a contract** (visual direction, spacing/type law, API
shape) is not made from memory or taste — it is made from evidence, gathered *before* the plan is
declared settled. The user's standing instruction: settle the research first, so the work is not
re-done after implementation starts.

- **Sample size gates a claim.** One reference is an anecdote; a pattern needs **≥3 independent
  samples**. A single site's choices justified three wrong generalizations in one round (h1 weight,
  negative tracking, "no motion needed").
- **Similarity is not quality.** A competitor doing X evidences the *status quo*, not X's merit —
  the worst-designed site in a sample was also the closest analogue. Grade evidence by its own
  authority, never by domain proximity.
- **Mark the gap, never fill it with a guess.** A claim nobody verified is written with
  `待确认` plus what would settle it (P5). "It is probably implemented as X" is exactly the
  sentence that must not be written in the assertive voice.
- **A mixed sample cannot establish a "standard".** If the references disagree (two sites
  use one pattern, one site uses another), saying "this is the standard" is false — the honest
  verdict is "the field is split", and the decision then rests on the product's own logic.
  Claiming a standard from a split sample happened here and was caught by the user.
- **A fact the user supplies is not a design ruling.** When told "most sites label it Sign in",
  applying that *everywhere* is not compliance — it is copying. Scoped facts arrive scoped (that one
  was about a top-bar entry); the agent still owes the design decision for every other element, and
  saying "you told me to" does not discharge it.
- **Scope is part of the claim.** A gap in a *document* is not a gap in the *code*. State which
  artefact was measured; a finding about `DESIGN.md` says nothing about `src/`.

## P11. Before acting: scan what already exists

Three checks, in this order, before design or implementation. Each one exists because skipping it
produced a real defect.

1. **Gap scan — what do we already have?** Search our own plan, domain files and code for an
   existing judgement on this exact question. *The failure it prevents*: the hero CTA was pointed at
   registration while the plan already said the plugin install is the lowest-friction entry. The
   answer existed and was not looked up.
2. **Premise check — does the pattern's premise hold here?** A copied pattern carries unstated
   conditions; verify them against *this* product. *The failure*: "hero → signup" assumes the signup
   page carries the OAuth buttons. Ours does not, so the pattern inverts into a dead end.
3. **Input classification — is this a rule or a datum?** A fact supplied by the user arrives scoped.
   Apply it where it applies, and keep deciding everywhere else. *The failure*: "most sites label it
   Sign in" (about a top-bar entry) was applied to the hero too, turning the page's most valuable
   slot into a copy of the bar.

**Single-source conclusions are the common root of all three.** One site, one document, one sentence
is a lead, not a verdict (P10). Cross-check before acting.

## P12. A commit is a claim about its file set — verify it before pushing

The failure of 2026-09-20 came from one omission: **the file set was never checked**.

A hunk-splitting script (`split_pkg`) applied `package.json`'s dependency hunks on its first call, so
the second call received an empty patch, `&&` broke the chain, and the *next* `git commit` — meant for
AI content — swept the still-staged dependency change in with `memory-bank/`. Two commits were then
wrong at once: one mixed AI content with code, and the dependency commit was missing its own
`package.json`. Had it been pushed, `master` would have received a new `pnpm-lock.yaml` next to an old
manifest (a real inconsistency), and the fix would have required rewriting **pushed** history.

What follows:

- **Assert the file set, then commit — and re-read it after.** `git show --stat` must equal the
  intended list exactly; a mismatch is fixed by rewriting *before* the first push, never after.
- **Split by hunk only when the remainder is re-verified.** A file carrying three intents
  (`package.json`: dependency bump + version + a config removal) is fine to split — but recompute the
  diff after every partial apply instead of assuming the rest is untouched.
- **Check AI/code separation mechanically.** Every commit's paths are either all AI content
  (`memory-bank/`, `.plans/`, `AGENTS.md`, `DESIGN.md`) or all code — the mix is the defect, and a
  one-line assertion catches it.

**Batch composition (user, 2026-09-20 — corrected twice; read this precisely).** AI content is **equally
important** as a deliverable. This rule is about **the amount of code a round carries**, not about
ranking the two. The failure it prevents: a round so thin that the delivered set holds **one**
substantive code commit and nothing else substantial — that reads as a documentation round with a
token code change. So: give a round enough code work to produce **several** functional commits, and
let the AI commits ride alongside as peers, still strictly separated (R6.5). Stop to ask for the
commit word when a real chunk is ready — not after a sliver, and not only once everything is finished.

## P13. Put decisions in the question tool, not at the end of a report

When a choice is the user's to make — do X or not, A vs B, scope in or out — ask it with **omp's
question tool** (`ask`), so they can pick an option instead of reading a numbered list buried under a
long report. User, 2026-09-20: *"这种问题你应该直接用 omp 的询问工具来问我，我可以直接做选择，而不是这样
非常不清晰看着"*.

A report may **summarise** state; it must not be the **mechanism** for a decision. If the answer
changes what happens next, it belongs in the question tool — which also records the answer as a
choice in the transcript, instead of prose the next round has to re-derive.

## P14. `transition-all` is a bug, not a shorthand

`transition-all` makes every property animatable, so Chrome may promote the element to a composited
layer for the duration — and a promoted layer loses subpixel (LCD) antialiasing, which the user sees
as **text going soft for ~150ms** on hover. Measured on the login page (element screenshots at 4×,
Laplacian variance of the text band): `transition-all` rest 696.5 → mid **454.2** (ratio **0.652** ✗);
after narrowing to `transition-colors`, rest 696.5 → mid **758.6** (ratio **1.089** ✓).

Always name the properties that change: `transition-colors` · `transition-[color,box-shadow]` ·
`transition-[width]` (a 2026-09-20 sweep replaced the last 43 uses; Tailwind's `-colors/-opacity/
-transform` are already narrow — only `all` is the trap). **Measure it against the same end state** (mid-transition vs settled), never rest vs a state whose
content also changed: the input's rest→mid read 0.882 ✗ only because focusing moved its border, while
its mid vs settled read **1.000** ✓ — the real answer.
**Assert the new form too, not only the old pattern's absence** — a bulk replacement can leave a valid-looking fake: `bg-amber-50 → bg-warning-surface` matched *inside* `bg-amber-500` and produced `bg-warning-surface0`, so the old pattern was gone ✓ while the class was garbage ✗. Grep the result shape as well.
