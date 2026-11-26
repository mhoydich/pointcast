#!/usr/bin/env bash
# deploy.sh — the iMac fallback for putting pointcast.xyz live.
#
# The deploy path is GitHub: the "Deploy PointCast to Cloudflare Pages"
# workflow (.github/workflows/cloudflare-pages.yml) builds, gates, uploads and
# smoke-tests main on every push. Called without --fallback or --dry-run, this
# script only says so and exits 0. It touches nothing: no lock, no log, no git.
#
# --fallback is for when that run failed or GitHub is down. It builds
# origin/main in one dedicated worktree (~/pc-deploy), never the caller's
# checkout. Callers queue on one lock, and a call that finds its release
# already live (by this script's own marker) exits without rebuilding. Right
# before upload it fetches main again and refuses to upload if main moved, so
# it cannot replace a newer commit GitHub has already shipped.
#
# Why one build place: through Sept 2026 prod took ~20 deploys a day, each
# built in whatever worktree the agent was standing in. Builds landed out of
# order (a 09-29 tree went live after 09-30 work and rolled it back until the
# next deploy), and one `;`-chained deploy of a failed build 404'd the whole
# site (2026-09-28).
#
# Usage:
#   scripts/deploy.sh                        print how GitHub deploys main, exit 0
#   scripts/deploy.sh --dry-run              build and check origin/main, don't deploy
#   scripts/deploy.sh --fallback             build + deploy origin/main if it isn't live yet
#   scripts/deploy.sh --fallback --force     rebuild + redeploy even if this sha is live
#   scripts/deploy.sh --fallback --release-sha=<40 hex>   reviewed corrective ancestor only
#
# Workers under workers/ are not deployed here or by GitHub; ship those with
# `npx wrangler deploy` in their own folder, from a machine signed in to
# Cloudflare, before the Pages deploy if the pages depend on them.

set -euo pipefail

FORCE=0; DRY=0; FALLBACK=0; RELEASE_SHA=""
for arg in "$@"; do
  case "$arg" in
    --fallback) FALLBACK=1 ;;
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

if [ -n "$RELEASE_SHA" ] && [ "$FALLBACK" = 0 ]; then
  echo "--release-sha is a fallback deploy; pass --fallback with it (see docs/OPERATIONS.md)" >&2
  exit 2
fi

# GitHub is the deploy path. Without --fallback (or --dry-run) say so and stop,
# before the lock, the log or any git work.
if [ "$FALLBACK" = 0 ] && [ "$DRY" = 0 ]; then
  cat <<'MSG'
Nothing built or deployed. GitHub deploys main on every merge: the
"Deploy PointCast to Cloudflare Pages" workflow builds, gates, uploads and
smoke-tests it. A green run means that commit is live.

  Watch it:                 gh run list --workflow cloudflare-pages.yml --branch main --limit 3
  Redeploy the same commit: gh workflow run cloudflare-pages.yml --ref main

scripts/deploy.sh --fallback is only for when that run failed or GitHub is
down. See docs/OPERATIONS.md, section 3.
MSG
  exit 0
fi

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
  [ "$(git -C "$REPO" cat-file -t "$RELEASE_SHA" 2>/dev/null || true)" = commit ] || { say "PIN: release must be an available commit object — not deploying"; exit 1; }
  git -C "$REPO" merge-base --is-ancestor "$RELEASE_SHA" "$MAIN_SHA" || { say "PIN: release is not an ancestor of fresh origin/main — not deploying"; exit 1; }
  PREVIOUS_LIVE="$(cat "$LIVE_FILE" 2>/dev/null || true)"
  [[ "$PREVIOUS_LIVE" =~ ^[0-9a-f]{40}$ ]] || { say "PIN: previous live commit is missing or invalid — not deploying"; exit 1; }
  [ "$(git -C "$REPO" cat-file -t "$PREVIOUS_LIVE" 2>/dev/null || true)" = commit ] || { say "PIN: previous live must be an available commit object — not deploying"; exit 1; }
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

# Main may have moved while we built. If it did, GitHub is shipping (or has
# shipped) the newer tip, and uploading what we built would roll it back. So
# fetch again and upload only if origin/main is still the commit we built.
# Pins are reviewed ancestors by design and keep their own ancestry checks.
git -C "$REPO" fetch -q origin main
NOW_MAIN="$(git -C "$REPO" rev-parse origin/main)"
if [ -z "$RELEASE_SHA" ] && [ "$NOW_MAIN" != "$SHA" ]; then
  say "MAIN MOVED: built $SHORT but origin/main is now ${NOW_MAIN:0:8} — not uploading. GitHub deploys the new tip; check its run, or run --fallback again."
  exit 1
fi
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
