# Nouns Nation Battler League Mode PRD

## Summary

Nouns Nation Battler should evolve from a single-match watch toy into a tiny automated sports league. Eight Nouns gangs play a two-week season, advance into a four-team playoff, and finish with a Superbowl-style final called the Nouns Bowl. The player mostly watches, roots, and follows the standings.

## Goals

- Make every automated match feel like part of a larger story.
- Give rooting a reason to persist across multiple sessions.
- Surface league state without requiring accounts or a backend.
- Keep the battle fully automated and readable at a glance.
- Preserve the V3 combat loop: 30 vs 30, official Nouns sprites, role specials, morale, status effects, and center-field pressure.

## Non-Goals

- No multiplayer betting, wagering, or financial mechanics.
- No backend persistence for this sprint.
- No manual team drafting or unit micromanagement.
- No live sports API dependency.

## League Structure

- Teams: the eight existing Nouns gangs.
- Regular season: 14 days.
- Daily slate: four matches per day, so every gang plays once per day.
- Schedule: double round-robin generated from the gang list.
- Playoffs: top four gangs by league table.
- Semifinals: seed 1 vs 4, seed 2 vs 3.
- Final: winners meet in the Nouns Bowl.
- Champion state: displayed until the user resets the league.

## User Experience

- The first screen remains the battle itself, with league context added above and below it.
- The viewer sees current phase, day, slate slot, next matchup, and Nouns Bowl countdown.
- Standings show win-loss record, Noun differential, streak, fans, and seed.
- Auto Next advances through the whole league, including playoffs.
- Rooting a gang keeps highlighting that gang in standings and root cards.
- Reset League starts a fresh two-week season locally.

## Match Simulation Rules

- The visible battle determines the real result.
- Winner is the team with surviving Nouns.
- Score proxy is surviving Nouns for the winner and the loser’s takedowns against them.
- League table records wins, losses, points for, points against, streak, and fan heat.
- Close wins and playoff wins add more fan heat.
- Rooted wins increment local rooting history.

## V4 Feature Additions

- Two-week schedule with daily slates.
- Standings table that updates after every match.
- Playoff bracket generated from the top four seeds.
- Nouns Bowl final with champion state.
- Fan heat as a light narrative stat.
- Rivalry tags when two gangs meet again in the second round-robin.

## V5 Sprint Additions

- Sprint 1: Scout layer with clickable numbered Nouns, selected-player card, and top performer roster list.
- Sprint 2: League operator controls with Quick Sim for one fixture and Sim Day for the current slate.
- Sprint 3: Nouns Bowl path panel with live seeds, playoff pairings, champion state, and recent league recaps.

## V6 TV Cast Additions

- Add a dedicated `/nouns-nation-battler-tv` route for clean living-room or studio display.
- Support direct game loading with `?mode=tv` for iframe or casting contexts.
- Replace dense operator controls with a 16:9-style broadcast scoreboard, live clock, Nouns Bowl path line, and QR handoff back to the normal game page.
- Add keyboard shortcuts for TV operation: Space pause/resume, N next match, Q quick sim, D sim day, R reset league.
- Keep TV mode client-only for this sprint. There is no paired remote, backend sync, or second-screen control channel yet.

## V7 Savvy Review Additions

- Make the TV cast easier for 20+ reviewers to judge quickly from across the room.
- Add three watch-party story cards: Market Pulse, MVP Watch, and Comeback Line.
- Flash the field on big plays, takedowns, and finals so important moments read visually even without reading the log.
- Keep the normal league controls intact for adults or operators.

## V8 Amplifier League Additions

- Add a second scheduled battle type: Amplifier Rift.
- Rotate Amplifier Rift into regular-season slates and use it for Nouns Bowl playoff matches.
- Give Rift Nouns elemental affinities: Spark, Tide, Bloom, and Shade.
- Draw amplifier zones directly on the field and boost Nouns when their affinity matches the zone they occupy.
- Add amplifier lane control and element overload moves to the move feed, TV Market Pulse, scout stats, and match log.

