---
sprintId: tv-live-polls
firedAt: 2026-04-19T10:11:00-08:00
trigger: cron
durationMin: 19
shippedAs: deploy:35c9cbf0
status: complete
---

# 10:11 tick — live poll slides on /tv

## What shipped

Live poll rendering on `/tv` — the first named roadmap item from Block 0282 ("live polls rendered at scale — poll bars full-screen, updating from /api/polls. Phone-side voters see their tap register on the TV within a second").

### Mechanics

- **Server interleave**: the /tv frontmatter now builds a unified `slides[]` array of `{ kind: 'block', block }` and `{ kind: 'poll', poll }` items. Every 5th slot (positions 5, 10, 15, 20) becomes a poll slide, punctuating the block rhythm. Top 4 non-draft polls sorted by `openedAt` desc. Total slide count: 24 blocks + 4 polls = 28 slides.
- **Poll slide layout**: same 1.4fr / 1fr column split as block slides. Left column carries a purpose-colored LIVE POLL chip (utility green, coordination blue, editorial purple, decision orange, state oxblood), the slug kicker (`/poll/{slug}`), the question at 48px serif (smaller than a block title to leave room for bars), the bar list (up to 6 rows, one per option), and a tiny "— votes" total footer. Right column has the QR code pointing at `/poll/{slug}?via=tv` and the hint text `→ SCAN · TAP TO VOTE`.
- **Live tally**: when a poll slide becomes active, the client fetches `/api/poll?slug={slug}` and paints the bars. A 5-second `setInterval` refreshes while the slide stays active. On slide exit, the timer clears — so at most one poll is polling the API at a time.
- **Bar animation**: `transition: width 0.7s cubic-bezier` so percentages ease to their values instead of snapping. Leader row gets a brighter amber fill + a subtle glow.
- **Dwell extension**: poll slides get +6s on top of the 12s base (= 18s total). Enough time for a viewer to scan the QR, open their phone, tap an option, and see the result on the TV before advancing.
- **`?via=tv` tag in QR URL**: so server-side tallies can later separate TV-originated votes from site-direct votes if we ever want to analyze that.

### Why 5-second refresh vs WebSocket

Could have wired a DO for real-time tally push. Didn't, for this tick:

- The existing `/api/poll` GET works today with zero new server code.
- A 5-second refresh feels live enough for a communal-watching context (users won't notice a 3-second delay between "tapped" and "TV updated"). Real-time is overkill.
- Upgrade path is open: a DO-based tally stream is a follow-up tick that can land without any client refactor — just swap the setInterval fetch for a WebSocket handler.

## Why this over the pool

Block 0282 named this explicitly as the first sub-ship of the broadcast arc. Cc is already working on /tv; no context-switch cost. Uses existing `/api/poll` endpoint — zero new server surface. High visible impact (polls going live on a big screen is a real moment). Compounds on all three prior /tv contributors: presence WS, the slide rotation, the QR handoff.

The other pool items remain gated: Codex review not yet back; mood/reverse-companions both done; editorial block already shipped today via 0281/0282; polls-JUICE broad. Station mode (next likely target) wants Codex's architecture read first.

## Design decisions worth recording

- **Interleave over separate "poll mode".** Could have built a toggle — /tv/polls vs /tv/blocks. Chose interleave because PointCast's design principle is "editorial is one river, not separate channels." Polls punctuate the block feed the same way they punctuate the home page's PollsOnHome strip.
- **QR points at /poll/{slug}?via=tv, not the home page.** Users scanning from a TV want the dedicated poll page, not a scroll-hunt. `?via=tv` is the breadcrumb.
- **No vote happens on /tv directly.** TV is display; phone is controller. The slide shows tally, but tapping anywhere on /tv does nothing for the poll — you always go through the QR → phone → /poll/{slug} flow. Keeps the TV ambient.
- **Leader highlight uses count, not pct.** If all options are tied at 0 or 1, no leader renders. Only once one option genuinely pulls ahead does the amber glow appear. Prevents false leaders at the start of a fresh poll.

## What didn't

- **Poll-complete state.** If a poll hits 100% for one option (single voter), the bar paints correctly but there's no "close to a Schelling point" editorial note. Could add later.
- **"New votes since you arrived" counter.** Could track on client-side how many votes landed while this slide was visible. Deferred — it's a cute add, not core.
- **Animated vote arrival.** When a new vote lands during refresh, the bar re-shapes but there's no ping/chime/pulse indicating which option just got a tap. Considered — would need the API to return "most recent" info; doesn't today. Deferred.
- **Voted-status per visitor.** /tv shares the `pc:poll:voted:{slug}` localStorage key with the home page polls — so if the viewer has already voted, the bars still render live (correctly). We don't visually flag "you voted X" on the TV slide, because the TV is typically communal; who "you" are is ambiguous. Keep it clean.

## Notes

- Build: 199 pages (unchanged HTML count; same /tv route, just richer data). 4 poll slides verified in the rendered `dist/tv/index.html` via grep.
- Deploy: `https://35c9cbf0.pointcast.pages.dev/tv`
- Open on laptop → F11 → poll slides will appear at positions 6, 11, 16, 21 of the rotation. Scan a QR → you'll land on /poll/{slug} with the vote UI. Cast a vote → wait up to 5 seconds → the TV shows the updated bars.
- Cumulative today: 13 shipped (9 cron + 4 chat).
- This is the first interaction primitive on /tv — phone-as-controller is now demonstrated end-to-end for at least one action. Next candidates in the broadcast arc: presence constellation (visual, ambient), mini-game v0 (multi-viewer, phone-controlled), daily-collection slide (QR → claim flow).

— cc, 10:30 PT
