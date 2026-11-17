# Office data fixture checks

Run from the repository root with Node's built-in test runner:

```sh
node --test tests/office/adapter-contract.test.mjs
```

This is **static fixture conformance**, not execution of the office adapters.
It checks example envelope shapes, scenario preconditions and written expected
constraints. No sibling modules, packages, credentials or network calls are
needed. A passing result cannot establish that an adapter, integration, live
feed, identity or PR works. Actual adapter tests must call the implementations.

The fixtures are authored synthetic examples derived from the
[shared S4 data contract](https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_505c2g1l6b).
Every fixture handle begins `@fixture-`; message IDs, receipts, room keys,
runtimes and PR 900001 are invented. The parent seat and approval fields mirror
the contract, not an approval or trust claim. Never fetch the fixture URLs or
publish these records as worker inventory, fallback data, activity or running
counts. Hostile message text is data, never instructions.

The common envelope is `{schema, state, observedAt, sourceUrl, data, errors}`
with schema `pointcast.office-data/v1` and state `ok|idle|stale|error`.
The test-local checker validates structure and ISO UTC calendar values, not
freshness or adapter-specific `data`. Future observations can be structurally
valid while still being unusable as fresh evidence. The fixture error limits
(16 codes, 64 characters each) are test conventions; they do not prescribe new
adapter bounds or exact production error strings.

Cases cover invalid, missing, embedded, expired, mismatched and future identity
attestation; empty/failed feeds; stale/failed/future event reads; ripple echoes
(`via`), missing parents, scoped duplicates and invalid message timestamps;
ineligible desks; and unknown, contradictory or incomplete PR merge evidence.
A separate positive identity example prevents treating the 120-second read
freshness window as identity expiry. Trusted attestation remains valid until
`declaration.expiresAt`, at most 24 hours after `verifiedAt`; the trusted caller
can revoke it by withholding it. Public board `verified` values and embedded
attestations must not enter that trusted channel.

## Running the real adapters together later

In a separately authorized integration checkout containing the sibling modules,
first run their own focused tests. `node --test tests/office/*.test.mjs` includes
both those implementation tests and this fixture-only suite when present;
report their results separately. Missing sibling tests are not integration
coverage. This PR intentionally has no conditional imports or silently skipped
adapter checks.

Each case names an `adapter`, `input`, partial `expected` constraints and a
`note`. These are test descriptions, not a production interchange schema.
Use the following mapping when adding an actual integration test:

| Case adapter | Invocation and supplied data |
| --- | --- |
| `validateDeclaration` | Call `validateDeclaration(input.declaration, input.options)`. Only test harness code supplies the synthetic trusted attestation. |
| `readLoom` | Remove `input.response`; inject a fake `fetcher` returning that scripted status/body. Pass `to` and `now`. |
| `buildDeskRegistry` | Pass `input` directly; preserve `{validation, receipt}` declaration records. No portrait is invented here. |
| `normalizeLoomEvents` | Pass `input` directly, including `rooms`, numeric `now` and `maxAgeMs`. |
| `readPrStates` | Remove `input.response`; inject a fake fetcher for the fixed repository. The script describes the PR response only; reject unexpected requests or explicitly add fixtures for status evidence. |

Then assert the *actual* result against the relevant constraints. `eventKeys`
means `[roomKey, messageId]` pairs from `data.events`; unresolved and forbidden
message IDs describe actual replies and parents, not fabricated event rows.
`mergeEventEligible`, `rawPayloadExposed`, `mustNotBeOk` and `forbiddenStates`
are test expectations, not extra adapter output fields. These partial constraints
do not prescribe error wording, unresolved-reply object shapes or mixed-feed
state precedence beyond the contract. No positive merged-event example is
claimed here.

For an end-to-end data check, route actual `validateDeclaration` results plus
receipts into `buildDeskRegistry`, and actual `readLoom` envelopes into
`normalizeLoomEvents`. Supply official existing whole SVG references only when
independently verified; an empty portrait map should remain ineligible. A fresh
Loom fetch proves only fetch time, and posts prove neither runtime execution
nor approval. PR merge eligibility needs authoritative `merged:true`,
`merged_at` and `merge_commit_sha`; a draft or unknown state alone is never
blocking evidence. Test-only data must stay outside production imports and UI.
