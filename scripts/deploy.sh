#!/usr/bin/env bash
# deploy.sh — the one way pointcast.xyz goes live.
#
# Defaults to origin/main, built in one dedicated worktree
# (~/pc-deploy), never the caller's checkout. Callers can be any agent in any
# worktree; reviewed corrective pins use the same lock and prevent rollback.
# Callers queue on one lock, and a call that finds its release already live
# exits without rebuilding.
#
# Why: through Sept 2026 prod took ~20 deploys a day, each built in whatever
# worktree the agent was standing in. Builds landed out of order (a 09-29 tree
# went live after 09-30 work and rolled it back until the next deploy), every
# task paid for a fresh 1.4G checkout + 0.8G node_modules + 1.8G dist, and one
# `;`-chained deploy of a failed build 404'd the whole site (2026-09-28).
#
# Usage:
#   scripts/deploy.sh             build + deploy origin/main if it isn't live yet
#   scripts/deploy.sh --force     rebuild + redeploy even if this sha is live
#   scripts/deploy.sh --dry-run   build and check, don't deploy
#   scripts/deploy.sh --release-sha=<40 hex>   reviewed corrective ancestor only
#
# Workers under workers/ are not deployed here; ship those with
# `npx wrangler deploy` in their own folder, before this runs.

set -euo pipefail

