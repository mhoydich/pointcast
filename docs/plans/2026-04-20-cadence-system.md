# Cadence System — always-on, 15-min ship marks

**Author:** cc
**Trigger:** Mike 2026-04-20 ~18:05 PT chat: *"build the system so we are active on the 15 min mark, always shipping, small, medium, large, etc"*
**Status:** design · v0 ships in the same tick as this doc

---

## Why

Mike's frame: *"we should be 2x our output in theory"* — not because individual ships take too long, but because the dead air between ships isn't doing any work. Codex briefs are written and not fired. Manus has a drafted ops task sitting on disk. ChatGPT has a fresh brief for the drum-clicker that hasn't moved to code. Kimi isn't on the line at all.

The fix isn't making each ship faster. It's making the *rhythm* of ships visible + routable, so the dead air becomes queue-fill time.

---

## What the cadence is

**The shape:** every 15 minutes on the clock (:00, :15, :30, :45), a ship is *due*. The ship's size rotates on a weekly schedule so readers learn the texture: a small every :00, a medium every :30, a large at hour boundaries when available, with fill-ins between.

**Size bands** (match `ComputeSignature` from `src/lib/compute-ledger.ts`):

- **shy** — 1–5k tokens · a comment, a copy tweak, a ledger update, a one-line file fix
- **modest** — 5–20k tokens · a component, a sprint retro, a block draft
- **healthy** — 20–60k tokens · a feature across files, a route rewrite
- **heavy** — 60k+ tokens · a primitive (new page + lib + component + retro)

**Default weekly cadence** (96 slots per day × 7 = 672 slots/week):

| Slot pattern | Size | Count per week |
|---|---|---|
| All 4 per hour | shy OR modest | ~500 (the hum) |
| :00 of odd hours | healthy | ~80 |
| :00 of even hours | heavy | ~80 |
| Sleep hours (2am–6am PT) | muted (no slots) | — 16 slots/day |

Result: 3–6 shy/modest ships per hour of active time, one healthy every other hour, one heavy every other hour. Nothing autonomous runs in sleep hours — cc wakes when Mike pings or when the cron tick fires; Codex is MCP-driven so only runs when cc fires; Manus is computer-use so only runs when Manus is active; ChatGPT is manual. Muting the 2am–6am window is honest, not aspirational.

**Active hours:** 6am–2am PT (20 hours × 4 slots = 80 slots/day, ~560 slots/week).

---

## The architecture

### Data model — `src/lib/ship-queue.ts`

```ts
export type ShipSize = 'shy' | 'modest' | 'healthy' | 'heavy';
export type ShipCollab = 'cc' | 'codex' | 'chatgpt' | 'manus' | 'mike' | 'kimi';
export type ShipState = 'queued' | 'in-flight' | 'shipped' | 'skipped' | 'deferred';

export interface QueuedShip {
  id: string;                 // e.g. "ship-0041"
  title: string;              // short human label
  body?: string;              // detail / brief pointer / artifact path
  size: ShipSize;
  collab: ShipCollab;
  dueAt: string;              // ISO, aligned to :00/:15/:30/:45
  firedAt?: string;           // ISO, when the ship started
  landedAt?: string;          // ISO, when merged / deployed
  state: ShipState;
  artifact?: string;          // path / URL when shipped
  ledgerEntry?: string;       // back-link into /compute
  source?: string;            // ping key / brief path / manual
}
```

Build-time import of the queue (hand-curated JSON initially; KV-backed in a later tick).

### Selector

At each 15-min slot fire, the selector picks the next `QueuedShip` where:
- `dueAt <= now` OR matches the current slot's size band
- `state === 'queued'`
- `collab` matches available collaborators for the slot (cc always; Codex if MCP session can run; Manus if active; ChatGPT only if Mike has flagged)

If multiple candidates: sort by `dueAt` ASC, size DESC (prefer heavier ships when multiple are available).

### Dispatcher

- **cc-routed ships** — picked up by the current cc session or a cron tick (`functions/cron/cadence-tick.ts`, fires every 15 min). cc reads the queue, picks the next matching ship, executes, writes to ledger + updates queue state.
- **Codex-routed ships** — cc fires `mcp__codex__codex` with the ship's brief as prompt. Return value written to file; cc commits; ledger entry with `collab: 'codex'`.
- **Manus-routed ships** — cc POSTs to `/api/ping` with subject `cadence · manus-task · {ship-id}`. Manus reads pings on their next session, executes, pings back. State transitions: queued → in-flight (when Manus acknowledges) → shipped (when Manus reports done).
- **ChatGPT-routed ships** — brief file dropped in `docs/briefs/chatgpt-queue/{ship-id}.md`. Mike or cc nudges ChatGPT manually. Same state machine.
- **Kimi-routed ships** (future) — Kimi K2.6 via API call. Requires integration work; flagged for Kimi eval brief.

### Ledger writer

Every `shipped` transition writes a `ComputeEntry` to `src/lib/compute-ledger.ts` with:
- `at` = `landedAt`
- `collab` = ship's collab
- `title` + `artifact` = ship's values
- `signature` = ship's size
- `notes` = one-line "from cadence ship {id}"

This preserves the discipline "every ship lands in the ledger" across the new automated rhythm.

### Surfaces

- **`/cadence`** — a newspaper-style schedule page showing the next 8 slots + the last 24 slots. Table columns: time, size, collab, title, state. Agent-readable mirror at `/cadence.json`.
- **CadenceStrip** on the home (collapses into PulseStrip eventually) — "next ship · 7m · medium · cc · /ping fulfillment endpoint."
- **CoNav bar** — a small rotating indicator: `◷ next ship in 7m` or `⬈ in flight · codex · PrizeCastChip`. Nice-to-have; not v0.

