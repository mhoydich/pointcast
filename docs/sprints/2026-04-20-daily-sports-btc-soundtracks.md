---
sprintId: daily-sports-btc-soundtracks
firedAt: 2026-04-20T13:20:00-08:00
trigger: chat
durationMin: 40
shippedAs: deploy:ee977ae2
status: complete
---

# chat tick — daily drop on home + sports strip + BTC moment poll + mood soundtracks + poll follow-up

## What shipped

Mike 2026-04-20 13:20 PT mandate (five-in-one): *"have on homepage, ability to collect daily drop · on polls, make more interesting once you voted, and then a follow up · questions should be best matched to the participant or moment... have one of the moment poll like do you think bitcoin is on a up or down trend type question · after try a couple of sports updates of the latest results from last night or today, start with global major · and start to create soundtracks that match the mood, that can be turned on, broadcast · fuuuunnn."*

All five threads, one deploy.

### Files shipped

- **`src/components/DailyDropStrip.astro`** (new, ~200 lines) — compact home-feed version of /today's daily-drop collect. Today's pick renders as: thumbnail + code kicker (`CH.VST · 0232 · VISIT`) + title + COLLECT button + streak/total stats. Shares localStorage keys with /today (`pc:daily:collected`, `pc:daily:lastDay`, `pc:hello:count`) so a claim on either surface counts everywhere. Streak computation walks collection dates backward from today counting consecutive days.
- **`src/components/SportsStrip.astro`** (new, ~180 lines) — 4-league grid: NBA, MLB, NHL, Premier League. Client-side fetches ESPN public scoreboard API (`https://site.api.espn.com/apis/site/v2/sports/{path}/scoreboard`) per league on mount, renders 2 most-recent games per tile with status-specific styling (FINAL / in-progress clock / upcoming time). 10-min sessionStorage cache to avoid hammering ESPN on repeat views. Graceful fallback: if a fetch fails, the tile shows "tap scoreboard →" link with no fake scores. No placeholder data.
- **`src/content/polls/btc-trend-from-here.json`** (new) — "From $75K today, is Bitcoin going up or down next?" 6 options span the full forecast range (up-strong/up-soft/sideways/down-soft/down-hard/dont-know). Resolves 2026-05-20. Anchored to block 0329 (the BTC at $75K field note Codex wrote). Now shows as the newest poll so HerePoll surfaces it on /here by default.
- **`src/lib/moods-soundtracks.ts`** (new, Codex via MCP) — 6 mood → soundtrack map. Real URLs (lofi girl YouTube for chill; Spotify Deep Focus for focus; Peaceful Piano for quiet; Beast Mode for hype; Coding Mode for flow; Brain Food for curious). Typed `Soundtrack` interface + `getSoundtrack()` helper.
- **`src/components/MoodChip.astro`** (modified) — soundtrack toggle appears inline after a mood is picked. Shows "▶ {playlist label} · {MOOD}" as a pill button. Tap → expands an embedded iframe (152px tall, dark frame) playing the mood's soundtrack. Close button resets to `about:blank`. Selecting a different mood swaps the offer + resets the player. Player frame is lazy-loaded, autoplay-capable when the embed allows.
- **`src/components/HerePoll.astro`** (modified) — post-vote follow-up prompt. After a successful vote the card keeps rendering the distribution bars AND surfaces an amber-accent "THEN TRY: {next question} →" link at the bottom. Fetches `/polls.json`, picks the newest unvoted poll from that list, falls back to `/polls` if everything's been voted. Keeps the engagement alive past the first tap — answers Mike's "make more interesting once you voted, and then a follow up."
- **`src/pages/index.astro`** — wires DailyDropStrip + SportsStrip into the home between TodayOnPointCast and MoodChip. Flow now reads: FreshStrip → VisitorHereStrip → NetworkStrip → TodayOnPointCast → **DailyDropStrip** → **SportsStrip** → MoodChip (with soundtrack) → PollsOnHome → FreshDeck → channels → HomeMajors → grid.

### Deploy + verification

- Build: 248 → **249 pages** (+1 route: /poll/btc-trend-from-here).
- Deploy: `https://ee977ae2.pointcast.pages.dev/` → pointcast.xyz live on main.
- Home curl: 22 daily-drop-strip mentions, 8 sports-strip + 27 sports-tile mentions, 5 mood__soundtrack mentions (all rendered).
- /poll/btc-trend-from-here: 200.

### Codex MCP

One parallel sub-brief fired (moods-soundtracks.ts). Clean ship, under 60s. 10 Codex ships this session now (STATIONS + Presence DO + /here backend + multiplayer + 3-concurrent analytics/audio-onset/pulse-state + moods-soundtracks + analytics endpoint).

## Design notes worth recording

- **DailyDropStrip color-codes green** while NetworkStrip is blue and TodayOnPointCast is warm/amber. The home now reads as a gently-tuned palette: presence-blue → today-amber → drop-green → sports-blue → mood-violet (via chip swatches) → grid. Each surface has its own hue register without competing.
- **SportsStrip is honest about uncertainty.** No hardcoded scores, no placeholders. If ESPN's API fails, the tile reads "tap scoreboard →" rather than inventing data. That's the right tradeoff for a live-data surface.
- **Soundtrack iframes are opt-in per mood-click.** Selecting a mood offers the soundtrack; the iframe only loads when the user taps the toggle. No auto-autoplay, no ambient noise imposed on first visit. "Can be turned on" = explicit button press.
- **BTC poll is a forecast, not an opinion poll.** outcomeAction commits cc to write a reconciliation block on 2026-05-20 naming which bucket landed. Anonymous — no staking, no wallet. Pure coordination data.
- **The HerePoll follow-up picks the newest unvoted poll automatically.** First voter today gets steered to `btc-trend-from-here` (just landed); a later voter gets steered to the next unvoted. Organic rotation via timestamp order in the JSON mirror.

## What didn't

- **Matching polls to time-of-day / participant state** — Mike asked for work-time polls on Mondays vs vacation-time polls on weekends. This tick the HerePoll still picks by recency; a future tick can add a tag system (poll `audience: 'work' | 'leisure' | 'market' | 'general'` + time-of-day selector).
- **Broadcasting soundtrack selection to /here visitors** — v0 is local-only. "Broadcast" per Mike is deferred to a future DO-wire. Current /api/presence supports a `listening` field already (per the Brief #6 contract), so the wiring is small: when soundtrack is playing, send `listening: {label}` via the existing identify/update message. Can add that to MoodChip next tick.
- **More sports leagues / Champions League** — v0 is 4 tiles. Can extend to 6 if Mike wants (add UCL + La Liga or MMA / F1 on specific windows).

## Notes

- Build: 248 → 249 pages (+1 poll route).
- Deploy: `https://ee977ae2.pointcast.pages.dev/` → pointcast.xyz.
- Files new: 4 (DailyDropStrip, SportsStrip, BTC poll, moods-soundtracks, this retro).
- Files modified: 3 (index.astro, MoodChip, HerePoll).
- Codex MCP ships this session: 10.
- Cumulative: **55 shipped** (28 cron + 27 chat).

— cc, 13:45 PT (2026-04-20) · fuuuunnn confirmed
