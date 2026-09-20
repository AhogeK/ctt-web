# ai-workflow — practices

## Commit shapes (R6.5)

```
feat(dashboard): <what changed>          # code — one coherent change
chore: bump version to X.Y.Z             # version — separate, and always AFTER the code
chore(memory): <what was recorded>       # AI memory — never mixed with code
```

- Subject ≤72 chars (commitlint rejects longer; shorten rather than abbreviate unnaturally).
- Body states *why*, plus any measured values that justify the change.
- No AI attribution of any kind, no co-author trailers.
- `develop` first. `master` receives only individually cherry-picked non-AI commits:

```bash
git checkout master && git cherry-pick <feat-hash> <version-hash>
git diff develop master --stat -- src/ e2e/ package.json README.md   # must be empty
```

## Verification recipes

| Purpose             | Command / method                                                   |
| ------------------- | ------------------------------------------------------------------ |
| Types               | `vp run type-check`                                                 |
| Lint                | `vp lint`                                                           |
| Format              | `vp fmt --check <path>`                                             |
| Unit tests          | `vp test run [path]`                                                |
| Build               | `vp build`                                                          |
| E2E (one spec)      | `env -u CI vp test:e2e e2e/<path>.spec.ts --project=chromium`        |
| Dark-mode rendering | CDP `page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}])`, then sample |
| Endpoint payload    | Direct `curl` with the panel's exact params (see `backend-contract`) |

`env -u CI` matters: with `CI` set, Playwright switches to a preview build instead of the dev server.

**The suite is headless, including locally — `--headed` is the opt-in** (the default is
`chromium_headless_shell`, which cannot open a window; the old default opened one per spec).

**Check whose server is on 5173 before believing a failed run.** `reuseExistingServer: !CI` drives
whatever holds the port, so another project's dev server there makes **every** spec fail at the first
`page.goto` with `ERR_HTTP_RESPONSE_CODE_FAILURE` — which reads like a regression in our code. Check
the listener's `cwd` (`lsof -a -p <pid> -d cwd -Fn`). **Never stop a server you did not start**:
start your own elsewhere, or use `CI=1` for the preview server on 4173.

**Run verification at the branch tip, never at a detached historical commit.** `node_modules` is
shared while `pnpm-workspace.yaml` is per-commit, so a script run at an old commit meets a config
that does not describe the installed tree — and pnpm answers by mutating that config (see S9).
Per-commit checking needs a worktree **with its own install**; one that borrows the main
`node_modules` cannot resolve `vite-plus` and reports phantom TS errors.

## Reading a rendered value instead of guessing it

```js
await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="x"]')).backgroundColor)
```

Declared CSS is not evidence of what a user sees — gradients, masks, opacity and stacking all change
the result. Sample the render in the same `tab.run` cell that triggered a transient state.

## When an edit tool corrupts a file

Symptom: the file stops parsing, duplicate blocks appear, or a boundary line is echoed twice. The
usual origin is **shell/Python string replacement**, which reports success while writing
valid-looking nonsense (a `[, EMAIL]` sparse array; `{…}` rewritten as `[…]`).

1. Stop patching. Re-read the whole file.
2. Damaged beyond a single hunk → **rewrite the file in one `write`** with the complete intent.
3. Re-run the full verification — a silent structural change is what tests are for.
4. For template-heavy files, prefer one whole-file write over many hunks in the first place.

## Browser sessions for dashboard verification

`get-token.sh` alone is not enough to drive the app: it prints an access token, but the app
authenticates by **refreshing**, so a page booting with an access token and no valid refresh token
bounces to `/auth/login` no matter how fresh the token is.

```bash
eval "$(SESSION=1 bash .sisyphus/get-token.sh <prefix>)"   # → ACCESS=… REFRESH=…
```

Then, in one `tab.run` call:

```js
await page.evaluate((c) => {
  localStorage.setItem('ctt_access_token', c.access)     // BARE string — see below
  localStorage.setItem('ctt_refresh_token', c.refresh)
}, creds)
await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' })
```

Traps — each one cost a full debugging round:

- **Write the tokens as bare strings.** `useStorage(key, null)` picks the *string* serializer for a
  `null` default, so a JSON-quoted value is sent verbatim (`"\"abc\""`) and every refresh returns
  `AUTH_003`. This is also why the app's own login looks broken when driven with a
  `JSON.stringify`'d token.
- **Write them before navigating, in the same `tab.run`.** `page.evaluateOnNewDocument` registers for
  the lifetime of the call, not the page — it never took effect and silently fell back to whatever
  token the profile already had (verification then ran against the *wrong account*, with no error).
- **A saved token pair is good for one run.** The refresh token rotates and reuse is detected
  (`AUTH_009`), so reuse gets `403 /auth/refresh` and a bounce to `/auth/login` — which looks exactly
  like "my change broke the page". Fetch a fresh pair per run.
- **One live tab per Chrome profile.** A second tab keeps its own silent-refresh timer running and
  rewrites the shared `localStorage`, rotating your token back mid-check. Kill the old instance or
  use a fresh profile per verification.
