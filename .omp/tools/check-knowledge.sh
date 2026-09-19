#!/usr/bin/env bash
# Knowledge-base check: index drift, size limits, broken relative links.
# Mechanises what the architect-agent practice calls "CI catching stale
# knowledge, dead links and structural drift" — the point is that it does NOT
# depend on anyone remembering to look.
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1
node - <<'NODE'
const fs = require('fs'), path = require('path'), cp = require('child_process')
const YAML = (() => { try { return require(path.resolve('node_modules/.pnpm/js-yaml@4.3.2/node_modules/js-yaml')) } catch { return null } })()
const wc = (f) => parseInt(cp.execSync('wc -l < ' + JSON.stringify(f)).toString().trim(), 10)
const bad = []

// 1) Index drift: every recorded line count must match the file.
if (YAML) {
  const idx = YAML.load(fs.readFileSync('memory-bank/index.yaml', 'utf8'))
  const check = (rel, expected) => { if (wc(rel) !== expected) bad.push(`index drift: ${rel} recorded ${expected}, actual ${wc(rel)}`) }
  for (const [rel, n] of Object.entries(idx.files)) check(rel, n)
  for (const d of Object.values(idx.domains)) for (const [rel, n] of Object.entries(d)) check(rel, n)
} else {
  bad.push('index unreadable: no YAML parser found')
}

// 2) Size limit (archives/ is the documented exception).
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name)
  return e.isDirectory() ? walk(p) : e.name.endsWith('.md') ? [p] : []
})
for (const f of walk('memory-bank')) {
  if (f.includes('archives')) continue
  if (wc(f) > 200) bad.push(`over 200 lines: ${f} (${wc(f)})`)
}

// 3) Relative links inside knowledge files must resolve.
for (const f of [...walk('memory-bank'), ...walk('.plans'), 'AGENTS.md', 'DESIGN.md']) {
  if (f.includes('archives')) continue
  const text = fs.readFileSync(f, 'utf8')
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = m[1]
    if (/^(https?:|mailto:|#)/.test(target)) continue
    const resolved = path.resolve(path.dirname(f), target.split('#')[0])
    if (!fs.existsSync(resolved)) bad.push(`dead link in ${f}: ${target}`)
  }
}

if (bad.length) { console.log(bad.map((b) => '  ✗ ' + b).join('\n')); process.exit(1) }
console.log('  ✓ index consistent · all files ≤200 lines · no dead relative links')
NODE
