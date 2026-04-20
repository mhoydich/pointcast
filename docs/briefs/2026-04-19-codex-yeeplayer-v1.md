# Codex brief — YeePlayer v1 · phone-as-controller on /tv

**Audience:** Codex. Third substantive project of the day, alongside Pulse (`docs/briefs/2026-04-19-codex-pulse-minigame.md`) and STATIONS (`docs/briefs/2026-04-19-codex-tv-stations.md`). All three are /tv-adjacent but independently scoped — work whichever fits your strengths or time first.

**Context:** Mike 2026-04-19 17:50 PT: *"how about [Codex] works on the next yee player iteration"*. YeePlayer v0 shipped earlier today with clarity + pacing fixes (see `docs/sprints/2026-04-19-polls-refresh-and-yeeplayer-clarity.md`). v1 is the step-change: turn YeePlayer from a solo desktop game into a **communal TV experience** with phones as the tap controllers.

This project pairs naturally with Pulse — both use phone-as-controller via QR pairing to a DO, but YeePlayer v1 syncs to an actual song (YouTube embed), not a freeform tempo. If you ship Pulse first, YeePlayer v1 reuses most of the pairing/DO plumbing.

---

## What YeePlayer v0 is today

A static rhythm-game overlay at `/yee/[id]` on any WATCH block whose `media.beats` array is populated. Video plays on the left; bija-mantra chips fall on a track on the right; player presses SPACE (or taps the hit zone) when a chip reaches the dashed line. Solo desktop-first experience, keyboard + pointer input. Score, combo, hit count in a HUD. Best run saved to localStorage.

Three tracks live in v0:
- `/yee/0262` — Alan Watts guided meditation (12 beats across 15:30, 77s avg between)
- `/yee/0263` — November Rain (14 beats across 9:17)
- `/yee/0264` — Purple Rain (8 beats across ~4:30)
- `/yee/0236` — Chakra Tune-Up (the original, 21 bija beats)

Earlier today, v0 got: HOW TO PLAY overlay, NEXT-beat countdown chip, longer visible travel (LEAD_MS 3000 → 6000), relaxed hit windows.

## What YeePlayer v1 should do

**One sentence:** The TV shows the video and the falling beats; up to N phones pair in as players; each phone taps when beats reach the line; the TV shows everyone's hits simultaneously + aggregate score.

### Key difference from v0

- v0 = one screen, one player.
- v1 = TV (shared screen) + 1-8 phones (individual controllers), everyone playing the same track simultaneously.

### Why this works for PointCast

- `/tv` is the communal shape the site is building toward. v1 makes YeePlayer a /tv primitive rather than a side page.
- Pairs with Pulse's phone-as-controller pattern — a second validation that the pairing flow generalizes beyond one game.
- Turns meditation tracks from "15 minutes alone" to "15 minutes with friends" — much better for a living room.
- Scoring becomes social: "you hit 10/12, Morgan hit 8/12, we're at 18/24 together" is a different kind of moment than "I got 10/12 alone."

---

## Mechanics

### 1. TV starts a session

Visit `/tv/yee/[blockId]` (e.g. `/tv/yee/0262`). TV creates a Pulse-style session ID, renders a full-screen WAITING state with a giant QR code pointing at `/play/yee/[sessionId]`. Below the QR: the track title, noun art, and a tiny "WAITING FOR PLAYERS · 0 / 8".

### 2. Phones join

Scanning the QR opens `/play/yee/[sessionId]` on the phone. Phone connects WebSocket as `role=player`. TV's WS count updates. Once 1+ player-phones are connected, the TV shifts state: "READY · tap the TV's START on any phone".

### 3. Track starts

Any phone can tap a START button; the TV begins the YouTube embed playing and the falling-beats animation starts. All connected phones see their tap-pad turn active.

### 4. Taps

Each phone taps SPACE or the big tap area when a beat reaches the line — same hit windows as v0 (PERFECT ±200ms, GOOD ±650ms). Phone sends `{ kind: 'tap', beatHint: nearestBeat, clientMs }` to the DO. DO matches phone's tap to the active beat within hit window, credits the phone's individual score + the group's aggregate.

### 5. TV rendering

The TV renders:
- The YouTube embed (full-width or left-column)
- The beat track (right-column) as in v0
- A row of player chips at the bottom: one per phone, showing the phone's (anonymized) color + hit count. Example: `●15  ●12  ●9  ●14`. The phones' colors are deterministic from their session-joined order.
- An aggregate HUD: total hits across all players, max combo (longest streak any phone kept), player count, time remaining.
- When a phone hits a beat: a tiny colored spark fires from the hit-line on the TV in that phone's color, visible to everyone.

### 6. End of track

Video ends → TV shows a shared summary: "DONE · 42 / 60 TOTAL HITS · 4 PLAYERS · MAX COMBO ×18 · SHARE →". Each phone sees its individual stats + the group's.

---

## Architecture questions for your doc

### A1. DO shape vs Pulse

