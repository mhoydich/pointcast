# Double-session roadmap — 2026-04-21 (still-4/20 wave 5+)

**Trigger:** Mike 2026-04-21 00:00ish PT (just after midnight): *"yah keep going make it a double session, work on a couple of long term projects, like a new nouns cookie clicker drum where every visitor is a cursor visualized as a noun to start, thru drumming acquire digital land, build out the land, make art."* + *"map it all out lets go team"* + *"see if you can get codex involved."*

**State at start:** 18 ships landed in the post-compact stretch since 20:30 PT (bath v2 → song catalog → home phase 3 → /sports → blocks 0339/0340 → cos reply → ChatGPT brief → favicon → blocks 0342/0343 → /tv fullscreen → 4 TV shows → /tv/shows index → block 0344 → 3 more TV shows → block 0345 → 2 deploys). Codex MCP first attempt this session: timed out at 60s ceiling; retry queued for smaller atomic spec.

**Compute remaining:** through end of weekly reset window — Tue + Wed Pacific. Healthy budget to spend.

---

## Long-term project (the big new thing)

### `/noundrum` — multiplayer noun-cursor drum + land + art

**Concept** (Mike, exact words): "every visitor is a cursor visualized as a noun to start, thru drumming acquire digital land, build out the land, make art."

**Core mechanics:**

1. **Visitor identity = Noun.** On arrival, deterministic Noun ID derived from session (same `viewerNounId` pattern as /tv presence). The visitor's cursor on screen is rendered as their Noun's noun.pics SVG, ~64px, with mood-tinted glow ring.

2. **Drumming = currency.** Click/tap/space anywhere on the canvas → 1 beat sound (Web Audio synth, same approach as /drum/click) + 1 rhythm point. Faster taps don't multiply (no spam), but combos every 4 beats add a small bonus.

3. **Land = persistent map.** A 24×16 tile grid (384 tiles, ~80px each on desktop) shared across all visitors. Spend rhythm to claim a tile (50 base, 30 if adjacent to one you already own). Claimed tiles get a subtle border tint matching the owner's Noun palette. Permanent unless reset.

4. **Decorate = art.** Owned tiles can hold a decoration: tree (30), lamp (20), fountain (50), star (100), tower (200). Each decoration is a tiny SVG that renders on the tile. The whole map becomes a collective canvas of a few hundred decorations placed by every visitor over time.

5. **Multiplayer = shared world.** All visitors see each other's cursors (Noun avatars drifting in real time), each other's claimed tiles, each other's decorations. The game state is canonical on a Cloudflare Durable Object; the canvas is a live view.

**v0 scope (this session):**
- Solo experience that *feels* multiplayer via NPC nouns.
- Local-only state (localStorage) for owned tiles, balance, decorations.
- 5–8 NPC visitors that random-walk, auto-drum, auto-claim, auto-decorate.
- Full visual + sonic + interaction loop.
- Architectural sketch in code comments + brief at `/docs/briefs/2026-04-21-codex-noundrum-multiplayer.md` for v1.

**v1 scope (future session):**
- Real Cloudflare Durable Object: `NoundrumWorldDO` holding canonical world state.
- WebSocket connection per visitor for cursor broadcast (throttled to ~10Hz) + tile/decor events.
- Server-side rate limit on tile claims to prevent spam.
- Per-tile event log so an audit can replay how the art emerged.
- Optional: snapshot + restore world state to KV every N minutes.
- Optional: tile auctions if competition for prime real-estate emerges.
- Optional: federation — another node can run their own NoundrumWorldDO and link.

**v2 wishlist (later):**
- Pen mode: click-drag to scribble freeform on owned tiles.
- Color palette unlocked at rhythm milestones.
- Soundscape: rhythm decays into ambient drones if no one drums for an hour.
- Token-bound: optional Tezos snapshot of the world state every Sunday at noon PT, mintable as a print.

**Block 0346** captures the launch + the loop framing.

---

## Companion ships in this session (smaller, complementary)

### `/tv/shows/here.astro` — fullscreen presence bubbles
Visualize `/api/presence/snapshot` as floating Noun bubbles, drifting on a dark canvas. Same fullscreen pattern as the other 7 shows. Already attempted via Codex (timed out); cc ships directly.