## V9 Poster Series Additions

- Add a 20-piece Nouns Nation Battler poster wall at `/nouns-nation-battler-posters`.
- Build posters from the actual generated battler Nouns SVGs instead of unrelated artwork.
- Vary poster composition, type treatment, gang pairings, and match themes across all 20 pieces.
- Link the poster wall from the normal battler controls and the public battler page.

## V10 Crown Rush Additions

- Add a third battle type: Crown Rush.
- Rotate Crown Rush into the regular season and use it for the Nouns Bowl final.
- Draw a contested crown zone at center field.
- Let one Noun hold the crown at a time, gaining haste, guard, special charge, and extra attack pressure.
- Add crown takeover and crown pressure pulse events to the move feed, TV state, stat strip, and match log.

## V11 Director Fields Additions

- Add Director Mode to the TV cast with camera cue text, replay bay text, and highlighted target Nouns.
- Rotate camera logic between wide, iso, scrum, and replay views based on score pressure, center pressure, star performers, and recent big plays.
- Add four additional scheduled battle types: Lava Audit, Cloud Court, Trash Planet, and Fog Bowl.
- Give each new field a visible terrain skin, weather layer, field zones, stat-strip language, TV state, and periodic field events.
- Let the new terrains alter match tactics: lava lanes burn and charge specials, cloud platforms grant lift, trash piles produce scrap tech and trips, and fog rewards close-range ambushes while dulling ranged shots.

## V12 TV Interstitial Additions

- Add TV-only match-start interstitials that explain what the league is doing without pausing the automated match.
- Include a League Interstitial card with matchup, phase, live Noun count, standings context, and actual generated Noun sprites.
- Include a Field Guide card with the current battle type rules, field stat context, live survivor counts, and actual generated Noun sprites.
- Add `I` as a TV keyboard shortcut to replay the interstitial deck on demand.
- Keep interstitials local/client-only and non-blocking so they work inside the existing cast iframe.

## V13 Season Challenge Additions

- Add numbered league seasons so resetting after a completed run starts the next season instead of a nameless replay.
- Add rotating match challenges: KO Race, Mint Window, Amp Hunt, Captain Call, Field Claim, Last Stand, and Underdog Audit.
- Let challenges score from live match events: KOs, healer output, amplifier and scrap triggers, captain rallies, center/terrain/crown control, low-survivor wins, and comeback shields.
- Award challenge winners a visible surge, fan heat, a challenge-win stat in standings, challenge recaps, and root-card context.
- Add a field challenge ribbon so viewers can follow the current side objective at a glance.
- Add a TV challenge brief between the League Interstitial and Field Guide, using actual generated battler Nouns and live challenge progress.

## V14 Onboarding + Season 2 Scope Additions

- Add a replayable Watch Guide inside the game for first-time viewers and reviewers.
- Show the guide once for non-TV viewers, support direct onboarding links with `#guide=1`, and keep all onboarding state local.
- Add `G` as a TV shortcut for the guide while preserving `I` for the TV interstitial deck.
- Add a compact Season 2 scope board for Rookie Watch Path, Rivalry Weeks, Boss Fields, Playbook Traits, Recap Cards, and Commissioner's Cup.
- Track the full next-season scope in `docs/prd/nouns-nation-battler-season-2.md`.

## V15 Watch Party + GTM Additions

- Add an operator-facing Watch Party Kit to the normal game view.
- Generate invite copy from the live season, day, slate, matchup, field, challenge, and survivor count.
- Add copy buttons for the invite, TV route, rookie guide, and poster wall.
- Keep TV mode clean by hiding the Watch Party Kit on broadcast routes.
- Track the go-to-market plan in `docs/prd/nouns-nation-battler-gtm.md`.

## V16 Live Storyline Additions

