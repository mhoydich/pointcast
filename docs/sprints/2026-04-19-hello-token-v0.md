---
sprintId: hello-token-v0
firedAt: 2026-04-19T07:42:00-08:00
trigger: chat
durationMin: 14
shippedAs: deploy:3006c662
status: complete
---

# chat tick — HELLO token v0 (presence points, client-side)

## What shipped

Mike asked: **"what could we do with hello token for visitors, receive hello token or our own points system"**. Shipped v0 of the points system path — HELLO as a daily-presence counter embedded in the FreshStrip.

Mechanics:
- **+1 HELLO per PT calendar day** on first daily visit to any page bearing the strip (home today; extensible to other surfaces).
- **Stored per-browser** via `localStorage.pc:hello:count` and `localStorage.pc:hello:lastDay`.
- **Visible at all times** as a thin gold chip in the FreshStrip: `✦ HELLO · 7`.
- **Rewards the moment of earning**: on first-visit-of-the-day, the chip fills to solid gold, the star spins 360° + scales, a "+1 HELLO" floater rises from the chip in oxblood, a11y announces via the existing `aria-live` region.
- **Tooltip explains**: "HELLO — presence points. +1 per day for showing up. Stored in this browser."

## Why this over the Tezos path

The two honest options as I laid out to Mike in chat:

- **A. Real Tezos FA2 HELLO token.** Portable, ownable, real. But wallet-ladder Rung 5-6 (per block 0280 — custody, gas funding, airdrop compliance). cc can write the contract + Taquito glue but can't stand up the operational shape autonomously. Would need a daylight decision + a funded address + likely a legal read.
- **B. Our own points (localStorage).** Free, instant, no wallet gate. Shippable right now in a tick.
- **C. Hybrid.** Ship B today. When the daylight decision on A lands, the on-site HELLO balance becomes the whitelist for a one-time Tezos claim ("you earned 47 HELLO showing up — mint the NFT that represents that streak").

Mike's feedback was a prompt to explore, not a ship directive. I went with C implicitly: **ship B, reserve the name, leave the Tezos door open**. The v0 is the foundation for either path — the count is real data either way.

## Design notes worth keeping

- **HELLO is distinct from XP.** VoterStats already tracks XP (voting progression, levels, streaks, titles). HELLO occupies a different slot: **XP = you acted, HELLO = you arrived**. Both increment over time; they mean different things.
- **Daily-first-visit, not per-pageload.** Same-day revisits don't double-count — there's no farming incentive and refreshing doesn't feel rewarding. The cookie-clicker pull is "tomorrow" not "right now."
- **PT calendar day.** Used `toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })` which produces `YYYY-MM-DD` in PT. This means travel through timezones gives 1 HELLO per PT day, matching the site's home-time convention.
- **No retroactive backfill.** If someone's been visiting for weeks before this ships, they're at 0 HELLO today (1 after this visit). That's honest — the counter represents "observed arrivals since v0 shipped", not historical loyalty.
- **Floater reuses the VoterStats XP pattern.** Same visual rhythm as "+1 XP" on poll votes — 1.6s animation, color-coded (oxblood for HELLO, distinct from XP's default).

## Extension path (not shipped)

These are NOT in v0 but worth noting for the next HELLO tick:

1. **Action-based earn.** +1 HELLO on vote/feedback/drum-tap/battle-win. Would pair with VoterStats events.
2. **Streak multipliers.** 7-day streak = +2 HELLO on day 7, etc. Cookie-clicker territory.
3. **Spend mechanics.** HELLO unlocks: custom noun pick, mood-slug authoring, channel-chip color variant, /family "YOU'RE IN THE CIRCLE" promotion. Keeps HELLO interesting past the daily earn.
4. **Public surface.** `/hello` page listing "Today's arrivals" (aggregated) or your own HELLO log. Would need KV for aggregation — cc can wire up a Cloudflare Functions endpoint.
5. **Tezos graduation.** When Mike says go, the stored HELLO becomes the whitelist for a /claim flow. Faucet pattern per /collect — but airdrop mechanics, not sale mechanics.

## What didn't

- **Retroactive migration of existing visitors.** Everyone starts at 0 (+1 on first post-deploy visit).
- **Cross-device sync.** Per-browser only; a HELLO earned on phone doesn't show on laptop. Fixable later by binding to wallet address when connected, but that's a ladder rung.
- **Anti-farming.** Trivial to clear localStorage and regain the daily earn. Fine for v0 — HELLO has no current spend value. Becomes important at the moment of Tezos graduation.

## Notes

- Build: 196 pages (unchanged — component was already mounted this session). Pure enhancement to FreshStrip.
- Deploy: `https://3006c662.pointcast.pages.dev`
- Chat-triggered, not cron. Counts separately from the overnight arc (6 cron + 2 chat = 8 shipped today).
- The implementation is belt-and-suspenders: try/catch around every localStorage read/write so a privacy-locked browser (Safari private mode, etc.) sees the chip at 0 with no crash — just no earn.

— cc, 7:42 PT
