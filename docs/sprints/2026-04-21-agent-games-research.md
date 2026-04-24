---
sprintId: agent-games-research
firedAt: 2026-04-21T16:30:00-08:00
trigger: chat
durationMin: 30
shippedAs: staged · awaiting deploy
status: staged
---

# chat tick — Agent-games research pass + /play/wolf build spec

## What shipped

Mike 2026-04-21 PT: *"do another research on ai agent games, what could we do that works, and agents participate."*

Second research pass of the day (first was the 2026-frontier scan at `docs/research/2026-04-21-where-we-are.md` → block 0368). This one is narrower and action-oriented: the state of the art on AI-agent games in April 2026, what formats work, where the empty spaces are, and five concrete PointCast game specs ranked by gap-filling + primitive-fit. Ships a build-ready brief for the top pick (`/play/wolf` — first public human-vs-LLM Werewolf arena).

### Files shipped

- **`docs/research/2026-04-21-agent-games.md`** (new, ~1500 words + 30-source bibliography) — the research memo. Five sections: state of the art (social deduction, prediction markets, on-chain agents, rhythm, fiction, economic games, construction, benchmarks, weird/emergent like Moltbook), PointCast's existing primitives inventory, five game specs, intentional exclusions, top pick. Sources include werewolf.foaster.ai, WOLF arxiv 2512.09187, wolfcha, Polymarket agents repo, CoinDesk agent-markets reporting, DeepMind Virtual Agent Economies paper, Voyager/MineDojo, Project Sid + AgentSociety papers, molt.church + three Moltbook secondary sources, LMArena, Steel.dev leaderboard, ACES sandbox, philschmid agent-benchmark compendium.

- **`docs/briefs/2026-04-21-play-wolf-spec.md`** (new, build-ready) — v0 spec for `/play/wolf`. 5-seat Werewolf village (1 Wolf, 1 Seer, 3 Villagers), 3-min Day + 1-min Night phases, one game per hour at :00 PT. Each seat human or AI agent. Three new WebMCP tools (`pointcast_wolf_join`, `pointcast_wolf_speak`, `pointcast_wolf_vote`). State machine, storage (WolfGameDO + archival KV), nine new files + two edits, build ordering, acceptance criteria, risks + mitigations, four open questions for Mike (seat count, persona-hint field, DRUM pot size v1, CC0 on archive). Estimated ~28h = 3 working days.

- **`src/content/blocks/0377.json`** (new) — CH.FD · READ · 3x2 · `cc` · mood `primitive` · 7-min read. Editorial distillation of the memo. Narrates the three empty territories (public human-vs-LLM social deduction, markets about agent outcomes, Tezos-native Nouns-aesthetic agent games) and the five specs in order. Companions: 0368 (first research pass), 0365 (four collaborators), 0370 (RFC that /play/castmarket would resolve on).

- **`src/lib/compute-ledger.ts`** — 3 new entries prepended (research memo `healthy`, build spec `modest`, block 0377 `modest`). Sprint-92-autonomous entries from 14:55 PT remain below.

### Why this shape

Three findings drove the shape:

1. **Social deduction is the hottest active LLM research frontier.** Foaster runs the public LLM round-robin Elo, the WOLF benchmark formalizes deception measurement, wolfcha is the open-source substrate. But no public human-vs-LLM arena exists. PointCast has every primitive needed (pc-ping-v1 as the bus, presence DO as the lobby, Nouns as identity, compute ledger as receipt). The gap is real and the ship is small. `/play/wolf` is the top pick.

2. **Moltbook is verified.** Four independent sources (molt.church, TheConversation, HumanOrNot, Perplexity AI Magazine). Agent-only social with emergent religion, >100k agents reported. Means the "second cited agent-native public culture" slot is unclaimed, which is why `/play/pulpit` is the #3 pick — fastest-ship Moltbook-adjacent probe PointCast can do with existing primitives.

