# Nouns Nation Battler Season 2 PRD

## Summary

Season 2 should make Nouns Nation Battler easier to enter and richer to follow. V13 proved the two-week league, TV cast, field variants, and Season Challenges work as a passive watch toy. The next pass should add a clear rookie path, stronger gang identity, mid-season stakes, and post-match artifacts without turning the game into manual micromanagement.

## Audience

- First-time viewers opening the normal game room.
- TV viewers watching a cast route from across a room.
- Reviewers who need to understand the loop in under 30 seconds.
- Returning viewers who want a new reason to run another season.
- People entering through a shared TV invite or poster wall.
- Visiting AI agents asked to scout, host, QA, commentate, or invent season mutations.

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

### Bowl Countdown

The TV cast should keep the season destination visible even when a viewer joins mid-match:

- Add a persistent countdown card in the TV review strip. Shipped in V20.
- Count down regular-season matches to the Nouns Bowl path, then switch to semifinal, final, and champion states. Shipped in V20.
- Reuse the countdown line inside the TV league interstitial so replayed briefs explain the stakes. Shipped in V20.

### Commissioner Desk

The TV cast should periodically explain the table like a tiny sports desk:

- Add a Commissioner Desk segment to the TV interstitial deck. Shipped in V21.
- Summarize leader, cut line, fan heat, survivor edge, rivalry heat, boss field, and next fixture when relevant. Shipped in V21.
- Switch to bracket and champion copy during playoffs and post-season. Shipped in V21.
- Add a Copy Desk action in the Watch Party Kit so the same desk read can be sent to chat. Shipped in V22.
- Add a compact Commissioner Desk archive in the Watch Party Kit so recent table reads can be copied after the slate moves on. Shipped in V23.
- Add a Season Desk Wall that combines local desk reads, recap cards, and a copyable host run sheet. Shipped in V24.
- Add portable Desk Wall snapshot links that can be opened without mutating local league state. Shipped in V25.
- Add copyable and printable Season Reports to the Desk Wall so a host can send one clean season read after a slate. Shipped in V26.
- Add downloadable 16:9 Season Report cards and matching social post copy to the Desk Wall. Shipped in V27.
- Add an in-session Report Gallery for comparing and re-sharing multiple report cards during a slate. Shipped in V28.
- Add shareable report-card links that open snapshot-backed cards in focused view. Shipped in V29.
- Add league-integrity scoring coverage, canonical public card links, and a compact Watch Now rail. Shipped in V30.
- Add an Agent Bench plus MCP handoff so Claude, ChatGPT, Codex, Cursor, and other visiting agents can receive scout, host, fan, QA, and season-design tasks. Shipped in V31.
- Add a Results Desk MCP so Claude/Cowork can track the league from Desk Wall snapshots or copied recap text. Shipped in V32.
- Add Desk Wall watch frames for report card, scoreboard, story desk, and agent scorebook views, plus a copyable Claude/Cowork scorebook prompt. Shipped in V33.
- Add a claim queue of timeboxed tasks so visiting agents can pick a concrete watch, MCP, creative, design, audience, or QA job. Shipped in V34.

### Agent Bench

The league should be legible to visiting AI agents, not just humans:

- Publish a human Agent Bench at `/nouns-nation-battler-agents/`.
- Publish a machine task board at `/nouns-nation-battler-agents.json`.
- Expose Battler tasks, manifest, and presence handoff through PointCast MCP.
- Treat "people tracking" as opt-in anonymous presence only: generated session id, public Noun number, no raw session ids in broadcasts, no server-side task output storage.
- Give agents creative jobs that help the broadcast: scout notes, desk reads, poster captions, commentary lines, QA reports, and next-season mutations.
- Add a scorebook layer that accepts Desk Wall snapshot URLs, raw snapshot JSON, or Recap Studio text and returns standings, latest recaps, parsed finals, and next-watch prompts.
- Support Cowork modes: scorekeeper, color commentator, commissioner, and group-chat host.
- Expose snapshot-backed watch frames so agents can open the right view for scorekeeping, commentary, hosting, or sharing.
- Expose a claim queue with task packs that name start links, steps, expected output, proof, and share format.

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

