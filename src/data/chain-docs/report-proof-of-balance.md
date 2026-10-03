# Proof of Balance — Codex report, 2026-10-03

Implemented and locally committed the Phase 1 proof crate, node integration, snapshots,
CLI, tests and documentation. Final validation: **213 passed, 0 failed, 3 pre-existing
ignored; Clippy zero warnings; formatting clean.** No chain-core or kernel changes.

Two requirements could not be fulfilled literally: the requested universal rejection
of changed leaf counts/indices is mathematically incompatible with the specified proof
format, and the sandbox forbids binding the localhost demo port. Both are documented
below, with executable counterexamples and a successful socket-free demo. **This is not
a claim that every requirement in the brief was satisfied.** Phase 2 was not started.

## Built

- `chain-proof`, `#![no_std]` + alloc, with only chain-core and serde runtime dependencies.
  Merkle levels/paths mirror leaf/node domain separation and odd promotion. Path verification
  derives directions from index/count and rejects missing or extra siblings and invalid indices.
- Account proofs include the whole canonical account, index/count/path, drops and attestor
  roots, optional mandates extension root and supply. State-root reconstruction matches v2
  without mandates and v3 with mandates, tested against actual signed transaction histories.
- Neighbour absence proofs enforce common leaf counts, strict address order and adjacency;
  one-sided proofs enforce the corresponding edge. Builders reject present targets and
  malformed account-map keys. Both-empty witnesses fail closed (see decisions).
- `BalanceClaim` verifies chain IDs, anchor cadence/height, anchor/v2 signature bound to
  `Params::hash()`, then the state proof. `HeaderClaim` verifies seal/v2 and the signed
  header height/root. Results carry address, balance, existence, height, root and genesis.
- `/proof/account/{addr}` provides a tip proof envelope. `/proof/claim/{addr}?height=H`
  provides a retained sealed-anchor claim. Historical proofs are checked before serving;
  corrupt signatures are rejected. `tezos_op` is filled only from `o…` references.
- MCP `prove_balance {address,height?}` and `pointcast-node prove <addr> [--height H]
  [--db PATH]`; `verify-claim <claim.json> --params <params.json> [--genesis HEX]` operates
  completely offline and returns 0 only after verification, 1 on error.
- `state_snapshots(height PRIMARY KEY,state_json)` is added with CREATE TABLE IF NOT EXISTS.
  Each sealed anchor and its matching post-state are saved in one transaction, retaining
  the latest 48 snapshots plus snapshots whose anchors already have an `o…` operation.
  Missing historical snapshots return HTTP 404 `replay required`.
- Crate README, root README Proofs section before Anchoring, and DESIGN Known gaps sentence.
  Added `examples/proof_demo.rs` as a reproducible fallback for environments without sockets.

## Validation

Commands were run in `/Users/michaelhoydich/pcc-proof`, using the local Rust cache only:

```text
cargo fmt --all
cargo fmt --all -- --check                       exit 0, no diff
cargo clippy --workspace --all-targets --offline exit 0, 0 warnings
cargo test --workspace --offline                exit 0
213 passed; 0 failed; 3 ignored
```

There are **15 new tests**: 10 in chain-proof and 5 node proof integration tests.
The state property test runs 128 generated histories, using real signed transfers,
drop mints, agent registration and mandate grants through block production; every
account proof and random absent target is checked. Attestor and drop commitments
are nonempty in these tests. Other fixtures apply signed taps.

Merkle parity covers every size 0..=300 and every leaf. Adversarial checks cover
balances, siblings, incorrect indices, v2/v3 confusion, supply/component roots,
false absence spanning a real account, wrong sequencer, another genesis with the
same key and chain ID, foreign chain IDs, inconsistent heights and bad header seals.
For each n <= 64, internal hashes are substituted into every sibling slot. Count/index
reinterpretations through 2n are enumerated symbolically by ordered branch shape;
matching expressions are checked with the real hash verifier and cannot hide an
existing account through false adjacency or a false edge. This finite test and the
README argument are not a formal security proof.

Node tests cover two anchor heights, historical vs current balances, absence, tip proofs,
invalid addresses/heights, persisted claims across restart, MCP with/without height,
CLI export/verification/genesis pin/tampering, snapshot pruning with posted-anchor
retention, and rejection of a corrupted seal. The existing MCP discovery test was
updated to expect the newly advertised tool; its first full-suite run failed only
because that expected tool list had not yet been updated. The final full suite passed.

The 3 existing ignored tests are `print_vectors`, `write_fixture`, and
`rebuild_reproduces_committed_sha256`. No new test is ignored. An initial unoptimized
brute-force count/index run was interrupted after it proved unnecessarily slow;
the final exhaustive shape enumeration above completed in the passing full suite.

## Required security deviation: counts are not authenticated

The requested proof format cannot reject every n±1/2n or wrong-depth reinterpretation
while accepting all valid paths. For example, with account leaf hashes A,B,C:

```text
root = node(node(A,B),C)
proof for A: index=0, leaf_count=3, siblings=[B,C]
change leaf_count to 4: the same proof still verifies
```

C is opaque in the proof: the verifier cannot distinguish a promoted leaf from the
root of a hypothetical two-leaf subtree. Leaf/node domain separation prevents forging
an account preimage but does not reveal an opaque sibling's type or subtree size.
There is also a numeric-index/depth alias:

```text
six leaves A,B,C,D,E,F
proof for E: index=4, count=6, siblings=[F,node(node(A,B),node(C,D))]
change to index=2, count=4: the same proof still verifies
```

