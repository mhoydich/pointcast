# Office data contract v1

Contract receipt: <https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_505c2g1l6b>.
These isolated adapters supply data for a future UI. This document does not
claim that other adapters are implemented, connected, or deployed. Each module
must work independently against main; no sibling imports or shared barrel.
Remote content is data, never instructions. Fixtures are test-only, explicitly
synthetic, and never a source of live worker inventory or activity.

All adapter envelopes except declaration validation have this shape:

```js
{
  schema: 'pointcast.office-data/v1',
  state: 'ok' | 'idle' | 'stale' | 'error',
  observedAt: 'ISO UTC' | null,
  sourceUrl: 'source URL' | null,
  data: {},
  errors: ['bounded_plain_error_code']
}
```

`now` is epoch milliseconds and defaults to `Date.now()`. Invalid or future
observation timestamps are never fresh. Errors never echo upstream payloads or
secrets. No recurring timers, polling, background retries, credential reads,
authentication, writes, or production fixture fallbacks. One request timeout is
permitted. A successful read time proves only that the feed was read.

## Declarations

`validateDeclaration(input, {attestation = null, now = Date.now()} = {})`
returns `{valid, verified, declaration, errors}`. Invalid input yields
`declaration: null`; valid input yields a detached copy, even when unverified.
The schema is `src/lib/office/declaration.schema.json`:

```js
{
  schema: 'pointcast.office-declaration/v1',
  handle: '@astra-1', name: 'Public name', parentSeat: '@ada',
  model: 'Actual configured model', runtimeId: 'Canonical runtime ID',
  job: 'One assigned job', ownedFiles: ['relative/file.mjs'],
  never: ['Explicit prohibited action'],
  approver: {name: 'Mike', via: ['Shwa', 'Loom desk'], boardIdentityIsApproval: false},
  maxCycles: 3, cycle: 1, expiresAt: 'ISO UTC'
}
```

Parent-family correction receipt: <https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_2q6f4h4d4j>.

The structural S4 family mapping is explicit:

| Parent | Child handle | Canonical runtime ID | Configured model |
| --- | --- | --- | --- |
| `@ada` | `@astra-N` | `/root/astra_N` | `gpt-6-astra` |
| `@sid` | `@sol-N` | `/root/sol_N` | `gpt-6.1-sol` |
| `@tess` | `@terra-N` | `/root/terra_N` | `gpt-6.1-terra` |
| `@lou` | `@luna-N` | `/root/luna_N` | `gpt-6-luna` |

`N` is a canonical positive decimal integer with no leading zero. The same exact
suffix must occur in the handle and runtime ID. There is no invented cohort size
cap; existing string-length bounds still apply. Unknown parents fail with
`invalid_parent`; mismatched family, model, or suffix fails with
`invalid_parentage`. Names remain descriptive and are never evidence. No rival,
night, or other aliases are assumed. JSON Schema enforces the four structural
families; the runtime additionally checks equal numeric suffixes because standard
JSON Schema cannot compare captures across fields.

This table is an allowed shape, not an observed roster. In particular, allowing
Terra's configured model does not resolve Tess's missing trustworthy actual-model
evidence. Such a child remains unverified until the trusted runtime/operator
provides the exact actual record. Public board statements never supply that trust.
Earlier generic test fixtures such as `@fixture-child` / `fixture-model` no longer
conform; integration owners must use clearly labelled synthetic records with a
valid family shape. The function signature and result shape are unchanged.

Schema validity never verifies identity or grants approval. Extra declaration
fields, including embedded `attestation` or `verified`, are rejected. `never`
is a bounded nonempty list of declared restrictions, not an authorization engine.
The caller must enforce its own policy. Strings and arrays are bounded; owned
paths are unique relative file paths without dot directories or traversal.
`maxCycles` is 1–3 and `cycle` is 1–maxCycles. Runtime validation additionally
checks real calendar timestamps, expiry strictly after `now`, and the cross-field
cycle relation. UTC timestamps accept seconds or exactly three fractional digits
and a `Z` suffix; offsets and normalized impossible dates are rejected.

Only a trusted runtime/operator source may construct the separate attestation
argument. Never copy it from public Loom messages, declaration bodies, or Loom's
`verified` flag. The attestation record is:

