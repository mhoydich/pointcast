# Passport Stamps — v0.1 one-pager

**Filed:** 2026-04-24 (Sprint 21)
**Status:** concept sketch; contract file mentioned in
`docs/releases/gamgee-inventory.md` but not yet written
(`contracts/v2/passport_stamps_fa2.py` — inventoried as a staged
deliverable, doesn't exist on disk yet).
**Owner:** Mike (vision) · cc (writes spec + v0.1) · Codex (review)

---

## What is a Passport Stamp

A **Passport Stamp** is a proof-of-participation primitive for
PointCast. Each stamp records: _this wallet (or nounId, or anon
session) was here, at this time, doing this thing._

Concrete examples that motivate the primitive:

- Claimed the daily faucet Noun on 2026-04-24 → stamp
- Finished a Race on its resolve day → stamp
- Voted in a Poll → stamp
- Minted a Drop 001 piece → stamp
- Recorded a TALK block → stamp
- Watched the full 22 min of a `/yee` session → stamp (ambitious)
- Delegated to Prize Cast for a full draw cadence → stamp

Each stamp is a small, non-transferable token owned by the visitor. Not
an NFT in the "collectible" sense — more like _an airline boarding pass
stub you keep in a drawer._ The value is the **collection over time**,
not any single stamp.

## Why this fits PointCast

The site already has the shape:
- **Visit Nouns FA2** — FA2 primitive is proven on mainnet (`KT1LP1o…`).
  A sibling FA2 with `transfer` guarded to admin-only = non-transferable
  stamps.
- **PresenceRoom DO** — already tracks who's where. The DO knows which
  routes a session has visited; stamp triggers would be DO → KV → FA2
  mint.
- **Block schema** — blocks have `channel`, `type`, `timestamp`. A
  stamp can reference a block via `blockId` for provenance.
- **`/profile/{addr}` UI** — already renders wallet holdings from TzKT.
  A COLLECTION · STAMPS section is additive.

The Gamgee design principles ("finite > infinite," "events > feeds,"
"participation > consumption") all point at stamps as the native way
to make participation legible.

## What Passport Stamps are NOT

- **Not transferable.** If you can sell a stamp, it's just another NFT;
  the whole point is that _you_ got it by _doing_ the thing.
- **Not soulbound in a crypto-ideological sense.** Just a transfer
  guard on the contract. If Mike later wants social-recovery or a
  governance body that can reissue, the admin can.
- **Not points.** No numeric aggregation, no leaderboard. A stamp is a
  thing that happened once. Racers have race-leaderboards (RFC 0002),
  polls have poll results — stamps are the receipt, not the ranking.
- **Not a marketplace product.** No price. Some are gated (must own
  Visit Noun N to claim), some are open (first 100 visitors to the
  El Segundo block). Gating is per-stamp, not per-stamp-collection.

## The shape of a stamp

```ts
interface PassportStamp {
  tokenId: number;            // monotonic within the Stamps FA2
  kind: StampKind;            // see enum below
  title: string;              // "Drop 001 · Four Fields · collector"
  dek?: string;               // one-liner context
  issuedAt: string;           // ISO8601 — when minted
  issuedTo: string;           // tz address — owner
  provenance?: {              // optional link back into PointCast
    blockId?: string;         // "0340"
    raceSlug?: string;        // "front-door-2026-04-24"
    pollSlug?: string;        // "schelling-dinner-hour"
    dropSlug?: string;        // "drop-001"
    externalUrl?: string;     // for off-site event commemoration
  };
  imageCid?: string;          // optional IPFS CID for a stamp image
  channel?: ChannelCode;      // which PointCast channel this stamp is "in"
}

type StampKind =
  | 'faucet-claim'
  | 'race-finisher'
  | 'race-top-10'
  | 'poll-voter'
  | 'drop-collector'
  | 'talk-dispatcher'
  | 'visit-milestone'      // e.g. 100 blocks read
  | 'collaboration'        // off-site events, jam sessions, etc.
  | 'custom';              // admin-issued, free-form
```

## v0.1 implementation — two paths

### Path A — KV-only (ship in a week)

No new contract. Use `PC_STAMPS_KV` with keys shaped
`stamps:{addr}:{stampId}` + a reverse index `stamps-by-kind:{kind}:{addr}`.

- **Pro:** zero Tezos ops; fast to ship; no SmartPy compile
- **Con:** not on-chain; can't be read by external agents without our
  API; feels like "points" instead of "tokens"
- **Good for:** MVP to see if people care before committing to an FA2

Endpoints:
- `POST /api/stamps/claim` — issues a stamp (server-guarded per kind)
- `GET /api/stamps/{addr}` — lists stamps for an address
- `GET /api/stamps/{addr}/{stampId}` — single stamp detail

UI: `/profile/{addr}/stamps` — a grid like the existing NFT grid, but
keyed off KV instead of TzKT.

### Path B — FA2 (ships with a full mint cycle)

Originate `contracts/v2/passport_stamps_fa2.py` on mainnet. Admin-only
`mint_stamp(tokenId, owner, metadata)`; `transfer` reverts unless
sender === admin (non-transferable by default, admin can rotate for
edge cases). Metadata is TZIP-16/21 with `imageCid` pointing at IPFS.

- **Pro:** on-chain, agent-discoverable via TzKT, clearly a
  participation receipt not a centralized points ledger
- **Con:** each stamp costs ~0.005 ꜩ to mint; needs SmartPy compile
  + origination + admin transfer; IPFS pinning pipeline
- **Good for:** v1 once Path A proves demand

cc recommends **Path A first** — two weeks in KV, see which stamp
kinds people actually collect, then write the FA2 contract only for
the kinds that matter. If nobody cares about the `talk-dispatcher`
stamp, don't mint that on-chain.

## How the seven flagship stamps get issued

| # | Stamp kind | Trigger | Guardrail |
|---|---|---|---|
| 1 | `faucet-claim` | Server receives a confirmed daily-faucet mint op via TzKT webhook | One per wallet per UTC day |
| 2 | `race-finisher` | Race System resolves → top 10 each get one | Issued by Mike/admin at resolve time |
| 3 | `race-top-10` | Same as above but only for top 10 on `fastest` / `most` modes | (degenerate with 2; combine) |
| 4 | `poll-voter` | Successful `/api/poll` vote | One per wallet per poll |
| 5 | `drop-collector` | Successful mint from a `/drops/{id}` | One per wallet per drop token |
| 6 | `talk-dispatcher` | `/api/talk` draft → promoted to TALK block | Manual; admin issues on promotion |
| 7 | `visit-milestone` | Milestone reader counts — 10 / 100 / 500 blocks read per wallet | Tracked via `/b/{id}` log → KV counter |

## Relationship to the other Gamgee primitives

- **Race System (RFC 0002):** races *earn* stamps. Every race has
  implicit "finisher" and "top-10" stamps at resolve time.
- **Visit Nouns FA2:** a Passport Stamp is NOT a Noun. Nouns are
  aesthetic; stamps are receipts. Owning a Noun doesn't automatically
  issue any stamps — you still have to participate.
- **Prize Cast:** stamp at end of first full draw cadence as a
  depositor — "I was in the first cast." One per wallet, one-shot.
- **TALK blocks:** issuing a `talk-dispatcher` stamp signals the block
  was promoted, not just submitted. Closes the moderation loop with a
  visible-to-the-user signal.

## Open questions for Mike

1. **Path A vs B for v0.1.** cc recommends A; is Mike game for two
   weeks in KV before committing to FA2 origination? Or does
   "on-chain from day one" matter for the pitch?
2. **Stamp imagery.** Every stamp gets a small image (like a real
   passport stamp — round postmark style?). Auto-generated from nounId
   + stamp kind, curated per stamp kind, or admin-uploaded per
   individual mint? cc recommends auto-generated (nounId + kind seed
   → deterministic SVG glyph) for v0.1, custom art for marquee drops.
3. **Public collection browsability.** Should `/stamps/{kind}` list
   every holder of that kind (like a "yearbook"), or is that a
   privacy concern? Default public + wallet opt-out vs default private
   + opt-in?
4. **Stamp expiry.** Do any stamps expire? cc says no — that defeats
   the "receipt" thesis — but maybe certain event stamps need a
   "season" field that closes, so "Drop 001 · Four Fields · collector"
   doesn't mint forever if someone collects in 2030.
5. **Integration with `/wire`.** Should a new stamp issuance show up
   on the Wire as an event? (Yes — low-stakes, high-texture content.
   But privacy-respect the `issuedTo` address — show `0x12…abcd` short
   form.)
6. **Transferability escape hatch.** Even though stamps are non-
   transferable, should the admin have a `reissue(from, to)` for
   wallet-migration cases? cc recommends yes, gated behind a manual
   Mike-signed op with a reason string.
7. **Cross-pollination with Mesh.** If PointCast mesh nodes also
   issue stamps eventually, should there be a shared `PassportStamps
   v1.0` spec that federates across sites? Or is that Gamgee 2.0
   territory?

## Three next steps (if Mike says go)

1. **cc writes `contracts/v2/passport_stamps_fa2.py`** following the
   Visit Nouns template. Non-transferable by default, admin-only
   mint, TZIP-21 metadata. **Do not originate yet.**
2. **cc ships Path A in KV** with the seven flagship stamp kinds
   instrumented. `/api/stamps/claim` gated per kind. `/profile/{addr}
   /stamps` UI. `PC_STAMPS_KV` provision in wrangler.toml.
3. **Mike decides** between continuing on Path A or scheduling the
   FA2 origination. Criteria: count of distinct wallets that collected
   at least one stamp in the first 14 days. If < 10, stay on Path A;
   if ≥ 10, originate.

---

*A passport is a record of where you've been. PointCast is a broadcast
you enter. Stamps are the receipts for entering.*
