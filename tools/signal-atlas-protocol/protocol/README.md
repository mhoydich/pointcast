# Offline House Circuit protocol core

This is a **portable local-only implementation**, not a backend deployment. No network calls, account access, credential creation, telemetry import, raw IP handling or persistent signing keys.

## Run

Node 22+; no npm install required:

```sh
node --check protocol.mjs
node --test protocol.test.mjs
```

`npm run check` and `npm test` are aliases. Tests generate fake Ed25519 key pairs in process memory only. They do not write keys. Hypothetical `live` reducer test inputs are synthetic unit-test values, not real visitor data; never export test cases as a public feed.

## Files and contracts

- `protocol.mjs`: explicit site IDs; honest unknown states; evidence meaning; constrained canonical signing bytes; Ed25519 key-possession + signed opt-in verification; immutable mode/site-isolated replay/idempotency/quota decisions; manifest-allowlisted useful-task scoring.
- `protocol.test.mjs`: negative and positive unit tests.
- `challenge.schema.json`, `attempt.schema.json`: strict structural wire schemas. JSON schema alone does **not** verify signatures, expiry windows or server context.
- `public-feed.schema.json`: privacy-bounded public feed, two trust axes, fixture/live isolation, unknown metrics.
- `unconnected.public.json`: safe default; all metrics null, no encounters, no standings.
- `build_schemas.py`: deterministic schema authoring helper (Python standard library only).
- `validate_schemas.py`: additional schema checks using Python `jsonschema` if already available; not needed for Node core execution. Do not install or activate a service to run this prototype.

Public feed site mappings are proposed from audited source, not production verification. UES is a PointCast edition sharing measurement origin, not an extra unique host.

## Security boundaries

A participant signature establishes key control and the exact scoped opt-in message—not model identity, affiliation, personhood, autonomy, task correctness or Sybil resistance. A network-confirmed crawler is not opted in. A submission receipt is `received_unreviewed` and unranked.

`decideSubmission` is a pure transition proposal. The production adapter must atomically enforce uniqueness/caps/nonce consumption and durable receipt recovery; both challenge IDs and nonce bytes are consumed in separate mode/site namespaces; concurrent calls against the same stale state are not a safe distributed counter. Its UTC quota window is intentionally distinct from El Segundo's existing Los Angeles civic day. The adapter must return a real next-window `Retry-After`; the reducer's `retry_after_day` is only context.

The attempt binds a digest of a separately bounded result. The future adapter must recompute that digest from the actual submitted result; it must never trust a bare hash as proof that useful work was done. This core does not fetch or adjudicate evidence.

`scoreTasks` takes **trusted, internally adjudicated records only**, not arbitrary HTTP JSON. An allowlisted season task manifest is mandatory for nonzero results. Demo/fixture flags are server-controlled. No points for crawls, requests, repeats, token spend, speed or self-reported completion. Empty reducer results do not establish telemetry coverage; a disconnected UI must still show null/unknown, not zero.

Before live use: real repository integration, typed API adapter, schema validation with duplicate-key rejection and streaming body cap, reviewed task judge, existing-auth consent, durable atomic storage and concurrent/lost-response tests, privacy/retention controls, rate/budget ceilings, route/build/browser/a11y QA, and explicit publication/deployment authorization. No current prototype test substitutes for those checks.

## Local review revision (schema IDs/package version unchanged)

Independent review found structural feed and core edge cases; this local revision now:

- Restricts encounter catalog IDs to a finite reviewed crawler-family vocabulary or an explicit, separately labeled fixture vocabulary. Public version labels are also enumerated; arbitrary IP-like visitor identifiers are not accepted. New families require a deliberate catalog/schema review.
- Requires source, window and ingest metadata for partial as well as connected observations. A source label is still a trusted-adapter assertion, not independently proven by schema validation.
- Forbids standings when the Circuit is not connected or paused; an open Circuit requires its own adjudication source, rubric/manifest hash, window and update timestamp. Crawler telemetry can remain disconnected while independently grounded Circuit scores exist.
- Separates fixture/live idempotency, challenge and nonce namespaces; rejects nonce reuse under a different challenge ID.
- Rejects sparse arrays even when a decoration balances the key count, plus symbol-bearing/non-enumerable decorations.
- Returns a deterministic, mode/site/participant/attempt/challenge-derived `receipt_id`, distinct from the client-chosen `submission_id`. Use `receipt_id` for lookup and scoring; it is an identifier, **not an authorization capability**. Two participants choosing the same attempt ID do not collide.

The public-feed schema is a structural guardrail, not a verifier of network attribution, source truth, timestamp ordering, consent or actual adjudication. Those remain production adapter obligations.

Independent post-repair regressions (relative to the handoff root):

```sh
python protocol-review/verify_fixes.py
node protocol-review/verify_core_fixes.mjs
```

See `protocol-review/REVIEW.md` for scope. Historical `repro_*` files in the working folder characterize the original unsafe behavior and are not normal tests; they intentionally fail after repair and are excluded from the portable ZIP.