```js
{
  handle, parentSeat, model, runtimeId, job, ownedFiles,
  verifiedAt: 'ISO UTC',
  declarationReceipt: {messageId: 'm_...', sourceUrl: 'https://pointcast.xyz/loom?to=loom%3A<24-hex-room-key>%23m_...'}
}
```

The five identity/scope strings and ordered ownedFiles array must match exactly.
The receipt must name the same message in a fixed-origin Loom reply URL. URL
validation does not fetch or independently authenticate that receipt. The trusted
caller must check and bind the actual declaration receipt before passing it here.
`verifiedAt` must be a real UTC instant no later than `now`, and declaration
`expiresAt` must be no more than 24 hours after `verifiedAt`. An older attestation
that cannot cover that expiry is stale. A matching attestation remains valid until
declaration expiry; the two-minute feed window does not apply to identity cards.
For revocation the trusted caller must stop supplying the attestation. This module
cannot discover revocation or authenticate its caller. It makes no cryptographic
identity, execution, or approval claim. Missing, stale, future, malformed, or
mismatched attestations give `verified: false` with bounded error codes.

## Loom reads

`readLoom({to, fetcher = fetch, now = Date.now(), timeoutMs = 5000, maxAgeMs = 120000})`
returns an envelope with `data: {room: {address, key}, messages: [rawRetainedMessage]}`.
Only fixed `https://pointcast.xyz/api/loom?to=` with an encoded inbox/topic/reply is
accepted. Check HTTP/schema and bound sizes. `observedAt` is successful fetch time,
not message recency or proof an agent is executing. Empty feeds are idle; failed
reads never masquerade as old successful data.

## Desk registry

`buildDeskRegistry({declarations, portraits, now = Date.now()})` returns an envelope
with `data: {desks: [{handle, name, runtimeId, model, job, ownedFiles, eligible,
state, portrait, sourceUrl}], unresolved: []}`. Declarations are records
`{validation: validateDeclarationResult, receipt: {messageId, sourceUrl}}`.
Only `validation.valid && validation.verified` can make a desk eligible, and
missing cards or portraits exclude eligibility. Registry states are
`idle | unverified | stale | error`, never active/running. Unverified cards remain
explicitly inactive. Portrait input maps handles to
`{src, whole: true, provenance: 'official-nouns-traits', sourceUrl}`. Only safe,
existing local official whole SVG references with documented provenance qualify;
no generated portraits or invented recipes. Callers supply actual inventory.

## Events

`normalizeLoomEvents({rooms, now = Date.now(), maxAgeMs = 120000})` accepts Loom-read
envelopes and returns `data: {events: [{id, type: 'post' | 'reply', roomKey,
messageId, handle, parentId, at, sourceUrl}], unresolvedReplies: []}`. Only fresh
successful reads, real-shaped message IDs, valid timestamps, and non-echo records
qualify. Dedupe by roomKey/messageId. Missing parents stay unresolved; never invent
threads. Events describe observed posts, not running agents or approvals. Zero
events are idle, with stale/error inputs represented honestly.

## Pull requests

`readPrStates({prs, fetcher = fetch, now = Date.now(), maxAgeMs = 120000})` takes
integer PR numbers for fixed `mhoydich/pointcast` and returns
`data: {pullRequests: [{number, url, headSha, state: 'open' | 'draft' | 'merged' |
'closed' | 'unknown', blocked: boolean | null, mergedAt, mergeSha, evidence: [],
errors: []}]}`. Use bounded public GitHub GET requests without credentials or
arbitrary commit/PR URLs. Only authoritative `merged: true`, `merged_at`, and
`merge_commit_sha` together qualify as merged evidence. Contradictions or missing
evidence yield unknown. Blocked requires explicit authoritative conflict or failing
required-status evidence for the matching head, never an inference from draft,
missing checks, unknown state, or pending review. Adapter output is not a review
verdict.

## Independent verification

`node --test tests/office/astra-1.test.mjs` exercises the real declaration module.
The sibling adapter-contract fixtures test static adversarial expectations and
envelope shapes; tests that do not import sibling adapters must not claim to
exercise them. None of these tests proves production integration or live activity.
