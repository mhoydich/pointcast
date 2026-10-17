#!/usr/bin/env bash
# disk-sweep.sh — reclaim disk from idle PointCast worktrees without touching
# anything an agent is still using.
#
# This is the repo copy of the sweep that docs/OPERATIONS.md §5 runs daily on
# Mike's iMac. Install it there with:
#   ln -sf ~/pointcast/scripts/disk-sweep.sh ~/bin/pointcast-disk-sweep.sh
#
# Usage:
#   scripts/disk-sweep.sh                 dry run: say what would go, touch nothing
#   scripts/disk-sweep.sh --apply         strip node_modules/, dist/, dist.stale-*/, .astro/ from idle worktrees
#   scripts/disk-sweep.sh --apply --remove-merged
#                                         also remove idle, clean, fully-pushed worktrees whose
#                                         branch has a merged PR (asks GitHub through `gh`)
#   --idle-hours=N   a worktree counts as idle when no file outside node_modules/dist/.git
#                    changed in the last N hours (default 24)
#   --root=DIR       where the pc-* worktrees live (default $HOME)
#   --prefix=STR     worktree folder prefix (default pc-)
#
# Never touched: ~/pc-deploy (scripts/deploy.sh owns it and holds its own
# lock), the main checkout the worktrees belong to, the worktree this script
# is running from, any worktree with uncommitted changes or unpushed commits,
# any worktree a running process has as its working directory, and anything
# modified inside the idle window. Those rules are what make it safe to run
# while several agents are mid-task; the sweep only ever removes what can be
# rebuilt (`npm ci`, `npm run build:bare`) or what is already on origin.
#
# Log: ~/Library/Logs/pointcast-disk-sweep.log (or $PC_SWEEP_LOG).

set -euo pipefail

APPLY=0; REMOVE_MERGED=0; IDLE_HOURS=24
ROOT="${PC_WORKTREE_ROOT:-$HOME}"
PREFIX="${PC_WORKTREE_PREFIX:-pc-}"
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --remove-merged) REMOVE_MERGED=1 ;;
    --idle-hours=*) IDLE_HOURS="${arg#--idle-hours=}" ;;
    --root=*) ROOT="${arg#--root=}" ;;
    --prefix=*) PREFIX="${arg#--prefix=}" ;;
    -h|--help) sed -n '2,32p' "$0"; exit 0 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done
case "$IDLE_HOURS" in ''|*[!0-9]*) echo "--idle-hours needs a whole number" >&2; exit 2 ;; esac

LOG="${PC_SWEEP_LOG:-$HOME/Library/Logs/pointcast-disk-sweep.log}"
DEPLOY_DIR="${PC_DEPLOY_DIR:-$HOME/pc-deploy}"
SELF_DIR="$(cd "$(dirname "$0")/.." && pwd -P)"
REPO="$(git -C "$SELF_DIR" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
MAIN_CHECKOUT="${REPO%/.git}"
mkdir -p "$(dirname "$LOG")"

say() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG"; }
mode() { [ "$APPLY" = 1 ] && echo "removing" || echo "would remove"; }
# `du -sk` is the same on macOS and Linux; the human size is for the log only.
size_of() { [ -e "$1" ] && du -sk "$1" 2>/dev/null | awk '{ printf "%.1fG", $1 / 1048576 }' || echo "0G"; }

freed_kb=0
add_freed() { local kb; kb=$(du -sk "$1" 2>/dev/null | cut -f1 || echo 0); freed_kb=$((freed_kb + kb)); }

# A worktree is busy if any real file changed inside the window, or a process
# is standing in it (lsof reports cwd on both macOS and Linux).
is_idle() {
  local dir="$1"
  local touched
  touched=$(find "$dir" \
    \( -path "$dir/node_modules" -o -path "$dir/dist" -o -path "$dir/dist.stale-*" -o -path "$dir/.astro" -o -path "$dir/.git" \) -prune \
    -o -type f -mmin "-$((IDLE_HOURS * 60))" -print 2>/dev/null | head -1)
  [ -z "$touched" ] || return 1
  if command -v lsof >/dev/null 2>&1; then
    if lsof -F n -d cwd 2>/dev/null | grep -q "^n$dir\(/\|$\)"; then return 1; fi
  fi
  return 0
}

