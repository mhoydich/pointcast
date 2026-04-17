# Session log — 2026-04-17

A running log of what shipped across today's multi-agent execution.

---

## Morning — v1 QA cleanup → mainnet prep

- Manus QA pass: 11 findings, 5 blockers all closed same-day (404, sitemap filter, H1 tags, noun frame for pale nouns on white cards, response log in `docs/manus-logs/2026-04-17.md`)
- Codex Battler Phase 1 review: 8 blocking items addressed
- Codex ran 3× in parallel earlier and hung silently 3h each under xhigh reasoning — diagnosed as model × concurrency, not a Codex bug; `timeout` wrapper doesn't exist on macOS
- Nouns Battler (Codex design + Phase 1): `/battle` live, stat derivation, 3-stance best-of-3 resolver, 4 MH decisions surfaced for Phase 3

## Afternoon — mainnet cascade

- Mike sent 25 ꜩ from `tz2FjJhB…xdFw` → `tz1PS4W…cKp1` throwaway
- `scripts/post-mainnet-auto.sh` (PID 96871) detected + cascaded:
  1. **Origination** → `KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh` at 2026-04-17T20:48:13Z
  2. **Wire script** → contracts.json + Block 0229 flipped `draft:false` + KT1 substituted
  3. **Batch-mint** → 10 starter Nouns (137, 205, 420, 417, 1, 42, 99, 777, 808, 1111), each confirmed
  4. **Build + deploy** → 91 pages live on pointcast.xyz

- Bug found post-cascade: all 10 tokens show "no cover available" on objkt
  - Root cause: contract bakes per-token URI at first-mint time using `metadata_base_cid`, which was `""` at origination. 10 tokens permanently frozen with `/<tokenId>.json` URIs (contract has no per-token metadata override).
  - Fix (for future mints): `scripts/set-metadata-base-cid.mjs` + `functions/api/tezos-metadata/[tokenId].ts` — confirmed on-chain via op `oorQrDKPGmDqpq8QnicAuskcwxLMQX4mqqeZ2PRh15ob6J3uP4F`
  - **Proto-mint decision still waiting on MH**: (a) accept as archaeology / (b) re-originate v2 contract + re-mint / (c) SmartPy patch with per-token metadata entrypoint

## Afternoon — user-facing polish

- Block 0228 (Drum Room) wires /drum into the grid as SPN LINK
- Block 0168 (Hemp THC) + Block 0169 (Streetwear) — terminal-aesthetic dispatches from Mike's local-agent sessions, wired into the Blocks architecture with permalinks + external HTML view
- Blocks 0230–0239 — mint visualizations, one per on-chain Noun, regeneratable via `scripts/import-visit-nouns.mjs`
- Spotify iframe facade (Manus QA 3.1): ~6s cold load lifted off the home grid
- LINK block dead-click fix: external-CTA strip on `/b/[id]` for non-MINT blocks
- Image sizing / READ paragraph typography / mobile-first block detail pass
- Dead `cloudflare-ipfs` gateway → objkt CDN + `ipfs.io` fallback for 20 Tezos NFT blocks (0300-0319)

## Late afternoon — wallet + agent + prize

- **WalletChip** in home masthead, multi-wallet memory:
  - `pc:wallets` array + `pc:wallet-active` pointer + legacy `pc:wallet` mirror
  - Beacon-native picker (dropped the 4-wallet enumeration — Beacon shows it)
  - Active-wallet visualizer: balance + NFT count from TzKT
  - "Connect another wallet" button, "remembered" list with soft-switch
  - `/profile` page: full-card view per wallet with balance, NFTs, ops, last-activity, switch / remove / TzKT / objkt deep-links

- **DrumLayout**: v2 shell for /drum (white bg, self-hosted Inter/JetBrains Mono, WalletChip in header), keeps Tailwind utilities functional for the 71KB internal page

- **/collection/visit-nouns**: gallery page pulling live TzKT at build, 10-Noun grid with current holders, objkt + TzKT deep-links per token

- **Stripped-HTML agent mode**: AI crawler UAs (`ai:*`) get CSS + JS removed at the Pages middleware layer via HTMLRewriter. JSON-LD preserved. ~12% byte reduction verified.

- **/for-agents**: new endpoints + live contract record + planned surfaces surfaced

- **Prize Cast** (PoolTogether-on-Tezos, PM brief by CC, session 1 contract by Codex):
  - PM brief: `docs/pm-briefs/2026-04-17-prize-cast-on-tezos.md`
  - Contract: `contracts/v2/prize_cast.py` — 463 lines, SmartPy v0.24, weak-hash randomness, full test scenario
  - Ghostnet deploy: `scripts/deploy-prize-cast-ghostnet.mjs`
  - Design doc: `contracts/v2/README-prize-cast.md`
  - Codex session 2 (frontend) in flight as of ~14:45 PT

## Still standing / MH actions

- **Proto-mint decision** (a/b/c)
- **Admin transfer** — `node scripts/transfer-admin.mjs`
- **Prize Cast compile** on smartpy.io or via docker (SmartPy CLI not installed locally)
- **Prize Cast ghostnet origination** after compile
- **Manus QA dispatch** — brief in `docs/next-agent-briefs-2026-04-17.md` ready for manus.im

## Counters

- **Commits today**: ~20 (rapid-fire post-mainnet sprint)
- **Live pages**: 104 on pointcast.xyz (started session at 48)
- **On-chain ops**: origination + 10 mints + set_metadata_base_cid = 12 transactions from throwaway
- **Throwaway balance**: 14.80 ꜩ (started 25; spent ~10 on origination + mints + metadata setter)
- **Blocks in the archive**: 49 across 9 channels (FD/CRT/SPN/GF/GDN/ESC/FCT/VST/BTL)
- **Agents that contributed**: CC (primary), X (Battler P1, P2, Prize Cast contract, Prize Cast frontend), M (QA report)

---

*Auto-generated at session end. The state-of-record for what actually shipped today.*
