# TASKS.md

**Live coordination queue for pointcast.xyz v2.** Read on every session start. See `AGENTS.md` for owner codes and status vocabulary.

Owners: **CC** (Claude Code) · **M** (Manus) · **X** (Codex) · **MH** (Mike)
Statuses: `queued` · `in-progress` · `blocked` · `handoff` · `waiting-on-mh` · `done`

---

## Phase 1 — Visual rebuild ✅ SHIPPED (now on `main`, live at pointcast.xyz)

All foundation, component, routing, and content-migration tasks landed in commits `0ee3f44` → `05aca57`. 88 pages build, 48 blocks live across 9 channels, Manus QA + Codex Battler review both closed.

- [x] (CC) Block schema + content collection, channels.ts, block-types.ts, BlockLayout
- [x] (CC) BlockCard.astro with all 8 type treatments + size variants (1x1/2x1/1x2/2x2/3x2)
- [x] (CC) Home grid (auto-fit dense), /b/[id], /b/[id].json, /c/[channel], sticky mobile chip bar
- [x] (CC) Self-hosted Inter + JetBrains Mono via @fontsource-variable
- [x] (CC) Content migration: v1 dispatches, editorial modules, drops, 20 Tezos NFT imports
- [x] (M) End-to-end QA pass — 5 blockers fixed same-day, log at `docs/manus-logs/2026-04-17.md`
- [x] (X) Phase 1 spec review — all blocking items addressed in `docs/codex-logs/2026-04-17-phase-1-review.md`
- [ ] (MH) Decide numbering: fill №0160–0204 gaps or leave sparse? — `waiting-on-mh`

---

## Phase 2 — Agent layer ✅ SHIPPED

- [x] (CC) `/for-agents` manifest with purpose, channel list, endpoint list, citation format
- [x] (CC) JSON-LD on home + `/b/[id]` + `/c/[channel]` pages
- [x] (CC) `/c/{slug}.rss` + `/c/{slug}.json` (JSON Feed v1.1) per channel
- [x] (CC) `/blocks.json` full archive
- [x] (CC) `/sitemap-blocks.xml` filtered to /b/ URLs (per Manus 1.3)
- [x] (CC) Per-block OG images via `scripts/generate-og-images.mjs` (1200×630 PNGs for all 48 blocks)
- [ ] (CC) User-Agent-based stripped-HTML mode for known agent strings — `queued` (low priority — JSON-LD + /for-agents covers 95%)
- [x] (CC) Spotify iframe facade on LISTEN-embed blocks (Manus QA 3.1) — home grid renders static chip, iframe mounts only on /b/[id]

---

## Phase 3 — Tezos faucet (depends on mainnet origination)

- [ ] (CC) Mainnet origination of Visit Nouns FA2 — `queued` (parallel track, runs on `main` branch)
- [ ] (CC) Adapt `scripts/deploy-visit-nouns-shadownet.mjs` → `deploy-visit-nouns-mainnet.mjs` using Kukai for signing (not InMemorySigner) — `queued`
- [ ] (CC) Beacon wallet connect in the BlockCard for FAUCET/MINT types — `queued`
- [ ] (CC) Daily faucet contract: one tokenId per day, 24h reset, supply cap, one-claim-per-wallet — `queued`
- [ ] (CC) IPFS pinning pipeline for daily noun metadata — `queued`
- [ ] (CC) TzKT indexer reads for live `minted/supply` on FAUCET blocks — `queued`
- [ ] (MH) Pick first-day noun + daily selection mechanic (random / curated / custom) — `waiting-on-mh`

---

## Phase 4 — Paid mints

- [ ] (CC) Paid-edition entrypoint on FA2 (or companion contract) — `queued`
- [ ] (CC) Dispatch blocks with optional `mint` frontmatter → MINT-type block surface — `queued`
- [ ] (M) objkt collection creation + metadata upload — `queued`
- [ ] (CC) Good Feels phygital redemption flow — `queued`
- [ ] (MH) Decide: Good Feels on PointCast contract or separate collection? — `waiting-on-mh`

---

## Phase 5 — Cutover

- [ ] (MH) Approve blocks-rebuild → main merge — `queued`
- [ ] (CC) DNS cutover pointcast.xyz → v2 — `queued`
- [ ] (M) Verify SSL, caches, analytics, redirects — `queued`
- [ ] (M) Launch-day cross-post: Farcaster, X, objkt collection announcement, Nextdoor — `queued`