# Is this worktree's branch finished on origin? "Finished" means a PR merged
# into the default branch whose merged head is exactly our tip. Nothing local
# may be ahead of that: a dirty tree or an unpushed commit always wins.
branch_is_merged() {
  local dir="$1" branch="$2" slug tip merged
  command -v gh >/dev/null 2>&1 || { say "  gh is not installed; cannot check merge state"; return 1; }
  slug=$(git -C "$dir" remote get-url origin 2>/dev/null | sed -E 's#.*github\.com[:/]([^/]+)/([^/.]+)(\.git)?/?$#\1/\2#')
  [ -n "$slug" ] || return 1
  tip=$(git -C "$dir" rev-parse HEAD)
  merged=$(gh api "repos/$slug/pulls?state=closed&head=${slug%%/*}:$branch&per_page=10" \
    --jq "[.[] | select(.merged_at != null and .base.ref == \"main\" and .head.sha == \"$tip\")] | length" 2>/dev/null || echo 0)
  [ "${merged:-0}" -gt 0 ]
}

# --- the sweep ---------------------------------------------------------------
say "disk sweep start (apply=$APPLY remove-merged=$REMOVE_MERGED idle=${IDLE_HOURS}h root=$ROOT)"

# clean-build.mjs parks a failed rename as ../dist.stale-<ts> next to the
# worktree, i.e. directly under $ROOT. Those are never wanted.
for stale in "$ROOT"/dist.stale-*; do
  [ -d "$stale" ] || continue
  say "$(mode) parked build $stale ($(size_of "$stale"))"
  add_freed "$stale"
  [ "$APPLY" = 1 ] && rm -rf "$stale"
done

for dir in "$ROOT"/"$PREFIX"*; do
  [ -d "$dir" ] || continue
  dir="$(cd "$dir" && pwd -P)"
  case "$dir" in
    "$DEPLOY_DIR"|"$MAIN_CHECKOUT"|"$SELF_DIR") say "skip $dir (reserved)"; continue ;;
  esac
  if [ ! -e "$dir/.git" ]; then say "skip $dir (not a worktree)"; continue; fi

  branch="$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
  if ! is_idle "$dir"; then say "skip $dir [$branch] (active in the last ${IDLE_HOURS}h)"; continue; fi

  dirty="$(git -C "$dir" status --porcelain 2>/dev/null | head -1)"
  unpushed=""
  if git -C "$dir" rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
    unpushed="$(git -C "$dir" rev-list '@{u}..HEAD' 2>/dev/null | head -1)"
  elif [ "$branch" != "HEAD" ]; then
    unpushed="no-upstream"
  fi

  # Rebuildable folders go whenever the worktree is idle.
  for sub in node_modules dist .astro; do
    [ -d "$dir/$sub" ] || continue
    say "$(mode) $dir/$sub ($(size_of "$dir/$sub")) [$branch]"
    add_freed "$dir/$sub"
    [ "$APPLY" = 1 ] && rm -rf "$dir/$sub"
  done
  for stale in "$dir"/dist.stale-*; do
    [ -d "$stale" ] || continue
    say "$(mode) $stale ($(size_of "$stale"))"
    add_freed "$stale"
    [ "$APPLY" = 1 ] && rm -rf "$stale"
  done

  # The checkout itself goes only when every commit is safely on origin and
  # the PR that carried them merged.
  [ "$REMOVE_MERGED" = 1 ] || continue
  if [ -n "$dirty" ]; then say "keep $dir [$branch] (uncommitted changes)"; continue; fi
  if [ -n "$unpushed" ]; then say "keep $dir [$branch] (unpushed commits or no upstream)"; continue; fi
  if [ "$branch" = "HEAD" ] || [ "$branch" = "main" ]; then say "keep $dir (on $branch)"; continue; fi
  if ! branch_is_merged "$dir" "$branch"; then say "keep $dir [$branch] (no merged PR at this tip)"; continue; fi
  say "$(mode) worktree $dir [$branch] (merged, clean, pushed; $(size_of "$dir"))"
  add_freed "$dir"
  if [ "$APPLY" = 1 ]; then
    git -C "$MAIN_CHECKOUT" worktree remove "$dir" \
      || say "  could not remove $dir cleanly; left in place"
  fi
done

if [ "$APPLY" = 1 ] && [ -n "$MAIN_CHECKOUT" ]; then
  git -C "$MAIN_CHECKOUT" worktree prune
fi

say "disk sweep done: $(awk "BEGIN { printf \"%.1fG\", $freed_kb / 1048576 }") $( [ "$APPLY" = 1 ] && echo freed || echo reclaimable )"
