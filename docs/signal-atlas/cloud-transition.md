# Independent site releases and bot participation

Local proposal and read-only evidence, 2026-11-01. This does not activate a workflow, provision an environment, grant access, upload source, publish a post, or deploy a site. Exact source publication destinations remain pending under the existing hold.

## Current routes

| Product surface | Repository | Existing cloud behavior | Current evidence / gap |
| --- | --- | --- | --- |
| PointCast and `/ues/` | `mhoydich/pointcast` | Hosted Ubuntu build; conditional Cloudflare upload | Main `a9e89d3` build succeeded but upload was skipped. Local deploy marker records that SHA; current site responds 200, but no public source-revision stamp was found. |
| El Segundo and `/university/` | `mhoydich/hello-token-reserve` | Eligible ready PR auto-merge and Netlify publish verification | `publish.json` independently returned main `e8d7ba5` at 17:18:38 UTC. Asset verification produced a false failure on a live PR; checks and rollback behavior need correction. |
| IndustryNext | `mhoydich/nouns5.4` | GitHub Pages mirror stages checked-in public files and deploys; canonical Cloudflare route separately declared | Canonical homepage bytes match pinned main `f1a1ff2`; this is one-file proof. Cloudflare project settings and full deployed revision remain unknown. |

Detailed pinned sources, workflow/run URLs, declared credential names, probe limits, feeds and social handoffs: [PointCast](cloud-pointcast.md), [El Segundo](cloud-el-segundo.md), [IndustryNext](cloud-industrynext.md).

## Release boundaries

There are three parent site release lanes, with university editions nested under their respective parent. A shared Atlas package and shared tests can be versioned once; each site still produces its own artifact, reviews its adapter, and verifies its own canonical origin. A failure in one lane must not require another site or a named bot to be online. No cross-site transaction is needed for the initial disconnected editions.

Each lane records separate states: source prepared, checks passed, artifact retained, exact release approved, upload accepted, canonical revision verified, distribution draft prepared, external post accepted, and public post verified. Unknown results remain unknown. A provider acceptance response is not a live page; a local receipt is not an accepted useful-work result; a green build is not a deployment.

The deploy authority belongs to the site's controlled release lane, not to every participating model. Future bots get a public, provider-neutral task contract and an isolated place to propose evidence. Enrollment is opt-in, and a key signature proves key control only. Ordinary crawlers stay in sightings. The [proposed onboarding contract](agent-onboarding-contract.md) and inert examples cover leases, duplicate work, review scopes, explicit channel permissions, revocation and recovery without enabling any new endpoint.

## Portable handoff

The first reviewed Atlas is preserved in `/tmp/signal-atlas-source-handoff-20261101.tar.gz`, SHA-256 `32fa86eedb353254ef1df4523803ebc8c068b73e7aa2f748bf9e393c81b20f34`, 1,751,571 bytes. It contains 89 selected source files, the patch against `a9e89d3`, a manifest, and selected QA evidence. It has not been uploaded. Later inventory/onboarding/verifier work is a separate supplement; it is not silently included in that frozen digest.

The next supported transfer must name the destination repository/artifact store, source revision or patch base, archive and per-file digests, extraction limits, runtime and lockfile, reproduction commands, test results, and exclusions. A receiving worker verifies bytes before running code, preserves the existing source, and does not execute lifecycle scripts merely because an archive contains them. Never bundle local credentials or dependency caches. Artifact retention and who can retrieve it must be explicit before the Mac is no longer the only copy.

Hosted build capacity already exists, so a new paid service or credentials should not be the default. The missing work is a reproducible source handoff, verified existing permissions, durable artifact storage, and consistent release checks. The earlier source-upload denial remains in effect; an alternate storage destination is not a workaround.

## Proposed sequence after review and authorization

1. Preserve the source handoff and inventory supplement. Keep all Atlas PRs draft/on hold because El Segundo can auto-ship a ready `codex/*` branch.
2. Fix and independently test typed asset verification locally. Reconcile `publish-gate` versus desk/overlap checks, failure recording, and rollback behavior before relying on the El Segundo auto-ship path. Keep separate issues visible instead of claiming one asset fix makes the entire release system safe.
3. Build each exact source revision in existing hosted CI with no deploy secret exposed to submitted bot code. Retain the output manifest and tests as versioned artifacts. PointCast needs equivalent completeness checks across its local and hosted paths; IndustryNext needs real application tests/build in addition to its static mirror copy.
4. Establish each canonical provider's existing project, binding configuration, release identity and previous known-good deployment. Resolve competing deploy writers and serialize promotion per site. Preview/check cancellation may be useful; cancellation during promotion requires recovery and an uncertain-outcome check.
5. Promote only the approved artifact under separately established authority. Record the provider deployment ID, artifact identity and time. Verify typed routes, expected headers and current canonical bytes or an artifact-bound stamp. If the outcome is ambiguous, inspect it before any retry.
6. Release feeds with their site, then use a distinct approved distribution handoff for each social/email destination. Require exact account and content scope plus provider receipt; no authenticated X publisher was established by this inventory. Do not equate prepared copy, a newsletter signup, or an upstream accepted research run with delivery or participation.
7. For rollback, name the known-good artifact and data compatibility requirements in advance. Preserve the failed release evidence. Static rollback cannot reverse stored data or Worker migrations. Require the applicable site authority; no automatic rollback is introduced by this proposal.

## Participation and measurement

The first usable experience remains a no-signup fictional guide, clearly separate from observed encounters. Invite builders to run the offline kit, inspect their receipt, and submit a useful contribution only when an enrolled path exists. Draft launch copy is ready; outreach/public posting remains held.

Measure verified progression rather than raw traffic: a public launch receipt, an opt-in enrollment, a reproducible submitted task, an independently reviewed accepted result, and a return contribution. Keep rates unknown until denominators and collection consent exist. Do not introduce tracking merely to fill a dashboard. Client analytics misses many bots, UA labels are unverified, and raw requests are not league points.

Duet and Grok received scoped requests through the existing desk; there is no acknowledgement yet. Their help can improve the transition, but neither should become a required runtime dependency. Current work and future handoffs should remain understandable to any authorized agent through the versioned contract and evidence.

Independent document review found no blocking issue; its two wording corrections distinguish staging from an application build and the observed X status from a credential diagnosis.
