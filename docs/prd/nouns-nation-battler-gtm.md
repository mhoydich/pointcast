# Nouns Nation Battler Go-To-Market Strategy

## Goal

Turn Nouns Nation Battler from a cool local watch toy into a repeatable watch event. The strategy is to give people a clear reason to watch now, a simple way to choose a side, and an artifact they can share after the match.

## Product Audit

### What Already Works

- The TV cast is visually loud and easy to leave running.
- The 30 vs 30 Nouns field reads immediately, even before someone understands the rules.
- Numbered battlers, scout cards, challenge ribbons, and live stat leaders give viewers things to point at.
- The two-week table and Nouns Bowl give every match context.
- The poster wall creates a natural post-match artifact.

### Friction

- A new viewer needs a fast answer to "why should I watch this match right now?"
- The share target should be TV-first, not the operator controls.
- There was no in-game launch copy, so every invite had to be written from scratch.
- The poster wall was discoverable, but not positioned as the after-match share object.
- The league cadence needs a social ritual: lunch slate, dinner slate, late slate, or weekend Bowl.

### V15 Improvements

- Add an in-game Watch Party Kit in normal mode.
- Generate live invite copy from the current season, day, matchup, field, challenge, and survivor count.
- Add one-click copy buttons for invite text, TV link, rookie guide, and poster wall.
- Keep TV mode clean while making the operator surface useful for sharing.
- Link this GTM strategy from the public battler page and JSON manifest.

### V16 Improvements

- Add live storylines for playoff chase, current field/challenge angle, fan heat, survivor edge, and next fixture.
- Add Copy Storyline for quick group-chat followups after the first invite.
- Feed the same digest into TV mode so passive viewers understand the stakes without opening controls.

### V17 Improvements

- Add Recap Studio so every finished match creates a copy-ready result card.
- Include winner, score, field, challenge angle, MVP line, table hook, and next fixture on the card.
- Support live finishes and Quick Sim results so operators can generate followup artifacts quickly.
- Add Copy Recap and Copy Next Hook actions to make the post-match loop as easy as the pre-match invite.

### V18 Improvements

- Add rivalry heat for repeat fixtures so second-round matchups feel like runbacks.
- Track local head-to-head records, rivalry wins, last result, and rivalry heat.
- Surface rivalry copy in the TV cast, Watch Party Kit, root cards, standings, battle log, and Recap Studio.
- Give rematch winners extra fan heat so rivalry games matter in the table story.

### V19 Improvements

- Add late-season boss fields so the back half of a season feels different from early slates.
- Ship Monsoon Rift, Neon Crown, Scrap Storm, and Blackout Fog as visible, rule-changing field mutations.
- Let operators force a boss field in share links with `boss=<id>` and keep `boss=off` available for normal-field review.
- Surface boss field stakes in the TV cast, challenge ribbon, field guide, Watch Party link, Recap Studio, and match log.
- Make boss fields a launch hook for playoff-chase invites and Nouns Bowl week.

### V20 Improvements

- Add a Bowl Countdown card to the TV review strip so viewers immediately understand how close the season is to the final.
- Change the card language across regular season, final stretch, semifinals, Nouns Bowl final, and champion states.
- Add the countdown to TV league interstitial metadata for quick replays and watch-party resets.
- Use the countdown as a simple recurring invite hook: "X to Bowl" is easier to share than a full standings explanation.

### V21 Improvements

- Add a Commissioner Desk interstitial to explain the table, cut line, fan heat, live edge, and next fixture in plain broadcast language.
- Use phase-aware copy so regular season, playoffs, final, and champion states each get a relevant desk read.
- Give the desk its own visual treatment so TV replay has a distinct "what matters now" beat.
- Position the desk as a host-friendly summary before sharing a storyline or recap.

### V22 Improvements

- Add Copy Desk to the Watch Party Kit so the Commissioner Desk read can be sent directly to chat.
- Reuse the same desk title, body, meta, and TV link from the broadcast segment.
- Give hosts a lower-effort followup after someone asks why the match matters.
- Keep the post-invite loop simple: Copy Invite, Copy Storyline, Copy Desk, then TV/Guide/Posters.

### V23 Improvements

- Add a Commissioner Desk archive strip to the Watch Party Kit.
- Keep recent desk reads copyable after the current match, slate, or playoff state changes.
- Give hosts a lightweight "what happened today" source without asking them to reconstruct standings from the table.
- Keep the archive local and small so it feels like a host clipboard, not a new publishing workflow.

### V24 Improvements

- Add a public Season Desk Wall wrapper at `/nouns-nation-battler-desk/`.
- Read local Commissioner Desk archive cards and Recap Studio cards into one host-facing wall.
- Generate a copyable host run sheet from the current phase, table leader, latest desk read, and latest recap.
- Link Desk Wall from the Watch Party Kit so the host can move from live invite to post-slate summary.

### V25 Improvements

- Add portable Desk Wall snapshots through a `#snapshot=` URL payload.
- Let hosts copy a snapshot link or snapshot JSON from the Desk Wall.
- Load snapshot links without writing over the viewer's local league state.
- Keep a Use Local action so a host can switch back to their own browser season quickly.

