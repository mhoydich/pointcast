# IndustryNext cloud-transition inventory

Read-only source inventory at 2026-11-01 17:16 UTC, updated with the parent's authorized public GET at 17:18:38 UTC and an independent source-file hash comparison. Repository source is pinned to `f1a1ff26c2afc4cff3bb8153386ef4432afc39bf` on `mhoydich/nouns5.4` main. No remote writes, uploads, PRs, dispatches, deployments, secret reads, configuration changes or paid operations were performed. The only local change is this report. Broad autonomy is not release authorization; PointCast remains held separately.

## What is established

IndustryNext already has a cloud-executed GitHub Pages **editorial mirror**. Its latest main run succeeded, including the deploy step. This is separate from the declared canonical Cloudflare Pages application. A green mirror run does not prove the current canonical domain, Functions or Worker revision.

| Surface | Source mapping | Verification level |
| --- | --- | --- |
| Full IndustryNext app | `www.industrynext.xyz`; Cloudflare Pages project `industrynext-nouns`; output `public/` | Current canonical homepage returned HTTP 200 with a Cloudflare server header and bytes matching pinned public/index.html; provider settings and whole-site revision remain unverified |
| Project alias | `industrynext-nouns.pages.dev` | Declared in README; current serving state unverified |
| Apex | `industrynext.xyz` should redirect to `https://www.industrynext.xyz/` | Intended configuration in README, not a current DNS or redirect observation |
| Static editorial mirror | `https://mhoydich.github.io/nouns5.4/` | README identifies it; current GitHub workflow deploy succeeded |
| Jam coordinator | Worker `industrynext-jam-room-coordinator`, separate Durable Object class `JamRoomCoordinator` | Declared separately; current deployed version unverified |

Sources: [README](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/README.md), [Pages config](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/wrangler.jsonc), [CNAME](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/public/CNAME), [Worker config](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/workers/jam-room-coordinator/wrangler.jsonc).

There is no Netlify configuration or alternate site-deployment workflow in the complete, non-truncated source-tree inventory. PointCast URLs in this repository are cross-site distribution, ad-network, identity/contact or educational references; they do not make PointCast the IndustryNext deployment target. The static mirror deliberately removes CNAME, preserving the distinction between its GitHub origin and the Cloudflare custom domain.

## Current triggers, runners and permissions

The source tree contains one workflow: [deploy-pages.yml](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/.github/workflows/deploy-pages.yml).

- Triggers: push to main and manual workflow dispatch. No pull-request, schedule or workflow-run trigger is declared.
- Runner: `ubuntu-latest`. Environment: `github-pages`, with the URL taken from the deployment step.
- Workflow token permissions: `contents: read`, `pages: write`, `id-token: write`.
- Concurrency group: `pages`; an in-progress run is cancelled by a newer run.
- Actions use major-version tags: checkout v5, configure-pages v5, upload-pages-artifact v4, deploy-pages v4.
- It copies checked-in `public/` into `_site/`, replaces its index with `github-pages-index.html`, removes CNAME, creates .nojekyll, uploads an artifact and deploys GitHub Pages.
- It does **not** install dependencies, run the application build, execute tests, run the Communications Lab generator, compile Pages Functions or deploy the separate Worker.

A main merge therefore has an automatic public-mirror side effect. The actual Cloudflare dashboard Git integration is unknown: absence of a Cloudflare Actions workflow does not prove that main pushes cannot also trigger a provider-side build.

