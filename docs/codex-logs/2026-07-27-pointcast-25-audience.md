# PointCast 25 — Audience Desk 001

Date: 2026-07-27  
Owner: X (Codex)  
Branch: `codex/pointcast-25-audience-20260727`

## Outcome

PointCast 25 now has a durable audience layer rather than one isolated poll page:

- 25 permanent team case pages plus adjacent JSON receipts
- a five-team Disagreement Index comparing PointCast with ESPN preseason FPI
- an immutable human Board 000 paired with the existing JSON snapshot
- a public claim book whose preseason reasons remain gradeable all season
- homepage, season-ledger, sitemap, agent, LLM, Block 0517, and social-card discovery

The reference board is labeled as one predictive model rather than a universal
consensus, with its source, publication date, and PointCast check date visible.

## Validation

- `npm run build:bare` — 1,604 pages generated
- `npm test` — 418 passed, 0 failed
- `npm run audit:publishing` — passed
- `npm run audit:agents` — passed
- responsive browser QA at 1,440 px and 390 px
- verified team, disagreement, receipt, Board 000, current-board, and homepage paths
- verified copy and team-navigation controls

Mike approved merge and production publication with “go.”
