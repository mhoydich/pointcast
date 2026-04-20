# Codex brief — PointCast TV Mini-Game v0 · "Pulse"

**Audience:** Codex. This is a substantial architecture + implementation project — your first one at this scope. Mike 2026-04-19 17:15 PT: *"lets get codex going, its supposed to be super fast how can you give it a significant project"*. Here's the significant project.

**Context:** Block 0282 named four `/tv` roadmap items. Three of them shipped today (live polls, daily drop, presence constellation). The fourth — **mini-game v0** — is architecturally heavy enough that cc deliberately held it for you. Scope is real: pairing flow, shared state across N phones and a TV, anti-abuse, rendering at 3m viewing distance, ~90-second game loop.

Mike's verbatim framing (2026-04-19 morning chat): *"mini games, maybe some type of presense, where you know other people are watching, maybe lite games"* and *"the interactive part, polling while viewing"*. The game is an interaction primitive — proves phone-as-controller works for more than just voting.

---

## The game: **Pulse**

**One sentence:** Everyone in the room taps their phone in whatever rhythm feels right; the TV renders the group's collective heartbeat as a pulsing ring and tries to guess the target BPM the group is converging on.

**Why it works on a communal TV:**

- No individual score. No winner. Just the feeling of "we're making something together."
- Meaningfully multiplayer at 2+ phones; works solo but is boring (feature, not bug — solo games aren't the point of a communal TV).
- 90 seconds. Short enough that a visitor might try it mid-feed without committing.
- Visually legible at 3m distance — a big pulsing ring. Anyone walking past the TV knows what they're looking at.

### Mechanics

1. **A TV session.** `/tv/pulse` renders a "WAITING FOR PLAYERS" state with a big QR code. Session ID in the URL (`/tv/pulse/{sessionId}`, 6-char base32).
2. **A phone joins.** Scanning the QR on a phone opens `/play/pulse/{sessionId}`. Phone establishes a WebSocket to `/api/pulse?sid={sessionId}&role=player`. TV also has its WebSocket open as `role=tv`. Durable Object tracks both.
3. **Countdown.** Once there are ≥1 player-phones, TV shows "3 · 2 · 1 · GO". 90-second timer starts.
4. **Tap.** Each phone has a big TAP button. Every tap sends `{ kind: 'tap', t: clientMs }` to the DO. DO timestamps server-side and broadcasts `{ kind: 'aggregate', bpm, taps, phase }` to every client once per ~200ms.
5. **TV renders the pulse.** A large ring pulses at the current group BPM. Color shifts warm→cool based on convergence (are the phones drifting into the same rhythm or chaos?). Small ticker in the corner: "N PLAYERS · BPM 78 · 42s".
6. **Phone renders feedback.** Player-phone shows "you tapped 23 times · group at 78 BPM" — very light, not scoreboard-y.
7. **End.** At 0s, TV shows "PULSE DONE · Peak BPM 112 · Average 84 · 5 PLAYERS · ✦ TAP FOR NEXT ROUND". Phone shows "thanks for playing" with a QR back to `/today`.

### What "winning" looks like

There's no winner. The closest thing to a score: the TV shows the group's "coherence" — how tightly the taps clustered around a shared tempo. Visually: the ring's outer edge stays a clean circle when the group is coherent, fragments when chaotic. No points, no leaderboard. Feeling > score.

---

## Architecture questions for you to answer

### A1. Pairing flow

Given `/tv/pulse` generates a fresh `sessionId` and shows a QR to `/play/pulse/{sessionId}`:

- Should the session be **ephemeral** (DO spins up when first client connects, dies when last disconnects) or **persistent for a fixed window** (5 min)?
- What's the maximum number of phones per session? 50? 100? 200? Remember this is a shared-TV scenario, not a massively-multiplayer one.
- What happens if two TVs scan-and-create sessions at the same second? Are session IDs collision-resistant at that cardinality?

### A2. Shared state in Durable Object

Pulse state per session:

```
{
  sessionId: string,
  createdAt: number,       // ms
  phase: 'waiting' | 'countdown' | 'playing' | 'done',
  startedAt: number | null,
  endsAt: number | null,
  players: Map<playerId, { joinedAt, tapCount, lastTapAt }>,
  taps: Array<{ playerId, serverMs }>,  // ring buffer, last 10s
}
```

- Do you model this exactly, or different?
- What's the broadcast cadence — 200ms? 100ms? 50ms? Higher is smoother, more WS messages.
- BPM computation: simple (`taps in last 10s / 10 * 60`)? Or weighted toward recent taps?
- How do you handle a phone that disconnects mid-game — remove immediately, grace period, count dark for 5s then drop?

### A3. Anti-abuse

- Rate-limit per phone: max 10 taps/sec? 5?
- Session creation rate-limit per IP: 1 per 30s?
- If a phone spams: drop the session entirely or just ignore that phone's taps?
- Max game duration = 90s hard cap regardless of client clock manipulation.

### A4. TV rendering at 3m

The pulse ring needs to read from the couch. Roughly:

- Outer ring radius: ~35% of viewport height
- Current BPM rendered as a number at the center, 180pt+
- Coherence visualized how? Ring thickness? Color saturation? Rotation rate?
- Countdown in HUGE type (160pt+) for the 3·2·1·GO.
- "WAITING FOR PLAYERS" state needs the QR to be REALLY obvious — at least 400×400 px for the QR itself.

### A5. Phone UI

- Tap area = full viewport below a small header. No mis-tap risk.
- Haptic on every tap (`navigator.vibrate(8)` — same as poll-vote haptic).
- Maybe a tiny waveform at the bottom showing recent tap density, so the player sees their own rhythm.
- After game ends: a short share-card-ready summary image (for sending to Slack, iMessage). Data URL, client-side canvas render.

---

## Deliverables

### 1. Architecture doc — `docs/reviews/2026-04-19-codex-pulse-architecture.md`

Answer A1-A5 above with rationale. 600-1200 words. Document the state machine, the DO shape, the broadcast contract.

### 2. Implementation files

- **`functions/api/pulse.ts`** — the Durable Object + fetch handler. Follow the pattern already in `functions/api/presence.ts` (presence DO). Reuse the WebSocket plumbing there.
- **`src/pages/tv/pulse.astro`** — the TV session page. `getStaticPaths` is NOT applicable here; this is SSR (route with `[sessionId]` is dynamic). Need to check: does this deploy correctly to Cloudflare Pages? If the TV page needs to be SSG + client-side session creation, document that alternative.
- **`src/pages/play/pulse/[sessionId].astro`** — the phone controller. Gets the session ID from the URL, connects WS as role=player.
- **`src/components/PulseRing.astro`** (or inline if it simplifies) — the animated ring visualization for the TV.

### 3. Linkage into the existing site

- Add a "✦ PULSE" entry to the `/tv` page — either a new slide type that says "TAP TO PLAY PULSE" with a QR to a fresh `/tv/pulse` session, or a corner chip/pill that always shows, or both.
- Update `/for-agents` endpoint list with `/tv/pulse` + `/api/pulse`.
- Update `/tv`'s announcement block (0282's body) — nope, cc will do that post-merge.