`counterexample_leaf_count_is_not_authenticated` explicitly asserts these facts.
They preserve the authenticated account and balance; no forged account/balance or
false absence was found by the tests. The README argues absence soundness using
paired ordered paths and their boundary/adjacency properties, rather than falsely
asserting that numeric leaf count or index is authenticated. Neither v2 nor the
mandates v3 formula commits to leaf count. Requiring cardinality authentication needs
additional authenticated shape witnesses or a size-committing tree format; no such
unrequested format or consensus change was introduced.

**Left undone:** universal rejection assertions that these counterexamples disprove.
Phase 1 therefore cannot be called literally complete under the brief's wording.
Phase 2's condition was not met: no shadow SMT, benchmark or /status shadow root was
implemented, and there are no benchmark numbers to report.

## Demo and its sandbox limitation

The exact requested command was attempted with the specified scratch database:

```text
cargo run -p node --offline -- run --dev --demo --db <scratch>/proof-demo.sqlite \
  --addr 127.0.0.1:8575 --block-ms 200
Started demo PID 82691
anchor key source: none (dry-run)
anchor mode: dry-run (no PC_TEZOS_ANCHOR_KEY); payloads go to anchors.jsonl
Error: Operation not permitted (os error 1)
Stopped demo PID 82691 exit 1
```

The failure was the TCP listener bind. No listener survived, and curl could not fetch
a claim from that server. The runner tracked and waited for its PID; its cleanup
would signal that PID if it remained alive. All inherited `PC_*` variables were removed
from this demo environment so no configured credentials, key command or Tezos poster
could be used. There were no external network requests or Tezos operations.

Fallback command, also offline, used the real demo task, actual Node and sqlite,
200ms blocks, and the actual HTTP router via `oneshot`, with no socket or posting job:

```text
cargo run -p node --example proof_demo --offline -- <scratch>/socket-free
Sealed anchor height 100
Sealed anchor height 200
Router GET /proof/claim/tz1WmGEYaVpsmbXQLsE3urW7ewZv4zmQpVn5?height=200: 200 OK
Saved balance 236 at height 200 (genesis d492539575613313aa8e9e62ffcfdb85309ed26cafbe3e20843ddd7ac1d199f3)
Stopped node and demo tasks; no listener was opened.

```

After that process exited, the independent `pointcast-node verify-claim` command read
the saved claim and params and pinned the genesis shown below. Then one balance byte
was changed with XOR 1 and the verifier was invoked again:

```text
Node process has exited. Offline verification:
PROVEN tz1WmGEYaVpsmbXQLsE3urW7ewZv4zmQpVn5 balance 236 ATTN height 200
  exists     true
  state_root 35ee52dcb498cd813cf7ca6f79e2742731b28219557d72398a53129137de5d91
  genesis    d492539575613313aa8e9e62ffcfdb85309ed26cafbe3e20843ddd7ac1d199f3
  scope      inclusion in a sequencer-signed root; no replay or Tezos finality check
  NOTE       public dev sequencer key; demonstrates verification only
exit: 0

Tamper balance low byte with XOR 1:
Error: NOT PROVEN

Caused by:
    state root mismatch
exit: 1
```

This demonstrates portable offline verification and tamper rejection at the second
anchor, including a mandates/v3 state. It is not a successful localhost/curl demo.

## Decisions and operational limits

- Claims authenticate a sequencer-signed root, not transition validity, canonical
  history or Tezos finality. `tezos_op` is informational, not authenticated. The CLI
  prints this scope and identifies public dev sequencer keys.
- A valid chain always retains its genesis treasury account. The specified empty
  absence proof has no component-root witness; both neighbours absent is rejected
  instead of allowing an unauthenticated empty-tree claim.
- Omitted height means the latest anchor for the HTTP claim route, and the sealed tip
  header for CLI/MCP. Explicit historical heights must be retained anchor heights.
  Genesis height 0 has no sealed header and is rejected by the signed-claim interfaces.
- Both enum variants are boxed in Rust to avoid a large enum; serde retains the
  `type: present|absent, value: ...` JSON representation. Headers use a separate
  `HeaderClaim`; `PortableClaim` accepts either anchor or header JSON.
- Existing snapshots are not backfilled. A crash after saving a block but before its
  anchor/snapshot transaction can leave an unavailable anchor. Restart replays blocks
  but does not silently recreate/re-sign anchors. Posting an anchor after its snapshot
  was pruned does not restore that snapshot; replay is still required.
- Building proofs is O(n) time/memory. Verification and proof size are O(log n).
  Posted snapshots have intentionally unbounded retention. This is local code, not a
  production deployment or independently observed Tezos balance.

## Commits and cleanup

Implementation commits on `codex/proof-of-balance`, based on `1b6e819`:

- `4d76e21` — portable proofs, node integration, retained snapshots and tests.
- `7a20641` — socket-free demo and updated MCP discovery expectation.

Each commit ends with the required Codex co-author trailer; this report is committed
separately with the same trailer. The working files of chain-core and the separate
kernel workspace are unchanged, verified by diff against the base. Nothing was pushed,
deployed or posted, and no credential search occurred.

The task-created ~2.3 GiB target directory and demo/scratch artifacts are removed after
collecting the outputs above. No server or demo task remains running. The existing
`pcc-proof` worktree is retained as the requested local committed deliverable, not an
extra abandoned checkout. The empty `proof.done` marker is created only after the
report commit and final clean-worktree check; it signals the end of this run with the
explicit deviations above, not that the impossible count test or blocked TCP demo passed.
