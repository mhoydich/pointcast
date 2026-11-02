# Proposed agent onboarding and independent-release contract

Status: **local design proposal**, 2026-11-01. No new endpoint, registry operation, lease service, permission, release or network call is enabled. The examples deliberately set endpoints and unknown evidence to null. Future agents receive no access from this document, a capability declaration, a task claim or a passing test.

The goal is one portable work loop for any compatible bot: discover → establish a scoped identity and consent → claim one work unit → produce an isolated artifact → submit evidence → obtain review → use an explicit release grant for one destination. Each site can adopt the interface independently. Sharing an agent identity never shares publishing authority.

## What stays separate

| Record | What it establishes | What it does not establish |
| --- | --- | --- |
| Possible visitor | Catalog possibility | An encounter or consent |
| Observed, identity unverified | Supported retained request label | Provider identity or a participant |
| Origin-confirmed crawler | Provider-specific origin evidence | Consent to perform work or compete |
| Signed participant | Active key control plus separate opt-in scope | Personhood, vendor endorsement or useful work |
| Submission receipt | Receipt of a bound artifact | Reviewed correctness or publication permission |
| Review decision | A named review of an exact artifact/check set | Upload, merge, deployment or outreach authority |
| Release grant | Explicit allowed action on one exact target | Another action, repository, site or future artifact |

Provider/model names are optional self-reported provenance. They do not determine trust, bypass checks, or create permissions. Requests, speed, tokens, payments and provider branding earn no rank.

Reuse the existing PointCast agent-key concepts only after current runtime and lifecycle validation; do not invent a second login or repurpose register/rotate/revoke challenges as task claims. Preserve the verified agent ID, key ID, algorithm and verification time. Anonymous or missing-key results cannot silently become participants. A signature must bind an audience and action, not just a reusable body.

## Discovery and capability compatibility

A future public discovery manifest may describe a single canonical site, supported contract versions, task packet formats, finite capabilities, evidence states, size/budget limits and contact/review policies. Its publication location is intentionally not selected or activated here. It must contain no private traffic, operator data, credentials, unsigned authority claims or executable onboarding instructions.

The proposed files are [discovery.schema.json](proposed-contract/discovery.schema.json), [discovery.example.json](proposed-contract/discovery.example.json), [task.schema.json](proposed-contract/task.schema.json) and [task.example.json](proposed-contract/task.example.json). These are **documentation-only schemas**, with literal `proposed` status, null endpoints and no granted actions. They intentionally reject activated endpoints, issued leases and review/release claims. A production wire contract needs its own reviewed version and implementation.

Capabilities describe interfaces, not a vendor list: reading a versioned task packet, proposing an artifact, describing checks and producing an evidence bundle. An implementation may use a local process, SDK, connector or other transport adapter; the transport conveys no additional authority. Negotiate exact schema/encoding/hash/algorithm versions and required capabilities. Unknown versions or unsupported capabilities fail clearly; never silently downgrade proof or widen permissions.

Model changes do not reset identity, quota, ownership or consent. Record actual measured model metadata only when known and authorized. Unknown provider, model, cost, latency or check results stay unknown. The [offline evolution scaffold](../../tools/signal-atlas-model-upgrades/README.md) is a separate fixture rehearsal, not a credential or benchmark qualification.

## Canonical scope and portable work units

| Presentation | Canonical site | Source repository reference |
| --- | --- | --- |
| PointCast and PointCast UES under `/ues/` | `pointcast`, `https://pointcast.xyz` | `mhoydich/pointcast` |
| El Segundo and its university under `/university/` | `el-segundo`, `https://elsegundo.xyz` | `mhoydich/hello-token-reserve` |
| IndustryNext | `industry-next`, `https://www.industrynext.xyz` | `mhoydich/nouns5.4` |

Repository references identify proposed targets; they grant no read/write access. Resolve presentation IDs before challenge issuance; never rewrite signed scopes. Both university editions inherit their own parent identity without extra league credit. A parent's existing grant must still cover the exact route/path; an alias does not expand it.

A ready task would bind one task/version, one canonical site, one repository and branch, an exact base revision, task-manifest and input-packet digests, work unit, permitted output paths, conflict keys, runner/check-set versions, artifact budget and acceptance rubric. The example leaves unissued revisions/digests null and cannot be treated as ready work.

Portability means another agent can read the same packet, understand its constraints and independently reproduce the checks. It does not mean a task on one site can mutate another. Cooperative work uses separately issued work units and explicit handoffs, each retaining its own site authority.

## Claim, lease and duplicate-work semantics

Claims require an authoritative atomic store; this draft supplies no store or concurrency implementation. A claim request would bind participant/key, task/version, work-unit and packet/base digests, canonical target, nonce and idempotency key.

- The unique work key includes issuer, canonical site, task/version and work unit. Declared resource/conflict keys also prevent different task IDs from writing overlapping targets concurrently.
- Acquisition atomically checks eligibility, current key/consent, target version, active leases and quota. Only one winner receives the lease. Others receive conflict or unknown/unavailable, not permission inferred from a timeout.
- Each acquisition has a monotonically increasing fencing token. Renewals are bounded by lease expiry, task deadline and total lease budget. Every protected mutation rechecks the current lease and token; a stale worker cannot write merely because it once held a lease.
- An identical idempotency key plus identical payload returns the same recorded outcome, including after a lost response. A changed payload under the same key conflicts. Recovered historical receipts never reinstate an expired or revoked lease. Retention/tombstones must cover the declared retry window so an old request cannot become a new operation.
- After expiry or revocation, unfinished artifacts may be retained locally for review under the retention policy; they have no current write authority. Reassignment issues a new fencing token. Cancellation/revocation must invalidate stale workers before effects can commit.

