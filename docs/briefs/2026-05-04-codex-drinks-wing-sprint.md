# Codex sprint brief: the drinks wing — sibling rooms to /kettle + /special-brew

**Date filed:** 2026-05-04 PT (Sunday afternoon)
**Filed by:** Claude Code (cc) on behalf of Mike
**Type:** forward-looking sprint, not a review
**Mike's ask (verbatim):** *"nice have codex create the next sprint and go"*

## tl;dr

The drum wing reached 74 surfaces this weekend. The newest neighborhood is *drinks* — `/kettle` (cooperative-stoking kitchen, shipped ~2026-04-27) and `/special-brew` (daily-rotation pour ceremony, shipped today, [PR #398](https://github.com/mhoydich/pointcast/pull/398), Block 0432). That's two rooms. The drum wing teaches us that a wing is more like five-to-eight. Codex sprint: build the **drinks wing** — five new sibling rooms in the same kitchen-and-velvet neighborhood, each doing one thing the existing two don't.

You shipped the meditative quintet (shrine, rosary, koan, prayer-flag, mantra) plus the very-2026 trio (aurora, lantern, bath) in roughly one weekend, with Block 0429 as the wrap-up. That's the cadence pattern this brief points at. Same voice, same chamber-bus, different drink.

## Today's two rooms (the anchors)

| Room | Verb | Lives at |
|---|---|---|
| `/kettle` | **cooperative stoking** — visitors heat the room together, kettle whistles at boil, one cup poured for the whole room, cycle repeats | already shipped |
| `/special-brew` | **daily ceremony** — one brew per UTC day from a 35-brew catalog, pour the cup, brass chime, multiplayer cup shelf | shipped today |

Both rooms share: cozy kitchen aesthetic, brass + velvet palette, soft-bell audio language, El Segundo morning vibe.

## What's missing in the wing

The current two cover *making heat* and *what gets poured*. Open neighborhoods:

1. **The room where you wait** — the cup is poured but not consumed yet. A sit-down spot with a window, a clock, your own cup at your own pace
2. **The room with the rituals around the drink** — the gestures, not the brew (toast, clink, first sip, bottoms-up)
3. **The room with company over the drink** — multiple people drinking together, no game mechanic, just presence
4. **The room with the after-drink** — what's left in the cup, the saucer, the conversation that follows
5. **The room with the second pot** — the nostalgic "we should make another?" beat

That's a posture, not a spec. You'll have a better feel for the actual rooms once you start.

## A starter menu (codex pick what fits)

Pick ~5 of these — or invent better ones in the same frame.

- `/tea-house` — quiet hearth room, single perpetual kettle in the corner, presence-only (no taps), an ambient drone keyed to the time of day, soft cushions on the floor
- `/coffee-shop` — busy morning room, three rotating baristas (Nouns) at the counter, ambient pour + steam + clink loop, hours posted on the door, daily special on a chalkboard
- `/saucer` — tiny room, just a cup on a saucer with tea cooling, optional Earl-Grey-blue wallpaper, a kettle whistle from one room over
- `/clink` — pure-toast room, click any of three glasses for a different pitched chime + clink animation, multiplayer additive (other visitors' clinks ride your soundscape)
- `/last-sip` — the room at the end of a cup, cold-coffee aesthetic, what you do with the dregs (read tea leaves, see a Noun in the foam, pour out the rest)
- `/percolator` — vintage stovetop percolator gurgling, time-rewards-attention (full pot at 3 minutes), pop-art-poster aesthetic
- `/water-fountain` — public-good infrastructure room, the drink before the drink, El Segundo's actual drinking-fountain map (you can map five real ones in town)
- `/milk-and-cookies` — late-night kitchen, low light, one cookie + one glass = a moment
- `/cantina` — sunset porch, /taproom-adjacent (`/taproom` already exists, curated SoCal beer list), brass tap handle that pours into a chilled glass
- `/round` — bar-shape room where ordering a round buys everyone in the room a drink (multiplayer additive — every visit gets the next round's chime)

If five rooms feels heavy, ship three. If three rooms feels light, ship eight. Wing closure is the unit, not room count.

## Pattern conventions to keep

- **Daily rotation where it fits** — `/coffee-shop` daily special, `/cantina` happy-hour drink, etc. Use the same `(year × 7 + day-of-year × 13) mod count` algorithm as `/drum-shrine` and `/special-brew` so daily rotations stay aligned across rooms.
- **Audio language** — soft sine partials, brass-bell decay, ~660 Hz fundamental. No harsh tones. Match `/special-brew`'s chime stack.
- **Color** — brass (#b8853d), velvet (#2a1208), cream (#fcf6e7), saffron (#ffd870), oxblood for accents. OKLCH if you go for the daylight-cycle treatment like `/drum-bath`.
- **Multiplayer additive** — every room polls some endpoint and adds other visitors' state quietly without requiring participation. Single-player works fully when alone.
- **Chamber-bus or new endpoints** — for the drinks wing, a new `/api/drinks` or `/api/wing-presence` could share state across rooms. Or each room gets its own `/api/<room>` endpoint following the `/sing`, `/special-brew` pattern. Codex's call.
- **Block IDs are monotonic** — at the time of this brief, 0432 is taken. Pick the next free at write-time and pre-claim if the cron is running fast.

## Acceptance criteria

- [ ] 3-8 new sibling rooms shipped, each with its own astro page + (where appropriate) JSON mirror + (where multiplayer-additive) functions/api endpoint
- [ ] Each room links to at least one other room in the wing
- [ ] At least one room has a daily UTC rotation
- [ ] All rooms render without console errors
- [ ] Block 04XX wrap-up that names the wing, lists the rooms, and credits the pattern (mirror Block 0429 — the drum-wing wrap)
- [ ] `/explore` picks up the new rooms automatically (it already auto-globs `src/pages/*.astro`)
- [ ] One-line update to `/special-brew`'s Block 0432 (or a new Block) acknowledging the wing came together

## Companion existing surfaces (don't break)

- `/kettle` — DON'T touch the existing logic; if you want to deepen it, file a separate PR
- `/special-brew` — DON'T touch `src/data/special-brews.ts` either (it's positional; reordering rotates everyone's day). Add new files alongside.
- `/taproom` — already exists (curated SoCal beer carry list), counts as a wing-adjacent room. New rooms can link to it.
- `/drum-bath` — your daylight-cycle template. If a drinks room wants a similar 12-min cycle, copy the OKLCH approach.

## What NOT to do

- Don't rename or restructure the existing two rooms.
- Don't pour another agent's work into the same files mid-sprint — splice into new files per the parallel-agent playbook in `feedback_pointcast_parallel_agents.md`.
- Don't ship without the wing-closure block — the drum wing's `0429` made the grouping legible. Without it, the rooms are individually nice but not a wing.
- Don't add Tezos / wallet / contract code to drink rooms — keep it pure-static or KV-backed, no chain calls.

## Why this matters

PointCast is testing whether software can be a place. Wings are how the place gets neighborhoods. The drum wing made *contemplative* legible. The drinks wing makes *conviviality* legible. Without the second, the town feels monastic. Both are good. We want both.

Plus: kettle's on. There should be more than one room where that matters.

— cc, on behalf of the residents · 2026-05-04 PT · El Segundo
