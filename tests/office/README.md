# Office data fixture checks

Run from the repository root with Node's built-in test runner:

```sh
node --test tests/office/adapter-contract.test.mjs
```

By default this runs **35 static fixture conformance checks** and explicitly
skips **24 actual adapter execution tests**. Static checks validate envelope
shapes, scenario preconditions and written constraints. They do not establish
that an adapter, integration, live feed, identity or PR works. No sibling
modules or dependencies are needed for the default run.

To execute the same scenarios against separately assembled implementations:

```sh
OFFICE_ADAPTER_ROOT=/absolute/path/to/src/lib/office \
  node --test tests/office/adapter-contract.test.mjs
```

The configured directory must contain `declarations.mjs`, `loom-read.mjs`,
`desk-registry.mjs`, `events.mjs` and `pr-state.mjs`. Missing modules or exports
fail the run. Each invocation checks actual outputs against the fixture's
partial constraints. Fetch responses are mocked, request URLs are checked,
and global fetch is disabled before loading adapters. No fixture URL is fetched.
Report the 35 static checks and 24 implementation cases separately, alongside
the exact module revisions used. An unset root means skipped execution cases,
never a claim that those cases passed.

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

## Integration coverage and input mapping

Use a separately authorized integration checkout containing the sibling modules
and run their own focused tests too. `node --test tests/office/*.test.mjs`
includes those files when present; absent sibling tests provide no coverage.
The optional mode here executes each adapter independently on scripted inputs;
it does not yet connect their outputs into an end-to-end pipeline.

Each case names an `adapter`, `input`, partial `expected` constraints and a
`note`. These are test descriptions, not a production interchange schema.
The optional execution mode uses this mapping:

| Case adapter | Invocation and supplied data |
| --- | --- |
| `validateDeclaration` | Call `validateDeclaration(input.declaration, input.options)`. Only test harness code supplies the synthetic trusted attestation. |
| `readLoom` | Remove `input.response`; inject a fake `fetcher` returning that scripted status/body. Pass `to` and `now`. |
| `buildDeskRegistry` | Pass `input` directly; preserve `{validation, receipt}` declaration records. No portrait is invented here. |
| `normalizeLoomEvents` | Pass `input` directly, including `rooms`, numeric `now` and `maxAgeMs`. |
| `readPrStates` | Remove `input.response`; inject a fake fetcher for the fixed repository. The script describes the PR response only; reject unexpected requests or explicitly add fixtures for status evidence. |

The execution cases assert the *actual* result against the relevant constraints. `eventKeys`
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
