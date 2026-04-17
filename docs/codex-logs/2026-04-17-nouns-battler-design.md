# Nouns Battler — design doc

Author: Codex · 2026-04-17 · PointCast v2

## Concept

**Nouns Battler** is a deterministic, seed-driven turn-based duel where every Noun on-chain is already a fighter — stats and move-set derived purely from the 5-trait seed (background / body / accessory / head / glasses). No minting a new roster, no speculation layer: if a Noun exists, it fights, and the result is the same for everyone because the math is pure. It reads like *Pokémon × Bloomberg Terminal × Hearthstone on a teletext page* — dense mono metadata, one screen, hard corners, channel-colored accents, noun.pics SVGs where HP bars live. Distinctive because (a) the entire Nouns corpus (~2000 seeds and growing daily) becomes a playable roster for free, (b) battles are provably fair and cacheable client-side, and (c) each match collapses into a first-class PointCast Block so the ladder *is* the content stream.

## Core mechanic

- **Deterministic duel, 3 rounds.** Each round both Nouns pick one of three stances — **Strike / Guard / Focus** — and reveal simultaneously. Damage resolves via type matchup × stat × stance table. First to 0 HP loses, or highest HP at round 3 wins.
- **Rock-paper-scissors with numbers.** Strike beats Focus, Focus beats Guard, Guard beats Strike — but the *magnitude* comes from stats and type matchup, so a weak stance pick against a type-advantaged opponent can still land.
- **No hidden state, no RNG.** Given `(seedA, seedB, stances[])`, the outcome is reproducible anywhere. Replays are just the input tuple; clients re-derive the play-by-play.

## Stat derivation (from seed only)

Every Noun seed is 5 integers indexing into the traits arrays. We map each trait to a **type** and to a contribution on one of four stats (ATK, DEF, SPD, FOC). Stats are 1–99, balanced around 50.

### Derivation formula (pseudocode)

```
seed = { bg, body, accessory, head, glasses }

// Primary type comes from HEAD (the most visually distinctive trait).
// Secondary type comes from GLASSES.
primaryType   = HEAD_TYPE_MAP[head]
secondaryType = GLASSES_TYPE_MAP[glasses]

// Stats: each trait nudges one stat; clamp 1..99, base 50.
ATK = 50 + headContrib(head) + accessoryContrib(accessory) + bodyParity(body)
DEF = 50 + bodyContrib(body) + backgroundContrib(bg)
SPD = 50 + glassesContrib(glasses) - bodyContrib(body) * 0.5
FOC = 50 + accessoryContrib(accessory) + (glasses % 7 === 0 ? +8 : 0)
HP  = 80 + DEF * 0.4        // 80 baseline, armored Nouns tankier
```

All contributions are small deterministic integers in `[-12, +12]` keyed off the trait index. Full tables live in `src/lib/battler/stat-derivation.ts` (Phase 1 deliverable) — prototype shows one worked example inline.

### Type assignment table (head → primary type)

Nouns heads are themed (crab, laser, helicopter, skull, taco…). Grouped into 5 types:

| Type   | Color    | Head families                                     | Counters |
|--------|----------|---------------------------------------------------|----------|
| WATER  | cyan     | crab, whale, shark, sushi, rainbow, coral         | BEAM     |
| BEAM   | magenta  | laser, ray, lightbolt, laptop, mirror             | ARMOR    |
| ARMOR  | gunmetal | skull, helmet, tank, brick, toaster, hardhat      | WILD     |
| WILD   | green    | bear, lion, bigfoot, cactus, plant, snake         | WATER    |
| FEAST  | amber    | taco, pizza, burger, bagel, icecream, poop        | any (±0) |

FEAST is the neutral/wild-card — slight HP bonus, no type bonuses, no penalties. It keeps the joke traits viable and avoids the "trash tier" problem.

**Matchup multiplier:** ×1.5 when attacker's primary type beats defender's primary type; ×0.67 when reversed; ×1.0 otherwise. Secondary type from glasses contributes ±10% flavor.

## Match format

