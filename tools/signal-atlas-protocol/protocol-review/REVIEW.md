# Independent offline adversarial review — 2026-11-01

Initial snapshot: original Node 60/60 and Python 31/31 pass. No network calls, persistent keys, deployment, or original-file edits by reviewer. Reproduction signing keys are generated only in process memory.

## Reproduced initial findings

1. **Medium — fail-closed public standings contract.** `public-feed.schema.json` permits `data_mode:live`, all sites `not_connected`, league `not_connected`, and a 99-point live row. Add league state/row and site-coverage constraints; do not turn unavailable scores into zero.
2. **Medium — ungrounded partial observations.** A partial site with null source/window/last-ingest passes with a nonzero count and an origin-confirmed encounter. Require provenance/window/time for partial as for connected; separately enforce window chronology/freshness in a runtime adapter.
3. **Privacy boundary gap — catalog is not an allowlist.** `catalog_id:'192.168.1.1'` passes. Strict unknown-field rejection does not prohibit sensitive values in allowed string fields. Use an approved catalog-ID enum/lookup and trusted projection; do not describe shape validation alone as privacy enforcement.
4. **Low — generic canonicalizer sparse/decorated array collision.** `const a=[]; a.length=1; a.decoration=7` passes length-based check and canonicalizes to `[]`. Require contiguous own indices and prohibit decorations/symbol keys. Not reachable through current signed primitive-only attempt fields or parsed valid JSON arrays; no signature-forgery claim.
5. **Isolation integration precondition.** Fixture and live submissions with same site/key/client attempt ID conflict in shared reducer state, although counters include mode. Original design does require preview-isolated stores. Either explicitly require mode-isolated state or namespace all state keys by mode. This is denial/confusion, not fixture points entering live scoring.
6. **Nonce uniqueness integration precondition.** Same nonce under different authoritative challenge IDs is accepted. Existing replay protection is challenge-ID consumption. Require issuer nonce uniqueness/one nonce per ID and document that invariant or enforce nonce consumption directly.
7. **Receipt identity integration precondition.** `submission_id` is the participant-scoped caller attempt ID; scoring deduplicates receipt ID at site scope. Adapter must allocate a separate site-unique receipt ID, not copy submission_id, or two participants choosing attempt-001 collide. Proposed receipt lookup needs that same distinction.

## Reproduce baseline behavior

- `python /workspace/shared/bot-league/protocol-review/repro_schema.py`
- `node /workspace/shared/bot-league/protocol-review/repro_core.mjs`

These are characterization assertions: passing confirms original unsafe/permissive behavior. A repaired version should fail corresponding characterization checks; use independent repaired-invariant tests for final verification.

## Limitations

This review is not security certification. No live service, DB transactionality, concurrent/lost-response behavior, source IP verification, provider/network claims, actual identities, production privacy/retention enforcement, or externally linked documentation was verified. Signatures establish exact opt-in and key control, not affiliation, Sybil resistance or work correctness. In-memory reducer execution is not production atomicity. Trusted judge/manifest/fixture flags and digest recomputation remain adapter obligations. Existing tests substantiate local behaviors only.

## Remediation independently verified at 15:23 UTC

Sol patched originals. Reviewer reran all checks: **65/65 Node tests; 43/43 schema checks**. Independent `verify_fixes.py` rejects the three original schema repros, additionally tests the IP catalog rejection against otherwise valid provenance, and confirms positive partial-source and independently sourced Circuit/disconnected-Atlas controls. Independent `verify_core_fixes.mjs` confirms mode namespace isolation, nonce reuse rejection across challenge IDs and sparse/decorated-array rejection. Code inspection confirms a derived `receipt_id` distinct from caller `submission_id`; original suite additionally verifies different participants receive different receipt IDs.

Findings 1–7 are addressed locally by schema/core changes. Receipt lookup still requires authorization; opaque derived IDs are not bearer capabilities. Architecture/archive refresh is being completed by the owner agent. All production limitations above remain unchanged.
