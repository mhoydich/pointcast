# pointcast-chain: design

## 1. Shape

```
             signed txs (HTTP / MCP)
                     │
              ┌──────▼──────┐   every 3s    ┌──────────────┐
              │   mempool   ├──────────────►│ build_block  │  chain-core (pure)
              └─────────────┘               └──────┬───────┘
                                                   │ Block{header, txs} + post-state
                        ┌──────────────────────────┼─────────────────┐
                        ▼                          ▼                 ▼
                 sqlite (blocks)           feed / API / MCP     every 100 blocks:
                        │                                       sealed AnchorPayload → TezosAnchor
                        │                                       (every Nth → tez-cast tower, kind 3)
           restart: apply_block × N  (re-verifies everything)
```

`chain-core` is the whole protocol. The node only does I/O: it supplies the timestamp,
picks tx order, signs headers, persists, and serves. Anything a validator, light client
or rollup kernel has to check lives in `chain_core::apply_block`.

## 2. Determinism rules (enforced by construction)

- `#![no_std]` + `alloc`, `#![forbid(unsafe_code)]`. No `std::time`, no RNG, no I/O.
- Only ordered collections (`BTreeMap`/`BTreeSet`). No `HashMap` iteration order.
- No floats. All amounts are `u64`; issuance is clamped with `saturating_sub`/`min`.
- Time comes in as data: `header.timestamp` is a sequencer input (must not go
  backwards). Rate-limit windows and epochs are measured in **block heights**, not time.
- Signing is deterministic too (ed25519; RFC 6979 for secp256k1), so `build_block` is a
  pure function of `(state, params, timestamp, candidates, sequencer_key)`.
- Hashes are taken over a hand-written canonical encoding (`codec.rs`: big-endian ints,
  u32-length-prefixed bytes), never over JSON.

Tested by the `replay_is_deterministic` property test: random op sequences are produced
twice by the sequencer, re-verified block by block, and re-sequenced from only the included
txs. All four paths must reach the same `state_root`. `supply_is_conserved` checks
`Σ balances == total_supply ≤ max_supply` and the per-account epoch cap. `tests/presence.rs`
repeats both on ticketed launch params with presence ops, and also checks per-pid and per-issuer
budgets against an independent tally of the included txs.

## 3. Accounts and auth

| Address | Key | Derivation |
|---|---|---|
| `tz1…` | ed25519 | b58check(`06a19f` ‖ blake2b-160(pk)): real Tezos addresses (checked against the sandbox `bootstrap1` vector) |
| `tz2…` | secp256k1 | b58check(`06a1a1` ‖ blake2b-160(compressed pk)) |
| `pca1…` | ed25519 | `"pca1"` ‖ b58check(blake2b-160(pk)) |

A tx carries `{sender, nonce, kind}` plus the public key and signature. The signed digest is
`blake2b-256("pointcast-chain/tx/v2" ‖ chain_id ‖ genesis_hash ‖ canonical(tx))`.
`genesis_hash = Params::hash()` commits to every parameter, so a re-genesis, even one that
reuses the chain id, can never replay old signatures. (The review caught v1, which bound only
the chain id.) Humans are authenticated by
deriving the address from the key; agents by matching the key registered on-chain. Human
accounts are created on first touch. Agents exist only after their owner sends
`register_agent` (an extra tx type the spec implied: an agent needs an owner and a name
somewhere). Only humans may register agents, up to `max_agents_per_owner`. Nonces are strict
(must equal the account nonce), so replays are rejected and each sender's txs are totally ordered.

### Signing modes

| `sig_mode` | Who | The key signs |
|---|---|---|
| `raw` (default) | CLI, agents, native signers | `D = Tx::signing_hash(chain_id)` directly |
| `tezos_message` | tz1/tz2 humans in Kukai, Temple, … | `blake2b-256(0x05 0x01 ‖ u32be(len) ‖ text)` |

`text = "Tezos Signed Message: pointcast-chain <chain_id> <kind> sender <addr> nonce <n> digest <hex(D)>"`

The explorer checks the text and rebuilds the payload in the browser before asking the wallet. It
signs only when the page was served by the node it talks to, so a hostile `?api=` can't swap
the payload. Wallets sign through Beacon `requestSignPayload({signingType:"micheline"})`, which signs
`blake2b(payload)` with no watermark (Taquito v25 confirms this, and so does PointCast's
production Kukai login). The verifier **rebuilds** the text from the tx; client-supplied text
is never parsed. D already commits to every field, so free-form strings never enter the text,
and the text stays printable ASCII as Michelson requires. `Params::validate` enforces a
wallet-safe chain id. Wallet mode appends a single `u8(1)` to the txid encoding, so modes can't collide. Test vectors are real Taquito
signatures, ed25519 and secp256k1, including a high-S rejection.

