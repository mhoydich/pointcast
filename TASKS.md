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

### Mainnet pipeline — armed, awaiting funding
- [x] `scripts/deploy-visit-nouns-mainnet.mjs` — tested path, identical to Shadownet
- [x] `scripts/post-mainnet-wire.mjs` — writes KT1 into `src/data/contracts.json`
- [x] `scripts/post-mainnet-batch-mint.mjs` — mints [137, 205, 420, 417, 1, 42, 99, 777, 808, 1111]
- [x] `scripts/post-mainnet-auto.sh` — polling daemon chaining origination → wire → mint → build → deploy (running as PID 96871 via nohup)
- [ ] Funding: ≥25 ꜩ to `tz1PS4WgbYCKcKnfbfMNSH44JfrnFVhkcKp1` — `waiting-on-mh` (Daniel call in progress)

### Production URL
**`https://pointcast.xyz`** — v2 live. Preview URL `blocks-rebuild.pointcast.pages.dev` retired with cutover.
