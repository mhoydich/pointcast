---
sprintId: codex-pulse-handoff
firedAt: 2026-04-19T17:11:00-08:00
trigger: chat
durationMin: 22
shippedAs: deploy:848ae0a8
status: complete
---

# chat tick — Codex gets a substantive project: Pulse mini-game v0

## What shipped

Two artifacts:

### 1. Codex brief — `docs/briefs/2026-04-19-codex-pulse-minigame.md` (~1,400 words)

Full spec for **Pulse** — the 4th named /tv roadmap item from Block 0282, deliberately held back by cc because it's architecturally heavy enough to be a real Codex project.

The game in one sentence: everyone in the room taps their phone in whatever rhythm feels right; the TV renders the group's collective heartbeat as a pulsing ring that tries to find the target BPM the group is converging on. 90 seconds. No winner, no score — just coherence.

Brief covers:

- **Game mechanics** — session lifecycle, pairing flow (QR on TV → phone scans → WS to Durable Object), tap broadcast, BPM computation, end-state.
- **Five architecture questions (A1-A5)** Codex answers in a doc: pairing flow ephemerality, DO state shape + broadcast cadence, anti-abuse rate limits, 3m-viewing-distance TV rendering, phone UI.
- **Four implementation deliverables**: DO + fetch handler (`functions/api/pulse.ts`), TV session page (`src/pages/tv/pulse.astro`), phone controller (`src/pages/play/pulse/[sessionId].astro`), ring component.
- **Linkage into the existing site**: add a "PULSE" entry on /tv, /for-agents update.
- **Working style**: ship to main, `author: 'codex'`, don't scope-creep, ~2-4 hour budget.

### 2. Block 0283 — "Codex gets a real project — Pulse, the TV mini-game"

Public announcement. `mh+cc` author, sources Mike's directive verbatim ("lets get codex going, its supposed to be super fast how can you give it a significant project"). Mood `sprint-pulse`. External link points at the brief on GitHub. Companions: /b/0282 (the arc naming the roadmap), /b/0281 (the overnight three-ticks reflection), /tv, /collabs.

Body is honest about the experiment: this is the first time Codex gets a substantive-implementation project at PointCast (prior work was review-only). We'll learn whether that shape works for them, or whether Codex stays better as reviewer + cc builds. Either outcome is fine; the data matters.

## Why this over the current tick

cc had started the /today.json enrichment (the TodayStrip's six-chip data embedded in the JSON mirror). Mid-tick, Mike chat-fired the Codex priority. The pivot: Mike's direct ask beats cc's next-logical-step every time. /today.json enrichment rolls to next tick.

## Design decisions worth recording

- **Pick Pulse over trivia / pick-a-noun / rhythm-sync.** Considered alternatives in the brief's "Why Pulse" section:
  - Collective pick-a-noun — too close to polling (which we already have).
  - Trivia — too single-player-feeling; TV becomes quiz-master rather than shared instrument.
  - Rhythm synchronization — too skill-oriented; loses the communal feel.
  Pulse emerged as: "the group is the instrument." No right answer, just coherence-finding. Fits PointCast's tonal register.
- **Hand off architecture + implementation, not just spec.** Traditional "cc writes, Codex reviews" would underutilize Codex's claimed speed. Brief asks for end-to-end: architecture doc AND implementation files AND the /tv linkage. If Codex can't deliver that, we learn that too.
- **Explicitly let Codex swap the game idea.** Brief says: "If you have a better game idea during architecture, swap it in with rationale." cc's Pulse design isn't sacred — Codex's judgment within the constraints is welcome.
- **Scope-creep barriers.** Multi-round tournaments, leaderboards, auth are all explicitly flagged as post-v0. Brief insists on the 90-second game and tells Codex to stay there.
- **Ship-to-main working style.** PointCast's rhythm is deploy-to-prove-it-real. Codex is expected to match that cadence — no PR-review dance for v0. Post-merge, cc can iterate.

## What didn't

- **Stub files for Codex to fill.** Considered creating `functions/api/pulse.ts` as a stub with TODO comments. Decided against — Codex should own the full file shape. Stubs might constrain their architecture.
- **A /tv announcement slide for Pulse pre-ship.** Could have added a "Pulse dropping soon — Codex building" chip on /tv to telegraph the coming ship. Deferred; Codex will add the /tv entry themselves when they ship.
- **Coordinate with Manus.** The morning Manus brief is still pending reply. Don't need Manus for Pulse specifically — the mini-game is a feature primitive, not a platform question. Kept briefs separate.
- **Finish the /today.json enrichment.** Pivoted mid-tick per Mike's chat. Next tick's first pick.

## Notes

- Build: 200 → 201 pages (+1: /b/0283).
- Block 0283 rendered, companions link out correctly.
- Deploy: `https://848ae0a8.pointcast.pages.dev/b/0283`
- Brief is in the repo at `docs/briefs/2026-04-19-codex-pulse-minigame.md`; Codex reads `docs/briefs/` at session start.
- Chat-fired tick, not cron.
- Cumulative today: 21 shipped (15 cron + 6 chat).
- The handoff pattern — cc explicitly leaves room, briefs a substantive project, announces via block — is reusable. If Pulse lands well, the next Codex or Manus project follows the same shape.

— cc, 17:32 PT
