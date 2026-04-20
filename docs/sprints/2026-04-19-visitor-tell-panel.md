---
sprintId: visitor-tell-panel
firedAt: 2026-04-19T20:45:00-08:00
trigger: chat
durationMin: 18
shippedAs: deploy:2f51a557
status: complete
---

# chat tick — VisitorHereStrip · TELL THE PEOPLES panel

## What shipped

Mike 20:45 PT: *"things like, having the person set their mood, maybe the song they are listening to, location, or any other interesting data to poll against, etc, make it fun to visit, vote, play, learn, entertain, enjoy"*.

Extended VisitorHereStrip with a **TELL THE PEOPLES** expandable panel. Visitors can self-report three data points; each surfaces inline under YOU once saved.

### The panel

Triggered by a `+ TELL` button next to the "YOUR PROFILE →" link on the strip. Button toggles `× CLOSE` when open.

Three inputs:

1. **🎵 now playing** — free-text input (120 chars). Paste a Spotify/YouTube URL or just type "Wild Mountain Honey". No validation; cc doesn't moderate content, visitor types what they want.
2. **📍 where** — free-text input (80 chars) + 📡 USE button that triggers `navigator.geolocation.getCurrentPosition()`. On permission grant: fills `lat,lng` (reverse-geocode to city coming in a follow-up tick — Open-Meteo or a free nominatim proxy). On deny: shows the error code; user can still type a city manually.
3. **Mood pills** — 6 options (chill / hype / focus / flow / curious / quiet). Tap to select; tap same again to deselect. Active pill renders as dark-on-cream.

**SAVE** persists all three to localStorage (`pc:visitor:mood`, `pc:visitor:listening`, `pc:visitor:where`), flashes a "✓ saved · shown to you + peoples around" hint for 1.2s, then auto-collapses the panel.

**CLEAR** removes all three keys and resets pills.

### The state line

When any of the three fields is set, a new line appears below the main strip row:

```
YOU  ·  [CHILL]  🎵 Wild Mountain Honey  📍 El Segundo              [edit]
```

- YOU label in gold caps to match the strip's YOU slot.
- Mood rendered as a rounded dark pill.
- Song truncated at 50 chars with ellipsis.
- `[edit]` button reopens the panel pre-populated from storage.

When all three fields are empty (or cleared), the state line hides.

## Why this over the pool

Direct response to Mike's chat. The VisitorHereStrip shipped 15 minutes ago as the "peoples here" skeleton; this tick fleshes out "what each of us is doing" — the layer that makes congregation meaningful. Without it the strip is "12 abstract nouns"; with it, visitors have micro-biographies that accumulate across the day.

Also: these three data points are exactly the "interesting data to poll against" Mike named. Future poll-generation ticks can surface "45 visitors today chose CHILL", "12 are listening to something with 'rain' in the title", "17 are in CA" — emergent Schelling-point data without any new data collection.

## Design decisions worth recording

- **Separate localStorage key from MoodChip.** `pc:visitor:mood` vs `pc:mood` (MoodChip's page-tint). Two meanings: visitor-self-report vs page-tint. Keep distinct for now; Mike can unify later.
- **Free text over structured enums for listening/location.** Structure costs; free text is fun. If visitors type "walking the dog" in `where` or "vibing" in `listening`, that's valid data. Constraint breeds conformity; PointCast wants variety.
- **Tap same mood pill to deselect.** Toggle semantics match MoodChip. Lets visitors say "actually nevermind" without clicking CLEAR.
- **Geolocation returns raw coords for v0.** Reverse-geocoding to "El Segundo" requires a proxy (Nominatim is free but rate-limited; Mapbox has a free tier). Deferred. The honest placeholder is `33.92,-118.42` — visitors can replace with their town's name manually.
- **"TELL THE PEOPLES" phrasing, echoing Mike's "peoples"**. Reinforces the communal framing. "TELL" alone is too abstract; "TELL THE PEOPLES" names the audience.
- **Hint text "stays in this browser"**. Honest about v0 constraints. Server-side sync comes with the identity arc when Mike greenlights the four decisions.

## What this unlocks

- **Aggregation across visitors.** A future tick can wire the three fields into the presence DO so "peoples here" surfaces group state: "4 here · 2 chill, 1 hype, 1 curious · 2 listening".
- **Poll generators.** An autonomous poll-seeding tick can read the aggregate distribution and spawn polls like "Today's dominant mood is CHILL — do you agree?"
- **Profile page surface.** When /profile dashboard lands, these three fields become headline stats alongside HELLO count + streak + collected drops.
- **Congregation surface.** A future /here or /peoples page can render all visitors currently connected with their self-reported state — small noun thumbnails + mood pill + song/location chips. That's the full congregation primitive.

## What didn't

- **Reverse-geocode coords → city.** Free-text workaround; full feature needs a proxy function.
- **Spotify-URL paste → song title extraction.** Deferred; v0 accepts any text.
- **Send state to the presence DO for cross-visitor awareness.** Requires DO code change. Sequenced after Mike's identity decisions.
- **A display of others' state.** Currently only YOUR state renders in the state line. Others' state is private-per-browser until server sync lands.
- **MoodChip consolidation.** The existing MoodChip component (page-tint mood) still lives below MorningBrief. Two mood surfaces now exist on the home page — one for page-tint, one for visitor self-report. Mike flagged the "MOOD appears twice" problem in his earlier zone critique; this tick doesn't resolve it (still awaiting the four decisions). Next design pass will unify or explicitly separate.

## Notes

- Build: 206 pages (unchanged; pure component expansion).
- Rendered HTML verified: tell button, geo button, save button, panel eyebrow, 6 mood pills all present. Double-count on tell/geo/save is expected (markup + JS `getElementById` reference).
- Deploy: `https://2f51a557.pointcast.pages.dev`
- Chat-fired tick.
- Cumulative today: 30 shipped (18 cron + 12 chat).
- The "tell the peoples" primitive is small and playful; matches Mike's "make it fun to visit, vote, play, learn, entertain, enjoy" directive at v0 scope. Richer texture (reverse-geocoding, Spotify extraction, cross-visitor display) layers on top.

— cc, 20:50 PT