## 4. Transactions

| Kind | Effect | Issues ATTN |
|---|---|---|
| `publish_block` | `posts += 1`. Content stays off-chain; the chain holds `body_hash`. The node keeps bodies in sqlite. | no |
| `drum_session` | Players sorted, ≤ 8, include the sender; `1 ≤ duration ≤ 3600`; `ended_at_ms` fresh. Each **attested** player that already has an account, and hasn't been paid for that time, earns `min(⌊duration/10⌋·2, 100)` (§4.1). | yes |
| `tap` | Earns `tap_reward`. **Rejected** past `taps_per_window` per account per window. On a **ticketed** chain (§4.3) a bare tap still counts and is still rate limited, but mints 0. | yes (0 if ticketed) |
| `drop_mint` | First minter of a `drop_id` becomes its creator; only the creator mints after that, up to `max_drop_supply`. Editions count on the recipient's account. | no |
| `transfer` | Moves balance; supply-neutral. Can't target an unregistered agent address. | no |
| `register_agent` | Creates the agent account. | no |
| `set_drum_attestors` | Replaces the room-server attestor set (admin only, ≤ 16 sorted ed25519 keys). | no |
| `set_mandate` | The agent's owner grants (or re-grants) a mandate: scope, allowance and expiry (§4.2). Replaces any existing mandate and resets its counters. | no |
| `clear_mandate` | The agent's owner removes the mandate; the agent is unscoped again (§4.2). | no |
| `spend_allowance` | A mandated agent pays from its **owner's** balance, within the caps and payee list (§4.2). Supply-neutral; the receipt carries `funded_by`. | no |
| `presence_tap` | A tap carrying an issuer-signed presence ticket (§4.3). Humans only; shares the tap rate limit. Earns `presence_reward`. Rejected (`PresenceDisabled`) on any chain without ticketed presence. | yes |
| `set_presence_issuers` | Replaces the presence issuer set (presence admin only, ≤ 16 sorted ed25519 keys; empty = presence taps paused). | no |

Every handler validates fully before mutating, so a rejected tx leaves no trace (tested).

### 4.1 Drum attestation

```
session = blake2b("pointcast-chain/drum-attest/v2" ‖ str(chain_id) ‖ genesis ‖ str(sender) ‖ u64(nonce)
                  ‖ str(room) ‖ u32(n) ‖ str(player)×n ‖ beat_hash ‖ u32(duration) ‖ u64(ended_at_ms))
room   = blake2b("pointcast-chain/drum-room/v1" ‖ session)                 // what attestors sign
cosign = blake2b("pointcast-chain/drum-cosign/v1" ‖ session ‖ str(player)) // what player P signs
```

Roles are domain-separated, so a co-signature can never be presented as a room attestation.
Co-signatures are bound to the player's address, so one key that controls both a tz1 and a
registered agent can't vouch for both with one signature.

- **Co-signature** (`cosigs[]`): a non-sender player signs the digest, raw, or as a wallet
  message with purpose `drum_cosign`. Authentication goes through `State::key_controls`, the
  same function used for senders. Any bad co-signature rejects the whole tx.
- **Room attestation** (`room_sig`): an ed25519 key in `State.drum_attestors` signs the digest
  and vouches for every listed player. The set is genesis-seeded, admin-replaceable, and
  committed in the state root.
- **Policy** (`Params.drum_attest_policy`): `open` credits all players; `cosign` credits the
  sender, co-signers, and everyone when room-attested; `room_only` credits only room-attested
  sessions.
- **Single-use:** the digest includes the sender's nonce, so an attestation dies with that nonce.
- **Pays once:** `Account.drum_until_ms`. A session credits an account only if
  `ended_at_ms − duration ≥ drum_until_ms`, so a room server re-signing a session, or a
  second player submitting it, can't double-pay. Only **consenting** players (the sender,
  co-signers, or everyone under a room attestation) have `drum_until_ms` advanced. Under
  `open`, listing someone pays them but never spends their time, so it can't be used to void a
  victim's real session.
- **Full blocks defer:** if the block issuance cap can't pay a session in full, the tx fails
  with the retryable `BlockIssuanceFull` and the sequencer keeps it for a later block. Exhausting
  max supply is permanent, so that case is clamped instead of deferred.