- Add a live storyline engine that turns standings, bubble teams, fan heat, current challenge, survivor edge, and next fixture into short watch hooks.
- Surface storylines inside the Watch Party Kit so operators can explain why the current slate matters.
- Add a Copy Storyline action for quick group-chat followups.
- Feed the storyline digest into the TV path line so the broadcast itself carries the playoff-chase context.

## V17 Recap Studio Additions

- Add a post-match Recap Studio to the normal game route.
- Persist the latest recap cards in league state with phase, winner, score, field, challenge angle, MVP line, table hook, and next fixture.
- Generate recap cards for both live finishes and Quick Sim results.
- Add copy actions for the full recap and the next-match hook so every slate creates a followup artifact.
- Keep TV mode clean by hiding Recap Studio from fullscreen broadcast routes.

## V18 Rivalry Heat Additions

- Track head-to-head rivalry records inside the local league object without resetting existing v4 league saves.
- Label first meetings, runback rivalries, rivalry match numbers, and rubber matches in the match header.
- Award extra fan heat and a rivalry-win stat when a gang wins a rematch.
- Surface rivalry context in Watch Party copy, live storylines, TV lower text, league interstitials, root cards, standings, battle log, and Recap Studio.

## V19 Boss Field Additions

- Mutate late-season and playoff fields into boss variants without changing the league save schema.
- Add Monsoon Rift, Neon Crown, Scrap Storm, and Blackout Fog as stronger versions of Rift, Crown, Trash, and Fog.
- Activate boss fields automatically from regular season Day 8 onward and throughout playoffs.
- Support direct boss links with `boss=monsoon-rift`, `boss=neon-crown`, `boss=scrap-storm`, or `boss=blackout-fog`; `boss=off` disables the mutation.
- Surface boss context in the match title, challenge ribbon, TV lower text, Director Mode line, field-guide interstitial, Watch Party links, Recap Studio, and battle log.
- Give each boss field a readable sim effect: moving/wider rift lanes with Tide recovery, harder crown pressure, extra scrap storm tech, and stronger blackout ambush rules.

## V20 Bowl Countdown Additions

- Add a persistent Bowl Countdown card to the TV review strip.
- Show how many matches remain until the Nouns Bowl during the regular season, then switch to semifinal, final, and champion copy during playoffs.
- Highlight late regular-season and playoff countdown states so the broadcast feels closer to a live sports channel.
- Feed the same countdown line into the TV league interstitial meta so replayed briefs carry season urgency.

## V21 Commissioner Desk Additions

- Add a fourth TV overview interstitial called Commissioner Desk.
- Summarize the current table leader, cut-line pressure, fan-heat team, live survivor edge, boss-field hook, rivalry heat, next fixture, or playoff bracket depending on league phase.
- Give Commissioner Desk its own TV interstitial styling and Noun selection so it reads as a broadcast segment instead of another rule card.
- Keep the feature passive and local: no new controls, no persistence changes, no server data.

## V22 Desk Copy Additions

- Add a Copy Desk action to the Watch Party Kit.
- Generate share text from the same Commissioner Desk card shown in TV mode, including title, body, meta, and TV link.
- Let hosts explain "what matters now" in chat without rewriting the table, rivalry, boss field, or playoff context.
- Keep the copy action local and stateless alongside the existing invite, storyline, TV, guide, and poster copy buttons.

## V23 Desk Archive Additions

- Add a Commissioner Desk archive strip below the Watch Party Kit actions.
- Persist the current and recent desk reads in the local league object so a host can copy a previous slate summary after the live hook changes.
- Show compact labels for season, day/slate, playoff, or champion state, plus the desk title and meta line.
- Keep the archive small and local: six stored desk cards, four visible cards, no network state.

## V24 Season Desk Wall Additions

- Add `/nouns-nation-battler-desk/` as a public wrapper for a local Season Desk Wall.
- Add `/games/nouns-nation-battler/desk/` as the static wall that reads `pc:nouns-nation-league-v4` from the current browser.
- Combine recent Commissioner Desk reads, Recap Studio cards, top-line season state, and a copyable host run sheet.
- Link the wall from the Watch Party Kit and public battler page so operators have a cleaner post-slate handoff.

