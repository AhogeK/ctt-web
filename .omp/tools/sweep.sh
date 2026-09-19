#!/usr/bin/env bash
# End-of-round resource sweep. Run it, read it, act on what it prints.
# Order matters: kill processes FIRST, then delete their scratch profiles —
# a live Chrome recreates the profile directory the moment you delete it, so a
# "0 profiles" reading taken right after an rm is a lie (this is how a stray
# browser survived a supposedly clean round).
set -uo pipefail
found=0
note() { printf '  %s\n' "$1"; found=1; }

# 1) Browsers started with a scratch profile. The user's own Chrome has no
#    --user-data-dir flag, so this pattern cannot touch it.
alive=$(pgrep -f -- '--user-data-dir=/tmp/' 2>/dev/null | wc -l | tr -d ' ')
if [ "$alive" != "0" ]; then
  note "browser processes with scratch profiles: $alive — killing"
  pkill -f -- '--user-data-dir=/tmp/' 2>/dev/null || true
  sleep 2
  left=$(pgrep -f -- '--user-data-dir=/tmp/' 2>/dev/null | wc -l | tr -d ' ')
  [ "$left" != "0" ] && note "STILL ALIVE after kill: $left"
fi

# 2) Scratch profiles (only meaningful after step 1).
dirs=$(ls -d /tmp/*profile* 2>/dev/null || true)
if [ -n "$dirs" ]; then
  note "removing scratch profiles: $(echo "$dirs" | tr '\n' ' ')"
  rm -rf /tmp/*profile* 2>/dev/null || true
fi
left=$(ls -d /tmp/*profile* 2>/dev/null | wc -l | tr -d ' ')
[ "$left" != "0" ] && note "STILL PRESENT: $left scratch profiles"

# 3) Playwright artifacts from my runs (regenerable; they pile up fast).
for d in test-results playwright-report; do
  [ -d "$d" ] && { rm -rf "$d"; note "removed $d"; }
done

# 4) Temp files (R11 forbids creating them at all).
tmp=$(find . -maxdepth 2 \( -name '*.log' -o -name '*.tmp' \) -not -path './node_modules/*' 2>/dev/null || true)
[ -n "$tmp" ] && note "temp files left behind: $tmp"

# 5) Untracked files — mine or the user's, but never silently ignored.
strays=$(git status --porcelain -uall | grep -c '^??' || true)
[ "$strays" != "0" ] && note "untracked files: $strays (verify none are mine)"

[ "$found" = "0" ] && echo "clean ✓ — no scratch browsers, no profiles, no test artifacts, no temp files"
exit 0
