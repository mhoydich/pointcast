# pointcast-chain

A single-sequencer **broadcast chain** in Rust where every block is a PointCast Block.
Humans sign with Tezos keys (tz1/tz2), agents are first-class accounts with an
owner and a name, and the native currency **ATTN** is only ever issued for
showing up (`tap`) and playing (`drum_session`), under hard caps.

```
crates/
  chain-core/   pure, deterministic state machine — #![no_std], no I/O, no clocks, no randomness
  node/         sequencer (3s blocks) · sqlite · HTTP API · MCP server · Tezos anchor job
  explorer/     one static HTML page: the chain as a PointCast-style feed
```

`chain-core` compiles to `wasm32-unknown-unknown` today; [DESIGN.md](DESIGN.md)
lists what changes to make it a Tezos smart-rollup kernel.

## Quick start

Needs Rust (stable). If you don't have it:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
```

Run the tests (core first: tx types, issuance caps, determinism property test):

```bash
cargo test -p chain-core
```

```bash
cargo test --workspace
```

Start a dev chain with synthetic traffic and open the explorer at http://127.0.0.1:8545/:

```bash
cargo run -p node -- run --dev --demo
```

`--dev` uses **publicly derivable** keys (`blake2b("pointcast-dev/<name>")`): nothing on a dev chain
has value. `--demo` adds two humans, a tz2 human, two agents (Frog, Sparrow) and the MCP agent
(Wire Desk), then generates taps, posts, drum sessions, drop mints and transfers.

## Running for real

All secrets come from the environment; populate it from your secret manager. Nothing secret is
written to disk or logged.

| Variable | Purpose |
|---|---|
| `PC_SEQUENCER_SECRET` | Sequencer ed25519 secret (`ed25519:<hex>`). Required. |
| `PC_TREASURY` | Genesis treasury address (only when creating a new chain). |
| `PC_TREASURY_AMOUNT` | Genesis treasury ATTN, the only premine (default 100,000,000). |
| `PC_CHAIN_ID` | Chain id mixed into every signature (default `pointcast-1`). |
| `PC_MCP_AGENT_SECRET` | Optional custodial agent key so MCP write tools can sign. |
| `PC_TEZOS_ANCHOR_KEY` | Tezos key of the dedicated anchor account (`edsk…`, `spsk…` or `ed25519:<hex>`), **or** `PC_TEZOS_ANCHOR_KEY_CMD`: a command printing it (`op read op://…`, `security find-generic-password -s pc-anchor -w`). Unset = dry-run. |
| `PC_TEZOS_NETWORK` | `mainnet` (default) or `shadownet`. |
| `PC_TEZOS_RPC` | Comma-separated Tezos RPC endpoints, tried in order. Default mainnet: `https://rpc.tzkt.io/mainnet`, `https://mainnet.smartpy.io`. Shadownet: `https://rpc.tzkt.io/shadownet`, `https://shadownet.smartpy.io`, `https://rpc.shadownet.teztnets.com`. |
| `PC_ANCHOR_CONTRACT` | tez-cast tower KT1. Default mainnet `KT1NgPnaHLtZ2cNpb2hWGDxFH9fUCABaiaE1`, shadownet `KT1Di5ZR1fEsUqQfvtEnkcurRH9DrMiBhqgp`. |
| `PC_ANCHOR_POST_EVERY` | Post every Nth anchor to Tezos (default `12` ≈ hourly at 3 s blocks; `1` = every anchor). Others are kept locally as `recorded`. |
| `PC_TZKT_API` | TzKT API used for confirmations and `anchor verify` (default per network). |
| `PC_DRUM_POLICY` | New chains: who earns from drum sessions, `open` · `cosign` (default) · `room_only`. |
| `PC_DRUM_ATTESTORS` | New chains: comma-separated room-server ed25519 keys (`edpk…` or hex). |

```bash
cargo run --release -p node -- keygen
```

```bash
PC_SEQUENCER_SECRET="$(op read op://pointcast/sequencer/secret)" PC_TREASURY=tz1… cargo run --release -p node -- run
```

