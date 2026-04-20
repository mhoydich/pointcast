---
sprintId: today-strip-six-things
firedAt: 2026-04-19T16:45:00-08:00
trigger: chat
durationMin: 24
shippedAs: deploy:cbf76197
status: complete
---

# chat tick — TodayStrip · six daily-rotating chips on home

## What shipped

Response to Mike's 4:45pm chat directive (after taking Kana to get attention for a cat bite — she's OK):

> "ok, priority, daily content, polls, weather, local, sports, etc moods, clickable things for information share, etc, content could be so much, this is the my brain haven't been thinking about, so, yah claude do your magic, that should help with the freshness"

The observation: cc hand-authoring fresh daily content every day doesn't scale. But **picking different existing things to feature each day** does. Shipped `TodayStrip` — a component that surfaces six chips on the home feed, each deterministically cycling through a different existing collection.

### The six chips

Each derives from `daySeed = year*1000 + dayOfYearPT` plus a prime offset so they don't all cycle in sync:

1. **MOOD** — cycles through distinct mood slugs (blocks + gallery). Links to `/mood/{slug}`.
2. **BLOCK** — today's daily drop (same pick as /today and /tv daily slide — shared via `pickDailyBlock`). Links to `/today`.
3. **STATION** — cycles through 15 nearby cities from `src/lib/local`'s `STATIONS` list, offset +3. Links to search for the station name.
4. **NAME** — cycles through the 7 El Segundo name-drops from `NAME_DROPS`, offset +5. Links to `/b/0276` (the name-drops editorial).
5. **CHANNEL** — cycles through the 8 channels from `CHANNEL_LIST`, offset +7. Links to `/c/{slug}`.
6. **NOUN** — today's Noun id, computed as `(seed * 7) % 1200` so the sequence spreads across the full 1200-noun range rather than walking adjacent-day neighbors. Links to `https://noun.pics/{id}.svg` in a new tab.

Every PT midnight all six rotate. Same pick for every visitor globally.

### Share button

Below the grid: `↗ SHARE TODAY'S SIX` button. Taps `navigator.share({url, text, title})` on mobile (native share sheet), or falls back to `navigator.clipboard.writeText()` on desktop with a "✓ link copied" confirmation that fades after 2.4s. Answers Mike's "clickable things for information share" directly — the entire strip becomes shareable as a single link since the chip picks are deterministic from the date.

### Placement

Between MorningBrief (date + weather + scores) and PollsOnHome (interactive polls). The stack becomes:

```
masthead → FreshStrip → VoterStats → MoodChip → MorningBrief
        → TodayStrip (new) → PollsOnHome → FreshDeck → channels → grid
```

## Why this over the pool

Mike's chat was the clearest signal of the day — "daily content" is the current gap, and I'd been noticing it too (MorningBrief only changes slowly across a day; everything else on the home is static or volatile). A rotation-based component scales without cc overhead — six existing collections feed it, no new content needed, rotates forever.

The pool items (presence constellation done last tick, mini-game complex, Codex review gated) all yielded to this.

## Design decisions worth recording

- **Prime offsets on the seed**. Adjacent days produce "seed, seed+1" which would cycle station +3, +4; name +5, +6 — a stepwise walk. Using prime multipliers (noun = seed * 7) spreads adjacent-day picks across the range so today and tomorrow feel truly different rather than sequential.
- **Share via `navigator.share`, fall back to clipboard**. `navigator.share` on mobile surfaces the OS share sheet (iMessage, Slack, etc.) which is the natural share UX. Clipboard fallback handles desktop Chrome/Safari. No custom share-sheet UI.
- **Eye-color variation per chip type**. Each eye (the black box with "MOOD" / "BLOCK" / etc.) uses a different color pulled from the PointCast palette (oxblood, front-door blue, ES purple, spinning rust, channel-600, mesh purple). Visually distinguishes the six without needing legend text.
- **Channel chip inherits its own channel-600 color**. When today's featured channel is CH.SPN, the chip's border and background go rust-colored. Reinforces the channel identity.
- **Noun opens in new tab**. It's an external SVG, not a PointCast route. Preserves the /today stay-on-site while making the noun a one-tap "here's today's noun, saved to your device if you want it" action.
- **Station links to search, not a dedicated station page**. Stations don't have pages yet (deferred from the /local v0 tick). Search is a reasonable target — you land on `/search?q=Manhattan+Beach` and see every PointCast mention of that name.

## What didn't

- **Weather / sports**. Intentionally not duplicated — MorningBrief already covers those right above the TodayStrip. Adding them to the strip would crowd + repeat.
- **Event-tonight / surf**. Would require new API integrations (Ticketmaster / Surfline / etc.). Deferred.
- **Today's glossary term**. Could be a 7th chip. Six felt like the right count for the grid at 220px-min column width — 7 wraps awkwardly at most breakpoints. Seven's the next natural expansion; glossary term is the obvious candidate.
- **Record in /today.json**. The TodayStrip content isn't mirrored to JSON yet. Agents querying would need to independently compute the picks from /today.json's daySeed. A future /today.json upgrade can embed the full six.

## Notes

- Build: 200 pages (component addition, unchanged HTML count).
- All six chip variants rendered, verified via grep: `chip--mood`, `chip--block`, `chip--station`, `chip--namedrop`, `chip--channel`, `chip--noun`.
- Deploy: `https://cbf76197.pointcast.pages.dev`
- Chat-fired tick (Mike's explicit ask), not cron.
- Cumulative today: 20 shipped (15 cron + 5 chat).
- The strip's value compounds with every content primitive that lands in `src/lib/` — the next collection-based lib (events, photos, quotes, whatever) naturally becomes another chip.

— cc, 17:28 PT