### 4. A mini-demo video or screenshot set

If you can, capture 2-3 screenshots of the TV state (waiting, playing, done) and include in the architecture doc. Not required; nice-to-have.

---

## Working style

- Ship to `main` directly. cc does too; PointCast's working rhythm is deploy-to-prove-it-real. If anything breaks, we revert together.
- Author attribution: blocks you author are `author: 'codex'` with a `source` field pointing at this brief path (per VOICE.md).
- Match the existing /tv design language: dark bg, Lora + JetBrains Mono, warm gold accents (`#F59F00`), oxblood for warnings (`#8a2432`). The Pulse ring should feel tonally like the rest of /tv, not like a separate game arcade.
- If you get stuck on anything genuinely uncertain, write a `docs/reviews/2026-04-19-codex-pulse-open-questions.md` and cc picks it up next tick. Don't let indecision stall the build.
- The 90-second game is deliberately short. Don't scope-creep into multi-round tournaments, per-session leaderboards, or auth. Those are post-v0.

### Budget

Mike's framing: "super fast." You're expected to move through this in a focused session — probably 2-4 hours of Codex time end-to-end. No review gate beyond the ship itself. 

---

## Why Pulse and not something else

I considered:

- **Collective pick-a-noun** — every phone votes on a Noun ID; TV shows the consensus as a rendered noun. Too close to polling.
- **Trivia** — question on TV, tap A/B/C/D on phone. Too single-player-feeling; the TV becomes a quiz-master rather than a shared instrument.
- **Rhythm synchronization** — phones must tap together at a target BPM. More skill-oriented; less communal.

Pulse emerged as the cleanest: **the group is the instrument**. No right answer, just the feeling of rhythm coming into coherence (or not). It's 90 seconds of collective attunement — fits PointCast's tonal register.

If you have a better game idea during architecture, swap it in with rationale. Shipping the right mini-game matters more than shipping Pulse specifically.

---

Filed by cc, 2026-04-19 17:20 PT, sprint `codex-pulse-handoff`. Linked from Block 0283.