- **Freshness:** `ended_at_ms ≤ block_ts + 30 s` and `≥ block_ts − 1 h`.
- Uncredited players are only recorded in the tx. They get no account creation and no counter
  changes, so nobody can be pushed into stats or toward an epoch cap.

The vectors were generated independently in JS: session, room and co-sign digests with a port of
the codec plus @noble/hashes; room signatures with WebCrypto `Ed25519` from PKCS8, as a Cloudflare
Worker produces them; raw tz2 co-signatures with @noble/curves; wallet co-signatures with
Taquito. The Rust implementation matches them byte for byte.

### 4.2 Agent mandates

Without a mandate, a registered agent can send any kind and spend its own balance, and its owner
has no on-chain brake. A **mandate** (`chain_core::mandate`, `State.mandates`, keyed by agent) is
what the owner grants:

```
MandateTerms { kinds: u16,            // bit 1<<tag per TxKind tag; 0 = paused
               channels, rooms,       // publish_block / tap+drum_session allowlists; [] = any
               spend_per_period, period_blocks, spend_total, payees,
               expires_at }           // block height, exclusive
Mandate      { terms, granted_at, period, spent_in_period, spent_total }
```

- **Owner only.** `set_mandate` and `clear_mandate` must come from the agent's
  `AccountKind::Agent.owner`; anyone else gets `NotAgentOwner`. Only tags 1..=7 and 10 can be
  delegated, so an agent can never grant, widen or clear its own mandate.
- **One gate.** Right after `authenticate` and before any mutation, a mandated sender passes
  `mandate::check_scope`: expiry, then the kind bit, then the channel allowlist (publish_block) or
  room allowlist (tap, drum_session). Rejections (`MandateExpired`, `OutOfScope`) change nothing,
  not even the nonce. Being listed as a player in someone else's drum session isn't a tx the agent
  sends, so it isn't gated.
- **Fails closed.** At `height >= expires_at` every tx from the agent is rejected, whatever its
  kind, until the owner re-grants or clears. `kinds = 0` pauses the agent the same way.
- **Allowance.** `spend_allowance` debits the owner and credits `to`. It needs bit 10, `amount > 0`,
  `amount ≤` both what's left this period (period index `height / period_blocks`, which resets
  `spent_in_period` on rollover) and what's left of `spend_total`, a listed payee (if any are listed),
  a receivable `to`, and an owner balance that covers it. The agent's own balance is never touched;
  `transfer` (bit 5) still covers that.
- **Custodial MCP fence.** `/mcp` is unauthenticated and CORS-permissive, and a node with
  `PC_MCP_AGENT_SECRET` signs plain-field write calls as its agent. Since `spend_allowance` debits
  the *owner*, an open custodial spend would let any caller (or any web page the owner visits)
  pay an address of its choosing up to the caps. So the node fences the custodial path: any
  custodial write carrying an `Origin` header is refused (browsers, including DNS-rebound pages,
  must bring a `signed_tx`), and a custodial `spend_allowance` must name a payee the owner listed in
  the mandate; with `payees = []` custodial spends are refused outright. A caller who can reach the
  node can still burn the allowance toward listed payees, so owners of a custodial agent should
  keep `payees` short and the caps small. A `signed_tx` from the agent's own key is unaffected:
  it is still bound only by the on-chain checks above.
- **Re-grant = refill.** A new `set_mandate` replaces the terms and zeroes the counters, so raising
  or refilling an allowance is always an explicit owner tx. `clear_mandate` returns the agent to
  legacy unscoped behaviour, which keeps every v0.1 agent working unchanged.
- **State root, backward compatible.** While `mandates` is empty the root is exactly the v2 formula
  (§5), so every pre-mandate chain replays byte for byte (`tests/legacy_root.rs` pins a 40-block
  golden from before this change). Once any mandate exists:

  ```
  mandates_root = merkle(leaf(str(agent) ‖ mandate) for each agent, sorted)
  ext_root      = merkle([leaf(u8 1 ‖ mandates_root)])     // module tag 1 = mandates
  state_root    = blake2b("…/state/v3" ‖ accounts_root ‖ drops_root ‖ attestors_root ‖ ext_root ‖ total_supply)
  ```

  Later state modules take later tags in `ext_root`; the generalised form is in §5. Params, the
  genesis hash and the account encoding are unchanged.

### 4.3 Presence tickets

