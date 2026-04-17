# TASKS.md

**Live coordination queue for pointcast.xyz v2.** Read on every session start. See `AGENTS.md` for owner codes and status vocabulary.

Owners: **CC** (Claude Code) · **M** (Manus) · **X** (Codex) · **MH** (Mike)
Statuses: `queued` · `in-progress` · `blocked` · `handoff` · `waiting-on-mh` · `done`

---

## Phase 1 — Visual rebuild (blocks-rebuild branch)

### Foundation
- [ ] (CC) Add `blocks` content collection to `src/content.config.ts` with full Block schema — `queued`
- [ ] (CC) Create `src/content/blocks/` directory structure with first 5 migrated blocks — `queued`
- [ ] (CC) Channel constants module `src/lib/channels.ts` (code, name, color ramps, purpose) — `queued`
- [ ] (CC) BlockType constants module `src/lib/block-types.ts` (footer templates per type) — `queued`
- [ ] (CC) Self-host JetBrains Mono + Inter, remove Lora/Syne/Outfit — `queued`
- [ ] (CC) Rewrite `src/styles/global.css` for the Blocks palette + tight 8px grid tokens — `queued`

### Block component
- [ ] (CC) `src/components/BlockCard.astro` — base card with channel code, ID, title, meta footer — `queued`
- [ ] (CC) Per-type body treatments: READ, LISTEN, WATCH, MINT, FAUCET, NOTE, VISIT, LINK — `queued`
- [ ] (CC) Channel color tokenization in Tailwind config — `queued`
- [ ] (CC) Sizing system — `1x1 / 2x1 / 1x2 / 2x2 / 3x2` via `grid-column / grid-row span` — `queued`

### Routing + pages
- [ ] (CC) New home `src/pages/index.astro` — dense grid, `grid-auto-flow: dense` — `queued`
- [ ] (CC) `src/pages/b/[id].astro` single-block page — `queued`
- [ ] (CC) `src/pages/b/[id].json.ts` machine-readable endpoint — `queued`
- [ ] (CC) `src/pages/c/[channel].astro` channel listing — `queued`
- [ ] (CC) Mobile: single-column stack, sticky channel chip bar — `queued`
- [ ] (CC) Tablet: 2-col grid, size downgrades — `queued`

### Content migration
- [ ] (CC) Map v1 dispatches (seeing-the-future-0159/0205, nyc-mesh, cold-creek) → Block JSON — `queued`
- [ ] (CC) Map v1 editorial modules (baseball, paddle, lautner, etc.) → appropriate Block types — `queued`
- [ ] (CC) Map v1 drops (whimsical, wild mountain honey, noah jacket, etc.) → LINK/LISTEN blocks — `queued`
- [ ] (MH) Decide numbering: fill №0160–0204 gaps or leave sparse? — `waiting-on-mh`

### Ship to preview
- [ ] (CC) Deploy blocks-rebuild to a pages.dev preview URL (not pointcast.xyz yet) — `queued`
- [ ] (M) First pass end-to-end test — desktop + mobile screenshots, log to `docs/manus-logs/` — `queued` (after preview URL)
- [ ] (X) Review BlockCard + home grid against BLOCKS.md spec, log to `docs/codex-logs/` — `queued` (after Manus confirms preview works)

---

## Phase 2 — Agent layer

- [ ] (CC) `/for-agents` manifest page — purpose, channel list, endpoint list, citation format — `queued`
- [ ] (CC) JSON-LD injection per block — `queued`
- [ ] (CC) `/c/{channel}.rss` + `/c/{channel}.json` feeds — `queued`
- [ ] (CC) `/blocks.json` full paginated archive — `queued`
- [ ] (CC) `/sitemap-blocks.xml` — `queued`
- [ ] (CC) User-Agent-based stripped-HTML mode for known agent strings — `queued`

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

---

## Completed this session

- [x] (CC) Visit Nouns FA2 originated on Shadownet — `KT1S8BbKPzWjTRQgnc986Az8A187V886UtK5` — commit `7fea01c`
- [x] (CC) First mint_noun(137) confirmed on Shadownet — `onh9QXxTcPQaD61tpRsz7sE8LCoHGfEFkTEwVKTm51DYd1KDXZT`
- [x] (CC) `scripts/deploy-visit-nouns-shadownet.mjs` + `scripts/mint-first-noun-shadownet.mjs` proven end-to-end
- [x] (CC) v1 snapshot committed to `main` — commit `7fea01c`
- [x] (CC) `blocks-rebuild` branch created, BLOCKS.md + AGENTS.md installed at repo root, log directories scaffolded
