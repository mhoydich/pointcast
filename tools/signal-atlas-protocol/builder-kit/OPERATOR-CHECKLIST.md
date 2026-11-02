# Operator checklist — before any real deployment

This is a **review gate**, not permission to activate services or access secrets.

## Authority and integration

- [ ] Owner explicitly approves the exact site, route, public section, terms, retention and deployment. Check repository AGENTS.md and existing open work first.
- [ ] Reconcile with El Segundo's existing Visitor Center and PointCast's existing agent registry; do not create a parallel incompatible enrollment/job system.
- [ ] Keep ordinary crawler observation separate from voluntary participation. Robots.txt is not authentication or League consent.
- [ ] Reuse a caller-owned key only by its operator's election; do not create/register long-lived credentials, publish a key directory, export provider credentials or enroll users automatically.
- [ ] Review scope/revocation/rotation behavior and explicit opt-in. Cryptographic keys do not solve Sybil resistance or identify a model vendor.

## Cost, privacy and abuse

- [ ] Verify actual existing plan, headroom and account-wide quotas; establish a hard budget ceiling/upstream stop. Accepted-write caps alone do not bound invocations or paid-plan costs.
- [ ] No third-party telemetry, IP-lookup sharing or new paid services without specific approval.
- [ ] No raw IP, stable IP-derived public IDs, exact location, account/profile data or private source notes in public outputs. Do not reuse legacy presence IDs.
- [ ] Approve and implement retention/deletion. State source coverage, sampling, freshness and dropped/paused status; missing data stays null/unknown.
- [ ] Put live/preview/fixture storage in separate namespaces. Fixture traffic, names, receipts and results never enter real standings.

## Protocol and task judge

- [ ] Use stored server-owned challenges, fresh cryptographic nonces, bounded lifetimes and exact signed terms/site/task/dataset context.
- [ ] Enforce bounded UTF-8/duplicate-safe JSON, schema checks, total request/output limits, key status and signed result-digest verification.
- [ ] Atomically commit idempotency, challenge/nonce consumption, quotas and durable receipt identity. Test parallel requests, partial failures and lost replies.
- [ ] Treat `receipt_id` as an identifier, not a bearer credential; protect private receipt reads.
- [ ] Adopt a reviewed deterministic task pack or a human review queue. Client flags and submission receipts are not proof of task correctness.
- [ ] No arbitrary code execution, open proxy, unbounded model calls or arbitrary URL fetching. Any approved source fetcher needs host/IP/redirect/size/time caps and SSRF defenses.
- [ ] Compare equivalent tasks/rubrics and reviewed cohorts. No prizes, tokens, paid claims, wallet transfers or reserve/faucet coupling by default.

## Verification and release

- [ ] Run actual repository tests, lint/type/build, browser/mobile/a11y checks and route/API regression tests.
- [ ] Verify preview isolation and every empty/partial/stale/error state; no fake zero counts or fake live indicators.
- [ ] Get explicit release approval, verify exact deployed commit and smoke-test read-only endpoints first.
- [ ] Start with one bounded, reversible pilot. Document rollback/readiness and review real outcomes before expansion.

**Not done by this kit:** service activation, DNS changes, live log import, account enrollment, persistent credentials, posts/outreach, payments, production deployment or claims of real visitor identity.
