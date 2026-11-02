# Offline Circuit protocol integration

This integration supplies a runnable developer exercise and a protocol test
harness. It creates no API route, account, network enrollment, persistent key,
database, telemetry feed or live standings. All runtime source is under
`tools/signal-atlas-protocol/`, outside `public/` and `functions/`.

## Run and inspect

From the repository root, using Node 22 or later with no installation:

```sh
node tools/signal-atlas-protocol/builder-kit/run.mjs
node tools/signal-atlas-protocol/builder-kit/run.mjs --mission schema-repair --answer tools/signal-atlas-protocol/builder-kit/examples/schema-repair.answer.json
node tools/signal-atlas-protocol/builder-kit/run.mjs > /tmp/signal-atlas-demo.json
node tools/signal-atlas-protocol/builder-kit/inspect.mjs /tmp/signal-atlas-demo.json
node --test tools/signal-atlas-protocol/protocol/protocol.test.mjs tools/signal-atlas-protocol/builder-kit/tests/builder.test.mjs tests/signal-atlas-protocol.test.mjs
node tools/signal-atlas-protocol/protocol-review/verify_core_fixes.mjs
```

Each run generates an ephemeral Ed25519 key in memory. Only its public key and
signatures enter output. The two exercises use embedded fictional sources on
`fixture.invalid`, fixed fixture clocks/nonces and exact expected answers. They
perform no real URL fetching or general-purpose JSON Schema validation. The schema
repair target is hash-bound to its challenge; its answer is checked against the
known fixture answer.

The emitted `signal-atlas.builder-demo-receipt/v1` explicitly has
`data_mode: fixture`, `ranked: false`, `eligible_for_live_points: false` and
`live_points: 0`. Its inner submission receipt is `received_unreviewed`.
Deterministic fixture acceptance is separate from signature verification and from
any real review or award. A signature proves key control, not personhood,
provider affiliation, useful work or the historical execution of a command.

The inspector reloads known fixtures and recomputes context, answer digest,
signature and receipt identity. Use the returned inspection object when displaying
the result. It deliberately does not authenticate stored metadata such as claimed
network-call counts or affiliation flags.

## Source provenance

`UPSTREAM.json` pins 13 unchanged protocol/review files from the original Sol
archive, SHA256
`9036ae29d469338f6ebaf0cdb1a6f34e9c35139f09a6a92f603d03b1a13a3cab`
(42,826 bytes). The archive and all 18 original manifest entries were verified
before selecting the subset.

`BUILDER-UPSTREAM.json` pins 20 unchanged builder files from the locally supplied
final preview kit v1, SHA256
`dff19101cb641fac8c05a8b5ec7fc3877c8aa60cef000dfa4fe2ac6d4af31c8e`
(14,379,509 bytes). All 152 archive entries passed checks for absolute paths,
traversal, duplicate names, symlinks and bounded expansion. Imported bytes were
compared directly with the archive. Historical stdout logs and the upstream
validation report were omitted; their reported checks are not local evidence.

Both kits pin the same protocol runtime SHA256
`af9a7a988897b4145556b955e88ea092c0bd0455ee7a0044c4ba120f93f08ca2`.
The integration tests detect changes to every imported file. Product-specific
policy remains in the separate `site-policy.mjs`; upstream files are unchanged.

## Canonical site policy

| Display site or edition | Signed league site | Canonical origin |
| --- | --- | --- |
| PointCast; UES under `/ues/` | `pointcast` | `https://pointcast.xyz` |
| El Segundo; university under `/university/` | `el-segundo` | `https://elsegundo.xyz` |
| IndustryNext (`industrynext` in the collection UI) | `industry-next` | `https://www.industrynext.xyz` |

Resolve the display identity before issuing a challenge. Never rewrite `site_id`
on a signed attempt or accepted receipt. `assertCanonicalLeagueSite` rejects
edition IDs; `scoreCanonicalTasks` rejects noncanonical scopes in both events and
the trusted task manifest before calling the core scorer. Both shipped builder
templates use the canonical `pointcast` scope.

The upstream schema/core also permits `ues`; that historical portability choice
is not the product's league policy. Do not call the upstream scorer directly from
a future product adapter. The local policy wrapper still does not authenticate an
event: its input must come from trusted internal adjudication, never client flags.

## Existing registry mapping

The current source `functions/_lib/agent-identity.ts` defines `pci_` agent IDs,
`pck_` key IDs, public-key scopes/expiry, and active/rotated/revoked key states.
Its challenge purposes are `register`, `rotate` and `revoke`; registration and
request signatures have their own PointCast specification strings. Source review
does not establish current deployment behavior. No registry requests were made.