### `/tv/shows/sprint-retro.astro` — slow scroll through `docs/sprints/*.md`
For each sprint markdown file, render title + first paragraph + date. Vertical crawl like /tv/shows/archive but for sprint docs. Codex retry candidate (atomic, single-file, copy-from-archive pattern).

### `/now` refresh — lighter newspaper surface
Existing `/now` is a dashboard. Refresh into a one-page newspaper-style "right now at PointCast" page: PulseStrip-style signal line + the latest 3 ledger entries + the latest 3 ping inbox messages + a single live polling chip + the date in El Segundo. No tabs. Reads in 5 seconds.

### Drum upgrades on `/drum/click` — leaderboard + share URLs
- **Leaderboard**: top 10 by lifetime beats, stored in localStorage with a one-line hash for federation eventually. v0 is local-only.
- **Share URLs**: `/drum/rhythm/{n}` page that renders a single rhythm receipt as a shareable card (mood + beats + prestige count + collected nouns). Ogg image baked at build time.
- **One new upgrade tier**: rim-shot at 50,000 beats, +0.05 multiplier.

Deferred (queued for a follow-up session):

- **`/tv/shows/drum-vis`** — extract drum visualizer from `/drum/click` as a chromeless show.
- **Google sign-in stub** — `functions/api/auth/google/start.ts` + callback + session cookie. UI affordance somewhere obvious.
- **Block 0341 (zostaff tweet)** — still blocked on x.com paywall; awaits Mike paste.
- **Bell Labs × Rothko poster** — ChatGPT brief is at `/docs/briefs/2026-04-20-chatgpt-bell-labs-rothko-poster.md`; awaits Mike paste into ChatGPT Agent.

---

## Codex involvement

**Pattern that's working:** atomic single-file ship + low-reasoning + spec includes pattern-to-copy + explicit constraints (no other files, no npm, no run).

**This session's attempts:**
1. **First fire:** `/tv/shows/here.astro` — model `gpt-5.2-codex` rejected (ChatGPT account doesn't support that model). Retried with default model. Timed out at 60s MCP ceiling. File not written.
2. **Second fire (queued):** retry with even tighter spec on `/tv/shows/sprint-retro.astro` — pattern copy from `archive.astro` which is closer in shape than `clock.astro`.

If the second attempt also times out, cc ships both shows directly. Manual Codex sessions (Mike opens Codex CLI, pastes a brief from `/docs/briefs/`) remain the reliable path.

**Briefs prepared for Codex this session:**
- `docs/briefs/2026-04-21-codex-tv-shows-batch.md` (queued — not yet written) — three small TV shows for Codex to ship in one batch from the Codex CLI: here, sprint-retro, drum-vis. Each ~150 lines, single file, copy-from-existing pattern.

---

## Order of operations (this session)

1. **Mapping doc** (this file) — done.
2. `/noundrum` v0 with NPCs — primary build. ~90 minutes.
3. `/tv/shows/here.astro` — cc ships, ~15 minutes.
4. `/tv/shows/sprint-retro.astro` — try Codex, fall back to cc, ~15 minutes either way.
5. `/now` refresh — ~25 minutes.
6. Drum upgrades on `/drum/click` (leaderboard + new tier; share URLs deferred to next round if time pinches) — ~30 minutes.
7. Block 0346 — `/noundrum` launch + roadmap framing.
8. Block 0347 — session retro after the wave lands.
9. Add to /play hub (one new tile for /noundrum).
10. Ledger entries + deploy.

**Total budget estimate:** 3.5–4 hours of focused work. Compute room available; Mike's signal was clear ("keep going make it a double session").

---

## What's NOT in scope this session

- The Cloudflare Durable Object backend for /noundrum multiplayer — sketched only, ships v1.
- Google sign-in stub — queued for next session.
- Bell Labs poster — awaits Mike paste into ChatGPT.
- Block 0341 (zostaff) — awaits Mike paste of tweet text.
- Any breaking change to existing surfaces (home, /b/{id}, /compute, /cadence, /cos, /bath, /tv).

---

— cc, 2026-04-21 00:05 PT, doc written before noundrum build kicks off so the plan survives a tab close.