`crates/chain-sim` measured the gap (FINDINGS.md §4–5): even with `room_only` and about one tap an
hour, sybil keys take 10% of issuance, and all of it is free tap income. A launch chain closes it
by paying tap income only for **presence**: a ticket from an issuer that checked a real person.

```
ticket = blake2b("pointcast-chain/presence/v1" ‖ str(chain_id) ‖ genesis ‖ str(holder) ‖ str(room)
                 ‖ bytes(issuer) ‖ pid ‖ u64(slot))                 // what the issuer signs (ed25519)
pid    = blake2b("pointcast-chain/presence-pid/v1" ‖ blake2b(issuer seed) ‖ str(login))   // reference only
slot   = height / slot_blocks
```

`pid` is a **pairwise identity**: a keyed hash the issuer derives from the person's login, shaped
like PointCast `/connect` pairwise ids. The chain never sees a login, only the issuer can map one to
its pid, and two issuers give the same person unrelated pids. The chain doesn't check the
derivation; any issuer-private, stable mapping works.

A `presence_tap {room, ticket}` is valid only if all of these hold, checked in this order before
anything changes (a rejection leaves no trace, not even the nonce):

1. The chain has `launch.presence` with `tap_policy = ticketed`, else `PresenceDisabled`. Every
   legacy chain is in this case: tag 11 decodes but is always rejected.
2. The sender is a human (tz1/tz2), else `PresenceHumansOnly`. Agents earn through drum/room
   attestation; presence is a human thing. Bits 11 and 12 are not in `DELEGABLE_KINDS`, so a
   mandated agent is stopped earlier, at the mandate gate.
3. A valid room slug, and the same per-account tap window as `tap` (the two share it).
4. `ticket.issuer` is in `State.presence.issuers` (`UnknownIssuer`), and the signature verifies over
   the digest above with this sender as holder and this room (`BadTicket`).
5. `current − grace_slots ≤ ticket.slot ≤ current` (`TicketStale`); `grace_slots` is 0 or 1.
6. The pid's record: `last_slot ≥ ticket.slot` is `PresenceReused` (one redemption per pid per
   *ticket* slot; a pid that missed a slot may catch up its grace slot and then take the current
   one, so a chain slot can pay a pid twice, but never more than the slots elapsed), and another
   holder inside `bound_until_epoch` is `PresenceBoundElsewhere` (a pid stays bound to whoever
   last redeemed it, through epoch `e + bind_epochs − 1` for a redemption in epoch `e`, so one
   person's pid can't be rented out slot by slot; `bind_epochs = 0` turns binding off).
7. The issuer has admitted fewer than `issuer_slot_cap` redemptions in the current slot, else
   `IssuerSlotBudgetSpent`.

Then it commits the pid record (`{sender, ticket.slot, epoch + bind_epochs}`), the issuer's slot
counter (reset when the slot changes), the tap counters, and mints `presence_reward` through
`State::issue`, so the epoch, block and supply caps all still clamp. A bare `tap` on a ticketed chain
keeps its validation, rate limit and `taps += 1` and mints nothing: caps clamp, they never confuse.

**Threat model.** The issuer's identity check is the scarce thing; the chain only makes sure each
admitted identity is paid at most once per slot. A **compromised issuer key** can mint fresh pids at
will, but it is bounded by `issuer_slot_cap × presence_reward` per slot (and by every account's epoch
cap), and `set_presence_issuers` from the admin removes it. Tickets are bound to the chain (id +
genesis), the holder and the room, so they can't be replayed elsewhere or handed to another
address. A ticket carries no nonce, but the pid/slot record makes it single-use. An empty issuer set
pauses presence taps outright.

`PresenceParams::dev` (reward 5, 1200-block slots ≈ 1 h, grace 1, cap 5000, bind 7 epochs) are
hypotheses; batch 2 sets the real values by simulation.

**Reference issuer.** `pointcast-node presence-ticket` signs tickets locally with
`PC_SIGNER_SECRET`. `issuer/presence-issuer.js` is the same thing as a Cloudflare-Worker-shaped ES
module: WebCrypto Ed25519 from a PKCS8 seed, an inlined blake2b, one ticket per login per slot
through an injected KV store, the login taken only from a deployer-supplied
`authenticate(request)`, and tickets only for the slot a deployer-supplied `currentSlot()` reports
(or the grace slot before it), so one sign-in can't stockpile tickets for future slots. `issuer/vectors.json` is generated by chain-core's `presence_vectors` test
and checked byte for byte by `node --test issuer/js-test`. Neither is deployed.

