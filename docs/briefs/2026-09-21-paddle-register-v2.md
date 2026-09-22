# The Paddle Register v2 — PRD

**Date:** 2026-09-21 · **Owner:** cc (Claude Fable 5.1) for Mike · **Status:** approved to build ("yah make a v2, keep going, prd then build")

## Where v1 landed

v1 shipped the same day (PR #1163, block 0598): 68 paddles from 33 brands (2025–2026), one permanent page each, to-scale drawings, share cards, the two-rulebook legal join, JSON twins, two MCP tools, a weekly refresh task, and The Bag on Rally. Live: pointcast.xyz/paddles · tez-rally.pages.dev/bag/.

What it proved: the record (dates, prices, approvals, construction) is a different product from the lab databases, and building it uncovered errors in the public record — review dates masquerading as launch dates, four "approved" paddles that are tour-only.

What it cannot do yet: answer "which of these two?" side by side; answer "what can I bring to Nationals?" as a list; say anything about a paddle after purchase; show who plays what; tell a returning reader what changed since last week. 19 paddles are still drawn from a nominal outline. 2024, the year foam and the JOOLA case began, is missing.

## Goal

Make pointcast.xyz/paddles the page an enthusiast opens *before* the lab reviews, and the page an agent cites *for* facts about a paddle. Measured by: (1) the compare and legal pages get used from the register index; (2) the first field wear reports arrive from The Bag; (3) the weekly refresh writes to the changes feed without editing prose.

## Principles (unchanged from v1)

1. The labs measure; the register records. Never re-measure, never copy a lab's power/spin numbers.
2. Every fact carries a source; unknown stays unknown; drawings, not brand photos.
3. Open (CC0), agent-readable, no affiliate links.
4. Nothing after purchase is collected without an explicit act by the player, and nothing identifies the player.

## Scope

### A. Compare — `/paddles/compare`

Pick two to four paddles. The page draws their outlines **superimposed to scale** (the visual nobody else has: a widebody over an elongated over a hybrid, same origin, handle bottoms aligned) and lists, side by side: launch date, list price, build, thickness, shapes, USAP / UPA-A / quiet, published dimensions, each lab's swingweight and twistweight with the lab's name, core layers, lab links. Client-side over `/paddles.json`; URL state `?ids=a,b,c` so a comparison is shareable. Entry points: a "compare" checkbox on each index card and a "compare with…" row on every paddle page. Deep link from the Paddle Fund and The Bag (a bag can open its paddles in compare).

### B. Legal — `/paddles/legal`

The question people actually ask: "can I use this at my event?" One page, three rulebooks as tabs — USA Pickleball sanctioned play, PPA/MLP (UPA-A), USAP Quiet Category — each listing what is approved, what is not, what is pending, and the paddles that are legal under one rulebook and not the other, with the reason (grit fails USAP's roughness test; 14mm over PBCoR). Dated "status checked" line, links to both official lists, and the same honesty line as the paddle pages. Server-rendered from the register.

### C. Field reports — `/api/paddles/wear` + the paddle page

The Bag gets one new button on a paddle card: **"Send a wear report to the register."** It posts an anonymous record: paddle id, total hours, sessions, hours at first "fading" grit check (if any), hours at "went dead" (if any), months in play, and the bag's `intended-rating` bucket (2.5–5.0, rounded to .5) if set. No name, no device id, no free text. Stored in VISITS KV (`paddles:wear:{id}` list, capped, plus an IP-budget rate limit mirroring `/api/bell-post`). Server validates hard ranges and rejects, never repairs.

The paddle page loads `/api/paddles/wear?id=` at runtime and, at **three or more reports**, shows a "Field reports" panel: n, median hours logged, median hours to grit fading (when ≥3 report it), share reporting "went dead", and the rating buckets reporting. Under three reports it says how many are in and asks for more. The panel states plainly that these are self-reported and unaudited. A `/paddles/wear.json` endpoint exposes the aggregates for everyone (never the raw rows).

### D. Who plays what — `/paddles/pros`

A table built from the register's `pro` fields and the 2026 signings: player → current paddle (linked) → previous brand → date of the move → source. Grouped by brand. This is the "what does Ben Johns play" query, answered with a source and a date instead of a forum post.

### E. Changes feed — `/paddles/changes` + `/paddles/changes.xml`

The weekly refresh appends to a `changes` array in `paddle-register.json`: `{date, kind: added|shipped|approved|delisted|price|corrected|signed, paddle, text, source}`. v2 seeds it with the v1 corrections (the Aurelius approval, the four tour-only paddles, the re-anchored dates) so the feed is honest from day one. Rendered as a page and as RSS so enthusiasts and agents can subscribe. `paddle_lookup` returns a paddle's own changes.

### F. Data

- **2024 backfill** (research lane, ~25 paddles + anchors): JOOLA Gen 3 and the decertification, PBCoR's arrival, the first foam paddles, the Saga, the Shapeshifter. Extends the register to three years.
- **Dimension and origin fill** (research lane): the 19 nominal-outline paddles and the ~55 missing "made in", from brand pages and lab spec tables only.
- **Confidence on the card**: the index card shows a small "drawn from published dims" mark so nominal outlines are never mistaken for measured ones.

### G. Rally

- The Bag: "Send a wear report" (C), "Compare these" (A), and a "what changed" line reading `/paddles/changes.xml`.
- `register.json` regenerated with the 2024 rows.

## Out of scope for v2

Per-variant pages; user accounts; brand-supplied photos (outreach draft exists; add only with written permission); price tracking over time (the changes feed captures cuts as events, that is enough for now); a comparison of lab numbers across labs (their numbers are not comparable across rigs, and saying so is part of the record).

## Risks and how they are held

- **Wear-report spam.** IP budget + per-paddle caps + hard-range validation + a three-report floor before anything is shown. Aggregates only; raw rows never leave KV. If it is gamed, the panel's "self-reported, unaudited" line is true and the fix is a report of the report.
- **Compare implies equivalence between labs.** Every number carries the lab's name; the page says once that different rigs give different numbers.
- **Legal page read as authoritative.** Dated, linked to the official lists, and phrased as "on the list on <date>", never "legal".
- **Block count.** v2 is block 0599 unless another agent claims it first; check `origin/main` before committing.

## Build order

1. Data model: `changes` seed, `wear` API + test, register lib helpers (compare rows, legal buckets, pros rows).
2. `/paddles/compare` (overlay drawing + table), `/paddles/legal`, `/paddles/pros`, `/paddles/changes(.xml)`.
3. Paddle page: field-reports panel, compare-with row. Index: compare checkboxes, drawn-from mark.
4. Rally Bag: send report, compare, changes line. `register.json` rebuild.
5. Merge the two research lanes (2024, fill), rebuild, verify, block 0599, PR, merge, deploy PointCast then Rally.
6. Runbook + scheduled task prompt updated for the changes feed.