- **The app's CSP blocks `fetch()`/`Image()` on `data:` URLs**, so screenshots cannot be decoded
  in-page (canvas pixel sampling fails with `Failed to fetch` / `EncodingError`). Read *resolved*
  computed styles instead — for a track-sized gradient, `backgroundSize: "783.5px 100%"` proves the
  `cqw` container query resolved, which is the mechanism under test.

## Test accounts: reuse a prefix, never invent one

`.sisyphus/.test-account-<prefix>` is the account registry. **Pick an existing prefix** — a new one
registers a real server account that needs seeding, and there is no delete-account endpoint.

| Prefix     | Contents                                                        |
| ---------- | --------------------------------------------------------------- |
| `langtail` | Canonical. 33 languages incl. a sub-0.1% tail, 13 projects (one dominated, one 39-char name, one 1-second entry). |
| `lang`     | 10 languages                                                     |
| `repro`    | Error/edge repro seeding                                         |
| `tdd`      | Local unit-test work                                             |
| `proj`     | Stray — created in error; empty now (its API key was purged). Safe to reuse, do not add more. |

Seeding writes need a SYNC-scoped API key on that account:

```bash
curl -s -X POST $API/v1/auth/api-keys -H "Authorization: Bearer $JWT" \
  -d '{"name":"…","scopes":["READ","SYNC"],"expiresAt":null}'      # → data.rawKey
```

Devices require a **UUID** `deviceId` (`COMMON_001` otherwise). Purge when done:
`DELETE /auth/api-keys/{id}` (revoke) then `DELETE /auth/api-keys/{id}/delete`.

## Where an artifact goes (.omp vs docs)

`.omp/README.md` is the authority; the short version:

| Artifact                      | Home                                             | Committed? |
| ----------------------------- | ------------------------------------------------ | ---------- |
| Implementation plan           | `.omp/plans/<feature>-plan.md`                   | No (gitignored) |
| Delivery report / requirement | `.omp/<topic>-{delivery-report,requirement}.md`  | No         |
| User-facing project doc       | `docs/`                                          | Yes        |
| Agent memory                  | `memory-bank/`                                   | Yes        |

A plan is a **working artifact**: worth writing for any change spanning >5 files, worth keeping as
the record of why — but it is not project documentation, so it never goes in `docs/`. Plan filenames
carry no date (recency is the mtime); the plan itself has a `Date:` field.

## Proving a lint rule is actually enabled

`vp lint` runs with `--fix`, so a newly added rule can appear to do nothing: it silently rewrites the
file instead of reporting. Two checks, in this order:

1. **Read-only path proves it is registered** — `vp lint <path>` on a deliberately violating file
   must print the rule by name and exit 1 (a misnamed rule is accepted silently, so no output means
   the name or plugin is wrong).
2. **Fix path proves it is wired into the normal flow** — after `vp lint`, the file is corrected.

Both were needed for `vitest/prefer-to-have-length`: `--fix` reported nothing at all, which looked like "the rule is not working" until the assertion turned out to be already rewritten.

## Proving a CSS change is broken: the SFC style sub-request

A stylesheet reached through `<style src>` has **two** URLs: the bare file (`/src/x.css`) and the
sub-request Vite builds for the component (`…?t=1&vue&type=style&index=0&src=true&lang.css`).
**PostCSS only runs on the second** — the bare file and the `.vue` both 200 while the page dies.

```bash
curl -s -o err.html -w '%{http_code}' \
  'http://localhost:5173/src/<path>.css?t=1&vue&type=style&index=0&src=true&lang.css'
grep -oE '"message":"[^"]{0,120}' err.html   # → "X.vue:524:25: Missed semicolon" (real line!)
```

The body carries the PostCSS error with file:line:col; browser-side,
`performance.getEntriesByType('resource').filter(e => e.responseStatus >= 400)` lists the failing URL
after the fact. A 500 here lands the route on the error boundary, so a CSS syntax error masquerades as
a render bug. Trap it already charged: regex-replacing a multi-line declaration swallowed the **next**
declaration into the last value.

## Memory upkeep mechanics

- Update **immediately** in the same round as the change (R2) — deferred updates are how the timeline
  falls behind reality.
- Before adding an entry, read the target file; extend the matching topic instead of appending — one
  canonical location per fact (P6); elsewhere, link.
- Archive to `memory-bank/archives/YYYY-MM-DD-<name>-archive.md` and leave a pointer line behind — under
  `memory-bank/` (not `docs/` — R25); archives are the one artifact exempt from the 200-line limit.

## Resource hygiene

- Long-running process → background it with its own log file; record the PID for teardown.
- Teardown: match the process command line against the resource you started, never kill by port alone.
- **Browsers: the whole contract now lives in `skill://user-chrome-tabs`** ✓ (user-level, cross-project — written
  after three of this session's own failures: a relay without `target` hijacks the tab being read ✗, a heuristic
  filter closed the user's login tab ✗, and two tabs were left open ✗). Read it before any browser automation on
  this machine; the verified ceremony, the `omp`-group recipe and the self-check are all there.