### Sprint E: Broadcast Stakes

- Add a Bowl Countdown card to TV mode. Shipped in V20.
- Highlight final-stretch and playoff countdown states. Shipped in V20.
- Add the countdown to league interstitial metadata. Shipped in V20.
- Add a Commissioner Desk interstitial for table movement and next-match stakes. Shipped in V21.
- Add a Copy Desk action that reuses Commissioner Desk copy for chat/share handoff. Shipped in V22.
- Add a persistent local desk archive strip for reusable host notes. Shipped in V23.
- Add a local public Desk Wall route for host recaps and run sheets. Shipped in V24.
- Add copyable Desk Wall snapshot links and raw snapshot JSON exports. Shipped in V25.
- Add printable Season Reports and copy-ready report text for local and snapshot Desk Wall states. Shipped in V26.
- Add browser-rendered Season Report card PNG downloads and social post text for shareable slate artifacts. Shipped in V27.
- Add ephemeral Report Gallery saves so hosts can collect up to six card/caption pairs before posting. Shipped in V28.
- Add current-card and gallery-card share links using `view=card` snapshot URLs. Shipped in V29.
- Add quick-sim score regression coverage, canonical copied card URLs, and a Watch Now viewer-entry rail. Shipped in V30.
- Add Agent Bench JSON, human page, `/agents.json` discovery, and MCP Battler tools. Shipped in V31.
- Add Results Desk MCP tools and resource for snapshot/recap-based scorekeeping. Shipped in V32.
- Add snapshot-backed Desk Wall `view=card`, `view=scoreboard`, `view=story`, and `view=agent` modes plus a Watch Frames rail. Shipped in V33.

## Acceptance Criteria

- A new viewer can open the game, understand the loop, and dismiss the guide in one click.
- `#guide=1` opens directly to the guide.
- TV mode supports `G` for guide and preserves `I` for interstitial replay.
- Season 2 scope is visible without blocking the match in normal mode.
- Recap Studio creates a copy-ready result artifact after live and quick-sim matches.
- Rivalry context appears in normal, TV, rooting, standings, and recap surfaces once fixtures repeat.
- Boss fields appear late-season or in playoffs, can be forced by URL, and change both field behavior and TV/recap language.
- TV mode keeps the Nouns Bowl destination visible through a live countdown card.
- TV interstitial replay includes a Commissioner Desk segment that changes by league phase.
- Watch Party Kit can copy the current Commissioner Desk summary in one click.
- Watch Party Kit can copy recent Commissioner Desk archive cards without leaving the match.
- `/nouns-nation-battler-desk/` shows local desk reads, recap cards, and a copyable host run sheet.
- Desk Wall snapshot links load as imported snapshots and can return to the local wall.
- Desk Wall Season Reports can be copied or printed from local and imported snapshot state.
- Desk Wall Season Report cards can be downloaded as PNGs and paired with copied social post text.
- Desk Wall Report Gallery can save, clear, copy, and re-download in-session report cards.
- Desk Wall card links open focused report cards from snapshot state without mutating local league state.
- Quick Sim recaps and league scoring preserve the same final score.
- Copied Desk Wall card links use public PointCast URLs when generated from localhost.
- Normal mode exposes a Watch Now rail before the deeper operator kit.
- Agent Bench exposes opt-in anonymous presence and concrete tasks for visiting agents.
- Agent Bench exposes a claim queue for scorekeeping, TV direction, Cowork result tracking, brand reads, Season 2 rules, poster copy, QA, and savvy viewer review prompts.
- MCP clients can call `nouns_battler_agent_tasks`, `nouns_battler_manifest`, and `nouns_battler_presence`.
- MCP clients can call `nouns_battler_result_tracker` with a Desk Wall snapshot URL, snapshot JSON, or Recap Studio text and receive a scorebook brief.
- Desk Wall watch frames can be copied as snapshot-backed links for report-card, scoreboard, story-desk, or agent-scorebook viewing.
- The Agent Scorebook frame gives Claude/Cowork a ready prompt for `nouns_battler_result_tracker`.
- No onboarding state is transmitted; it stays in localStorage.
- `npm run build` succeeds.
- The battler remains playable inside the PointCast iframe and direct static route.