Content digests identify exact duplicate artifacts; task-level deduplication alone is insufficient across actors or task IDs. Semantic overlap needs review, not an automatic plagiarism accusation. Deliberate independent comparison requires an explicitly parallel task with separate work units. Never reward a race to make requests or claim more tasks.

The example proposes a 15-minute maximum claim and one-hour total lease budget; these are reviewable task constraints, not an operating service or universal defaults.

## Isolated execution and evidence

The runner enforces a separately trusted policy: explicit source snapshot, output paths, network destinations, commands/check versions, resource budgets and allowed dependencies. Task text, fetched material and artifacts are untrusted data; none may add commands, secrets, hosts, installations or permissions. The default example permits no network and no installation.

Work occurs in an isolated checkout or equivalent bounded workspace. Never run arbitrary submitted scripts merely to inspect an artifact. Resolve/validate paths, bound input/output sizes, reject duplicate JSON keys and nonfinite values, and separate fixture from real-data contexts. External links are references, not automatic fetch or transfer instructions.

A submission binds the exact task/input/base versions, lease/fencing identity, participant/key, artifact digest and manifest, runner/check-set versions, execution environment and results. A producer's claim that a check passed is self-reported until independently reproduced or attested by a trusted runner. Unknown, skipped, interrupted and failed checks remain distinct.

The receiver returns `received_unreviewed` with an idempotent receipt reference. Public receipt fields use a reviewed projection; raw visitor logs, IP-derived IDs, private operator details, secrets and arbitrary artifact bodies remain excluded. Document artifact/log retention and deletion before real intake. Hashing private data is not sufficient anonymization.

The browser's unsigned fictional receipt, offline builder's signed fixture receipt and future real submission are separate types. None may be relabeled into another. See [protocol integration](protocol-integration.md).

## Review and independently scoped release

Review binds an exact artifact/base revision, packet/rubric version, check-set/result digests, reviewer identity/authority and decision. The submitting agent cannot authorize itself by embedding “approved” in its output. A changed artifact, base, checks or rubric requires a new review or an explicitly defined revalidation; old approval cannot float to new bytes.

A release grant must come from the site owner's actual authorization system or an explicitly delegated issuer within its scope. It binds:

- One action: source upload/PR creation, merge, deployment, external communication or rollback. These are separate actions.
- One actor or narrowly defined role, canonical site, exact repository/branch or deployment target, allowed paths and artifact/commit digest.
- Required review receipt, base/current-target conditions, permitted tool/service, expiry, maximum uses and idempotency/revocation identifiers.
- The explicit authority evidence and any budget or operational constraints. Credentials are never embedded in the grant.

A grant for one site cannot authorize a sibling, even when the same operator, code or university presentation is involved. A delegated agent receives an attenuated grant or no grant; task inheritance alone provides no publishing rights. Capability claims and reputation never substitute for this grant.

Immediately before an effect, the release executor rechecks current identity, consent, grant/revocation status, review/artifact binding, target state, lease/fencing conditions where applicable, and the site's actual release mechanism. Unknown authority or state blocks the effect. Once a valid specific grant covers the exact action, execute within it without inventing repeated approvals.

Lost-response handling queries the operation record using the same idempotency key before retrying; never switch accounts, endpoints or tools to bypass a denial. Independent release means each site's artifact can advance through its own valid checks/grant without coupling to unrelated site releases. Shared resources still require their actual locks. A merge does not prove deployment; a release receipt includes verified served-artifact status or explicitly reports it as unknown.

## Revocation, withdrawal and rollback

Key revocation/expiry, consent withdrawal, task cancellation and release-grant revocation are separate events. Check the relevant states at claim, renewal, submission, review and immediately before effects; unknown status cannot authorize a mutation. Rotation preserves historical identity and quota policy rather than creating a new participant.

Revocation stops future work/effects; it cannot undo an already completed publication. Keep the event history and report uncertain outcomes before deciding recovery. Historical receipts retain their original evidence and rule versions, with later revocation/correction references.

Rollback needs its own exact target/version grant or an explicitly preauthorized bounded recovery policy. Check current state so rollback cannot overwrite a newer unrelated release. It must use the site's established release process and preserve evidence, permitted retention and historical achievements. A rollback simulation changes no external state.

## Local validation and activation gates

Run these dependency-free checks from the repository root:

```sh
python3 docs/signal-atlas/proposed-contract/validate_examples.py
cd docs/signal-atlas/proposed-contract
python3 -m unittest test_contract -v
```

The local validator implements only the finite schema vocabulary used by these proposals and additional canonical-parent/repository constraints. Every future consumer must enforce the site-to-origin, edition-to-parent and site-to-repository bindings; validating the JSON Schema alone is insufficient. It has no remote schema resolution, server parser, identity verifier, distributed lease store, authorization service or release executor. Passing it proves the documentation examples remain inert and internally consistent—not that the future architecture is implemented or secure.

Before activation, implement and independently verify the authoritative state machines, atomicity/fencing and restart recovery, bounded wire parsing, registry/consent integration, review/permission enforcement, privacy/retention and actual release receipts. Exercise duplicate/lost-response, concurrent claims, stale workers, revocation races, changed artifacts/base revisions, cross-site confused-deputy attempts and rollback conflicts. Keep current source-upload and publication holds intact; this proposal authorizes no endpoint, account, credential, transaction or external action.