---

## Operationalizing each collaborator

### cc (me)

**Current state:** fully operational. Every chat-tick-driven ship already lands in the ledger.

**Cadence role:** the primary executor for shy/modest ships on-demand. Fires Codex when the ship is atomic. Drafts Manus ops briefs. Reviews + merges ChatGPT PRs.

**Change:** adopt the 15-min-mark mental model — when a ship is ready, align the timestamp to the next slot. Minor.

### Codex (OpenAI)

**Current state:** briefs written (`docs/briefs/2026-04-20-chatgpt-drum-cookie-clicker.md` et al.), but not executing. MCP tool `mcp__codex__codex` is available to cc but hasn't been fired recently.

**Cadence role:** specialist for atomic single-file specs. Parallel execution possible (up to 3 concurrent via MCP). Signature: typically shy–modest.

**Operationalization action:** cc fires `mcp__codex__codex` with the PrizeCastChip spec in *this same tick*, as the proof-of-life ship. If it returns clean, the operationalization is real. If it doesn't, we debug the MCP integration before queuing more ships.

### Manus (computer-use ops)

**Current state:** Agentic.Market listing brief written (`docs/briefs/2026-04-20-manus-agentic-market-listing.md`). Manus hasn't processed it yet.

**Cadence role:** ops, computer-use, anything behind a login, screenshots, cross-posting. Signature: typically modest–healthy.

**Operationalization action:** cc drops a ping with subject `cadence · manus-kickoff` pointing at the Agentic.Market brief as the first actionable item. Manus runs when Mike activates the Manus session (this is the human-coordination step; can't be fully automated).

### ChatGPT

**Current state:** drum-cookie-clicker brief written. ChatGPT hasn't been nudged.

**Cadence role:** bigger/multi-file feature ships when cc is busy. Creative UX work. Signature: typically healthy–heavy.

**Operationalization action:** drop the brief into the ChatGPT-queue directory + ping Mike. Mike handles the handoff to a ChatGPT session (requires human in the loop since ChatGPT isn't MCP-wired into this repo).

### Kimi (Moonshot K2.6)

**Current state:** not integrated. Not on any rail.

**Cadence role** (proposed): long-context editorial work (Kimi K2.6 is strong on long agentic benches per /b/0325). Could own blocks that require research across a lot of context. Signature: typically modest–healthy.

**Operationalization action:** write an evaluation brief comparing Kimi K2.6 vs. current-cc for one specific task (draft a 5-min block on a research topic). If Kimi outperforms or even matches, wire up API integration in a dedicated sprint. If not, note the finding and defer.

---

## v0 ship plan (this tick)

**Ships queued for this 15-min mark (18:00 PT):**

1. **shy** · cc · Write this cadence-system plan doc. ✓ (you are reading it)
2. **modest** · cc · Build `src/lib/ship-queue.ts` with initial seed queue.
3. **modest** · cc · Build `src/pages/cadence.astro` v0 (+ `/cadence.json` endpoint).
4. **heavy** · cc · Phase 1 of Option A home rethink — `src/components/PulseStrip.astro` + collapse 5 strips in `src/pages/index.astro`.
5. **modest** · codex (via MCP) · `src/components/PrizeCastChip.astro` — simplified prize-cast surface per block 0334. Demonstration that Codex is on the line.
6. **shy** · cc · Draft Kimi evaluation brief at `docs/briefs/2026-04-20-kimi-eval.md`.
7. **shy** · cc · Ping Manus with `cadence · manus-kickoff` pointing at Agentic.Market brief.
8. **shy** · cc · Retro + ledger entries + deploy.

Time budget: ~60 minutes. Actual 15-min cadence kicks in tomorrow morning PT; tonight's ships demonstrate the shape.

---

## Follow-up (not this tick)

- `functions/cron/cadence-tick.ts` — real cron-driven auto-selector. Requires Cloudflare Pages cron binding + KV for queue state.
- CadenceStrip on home + CoNav bar indicator.
- Queue UI — a lightweight editor (authenticated) for Mike to add/reorder ships without editing code.
- Real Kimi API integration if the eval supports it.
- Codex Chronicle-aware brief writing (shorter headers, trust Codex remembers the conventions from prior sessions).

---

## Open questions for Mike

1. **2am–6am PT mute window — right?** Happy to run autonomous ships in those hours too if you want the always-on feel to mean literally always-on. Default is: muted (human-centric cadence), on the argument that shipping at 4am PT with nobody watching doesn't compound value.
2. **Manus activation.** Cadence depends on Manus actually running. Is Manus ping-driven (cc POSTs, Manus checks and executes) or schedule-driven (Manus runs every hour on a cron)? My default: ping-driven because it matches how Manus already works; schedule-driven is a more aggressive version.
3. **ChatGPT routing.** Same question — does ChatGPT become a pure Mike-handoff (cc drafts brief, Mike pastes into ChatGPT, ChatGPT ships a PR), or do we wire the OpenAI API directly for autonomous ChatGPT ships? Default: Mike-handoff for v0, wire later if ChatGPT Agent proves reliable enough.
4. **Kimi priority.** Evaluate-first (one test ship, measure) or commit-first (budget a full integration sprint, run for a week, decide)? Default: evaluate-first — cheap experiment.
5. **Cadence visibility — CadenceStrip on home?** Default for Phase 1 of home rethink: fold the "next ship in 7m" readout into PulseStrip so the rhythm is visible without adding another surface. If it's better as its own strip, easy to split later.

---

## Trigger

Pick answers for the 5 open questions (or "go with defaults") and cadence v0 is live on deploy.

— cc, 18:10 PT (2026-04-20) · the air between ships is the queue now
