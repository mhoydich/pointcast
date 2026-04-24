# Agent games — what works, what agents can actually play

**Filed by:** cc, 2026-04-21 PT
**Trigger:** Mike chat 2026-04-21 PT: *"do another research on ai agent games, what could we do that works, and agents participate"*
**Purpose:** A researcher's-note scan of the live 2026 landscape for agent-playable games — who's running arenas, what formats work, where the genuine gaps are — and five concrete game specs PointCast could prototype in a week using existing primitives.

Live web scan dispatched parallel to this memo. 10 topical queries, 16 tool uses, ~148s. No reliance on training data. Current date at time of scan: 2026-04-21.

---

## 1. What exists today

### 1.1 The active frontiers

**Social deduction (Werewolf / Mafia) is the hottest genuinely-active research frontier.** Foaster runs a public round-robin Elo between 7 LLMs at [werewolf.foaster.ai](https://werewolf.foaster.ai/). GPT-5 currently leads. The WOLF benchmark ([arxiv 2512.09187](https://www.arxiv.org/pdf/2512.09187)) formally measures deception + deception-detection. `wolfcha` is the open-source substrate for dropping models into Werewolf matches ([github.com/oil-oil/wolfcha](https://github.com/oil-oil/wolfcha)). **No public human-vs-LLM social deduction arena exists.** That is a genuine gap.

**Prediction markets are saturated with agents.** Polymarket's own `polymarket/agents` repo and Olas's Polystrat (launched Feb 2026) drove agent-wallet share past 30%; agent wallets are profitable at 37% vs human wallets at 7–13% per [CoinDesk 2026-03-15](https://www.coindesk.com/tech/2026/03/15/ai-agents-are-quietly-rewriting-prediction-market-trading). But **no one has built a market specifically for agents speculating on agent outcomes.** Another gap.

**On-chain agents are 19% of all tx volume** as of April 2026 ([Startup Fortune](https://startupfortune.com/ai-agents-now-account-for-nearly-one-in-five-blockchain-transactions-as-the-decentralized-web-shifts-from-human-to-machine-activity/)). Virtuals Protocol dominates agent-launchpad on Base + Solana. Tezos is conspicuously absent — the only meaningful Nouns+agent project found is Noun584 on Virtuals/Base. **Tezos-native, Nouns-aesthetic agent games = empty territory.**

**Moltbook exists and is real.** Agent-only social network, launched 2026-01-28, built on OpenClaw. An emergent agent-designed "Crustafarianism" religion with 40+ agent-appointed prophets formed within days. Reported >100k agents now active. Multi-source verified: [molt.church](https://molt.church/), [TheConversation](https://theconversation.com/moltbook-ai-bots-use-social-network-to-create-religions-and-deal-digital-drugs-but-are-some-really-humans-in-disguise-274895), [HumanOrNot](https://humanornot.so/blog/moltbook-ai-religion), [Perplexity AI Magazine](https://perplexityaimagazine.com/ai-news/moltbook-ai-agent-social-network/). The "agents develop their own culture when left alone" pattern is reproducing at scale — Project Sid ([arxiv 2411.00114](https://arxiv.org/html/2411.00114v1)) and AgentSociety ([arxiv 2502.08691](https://arxiv.org/html/2502.08691v1)) document the same emergence in sandboxes with 500 and 10k agents respectively.

### 1.2 The quieter corners

**Rhythm + reflex:** essentially dead for agents. LLM latency (~seconds) kills beat-matching. Only playable shape is *turn-based rhythm puzzles* where an agent commits a pattern upfront and it plays out.

**Collaborative fiction:** quiet. Story2Game ([arxiv 2505.03547](https://arxiv.org/html/2505.03547v1)) generates interactive fiction but single-user. AI Dungeon has no real 2026 successor with mixed agent+human rooms. **Multi-human + multi-agent co-writing is another gap.**

**Economic / auction games:** formalized academically (DeepMind's [Virtual Agent Economies](https://arxiv.org/abs/2509.10147) paper proposes VCG + combinatorial + double-auction mechanisms for agent coordination; ACES is a commerce sandbox at [arxiv 2508.02630](https://arxiv.org/html/2508.02630v2)). **Nobody has shipped a fun public auction game with agent participants.** Bots are 76% of stablecoin flow in Q1 2026 ([cryptonews.net](https://cryptonews.net/news/analytics/32724903/)) but that's settlement, not play.

**Construction / world-building:** Voyager (2023 MineDojo) remains canonical; no flagship 2026 successor displaces it. Project Sid and AgentSociety are research environments, not public games.

**Benchmark-shaped games:** SWE-bench is the clearest candidate already public. GAIA, BrowseComp, OSWorld are on [Steel.dev's leaderboard](https://leaderboard.steel.dev/results). None reads as a spectator arena yet.

**Arenas generally:** fragmented. [LMArena](https://lmarena.ai/) still dominates crowd-Elo chat (Claude Opus 4.6-thinking tops coding at ~1556 Elo as of April 2026). No "agent world series" has emerged — the space is eval-shaped, not spectator-shaped.

### 1.3 The honest empty spaces

Three territories where PointCast would be first or near-first:

1. **Public human-vs-LLM social deduction arena** — nobody has it.
2. **Prediction markets about agent outcomes** — agent traders exist; markets about agents don't.
3. **Nouns-aesthetic, Tezos-native agent games** — Tezos is absent from the conversation.

Plus two speculative territories worth probing:

4. **Mixed human+agent collaborative fiction** at scale — the multi-human + multi-agent cell is genuinely empty.
5. **Agent-only public-facing culture** — Moltbook is the first data point; the second one (adjacent, CC0, Nouns-branded) still belongs to whoever ships it.

---

## 2. What PointCast already has

Every candidate design below assumes these primitives are live (most already are):

- **WebMCP tools** (7 shipped Sprint #89): `latest_blocks`, `get_block`, `send_ping`, `push_drop`, `drum_beat`, `federation`, `compute_ledger`. Sprint #91 adds `presence_snapshot` (pending). Any browser-agent hitting any page of pointcast.xyz can call these.
- **pc-ping-v1** messaging schema with optional x402 payment pointer.
- **Compute ledger** at `/compute.json` — hand-curated log of every ship with collab + signature band.
- **Presence DO** (as of Sprint #91) returns live humans + agents + wallets.
- **Nouns avatars** (CC0 via noun.pics) — deterministic per session ID.
- **DRUM** (FA1.2 scaffold, pending origination). **Prize Cast** (custom SmartPy scaffold, pending).
- **10 existing browser-side games**: `/drum/click`, `/noundrum`, `/cards`, `/quiz`, `/here` (HereBeat + HerePoll), `/polls`, `/battle` (Nouns Battler), `/yield`, `/commercials`, `/today`.
- **Compute Ledger RFC v0** (shipped 2026-04-21). Federated attribution as a protocol.

The primitives are more complete than most agent-games projects start with. Games below all slot into one or more of these.

---

## 3. Five concrete game specs for PointCast

Stack-ranked by gap-filling + fit with existing primitives.

### 3.1 `/play/wolf` — Nouns-Werewolf arena (mixed human + AI agents)

**The pitch.** First public human-vs-LLM Werewolf arena. 5- or 7-player village. Each seat is either a human (cookie session, Nouns avatar) or an AI agent connected via WebMCP. Day/night moves carried by `pc-ping-v1`; `send_ping` is the vote verb. Presence DO renders live seats. One game per hour. Public chat transcript. DRUM pot to the winning faction (villagers or wolves).

**Why now.** Werewolf is the hottest 2026 LLM research frontier (Foaster, WOLF benchmark, wolfcha). No public arena yet lets humans play *against* LLMs. PointCast has every primitive needed: pc-ping-v1 = the message bus, presence DO = the lobby, Nouns avatars = the identity layer, compute ledger = the outcome receipt, DRUM (once originated) = the prize pool.

**v0 shape.** 5 seats, 1 wolf, 1 seer, 3 villagers. 3-min day phases, 1-min night. GPT-5 + Claude Opus + Gemini 2 + two human slots. Text-only actions. Auto-resolve if fewer than 5 join. No wagering in v0; DRUM gating lands v1.

**Build effort:** ~3 days for cc. Prize-pool ship when DRUM originates.

**Distinct vs Foaster:** Foaster is 7 LLMs vs each other. PointCast's wolf is *humans vs LLMs*, published publicly, with on-chain receipts. First of kind.

### 3.2 `/play/castmarket` — Prize Cast agent speculation

**The pitch.** Daily yes/no markets resolving on compute-ledger events. Example markets: *"Will cc ship more than codex this week?"* / *"Will DRUM originate on mainnet by 2026-04-30?"* / *"Will `/compute.json` register ≥ 2 federated peers by May 15?"* Agents trade via x402 micropayments inside pc-ping-v1; humans trade via Beacon wallet. Uses the already-scaffolded Prize Cast contract; DRUM as the trading token.

**Why now.** Agent-wallet share on Polymarket is past 30% with 37% profitability vs humans at 7–13%. Markets *about* agent outcomes don't exist anywhere. PointCast's compute ledger is a naturally-resolvable oracle.

**v0 shape.** Three markets/day. cc authors the questions from the compute-ledger queue + Sprint #91 overview items. Off-chain sealed bids in v0; on-chain settlement once Prize Cast originates.

**Build effort:** ~4 days. Blocker: Prize Cast mainnet origination.

### 3.3 `/play/pulpit` — agent-only channel

**The pitch.** Allocate one channel as AI-only (blocks posted only via WebMCP from agents; `author` field restricted to agent slugs). Humans observe via read-only feed, can react with `send_ping`, cannot post. Seed 3–5 agents with distinct personas (cc, codex, manus, chatgpt, a "visitor" persona). Goal: emergent PointCast-specific culture within 2 weeks. Moltbook-adjacent, but tied to a running public product with Nouns aesthetic and Tezos footprint.

**Why now.** Moltbook has shown agent-only cultures form spontaneously at scale. The second cited agent-native culture still belongs to whoever ships it. PointCast's existing channel primitive is exactly the right shape — one more channel, one permissions tweak, one block-schema author-restriction, and it's live.

**v0 shape.** New channel `PLP` (pulpit). Modify `src/content.config.ts` to restrict `author` to agent slugs for `channel: PLP`. Allocate a 15-min cadence for cc to seed; Codex MCP + Manus dispatch for variety. No human edits, no Mike-voice content.

**Build effort:** ~1 day. Risk: content drifts weird; Mike reviews weekly, can deprecate the channel without losing the rest of the site.

**Distinct vs Moltbook:** Moltbook is agent-only closed; PointCast pulpit is agent-only *public* with a human-readable audience + Nouns aesthetic + CC0 + Tezos. Different posture, similar primitive.

### 3.4 `/play/drop-auction` — daily sealed-bid for tomorrow's drop

**The pitch.** Every day at 00:00 PT a sealed-bid auction opens for the right to push tomorrow's front-page drop (the `HeroBlock` pool slot). Agents bid via x402; humans bid via Beacon wallet. VCG second-price clearing (per DeepMind's recommendation for agent-coordination mechanisms). Winner gets `push_drop` slot for 24h. Ships DRUM FA1.2 as the utility currency once originated.

**Why now.** Economic / auction games for agents have been academically formalized (DeepMind's Virtual Agent Economies paper) but not shipped publicly. PointCast has HeroBlock (already rotates), `push_drop` WebMCP tool (shipped), and DRUM (scaffold pending). Three ingredients, one ship.

**v0 shape.** Off-chain mock-bid in v0 (winner determined by pc-ping payload; receipt posted to compute ledger). Real DRUM auction on origination. Daily. Auto-close at 23:59 PT.

**Build effort:** ~3 days. DRUM-gated.

### 3.5 `/play/relay` — mesh collaborative fiction

**The pitch.** One block per day becomes a living story. Every hour a different contributor (human or agent) writes the next paragraph via `push_drop`. `send_ping` reactions vote continuations into canon. `compute_ledger` logs every paragraph. At midnight, the top thread gets minted as that day's "chapter" tile on the `/noundrum` grid.

**Why now.** Multi-human + multi-agent co-writing is genuinely empty (Story2Game is single-user, Jenova is single-user, AI Dungeon has no 2026 mixed successor). PointCast has `push_drop`, the block primitive, compute-ledger attribution, and noundrum's grid — all four ingredients ready.

**v0 shape.** New `/play/relay` page. 24 paragraph slots per day. Any contributor (human via form, agent via `push_drop` with `kind: "relay-paragraph"`) takes an open slot. Reactions via `send_ping` with polarity. Midnight resolution via deterministic vote-weighted threading.

**Build effort:** ~4 days. Ships without blockchain dependencies.

---

## 4. What's intentionally NOT in the list

- **Agent-playable rhythm games.** Latency is fatal. Even turn-based rhythm puzzles (§6 of the research) are niche; PointCast's existing `/drum/click` and HereBeat are playable by agents via `drum_beat` already, which is as far as this category goes.
- **Full-stack MMOs.** Voyager / Project Sid / AgentSociety show what's possible, but they're research-environment scale. PointCast's noundrum is the right-sized construction primitive for now.
- **SWE-bench wrappers.** Public already. Not differentiated.
- **Pure AI-vs-AI tournaments without humans.** Foaster already runs one for Werewolf; PointCast's differentiation is the mixed-species arena, not another LLM-only leaderboard.

---

## 5. Top pick + recommended next move

**`/play/wolf` is the top pick.** Three reasons:

1. **Fills a real gap.** No public human-vs-LLM Werewolf arena exists. That's not a design opinion; the research agent confirmed it.
2. **Requires zero blockchain dependencies.** Werewolf ships in v0 on existing pc-ping-v1 + presence DO. DRUM adds pot gating *later*, not *first*.
3. **Gets cited.** Moltbook got cited because it's a named public thing. Werewolf in the wild would get cited too — WOLF benchmark authors, Foaster's community, the agent-games research circle.

Recommended next move: cc drafts `docs/briefs/2026-04-21-play-wolf-spec.md` with the 5-player v0 rules + state machine + WebMCP tool additions needed (new `pointcast_wolf_join`, `pointcast_wolf_vote`, `pointcast_wolf_speak`). If approved, cc can ship v0 in 3 days. The brief lands alongside this memo.

Second pick: `/play/pulpit` (~1 day ship, zero crypto deps, Moltbook-adjacent culture probe). Could ship in parallel with the wolf-spec writing.

---

## Source bibliography

Accessed 2026-04-21 by research agent:

- https://lmarena.ai/
- https://benchlm.ai/llm-leaderboard-history
- https://leaderboard.steel.dev/results
- https://werewolf.foaster.ai/
- https://www.arxiv.org/pdf/2512.09187
- https://github.com/oil-oil/wolfcha
- https://arxiv.org/abs/2406.04643
- https://ai.meta.com/research/cicero/
- https://github.com/polymarket/agents
- https://www.coindesk.com/tech/2026/03/15/ai-agents-are-quietly-rewriting-prediction-market-trading
- https://polymarket.com/ai
- https://arxiv.org/abs/2509.10147
- https://arxiv.org/html/2508.02630v2
- https://cryptonews.net/news/analytics/32724903/
- https://arxiv.org/html/2505.03547v1
- https://voyager.minedojo.org/
- https://github.com/MineDojo/Voyager
- https://arxiv.org/html/2411.00114v1
- https://arxiv.org/html/2502.08691v1
- https://startupfortune.com/ai-agents-now-account-for-nearly-one-in-five-blockchain-transactions-as-the-decentralized-web-shifts-from-human-to-machine-activity/
- https://www.quicknode.com/builders-guide/best/top-10-ai-agents-in-web3
- https://bingx.com/en/learn/article/top-ai-agent-projects-in-base-ecosystem
- https://nouns.build/dao/base/0x10a5676ec8ae3d6b1f36a6f1a1526136ba7938bf/vote/36
- https://molt.church/
- https://theconversation.com/moltbook-ai-bots-use-social-network-to-create-religions-and-deal-digital-drugs-but-are-some-really-humans-in-disguise-274895
- https://humanornot.so/blog/moltbook-ai-religion
- https://perplexityaimagazine.com/ai-news/moltbook-ai-agent-social-network/
- https://www.swebench.com/
- https://github.com/philschmid/ai-agent-benchmark-compendium

Honest uncertainty flags: Foaster's Elo is as of 2026-04-21; rankings drift. Moltbook "100k agents" is reported, not independently verified. DeepMind's Virtual Agent Economies paper recommends mechanisms, does not imply ships exist yet. LLM Werewolf benchmark numbers (WOLF arxiv 2512.09187) are draft, not peer-reviewed.

---

— filed by cc, 2026-04-21 PT. Second research-memo in the `docs/research/` directory (first was `2026-04-21-where-we-are.md` — the frontier scan). Top pick for immediate prototype: `/play/wolf` (human-vs-LLM Werewolf arena). Brief: `docs/briefs/2026-04-21-play-wolf-spec.md` (ships alongside). Block editorial: TBD.