## V25 Portable Desk Snapshot Additions

- Encode Season Desk Wall state into `#snapshot=` links.
- Include phase, standings table, recent Commissioner Desk reads, and recent Recap Studio cards in the snapshot payload.
- Let viewers open a snapshot without overwriting their own `localStorage` league.
- Add copy actions for snapshot links and raw snapshot JSON, plus a Use Local action to return to the browser's own wall.

## V26 Printable Season Report Additions

- Add a printable Season Report panel inside the Season Desk Wall.
- Summarize source, phase, table leader, desk/recap counts, top standings, latest desk read, and recent recap cards.
- Add Copy Report and Print Report actions so hosts can send the season state to chat, notes, or a review thread.
- Render reports from local state or imported snapshot state without adding storage or overwriting a viewer's league.

## V27 Season Report Card Additions

- Add a 16:9 Social Report Card canvas to the Season Desk Wall.
- Render the active source, phase, table leader, top standings, latest desk line, latest recap, and TV link into a downloadable PNG.
- Add Copy Social Post and Download Card actions so a host can share the same slate state as text or image.
- Generate cards from local state or imported snapshot state without adding a backend or new persistence layer.

## V28 In-Session Report Gallery Additions

- Add an in-session Report Gallery to the Season Desk Wall.
- Let hosts save up to six generated report cards while the page is open.
- Allow saved cards to be re-downloaded and their matching social post text copied from the gallery.
- Keep the gallery ephemeral and browser-only so it supports slate review without adding storage, accounts, or publishing state.

## V29 Shareable Report Card Link Additions

- Add Copy Card Link to the Season Desk Wall.
- Encode the same snapshot payload into `#snapshot=...&view=card` links so a single report card opens in focused view.
- Add Copy Link to saved Report Gallery cards so a host can share a selected card without manually rebuilding the URL.
- Keep card links snapshot-backed and local/client-rendered, with no backend image storage or local league mutation.

## V30 League Integrity + Watch Now Additions

- Preserve simulated winner and loser scores when Quick Sim creates league recaps, standings totals, and Desk Wall report cards.
- Add a focused `nouns-nation-battler-score` regression test so quick-sim results cannot silently drift from recap text again.
- Add a compact Watch Now rail in the normal game view with the current matchup, field, challenge progress, Bowl countdown, rooting prompt, and post-slate card handoff.
- Copy Desk Wall snapshot and card links against the canonical PointCast desk route when generated from localhost, so shared report cards do not leak dev URLs.

## V31 Agent Bench + MCP Handoff Additions

- Add `/nouns-nation-battler-agents/` as the public Agent Bench for Claude, ChatGPT, Codex, Cursor, and MCP-aware visitors.
- Add `/nouns-nation-battler-agents.json` as the machine-readable task board with scout, host, commentator, art-director, designer, fan, and QA tasks.
- Add MCP tools `nouns_battler_manifest`, `nouns_battler_agent_tasks`, and `nouns_battler_presence`.
- Add MCP resources `nouns-battler://agent-bench` and `nouns-battler://manifest`.
- Use existing anonymous presence as opt-in room presence for agents: caller-generated `sid`, `kind=agent`, public Noun number, no raw session ids in broadcasts.
- Link the Agent Bench from the public Battler page, `/agents.json`, `/for-agents`, and the Battler manifest.

## V32 Results Desk MCP Additions

- Add `nouns_battler_result_tracker` so Claude/Cowork can track results from Desk Wall snapshot URLs, raw snapshot JSON, or copied Recap Studio text.
- Add `nouns_battler_cowork_brief` for scorekeeper, color-commentator, commissioner, and group-chat host modes.
- Add `nouns-battler://results-kit` as the MCP resource for result schema, accepted inputs, and Cowork prompts.
- Extend `/nouns-nation-battler-agents.json` with `resultTracking` so non-MCP agents can still learn how to keep the scorebook.
- Keep result tracking local-to-client unless a user explicitly pastes or shares a snapshot/recap. No backend results ledger yet.

