# Nouns Nation Battler Season 2 PRD

## Summary

Season 2 should make Nouns Nation Battler easier to enter and richer to follow. V13 proved the two-week league, TV cast, field variants, and Season Challenges work as a passive watch toy. The next pass should add a clear rookie path, stronger gang identity, mid-season stakes, and post-match artifacts without turning the game into manual micromanagement.

## Audience

- First-time viewers opening the normal game room.
- TV viewers watching a cast route from across a room.
- Reviewers who need to understand the loop in under 30 seconds.
- Returning viewers who want a new reason to run another season.
- People entering through a shared TV invite or poster wall.

## Onboarding Approach

- Add a replayable Watch Guide inside the game, not a separate landing page.
- Show the guide once for first-time non-TV viewers, then store dismissal locally.
- Support direct onboarding links with `#guide=1` or `#onboard=1`.
- Use the Watch Party Kit to send the TV cast, guide, and poster wall without rewriting the invite.
- Keep TV mode clean by default, but add `G` as a TV shortcut for the guide.
- Keep `I` for the TV interstitial deck: league brief, season challenge, field guide.
- Explain only the decisions a viewer can make: watch, root, scout, follow the challenge.
- Avoid tutorial chores. The match keeps running while the guide is open.

## Season 2 Themes

### Rookie Watch Path

The first 30 seconds should answer:

- What is happening?
- Who should I root for?
- What does the green challenge ribbon mean?
- Why are the standings and root cards changing?
- Where do I look for the hot Noun?
- Why does this slate matter right now?

### Rivalry Weeks

Second-round rematches should feel different from first meetings:

- Add rivalry labels to repeat fixtures. Shipped in V18.
- Track series score across the current season. Shipped in V18 as local `rivalries`.
- Award extra fan heat for rivalry wins. Shipped in V18 for repeat fixtures.
- Surface rivalry context in TV lower thirds and root cards. Shipped in V18.

### Boss Fields

Late-season fields can mutate into more dramatic variants:

- Monsoon Rift: amplifier lanes move faster and Tide healing matters. Shipped in V19.
- Neon Crown: crown holder charges specials but draws pressure pulses. Shipped in V19.
- Blackout Fog: ranged damage drops harder and close ambushes spike. Shipped in V19.
- Scrap Storm: Trash Planet gives more guard, storm tech, and sudden recoveries. Shipped in V19.

### Playbook Traits

Each gang should carry two seasonal modifiers:

- One identity trait tied to the brand kit.
- One schedule trait that changes based on standings, rivalry, or field type.
- Traits should change automated behavior lightly, not require player control.

### Recap Cards

After each slate, generate a local share card:

- MVP Noun.
- Challenge winner.
- Field type.
- Final survivor score.
- Next matchup.

The existing poster system can supply the visual language; this should feel like a sports-page tear sheet rather than a data export.

### Commissioner's Cup

Explore a mid-season knockout bracket:

- Runs on Day 7 or after a complete first round-robin.
- Uses four teams based on current fan heat or challenge wins.
- Awards a cup badge and fan heat.
- Does not replace the Nouns Bowl.

## Sprint Plan

### Sprint A: Onboarding

- Ship Watch Guide overlay.
- Add direct onboarding URL hash support.
- Add TV `G` shortcut.
- Add Season 2 scope board in the normal operator view.
- Add live storyline hooks for table leader, cut line, hot gang, and next fixture.
- Update docs and manifest language.

### Sprint B: Rivalry System

- Detect repeat fixtures. Shipped in V18.
- Track head-to-head series inside the local league object. Shipped in V18.
- Add rivalry badge to matchup, TV line, and battle log. Shipped in V18.
- Award extra fan heat for rivalry wins. Shipped in V18.

### Sprint C: Boss Fields

- Add one boss field variant for Rift, Crown, Fog, and Trash. Shipped in V19.
- Rotate boss fields only after Day 8 or in playoffs. Shipped in V19.
- Add field-specific challenge hooks through stronger terrain, crown, rift, and fog mechanics. Shipped in V19.
- Add TV field guide language for boss variants. Shipped in V19.

### Sprint D: Recap Artifacts

- Add a slate recap object to local league state. Shipped in V17 as persisted `recapCards`.
- Render the latest recap card inside the game. Shipped in V17 Recap Studio.
- Add copy actions for recap text and next-match hook.
- Add a printable or poster-wall-compatible recap route later.

## Acceptance Criteria

- A new viewer can open the game, understand the loop, and dismiss the guide in one click.
- `#guide=1` opens directly to the guide.
- TV mode supports `G` for guide and preserves `I` for interstitial replay.
- Season 2 scope is visible without blocking the match in normal mode.
- Recap Studio creates a copy-ready result artifact after live and quick-sim matches.
- Rivalry context appears in normal, TV, rooting, standings, and recap surfaces once fixtures repeat.
- Boss fields appear late-season or in playoffs, can be forced by URL, and change both field behavior and TV/recap language.
- No onboarding state is transmitted; it stays in localStorage.
- `npm run build` succeeds.
- The battler remains playable inside the PointCast iframe and direct static route.
