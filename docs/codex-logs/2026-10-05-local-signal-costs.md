# Local Signal and Big Local Basket

User requested a PointCast outage tracker within 25 miles of 90245, expanded to interruptions beyond power, a separate broad local-costs dashboard, participation by visiting agents, and an Electric Company educational-TV-inspired visual direction.

Implemented original primary-color broadcast typography and two homepage dashboard cards. Added `/outages` and `/outages.json`, `/local-costs` and `/local-costs.json`, live `/api/local-signals`, and price-candidate intake at `/api/local-costs`. Discovery includes Apps, Local, agents.json, LLM indexes and ESC Blocks 0664/0665. No new channel or Block schema.

## Evidence and coverage

- SCE's public outage-map page supplies `https://sce-outage-ags.esriemcs.com/arcgis/rest/services/43/outage/MapServer/0`. The API uses a 25-statute-mile point query and independently filters returned point distances, active status and duplicate incident IDs. Locations are not outage boundaries. LADWP and other providers are outside the connected feed.
- The session's initial SCE check listed two 90245 incidents (24 and 80 affected customers). Equipment-problem and storm-condition estimates were utility statements, not a claim about the user's home. Data is refreshed on visible pages every two minutes; cached for 60 seconds; old client readings become stale after five minutes. No scheduled monitoring or notifications.
- NWS active alerts query covers the El Segundo center point, not every location in the radius. USGS covers a 25-mile radius during the trailing 24 hours. Hazards do not establish service failure. An in-session live read successfully returned 61 SCE incidents, two center-point weather alerts and one earthquake. These counts are snapshots, not permanent product claims.
- Internet/mobile, water, transit, roads and gas are manual source checks. They never show an all-clear.
- The basket has 36 items, 34 with illustrative quantities and two watch-only items. AAA's retrieved Los Angeles–Long Beach regular gasoline average was $6.4206/gallon. This is a dated regional comparator, explicitly excluded from the local basket, with source publication time unknown.
- First local-service observation: LA Metro's public fares page explicitly states `$1.75 Regular Fare One-Way Ride`. Four illustrative rides assume separate days and no transfer/cap discount. Evidence: https://www.metro.net/riding/fares/. This is not a transaction receipt or claim about other providers.
- Other local prices await first-hand evidence. No fabricated grocery, electricity, lumber, coffee or movie quotes. Missing/stale values do not become zeros or a completed basket. Comparisons require matching seller, product, units, conditions and tax treatment.

## Agent participation and writes

JSON exposes small missing/stale-item assignments and a complete candidate schema. Humans have a structured form; agents have a copyable assignment and POST protocol. Names/agent handles are self-reported. Public reads never include pending candidates. Candidate intake uses existing PC_PING_KV with a separate prefix and 90-day retention, bounded 8 KB bodies, and PC_RATES_KV rate limiting. No bindings, migrations, credentials or deployment configuration were changed.

Candidates do not update public prices. A signed-in director reads the cursor-paginated queue; accepted evidence is added to the repository through a reviewed PR. Anonymous queue access is rejected. Intake reports unavailability rather than pretending to save. No test observations were written to production.

## Validation

- Five focused Node tests pass: radius/active/dedup filtering; partial-source failures and hazard distinction; evidence, unit, date and location validation; incomplete/stale basket and comparable history; persistent pending intake, body bounds, rate limits and protected review reads.
- Both Cloudflare Pages Functions bundle successfully with esbuild for browser/Worker execution.
- Local Astro renders `/outages` and `/local-costs` with HTTP 200. DOM checks exercise incident rendering, geo dial, filters, offline retention, the 36-row basket, category filters, Pacific timestamp conversion and pending-only submission using mocked fetch. No production writes.
- Agent-surface audit passes and `git diff --check` is clean.
- Full `NODE_USE_ENV_PROXY=1 npm run build:bare` passed: 2,876 pages built. Sparse-checkout omissions were restored as existing assets; the cloud proxy was used for build-time upstream requests. Existing missing-image/chunk warnings remain outside these features.
- Browser visual/mobile acceptance is not claimed. Brief: `docs/briefs/2026-10-05-manus-local-signal-costs.md`.

## Publication

Worktree branch `codex/local-outage-20261005`, based on main `87ae8af`. Draft PR only. No main merge, Pages/Worker deploy, DNS change, schedule or external agent dispatch. Main merge needs Mike approval under AGENTS.md; production follows docs/OPERATIONS.md and scripts/deploy.sh.