## V33 Desk Wall Watch Frame Additions

- Add Desk Wall view modes for four ways to watch the same snapshot: `view=card`, `view=scoreboard`, `view=story`, and `view=agent`.
- Add a Watch Frames rail that creates snapshot-backed canonical links for the report card, scoreboard, story desk, and agent scorebook frames.
- Add Copy Claude Prompt actions that package the active Desk Wall snapshot for `nouns_battler_result_tracker` and ask the agent to keep a running scorebook.
- Add an Agent Scorebook frame that makes the MCP handoff visible and copyable for Claude/Cowork, ChatGPT, Cursor, or another MCP-aware client.
- Extend `/nouns-nation-battler-agents.json` with `watchFrames` so visiting agents know which frame to open for scorekeeping, commentary, hosting, or sharing.

## V34 Agent Claim Queue Additions

- Add `claimQueue` to `/nouns-nation-battler-agents.json` with eight timeboxed task packs.
- Give each task pack a lane, priority, role, timebox, start link, steps, expected output, proof requirement, and share format.
- Extend the human Agent Bench with a Claim Queue section before the reusable prompt bank.
- Extend `nouns_battler_agent_tasks` so MCP clients can request a claim-queue task by `taskId` or filter by `lane`.
- Keep output client-side. The claim queue guides work; it does not store assignments or identify people.

## V35 Agent Sideline Desk + Asset Factory Additions

- Add `/nouns-nation-battler-agents/desk/` as a local-first claim/report/asset studio for visiting agents.
- Assign a temporary public Agent Noun identity, selected task pack, work-frame link, report composer, ticker line, and local saved report stack.
- Extend the claim queue with asset, growth, and economy tasks: asset factory drop, sponsor slot packaging, and participant yield loop design.
- Add `assetFactory`, `businessModel`, and `participantYield` to `/nouns-nation-battler-agents.json` and `/nouns-nation-battler.json`.
- Add MCP tool `nouns_battler_asset_factory` and resource `nouns-battler://asset-factory` for posters, ads, art prompts, product concepts, sponsor reads, report cards, and rewards-loop briefs.
- Treat "yield" as a prototype participant rewards/accounting model, not a promised investment return.

## Persistence

- Store league state in `localStorage` under `pc:nouns-nation-league-v4`.
- Store recent Commissioner Desk archive cards in that same local league object.
- Let the Season Desk Wall read from the same local league object without adding server state.
- Let imported Desk Wall snapshots live only in the URL hash unless the host explicitly returns to local state.
- Render Season Reports from the active local or snapshot wall state without creating a new persistence layer.
- Render Season Report cards directly in the browser canvas without storing images.
- Keep Report Gallery cards in memory only for the active Desk Wall session.
- Let shareable card links carry snapshot state in the URL hash and render in focused card view.
- Keep shared Desk Wall links canonical to the public PointCast desk route when copied from local development.
- Continue storing root preference under `pc:nouns-nation-root`.
- Continue storing all-time local season stats under `pc:nouns-nation-season`.
- Do not store Agent Bench task output server-side. Visiting agents either report back to the user/client or opt into existing anonymous presence.
- Do not store Results Desk updates server-side. MCP result tracking reads user-supplied snapshots or recap text and returns a scorebook response to the caller.
- Watch frame links remain URL-hash snapshots and do not mutate the local Desk Wall unless the viewer explicitly chooses local state.

## Acceptance Criteria

