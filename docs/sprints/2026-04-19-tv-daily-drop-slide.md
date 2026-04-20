---
sprintId: tv-daily-drop-slide
firedAt: 2026-04-19T12:11:00-08:00
trigger: cron
durationMin: 19
shippedAs: deploy:10dd0b89
status: complete
---

# 12:11 tick — Daily Drop slide on /tv

## What shipped

Second named roadmap item from Block 0282: "Daily collection on TV — today's claimable drop featured big, QR on-screen for the claim flow. Ties to the daily-collection mechanic Mike asked for alongside this." Landed.

### Mechanics

- **Shared data source**: `/tv` imports `pickDailyBlock` + `todayPT` from `src/lib/daily.ts`. The TV slide and `/today` page agree perfectly — both select the same block via the same deterministic `daySeed` function. No duplication, no drift.
- **Slot 0 placement**: the Daily Drop is always the FIRST slide a viewer sees when /tv loads. Cast to a TV → the daily drop is the opening hero. After its 20-second dwell, the rotation continues through blocks (with poll slides at every 5th position).
- **No duplication in rotation**: the interleave loop skips the daily block if it would otherwise appear in the "recent blocks" rotation. One appearance per cycle, in the featured slot.
- **Visual distinction**: gold-gradient "✦ DAILY DROP · SUN APR 19" pill (star rotates slowly, 5s per turn), oversized 72px title (vs. 64px on regular blocks — largest title in the rotation), amber glow on the thumbnail, 120px QR (larger than block/poll QRs), and a subtle radial gradient warm glow behind the active slide.
- **QR target**: `https://pointcast.xyz/today` (not `/b/{id}` — the daily drop flow goes through /today's collect button so the streak/stats register).
- **Dwell extended**: 20 seconds (BASE_DWELL + 8000). Tied with READ blocks for the longest dwell — it's the featured thing, give viewers time to scan + decide.
- **Footnote**: small "ONE BLOCK A DAY · ROTATES AT MIDNIGHT PT · COLLECT ON PHONE" strip below the body. Explains the mechanic for first-time casters.

## Why this over the pool

The daily drop was Mike's explicit morning ask ("need the daily collection"). `/today` shipped last tick; now the TV surface features it too. The three-tick arc (live polls on /tv → /today → daily slide on /tv) closes a loop: you cast /tv, see the daily drop in the first 20 seconds, scan the QR, /today opens on your phone, you tap collect, done.

Remaining pool (presence constellation, mini-game, Codex review) still open but none of them had a 0282-named dependency as tight as this one.

## Design decisions worth recording

- **Slot 0, not "every Nth slide".** Considered making the daily drop recur every 8th slot or so (like polls every 5th). Didn't — the daily drop is singular, and recurrence would dilute the "this is today's thing" framing. Once per rotation, first, done.
- **QR goes to /today, not /b/{id}**. Even though /today's pick and /tv's daily slide are the same block, routing through /today means the collect flow, streak counter, and eventual server aggregation happen in one place. `/b/{id}` is the canonical reading surface; /today is the ritual surface.
- **Larger QR (120px) than other slides (108px)**. The daily drop wants a bigger "scannable" footprint since the intended action is scan-to-collect, not just scan-to-read. 120 reads comfortably from 3 meters.
- **Animated star (✦) on the channel chip**. Subtle rotation at 5s/turn. Tells the eye something is happening even when the viewer is deep in ambient-mode consumption.
- **Radial gradient backdrop**. Warmer than the neutral dark on other slides. Only on the active daily slide; fades back to normal on next slide. Keeps the visual framing special without being gaudy.

## What didn't

- **Real-time claim count**. The slide shows the drop but not "N people collected today." Requires server-side aggregation (Cloudflare Function + KV). Deferred; the private localStorage streak already gives viewers feedback.
- **Tomorrow preview**. Could show a tiny "TOMORROW: ???" hint in the footnote. Nah — surprise is the whole point of the rotation. If a viewer really wants to know, day-seed math is deterministic and knowable.
- **Collected-today indicator on the slide**. /tv is a shared surface; "you collected this" is ambiguous when the viewer is multiple people. Keep it stateless on the TV — stateful on the phone. Right separation.
- **Animated "daily badge drops in" on slide activation**. Could have a one-time animation on the chip when the slide becomes active. Deferred — the existing slide-in animation (from the block slides) covers this.

## Notes

- Build: 200 pages (unchanged HTML count; /tv just carries richer data).
- Rendered HTML confirmed via grep: `slide--daily` and `slide__channel--daily` present.
- Deploy: `https://10dd0b89.pointcast.pages.dev/tv`
- Today's daily drop on /tv and /today: block 0276 — "El Segundo name-drops". Both surfaces show the same pick because they share `pickDailyBlock()`.
- Cumulative today: 15 shipped (11 cron + 4 chat).
- When Codex's /tv architecture review comes back, the daily slide will likely be in scope. Design is deliberately minimal — easy to adjust per their findings.

— cc, 12:30 PT
