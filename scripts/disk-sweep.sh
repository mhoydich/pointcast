#!/usr/bin/env bash
# disk-sweep.sh — reclaim disk from idle PointCast worktrees without touching
# anything an agent is still using.
#
# This is the repo copy of the sweep that docs/OPERATIONS.md §5 runs daily on
# Mike's iMac. Install it from the deploy worktree, which always sits on the
# tip of origin/main (~/pointcast itself is a stale checkout, see §1):
#   ln -sf ~/pc-deploy/scripts/disk-sweep.sh ~/bin/pointcast-disk-sweep.sh
#   crontab: 30 3 * * * $HOME/bin/pointcast-disk-sweep.sh --apply
#
# Usage:
#   scripts/disk-sweep.sh                 dry run: say what would go, touch nothing
#   scripts/disk-sweep.sh --apply         strip node_modules/, dist/, dist.stale-*/, .astro/ and
#                                         nested workers/*/node_modules from idle worktrees
#   scripts/disk-sweep.sh --apply --remove-merged
#                                         also remove idle, clean worktrees whose branch tip is
#                                         exactly the head of a PR merged into the default branch
#   --idle-hours=N   a worktree counts as idle when no file outside node_modules/dist/.git
#                    changed, no commit or checkout happened, and no process is standing
#                    in it, for N hours (default 24; 0 is refused)
#   --root=DIR       where the pc-* worktrees live (default $HOME)
#   --prefix=STR     worktree folder prefix (default pc-)
#
# The strip step runs on any idle worktree, dirty or not: node_modules, dist
# and .astro are rebuilt by `npm ci` and `npm run build:bare`. The checkout
# itself goes only with --remove-merged, and only when the tree is clean, no
# ignored secrets (.env*, .dev.vars*, .secrets/) are inside, and GitHub shows
# a PR merged into the default branch whose head sha is exactly this tip, so
# every commit is on origin. Stashes live in the shared .git and survive.
#
# Never touched: ~/pc-deploy (scripts/deploy.sh owns it), the main checkout
# the worktrees belong to, the worktree this script runs from, any worktree
# git reports as locked, .pointcast/ and .wrangler/ inside a worktree, and
# anything active inside the idle window. Without lsof on PATH the script
# refuses --apply, because it could not tell which worktrees are in use.
#
# Log: ~/Library/Logs/pointcast-disk-sweep.log (or $PC_SWEEP_LOG).

set -euo pipefail
# cron's PATH is /usr/bin:/bin; lsof lives in /usr/sbin on macOS, gh in Homebrew.
PATH="$PATH:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin"

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
    -h|--help) awk 'NR > 1 && !/^#/ { exit } NR > 1 { sub(/^# ?/, ""); print }' "$0"; exit 0 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done
case "$IDLE_HOURS" in ''|0|*[!0-9]*) echo "--idle-hours needs a whole number of hours, at least 1" >&2; exit 2 ;; esac
[ "$IDLE_HOURS" -le 8760 ] || { echo "--idle-hours: more than a year makes no sense" >&2; exit 2; }
IDLE_MIN=$((IDLE_HOURS * 60))