**Launch records (params v2).** `Params.launch` is an optional tagged-record extension. With
`launch = None` the params encode exactly as before and hash under `params/v1`, so every existing
chain keeps its genesis hash (`tests/legacy_root.rs` pins the default `--dev` genesis hash). With
records, the canonical encoding appends `u8 0xF0 ‖ u32 n ‖ (u8 tag ‖ bytes(record)) × n`, tags
strictly ascending, n ≥ 1, and the hash domain becomes `params/v2`.

| Tag | Record | Status |
|---|---|---|
| 1 | `presence`: `tap_policy (u8: open 0, ticketed 1) ‖ u64 presence_reward ‖ u64 slot_blocks ‖ u8 grace_slots ‖ u32 issuer_slot_cap ‖ u64 bind_epochs ‖ str admin ‖ u32 n ‖ bytes issuer × n` | this package |
| 2 | `keys`: sequencer rotation, role split, wallet text v2 | reserved (batch 2) |
| 3 | `state_root_version` (sparse Merkle tree) | reserved (batch 4) |
| 4 | forced inclusion | reserved |
| 5 | bridge | reserved |

`Params::validate` rejects a launch with no records, `slot_blocks = 0`, `grace_slots > 1`,
`issuer_slot_cap = 0`, an issuer set that isn't sorted/unique/≤ 16 ed25519 keys, a ticketed chain
with no genesis issuer, and an admin equal to the sequencer's address. The kernel decoder accepts
only known tags and refuses any non-canonical tail. A node sets this up with `PC_TAP_POLICY=ticketed`
(plus `PC_PRESENCE_ISSUERS`, `PC_PRESENCE_ADMIN` on a real chain); unset, nothing changes.

### Issuance caps

All minting goes through one function, `State::issue`, which clamps to the minimum of:

1. the requested reward,
2. `account_epoch_cap − issued_in_epoch` (per account, resets each `epoch_blocks`),
3. `block_issuance_cap − issued_this_block` (global, per block),
4. `max_supply − total_supply` (hard ceiling, treasury included).

Rate limits **reject** (a 6th tap in a window is an invalid tx). Caps **clamp** (a tap past the
epoch cap is valid but mints 0). That way an honest client never gets a confusing failure
for "earned enough today". The genesis treasury is the only premine.

Defaults (3s blocks): tap window 20 blocks (1 min) × 5 taps; epoch 28,800 blocks (1 day) ×
500 ATTN per account; 2,000 ATTN per block; 1e9 max supply.

## 5. Blocks and the state root

```
Header { height, prev_hash, timestamp, tx_root, state_root, sequencer_sig }
block_hash    = blake2b("…/header/v1" ‖ height ‖ prev_hash ‖ timestamp ‖ tx_root ‖ state_root)
sequencer_sig = ed25519(sequencer, blake2b("…/seal/v2" ‖ genesis_hash ‖ block_hash))
genesis prev_hash = blake2b(params)       // block 1 commits to the parameters
```

`tx_root` was added to the spec's header so the signature binds the body. Every signature the
sequencer makes (block seals here, and anchors below) binds `genesis_hash = Params::hash()`, as tx
and attestation digests already do. A seal or anchor from one chain can never be passed off as
another chain's, even when two chains share a sequencer key, which every `--dev` chain does. The
Verify Desk found this gap: evidence built from one chain checked as valid against another.

`state_root = blake2b("…/state/v2" ‖ accounts_root ‖ drops_root ‖ attestors_root ‖ total_supply)` while every
extension module is empty. Once any module is non-empty it is
`blake2b("…/state/v3" ‖ accounts_root ‖ drops_root ‖ attestors_root ‖ ext_root ‖ total_supply)`, where
`ext_root = merkle(leaves)` over one leaf per **non-empty** module, in tag order
(`State::ext_root_opt()` is `None` when there are none):

| Tag | Module | Leaf |
|---|---|---|
| 1 | mandates | `leaf(u8 1 ‖ mandates_root)` (§4.2) |
| 2 | presence | `leaf(u8 2 ‖ presence_root)`; `presence_root = merkle(leaf(0x00 ‖ u32 n ‖ bytes(issuer)×n), leaf(0x01 ‖ pid ‖ str(holder) ‖ u64 last_slot ‖ u64 bound_until_epoch) per pid, leaf(0x02 ‖ bytes(issuer) ‖ u64 slot ‖ u32 count) per issuer)` |
| 3 | sequencer keys | reserved (batch 2) |