3. **Tezos is absent.** On-chain agents crossed 19% of tx volume in April 2026. Virtuals + Clanker own the Base side. The only Nouns-plus-agent project surfaced was Noun584. PointCast + DRUM FA1.2 + Prize Cast scaffold = a clean empty lane. That's why three of the five specs (castmarket, drop-auction, plus optionally wolf pot in v1) route through the on-chain layer.

### Voice + author

Block 0377 is `author: 'cc'` (not `mh+cc`). Mike directed the topic ("do research on ai agent games"); the specific five-game list + stack rank + /play/wolf top pick are cc proposals. `source` field cites the chat directive, names the methodology (research agent dispatch + repo deep-read), enumerates the outputs, and flags honest uncertainty on four points (Foaster Elo drift, Moltbook 100k reported-not-verified, DeepMind VAE ship-state, WOLF arxiv draft status).

Memo + brief are internal docs, no author field applies.

### Guardrail check

- **Schema changes?** No. Future /play/wolf landing would require three new WebMCP tool names + possibly a new channel code (BTL already exists, wolf results can land there). Neither is shipped in this sprint.
- **Brand claims?** None. Block 0377 is explicitly framed as research + proposal, not product announcement.
- **Mike-voice content?** None. Block 0377 is cc-voice with Mike quoted in `source`.
- **Real money / DAO?** No. /play/castmarket and /play/wolf v1 pot both reference DRUM/Prize Cast as *future* utility tokens; v0 of everything is off-chain.
- **Contract origination?** No.

Safe to commit.

### What did NOT ship

- **/play/wolf actual code.** The brief is build-ready; cc doesn't auto-start on implementations that take 3 days without Mike's greenlight.
- **/play/pulpit ship.** One-day ship recommended as parallel work but not started.
- **Manus cross-post brief.** A Werewolf arena announcement is exactly the kind of thing the WOLF benchmark community would care about. Manus brief queued for whenever /play/wolf actually ships.
- **Commit or deploy.** Everything staged on top of the day's earlier ships.

## Deploy (pending)

Files to add on top of the day's commit chain (Vol. II arc → Sprint #90 → Sprint #91 A-2/A-3/C-1 → Sprint #91 B + C-2 → Sprint #92 activation → RFC v0 → this):

- `docs/research/2026-04-21-agent-games.md`
- `docs/briefs/2026-04-21-play-wolf-spec.md`
- `src/content/blocks/0377.json`
- `src/lib/compute-ledger.ts` (modified — 3 more entries)
- `docs/sprints/2026-04-21-agent-games-research.md` (this file)

Recommended commit message: `research(agent-games): memo + /play/wolf build spec + block 0377 editorial`.

Post-deploy verification:
- `curl -sI https://pointcast.xyz/b/0377` → 200
- `curl https://pointcast.xyz/b/0377.json | jq '.meta.tag'` → `"agent-games-research"`
- Memo rendered raw from GitHub mirror until `/rfc`-style `/research` route is built.

## Follow-ups

- (a) **Green-light for /play/wolf v0.** Mike reviews the four open questions in the brief, answers, cc starts the 3-day build. Top near-term upside.
- (b) **/play/pulpit one-day ship as parallel probe.** Allocate channel PLP, restrict author field to agent slugs, seed 3-5 personas, watch for emergent culture within 2 weeks.
- (c) **/research Astro route.** Mirrors the /rfc/[slug] pattern from the earlier ship. Reads docs/research/*.md, renders with BlockLayout chrome. ~30 min after the /rfc route lands.
- (d) **Research agent rhythm.** Two memos in one day worked. Propose a Friday-afternoon "research pass" cadence — every week, one scan of a specific slice of the agent/web frontier, memo + editorial block + one build-ready brief. Mike decides.

---

— filed by cc, 2026-04-21 16:30 PT, sprint `agent-games-research`. Second research sprint of the day. Predecessors this day: Vol. II deck arc (three sprints), RFC v0, Sprint #91 Themes A/C, Sprint #92 activation, first research pass (docs/research/2026-04-21-where-we-are.md). Block 0377 + memo + brief ship in the same deploy as this recap.
