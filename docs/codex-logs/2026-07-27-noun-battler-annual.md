# The Battle Record — Noun Battler Annual 2026

Date: 2026-07-27
Owner: X (Codex)
Status: publish-ready handoff; not deployed

## Outcome

- Built `/noun-battler-annual` as a longform interactive magazine: American sports-desk urgency crossed with a tactile 1970s newspaper annual.
- Reconstructed the factual Battler lineage from checked-in design notes, PRDs, route manifests, source data, TASKS history, and Git chronology.
- Kept the founding deterministic three-round duel, the Nouns Nation 30-v-30 auto league, and the Pacific 48 five-round stat-card edition distinct.
- Published the same editorial contract at `/noun-battler-annual.json` with CORS-open JSON, explicit persistence and projection boundaries, source rooms, history, gangs, roles, fields, and original-art metadata.

## Issue architecture

1. Cover: The Battle Record.
2. Editor's note: a sport born with an archive attached.
3. Founding rulebook: Strike / Focus / Guard and the inherited fighter card.
4. Eight-entry chronology from April 17 through July 18.
5. Eight-gang scouting book with real gang names, colors, marks, cries, and checked-in Battler sprites.
6. Five-role primer and factual fourteen-day, four-match-per-day, top-four league format.
7. Interactive press-box matchup lab with team and field selectors, deterministic quarter scoring, changed portraits/colors, and an editorial call.
8. Media-institution essay covering TV, mobile, Desk Wall, results, agents, production, and version archaeology.
9. Pacific 48 sidebar and a seven-door route index into the actual playable complex.

The matchup lab is labeled as an annual-only editorial projection. It does not save state, alter the local Nouns Nation league, claim official results, or expose odds or wagering.

## Original visual series

Stable project:

`poster-image-engine/projects/noun-battler-annual-2026/`

Verified outputs:

- `poster-01.png` — The First Box Score
- `poster-02.png` — Thirty Against Thirty
- `poster-03.png` — The League Remembers

The series was planned, generated one image at a time, imported, and verified at 1536 × 1024. Compressed browser assets are checked in below one megabyte each under `public/noun-battler-annual/plates/`.

## Discovery

- `/noun-battler` links to the annual.
- `/nouns-nation-battler/` links to the annual from the Battle Desk network bar.
- `/agents.json` exposes the human and JSON endpoints.
- `/for-agents`, `/llms.txt`, and `/llms-full.txt` describe the issue and its machine twin.

## Validation

- Targeted annual tests: 6 / 6 passing.
- Full suite: 393 / 393 passing.
- Agent surface audit: passed.
- Bare static build: 1,555 pages, passed.
- Desktop visual QA: 1440 × 960.
- Mobile visual QA: 390 × 844 with document width equal to viewport width.
- Interactive QA: Sunset Prop House vs. Mint Condition on Nouns Kingdom updated score, quarters, colors, Noun portraits, and call.
- Browser console: no warnings or errors during the annual QA pass.
- Publishing audit: expected dirty-worktree check only; do not publish until the change is intentionally reviewed and committed.