FORCE=0; DRY=0; RELEASE_SHA=""
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    --dry-run) DRY=1 ;;
    --release-sha=*)
      [ -z "$RELEASE_SHA" ] || { echo "duplicate release sha" >&2; exit 2; }
      RELEASE_SHA="${arg#--release-sha=}"
      [[ "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "release sha must be 40 lowercase hex characters" >&2; exit 2; }
      ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

REPO="$(git -C "$(dirname "$0")" rev-parse --path-format=absolute --git-common-dir)"
DEPLOY_DIR="${PC_DEPLOY_DIR:-$HOME/pc-deploy}"
LOCK="${PC_DEPLOY_LOCK:-$HOME/.pointcast-deploy.lock}"
LOG="${PC_DEPLOY_LOG:-$HOME/Library/Logs/pointcast-deploy.log}"
LIVE_FILE="$HOME/.pointcast-deploy.live"   # sha of the last good deploy
PROJECT=pointcast
SITE=https://pointcast.xyz
export CI=1 CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-699061394cac705067bad6a7a4bd2db5}"

mkdir -p "$(dirname "$LOG")"
say() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG"; }

# --- lock: one deploy at a time, later callers wait (up to 30 min) ----------
waited=0
until mkdir "$LOCK" 2>/dev/null; do
  holder="$(cat "$LOCK/pid" 2>/dev/null || true)"
  if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then
    say "stale lock from pid $holder, taking it"
    rm -rf "$LOCK"; continue
  fi
  if [ "$waited" -ge 1800 ]; then say "gave up waiting for lock held by pid $holder"; exit 75; fi
  [ "$waited" -eq 0 ] && say "another deploy is running (pid $holder), waiting"
  sleep 10; waited=$((waited + 10))
done
echo $$ > "$LOCK/pid"
trap 'rm -rf "$LOCK"' EXIT

# --- the deploy worktree, pinned to the selected release --------------------
git -C "$REPO" fetch -q origin main
MAIN_SHA="$(git -C "$REPO" rev-parse origin/main)"
SHA="$MAIN_SHA"
if [ -n "$RELEASE_SHA" ]; then
  # Corrective pins may omit unreviewed newer work, never replace newer live work.
  git -C "$REPO" cat-file -e "$RELEASE_SHA^{commit}" 2>/dev/null || { say "PIN: release commit unavailable — not deploying"; exit 1; }
  git -C "$REPO" merge-base --is-ancestor "$RELEASE_SHA" "$MAIN_SHA" || { say "PIN: release is not an ancestor of fresh origin/main — not deploying"; exit 1; }
  PREVIOUS_LIVE="$(cat "$LIVE_FILE" 2>/dev/null || true)"
  [[ "$PREVIOUS_LIVE" =~ ^[0-9a-f]{40}$ ]] || { say "PIN: previous live commit is missing or invalid — not deploying"; exit 1; }
  git -C "$REPO" merge-base --is-ancestor "$PREVIOUS_LIVE" "$RELEASE_SHA" || { say "PIN: release would replace newer or unrelated live work — not deploying"; exit 1; }
  SHA="$RELEASE_SHA"
  say "reviewed corrective pin ${SHA:0:8} (fresh origin/main ${MAIN_SHA:0:8})"
fi
SHORT="${SHA:0:8}"

if [ "$FORCE" = 0 ] && [ "$DRY" = 0 ] && [ "$(cat "$LIVE_FILE" 2>/dev/null)" = "$SHA" ]; then
  say "release $SHORT is already live, nothing to do (--force to redeploy)"
  exit 0
fi

if [ ! -e "$DEPLOY_DIR/.git" ]; then
  git -C "$REPO" worktree prune
  git -C "$REPO" worktree add --detach "$DEPLOY_DIR" "$SHA" >/dev/null
fi
cd "$DEPLOY_DIR"
git checkout -q --detach -f "$SHA"
git clean -q -fd            # untracked files go; ignored (node_modules, generated art) stay
rm -rf dist

LOCK_HASH="$(shasum package-lock.json | cut -c1-40)"
if [ "$(cat node_modules/.pc-lock-hash 2>/dev/null)" != "$LOCK_HASH" ]; then
  say "package-lock changed, npm ci"
  npm ci --no-audit --no-fund --loglevel=error
  echo "$LOCK_HASH" > node_modules/.pc-lock-hash
fi

# --- build, gated: a failed or partial build never reaches the deploy step --
build() { npm run build --silent >>"$LOG.build" 2>&1; }
: > "$LOG.build"
say "building $SHORT ($(git log -1 --format=%s | cut -c1-70))"
if ! build; then
  say "build failed once (often a transient fetch like api.tzkt.io); retrying"
  rm -rf dist
  build || { say "BUILD FAILED twice — not deploying. tail $LOG.build"; tail -20 "$LOG.build"; exit 1; }
fi

files=$(find dist -type f | wc -l | tr -d ' ')
for page in index.html court/index.html blocks.json; do
  [ -f "dist/$page" ] || { say "GATE: dist/$page missing — not deploying"; exit 1; }
done
[ "$files" -ge 3000 ] || { say "GATE: only $files files in dist — not deploying"; exit 1; }
say "build ok: $files files"

if [ "$DRY" = 1 ]; then say "dry run, stopping before deploy"; exit 0; fi

# Main may have moved while we built. That's fine — we deploy what we built
# and the next caller ships the newer tip. What must never happen is an older
# sha replacing a newer one: defaults use fresh main; pins also check live ancestry.
WRANGLER=node_modules/.bin/wrangler
[ -x "$WRANGLER" ] || WRANGLER="npx --yes wrangler@4"
$WRANGLER pages deploy dist --project-name "$PROJECT" --branch main \
  --commit-hash "$SHA" --commit-message "$(git log -1 --format=%s | cut -c1-200)" \
  </dev/null >>"$LOG.build" 2>&1 || { say "WRANGLER FAILED — tail $LOG.build"; tail -20 "$LOG.build"; exit 1; }

# --- smoke: the pages an outage hits first ---------------------------------
bad=0
for path in / /court/ /blocks.json; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$SITE$path?deploy=$SHORT")
  [ "$code" = 200 ] || { say "SMOKE: $path -> $code"; bad=1; }
done
if [ "$bad" = 1 ]; then
  say "deployed $SHORT but smoke failed — check the site now"
  exit 1
fi

echo "$SHA" > "$LIVE_FILE"
rm -rf dist                 # 1.8G; rebuilt every deploy anyway
say "LIVE $SHORT on $SITE ($files files)"
