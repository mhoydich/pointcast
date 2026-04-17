#!/bin/bash
# Polling daemon that runs after deploy-visit-nouns-mainnet.mjs writes its KT1
# to /tmp/pointcast-visit-nouns-mainnet-kt1.txt. Once seen:
#   1. Wire KT1 into contracts.json + any block references
#   2. Batch-mint 10 starter Nouns
#   3. Rebuild site + deploy to prod
# Each step is idempotent — safe to re-run if something crashes mid-flow.

set -e
cd "$(dirname "$0")/.."

KT1_FILE=/tmp/pointcast-visit-nouns-mainnet-kt1.txt
DONE_FILE=/tmp/pointcast-mainnet-wired.stamp

log() { echo "[auto] $*"; }

while [ ! -f "$KT1_FILE" ]; do
  log "waiting for $KT1_FILE (mainnet origination)..."
  sleep 20
done

if [ -f "$DONE_FILE" ]; then
  log "already wired (stamp at $DONE_FILE) — skipping"
  exit 0
fi

KT1=$(cat "$KT1_FILE" | tr -d '[:space:]')
log "mainnet KT1 detected: $KT1"

log "step 1/4 — wiring KT1 into contracts.json + block JSONs"
node scripts/post-mainnet-wire.mjs

log "step 2/4 — batch-minting 10 starter Nouns (takes ~5-8 min)"
node scripts/post-mainnet-batch-mint.mjs || log "batch-mint hit an error, continuing with partial set"

log "step 3/4 — building site"
npx astro build 2>&1 | tail -3

log "step 4/4 — deploying to pointcast.xyz"
npx wrangler pages deploy dist --project-name pointcast --commit-dirty=true 2>&1 | tail -5

date > "$DONE_FILE"
log "✓ done — $KT1 live, site redeployed. stamped $DONE_FILE."
