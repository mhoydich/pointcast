# PointCast publishing inventory

Read-only audit, 2026-11-01. Source pinned to `mhoydich/pointcast` main `a9e89d302ed32e8c978e6046126faff39c21a99a`. No deployment, source upload, workflow dispatch, credential change or social send occurred. This is evidence and a proposal, not an activated release route.

## Repository and destinations

| Destination | Source / route | Evidence and limits |
| --- | --- | --- |
| `https://pointcast.xyz/` | `mhoydich/pointcast`; Cloudflare Pages project `pointcast`; output `dist` | [README](https://github.com/mhoydich/pointcast/blob/a9e89d302ed32e8c978e6046126faff39c21a99a/README.md#L151) and [deploy script](https://github.com/mhoydich/pointcast/blob/a9e89d302ed32e8c978e6046126faff39c21a99a/scripts/deploy.sh#L41). README says the Pages project has no Git hookup. |
| `https://pointcast.xyz/ues/` | Same source and Pages release as its parent | Subsite, not an independent deployable or extra league identity. The Atlas edition preserves this parent. |
| Next Models GitHub Pages | Same repository, scoped mirror built by `next-models-pages.yml` | [Workflow](https://github.com/mhoydich/pointcast/blob/a9e89d302ed32e8c978e6046126faff39c21a99a/.github/workflows/next-models-pages.yml). It is not the canonical full-site release. This audit did not establish its latest live revision. |

Repository metadata returned `admin`, `maintain`, `push`, `triage`, and `pull` true for the connected account, and main `protected: false` with no required contexts. Those fields describe repository access, not permission to publish this task or Cloudflare account access. No administration settings were changed.

## What CI actually does

[cloudflare-pages.yml](https://github.com/mhoydich/pointcast/blob/a9e89d302ed32e8c978e6046126faff39c21a99a/.github/workflows/cloudflare-pages.yml) runs on main pushes or manual dispatch, uses Ubuntu and Node 22, performs `npm ci` and `npm run build`, and conditionally deploys through Wrangler only if `CLOUDFLARE_API_TOKEN` is present. Its concurrency group is `cloudflare-pages-main` with cancellation enabled. The workflow warns explicitly that a successful build can leave production unchanged.

Observed run [41159248635](https://github.com/mhoydich/pointcast/actions/runs/41159248635), started 2026-10-31 02:16:31 UTC on `a9e89d3`, concluded success. Job `124412878787` installed and built successfully, but **Deploy to Cloudflare Pages was skipped**. This is working hosted build capacity, not proof of an active hosted production deploy route. Current secret configuration was not inspected; the source condition and skipped step establish only what that run did.

The separate Next Models workflow uses `contents: read`, `pages: write`, `id-token: write`, the `github-pages` environment, and `build:pages`. The connector rejected a workflow-specific runs URL as unsupported; that is a query limitation, not evidence that no runs exist.

## Existing machine-dependent release path

`scripts/deploy.sh` fetches main into a dedicated worktree, builds, checks three required outputs and at least 3,000 files, uploads Pages, then HTTP-checks `/`, `/court/`, and `/blocks.json`. It records the successful SHA locally and removes the generated build directory. Worker deployments are separate and must precede Pages when needed.

The defaults are `~/pc-deploy`, `~/.pointcast-deploy.lock`, `~/Library/Logs/pointcast-deploy.log`, and a hardcoded `~/.pointcast-deploy.live` marker. The first three have `PC_DEPLOY_*` overrides; the live marker does not. This lock coordinates callers sharing that filesystem, not independent cloud runners. Corrective SHA selection requires ancestry from the previous live commit; it is not a general rollback interface.

At audit time the local live marker contained `a9e89d302ed32e8c978e6046126faff39c21a99a`. The latest local log line was `[2026-10-30 19:24:50] LIVE a9e89d30 on https://pointcast.xyz (15798 files)`. That timestamp is the log's own local time, not a converted UTC assertion. This is evidence of the last recorded local release; it cannot independently prove the currently served revision or rule out another deployer.

## Public observations

Direct, unauthenticated GETs at **2026-11-01 17:18:38 UTC** returned:

- `/`: 200 HTML from Cloudflare. Body capture was bounded at 500,000 bytes, so its digest is only a prefix digest and must not be presented as a complete page or artifact digest.
- `/publish.json`: 200 JSON, `generatedAt: 2026-10-31T02:19:13.174Z`. This is the publishing-queue **protocol descriptor**, not a release stamp. It contains no deployed Git revision.
- `/health.json`: 200 JSON with `inspectedAt: 2026-10-27T04:20:12.675Z`, `ageDays: 3`, `stale: false`. These freshness fields were computed at build time; the committed inspection is not a current live verification run. [Implementation](https://github.com/mhoydich/pointcast/blob/a9e89d302ed32e8c978e6046126faff39c21a99a/src/pages/health.json.ts).
- `/feed.json`: 200 JSON, 488,416 bytes, SHA-256 `713847f0042591a8b501133b1ec4ecf9fa5e29c36f7d717f855bff5c9e9cf781`.
- `/api/auth/x?status=1`: 200, `{"ok":true,"provider":"x","available":false}`.

The initial sandbox DNS probes failed; the authorized network probe then succeeded. Separate web-tool errors are probe limitations, not evidence of a general outage. Raw bounded results are saved locally in `/tmp/signal-atlas-public-probes-network.json`. A current provider deployment record or public artifact-bound release stamp remains unverified.

## Feeds, queue, email and social

`src/pages/feed.xml.ts` and `feed.json.ts` generate published block and standards feeds at build time. `rss.xml.js` generates the legacy posts/projects feed. They move with the site release, and feed availability does not establish distribution, subscriptions or readership.

`functions/api/publish.ts` is an optional `PC_PUBLISH_KV` queue, not a Git commit, static-site release, or social publisher. Its metadata and the descriptor must not be interpreted as a live publishing connection. No POST was made.

[X authentication documentation](https://github.com/mhoydich/pointcast/blob/a9e89d302ed32e8c978e6046126faff39c21a99a/docs/setup/x-auth.md#L23) explicitly requests only `tweet.read users.read`, stores no access/refresh token, and grants no posting permission. The live status endpoint reports `available:false` as above. Searches for `api.x.com/2/tweets` and `api.twitter.com/2/tweets` returned no matches; this bounded search does not prove the absence of every possible external integration. Generated social images and public profile links are not authenticated posting capability. No actual X post or post receipt is established.

Separate scheduled Workers exist in source: `pointcast-kennel-daily` at `0 7 * * *`, and `pointcast-morning-daily` at `45 13 * * *` and `45 14 * * *` with a Los Angeles hour guard. Source flags include `KENNEL_DAILY_DRY_RUN=false`, `MORNING_DAILY_DRY_RUN=false`, and `MORNING_SEND_EMAIL_READY=false`. They reference `AUTH_DB`, `SEND_EMAIL`, and service bindings. Source schedules are not proof of current deployed schedules, send readiness or delivery. This audit did not invoke either Worker or contact recipients.

Credential/configuration names relevant to these routes, without values: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; `X_CLIENT_ID`, `X_CLIENT_SECRET`, `AUTH_DB`, migration `0015_x_identity.sql`; `MORNING_INTERNAL_KEY`, `RESEND_API_KEY`, `SEND_EMAIL`, `KENNEL_DAILY`, `MORNING_DAILY`, and `PRESENCE_BUS`. Existing Wrangler CLI authentication may support the local route, but its token/scopes were not inspected. No new credentials are needed for this audit or the offline Atlas.

## Minimum proposed transition

1. Preserve the unpushed Atlas handoff and its digest. Resolve exact source-upload destinations and the existing publication hold before transferring it. No new environment has been provisioned.
2. Extract one portable build-and-verify contract from the existing release script: pinned source, lockfile/runtime identity, full-site completeness checks, focused tests, content checks, file manifest and retained immutable artifact. Record failures and artifact retention explicitly.
3. Run that contract on the existing hosted runner. Keep production promotion as a separate, serialized per-site operation using the approved artifact. Reconcile the current local and Actions writers before activating both; merely setting the token would leave competing locks and different checks.
4. Establish production destination and existing credential scope through the owner-approved setup path. Never pass deploy secrets to arbitrary bot submissions. Record deployment ID, expected SHA and artifact digest, then verify an artifact-bound public stamp plus typed representative routes. A green build alone cannot advance release status to live.
5. Define an explicitly authorized corrective/rollback operation that preserves newer releases and data compatibility; retain a known-good artifact. Do not use `--force` to bypass lineage or infer automatic rollback authority.
6. Keep site feeds, email and each social account as separate release channels. A social adapter must identify the authenticated account, approved content/destination, idempotency key and provider receipt before claiming a post. None is activated here.

Atlas UES follows PointCast's release and telemetry parent. Its independent visual edition does not require a separate deployment credential or inflate collection standings.