Flags: `--db PATH` (default `data/chain.sqlite`), `--addr HOST:PORT` (default `127.0.0.1:8545`),
`--block-ms N` (default 3000). On restart the node replays every stored block through
`chain_core::apply_block`, re-verifying signatures and state roots.

## HTTP API

| Method | Path | |
|---|---|---|
| `GET` | `/` | Explorer |
| `GET` | `/status` | Height, tip, state root, supply, counts |
| `POST` | `/tx` | Submit a `SignedTx` (JSON) → `{tx_hash}` |
| `POST` | `/tx/digest` | Unsigned tx → raw digest + the wallet message and Micheline payload to sign |
| `POST` | `/drum/digest` | Drum session claim → attestation digest + co-signer wallet payload |
| `GET` | `/tx/{hash}` | `pending` · `included` (+ receipt) · `rejected` (+ reason) |
| `GET` | `/block/latest`, `/block/{height}` | Block with tx cards |
| `GET` | `/account/{address}` | Balance, nonce, `next_nonce` (counts mempool), agent info, drops |
| `GET` | `/feed?limit=20&before=H&all=false` | Newest blocks first; `all=true` includes empty blocks |
| `POST` | `/body` | Store a block body off-chain → `{body_hash}` |
| `GET` | `/body/{hash}` | Body text |
| `GET` | `/anchors` | Recent anchor payloads and status |
| `POST` | `/mcp` | MCP (JSON-RPC 2.0, streamable HTTP) |

### Signing a transaction

The `sign` subcommand reads the key from `PC_SIGNER_SECRET`, which keeps it out of shell history.
Signatures bind the chain's **genesis hash** as well as its id, so take both from `GET /status`
(`chain_id`, `genesis_hash`):

```bash
PC_SIGNER_SECRET="$(op read op://me/pointcast/key)" cargo run -q -p node -- sign --nonce 0 --chain pointcast-dev --genesis <genesis_hash> '{"type":"tap","room":"lobby"}' > tx.json
```

```bash
curl -s -XPOST localhost:8545/tx -H 'content-type: application/json' -d @tx.json
```

Add `--agent` to sign as the agent address for that key, or `--wallet` to produce exactly what a
Tezos wallet returns (see below). Tx kinds (JSON `type`):

```jsonc
{"type":"publish_block","channel":"FD","title":"…","body_hash":"<32B hex>","media_uri":"ipfs://…"}
{"type":"drum_session","room":"drum-hall","players":["pca1…","tz1…"],   // sorted ascending
 "beat_hash":"<hex>","duration":180,"ended_at_ms":1790000000000,
 "cosigs":[{"player":"tz1…","public_key":{…},"mode":"tezos_message","signature":"<hex>"}],  // optional
 "room_sig":{"attestor":"<ed25519 hex>","signature":"<hex>"}}                             // optional
{"type":"tap","room":"lobby"}
{"type":"drop_mint","drop_id":"kennel-club","recipient":"tz1…"}
{"type":"transfer","to":"tz1…","amount":25}
{"type":"register_agent","public_key":"<ed25519 hex>","name":"Frog"}
{"type":"set_drum_attestors","attestors":["<ed25519 hex>", …]}  // drum attestor admin only
{"type":"set_mandate","agent":"pca1…","terms":{                 // the agent's owner only
  "kinds":1034,                       // bit 1<<tag: publish_block(1) | tap(3) | spend_allowance(10); 0 = paused
  "channels":["FD","GDN"],"rooms":[], // sorted allowlists, ≤ 8 each; [] = any
  "spend_per_period":25,"period_blocks":200,"spend_total":2500,  // from the OWNER's balance
  "payees":["pca1…"],                 // sorted, ≤ 16; [] = any receivable address
  "expires_at":864100}}               // block height, exclusive (fails closed)
{"type":"clear_mandate","agent":"pca1…"}                         // owner only; agent is unscoped again
{"type":"spend_allowance","to":"pca1…","amount":5}               // sent by the agent; debits its owner
```

### Signing with Kukai / Temple (wallet mode)

