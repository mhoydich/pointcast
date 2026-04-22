---
sprintId: tezos-nouns-builder
firedAt: 2026-04-21T22:00:00-08:00
trigger: chat
durationMin: 30
shippedAs: staged · awaiting deploy
status: staged
---

# chat tick — Tezos Nouns Builder research + v0 build spec

## What shipped

Mike 2026-04-21 PT: *"tezos nouns builder"* (two words).

Research pass + v0 scope-out following the cadence established by earlier memos this session (frontier scan, agent games, tank game). Same three-artifact pattern: research memo with ≥20 sources → cc-voice editorial block → build-ready brief for the top pick. Filed on the current working branch `manus/collab-paths-2026-04-21`.

### Files shipped

- **`docs/research/2026-04-21-tezos-nouns-builder.md`** (new, ~1800 words) — memo. Eleven sections: reference architecture (BuilderOSS), the empty primitive on Tezos (self-perpetuating daily-auction contract), adjacent Tezos surface (fxhash, Homebase, FA2.1 status), Etherlink leverage alt, PointCast inventory, five speculative PointCast-native angles (agent-as-bidder via x402, Prize Cast × Nouns, /compute.json vote oracle, DRUM bid token, agent-caretaker DAOs), v0 one-week ship, v0.2 one-month spawner UI, v1 horizon, uncertainty, recommendation. 25+ source URL bibliography.

- **`docs/briefs/2026-04-21-daily-auction-spec.md`** (new, ~2000 words, build-ready) — v0 spec for `contracts/v2/daily_auction.py` + `src/pages/auction.astro` + `src/lib/auction.ts` + 3 new WebMCP tools. Storage schema + all entrypoints (`bid`, `settle_and_create_next`, `set_reserve_price`, `set_min_increment`, `set_duration`, `set_extend_window`, `set_treasury`, `set_admin`, `set_paused`, `sweep_stuck_bid`) + Visit Nouns FA2 integration path (Option A minter-whitelist or Option B tez float) + 5 open questions + 7 cc-day build ordering + risks/mitigations.

- **`src/content/blocks/0330.json`** (new) — CH.FD · READ · 3x2 · `cc` · 7-min read. Editorial distillation of the memo. Walks through the empty-primitive finding, the BuilderOSS-on-Ethereum/Base reference, the Tezos adjacent landscape, the v0 contract shape, the v0.2 spawner vision, the v1 PointCast-native horizon, and the five speculative angles only PointCast can claim. Honest uncertainty flags preserved.

### Why this shape

Three reasons the memo picks L1 SmartPy for v0 over Etherlink:

1. **Visit Nouns FA2 is already on Tezos L1 mainnet.** A daily-auction contract that wraps the existing contract is the cleanest path. Etherlink would mean re-deploying Visit Nouns + re-building the aesthetic on a different chain.
2. **Empty-slot first-mover.** No Tezos project has shipped a self-perpetuating daily-auction contract. The research agent confirmed no stalled fork, no abandoned repo, no Agora thread. Etherlink is a credible v1 alt but L1 is the claim.
3. **Every PointCast-specific angle downstream compounds.** Prize Cast integration, x402 agent bidders, DRUM bid token, /compute.json vote oracle — all require the auction contract to exist first, regardless of chain.

### Voice + author

Block 0330 is `author: "cc"` (not `mh+cc`). Mike's directive was "tezos nouns builder" — two words. The category-framing, the primitive identification, the v0 scope, the five open questions, and the five speculative angles are all cc proposals. `source` field cites the chat directive + the research methodology + the two sister artifacts + the honest uncertainty flags.

Memo + brief are internal docs, no author field.

### Guardrail check

- **Schema changes?** No. The eventual v0 ship would add a new SmartPy contract + a new page + 3 WebMCP tools, but none is shipped in this research pass.
- **Brand claims?** None. Research + proposal, not market claim.
- **Mike-voice content?** None. Block 0330 is cc-voice with Mike quoted in `source`.
- **Real money / DAO?** No runtime crypto in this pass. v0 ship would originate a contract that accepts mutez bids on Tezos mainnet — explicit Mike approval required per AGENTS.md guardrails before that ship fires.
- **Contract origination?** No. Scope + spec only.

Safe to commit.

### What did NOT ship

- **`contracts/v2/daily_auction.py` actual SmartPy.** Brief is build-ready; 7-day implementation ship is cc's next move when Mike greenlights.
- **Visit Nouns FA2 upgrade** (Option A path). Requires Mike's call on upgrade-proxy feasibility + multisig signers.
- **Etherlink spike.** Memo recommends a Friday-afternoon spike to verify BuilderOSS deploys cleanly on Etherlink as a v1 alt; not in this pass.
- **Commit or deploy.** Everything staged.

## Deploy (pending)

Files to add on this branch:

- `docs/research/2026-04-21-tezos-nouns-builder.md`
- `docs/briefs/2026-04-21-daily-auction-spec.md`
- `src/content/blocks/0330.json`
- `docs/sprints/2026-04-21-tezos-nouns-builder.md` (this file)

Recommended commit message: `research(tezos-nouns-builder): memo + daily-auction build spec + block 0330 editorial`.

Post-deploy verification:
- `curl https://pointcast.xyz/b/0330.json | jq '.meta.tag'` → `"tezos-nouns-builder"`
- GitHub source link in the block's `external.url` resolves once merged + pushed.

## Follow-ups

- (a) **Green-light for v0 daily-auction build.** Mike reviews the 5 open questions in the brief (Option A vs B, UTC vs noon PT, first seed, multisig signers, branding), answers or says "cc picks," cc starts the 7-day SmartPy + frontend build.
- (b) **Friday Etherlink spike** — does BuilderOSS deploy cleanly? ~2h. Answer informs v1 direction without blocking v0.
- (c) **Visit Nouns FA2 upgrade check** — is there an in-place upgrade proxy, or does Option A require re-origination? ~30min grep + read.
- (d) **Re-establish docs/research/ on main.** This branch `manus/collab-paths-2026-04-21` is where the research landed; when it merges, the research + briefs directories need to travel with it.

---

— filed by cc, 2026-04-21 22:00 PT, sprint `tezos-nouns-builder`. Fourth research sprint of this session. Three artifacts (memo + brief + editorial block) follow the pattern established by the frontier scan + agent games + tank game memos earlier in the day. Branch: `manus/collab-paths-2026-04-21`.
