# Sprint · Federation Phase 0 + Rooms · 2026-04-28 → 2026-05-02

**Author:** cc · **Status:** active · **Predecessor:** [3-day autonomous sprint](2026-04-27-3-day-sprint.md) (closed 2026-04-28)
**Trigger:** Mike's "make plans for next, get them going" after the 3-day sprint closed.

## Theme

> Quietly seed federation while shipping more rooms.

Three threads, in priority order:

1. **Phase 0 of the layered p2p approach** described in `docs/notes/2026-04-28-p2p-direction.md` — define the AT Protocol Lexicon, write a Block→Lexicon converter, demo a round-trip. No commitment to migrate yet — this is a spike to learn.
2. **One new room.** `/walk` — the walking-companion. Pattern fits next to `/meditate` (still room) and `/bath` (color room): movement room.
3. **Polish + Manus QA** on Day 2's surfaces (`/snapshots`, `/minted`, `/bath/recent`).

Daily Block cadence held throughout.

---

## Priorities (cross-day)

1. **Don't break shipping.** All Day 1+2+3 surfaces from the previous sprint are live. Polish without regressions.
2. **No mobile pass on /profile.** Still being rewritten by other agents — explicit non-touch.
3. **Phase 0 stays a spike.** No commit to migrate `/blocks.json` to AT Protocol yet. Build the converter, run it, document the diff. Sprint+1 decides whether to commit.
4. **Watch v4 cutover from the cron.** If Mike originates v4 mid-sprint, the watcher PR lands, I merge it and add the post-cutover updates as a Day-N add-on.

---

## Day 1 · Tue 2026-04-28 · Plan + Lexicon sketch + /walk kickoff

### S1-1 · Sprint plan committed
**This file.** Companion to the 3-day plan + p2p direction note + triage.

### S1-2 · RFC 0004 — `xyz.pointcast.block` Lexicon sketch
**Owner:** cc · **Outcome:** `docs/rfcs/0004-pointcast-block-lexicon.md`

A draft AT Protocol Lexicon that maps the existing PointCast Block schema (id, channel, type, title, dek, body, timestamp, noun, etc.) to AT Protocol record shape. Includes:

- Lexicon JSON sketch (`xyz.pointcast.block`)
- Field-by-field mapping table (Block field → Lexicon field, with notes on schema differences)
- Open questions: how do `companions` translate? `external` link? `meta` blob? agent-author attribution?
- A second Lexicon sketch for `xyz.pointcast.talk` (Voice Dispatches) — hint at the multi-Lexicon node model from the direction note

### S1-3 · `/walk` walking-companion room
**Owner:** cc · **Outcome:** `src/pages/walk.astro`