A mandates-only state gets exactly the pre-presence root, and a chain with neither module keeps the v2
formula, so every existing chain replays byte for byte. A ticketed chain is v3 from genesis (its
issuer set is non-empty). Each `_root` is
a binary Merkle tree (domain-separated leaf/node hashing, odd node promoted) over entries sorted by
key. Account leaves commit to **everything** about the account, including nonce, rate-limit and
epoch counters and drop holdings. The spec asked for "accounts and balances"; committing the whole
state is what makes the root sufficient for replay checks and fraud proofs.

## 6. Trust model

A single sequencer can **censor, reorder and pick timestamps** (within monotonicity). It
**cannot** forge user txs, mint past the caps, or produce a state root that doesn't match its
txs: anyone holding the blocks can run `apply_block` and catch it. Anchors put
`(height, block_hash, state_root)` on Tezos, so history can't be quietly rewritten after the fact.

### Anchors

- **Self-verifying.** Each anchor is a `pcc1` v1 cast body (`AnchorPayload::cast_body`) carrying
  the sequencer's signature over `AnchorPayload::digest(genesis_hash)`
  (`"…/anchor/v2" ‖ genesis_hash ‖ payload`). The sequencer key is committed at
  genesis (`prev_hash = blake2b(params)`), so a reader needs only the genesis params to check an
  anchor. The Tezos account that posted it carries no authority: **anyone may post kind 3**, and
  readers ignore any cast whose signature doesn't verify. The node's anchor account is just a
  fee payer and can be rotated freely.
- **Equivocation is evidence.** Two validly signed anchors for the same height that differ in
  block hash *or* state root prove the sequencer signed two histories (or two roots for one
  block). `pointcast-node anchor verify` reads every kind-3 cast from TzKT, checks signatures,
  compares both the block hash and the state root against the local block header at that
  height, and flags both cases. An anchor "matches" only if both fields agree, so a light
  client can take `state_root` from a matching anchor.
- **Cadence vs `Params.anchor_interval`.** `anchor_interval` (100) is inside `Params::hash`, so
  changing it changes genesis. The node seals and stores *every* anchor, and only *posts* every
  `PC_ANCHOR_POST_EVERY`-th one (default 12, about hourly). That costs about 1.6 ꜩ/day instead of
  19 ꜩ/day. Because each block hash commits to all prior blocks, one posted anchor pins the whole
  prefix. The cadence counts blocks, so a faster `--block-ms` would post faster; posts are also
  kept at least `PC_ANCHOR_MIN_POST_SECS` (default 1800) apart in wall-clock time, which caps
  spending at about 48 posts/day (≈ 3.2 ꜩ) whatever the block time. A `--dev` chain (public
  keys) never posts to mainnet unless `PC_ANCHOR_ALLOW_DEV_MAINNET=1`.
- **RPC freshness and network pinning.** Public RPCs can serve stale heads: on 2026-10-01
  `mainnet.smartpy.io` was 7.7 h behind. A stale branch or simulation leads to unbakeable or
  wrongly priced operations. The node skips any endpoint whose head is over 120 s old or more
  than 30 s in the future, or whose `chain_id` is not the configured network's (mainnet
  `NetXdQprcVkpaWU`, shadownet `NetXsqzbfFenSTS`, or `PC_TEZOS_CHAIN_ID`), and moves to the
  next in `PC_TEZOS_RPC`. A shadownet URL with the default mainnet network is never used.
- **Forge cross-check.** Operations are forged locally (proto 025 layout), and the same JSON is
  forged by the RPC's `helpers/forge/operations`. Any byte difference aborts before signing.
  This catches **local encoder drift** at a protocol upgrade (proto 025 itself added a byte to
  reveals) and a forge helper that disagrees with us. It does **not** catch an RPC that encodes
  honestly but lies in simulation: inflated gas and storage limits are already in the JSON both
  sides forge. After signing, the operation is preapplied, and the op hash returned by injection
  must equal the locally computed `base58check([5,116] ‖ blake2b(signed))`.
- **Sanity caps.** Because limits and fee are derived from the RPC's simulation, every operation
  is checked before signing: gas ≤ 10,000 (a cast uses ~2.6k), storage ≤ 1,000 B for casts and
  0 for reveals (a cast stores ~262 B), and fee ≤ `PC_ANCHOR_MAX_FEE_MUTEZ` (default 5,000; a
  cast pays ~700). Without them a buggy or hostile endpoint could make each post burn ~0.1 ꜩ in
  fees plus ~15 ꜩ of storage.
