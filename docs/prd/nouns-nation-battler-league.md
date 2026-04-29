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

## Persistence

- Store league state in `localStorage` under `pc:nouns-nation-league-v4`.
- Continue storing root preference under `pc:nouns-nation-root`.
- Continue storing all-time local season stats under `pc:nouns-nation-season`.

## Acceptance Criteria

- A fresh browser can run from Day 1 through the Nouns Bowl without user input.
- Reset League clears only league-mode state, not root preference.
- Standings update immediately after each match.
- Playoff fixtures are created from the regular-season table.
- The final champion is displayed and auto-next stops.
- Quick Sim and Sim Day advance league state without requiring the visible match to finish.
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
- The normal view shows a Season 2 scope board without blocking play.
- The normal view includes a Watch Party Kit with live invite copy and copyable links for TV, guide, and posters.
- Live storylines update from the current table, challenge, survivor count, and next fixture.
- The normal view includes a Recap Studio that updates after live and quick-sim results with copyable recap text and a next-match hook.
- Repeat fixtures show rivalry labels, head-to-head records, rivalry heat, and extra fan heat for rivalry wins.
- Boss fields activate late in the season or playoffs, can be forced with `boss=<id>`, and appear in TV, recap, watch-party, and field-guide surfaces.
- `npm run build` succeeds.
- The game remains playable inside the Pointcast iframe.