---

## Mainnet contract track (runs on `main`, not `blocks-rebuild`)

- [ ] (CC) Mainnet origination of Visit Nouns FA2 via Kukai signing — `queued`
- [ ] (CC) Wire KT1 mainnet address into `src/data/contracts.json` — `queued`
- [ ] (CC) First real mainnet `mint_noun` smoke test — `queued`
- [ ] (CC) `set_metadata_base_cid(cid)` once Pinata upload is done — `queued`
- [ ] (M) Upload 1200 Nouns metadata to Pinata via `scripts/upload-nouns-ipfs.mjs` — `queued`
- [ ] (CC) Marketplace contract origination on Mainnet — `queued`
- [ ] (CC) DRUM token contract origination on Mainnet (Phase C gating) — `queued`

---

## Open MH decisions (blocking something above)

- [ ] (MH) Contract language — SmartPy locked? (yes, confirmed — visit_nouns_fa2.py is live on Shadownet) — `done`
- [ ] (MH) Numbering gaps: fill №0160–0204 or leave sparse? — `waiting-on-mh`
- [ ] (MH) Faucet noun selection mechanic (random / curated / custom) — `waiting-on-mh`
- [ ] (MH) Good Feels drops: PointCast contract or separate? — `waiting-on-mh`
- [ ] (MH) `/status` page showing live agent activity? (poetic, cheap, v2 launch feature?) — `waiting-on-mh`
- [ ] (MH) Typography: Inter free for v1 OK, defer Söhne / Neue Haas? — `waiting-on-mh`
- [x] (MH) Approve Battler channel decision — BTL new 9th channel (oxblood #8A2432), approved verbally "go for nouns battler if it meets your criteria" 2026-04-17 — `done`
- [ ] (MH) Approve Battler "Card of the Day" selector: today's auction vs yesterday's auction (X recommends), random, or curated? — `waiting-on-mh`
- [ ] (MH) Approve match-NOTE block ID scheme: `BTL-NNNN` prefix (X recommends) vs main monotonic sequence (amends BLOCKS.md schema either way) — `waiting-on-mh`
- [ ] (MH) Approve commemorative mint economics: free-gas FAUCET treatment (X recommends) vs paid 1–5 tez MINT edition — `waiting-on-mh`

---

## Nouns Battler (designed by X · 2026-04-17)

Design doc: `docs/codex-logs/2026-04-17-nouns-battler-design.md`
Prototype sketch: `sketches/codex/nouns-battler-v0.html`

- [ ] (CC) Build Nouns Battler Phase 1: `src/lib/battler/stat-derivation.ts` (pure seed → stats), `src/lib/battler/resolve.ts` (pure 3-round resolver), `src/pages/battle.astro` (full BTL channel battle page, client-side only), first hand-written Card of the Day block, BTL channel added to `src/lib/channels.ts` — `queued` — priority **med** (after MH channel decision)
- [ ] (CC) Nouns Battler Phase 2: localStorage match log + build step that emits one BTL NOTE block per completed match + `/battle.json` + `/c/battler.json` agent feeds — `queued` — priority **low** (after Phase 1 Battler)
- [ ] (CC) Nouns Battler Phase 3: wire Card of the Day to Visit Nouns FA2 as 1/1 commemorative mint, Beacon connect on battle page, TzKT live supply — `queued` — priority **low** (gated on Tezos faucet mainnet origination)
- [ ] (X) Review CC's Battler Phase 1 implementation vs design doc — `queued` — after Phase 1 Battler lands on preview

---

## Completed this session (2026-04-17)

### v1 → v2 cutover
- [x] v1 snapshot preserved at commit `7fea01c` (rollback available if v2 ever needs to be reverted)
- [x] `blocks-rebuild` merged, `main` now serves v2 at `pointcast.xyz`

### Shadownet origination (pre-mainnet proof)
- [x] Visit Nouns FA2 originated on Shadownet — `KT1S8BbKPzWjTRQgnc986Az8A187V886UtK5`
- [x] First mint_noun(137) confirmed — `onh9QXxTcPQaD61tpRsz7sE8LCoHGfEFkTEwVKTm51DYd1KDXZT`
- [x] Node + InMemorySigner pattern proven; scripts reusable for mainnet

### v2 shipped
- [x] 48 Blocks across 9 channels (FD, CRT, SPN, GF, GDN, ESC, FCT, VST, BTL)
- [x] BlockLayout, BlockCard, channel chip bar, auto-fit grid, drag-reorder, PresenceBar, MintButton
- [x] `/for-agents`, `/blocks.json`, `/sitemap-blocks.xml`, per-channel RSS + JSON Feed v1.1
- [x] `/b/[id]` permalinks with JSON-LD + alternates + machine-readable endpoints
- [x] `/status` live agent activity page, `/battle` Nouns Battler Phase 1, `/404` VST-themed
- [x] Per-block OG images (sharp-generated PNGs at 1200×630) for every block
- [x] 20 real Tezos NFTs imported as SPN LINK blocks (0300–0319) from TzKT
- [x] Block 0228 wires /drum into the v2 grid (SPN LINK)
- [x] Spotify iframe facade — lifts ~6s cold load off the home grid

### Agent cycles
- [x] (M) End-to-end QA: 11 findings, 5 blockers all closed same-day, response log appended
- [x] (X) Phase 1 spec review: 8 blocking items all addressed
- [x] (X) Nouns Battler design + prototype sketch + Phase 1 implementation review

### Mainnet pipeline — ✅ LIVE
- [x] Funding arrived 2026-04-17T20:48 (25 ꜩ from tz2FjJhB → tz1PS4W throwaway)
- [x] **Visit Nouns FA2 originated: `KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh`**
- [x] 10 starter Nouns minted (seeds 1, 42, 99, 137, 205, 417, 420, 777, 808, 1111)
- [x] `scripts/post-mainnet-auto.sh` completed full cascade
- [x] Block 0229 commemorative flipped draft:false with real KT1
- [x] `set_metadata_base_cid` on-chain via op `oorQrDKPGmDqpq8QnicAuskcwxLMQX4mqqeZ2PRh15ob6J3uP4F` → future mints have working URIs
- [x] `functions/api/tezos-metadata/[tokenId].ts` serves TZIP-21 JSON per token
- [x] 10 mint visualized as Blocks 0230-0239 via `scripts/import-visit-nouns.mjs`
- [x] `/collection/visit-nouns` gallery page (live TzKT data)
- [ ] (MH) Proto-mint decision: the 10 pre-metadata-fix mints have their URIs frozen on-chain and show "no cover available" on objkt. Three paths:
  - (a) accept as archaeology; future mints work
  - (b) re-originate v2 contract + re-mint (4 ꜩ; throwaway has 14.8 ꜩ)
  - (c) SmartPy patch + contract upgrade (most work)
- [ ] (MH) Admin transfer: `node scripts/transfer-admin.mjs` when ready

### Wallet + Login (shipped — multi-wallet pass)
- [x] WalletChip in home masthead — Beacon-native picker, no wallet enumeration in the dropdown
- [x] Multi-wallet storage: `pc:wallets` array + `pc:wallet-active` + legacy `pc:wallet` mirror for MintButton back-compat
- [x] WalletChip dropdown shows active wallet + remembered list + switch/add/disconnect + profile link
- [x] TzKT-backed visualizer on active wallet (balance, NFTs held)
- [x] `/profile` page — every remembered wallet visualized with live TzKT stats (balance, NFTs, ops, last-activity), switch / remove actions, objkt + TzKT deep-links
- [x] Beacon SDK 24.2 network-property fix applied in `src/lib/tezos.ts`
- [x] MintButton dispatch extended to `mint()` entrypoint alongside `mint_noun` / `claim`
- [x] `/drum` ported to new `DrumLayout` — v2 shell (white bg, Inter + JetBrains Mono, WalletChip in header) while keeping Tailwind + warm palette available for internal drum classes
- [x] Stripped-HTML agent mode middleware — AI crawlers (`ai:*` UAs) get CSS/JS removed while JSON-LD stays intact. ~12% smaller payload verified on pointcast.xyz.

### Prize Cast (no-loss prize savings) — ARCHITECTED
- [x] PM brief: `docs/pm-briefs/2026-04-17-prize-cast-on-tezos.md`
- [x] `contracts/v2/prize_cast.py` — 463-line SmartPy v0.24 contract (Codex delivery)
- [x] `scripts/deploy-prize-cast-ghostnet.mjs` — ghostnet origination
- [x] `contracts/v2/README-prize-cast.md` — design doc + randomness tradeoffs
- [ ] Compile via smartpy.io / docker (not installed locally)
- [ ] Originate on ghostnet for smoke test
- [ ] Frontend `/cast` page (2nd Codex session, after ghostnet deploy)

### Battler Phase 2 — ✅ SHIPPED
- [x] localStorage match log capped at 50 entries
- [x] Export-match-as-JSON button on completion
- [x] `/battle-log` — dedicated archive page
- [x] `/battle.json` — agent-readable rules + card-of-day + entrypoints

### Engineering polish (shipped today)
- [x] Block 0228 — SPN LINK wires /drum into the v2 grid
- [x] Spotify iframe facade on LISTEN-embed cards (Manus QA 3.1)
- [x] Dead IPFS gateway (cloudflare-ipfs) → objkt CDN + ipfs.io fallback across 20 NFT blocks (0300-0319)
- [x] LINK block dead-click fix on `/b/[id]` — external-CTA strip for non-MINT blocks
- [x] Image sizing on detail pages (52vh cap + object-fit:contain)
- [x] READ block article typography (paragraphs, 16px mobile / 17px desktop)
- [x] Block 0168 — Hemp THC terminal dispatch (GF READ)
- [x] Block 0169 — Streetwear terminal dispatch (FD READ)
- [x] `/for-agents` updated with new endpoints + live contract record

### Production URL
**`https://pointcast.xyz`** — v2 live. Preview URL `blocks-rebuild.pointcast.pages.dev` retired with cutover.

---

## Evening run 2026-04-17 (autonomous — Mike napping) ✅ SHIPPED

### Battler 2.0 (Codex medium-reasoning run)
- [x] Result banner with +++ GLORY / --- LOSS flourish
- [x] Rematch / New Challenger / Share buttons
- [x] Stat bars (ATK/DEF/SPD/FOC) + HP feedback animations
- [x] Round-call glyphs, replay state via `?card=N&challenger=M` querystring

### /cast UI cool-ification (within v2 bands)
- [x] Bloomberg-terminal treatment — monumental display headline, 4-tile metric terminal row
- [x] Live countdown (TICK every 1s) for Next Draw
- [x] 7-day rhythm bar (today tinted cst-50, Sunday filled ink)
- [x] Mechanism diagram — Deposit → Stake → Accrue → Draw
- [x] Past-winners receipt tape with LATEST tag on top row
- [x] Pending-band above PrizeCastPanel when contract absent
- [x] Accent: local --cst-600 #0F6E56 (GDN green, "money in motion")

### Card of the Day rotation
- [x] `src/lib/battler/card-of-the-day.ts` — 21-Noun curated roster, dayIndex % 21
- [x] `battle.astro` + `battle.json.ts` read from rotation module
- [x] CotD banner below hero on /battle — portrait tile + date + rotation info
- [x] `/battle.json` includes date, dateLabel, note, rosterIndex

### /collection index
- [x] Per-contract filter chip row above grid (top 12 by count)
- [x] Client-side filter, no reload

### /archive (new page + endpoint)
- [x] Chronological index of every block with channel + type filters + search
- [x] Month dividers in the stream, channel-colored rows
- [x] `/archive.json` — byMonth structure for cadence reasoning

### /editions (new page + endpoint)
- [x] Four-lane dashboard: ON-CHAIN LIVE · LISTED MARKET · FAUCET DAILY · PLANNED INCOMING
- [x] Live TzKT totalSupply for Visit Nouns FA2
- [x] Listed market inventory (from market.json), FAUCET blocks, DRUM + Prize Cast placeholders
- [x] `/editions.json` — machine mirror with per-token listings

### Agent surfaces + OG
- [x] `/for-agents` adds archive, editions, cast, collection entries + Agent mode section (X-Agent-Mode header doc)
- [x] OG pipeline extended: `/images/og/{cast,editions,archive,battle,collection,drum}.png`
- [x] Each page overrides `image=` to reference per-page OG card
- [x] Homepage footer endpoints adds /archive, /editions, /cast

### Still open (inherited + new)
- [ ] (MH) Proto-mint decision (a/b/c) — carryover
- [ ] (MH) SmartPy compile path — docker install, smartpy.io paste, or dedicated VM — blocks DRUM ghostnet + Prize Cast mainnet origination
- [ ] (MH) Admin transfer ceremony (`node scripts/transfer-admin.mjs`)
- [ ] (CC) /drum UI polish — deferred until DRUM token lands (compile-blocked)
- [ ] (X) Battler Phase 3 commemorative mint — gated on admin transfer
- [ ] (CC) Consider a proper CH.CST channel in channels.ts (requires MH decision per AGENTS.md schema-change rule)