Tezos wallets won't sign a bare 32-byte digest. They sign a Micheline-packed string through Beacon:
`requestSignPayload({ signingType: "micheline", payload })`. pointcast-chain accepts that as
`"sig_mode": "tezos_message"`. The wallet shows one readable line, and the chain rebuilds that line
from the tx itself, so text sent by a client is never trusted:

```text
Tezos Signed Message: pointcast-chain <chain_id> <kind> sender <tz1…> nonce <n> digest <hex>
```

1. `GET /account/{addr}` → `next_nonce`. Build the tx JSON.
2. `POST /tx/digest` with the tx → `wallet.payload` (hex, starts `0501`).
3. `requestSignPayload({ signingType: "micheline", payload, sourceAddress })`. The public key comes
   from `getActiveAccount().publicKey`.
4. `POST /tx` with `{tx, "sig_mode": "tezos_message", "public_key": "edpk…|sppk…", "signature": "edsig…|spsig1…|sig…"}`.
   Base58 or hex both work. The signature prefix must match the key type.

tz1 (ed25519) and tz2 (secp256k1, including Kukai's Google/social logins) are supported. tz3 and
tz4 are not. The explorer's **Transmit** panel does all of this: connect, then tap, post, or send.
It rebuilds and checks the payload in the browser, and it only signs when the page was served by
the same node it talks to (signing is disabled under `?api=`). Agents keep signing natively
(raw mode).

### Drum sessions: who earns

A sender can list anyone as a player, so listing alone earns nothing. Players earn only when
attested, and the chain's `drum_attest_policy` decides what counts:

| Policy | Earns |
|---|---|
| `open` | Every listed player with an account (v0.1 behaviour; farmable) |
| `cosign` (default) | The sender, players who **co-signed**, and everyone if a **room server** attested |
| `room_only` | Only players in sessions attested by a registered room server |

Attestations build on one session digest. It binds chain id + genesis, sender, **the sender's
tx nonce**, room, players, beat hash, duration and `ended_at_ms`, so attestations are single-use.
Co-signatures and room attestations sign different domain-separated digests, and a co-signature
is bound to the co-signer's own address. A session must
have ended within the last hour (`drum_attest_max_age_ms`). A player is paid at most once for
any stretch of time: a session only credits an account if it started after that account's last
credited session ended.

- **Co-sign:** `POST /drum/digest` with the claim returns `cosign[<player>]`, which holds that
  player's raw `digest` and a wallet payload (purpose `drum_cosign`). Players sign natively
  (`mode` raw) or in Kukai/Temple (`mode` tezos_message). Co-signatures may use the base58
  `edpk`/`edsig` forms a wallet returns, in any order.
- **Room server:** sign `room_digest` with an attestor key (WebCrypto `Ed25519` in a Worker). The
  key must be in the on-chain set, which genesis seeds and the admin replaces with
  `set_drum_attestors`.
- Only players who consented (the sender, co-signers, or everyone under a room attestation)
  have their time consumed. If a block's issuance cap can't pay a session in full, the
  session waits in the mempool for the next block instead of paying 0.
- **CLI:** `PC_SIGNER_SECRET=… pointcast-node attest-drum --as player|room [--mode raw|wallet]
  --chain ID --genesis HEX --sender ADDR --nonce N --room R --players A,B --duration S
  --ended-at-ms MS` prints the attestation JSON.

`--dev` chains seed the public dev attestor `dev_key("drum-attestor")`. The demo shows all three
cases: co-signed, room-attested, and solo sessions.

## MCP

Tools: `post_block`, `drum_session`, `get_feed`, `my_mandate`, `spend_allowance`, `prove_balance`. Write tools take either a client-signed
`signed_tx` (preferred: the agent holds its own key) or plain fields, which the node signs as its
custodial agent (`PC_MCP_AGENT_SECRET`; that agent must first be registered by its owner).
`/mcp` has no caller auth, so the custodial path refuses requests carrying an `Origin` header
(browser pages must send `signed_tx`), and a custodial `spend_allowance` only pays a payee listed
in the agent's mandate (DESIGN.md §4.2).
`drum_session` also accepts `ended_at_ms`, `cosigs` and `room_sig`. Collect them with
`POST /drum/digest`, using the agent's address as `sender`. When attestations are passed, the
exact signed `beat_hash` and `ended_at_ms` are required.

```bash
claude mcp add --transport http pointcast-chain http://127.0.0.1:8545/mcp
```

## Explorer

Served by the node at `/`. It also works opened straight from disk:
`crates/explorer/static/index.html?api=http://127.0.0.1:8545`.

## Town Hall

`pc-town` (`crates/town`) is a read-side sidecar with its own port and its own sqlite index. It
follows a node over the read-only verifier routes (`/params`, `/status`, `/raw/blocks`), replays
every block with the real verifier, indexes only what the verifier accepted, and serves Town Hall:
account, channel, room and block pages. Every number it shows comes from its own replay, not the
node's word. A fault with evidence (the sequencer signed something false) stops indexing for good
and turns the page red with a downloadable `evidence.json`. pc-town holds no keys.

```bash
cargo run -p pointcast-town -- --node http://127.0.0.1:8545 [--genesis HEX] [--db data/town.sqlite] [--addr 127.0.0.1:8550]
```

`scripts/town-demo.sh` starts a `--dev --demo` node and pc-town on throwaway databases and prints
the URL (http://127.0.0.1:8550/).

| Method | Path | |
|---|---|---|
| `GET` | `/`, `/hall` | Town Hall (`#/` square, `#/a/{addr}`, `#/c/{code}`, `#/r/{room}`, `#/b/{h}`) |
| `GET` | `/api/town/health` | `ok`, `halted`, `fault {reason, class, height, is_sequencer_fault, evidence}`; 503 when not ok |
| `GET` | `/api/town/status` | Verified height, state root, supply, counts, recent state roots |
| `GET` | `/api/town/account/{addr}` | Balance, epoch ATTN tank, tap window, agents, mandate, attestations, first page of txs |
| `GET` | `/api/town/account/{addr}/txs?before=H&role=R` | Older txs, with the account's roles in each |
| `GET` | `/api/town/accounts`, `/api/town/blocks?busy=true` | The register; recent blocks |
| `GET` | `/api/town/channels`, `/api/town/channel/{code}?before=H` | Channels; one channel's posts |
| `GET` | `/api/town/rooms`, `/api/town/room/{room}?before=H` | Rooms; sessions, attestation mix, credited-seconds leaderboard this epoch |
| `GET` | `/api/town/block/{h}` | A replayed block with its txs and receipts |
| `GET` | `/api/town/body/{hash}` | The node's body, re-hashed; 502 if it doesn't match `body_hash` |
| `POST` | `/mcp` | Read-only MCP: `town_status`, `town_account`, `channel_feed`, `room_sessions` |

```bash
claude mcp add --transport http pc-town http://127.0.0.1:8550/mcp
```

## Verify it yourself

The explorer shows whatever the node reports, unless you press **✓ VERIFY** (toolbar, next to
"show empty blocks"). Then your browser downloads the consensus code itself
(`crates/chain-core` + `crates/verifier`, compiled to a ~560 KiB `wasm32-unknown-unknown`
module with no wasm-bindgen) and re-executes every block from genesis in a Web Worker:

- Block cards turn **verified by you** (green) only when the hash the node shows equals the block
  your browser replayed, and then the card is rendered from that replay (txs, senders, amounts,
  ATTN issued), not from the node's `/feed`. Post text is off-chain and shown only when it hashes to
  the signed `body_hash`. If the node's own card differed, the card says so. Everything else stays
  **reported by node** (grey).
- The verifier code is pinned: the page carries the sha256 of `pointcast_chain.wasm`, `verify.js`
  and `verify-worker.js` and refuses to run anything else, whichever node `?api=` points at (and
  without WebCrypto it refuses rather than guess). `scripts/pin-verifier.sh` writes the pins.
- The strip reads `Verified locally to #N · root 9f3a… · anchors k/k match · verifier wasm sha256 … pinned`.
  Sealed anchors from `GET /anchors` are checked against your own replay.
- The genesis hash is pinned: `?genesis=<hash>` if you pass one, otherwise trust-on-first-use from
  `/status` (stored in this browser, with a yellow note). A changed genesis raises a loud warning
  and the verifier refuses to run.
- If the sequencer signed something false, a red banner names the height and reason, with a
  **download evidence.json** link. Only faults that carry checked evidence are blamed on the
  sequencer. A node that serves an unsealed or edited block, skips or repeats heights, or serves a
  header that doesn't extend your replay gets a yellow "node problem" note, and the verifier keeps
  retrying (it re-fetches the missing height from `/raw/block/{h}`). Transmit also rebuilds the wallet payload locally and refuses to
  sign if the node's `/tx/digest` differs.

Read-only routes for verifiers:

| Method | Path | |
|---|---|---|
| `GET` | `/params` | Genesis params; `blake2b(params)` is `/status.genesis_hash` |
| `GET` | `/raw/block/{h}` | The exact serde `Block`, every tx signature included (404 if missing) |
| `GET` | `/raw/blocks?from=H&limit=N` | `{tip, from, blocks}` ascending, `N ≤ 500`, stops at the tip |
| `GET` | `/verifier/pointcast_chain.wasm`, `/verifier/verify.js`, `/verifier/verify-worker.js` | The verifier itself |

Evidence is portable: anyone with the chain's params can check it offline, no node needed.

```bash
pointcast-node evidence params --db data/chain.sqlite > params.json   # or: curl $NODE/params
pointcast-node evidence check evidence.json --params params.json      # exit 0 = proven fault, 1 = not evidence
```

It proves three kinds of fault: a sealed block (body included) whose transition fails replay
(`invalid_transition`, mandate rules included), two different sealed headers at one height
(`equivocation`) and two sealed anchors for one height that disagree (`anchor_equivocation`).
Seals and anchor signatures commit to the genesis hash (`seal/v2`, `anchor/v2`) and `check`
verifies them against `params.hash()`, so evidence from one chain is `NOT EVIDENCE` under another
chain's params even when both share the sequencer key (every `--dev` chain does; its key is public,
so dev-chain evidence proves the check works, not that anyone lied). See
`crates/verifier/README.md`. Any subcommand other than `check` or `params` exits non-zero.

To watch it catch a lie, run the demo node that re-seals a tampered state root at #37
(`--equivocate` serves two sealed tips instead), then open
`http://127.0.0.1:8545/?api=http://127.0.0.1:8546` and press VERIFY:

```bash
cargo run -p node --example lying_node      # 127.0.0.1:8546, local only
```

The wasm is committed (`crates/explorer/static/verifier/`) and rebuilt with
`scripts/build-verifier.sh`, which remaps local paths so the bytes are reproducible for a given rustc
(1.99.0 here). `PC_WASM_REBUILD=1 cargo test -p pointcast-chain-wasm --test rebuild -- --ignored`
checks that a rebuild matches the committed `.sha256`; `node --test crates/chain-wasm/js-test`
replays a fixture through the committed wasm.

## Economy simulator

`crates/chain-sim` (`pc-sim`) drives the unmodified `chain-core` state machine, with real
signatures, nonces and every cap, through seeded agent-based town traffic and six sybil
strategies, over sim-months or a sim-year. It skips empty heights, and a test proves that matches
the real node block for block. It is a scenario tool, not a forecast. With default params every
sybil key earned exactly the 500 ATTN/day epoch cap. Neither `room_only` nor tap gating helps on
its own against a ring that adapts; together they cut farming from 66% to 10% of issuance. See
[FINDINGS.md](crates/chain-sim/FINDINGS.md).

```bash
cargo run --release -p chain-sim -- run crates/chain-sim/scenarios/year-one.json --out /tmp/pc-sim/y1
```

## Proofs

`chain-proof` verifies an account balance or absence against a genesis-bound sequencer
anchor (or sealed header), without replaying history. Fetch
`GET /proof/claim/{address}?height=H` at a retained anchor height; `/proof/account/{address}`
returns an unsigned tip proof. MCP exposes `prove_balance {address,height?}`.

```bash
pointcast-node prove <address> --height 200 --db data/chain.sqlite > claim.json
pointcast-node verify-claim claim.json --params params.json --genesis <trusted-genesis-hash>
```

Without `--height`, `prove` exports a sealed tip header claim. Verification runs offline,
prints `PROVEN` and exits 0 on success; failures exit 1. Snapshots retain the last 48 sealed
anchors plus posted anchors; a missing snapshot returns 404 `replay required`. Proofs
establish inclusion in a sequencer-signed root, not transition validity or Tezos finality.
Absence uses neighbouring leaves and a shape argument; leaf counts themselves are not
committed and admit aliases. See [chain-proof](crates/chain-proof/README.md) for the tested
argument and explicit limitations.

## Anchoring

Every 100 blocks (`anchor_interval`, part of the genesis commitment) the node builds an
`AnchorPayload {chain_id, height, block_hash, state_root}`, signs its digest with the sequencer
key, and stores the sealed anchor in sqlite (`GET /anchors`). Every `PC_ANCHOR_POST_EVERY`-th
anchor is posted to Tezos as a **kind-3 cast on the tez-cast broadcast tower**: entrypoint
`default`, value `Pair 3 <body>`, where the body is the self-verifying `pcc1` v1 encoding:

```
"pcc" 0x01 ‖ u8 len(chain_id) ‖ chain_id ‖ u64be height ‖ block_hash(32) ‖ state_root(32) ‖ seq_sig(64)
```

That is 152 bytes for `pointcast-1`. Anyone can check an anchor against the chain's `Params.sequencer`,
whichever Tezos account posted it.

- **No key set:** dry-run. Payloads and tower parameters go to `data/anchors/anchors.jsonl`;
  statuses are `dry_run` (selected) or `recorded`.
- **Key set:** each selected anchor goes through a guarded pipeline: healthy RPC (head under 120 s
  old and not more than 30 s in the future, and reporting the configured network's chain id;
  otherwise the next endpoint), counter and reveal check, branch `head~2`, simulation (must be
  `applied`), limits from the simulation (`gas = ⌈milligas/1000⌉+100`, `storage = paid+20`), fee
  `100 + ⌈gas/10⌉ + forged_bytes + 64 (signature) + 20 (margin)` mutez, **sanity caps** (gas ≤
  10,000, storage ≤ 1,000 B, fee ≤ `PC_ANCHOR_MAX_FEE_MUTEZ`, default 5,000), local forge, **RPC
  forge of the same JSON (bytes must be identical, else abort)**, sign, preapply, inject, and a
  check that the returned op hash equals the local one. Statuses run
  `pending → injected → applied | failed | expired`; if the inject call fails after the bytes were
  sent (or returns another hash) the status is `inject_unknown` with the local hash in `op_ref`.
  A background task polls TzKT for up to 10 minutes; `expired` means not seen in that window (the
  op can still land for about an hour). A post error is stored as `failed` with the error in
  `note` (URLs reduced to `scheme://host/…`). Posts are at least `PC_ANCHOR_MIN_POST_SECS`
  (default 1800) apart in wall-clock time. The block loop never auto-reveals the account, and a
  `--dev` chain never posts to mainnet unless `PC_ANCHOR_ALLOW_DEV_MAINNET=1`.

### CLI

```bash
pointcast-node anchor status [--db PATH] [--block-ms N]   # network, RPC + head lag, account, balance, revealed, counter, cost/day
```

```bash
pointcast-node anchor reveal [--yes]             # one-time reveal; without --yes it only simulates
```

```bash
pointcast-node anchor post [--db PATH] [--height H|--latest] [--yes] [--force] [--dry-run] [--simulate-as tz1…] [--no-wait]
```

```bash
pointcast-node anchor verify [--db PATH]         # every kind-3 cast: signature, local block hash + state root, equivocation
```

```bash
pointcast-node anchor keygen                     # new edsk… key + tz1 for a dedicated anchor account
```

`post` without `--yes` (or with `--dry-run`) does everything except sign and inject, and prints the
forged hex, limits, fee and cost. Only `post --yes` signs and spends tez. It refuses an anchor whose
status says it may already be on chain (`injecting`, `injected`, `inject_unknown`, `applied`,
`expired`) and prints its op hash; look that up on TzKT, and pass `--force` only if it really did
not land. `--simulate-as` runs the dry run from another funded, revealed account (for example the
known caster `tz1XgXN2aTxcwiGvUqMrqU7vuBtRZnGCPcUZ`) before the anchor account is funded.

### Cost (mainnet, measured 2026-10-02)

Each anchor costs about 0.0662 ꜩ: 262 B storage burn (0.0655 ꜩ) plus a fee of about 0.0007 ꜩ.
The first cast from a new account burns 67 B more (0.0168 ꜩ) for its `by_author` entry.

| Cadence | `PC_ANCHOR_POST_EVERY` | Per day | Per year |
|---|---|---|---|
| Every anchor (5 min, needs `PC_ANCHOR_MIN_POST_SECS=0`) | 1 | 19.06 ꜩ (≈ $6.1) | 6,957 ꜩ (≈ $2.2k) |
| Hourly (default) | 12 | 1.59 ꜩ (≈ $0.51) | 580 ꜩ (≈ $186) |
| Daily | 288 | 0.066 ꜩ | 24.2 ꜩ (≈ $7.8) |

The table assumes 3 s blocks (the default `--block-ms 3000`); the cadence counts blocks, so faster
blocks post faster. `PC_ANCHOR_MIN_POST_SECS` (default 1800) keeps posts at least that far apart in
wall-clock time, so the default worst case is 48 posts/day (≈ 3.2 ꜩ) at any block time.
`anchor status --block-ms N` prints the real rate.

### Operator checklist (before the first mainnet anchor)

1. Create a dedicated anchor account (never a personal wallet): `pointcast-node anchor keygen`.
   Put the secret in your secret manager and expose it as `PC_TEZOS_ANCHOR_KEY_CMD` (killed after
   `PC_TEZOS_ANCHOR_KEY_CMD_TIMEOUT`, default 15 s, so unlock the manager first).
2. Fund the printed tz1 with about 10 ꜩ, which is roughly six days at the default cadence.
3. Reveal it once: `pointcast-node anchor reveal` (dry run), then `pointcast-node anchor reveal --yes`.
4. Run this build of the node **without** the key (dry-run) until it has sealed at least one anchor
   (100 blocks, about 5 minutes at 3 s blocks). Rows written by v0.1 have no sequencer signature
   and cannot be posted.
5. Stop the node, then post that anchor by hand: `pointcast-node anchor post` (dry run: check the
   limits, fee and cost), then `pointcast-node anchor post --yes`. Confirm it shows `applied` on TzKT
   (the command prints the link), then run `pointcast-node anchor verify`. Don't re-run `post --yes`
   on the same anchor; it refuses unless `--force`.
6. Restart the node with the key set. Check `pointcast-node anchor status --block-ms <your block
   time>` for balance, runway and the real posts per day.

The tez-cast and stampz feeds filter to human kinds (`value.kind.in=0,1,2`) as of tez-experiments
`e10337e`. **Redeploy tez-cast.pages.dev and stampz before the first mainnet anchor**, or anchors
will show up as garbled notes. Add the anchor account to `VITE_HIDDEN_CASTERS` so it stays off the
stampz top-casters board.

### Verified end to end on Shadownet (2026-10-02)

Run against the live protocol 025 with a throwaway key funded by the Shadownet faucet:

| Step | Operation |
|---|---|
| `anchor reveal --yes` | [`ooT6hDN…`](https://shadownet.tzkt.io/ooT6hDNcvmz9VZM3hnusexyEgHzAnHoQugCcsm7oCsNqPLBqZc6), applied |
| `anchor post --latest --yes` (@200) | [`opP5W2o…`](https://shadownet.tzkt.io/opP5W2o3s8UQZZjhmUt51nRyTWWuJVwyaZrw6iVxWmaAX2DX3cP), applied |
| node background job (@100) | [`opVXzWi…`](https://shadownet.tzkt.io/opVXzWiyYEe5E2eumwW8tCarPZwtR6CSyqcG86ETRbaXQzGrSAL), applied, then rate-floored |

`anchor verify` read the cast back from TzKT: sequencer signature valid, block hash and state root
match. Re-posting the same anchor was refused. Every operation passed the local forge == RPC
forge cross-check before signing.
