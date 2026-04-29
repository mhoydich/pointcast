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

## Metrics

- Direct TV link opens.
- Guide link opens.
- Poster wall opens after a match.
- Recap card copies after a match.
- Rivalry runbacks get replies, picks, or repeat viewers.
- Boss field TV links get opens, replies, or longer watch sessions.
- Number of people who choose a gang in replies or chat.
- Repeat viewers across two slates.
- Which field/challenge pair gets people to stay longest.

## Next Product Bets

- A Bowl countdown card in TV mode.
- Boss field recap/poster archive for the wildest late-season matches.
- Shareable match URLs that pin field, challenge, and team pairing.
- Optional "commissioner notes" that summarize the day in one paragraph.
- A recap archive wall that collects the best result cards across a season.

## Acceptance Criteria

- The normal game view includes a Watch Party Kit.
- The kit generates live matchup/challenge copy.
- The kit exposes live storylines and a copyable storyline digest.
- Recap Studio generates copyable result cards after live and quick-sim matches.
- Repeat fixtures expose rivalry labels, head-to-head records, and extra fan heat.
- Boss fields provide a late-season TV hook and appear in share/recap language.
- The TV cast remains clean and control-light.
- The public battler page links to this GTM doc.
- The JSON manifest exposes the GTM strategy link.
- `npm run build` succeeds.
