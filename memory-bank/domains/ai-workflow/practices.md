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

> **浏览器会话语料**（会话启动方式、CDP 用法、profile 清理等 39 行）已归档 → [`../../archives/2026-09-30-ai-workflow-browser-sessions.md`](../../archives/2026-09-30-ai-workflow-browser-sessions.md) ✓（R24 的 200 行上限；要点仍散见于本文件与 `.omp/README.md` ✓）

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

**汇报必须以总结块收尾**（2026-09-21 用户反馈 ✗ "最后你的输出没啥总结就一句 git 未动"）：长汇报**结尾**不许只剩一行状态 ✗ —— 要用能独立读懂的总结块（做了什么 ✓ 证据 ✓ 还欠什么 ✓ 等谁决定 ✓）；用户常常只看到最后一段 ✓。
## 长操作不许静默阻塞（2026-09-21 用户反馈 ✗ "以为你会话卡了，差点停掉"）

**超过 ~30 秒又无法自证进度的步骤：先挂后台 + 一句话告知**（"我挂后台 ✓ 好了贴结果 ✓"）✗ 否则他看到的就是"没动静" ✗ · `bash` 用 `async: true` ✓ · 服务用 `hub start` ✓ · `eval` 必设 `timeout` 且**自带上限** ✓。
**嵌套 omp 探针能做通 ✓（实测 34s 跑完 ✓）：四件套缺一不可** —— scratch cwd ✓ · 项目级 `.omp/mcp.json` 把 MCP 全 `enabled:false` ✓（真凶是启动时 `npm exec chrome-devtools-mcp@latest` ✓ 拉 MCP 卡住 ✓）· **`timeout -k 5`（必须 `-k` ✗ 嵌套 omp 忽略 SIGTERM ✓ 只写 timeout 会永久挂 ✓）** · `stdin=/dev/null` ✓ · **`--no-session`（必须 ✗ 否则它会按 cwd 续上最近会话 ✓ 与本会话同时写同一个 jsonl ✓ → "Session file changed before rewrite" ✓）** ✓。 **验证前先确认「你测的就是新产物」** ✗✓（2026-09-21 两次假失败）：`pnpm preview` **不构建** ✗（吃旧 `dist/` ✓）→ 先 `vp build` ✓；长跑的 dev server 模块图会漂移 ✓ → `curl localhost:5173/src/…` 看它吐新码还是旧码 ✓。旧产物曾让我把已修好的东西判成「还坏着」✗。
## Memory upkeep mechanics

- Update **immediately** in the same round as the change (R2) — deferred updates are how the timeline
  falls behind reality.
- Before adding an entry, read the target file; extend the matching topic instead of appending — one
  canonical location per fact (P6); elsewhere, link.
- Archive to `memory-bank/archives/YYYY-MM-DD-<name>-archive.md` and leave a pointer line behind — under
  `memory-bank/` (not `docs/` — R25); archives are the one artifact exempt from the 200-line limit.

## Independent judgement (R31)

- **Research first, then decide whether to obey.** The user's proposal is an input, not the default. Read the
  code, run the probe, do the arithmetic — then either execute or push back with a reason and an alternative.
- **Match the standard to the claim**: facts and numbers must hold up; taste and trade-offs may be stated
  straight from trained judgement. A rule that demands evidence for every opinion turns judgement into
  paperwork (the first draft of R31 did exactly that and was corrected the same day).
- Instances worth remembering: the header "chrome band" (executed, then rejected — the pushback belonged
  *before* the edit) and the card-depth saga (five static cues tried before anyone asked whether "depth" here
  meant surface shading at all).

## Resource hygiene

- Long-running process → background it with its own log file; **record the PID the launcher printed**.
- **Only kill a PID you started and recorded.** All three of these read as "cleanup" while killing someone
  else's process: `lsof -t -iTCP:<port> | xargs kill` · `pkill -f <name>` · `killall`. Ownership unclear ⇒
  leave it and report it; a "cleaned up" claim must list the killed PIDs (2026-09-26: the user's own dev
  server died to the port form above, after the report claimed only my PIDs were touched).
- Browsers: contract in `skill://user-chrome-tabs` (`target`-less relay hijacks the tab). Report format
- **`browser.open` (eval) defaults to the relay on this machine = the user's real Chrome** ✗ (2026-10-02: a
  local self-check opened a tab in the user's browser, next to their own `localhost:5173` review tab). Local
  checks use the test runner's browser or the chrome-devtools MCP profile; never the eval `browser` without
  an explicit `app`. Relay tabs are invisible to `sweep.sh` (S14), and a tab whose URL matches one the user
  may also have open is **ambiguous — leave it, report it** ✗. The bridge (`browser-relay --port 9224`) is
  this session's: prove it via the `ppid` chain, then kill it (both PIDs) and confirm the port is free.

## 测试与工具的两处坑（2026-10-02 ✗✓）

- **jsdom 缺的 API 要补「可构造的 class」模拟** ✗：`ResizeObserver` / `IntersectionObserver` 在 `src/test/setup.ts` 里都必须能 `new` ✓ —— 用箭头函数或返回对象字面量的 `vi.fn()` ⇒ 调用点抛 "is not a constructor"，整组测试在断言之前就崩 ✓（同型两次：先 ResizeObserver，后 IntersectionObserver ✓）。
- **测试里别解构 testing-library 的返回方法** ✗：`const { getByTestId } = render(...)` 会触发 `typescript(unbound-method)` ✗ ⇒ 改成持有对象 `const view = render(...)` 再 `view.getByTestId(...)` ✓（`unmount` 同理 ✓）。

## 提交被拦下后的三坑（2026-09-30 踩中两次 ✗）

- **`git add` 分区留在索引** ✗：pre-commit 失败只回滚**工作树** ✓，暂存区不回滚 ✗ ⇒ 重提时上一轮的
  `package.json`/`README.md`/`memory-bank/` 一起进同一 commit ✗（实例：应有的 4 笔被 1 个 12 文件提交吞掉 ✗）。
  做法：先 `git diff --cached --name-only` 核对 ✓、提交用**路径限定** `git commit -- <paths>` ✓。
- **"内容一致"必须逐文件核验** ✗：中间态下一条 `git diff --name-only A B` 的空结果会**假通过** ✓
  （实例：master 少了 `package.json`/`README.md` 却报 ✓ ✗）。做法：逐路径打印 一致/差异 ✓ + 另核关键值（版本两边各打印 ✓）。
- **`git restore --staged --worktree <paths>` 在 cherry-pick 冲突态会按被 pick 版本还原** ✗ ⇒ 会撤过头 ✓。
  做法：只撤索引用 `git restore --staged <paths>` ✓ 或直接路径限定提交 ✓。