The [main branch API](https://api.github.com/repos/mhoydich/nouns5.4/branches/main) returned `protected: false`; repository metadata reported connector push/admin capability. These are observed capabilities, not authorization for any mutation. Environment protection settings, organizational policies and provider release controls were not inventoried.

## Recent execution evidence

| Observation | Result |
| --- | --- |
| [Latest run 41158709709](https://github.com/mhoydich/nouns5.4/actions/runs/41158709709) | Main push at 2026-10-31 02:09:44 UTC; head is the pinned source SHA; completed successfully |
| Deploy job 124411180150 | Checkout, configure-pages, preparation, artifact upload and GitHub Pages deploy steps all succeeded |
| Ten most recent repository workflow runs | All belong to this mirror workflow; all report success, spanning September 22–October 31 |
| [Latest run artifact listing](https://api.github.com/repos/mhoydich/nouns5.4/actions/runs/41158709709/artifacts) | Empty at inspection; no retained downloadable artifact was available to hash independently |
| Combined commit status wrapper | Returned no status entries; this is not evidence that every possible check or provider integration is absent |
| Direct job-detail read | Connector rejected the endpoint as unsupported; actual runner-machine metadata was not available beyond the workflow declaration |

Job steps came from the dedicated GitHub workflow-jobs tool. No logs containing credentials were retrieved. No Cloudflare deployment ID, provider build receipt, production artifact checksum, rollback receipt or current production source SHA was obtained.

Initial public reads to the canonical www domain, apex, pages.dev alias and GitHub mirror were unavailable through the web tool; these were probe failures, not evidence of outages. The parent subsequently performed an authorized direct public GET to `https://www.industrynext.xyz/` at **2026-11-01 17:18:38.637233 UTC**: HTTP 200, unchanged final URL, `text/html; charset=utf-8`, `Server: cloudflare`, **21,341 bytes**. Its SHA-256 was `d64c8f4aab0936ce3371b8264c88fc6d7784013968e652398bb664b855371fe7`.

I independently fetched [public/index.html at the pinned main commit](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/public/index.html) through GitHub as base64 and hashed the decoded bytes: **21,341 bytes, identical SHA-256**. Git blob SHA: `489c262956aeb2c9bd633dbd48bf28105c9d8b20`. This establishes a current exact homepage-file match. It does not identify the whole deployed commit, prove other assets/Functions/Worker versions, or establish account/project ownership from the server header alone. Supporting local probe evidence: `/tmp/signal-atlas-public-probes-network.json`. Apex redirect, DNS records, project alias, mirror served bytes and provider deployment receipts remain unverified.

## Build and Mac dependencies

[package.json](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/package.json) declares Node >=20, esbuild and Wrangler. The main build is [scripts/build-client.mjs](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/scripts/build-client.mjs): local bundling of seven browser entrypoints, replacement of generated chunks, then an HTML pass that inserts the PointCast ad-network footer/script. It excludes `communications-lab/` and `ai-thesis-atlas/` explicitly.

The build code inspected uses repository-relative paths; no Mac path, Keychain, launchd, local shell profile or local-only runner is required by that code. The mirror runs on Ubuntu without the Mac. Canonical delivery remains a separately declared CLI or dashboard path:

- `cf:deploy` builds and calls Wrangler Pages deployment for `industrynext-nouns`.
- `cf:rooms:deploy` deploys the coordinator using its own config.
- README also describes Git-connected Cloudflare settings: main, build command `npm run build`, output `public`. Those are documented settings, not verified account configuration.
- The CLI script does not itself pin an approved source SHA, require a clean checkout, serialize releases, retain an artifact manifest or perform canonical-byte verification.
- No current source-defined cloud CI job runs the build or focused tests before the mirror publishes checked-in files.

The October 25 [Pantone task log](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/docs/pantone-2026-10-25/task-log.md) records historical local build/browser checks. It also records a baseline mismatch in `verify:open-ad-network`: it expects injection on a Communications Lab page intentionally excluded by the build. That historical finding is not a freshly reproduced failure, but should be reconciled before making this check a new cloud gate.

## Credentials and runtime bindings: names only

The sole workflow contains no `secrets.*` references. It uses the workflow token and OIDC permissions above. No repository/environment secret-list APIs or secret values were read. It is therefore incorrect to conclude that the account has no secrets.

Current source declares:

- Pages KV binding name `INDUSTRY_NEXT_MADE`.
- Worker Durable Object binding name `JAM_ROOM_COORDINATOR`, class `JamRoomCoordinator`, migration tag v1.
- Optional runtime setting `JAM_ROOM_COORDINATOR_URL`, with an HTTPS default coordinator in source.

The public KV namespace identifier is committed in config but is deliberately not duplicated here. No Cloudflare credential name, configured account credential, effective token scope, account/project access restriction or environment approval policy was verified.

[README](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/README.md) favors the coordinator’s HTTPS route and warns about service-binding behavior, while [CLAUDE.md](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/CLAUDE.md) contains older binding-oriented deploy advice. [The actual adapter](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/functions/_lib/jam-room-service.js) accepts either a binding or the HTTPS fallback. Resolve against current provider configuration before a cloud migration; do not silently change this integration.

## Feeds, social handoffs and participation evidence

The repository has useful public discovery artifacts, but they are not a distribution scheduler:

- [robots.txt](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/public/robots.txt) points at the canonical sitemap. The complete tree contains no named RSS or Atom feed file.
- Static JSON twins include agents, services, editorial features, Open Build and [Communications Lab briefs](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/public/communications-lab/briefs.json). The [lab generator](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/scripts/communications-lab/build.mjs) writes HTML and JSON locally; it is not invoked by the mirror workflow or the general build.
- [The renderer](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/scripts/communications-lab/render.mjs) produces canonical metadata, a JSON alternate and social-card metadata. These support previews; they do not publish to X.
- [Open Build launch copy](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/docs/tag-open-build-launch-copy.md) and [Market launch plan](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/MARKET-LAUNCH-001.md) are authored copy and human-operated handoffs. A calendar in a document is not an executing schedule.
- The [field map](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/docs/industry-next-field-map.md) assigns distribution to PointCast and creation to IndustryNext. It does not authorize cross-site publishing or show delivery receipts.
- The [mint feed route](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/functions/api/mint-feed.js) exposes application mint records; its [store](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/functions/_lib/mint-feed-store.js) is process-local state. This is not an editorial syndication feed, verified bot participation or social posting evidence.
- [Agents JSON](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/public/agents.json) and [whereeveryone metadata](https://github.com/mhoydich/nouns5.4/blob/f1a1ff26c2afc4cff3bb8153386ef4432afc39bf/public/.well-known/whereeveryone.json) describe email-related capabilities. These are source claims with their own dates, not a newly verified authenticated publisher or evidence of X posts.

No authenticated X publishing implementation, X credential reference, post ID, canonical post URL, successful posting receipt or current recurring publishing workflow was found in the inspected deployment/launch surfaces. Targeted code searches for `api.twitter.com`, `CLOUDFLARE_API_TOKEN`, `secrets` and `rollback` returned no matches; search absence is bounded evidence, not a guarantee about every external service.

For Signal Atlas, preserve separate states for draft copy, an approved exact post/account, an attempted authenticated publish, a confirmed platform receipt, and an independently fetched public post. Private intake receipts and email status must not be counted as participant enrollments, accepted contributions or social conversions.

## Proposed independent cloud artifacts and release gates

These are proposals only; nothing is activated.

1. **IndustryNext application artifact:** build the exact approved nouns5.4 commit in a clean cloud job using the lockfile; run relevant source tests and browser QA; package static output and Functions with a file-hash manifest, build/runtime version and source SHA. Keep the Signal Atlas edition at `/communications-lab/signal-atlas/`, with its disconnected adapter and strict headers.
2. **Separate mirror artifact:** explicitly retain its alternate homepage, removed CNAME, no Functions and repository-subpath behavior. Validate all links/assets at `/nouns5.4/`; an app artifact must not be assumed interchangeable with this mirror.
3. **Separate coordinator artifact:** record the Worker source SHA, config hash and migration/binding requirements. Only redeploy when its own change and authorization require it; static Atlas work does not require changing it.
4. **Separate distribution handoff:** generate human-reviewable copy/media/link manifests with no authenticated posting side effects. Record explicit account/release authority and delivery receipts only when an approved publisher actually runs.

Before any canonical release, obtain current read-only provider evidence: the existing project’s repository link, branch/build settings, latest production deployment ID/SHA, environment/binding configuration, permitted deploy identity and previous known-good deployment. Establish the exact release authority separately for the app, mirror, Worker and social accounts.

After an authorized deployment, independently verify the immutable deployment URL and the canonical www domain against artifact hashes/markers; verify apex redirect, expected Function behavior, Atlas CSP/noindex/no-store headers, no ad injection, missing telemetry remaining unknown, and no unexpected writes. A successful upload or merge alone is insufficient.

## Rollback status

No rollback script, serialized release lock, ancestry gate, canonical live marker or rollback runbook was found in the inspected repository. Provider rollback capability and previous good deployment IDs were not verified.

A cloud transition should retain the last known-good application/mirror artifacts and exact source identities independently, define who can approve rollback, and verify canonical output after rollback. Treat Worker migrations and stored state separately; rolling back static files does not undo a Durable Object migration or KV writes. Do not invent a rollback target or run a provider rollback without fresh deployment evidence and authorization.

## Remaining limits

- Canonical Cloudflare account/project state, Git integration, credential scopes, latest deploy receipt, DNS and whole-site revision: **unverified**. Only the canonical homepage bytes are currently matched to the pinned source file.
- GitHub job-detail endpoint: **unsupported by the connector**, not an approval denial.
- Four initial public-web reads: **tool unavailable**; no outage conclusion. A subsequent direct canonical-homepage GET succeeded as recorded above.
- No secret API or value access, no raw private intake reads, no release action and no social post occurred.
