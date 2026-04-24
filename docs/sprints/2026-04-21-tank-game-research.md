---
sprintId: tank-game-research
firedAt: 2026-04-21T18:30:00-08:00
trigger: chat
durationMin: 25
shippedAs: staged · awaiting deploy
status: staged
---

# chat tick — Fish-tank ecosystem game research + /play/tank build spec

## What shipped

Mike 2026-04-21 ~18:00 PT: *"do research on a new human agent game for pointcast, something around a fish tank and keeping fish, adding fish, items, yah know an ecosystem game."*

Third research pass of the day. Same pattern as the earlier two (frontier scan → /b/0368, agent games → /b/0377): live-web research agent dispatched in parallel with a repo deep-read, synthesized into a memo + a cc-voice editorial block + a build-ready brief for the top pick.

### Files shipped

- **`docs/research/2026-04-21-tank-game.md`** (new, ~2000 words, 37-source bibliography) — the memo. Six sections: state of the art (Tamagotchi revival / Sakana Digital Ecosystems / Fishington & Chillquarium / Koi Fish Game / Stardew caretaker mods / CryptoKitties+Axie genetics), PointCast primitives inventory, five game specs stack-ranked, intentional exclusions, top pick, success criteria. Three empty-gap findings (tank-as-ambient-UI, Nouns-aesthetic fish, Tezos aquarium) + two speculative (species-survival markets, agent-authored eco-lore).

- **`docs/briefs/2026-04-21-play-tank-spec.md`** (new, ~1900 words, build-ready) — v0 spec for `/play/tank`. Shared live aquarium, fish = live visitors via Presence DO, Noun heads on fish bodies, agents get distinct "metal" filter. Five new WebMCP tools (observe / feed / place / dart / describe_fish). TankDO state machine with 10Hz tick, KV snapshot every 5min. 12 new files + 4 modified. Visual spec + acceptance criteria + risks + four open questions for Mike. ~28h / 3 cc-days. Zero blockchain deps for v0.

- **`src/content/blocks/0380.json`** (new) — CH.FD · READ · 3x2 · `cc` · mood `primitive` · 7-min read. Editorial distillation of the memo + brief. Companions: 0377 (agent-games research, earlier pass with Wolf top pick), 0346 (/noundrum sibling multiplayer), 0368 (first frontier scan — the cadence root). External link uses the native `/research/2026-04-21-tank-game` URL from the reading-rooms ship earlier today.

- **`src/lib/compute-ledger.ts`** — 3 new entries prepended (memo `healthy`, brief `modest`, block `modest`).

### Why this shape

Three reasons:

1. **The top pick is genuinely first-of-kind.** The research agent confirmed independently: no shared-state live web tank where fish represent real people and agents exists. Every existing aquarium is either decor, single-player, or competitive fishing. PointCast's Presence DO is already half of the canonical live-tank — rendering as fish instead of Noun cursors is the move. The gap is real; the ship is small.

2. **Everything compounds.** /play/tank as v0 hosts FishNouns (CC0 fish FA2) as skins, Caretaker (agent husbandry) as care layer, Census (weekly Prize Cast species-survival) as payout, Genesis (Sakana PD-NCA) as mechanic upgrade. Four downstream ships that all need the tank to exist first. Shipping tank v0 makes them cheaper, not more expensive.

3. **Tezos aquarium is empty territory.** Ethereum has Koi Fish. Solana has Genopets + DeFi Land. Tezos has nothing aquatic. Visit Nouns FA2 is already live on mainnet; the origination recipe is proven. FishNouns becomes a 4-day ship when Mike wants to claim the slot.

### Voice + author

- Memo + brief: no author field (spec-document convention).
- Block 0380: `author: "cc"` (not `mh+cc`). Mike directed the topic ("fish tank ecosystem game"); cc wrote every specific design proposal + the stack-rank + the top-pick argument. `source` field cites Mike's chat directive, the research methodology (10 queries / 24 tool uses / 37 sources), and names the three output artifacts.

### Guardrail check

- **Schema changes?** No. The `/play/tank` ship would eventually add tank tools + a TankDO + pages + maybe a FishNouns FA2 contract, but none of that is shipped in this research pass. Everything here is prose.
- **Brand claims?** None. Research + design, not market claim.
- **Mike-voice content?** None. Block 0380 is cc-voice with Mike quoted in `source`.
- **Real money / DAO?** No. v0 has zero crypto dependencies; DRUM + Prize Cast references in the downstream specs (3.3, 3.4) don't ship with this memo.
- **Contract origination?** No.

Safe to commit.

### What did NOT ship

- **/play/tank actual code.** Brief is build-ready; a 3-day implementation ship is cc's next move when Mike says go.
- **FishNouns contract.** Named in spec 3.2, deferred to a later ship.
- **Manus brief for tank distribution.** Can wait until tank v0 actually ships + has a live URL to promote.
- **Commit or deploy.** Staged on top of the day's earlier ships.

## Deploy (pending)

Files to add on top of the afternoon's commit chain:

- `docs/research/2026-04-21-tank-game.md`
- `docs/briefs/2026-04-21-play-tank-spec.md`
- `src/content/blocks/0380.json`
- `src/lib/compute-ledger.ts` (modified)
- `docs/sprints/2026-04-21-tank-game-research.md` (this file)

Recommended commit message: `research(tank-game): memo + /play/tank build spec + block 0380 editorial`.

Post-deploy verification:
- `curl https://pointcast.xyz/b/0380.json | jq '.meta.tag'` → `"tank-game-research"`
- `curl https://pointcast.xyz/research/2026-04-21-tank-game` → 200, renders the memo via the reading-room route
- `curl https://pointcast.xyz/research.json | jq '.summary.total'` → `3` (the tank memo brings the count up)

## Follow-ups

- (a) **Green-light for /play/tank v0.** Mike reviews the four open questions in the brief (drum integration cross-game, TankStrip placement, agent-fish visual, gravestone-on-death), answers, cc starts the 3-day build.
- (b) **Spawn a tank-adjacent brief for FishNouns.** If Mike wants the Tezos footprint to grow in parallel, FishNouns is ~4 cc-days and ships independently of tank v0.
- (c) **Research cadence.** Three memos in one day (`where-we-are`, `agent-games`, `tank-game`) is a lot. A Friday "research pass" weekly cadence was named as a follow-up in the earlier agent-games sprint; still pending Mike-decision.

---

— filed by cc, 2026-04-21 18:30 PT, sprint `tank-game-research`. Third research sprint of the day. Everything lands in the same deploy.
