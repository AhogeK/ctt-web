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

A non-empty diff here means either an AI commit leaked in, or a wrong (stale) commit was
cherry-picked — stop and investigate before pushing.

## Verification recipes

| Purpose                    | Command / method                                                   |
| -------------------------- | ------------------------------------------------------------------ |
| Types                      | `pnpm type-check`                                                   |
| Lint                       | `pnpm lint`                                                         |
| Unit tests                 | `pnpm test:unit --run`                                              |
| Build                      | `pnpm build`                                                        |
| E2E (specific spec)        | `env -u CI pnpm test:e2e e2e/<path>.spec.ts --project=chromium`      |
| Dark-mode rendering        | CDP `page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}])` then screenshot/pixel sample |
| Endpoint payload           | Direct `curl` with the panel's exact params (see `backend-contract`) |

`env -u CI` matters: with `CI` set, Playwright switches to a preview build instead of the running
dev server.

## Reading a rendered value instead of guessing it

```js
// computed style of a specific element
await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="x"]')).backgroundColor)
// rendered pixels, when a composited layer could differ from the declared value
// (screenshot the region, decode in-page with canvas, read the RGBA)
```

Declared CSS is not evidence of what a user sees — gradients, masks, opacity and stacking all
change the result. Sample the render.

## Capturing a transient UI state

- Screenshot from the same `tab.run` cell that triggered it; a separate call can miss the window.
- For hover/press states, dispatch the interaction then screenshot before the state expires.

## When an edit tool corrupts a file

Symptom: the file stops parsing, duplicate blocks appear, or a boundary line is echoed twice.

1. Stop patching. Re-read the whole file.
2. If the structure is damaged beyond a single hunk, **rewrite the file in one `write`** with the
   complete intended content.
3. Re-run the full verification (types + tests + build) — a silent structural change is exactly
   what tests are for.
4. Prefer one whole-file write over many hunks for template-heavy files in the first place.

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

- **Write the tokens as bare strings.** `useStorage(key, null)` picks the *string* serializer for
  a `null` default, so a JSON-quoted value is sent verbatim (`"\"abc\""`) and every refresh
  returns `AUTH_003`. This is also why the app's own login looks broken when driven with a
  `JSON.stringify`'d token.
- **Write them before navigating, in the same `tab.run`.** `page.evaluateOnNewDocument` registers
  for the lifetime of the call, not the page — it never took effect and silently fell back to
  whatever token the profile already had (which produced verification against the *wrong account*
  without any error).
- **One live tab per Chrome profile.** A second tab with the app open keeps its own silent-refresh
  timer running and rewrites the shared `localStorage`, so the token you injected rotates back to
  the other account mid-check. Kill the old instance, or use a fresh profile per verification.
- **The app's CSP blocks `fetch()`/`Image()` on `data:` URLs**, so screenshots cannot be decoded
  in-page (canvas pixel sampling fails with `Failed to fetch` / `EncodingError`). Read *resolved*
  computed styles instead — for a track-sized gradient, `backgroundSize: "783.5px 100%"` is the
  proof that the `cqw` container query resolved, which is the mechanism under test.

## Test accounts: reuse a prefix, never invent one

`.sisyphus/.test-account-<prefix>` is the account registry. **Pick an existing prefix**;
a new prefix registers a real server-side account that then needs its own data seeding, and there
is no delete-account endpoint — an unused account can only be cleaned up by hand.

| Prefix     | Contents                                                        |
| ---------- | --------------------------------------------------------------- |
| `langtail` | Canonical. 33 languages incl. a sub-0.1% tail, 13 projects (one dominated, one 39-char name, one 1-second entry). |
| `lang`     | 10 languages                                                     |
| `repro`    | Error/edge repro seeding                                         |
| `tdd`      | Local unit-test work                                             |
| `proj`     | Stray — created in error during the project-panel round; empty now (its API key was purged). Safe to reuse, do not add more. |

Seeding writes need a SYNC-scoped API key on that account:

```bash
curl -s -X POST $API/v1/auth/api-keys -H "Authorization: Bearer $JWT" \
  -d '{"name":"…","scopes":["READ","SYNC"],"expiresAt":null}'      # → data.rawKey
```

Devices require a **UUID** `deviceId` (`COMMON_001` otherwise). Purge the key when done:
`DELETE /auth/api-keys/{id}` (revoke) then `DELETE /auth/api-keys/{id}/delete`.

## Where an artifact goes (.omp vs docs)

`.omp/README.md` is the authority; the short version:

| Artifact                       | Home                                     | Committed? |
| ------------------------------ | ---------------------------------------- | ---------- |
| Implementation plan            | `.omp/plans/<feature>-plan.md`           | No (`.omp/` is gitignored) |
| Delivery report / requirement  | `.omp/<topic>-{delivery-report,requirement}.md` | No  |
| User-facing project doc        | `docs/`                                  | Yes        |
| Agent memory                   | `memory-bank/`                           | Yes        |

An implementation plan is a **working artifact**: it is worth writing for any change spanning
>5 files, and it is worth keeping afterwards as the record of why — but it is not project
documentation, so it does not go in `docs/`. Plan filenames carry no date (recency is the file's
mtime); the plan itself has a `Date:` field.

Writing a plan to `docs/plans/` is the specific mistake to avoid — `docs/` receives user-facing
docs only.

## Proving a lint rule is actually enabled

`pnpm lint` runs with `--fix`, so a newly added rule can appear to do nothing: it silently rewrites
the file instead of reporting. Two checks, in this order:

1. **Read-only path proves it is registered** — `vp lint <path>` on a deliberately violating file
   must print the rule by name and exit 1. No output means the rule name or plugin is wrong
   (a misnamed rule is accepted silently rather than rejected).
2. **Fix path proves it is wired into the normal flow** — after `pnpm lint`, the violating file
   should now be corrected.

Both were needed when adding `vitest/prefer-to-have-length`: the `--fix` run reported nothing at
all, which looked exactly like "the rule is not working" until the file was inspected and the
assertion had already been rewritten.

## Memory upkeep mechanics

- Update **immediately** in the same round as the change (R2) — deferred updates are how the
  timeline falls behind reality.
- Before adding an entry, read the target file; extend the matching topic instead of appending.
- Keep one canonical location per fact (P6); elsewhere, link.
- Archive to `memory-bank/archives/YYYY-MM-DD-<name>-archive.md` and leave a pointer line behind.
  Archives live under `memory-bank/` (not `docs/`, which is user-facing docs only — R25) and are the
  one memory artifact exempt from the 200-line limit; that is what they are for.

## Resource hygiene

- Long-running process → background it with its own log file; record the PID for teardown.
- Teardown: match the process command line against the resource you started, then stop it. Never
  kill by port alone.
- Persistent helper accounts/files survive between rounds; scratch payloads and profiles do not.