Pulse's DO and YeePlayer v1's DO are similar (phone pairing + tap events + broadcast). Share a common base? Or keep separate?

- Recommend a shared `functions/api/_pair.ts` with a base class + two subclasses. Less code, more consistent pairing UX.
- Or fully separate files if the state diverges enough that sharing adds friction.

### A2. Beat-to-tap matching logic

The existing v0 `attempt()` function finds the nearest pending beat within the GOOD window and credits a hit. In v1, the phone doesn't know about beats directly — the TV does. Options:

- **Phone sends timestamp; DO matches against beats.** Requires DO to know the track's beat array + the video's current play time.
- **Phone sends timestamp + estimated currentTime.** Phone guesses where it is in the song. Risky if phone's clock drifts from TV's.
- **TV broadcasts beat-window openings to phones.** TV says "beat window opens NOW for beat N." Phone just taps at the right moment.

Recommend option 1 (phone sends, DO matches). DO has authoritative clock. Phone is just a button.

### A3. Video playback sync

`/tv/yee/[blockId]` plays the YouTube embed. The DO needs `getCurrentTime()` equivalent to match taps against beats. Options:

- TV's `/tv/yee/[id]` page periodically broadcasts `{ kind: 'position', playbackMs }` to the DO every 500ms so the DO knows where the track is.
- Phones get `position` too so they can show contextual countdowns (e.g. "PREPARE · beat in 2s").

### A4. Phone colors

8 colors, assigned on join-order. Palette: use the 7 bija colors from the existing Chakra track + one fallback (#C95C2E). First phone in = red (LAM), second = orange (VAM), etc. Deterministic + visually coherent.

### A5. Cross-player feedback

When a phone hits a beat, does the TV show a spark effect visible to everyone? Or does each phone only see its own hits? Recommend: TV shows sparks in the hitting-phone's color AND the other phones see a tiny "P2 HIT +100" floater briefly. Shared feedback = communal feel.

### A6. Track selection

A user needs to pick a track before /tv starts a session. Options:

- `/tv/yee` (no id) shows a list of available tracks (any block with `media.beats`). Pick one → creates session.
- Dedicated `/tv/yee/[id]` always creates a session for that track.
- Or: `/tv/yee/[sessionId]` where sessionId also encodes the track choice.

Recommend a two-step: `/tv/yee` → track picker → `/tv/yee/[blockId]/[sessionId]` → game.

---

## Deliverables

### 1. Architecture doc

`docs/reviews/2026-04-19-codex-yeeplayer-v1-architecture.md`, 500-1000 words. Answers A1-A6.

### 2. Implementation files

- **`functions/api/yee.ts`** — Durable Object + fetch handler. Pattern after `functions/api/presence.ts` + your Pulse implementation. Share helpers with Pulse if they overlap meaningfully.
- **`src/pages/tv/yee/[id].astro`** (or similar routing) — the TV session page. Integrates with existing `/yee/[id].astro` (solo mode) — don't break the solo mode; v1 is additive.
- **`src/pages/play/yee/[sessionId].astro`** — the phone controller. Tap pad, current-player stats, live TV-link state.
- **`src/components/YeeMultiplayerHUD.astro`** (if needed) — the TV's player-chip row + aggregate HUD.

### 3. Linkage

- Existing `/yee/[id]` page gets a "PLAY ON TV · tap to start a multi-player session →" button. Starts a session and redirects to the TV URL.
- `/tv` gets a YEE slide type in its slide rotation — "TAP TO PLAY MULTIPLAYER RHYTHM · QR CODE" for each track with beats.
- `/for-agents` gets `/tv/yee/[id]` + `/play/yee/[sessionId]` + `/api/yee` documented.

### 4. A rough demo

If possible, screenshot the three states (waiting, playing, done) and include them in the architecture doc.

---

## Working style + budget

- Ship to main. Author `codex`, source = this brief path.
- Match existing `/tv` and `/yee` design languages — dark bg, Lora + JetBrains Mono, amber + oxblood + bija colors.
- Budget ~3-5 hours focused. This is the most interdependent of the three projects — it touches both Pulse's pairing flow and YeePlayer's existing state machine. Worth the time.
- Don't block on Pulse finishing. If Pulse ships first, reuse the pairing plumbing; if not, build your own and refactor when Pulse lands.

---

## Why this as the third project

- **YeePlayer v0 exists and works solo.** Codex has a concrete reference to audit + extend, not a blank page.
- **Validates the pairing-flow pattern** at a second game + from a different angle.
- **Closes a real UX gap.** Mike's own feedback this morning ("was kinda too slow and wasn't totally clear what to do") was partly about content pacing. v1's multiplayer mode makes the long meditation tracks (15 min Alan Watts) into something people actually *do* together rather than drift out of.
- **Produces richer /tv content.** Each existing beat-mapped block becomes a multiplayer-rhythm session on /tv for free.

---

Filed by cc, 2026-04-19 17:55 PT, sprint `codex-yeeplayer-v1-handoff`. Linked from Block 0285.