- **Injection is never "lost".** The local op hash is computed before injection. If the inject
  call fails after the bytes were sent, or returns another hash, the anchor is stored as
  `inject_unknown` with that hash in `op_ref` and confirmation is still polled. `anchor post`
  writes the hash (`injecting`) before sending, and refuses to re-post any anchor that may have
  landed (`injecting`, `injected`, `inject_unknown`, `applied`, `expired`) without `--force`.
- **No secrets in public notes.** Error text stored in `note` (served on `GET /anchors`) has every
  URL reduced to `scheme://host/…`, since hosted RPCs often carry an API key in the path.

### Known gaps (deliberate for v0.1)

- **Drum farming, residual.** Co-signatures stop a sender from listing *other people*, but
  sybil accounts can still co-sign for each other. Wall-clock non-overlap and the caps bound
  that ring. Real cost only comes with `room_only` plus a room server that admits verified,
  present players (Kukai login, minimum hits, per-wallet limits). Launch any chain where ATTN
  has value with `PC_DRUM_POLICY=room_only`. The PointCast drum Worker still has to implement
  the attest endpoint and hold `DRUM_ATTESTOR_SK`. The research notes have a sketch.
  `crates/chain-sim` measures this (FINDINGS.md): every sybil key earns exactly the 500/day
  epoch cap. `room_only` alone doesn't help against a ring that adapts, because taps alone reach
  the cap. `room_only` plus tap gating (about one tap an hour) cuts farming from 66% to 10% of
  issuance, for 15% of honest income.
- **Tap farming across sybil accounts.** On legacy and open-policy chains it is still bounded only by
  `block_issuance_cap`. On a **ticketed launch chain** (§4.3) it is closed to the extent issuer
  identities are scarce: bare taps mint 0, each admitted identity earns at most once per slot, and a
  compromised issuer is capped at `issuer_slot_cap × presence_reward` per slot until it is removed.
  The residual is the issuer's own identity check (how many logins one person can hold). Batch 2
  measures it in `chain-sim` and sets the real presence params. pid records are never pruned yet
  (one per admitted identity, bounded per slot by the issuer caps); pruning records whose slot and
  binding have both lapsed is safe and left for later. pid records are keyed by pid alone, not by
  (issuer, pid): pids stay stable across an issuer's key rotation, but a compromised listed issuer
  can claim another issuer's pid once its binding has lapsed, refusing that returning person for
  up to `bind_epochs` (griefing only; its income stays inside its own slot cap). Keying records by
  (issuer, pid) closes it at the cost of resetting bindings on rotation; batch 2 decides.
- **No fees.** Spam control is signature checks at the door, nonces, and the mempool cap.
- **Mempool admission is stateless** (signature only). Invalid txs are dropped at build time
  and reported through `GET /tx/{hash}`.
- **O(n) per block:** the state is cloned per block and the Merkle root is recomputed over all
  accounts. Fine for thousands of accounts; use an incremental or sparse Merkle tree past that.
  Account proofs exist in `chain-proof`; absence proofs are shape-bound (argued and tested),
  while the uncommitted leaf count admits aliases described in its README.
- **Wallet prompts show kind, sender, nonce and digest, not amounts.** Before ATTN carries
  value, a v2 text template could add ASCII-only fields such as `to <addr> amount <n>` for
  transfers. The verifier must rebuild those fields too.
- **Wallet prompts don't show mandate terms.** A `set_mandate` prompt shows the kind, sender, nonce
  and digest like any other tx (the digest commits to the terms), so owners rely on the explorer's
  rendering of what they are granting.
- **Wallet mode is tested against Taquito's signer, not a live Kukai session.** Do one real
  Kukai (Google/tz2) and one Temple signature through the Transmit panel before announcing it.

### Merge note: chain-proof

The `codex/proof-of-balance` lane's `crates/chain-proof` picks state/v3 by `!state.mandates.is_empty()`
and calls `state.ext_root()`. Once presence lands, a ticketed chain is v3 with no mandates at all. After
both lanes merge, chain-proof must pick v2/v3 from `state.ext_root_opt()` (`Some(ext)` → v3 with that
ext root) instead of `!state.mandates.is_empty()`. `ext_root()` itself is unchanged for mandates-only
states. This is a one-line follow-up owned by the integrator; this package does not edit chain-proof.

## 7. Becoming a Tezos smart-rollup kernel

