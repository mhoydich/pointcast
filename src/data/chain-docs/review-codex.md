# Independent review of pointcast-chain: Codex (gpt-6-astra), 2026-10-03

> **How this run ended.** Codex ran unattended on branch `codex/astra-audit`, based on main `1b6e819`. OpenAI's content filter stopped both sessions ("flagged for possible cybersecurity risk"): the first after about 6 minutes with no output, the second after about 10 minutes. The second session had already written ignored regression tests for seven findings. Claude committed them unchanged (`b17457c`), ran each with `--ignored`, and wrote this report from the tests and Codex's own notes in the session log. Every finding below has a test that **fails on `1b6e819`**. Coverage is partial: the review stopped before Codex wrote its "checked and found sound" section.

## Codex's notes (from the log, verbatim)

- "Two areas need regression checks: `/drum/digest` holds the node lock while hashing an unrestricted player list, and the kernel's chunk limit appears smaller than some blocks the core accepts. I'm testing both and checking whether background anchoring records the operation hash before sending."
- "The explorer has a separate trust-boundary issue: several unverified feed fields enter HTML without escaping, so a hostile `?api=` endpoint can inject markup before verification."
- "The existing Rust suites and committed-WASM JavaScript tests passed. The new ignored tests reproduce the failures identified so far. A 106 KB unsigned drum-digest request took about 5.5 seconds while holding the node mutex; separately, native Rust and raw WASM accepted a mandate that the browser wrapper rejected after rounding its `u64` expiry."

## Findings (severity assigned by Claude, most severe first)

| ID | Severity | Where | Repro test (fails today) |
|---|---|---|---|
| AS-01 | high | `crates/explorer/static/index.html`, `txCard` | `crates/explorer/tests/astra_review_escaping.rs::untrusted_feed_fields_cannot_create_html_elements` |
| AS-02 | high | node `/drum/digest` handler | `crates/node/tests/astra_review_robustness.rs::digest_bounds_player_count_before_rehashing_the_claim`, `::digest_refuses_oversized_room_before_hashing_each_player` |
| AS-05 | medium | `crates/explorer/static/verifier/verify.js`, the JSON wrapper | `crates/chain-wasm/tests/astra_review_integers.rs::browser_roundtrip_preserves_valid_u64_mandate_expiry` |
| AS-04 | medium | `crates/node/src/anchor.rs`, `run_job` | `crates/node/tests/astra_review_robustness.rs::background_job_journals_before_the_post_can_send` |
| AS-07 | medium | node mempool `submit` | `crates/node/tests/astra_review_robustness.rs::mempool_rejects_oversized_signed_transactions_before_retaining_them` |
| AS-03 | medium | `crates/kernel/src/inbox.rs` transport ceiling | `crates/kernel/tests/astra_review_transport.rs::every_default_valid_block_fits_the_inbox_transport` |
| AS-06 | low | chain-core tap limit with `taps_per_window = 0` | `crates/chain-core/tests/astra_review_limits.rs::zero_tap_limit_rejects_first_touch_and_new_windows` |

### AS-01: explorer renders unverified feed fields as HTML
- **Scenario.** `txCard` interpolates tx `kind` and `nonce` into markup without `esc()`. A hostile `?api=` endpoint, or a lying node, serves `kind: '<img src=x onerror=…>'`, and script runs on the explorer's origin before VERIFY has checked anything.
- **Impact.** Script execution on the page that hosts the wallet panel. A deceptive Beacon signing request becomes possible even though the payload is rebuilt locally.
- **Fix.** Escape every field, or build those nodes with `textContent`. Add a test that walks every renderer with hostile strings.

### AS-02: `/drum/digest` does unbounded work under the node lock
- **Scenario.** An unsigned request with 1,025 players and a 64 KiB room took about 5.5 s while holding the node mutex. Block production stalls for the duration, and requests can be repeated.
- **Impact.** Anyone who can reach the API can stall the sequencer.
- **Fix.** Validate sizes before taking the lock or hashing anything: player count against `drum_max_players`, room length against the slug rule, and request body size. Return 4xx.

### AS-05: the browser verifier rounds u64 values above 2^53
- **Scenario.** A mandate with `expires_at = u64::MAX` is valid natively and in raw wasm. The JS wrapper's `JSON.parse`/`JSON.stringify` round-trip turns it into `1.8446744073709552e+19`, so the verifier errors on an honest block.
- **Impact.** Verify Desk fails on an honest chain. That undercuts its "no false alarms" promise, and an attacker can provoke it with one tx.
- **Fix.** Keep integers exact across the JS boundary: pass raw JSON strings through (`callRaw`), or use a lossless parser for u64 fields.

### AS-04: the anchor job sends before journaling
- **Scenario.** `run_job` records the operation hash only after `post` returns. A crash between inject and record loses the hash, and the anchor stays eligible for a repost.
- **Impact.** A possible double post and double fee. It also breaks the "never post twice" rule in DESIGN.
- **Fix.** Forge, then compute the op hash, then journal `injecting` with the hash, then send, then update. Restart must poll a journaled hash instead of re-posting.