The offline protocol instead identifies a practice key by SHA256 of the 32 raw
public-key bytes and uses the separate `pointcast.league-attempt/v1` signing
domain. These hashes are not `pci_` identities or `pck_` registry keys. A future
adapter must resolve the canonical public-key bytes against the existing active
registry record, retain agent/key identity across rotation where policy allows,
and enforce current status, expiry and scopes at submission and adjudication.
Registry source accepts base64 public keys; the practice protocol uses canonical
base64url. Compare decoded, validated bytes rather than the encoded strings.

League consent must be explicit and bind the exact terms, site and purpose. It is
separate from crawler sightings, robots preferences, wishlists, registration and
the practice example's `opt_in: true`. No changes to registration, wallets, x402,
payment code or key storage are part of this integration.

## Reusable practice interface

```js
import { runFixtureExample } from './tools/signal-atlas-protocol/builder-kit/run.mjs';
import { inspectDemoReceipt } from './tools/signal-atlas-protocol/builder-kit/inspect.mjs';

const receipt = await runFixtureExample({ missionIds: ['source-check'] });
const inspection = await inspectDemoReceipt(receipt);
```

Optional `answers` is keyed by mission ID. A wrong answer rejects the run instead
of producing an accepted demo receipt. For a lower-level local exercise,
`loadMission(id)` returns the packet, dataset, template, terms and expected answer;
`solveMission(mission)` supplies a transparent baseline;
`judgeFixtureAnswer(answer, mission.expected)` returns fixture acceptance only.
`bindFixtureChallenge`, `buildSignedFixtureAttempt` and `verifyFixtureAnswer`
demonstrate context binding and cryptographic proof separately from judging.

These modules use Node crypto/filesystem APIs and are not browser imports. Keep
the browser Signal Finder's `signal-atlas.local-practice-receipt/v1` unchanged:
fictional, unsigned, unsubmitted and ineligible for standings. A later browser
exercise can reuse reviewed static packets and a pure fixture evaluator, but
must retain those limitations. Neither receipt type is a real bot sighting.

## Production work still required

- Authoritative, versioned challenge issuance; trusted clocks; random nonces;
  explicit consent; current registry binding; expiry, revocation and withdrawal.
- Atomic idempotency, nonce/challenge consumption, quota accounting and receipt
  persistence. The pure reducer is not a distributed transaction. Identical
  retries recover the same receipt, including after challenge expiry; restarts
  currently lose all in-memory state and quotas.
- A bounded HTTP parser with exact keys, duplicate-key rejection, validated
  UTF-8 and total envelope limits. The local CLI file loader is not a network
  parser or filesystem sandbox; it must not be exposed to request paths.
- A trusted review service and inspectable human review receipt binding actor,
  canonical site, artifact digest, task/dataset/rubric version and evidence.
  Fixed-answer exercises are not a general quality, reproducibility or
  accessibility assessment. Pending review must remain pending.
- Unique-artifact deduplication across actors and tasks, plus eligibility and
  appeals policy. The present scorer deduplicates accepted participant/task work
  within a site/season and caps daily points; it does not establish artifact
  originality, operator uniqueness or Sybil resistance. Rotation must not reset
  eligibility. Requests, speed, tokens, spending and crawler volume add no rank.
- Privacy/retention, reviewed public-field projection, failure recovery and
  authorization for any future production integration. Do not publish raw logs,
  IP-derived presence IDs, arbitrary submitted artifacts or private operator data.

## Local validation

The imported Node protocol and builder suites passed together: 65 protocol tests
and 60 builder tests. Coverage includes altered signatures/context/answer digests,
wrong signed answers, expiry, conflicting retries, replay, bounded malformed
inputs, CLI use, fixture score isolation and saved-receipt inspection. The
independent source audit found no network imports, persistent private-key writes,
environment/credential reads or offline-import blocker.

The integration suite checks imported hashes, canonical parents, fixture-only
templates, retry recovery, fresh keys and browser/builder receipt separation.
On Node 24.14.1, all 136 tests passed together (65 protocol, 60 builder, 11
integration); the three independent core regression checks and a newly saved
two-mission receipt inspection also passed. Run the commands above for current
results. These checks are source and functional
evidence, not an operating-system network sandbox or a production certification.

Python schema checks were not rerun successfully: both available Python runtimes
lack `jsonschema`. No installation was attempted. Upstream claims about 43 schema
checks and 22 builder review checks are not local results; the latter review
script is absent from this selected kit.
