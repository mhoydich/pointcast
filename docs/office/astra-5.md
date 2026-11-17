# PR state adapter

`readPrStates({prs, fetcher=fetch, now=Date.now(), maxAgeMs=120000})`
returns the office v1 envelope. This isolated module has no UI or sibling imports.
Only positive integer PR numbers for public mhoydich/pointcast are accepted.

Provenance: two anonymous GET reads of GitHub's authoritative pull endpoint,
with matching head SHA, bounded HTTP Date freshness (at most two minutes),
5-second request deadlines, no redirects, no retries, at most 20 PRs and
256 KiB per response. Errors expose only fixed codes. Successful observation
is not proof of deployment, approval or agent activity. Consumers must expire
the envelope using observedAt; no polling runs here.

Merge evidence requires both snapshots to agree on merged:true, closed state,
non-draft status, valid past merged_at and full merge_commit_sha. Missing or
contradictory fields and changing heads yield unknown. For an open non-draft PR,
only two head-matched snapshots with mergeable:false and mergeable_state:dirty
produce blocked:true conflict evidence. Draft, awaiting review, unknown, and
missing checks never light a red lamp. blocked:null means no proven blocker;
it is not a claim that merging is permitted.

Limitation: required-check failures are intentionally not inferred from ordinary
check failures or GitHub's generic blocked state. Public branch rules may be
unavailable; this adapter currently proves explicit conflicts only. Snapshot
reads cannot lock GitHub against subsequent changes. The HTTP Date bounds
response age, not the last PR edit time; old merged PRs remain valid facts.

Validation: `node --test tests/office/astra-5.test.mjs` (11 tests). All synthetic
PR123 records in tests are fixtures, not live data. No full site build or
production wiring. READY FOR TERRA REVIEW, never a review verdict.

Contract: https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_505c2g1l6b