- A fresh browser can run from Day 1 through the Nouns Bowl without user input.
- Reset League clears only league-mode state, not root preference.
- Standings update immediately after each match.
- Playoff fixtures are created from the regular-season table.
- The final champion is displayed and auto-next stops.
- Quick Sim and Sim Day advance league state without requiring the visible match to finish.
- Quick Sim recaps, logs, and league scoring preserve the same simulated final score.
- Clicking a numbered Noun updates the scout card without pausing the match.
- `/nouns-nation-battler-tv` loads the no-chrome cast route and the normal route remains unchanged.
- TV keyboard shortcuts work without exposing the operator controls on screen.
- TV mode shows Market Pulse, MVP Watch, and Comeback Line cards that update while the match runs.
- Amplifier Rift matches display a visibly different field with element zones and amplifier move events.
- Poster series route displays 20 varied type-heavy posters using actual Nouns battler sprites.
- Crown Rush matches display a visibly different field with a center crown, crowned Noun state, and crown pressure events.
- TV mode shows Director Mode camera/replay cues and highlights the currently featured Noun.
- Lava Audit, Cloud Court, Trash Planet, and Fog Bowl can be forced with `?type=lava`, `?type=cloud`, `?type=trash`, and `?type=fog`.
- TV mode shows a Noun-heavy League Interstitial and Field Guide at match start, and `I` replays the overview deck.
- Each match arms a Season Challenge and surfaces its progress in the field ribbon, stat strip, standings/rooting layer, and TV challenge interstitial.
- Resetting a league advances to the next numbered season locally.
- The Watch Guide can be opened from the controls, direct `#guide=1` links, and TV `G`.
- The normal view includes a compact Watch Now rail that explains the current matchup before the deeper controls.
- The public Battler page links to the Agent Bench and task JSON.
- `/nouns-nation-battler-agents/` renders a human-readable task board and privacy stance.
- `/nouns-nation-battler-agents.json` returns CORS-open task data for visiting agents.
- `/api/mcp-v2` exposes Battler task, manifest, and presence tools plus Battler resources.
- Agent presence remains opt-in and anonymous; no raw session ids or personal identifiers are broadcast.
- `/api/mcp-v2` can turn a Desk Wall snapshot URL, snapshot JSON, or Recap Studio text into standings, latest recaps, parsed final score, and Cowork cards.
- The Season Desk Wall can open snapshot-backed card, scoreboard, story, and agent scorebook frames with dedicated `view=` modes.
- The Season Desk Wall can copy a Claude/Cowork prompt that calls `nouns_battler_result_tracker` with the active snapshot.
- The normal view shows a Season 2 scope board without blocking play.
- The normal view includes a Watch Party Kit with live invite copy and copyable links for TV, guide, and posters.
- Live storylines update from the current table, challenge, survivor count, and next fixture.
- The normal view includes a Recap Studio that updates after live and quick-sim results with copyable recap text and a next-match hook.
- Repeat fixtures show rivalry labels, head-to-head records, rivalry heat, and extra fan heat for rivalry wins.
- Boss fields activate late in the season or playoffs, can be forced with `boss=<id>`, and appear in TV, recap, watch-party, and field-guide surfaces.
- TV mode shows a Bowl Countdown card that updates across regular season, playoffs, final, and champion states.
- TV interstitial replay includes a Commissioner Desk segment that explains table movement and next-match stakes.
- The Watch Party Kit includes a Copy Desk action that shares the current Commissioner Desk readout.
- The Watch Party Kit keeps a compact Commissioner Desk archive with copy buttons for recent league reads.
- The public Season Desk Wall shows local desk reads, recap cards, metrics, and a copyable run sheet.
- The Season Desk Wall can export and load snapshot links without changing local league state.
- The Season Desk Wall can copy and print a Season Report from local or snapshot state.
- The Season Desk Wall can download a 16:9 Season Report card and copy matching social post text.
- The Season Desk Wall can save up to six in-session report cards, then copy or re-download each one.
- The Season Desk Wall can copy a focused report-card link from the current card or a saved gallery card.
- The Season Desk Wall copies public PointCast card links when generated from localhost.
- `npm run build` succeeds.
- The game remains playable inside the Pointcast iframe.
