# Manus brief — Agent-Web Observatory provisioning

**Date:** 2026-07-20
**From:** Claude Code
**Task:** one-time Cloudflare provisioning for the Agent-Web Observatory
(PR #843). After these steps the census runs autonomously forever —
hourly scans, Monday rollups, zero human touch.

## Requires Mike approval first

Yes — creating a KV namespace and deploying a new Worker are account
changes. Get a 👍 from Mike on PR #843 (or in Slack) before step 1.

## Exact steps

All from a checkout of `main` after PR #843 merges, with wrangler
authenticated to the PointCast Cloudflare account:

1. `npx wrangler kv namespace create OBSERVATORY`
   - Copy the returned id.
   - Paste it into `workers/observatory/wrangler.toml` (replace
     `REPLACE_ME_WITH_KV_ID`).
   - In root `wrangler.toml`, uncomment the OBSERVATORY block and paste
     the same id.
   - Commit both edits on a small branch → PR (do not push to main).
2. `cd workers/observatory && npx wrangler deploy`
   - This registers both cron triggers automatically; no dashboard steps.
3. Optional but useful: `npx wrangler secret put OBS_OPS_TOKEN` (any long
   random string; note it in the log) — enables on-demand scans.
4. Check the account's Workers plan tier (free vs paid) in the dashboard.
   - Free plan: leave `OBS_BATCH_SIZE = "4"` (subrequest + KV-write
     budgets are tight — see `docs/setup/agent-observatory.md`).
   - Paid plan: fine to raise `OBS_BATCH_SIZE` later; note the tier.
5. After the config PR merges and Pages redeploys, smoke test:
   - `curl -X POST -H "Authorization: Bearer <OBS_OPS_TOKEN>" https://pointcast-observatory.<account>.workers.dev/ops/scan`
   - `curl https://pointcast.xyz/api/observatory` — expect the
     `pointcast.xyz` control row scoring ~100. If the control row is low
     or missing, the scanner is broken; stop and report.

## URLs to open

- https://github.com/mhoydich/pointcast/pull/843
- https://dash.cloudflare.com (Workers & Pages → plan tier; KV)
- https://pointcast.xyz/api/observatory (after deploy)
- https://pointcast.xyz/agent-observatory (dashboard should populate)

## Accounts/tools needed

Cloudflare account access (PointCast), wrangler CLI logged in, GitHub
push access for the id-paste PR.

## What to capture

- Terminal output of the `kv namespace create` and `wrangler deploy`
  commands (ids + registered crons).
- Screenshot of the plan tier page.
- The smoke-test curl outputs.

## Where to write the result

`docs/manus-logs/2026-07-20-observatory-provisioning.md` — include the
namespace id, deploy output, plan tier, and smoke-test results.

## Acceptance criteria

- Both crons visible on the `pointcast-observatory` Worker.
- `/api/observatory` returns a census (not the kv-unbound zero-state)
  within ~1 hour of deploy.
- `pointcast.xyz` control row present and scoring ~100.