A new movement room. Pattern:
- Pace selector: 60 / 90 / 120 BPM (slow / medium / brisk walking)
- Optional Web Audio metronome with subtle wood-block click + LFO
- A drift-tinted background (sky tone shifts with elapsed walk time, like /meditate's tide)
- Step-counter via `DeviceMotionEvent` API (graceful no-op when not available — desktop or permission denied)
- "Where are you walking?" optional input → renders as a pace-anchored breadcrumb
- Companion to `/meditate` (still) and `/bath` (color): the movement room

Empty default. No saves to a backend. localStorage-only.

### S1-4 · Block (next available, likely 0382)
Post the kickoff — sprint name, theme, what's shipping today.

---

## Day 2 · Wed 2026-04-29 · Lexicon converter + /walk lands

### S2-1 · Block → Lexicon converter spike
**Owner:** cc · **Outcome:** `scripts/lexicon-convert.mjs` + `docs/notes/2026-04-29-lexicon-roundtrip.md`

A one-shot Node script that:
1. Reads `src/content/blocks/*.json`
2. Maps each Block to the `xyz.pointcast.block` Lexicon record shape
3. Writes one record per Block to `tmp/lexicon-records/` for inspection
4. Validates each output against the Lexicon JSON sketch from S1-2

Produces a notes doc that captures:
- Number of blocks converted
- Field-level diff (which Block fields didn't fit cleanly into Lexicon)
- Any types that needed to drop fields (or extend the Lexicon)
- Performance: how long the conversion takes for ~380 blocks

This is the **read** half of dual-publish. The **write** half (publishing to a PDS) is Day 4.

### S2-2 · `/walk` mobile + polish
The room from Day 1 gets:
- Mobile pass (414 / 375 / iOS Safari)
- Pace transitions feel right (no audio click on pace change unless user re-toggles)
- Step counter permission UX clean

### S2-3 · Block (likely 0383)

---

## Day 3 · Thu 2026-04-30 · Polish sweep on Day-2 surfaces

### S3-1 · `/snapshots` `/minted` `/bath/recent` polish pass
**Owner:** cc · **Outcome:** small targeted PRs

Punch list (all small):
- `/snapshots` mobile triptych stacks cleanly at <520px ✓ (already responsive)
- `/snapshots` empty mint button hover state — verify it stays "ORIGINATING SOON" (cursor not-allowed, no jiggle)
- `/minted` long token names truncate gracefully at narrow widths
- `/minted` add Coffee Mug rarity hex border to art frames (matching `/coffee` aesthetic)
- `/bath/recent` if KV is bound by Day 3, validate the cassette grid + pagination logic at scale (mock 50+ saves)
- `/bath/recent` add `last refreshed` timestamp to the status line

### S3-2 · Block (likely 0384)

---

## Day 4 · Fri 2026-05-01 · ATProto round-trip + Manus QA brief

### S4-1 · ATProto round-trip demo
**Owner:** cc · **Outcome:** `docs/notes/2026-05-01-atproto-roundtrip-demo.md` + scratchpad in `tmp/atproto-demo/`

Stand up a local PDS via Docker Compose (the reference TypeScript implementation). Push 5-10 PointCast blocks as records. Read them back via:
1. The PDS's own `getRecord` endpoint
2. The firehose WebSocket from a second client
3. A static export → JSON for archiving

Document:
- Setup time and friction
- Where the Lexicon needed adjustments
- Storage shape on disk (the PDS uses sqlite by default)
- Whether `/blocks.json` could become a derived view of a PDS without the frontend changing

### S4-2 · Manus QA brief for new surfaces
**Owner:** cc · **Outcome:** `docs/briefs/2026-05-01-manus-new-surfaces-qa.md`

Per CLAUDE.md ("Treat Manus as the browser, ops, and real-user QA partner"), hand off:
- URLs to open: `/snapshots`, `/minted`, `/bath/recent`, `/walk`
- Browser matrix: Safari Mac, Chrome Mac, Safari iOS, Chrome Android
- Acceptance criteria per page (each ~5 bullets)
- Where to write logs: `docs/manus-logs/2026-05-01-new-surfaces-qa.md`
- What needs Mike approval: anything that requires actual minting

### S4-3 · Block (likely 0385)

---

## Day 5 · Sat 2026-05-02 · Sprint shipping log + next-sprint direction

### S5-1 · Block — sprint shipping log
The Saturday log. Same shape as 0381: what merged, what's deferred, what's queued, what waits at the door.

### S5-2 · Direction note for Sprint+1
**Owner:** cc · **Outcome:** `docs/notes/2026-05-02-sprint-next-direction.md`

Three candidate directions, ranked:

1. **Federation Phase 1** — commit to dual-publish if Phase 0 spike was clean. Make new Blocks land in both `/blocks.json` and a PDS-shaped repo. Backfill old blocks. ~1-week sprint.
2. **Marketplace v5** — referrals + bid entrypoint, on-chain settlement of Codex's `/marketplace` console. Gated on v4 first.
3. **More rooms** — pattern is working. Possible: `/sit`, `/garden`, `/stretch`. ~3-day mini-sprint.

Mike picks the direction. cc starts executing day-of.

### S5-3 · v4 cutover deliverables (if v4 originated mid-sprint)
The watcher cron will have opened a draft cutover PR. By Day 5:
- Press release v3 → v4 KT1 update (`docs/launch/2026-04-26-marketplace-press-release.md`)
- Block celebrating v4 + first per-ask royalty listing (the receipt of the upgrade)
- v3 LEGACY ask cleanup if Mike already cancelled it

---

## What stays autonomous

- Block cadence (1+/day)
- Code shipping behind small reviewable PRs
- Docs/runbooks/RFCs as they're written
- Watcher cron continues running every 3h

## What waits on Mike

- Marketplace v4 SmartPy IDE drive + sign
- Window Snapshots origination + sign
- Codex PR #58 review + merge
- Stale PR triage decisions (#1, #18, #33, #39, #133, #138)
- Optional: PC_BATH_KV provisioning
- Optional: post the staged day-1 launch posts
- Sprint+1 direction pick (Day 5 hands him the menu)

## Done criteria (Day 5 EOD)

- 5+ blocks shipped
- 1 new public room (`/walk`)
- Lexicon RFC drafted, converter script working, ATProto round-trip demoed
- Manus QA brief filed
- Polish pass on Day 2 surfaces complete
- Direction menu for Sprint+1 in Mike's hands
- Zero broken builds, zero rolled-back deploys
