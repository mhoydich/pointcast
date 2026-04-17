# Codex review · 2026-04-17 · Battler Phase 1

Scope: battler `stat-derivation.ts`, `resolve.ts`, `battle.astro`, `blocks/0220.json`, `channels.ts`, `content.config.ts`. Evaluated vs. design doc, sketch, BLOCKS.md. Local play-through only.

## Verdict
**needs-revision** — primitives are clean and the page reads as BTL, but challenger AI is a fully predictable rotation and the head→type map is a hash bucket, not curated families. Both are core-mechanic, not polish.

## Spec deviations (blocking)

1. **BTL shipped ahead of MH approval.** `channels.ts:112`, `content.config.ts:19`, `blocks/0220.json` all live. AGENTS.md: new channel = MH decision. TASKS.md:109 still `waiting-on-mh`. Design doc flagged this as merge-gate. **High, (MH/CC).**
2. **Challenger stance is a pure rotation.** `battle.astro:210`: `deriv = ((challenger.id * 31) + round * 7) % 3`. Since `7 % 3 = 1` and `14 % 3 = 2`, every challenger plays `[x, x+1, x+2]` — all three stances exactly once, order seeded by `id % 3`. Verified across 2000 seeds. Two replays solves the pattern; the RPS read is dead. Replace with `mix(id ^ round ^ cardOfDay.id, salt) % 3`. **High, (CC).**
3. **Head→type map is a hash bucket.** Design §"Type assignment" specified curated families (crab/whale → WATER, laser → BEAM, skull/tank → ARMOR, bear/cactus → WILD, taco/pizza → FEAST). `stat-derivation.ts:66-72` does `mix(head, 0xaa) % 5` — a uniform bucket that discards the themed premise. File comment at L10 admits the real descriptor isn't bundled. Ship a hand-coded 240-entry `HEAD_TYPE_MAP` + 21-entry `GLASSES_TYPE_MAP` as interim. Otherwise "head picks primary" is cosmetic. **High, (CC).**
4. **SPD barely matters.** `resolve.ts:99-108` — faster side hits first, but slower side still deals full counter damage unless the first hit KOs. At HP ~98 and damage 20-60, that's rare. Across 5 matches SPD never altered an outcome. Go simultaneous, or scale counter by remaining-HP fraction. **Med, (CC).**
5. **No simultaneous reveal beat.** Design §Core mechanic: stances "reveal simultaneously." `battle.astro:204-236` resolves instantly on click. Add ~400ms delay + `> OPPONENT: GUARD` reveal above the damage log. **Med, (CC).**
6. **`0220.json` `type: "FAUCET"` misleads** — no `edition` field, no claim surface. Use `type: "LINK"` until Phase 3. **Low, (CC).**

## Gameplay feel notes

Played 5 matches against Card of the Day #137 (seeds 1, 420, 999, 1234, 2000).

- **#137 is under-tuned for a hero card.** ATK 40, DEF 46, SPD 55, FOC 53, HP 98 — loses to 3 of 5 sampled challengers on STRIKE×3 even with optimal stance. Hand-pick a seed, or add a Card-of-Day stat override.
- **#137 self-counters.** Primary BEAM, secondary ARMOR; BEAM beats ARMOR. Cosmetic, downstream of #3.
- **FOCUS is near-dead.** Only beats GUARD, and GUARD appears exactly once per match (dev #2). Fix #2 revives FOCUS.
- **STRIKE×3 is Pareto-optimal ~60% of seeds.** Type mults (1.5/0.67) swamp stance mults (1.3/0.75). Tighten type to 1.25/0.8 or widen stance to 1.5/0.6.
- **Round 3 rarely lands.** `HP = 80 + DEF*0.4` gives ~12-point HP spread; matches end round 2. Bump base HP to 100 and DEF×0.8, or scale damage down.

## Code quality notes (non-blocking)

- `stat-derivation.ts:89, 106` — docstring says all stats clamped [1,99], HP excluded (bounded ~[80,120]). Tighten comment.
- `resolve.ts:117` — per-round `winner` uses gross damage, not net HP advantage. Inert; flag for Phase 2.
- `battle.astro:250` vs L85 — `Math.random()*2000` vs `seed-input max="9999"` — unify.
- `battle.astro` — ~275 of 540 lines are inline `<style>`. Extract to `src/styles/battle.css`.
- Mono tracking 0.12em at L307 is BLOCKS ceiling. Drop non-header mono to 0.08-0.10em.

## BLOCKS.md compliance — clean

Inter + JetBrains Mono via `--pc-font-sans|mono` tokens. No serif italic, no system mono. Two weights (400, 500). `border-radius: 2px` throughout; `.type-pill` within spec. BTL oxblood `#8A2432/#551620/#FBEAEE` matches design doc. Mono metadata all-caps + tracked; sentence-case title.

## Handoffs

- **(MH)** Resolve BTL channel approval in TASKS.md:109 — priority **high** (merge gate)
- **(CC)** Replace deterministic challenger stance with seed+round+opponent hash — priority **high** (dev #2)
- **(CC)** Ship curated `HEAD_TYPE_MAP` + `GLASSES_TYPE_MAP` — priority **high** (dev #3)
- **(CC)** Add stance reveal beat (~400ms + opponent line) — priority **med** (dev #5)
- **(CC)** Rebalance stance/type mults + widen HP so round 3 lands — priority **med** (feel notes)
- **(CC)** Fix SPD counter-damage so speed alters outcomes — priority **med** (dev #4)
- **(CC)** Hand-pick a respectable Card of the Day seed — priority **low** (feel note)
- **(CC)** Flip `0220.json` to `type: "LINK"` — priority **low** (dev #6)
- **(CC)** Extract `battle.css`; fix mono tracking; unify seed cap — priority **low**

No sketches this round. Phase 2 depends on #2 and #3 landing.