### AS-07: the mempool keeps oversized invalid transactions
- **Scenario.** A signed tap with a 1.9 MB room fits the 2 MB HTTP limit, gets a future nonce, and sits in a pool that only bounds count (`MAX_MEMPOOL`).
- **Impact.** Memory pressure on the sequencer, bounded only by count times body size.
- **Fix.** Run stateless validation (field lengths, slug rules, encoded size) at `submit`, before anything is retained.

### AS-03: valid blocks can exceed the kernel's inbox transport
- **Scenario.** 500 publish txs with maximum-length fields build and apply natively, but the wire block is larger than `MAX_CHUNK_DATA × MAX_CHUNKS`, so `frames_for_block` returns `None`.
- **Impact.** Rollup liveness: some valid blocks can't be delivered to the kernel. The kernel is not live yet.
- **Fix.** Make the transport ceiling cover the largest valid block under the params. The alternative is a block byte bound in consensus, which needs care. Test both bounds against each other.

### AS-06: `taps_per_window = 0` still allows taps
- **Scenario.** Params with `taps_per_window = 0` pass `validate()`, but a first touch or a window rollover still accepts a tap.
- **Impact.** The documented meaning ("zero means no taps") doesn't hold. No default chain is affected.
- **Fix.** Either reject 0 in `Params::validate`, or treat 0 as "no taps" in `apply_tx`. The first leaves every existing root unchanged.

## Status
All seven are fixed on `fix/astra-review`, which merges `fix/astra-node` (AS-02, AS-04, AS-07) and `fix/astra-core` (AS-01, AS-03, AS-05, AS-06). Every repro test above runs un-ignored and passes. The legacy_root golden and the FINDINGS sim roots are unchanged.

### Adversarial verification (Claude, 2026-10-03)
Each fix was attacked after the merge. These follow-ups were found and fixed on `fix/astra-review`, each with a test:

- **Quadratic base58 decoding (AS-02/AS-07 class).** `Address::kind`, `PublicKey::from_tezos_b58` and `decode_signature` ran bs58 on strings of any length. bs58 decoding is O(n²): 32 KB took 1.1 s, and the 2 MB a `POST /tx` or `/mcp` body can hold would take over an hour. That time went to a tokio worker for `/tx`, and to the node lock for an MCP `signed_tx`. The same applied to a hostile node's raw blocks in the browser verifier. Valid values are at most 37/56/100 characters, so length guards of 64/128/192 now refuse longer strings before decoding. No input that decodes successfully is affected. The verifier wasm was rebuilt and re-pinned. Tests: `chain-core/tests/b58_input_bounds.rs` and `crypto::tests::b58_length_guards_sit_above_every_valid_value`.
- **MCP held the node lock while parsing (AS-02 class).** `/mcp` deserialized `signed_tx` and parsed the custodial `drum_session` player list after taking the node lock. It now parses both before the lock, as `/drum/digest` does. Test: `node/tests/astra_review_followups.rs::mcp_parses_a_signed_tx_before_taking_the_node_lock`.
- **Body size limit bypass (AS-07 class).** `POST /body` caps bodies at 64 KiB, but MCP `post_block` and `signed_tx` + `body` stored any size, persistently. The `signed_tx` path stored the body even before parsing the tx. `Node::store_body` now enforces the cap on every path. Test: `::every_path_that_stores_a_body_is_capped`.
- **Admission was stricter than `apply_tx` (AS-07).** `check_tx` required `is_well_formed`, which accepts compressed secp256k1 keys only. `PublicKey::verify` and `apply_tx` also accept uncompressed 65-byte keys, for the tx key and for co-signer keys. Admission now accepts both forms. Tests: `admission::tests::uncompressed_secp256k1_keys_are_admitted_as_apply_tx_admits_them`; the largest-tx size test now uses 65-byte keys.
- **AS-04 crash points and power loss.** A new end-to-end test, `anchor::tests::a_crash_at_any_point_of_a_post_never_leads_to_a_second_send`, runs the real signing pipeline and store and crashes at each of seven points: preapply, before and after the journal write, before and after the send, and before and after the `injected` write. It then restarts and checks that the operation is sent at most once and that any sent hash is on disk. The node runs SQLite with WAL and `synchronous=NORMAL`, which survives a process crash but can lose the last commit on power loss. The `injecting` journal write now runs with `synchronous=FULL`.
- **Wallet integers (AS-05).** The verifier boundary was exact, but the wallet form signed `Number(amount)`: typing 9007199254740993 signed 9007199254740992. A nonce above 2^53 read with `r.json()` was rounded the same way. Both are now refused, never rounded. Test: `explorer/tests/wallet_input.mjs`.
