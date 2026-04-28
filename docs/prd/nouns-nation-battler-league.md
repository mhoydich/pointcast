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
- `npm run build` succeeds.
- The game remains playable inside the Pointcast iframe.