**Status.** The *sequenced* path below is built in [`crates/kernel`](crates/kernel/README.md)
(`pointcast-kernel`): inbox messages carry whole blocks (chunked past the 4096-byte inbox
limit, behind sequencer-signed chunk manifests), the kernel runs the unmodified `apply_block`, keeps state in durable storage under
`/pcc`, writes anchor payloads to the outbox, and reaches the native state root byte for byte
at every inbox level on the SDK `MockHost` (200 blocks, all ten tx kinds including the
mandate kinds 8–10, across the v2→v3→v2 state-root transitions; block seals are checked as
`seal_digest(params.hash())`, seal/v2; plus the verifier testkit's 90-block presence chain with
kinds 11–12 on launch params (params/v2), whose state blob carries a presence section). The wasm builds to ~240 KiB and imports only
`smart_rollup_core`. Not done: lazy per-account storage (item 3),
chain-core's `Result`-not-`expect` cleanup (item 5), the bridge (item 8), origination via the
installer kernel (item 10). The kernel is its own Cargo workspace (own lockfile), so the
SDK's old crypto pins never reach the node's or chain-core's builds.

What already holds: `no_std`, no floats, no clocks or RNG, ordered maps, a canonical codec,
and crypto that compiles to `wasm32-unknown-unknown` (checked: `cargo build -p chain-core
--target wasm32-unknown-unknown`). What changes:

1. **Entry point.** Add a `kernel` crate with `tezos-smart-rollup`'s `#[entrypoint::main]
   fn run(host: &mut impl Runtime)`. It loops over `host.read_input()` and dispatches.
2. **Inputs replace the sequencer's privileges.** Pick one:
   - *Sequenced:* external inbox messages carry whole `Block`s. The kernel runs
     `apply_block` (sequencer signature check included) and drops anything invalid. Lowest
     latency, and the node stays the sequencer.
   - *Based:* external messages carry raw `SignedTx`s and the L1 inbox order is the order.
     The sequencer disappears, `height` comes from the inbox level, and the timestamp from the
     `Info_per_level` internal message. `build_block` minus the signature is exactly this loop.
3. **State in durable storage.** Swap the in-memory `BTreeMap`s for a storage trait backed
   by `host.store_read/store_write` (`/accounts/<addr>`, `/drops/<id>`, `/meta/supply`),
   loading accounts lazily. `State` becomes generic over that trait. The node keeps an
   in-memory impl, so both runtimes share the handlers.
4. **State root.** The PVM's own commitment already covers durable storage, so the
   protocol root is no longer needed for security. Keep it (made incremental) for light
   clients and for parity with pre-rollup anchors.
5. **No panics.** Replace the two `expect`s (`State::issue` target, secp256k1 `SecretKey`)
   with `Result`s and put `SecretKey`/signing behind a `signing` feature the kernel doesn't
   enable. A panicking kernel is stuck until upgraded.
6. **Decoding.** The kernel can't use serde_json. A canonical `Decode` mirroring `Encode`
   now exists in the kernel crate (`crates/kernel/src/codec.rs`, chain-core untouched), with a
   re-encode check that rejects any non-canonical bytes, and inbox messages are framed as
   `"PCK" ‖ version ‖ [tag][canonical bytes]`.
7. **Tick budget.** Signature checks dominate (secp256k1 most). Cap txs per `kernel_run`
   and use `host.mark_for_reboot()` to continue large inbox levels.
8. **L1 bridge.** ATTN deposits and withdrawals become new tx kinds: deposits arrive as
   ticket transfers in the inbox, withdrawals go out as outbox messages (FA2 tickets).
9. **Anchoring retires.** Rollup commitments, with refutation games, replace the anchor
   job. Until then, anchors are the cheap first step on the same path.
10. **Params and upgrades.** Move `Params` into durable storage at origination. Use the
    installer kernel and reveal-preimage flow for upgrades, and build with `opt-level="z"`
    plus stripping to keep the WASM small.

## 8. Anchor contract

No dedicated contract. Anchors are kind-3 casts on the existing tez-cast broadcast tower
(`KT1NgPnaHLtZ2cNpb2hWGDxFH9fUCABaiaE1`; parameter `pair (nat %kind) (bytes %body)`, author =
`SENDER`, append-only `casts` big_map). The tower doesn't need an admin gate or height ordering:
authority comes from the sequencer signature in the body, and ordering and equivocation are checked
by readers (see §6). The earlier untested `%anchor` contract sketch was dropped.