### V26 Improvements

- Add a printable Season Report to the Desk Wall so a host can produce a clean post-slate artifact.
- Include the table leader, top standings, latest Commissioner Desk read, and recent Recap Studio cards.
- Add Copy Report and Print Report actions for lunch review, chat summaries, or post-season notes.
- Let imported snapshot links produce the same report without mutating the viewer's local league.

### V27 Improvements

- Add a 16:9 Social Report Card to the Desk Wall.
- Render table leader, phase, top standings, latest desk read, latest recap, and TV link into a downloadable PNG.
- Add Copy Social Post so the image has a ready caption and snapshot link.
- Keep the card browser-only so the host can generate artifacts from local or imported snapshot state.

### V28 Improvements

- Add an in-session Report Gallery to the Desk Wall.
- Let a host save up to six generated report cards while a slate or review session is underway.
- Add per-card Copy Post and Download actions so the host can compare cards before sharing.
- Keep the gallery ephemeral so it behaves like a producer clipboard, not a public archive.

### V29 Improvements

- Add shareable report-card links to the Desk Wall.
- Use `#snapshot=...&view=card` URLs so the card opens as a focused, viewer-safe artifact.
- Add Copy Card Link for the current report card and Copy Link for saved gallery cards.
- Put the card link into social post copy so text and visual artifact travel together.

### V30 Improvements

- Add a Watch Now rail so a new viewer gets the current matchup, field, side quest, Bowl countdown, rooting prompt, and post-slate artifact path before seeing the deeper controls.
- Fix Quick Sim score consistency so recaps, standings totals, logs, and Desk Wall reports agree on the same simulated result.
- Add focused battler score regression coverage to keep league integrity from drifting during future sprints.
- Copy public PointCast card URLs from the Desk Wall when report-card links are generated on localhost.

## Audience

- Nouns people who like weird sport-like internet artifacts.
- Friends who will watch a chaotic match if the invite has a specific matchup.
- Designers and poster people who may enter through the 20-piece type-heavy poster wall.
- Streamers or group-chat hosts who want a passive second-screen thing.
- Agents and builders who can read the manifest and help route viewers into the right surface.

## Positioning

Nouns Nation Battler is a fully automated 30 vs 30 Nouns league. You pick a gang, watch the live challenge, and follow the table toward the Nouns Bowl.

Short hook:

> Pick a gang. Watch 60 Nouns fight. Follow the table to the Nouns Bowl.

Long hook:

> Nouns Nation Battler is an automated watch-party sport: 30 Nouns per side, weird fields, live challenges, stats, posters, and a two-week season that ends in the Nouns Bowl.

## Launch Funnel

1. Invite people to the TV cast.
2. Give them one sentence: the current matchup, field, and challenge.
3. Ask them to pick a gang before the match resolves.
4. Use the live storyline as the followup: leader, cut line, hot gang, rivalry runback, or next fixture.
5. After the slate, share the Recap Studio card, then point people to the poster wall.
6. Bring them back for the next scheduled slate or Nouns Bowl.

## Distribution Plan

### Phase 1: Warm Watch Tests

- Send direct TV links to small group chats.
- Use `#guide=1` for anyone who asks what is happening.
- Ask each viewer which gang they rooted for and what part was confusing.
- Capture the most watchable moments as copy for the next invite.

### Phase 2: Public Ritual

- Run one named watch window per day: Lunch Slate, Dinner Slate, or Late Slate.
- Make the invite about the current matchup instead of the whole app.
- Keep the ask small: watch one match, pick one side.
- Use the poster wall as the after-match share.

### Phase 3: Season Event

- Market the last two regular-season days as playoff-chase days.
- Market the final as the Nouns Bowl.
- Use standings, rivalry labels, and challenge winners as storylines.
- Publish a post-season recap with MVP, champion, best field, and best poster.

## Channel Strategy

- Group chat: fastest feedback, best for first watch tests.
- Farcaster/X-style social post: one strong matchup hook plus TV link.
- Nouns channels: emphasize actual Nouns sprites, gang identity, and Nouns Bowl framing.
- PointCast battler channel: archive recaps, posters, and season moments.
- Poster wall: design-forward entry point for people who may not start with the game.

## Sample Posts

### TV Invite

Pick a gang for Nouns Nation Battler: [LEFT] vs [RIGHT] on [FIELD]. The [CHALLENGE] is live and 60 Nouns are on the field. TV cast: https://pointcast.xyz/nouns-nation-battler-tv/

### Rookie Invite

Never watched? Start here: https://pointcast.xyz/games/nouns-nation-battler/#guide=1. It is a two-week automated Nouns league with 30 Nouns per side and a Nouns Bowl final.

### Poster Follow-Up

The match is over. Copy the Recap Studio result first, then use the poster wall as the archive: https://pointcast.xyz/nouns-nation-battler-posters/

### Sponsor Reservation

Sponsor the weirdest match on the slate: reserve a ticker, match read, field naming burst, gang patron package, poster/product drop, agent bounty pool, or Nouns Bowl partner slot. No checkout yet; generate the card and route accepted work to participant credit: https://pointcast.xyz/nouns-nation-battler-sponsors/

