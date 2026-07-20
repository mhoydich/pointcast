# Agent-Web Observatory — runbook

A fully autonomous census of the agent-readable web. After the one-time
provisioning below, no human is in the loop: hourly scan batches, daily
full-roster coverage, Monday rollups, live public surfaces.

## Architecture

```
workers/observatory/          standalone Worker, two crons
  "0 * * * *"                 hourly scan batch (OBS_BATCH_SIZE domains)
  "0 16 * * 1"                Monday weekly rollup
        │ writes
        ▼
OBSERVATORY KV  ◄─ shared ─►  functions/api/observatory/*  (read-only)
        ▲                        /api/observatory          census + ?domain=
VISITS KV (read-only:            /api/observatory/changes  event feed
 crawler-type discovery)         /api/observatory/rss      RSS 2.0 of events
                                 /api/observatory/weekly   Monday rollup
src/lib/observatory-score.mjs    pure rubric + validators + diffing (tested)
src/lib/observatory-seeds.mjs    roster seeds + crawler-operator map
src/pages/agent-observatory.astro  human dashboard (client-hydrated)
```

The evolving logic (rubric weights, validators, seeds, diffing) lives in
`src/lib/observatory-*.mjs`, shared by `node --test` and bundled into the
Worker by wrangler's esbuild. The Worker itself is a thin orchestrator.

## KV data model (namespace OBSERVATORY)

| Key | Value |
|---|---|
| `obs:index` | `[{ domain, source, category?, score, groups[], lastScanDay, optedOut }]` — one small key; the census endpoint is a single read |
| `obs:domain:{domain}` | full scan record: probes (status/servedValid/hash/sample), robots directives, score, breakdown, history (≤60 days) |
| `obs:events` | change events newest-first, cap 500 (hop discoveries appear here as `domain-added` on their first scan; roster rows with `source: 'hop'` mark them in the index) |
| `obs:weekly:{YYYY-wWW}` + `obs:weekly:latest` + `obs:weekly:index` | Monday rollups (the recap KV idiom) |

## Scan behavior + ethics (enforced in code)

- Only the nine fixed discovery paths are fetched — never page content.
- `robots.txt` first; blanket `Disallow: /` or a `pointcast-observatory`
  stanza short-circuits the scan (recorded as `optedOut`).
- UA: `ai:pointcast-observatory (+https://pointcast.xyz/agent-observatory)`
- ≤1 scan per domain per UTC day (`lastScanDay` guard, double-fire safe).
  Batch selection is oldest-first, so a roster larger than one day's
  capacity (24 crons × OBS_BATCH_SIZE) round-robins fairly instead of
  starving the tail.
- Bodies capped at 128 KB, stored as 16-hex hash prefix + ≤280-char sample.
- Subrequest budget at batch 4: 36 probe fetches + ~12 KV ops ≈ 48/run
  (Cloudflare counts KV operations toward the limit), under the free-plan
  50. Raise `OBS_BATCH_SIZE` on a paid plan (1,000/invocation).

## One-time provisioning (the only human touch)

Handoff: tracked in TASKS.md; ops brief for Manus at
`docs/briefs/2026-07-20-manus-observatory-provisioning.md`. Mike can also
run the three steps directly — they need Cloudflare account access.

1. `npx wrangler kv namespace create OBSERVATORY`
   → paste the id into `workers/observatory/wrangler.toml` AND the
   commented block in the root `wrangler.toml` (then uncomment it).
2. `cd workers/observatory && npx wrangler deploy`
   — one command registers both cron triggers; no dashboard steps.
   Optional: `npx wrangler secret put OBS_OPS_TOKEN` to enable the
   on-demand `POST /ops/scan` + `POST /ops/rollup` routes.
3. Push/redeploy the Pages project so the read endpoints pick up the
   OBSERVATORY binding.

Smoke test after deploy:

```
curl -X POST -H "Authorization: Bearer $OBS_OPS_TOKEN" \
  https://pointcast-observatory.<account>.workers.dev/ops/scan
curl https://pointcast.xyz/api/observatory
```

The `pointcast.xyz` control row should score ~100 — it publishes every
surface the rubric measures. If the control row drops, the scanner is
broken, not the site.

## Caveats

- **The Worker is NOT deployed by the main Pages build.** Changes under
  `workers/observatory/` or to the shared `src/lib/observatory-*.mjs`
  modules need a manual `npx wrangler deploy` from `workers/observatory/`.
  (Same caveat as workers/sparrow-digest.)
- Pages Functions cannot run crons — that is why the scanner is a
  standalone Worker. Do not move the `scheduled()` handler into
  `functions/`; it will never fire there (see the dormant
  `functions/cron/weekly-recap.ts` for the cautionary precedent).
- On the Workers **free** plan, KV writes are 1,000/day account-wide; the
  observatory adds ~150–200/day. Fine on paid, tight on free — check the
  plan when provisioning.
- Adding seeds: edit `src/lib/observatory-seeds.mjs` (tests enforce
  apex-normalized, unique domains) and redeploy the Worker.
