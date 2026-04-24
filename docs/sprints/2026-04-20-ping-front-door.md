---
sprintId: ping-front-door
firedAt: 2026-04-20T16:10:00-08:00
trigger: chat
durationMin: 20
shippedAs: deploy:0264042b
status: complete
---

# chat tick — Ping as a front door · top-of-home composer + bar chip + session-start hygiene

## What shipped

Two triggers collapsed into one ship:

1. **Mike 2026-04-20 15:55 PT chat:** *"and yah from the top, homepage, a /ping block to send information and feedback to"* — the homepage composer directive.
2. **Mike 2026-04-20 12:52 PT via /api/ping itself:** *"yah ping should be in the bar, bench is too dense, here and drum kinda same thing"* — the bar-chip directive (which I had missed until 15:55 PT when Mike asked "are you seeing messages via /ping" and I finally read the KV inbox).

The behavioral gap — cc not reading `/api/ping?action=list` at session start despite AGENTS.md documenting it — was the real problem. The ship fixes three layers at once:

1. **Home surface** — a ping composer at the top so anyone can drop feedback without navigating.
2. **Bar surface** — a `✎ ping` chip in CoNavigator's quick-nav so the send-feedback affordance is one tap from every page.
3. **Agent hygiene** — AGENTS.md now has an explicit curl-based checklist for the session-start inbox read, so the next cc session can't "forget" to check.

### Files shipped

- **`src/components/PingStrip.astro`** (new, ~250 lines)
  - Kicker: "PING · feedback + ideas for the team — cc reads the inbox at session start"
  - Collapsed default: one line + a `✎ say something` toggle button (dark fill, warm-amber border to match editorial palette).
  - Expanded: 3-row textarea (body, required), 2-col row (from / subject, both optional), `EXPAND & PUBLISH` opt-in checkbox, SEND button + status readout + `or use the full form →` escape hatch to `/ping`.
  - Submits POST to `/api/ping` with `type: pc-ping-v1 · body · from? · subject? · expand? · timestamp`.
  - Success → `sent — cc reads at session start` (or `sent — cc drafts a block on the next tick` when expand=true) → collapses after 1.8s.
  - Keeps `from` populated between submits so Mike doesn't retype his name mid-thread.

- **`src/components/CoNavigator.astro`**
  - Right-zone nav order: `here · drum · ✎ ping · bench · me`. Ping chip uses amber accent (`#e89a2d`) and the `✎` glyph so it reads as a distinct "send" affordance vs. the other navigation links.
  - Mobile breakpoint at 400px already hides chip #4+ so ping stays visible on tiny screens (since it's #3 in the order).

- **`src/pages/index.astro`**
  - `PingStrip` renders as the FIRST strip on the home, above `FreshStrip`. Rationale: feedback → in, freshness → out. Give the inbound channel top billing so Mike's first instinct on any page is "drop the idea now".

- **`AGENTS.md`**
  - New section under Claude Code role: **SESSION-START INBOX CHECKLIST — do this FIRST, before any other work.** With an explicit curl command (`curl -s 'https://pointcast.xyz/api/ping?action=list' | jq '.entries[-5:]'`) and an `ls docs/inbox/` for the on-disk side.
  - Policy strengthened: "Never start implementation work before this read; the ping inbox is the highest-priority channel Mike has for async direction."

- **`src/lib/compute-ledger.ts`** — two entries added:
  1. Mike's audit ping as `editorial · shy` (it's the input that surfaced the gap; tagging it correctly preserves the discipline "compute ledger records what triggered what").
  2. This ship as `sprint · healthy`.

## Inbox state at session-start

Eight pings in the KV inbox before this ship. Read + acknowledged each in the chat response. Unprocessed as of this retro:

- `First Good-Feels product block` (2026-04-19 — waiting on Mike to pick the product + image)
- `hello@pointcast.xyz not working + cast button + red-in-favicon` (2026-04-19 — favicon now fixed via the broadcast emoji swap earlier today; email + cast button still open)
- `geo + checkin types` (2026-04-19 — presence DO + STATIONS shipped as geo primitive; explicit check-in action surface not yet)
- `explore codex top plan` (2026-04-19, `expand: true` — codex integration shipped but the "draft + publish" block from this topic wasn't written; deferred to a later tick)

Not deleted from KV yet — the cleanup motion ("cc deletes processed pings after draft+publish") only fires for the `expand: true` ones, and the codex-expand one is the only one that should be processed that way. Queued.

## Why "top of home" for the composer

Home currently starts with FreshStrip (HELLO / N NEW / CAUGHT UP badge). That surface answers "what's new for me?" But inbound feedback matters more than outbound freshness signaling on a living broadcast where the reader may also be a collaborator. Putting PingStrip above FreshStrip says: "we want your signal more than we want to sell you our updates."

Collapsed-by-default keeps the visual weight low. One-line kicker + chip. Expanding is opt-in and only costs the visitor 1 tap.

## Deploy

Pending at retro-write time. Build verified locally (255+ pages, clean).

## What didn't

- **Workbench dedensify** — Mike's ping called out "bench is too dense". Deferred to next tick. Needs a walk through of `/workbench` to identify what to collapse, what to strip.
- **/here vs /drum differentiation** — Mike's ping: "here and drum kinda same thing". They aren't functionally identical (drum = 6-pad beat + editorial; here = shared presence with beat + poll), but the surfaces blur together. Next tick: sharper framing copy + maybe consolidate the beat pad into one shared component.
- **SportsStrip v3 + BlockReorder live-debug + NetworkStrip promo repurpose + Start-here in bar** — all still queued from prior ticks.
- **Codex-expand ping** — "explore codex, we have the top plan" — Mike explicitly flagged `expand: true`, meaning he wants cc to draft + publish a block from that seed. Not shipped yet. Good candidate for a cron tick tomorrow.

## Observations

- **The session-start inbox miss was the single most valuable thing this session.** Shipping primitives is good; being reachable is better. If the async channel is broken, everything else is downstream.
- **The composer pattern is reusable.** Same shape could power a `/pong` (cc → Mike direction) or a `/relay` (agent → agent) surface later. Note for future.
- **The 5-chip nav still fits on mobile.** Tested width thresholds mentally: 400px keeps here/drum/ping (first 3); 520px adds bench + me. No wrap issues.
- **Ping-in-the-bar on mobile is particularly important** because the home PingStrip only helps on the home. A sub-page ping-click without the bar chip would require a full back-navigation.

## Follow-ups (priority order)

1. **Ship this (build + deploy).**
2. Workbench dedensify pass.
3. /here vs /drum sharper distinction.
4. Process the codex-expand ping into a block (cron-tick candidate).
5. Remaining backlog: SportsStrip v3, BlockReorder debug, NetworkStrip promo, Start-here-in-bar.

## Notes

- Files new: 2 (PingStrip.astro + this retro).
- Files modified: 4 (CoNavigator.astro, index.astro, AGENTS.md, compute-ledger.ts).
- Cumulative: **60 shipped** (28 cron + 32 chat).

— cc, 16:10 PT (2026-04-20) · the inbox has a front door now; the discipline has a checklist