# Resolve $0 through symlinks (bash 3.2 has no realpath), so the documented
# install, a link from ~/bin, still finds the repo this script lives in.
resolve_path() {
  local f="$1" dir
  while [ -L "$f" ]; do
    dir="$(cd "$(dirname "$f")" && pwd -P)"
    f="$(readlink "$f")"
    case "$f" in /*) ;; *) f="$dir/$f" ;; esac
  done
  printf '%s/%s\n' "$(cd "$(dirname "$f")" && pwd -P)" "$(basename "$f")"
}
canon() { if [ -d "$1" ]; then (cd "$1" && pwd -P); else printf '%s\n' "$1"; fi; }

SELF="$(resolve_path "$0")"
SELF_DIR="$(cd "$(dirname "$SELF")/.." && pwd -P)"
REPO="$(git -C "$SELF_DIR" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
[ -n "$REPO" ] || { echo "disk-sweep: $SELF_DIR is not inside a git checkout; run the copy in the repo" >&2; exit 2; }
MAIN_CHECKOUT="$(canon "${REPO%/.git}")"
DEPLOY_DIR="$(canon "${PC_DEPLOY_DIR:-$HOME/pc-deploy}")"
ROOT="$(canon "$ROOT")"
LOG="${PC_SWEEP_LOG:-$HOME/Library/Logs/pointcast-disk-sweep.log}"
mkdir -p "$(dirname "$LOG")"

say() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG"; }
trap 'say "sweep aborted at line $LINENO (exit $?)"' ERR
mode() { [ "$APPLY" = 1 ] && echo "removing" || echo "would remove"; }

# `du -sk` is the same on macOS and Linux. Sizes are apparent: node_modules
# copied with `cp -c` are APFS clones, so removing one frees less than du
# says; the df delta at the end is the real number.
human_kb() { awk -v kb="${1:-0}" 'BEGIN { if (kb >= 1048576) printf "%.1fG", kb / 1048576; else printf "%dM", kb / 1024 }'; }
kb_of() { du -sk "$1" 2>/dev/null | awk 'NR == 1 { print $1 + 0 }' || true; }
size_of() { human_kb "$(kb_of "$1")"; }
freed_kb=0
add_freed() { local kb; kb="$(kb_of "$1")"; freed_kb=$((freed_kb + ${kb:-0})); }
avail_kb() { df -k "$ROOT" 2>/dev/null | awk 'NR == 2 { print $4 + 0 }' || true; }

LSOF="$(command -v lsof || true)"
if [ -z "$LSOF" ] && [ "$APPLY" = 1 ]; then
  say "lsof not found on PATH; refusing to --apply because in-use worktrees cannot be detected"
  exit 1
fi

# A worktree is busy if any real file changed inside the window, git itself
# did anything there (commit, checkout, merge: the HEAD reflog and the index
# move even when no source file does), or a process is standing in it.
is_idle() {
  local dir="$1" touched last_git gitdir now
  touched="$(find "$dir" \
    \( -path "$dir/node_modules" -o -path "$dir/dist" -o -path "$dir/dist.stale-*" -o -path "$dir/.astro" -o -path "$dir/.git" \) -prune \
    -o -type f -mmin "-$IDLE_MIN" -print 2>/dev/null | head -1 || true)"
  [ -z "$touched" ] || return 1
  last_git="$(git -C "$dir" log -g -1 --format=%ct HEAD 2>/dev/null || true)"
  now="$(date +%s)"
  if [ -n "$last_git" ] && [ $((now - last_git)) -lt $((IDLE_HOURS * 3600)) ]; then return 1; fi
  gitdir="$(git -C "$dir" rev-parse --path-format=absolute --git-dir 2>/dev/null || true)"
  if [ -n "$gitdir" ] && [ -n "$(find "$gitdir/index" -mmin "-$IDLE_MIN" 2>/dev/null || true)" ]; then return 1; fi
  if [ -n "$LSOF" ]; then
    if "$LSOF" -F n -d cwd 2>/dev/null | grep -qxF "n$dir"; then return 1; fi
    if "$LSOF" -F n -d cwd 2>/dev/null | grep -qF "n$dir/"; then return 1; fi
  fi
  return 0
}

# Is this worktree's branch finished on origin? "Finished" means a PR merged
# into the default branch whose merged head is exactly our tip; then every
# local commit is on origin by definition, whatever the upstream says.
SLUG=""; DEFAULT_BRANCH=""
branch_is_merged() {
  local dir="$1" tip merged url
  command -v gh >/dev/null 2>&1 || { say "  gh is not installed; cannot check merge state"; return 1; }
  if [ -z "$SLUG" ]; then
    url="$(git -C "$dir" remote get-url origin 2>/dev/null || true)"
    SLUG="$(printf '%s' "$url" | sed -E 's#^.*github\.com[:/]##; s#\.git$##; s#/$##')"
    [ -n "$SLUG" ] || return 1
    DEFAULT_BRANCH="$(gh api "repos/$SLUG" --jq .default_branch 2>/dev/null || echo main)"
  fi
  tip="$(git -C "$dir" rev-parse HEAD)"
  merged="$(gh api "repos/$SLUG/commits/$tip/pulls" \
    --jq "[.[] | select(.merged_at != null and .base.ref == \"$DEFAULT_BRANCH\" and .head.sha == \"$tip\")] | length" 2>/dev/null || echo 0)"
  [ "${merged:-0}" -gt 0 ]
}

has_secrets() {
  git -C "$1" status --porcelain --ignored 2>/dev/null | grep -qE '^!! (\.env|\.dev\.vars|\.secrets/)'
}

# --- the sweep ---------------------------------------------------------------
say "disk sweep start (apply=$APPLY remove-merged=$REMOVE_MERGED idle=${IDLE_HOURS}h root=$ROOT)"
avail_start="$(avail_kb)"
locked_list="$(git -C "$MAIN_CHECKOUT" worktree list --porcelain 2>/dev/null | awk '/^worktree /{w=substr($0,10)} /^locked/{print w}' || true)"

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
  dir="$(canon "$dir")"
  case "$dir" in
    "$DEPLOY_DIR"|"$MAIN_CHECKOUT"|"$SELF_DIR") say "skip $dir (reserved)"; continue ;;
  esac
  if [ ! -e "$dir/.git" ]; then say "skip $dir (not a worktree)"; continue; fi
  if ! git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    say "skip $dir (broken worktree; git worktree prune, then remove it by hand)"; continue
  fi
  if printf '%s\n' "$locked_list" | grep -qxF "$dir"; then say "skip $dir (locked worktree)"; continue; fi

  branch="$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
  if ! is_idle "$dir"; then say "skip $dir [$branch] (active in the last ${IDLE_HOURS}h)"; continue; fi

  # Rebuildable folders go whenever the worktree is idle.
  for sub in node_modules dist .astro; do
    [ -d "$dir/$sub" ] || continue
    say "$(mode) $dir/$sub ($(size_of "$dir/$sub")) [$branch]"
    add_freed "$dir/$sub"
    [ "$APPLY" = 1 ] && rm -rf "$dir/$sub"
  done
  for stale in "$dir"/dist.stale-* "$dir"/workers/*/node_modules "$dir"/packages/*/node_modules; do
    [ -d "$stale" ] || continue
    say "$(mode) $stale ($(size_of "$stale"))"
    add_freed "$stale"
    [ "$APPLY" = 1 ] && rm -rf "$stale"
  done
  # Local state that is not rebuildable from the repo (the oracle's LanceDB
  # index, wrangler's local D1/KV) is reported, never removed.
  for keep in .pointcast .wrangler; do
    [ -d "$dir/$keep" ] && say "note $dir/$keep ($(size_of "$dir/$keep")) left in place"
  done

  # The checkout itself goes only when every commit is provably on origin.
  [ "$REMOVE_MERGED" = 1 ] || continue
  dirty="$(git -C "$dir" status --porcelain 2>/dev/null || true)"
  if [ -n "$dirty" ]; then say "keep $dir [$branch] (uncommitted changes)"; continue; fi
  if has_secrets "$dir"; then say "keep $dir [$branch] (ignored secrets inside: .env*, .dev.vars*, or .secrets/)"; continue; fi
  if [ "$branch" = "HEAD" ] || [ "$branch" = "main" ]; then say "keep $dir (on $branch)"; continue; fi
  if ! branch_is_merged "$dir"; then say "keep $dir [$branch] (no PR merged into $DEFAULT_BRANCH at this exact tip)"; continue; fi
  say "$(mode) worktree $dir [$branch] (merged, clean; $(size_of "$dir"))"
  add_freed "$dir"
  if [ "$APPLY" = 1 ]; then
    git -C "$MAIN_CHECKOUT" worktree remove "$dir" \
      || say "  could not remove $dir cleanly; left in place"
  fi
done

if [ "$APPLY" = 1 ]; then
  git -C "$MAIN_CHECKOUT" worktree prune
  avail_end="$(avail_kb)"
  if [ -n "$avail_start" ] && [ -n "$avail_end" ]; then
    say "disk sweep done: $(human_kb $((avail_end - avail_start))) freed on $ROOT ($(human_kb "$freed_kb") apparent)"
  else
    say "disk sweep done: $(human_kb "$freed_kb") apparent freed"
  fi
else
  say "disk sweep done: $(human_kb "$freed_kb") apparent reclaimable (dry run)"
fi