**Best of 3 stance rounds, single match = single Block.** Not a ladder in v1 — the ladder is an emergent property of the Block stream because every match becomes a permanent BTL-channel block with result metadata. Daily "Card of the Day" pairs two hand-picked Nouns (or random from a curated pool) and anyone can replay locally. Tournaments are a v2 feature (8-Noun bracket as a 2×2 Block grouping).

*Why:* best-of-3 stance is long enough for meaningful counter-reads, short enough to render in a single-screen Block. Ladders require persistent identity and matchmaking — v2 problem.

## Economy

**Tezos FA2, PointCast-native, bragging rights first.**

- **Every match produces a BTL block** (`type: NOTE`) with the seed pair, stances, and outcome in `meta`. Free. The archive is the trophy shelf.
- **"Card of the Day"** is a FAUCET block: claim the match recap as a 1/1 commemorative FA2 token (gas-only, daily reset, shares the existing Visit Nouns contract tokenId pattern). Winner's seed is the token art.
- **Rarity editions (v2)** — when a matchup has a provably notable property (e.g., 99-ATK Noun wins in round 1), auto-mint an open-edition MINT block. Criteria codified so it's not curatorial; the math picks them.
- **No separate token.** No BATL coin. No Ethereum bridge. One FA2 contract, tokenIds allocated from the existing Visit Nouns / PointCast collection. This keeps the collection story tight: *every token on this contract is a PointCast artifact — visits, daily claims, and now match recaps.*

## UX sketch — battle screen

Channel: **BTL** (see recommendation below). One-screen, Bloomberg-dense, hard corners, JetBrains Mono metadata.

```
┌────────────────────────────────────────────────────────────────────┐
│ CH.BTL · 0417-137v420          MATCH  04.17 · 07:22 PT  ROUND 2/3  │
├────────────────────────┬───────────────────────────────────────────┤
│                        │                                           │
│     [noun.pics/137]    │            [noun.pics/420]                │
│                        │                                           │
│   NOUN #137            │   NOUN #420                               │
│   WATER / BEAM         │   ARMOR / WILD                            │
│   ─────────────────    │   ─────────────────                       │
│   HP  98 ▓▓▓▓▓▓▓░░     │   HP  62 ▓▓▓▓▓░░░░                        │
│   ATK 58   DEF 54      │   ATK 71   DEF 66                         │
│   SPD 49   FOC 62      │   SPD 42   FOC 48                         │
│                        │                                           │
│   > STANCE: STRIKE     │   > STANCE: GUARD                         │
│                        │                                           │
├────────────────────────┴───────────────────────────────────────────┤
│ LOG                                                                │
│ R1 137·STRIKE vs 420·FOCUS → 137 hits (BEAM×ARMOR ×1.5) for 22 HP  │
│ R2 137·STRIKE vs 420·GUARD → 420 parries, counter for 14 HP        │
│ R3 ...                                                             │
├────────────────────────────────────────────────────────────────────┤
│ [ STRIKE ]  [ GUARD ]  [ FOCUS ]     SEED 137 v 420 · REPLAY · ⤓   │
└────────────────────────────────────────────────────────────────────┘
```

Conventions:
- Channel code left, match ID right, round counter always visible
- Two portrait columns equal width, stats in mono, HP bar ASCII-style
- Log pane grows downward; each line is a single rendered tuple
- Three action buttons, square corners, channel-600 border
- No avatar, no flavor text, no animations beyond 1-frame HP update

## Block integration

- **Full page at `/battle`** (parallels `/drum`). Host of the playable battle UI + "Card of the Day" hero block. Loads noun.pics SVGs, derives stats client-side, renders the one-screen duel.
- **Every completed match → NOTE block on channel BTL** at `/b/{id}` with:
  - title: `Match #137 v #420` (sentence case, no flourish)
  - meta: `{ seedA, seedB, winner, stances, rounds: [...] }`
  - default size `1x1`, `2x1` when the match was notable