### Season Lore Sponsor Hook

Start with the first four seasons highlight reel. Pick a Noun, a champion, or a weird field, then ask an agent to turn it into one poster, one product mock, one ticker, and one proof checklist.

## Sponsorship Funnel

1. Send likely sponsors to the Sponsorship Desk instead of a payment form.
2. Let them scan actual Nouns, first-four-season highlights, and creative inventory before choosing a package.
3. Let them choose a package and generate a copyable reservation card.
4. Hand the agent brief to Claude, ChatGPT, Codex, Cursor, or a human producer.
5. Human reviews what ships: ticker, read, poster prompt, product concept, bounty task, or recap line.
6. Accepted sponsor work becomes broadcast copy or assets and receives participant-pool credit before any real payout.
7. When payment/legal rails exist, convert high-signal reservation packages into real sponsor slots.

## Metrics

- Direct TV link opens.
- Guide link opens.
- Poster wall opens after a match.
- Recap card copies after a match.
- Rivalry runbacks get replies, picks, or repeat viewers.
- Boss field TV links get opens, replies, or longer watch sessions.
- Bowl Countdown wording gets repeated in invites or chat.
- Commissioner Desk wording reduces "what am I watching?" questions.
- Copy Desk gets used after the first invite or during a mid-match check-in.
- Desk Archive copies get used for lunch/dinner slate recaps or late arrivals.
- Desk Wall opens and run-sheet copies after a slate.
- Snapshot links get shared after a slate or Nouns Bowl result.
- Season Report copies or prints after a slate, Nouns Bowl, or review session.
- Season Report card downloads and copied social posts after a slate.
- Report Gallery saves per slate and re-download/copy actions before posting.
- Report card links shared from current cards or saved gallery cards.
- Watch Now rail gets people to choose a side or open TV before reading the full controls.
- Quick-sim recaps match the visible final score when hosts race through a slate.
- Number of people who choose a gang in replies or chat.
- Repeat viewers across two slates.
- Which field/challenge pair gets people to stay longest.
- Sponsorship Desk opens from the Battler hub, Agent Bench, Sideline Desk, or MCP.
- Sponsor visitors scroll or reference the featured Noun cast and first-four-season highlight reel.
- Sponsor reservation cards copied or saved locally.
- Agent sponsor briefs copied into another client.
- Accepted sponsor packages that produce usable TV, Desk Wall, poster, or bounty output.
- Participant-credit notes attached to accepted sponsor work.

## Next Product Bets

- Boss field recap/poster archive for the wildest late-season matches.
- Shareable match URLs that pin field, challenge, and team pairing.
- Optional "commissioner notes" that summarize the day in one paragraph.
- A recap archive wall that collects the best result cards across a season.
- A hosted report gallery for favorite Desk Wall snapshots and printed Season Reports.
- One-click image posting once hosted report cards are ready for public sharing.
- Persistent report-card collections if in-session gallery use proves repeatable.
- Hosted card-image rendering if snapshot-backed card links get traction.
- Lightweight season integrity tests for playoff seeding, boss-field routing, and challenge awards.
- Accepted Work Ledger for sponsor reservations, accepted/rejected status, contributor points, and participant-credit accounting.

## Acceptance Criteria

- The normal game view includes a Watch Party Kit.
- The kit generates live matchup/challenge copy.
- The kit exposes live storylines and a copyable storyline digest.
- Recap Studio generates copyable result cards after live and quick-sim matches.
- Repeat fixtures expose rivalry labels, head-to-head records, and extra fan heat.
- Boss fields provide a late-season TV hook and appear in share/recap language.
- TV mode includes a Bowl Countdown card that can anchor invites and watch-party chatter.
- TV interstitial replay includes a Commissioner Desk segment for table context.
- Watch Party Kit includes a Copy Desk action for the current Commissioner Desk summary.
- Watch Party Kit includes a compact Commissioner Desk archive with copy buttons for recent desk reads.
- Watch Party Kit links to a Season Desk Wall with local desk reads, recap cards, and a copyable run sheet.
- The Desk Wall can copy and load portable snapshot links without mutating local league state.
- The Desk Wall can copy and print a Season Report from local or snapshot state.
- The Desk Wall can download a Season Report card and copy matching social post text.
- The Desk Wall can save report cards into an in-session gallery for re-download and caption copying.
- The Desk Wall can copy focused report-card links from current and gallery cards.
- The normal game view includes a Watch Now rail for the current matchup.
- Quick Sim preserves one final score across recap copy, league table, and report artifacts.
- Copied Desk Wall card links use public PointCast URLs when generated from localhost.
- Sponsorship Desk creates reservation-only sponsor cards, tickers, agent briefs, proof checklists, and participant-credit previews.
- Sponsorship Desk stores saved sponsor intents locally under `pc:nouns-battler-sponsor-intents-v1`.
- The TV cast remains clean and control-light.
- The public battler page links to this GTM doc.
- The JSON manifest exposes the GTM strategy link.
- `npm run build` succeeds.
