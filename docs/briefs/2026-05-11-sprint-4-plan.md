# Sprint 4 — May 11 → May 22, 2026

**Filed:** 2026-05-11 PT
**Filed by:** cc (Sprint 3 close-out → Sprint 4 opener)
**Companion:** [Sprint 3 receipt](/sprint-3-receipt) · [Weekly brief](/weekly-brief)

## Thesis

Sprint 3 added a wing: 11 rooms (sumo, gandalf-v10, drum-taiko, mesh-local, capital, mythos-v2, weekly-brief, almanac, shop/palace, sumo-tournament, night-sky), 14 reads cards, blocks 0462–0479. The town doubled in surface area. Now: **harden, activate commerce, and burn the remaining codex credit window before May 31.**

Not another expansion sprint. A consolidation-and-monetization sprint with codex credits as a use-or-lose constraint.

## Lanes

### Lane 1 — Commerce activation (cc + mh)

| item | owner | shape |
|---|---|---|
| `/shop/stall` opener | cc + codex (this PR) | cozy alternate to /shop's production catalog. Tile-per-product with state chips (live / pending / concept / queued / ask). Sister surface, not a replacement. |
| Coffee Mugs FA2 origination | **mh** | source ready at `contracts/v2/coffee_mugs_fa2.py`. cc wires the address post-origination. Promotes /coffee to a live mint surface. |
| Drum Token FA1.2 origination | **mh** | next in queue after coffee mugs. Less urgent. |
| /shop catalog expansion | cc | more Good Feels SKUs into the existing /shop catalog. Probably a Manus task to source product photos from getgoodfeels.com. |
| /shop/stall cross-link | cc | link from /shop's hero into the stall view; from /coffee, /drum, /cast, /drops into their stall tiles. |

### Lane 2 — Hardening pass (cc)

| item | owner | shape |
|---|---|---|
| `/mythos-v2` → canonical `/mythos` | cc | promote v2 over the April /mythos. Requires Manus pass first. |
| Cross-linking audit | cc | every existing room links to the new rooms it pairs with (e.g. /coffee → /reads/coffee-why, /drum → /drum-taiko, /window → /reads/hue). Mechanical, high-leverage. |
| `/agents.json` drift audit | cc | confirm all Sprint 3 rooms surface in /agents.json + /for-agents + /llms.txt + feed.json. |
| Sprint 3 receipt v2 | cc | add Manus screenshot proofs once they land. |
| Build-cache fix | cc + codex review | the stale-prerender-chunk error pattern that bit deploy tonight. Document, harden clean-build script, or document `wrangler pages deploy .dist-build` as the correct command (docs all say `dist`, but astro.config sets `outDir: './.dist-build'`). |

### Lane 3 — More codex burns (cc commissions + codex output)

Codex credits expire end of May. ~3 weeks left at session-end. Sustained pace: 1–2 codex commissions/day = 20–40 more rooms possible. Pace to taste; here's a ranked queue:

1. **`/shop/stall`** — this PR (codex 8 of this run, depending on count). ✓
2. **`/diagnostics-v2`** — deeper agent-readable diagnostics page, expanding `/diagnostics`.
3. **`/residents-v2`** — RFC 0003 made visible with real activity per resident from /wire.json + /scoreboard.json.
4. **`/random`** — daily random room redirect with deterministic seed.
5. **`/tour`** — narrated lap of the town, one room at a time.
6. **`/playlist`** — curated music room embedded with /cast-music.
7. **`/calendar`** — public PointCast calendar; daily race, drops, basho, briefs.
8. **`/sumo-stable`** — sumo training notes; codex's existing /sumo + /sumo-tournament have headroom.
9. **`/drum-taiko-trophy`** — cumulative Taiko scoreboard via localStorage.
10. **`/eth-spike-room`** — research room for ETH commerce-agent capabilities (NOT execution; just the spike doc as a navigable page).

### Lane 4 — Manus credit deployment (manus)

| item | shape |
|---|---|
| Image-gen 14 read-card headers | per [docs/briefs/2026-05-09-manus-image-gen-runbook.md](2026-05-09-manus-image-gen-runbook.md) (expanded in [2026-05-10-manus-sprint-3-mobile-qa.md](2026-05-10-manus-sprint-3-mobile-qa.md)). |
| Mobile QA sweep on all Sprint 3 rooms | 27 screenshots (9 routes × 3 captures), console + network notes, brief findings doc. |
| Verify-pass on /mesh-local | confirm Blue Butterfly, The Bakery, Tribune Tap House, USPS, El Segundo Brewing. |
| /shop catalog product photos | source from getgoodfeels.com and other live catalogs. |

Manus credit headroom: ~63k as of 2026-05-09. Sprint 3 used ~zero (most Manus tasks queued, none executed). Aim for ~25k spent in Sprint 4.

### Lane 5 — Off-ramp pending (mh)

| item | gating |
|---|---|
| ETH commerce-agent spike | gated on Coffee Mugs FA2 originating first (prove Tezos loop, then go cross-chain). |
| Show HN draft | gated on deploy pipe being trustable — manual wrangler is still the only working path. |
| RFC 0003 decisions | Kimi + Gemini onboarding model; first-PR approval threshold; soft cap. |
| Visit Nouns admin transfer | runbook at [docs/plans/2026-04-24-admin-transfer.md](../plans/2026-04-24-admin-transfer.md). |

## Three Mike decisions for Sprint 4

1. **Coffee Mugs FA2 — originate this week, or wait until Sprint 5?**
   **My pick: originate Week 1 (May 11–17).** /coffee is the front-and-center cozy room; making it a real mint surface validates the chain loop and unlocks /shop/stall's "Pending" → "Live" transition. Conservative caps (5 mugs, free mint + gas).

2. **`/mythos-v2` — promote to canonical `/mythos` when?**
   **My pick: after Manus QA passes on `/mythos-v2`, not before.** Don't replace a stable surface with one nobody has visited in a real browser. Manus pass → 24h soak → promote.

3. **Codex commission pace — 1/day or 2/day through May 31?**
   **My pick: 2/day weekdays, 1/day weekends.** ~25 more commissions before the deadline. Gives us a Sprint 4 ship target of ~15 codex rooms + ~10 cc-lane pieces. Don't try for 40; review burden compounds.

## What we explicitly don't do

- No new room sprawl unless replacing weaker existing rooms.
- No Tezos origination by cc/codex/manus. Only Mike signs.
- No social posting (Bluesky, Farcaster, X, HN) by agents.
- No Show HN while manual wrangler deploys are still required.
- No onboarding more agents (Kimi, Gemini) until RFC 0003 decisions land.
- No rewrite of /shop (the production catalog) — /shop/stall is a sister, not a successor.

## Daily cadence

- Morning: cc dispatches 1 codex commission. Reviews any merged PRs from overnight. Writes 1 read card if Mike provides a topic.
- Afternoon: cc ships codex's morning commission as a PR. Handles cross-linking on adjacent rooms.
- Evening: cc dispatches the second codex commission. Manus brief for the day's QA.

## Receipts

A short receipt block at the close of each week — what shipped, what slipped, what Mike unblocked. Block ids continue from 0479 (last Sprint 3 block) into the 0480s and 0490s.

— cc + codex, 2026-05-11 PT, El Segundo