- **Card of the Day → FAUCET block on channel FCT** mirrored on the battle page — reuses the existing faucet UI, different metadata.
- **Ladder (v2)** → a derived `/c/battler` listing filtered to BTL NOTE blocks, sorted by recent, with an aggregate leaderboard computed at build time. No database; the blocks *are* the ladder.
- **Agent surface** — `/battle.json` returns today's card + last 20 matches as JSON-LD so agents can cite matches (Warpcast, Claude, Perplexity get a clean feed).

## Channel decision — recommendation

**Ship BTL as a new ninth channel.** Adding a channel is an `MH decision` per AGENTS.md, so this is a question, not a unilateral call.

**Why BTL over folding into CRT:**
- CRT is pickleball — a real-world sport with real-world cadence. Putting a deterministic NFT battler alongside it dilutes the channel's editorial clarity.
- Battler will generate *volume* — potentially one NOTE per match. A high-volume generative stream deserves its own color so the grid reads legibly.
- BLOCKS.md already lists 8 channels and says "Do not add a ninth without Mike's decision" — this is exactly the kind of thing that earns one.

**Proposed BTL channel spec:**

| Field    | Value                                           |
|----------|-------------------------------------------------|
| code     | `BTL`                                           |
| slug     | `battler`                                       |
| name     | `Battler`                                       |
| purpose  | `Deterministic Nouns duels, match archive.`    |
| color600 | `#8A2432` (deep oxblood — reads as "arena")    |
| color800 | `#551620`                                       |
| color50  | `#FBEAEE`                                       |

Oxblood was picked because the existing 8 channels already cover blue/green/coral/pink/teal/purple/amber/gray; oxblood is the one primary that doesn't collide with any channel 600-stop. If MH prefers to fold into CRT with purpose updated to "Pickleball and PointCast arena sports," the design still works — just rename `BTL` → `CRT` in all refs.

## Implementation plan

### Phase 1 — playable prototype, single player vs auto-picker (week 1)
- `src/lib/battler/stat-derivation.ts` — pure function `seedToStats(seedId) → { type1, type2, ATK, DEF, SPD, FOC, HP }`
- `src/lib/battler/resolve.ts` — pure function `resolveMatch(seedA, seedB, stances[]) → { rounds, winner }`
- `src/pages/battle.astro` — the full-page BTL battle screen, client-side only, no persistence
- `src/content/blocks/BTL-0001.json` — first hand-written "Card of the Day" block
- BTL channel added to `src/lib/channels.ts` (gated on MH approval)
- Ship to preview URL alongside rest of blocks-rebuild

### Phase 2 — match archive writes (week 2)
- Local `localStorage`-backed match log on `/battle`
- Static-site build step that reads a `matches.json` input and emits one BTL NOTE block per match
- Agent feed `/c/battler.json` + `/battle.json`
- First automated daily "Card of the Day" picker (deterministic: seed of the day = Nouns auction of the day mod len)

### Phase 3 — on-chain commemorative (week 3)
- Reuse Visit Nouns FA2: mint Card of the Day as a 1/1 FA2 token, metadata = match recap JSON
- Beacon wallet connect on the battle page's faucet block
- TzKT indexer reads for `minted/supply` live

### v2 (explicitly deferred)
- Real PvP (two wallets, commit-reveal for stances so neither cheats)
- Tournament bracket (8-Noun, 2x2 Block grouping)
- Leaderboard / ladder with win-rate weighting
- Cross-channel "celebrity matches" — e.g. the faucet noun vs the visit noun of the week

## Open MH decisions this doc surfaces

1. **BTL new channel, or fold into CRT?** Recommendation: BTL. Blocker for Phase 1 merge to `main`.
2. **Card of the Day seed-pair selector** — random from full Nouns corpus, curated rotation, or "today's auction vs yesterday's auction"? Leaning toward the last one because it ties Battler into the live Nouns clock for free.
3. **Match NOTE blocks — do they count toward the monotonic block ID sequence or get their own prefix (`BTL-0001`)?** Recommendation: own prefix so the main block stream isn't swamped by auto-generated matches. Requires BLOCKS.md schema amendment.
4. **Commemorative mint cost** — free (gas only, Faucet treatment) or small paid edition (MINT type, 1–5 tez)? Leaning free + gas to keep the mechanic open and in-spirit with the daily faucet ritual.
