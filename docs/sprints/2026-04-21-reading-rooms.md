---
sprintId: reading-rooms
firedAt: 2026-04-21T16:55:00-08:00
trigger: chat
durationMin: 20
shippedAs: staged · awaiting deploy
status: staged
---

# chat tick — Reading rooms (/rfc + /research index + manifests)

## What shipped

Mike 2026-04-21 16:40 PT: *"easiest neatest path."*

Interpreted as: finish the two reading-room surfaces that got half-started earlier in the day. The `/rfc/[slug]` dynamic route shipped with the Compute Ledger RFC but never got an index page or agent manifest. The two research memos that shipped today (frontier scan → `/b/0368`, agent-games → `/b/0377`) had no native home at all — both pointed back at the GitHub raw URL. One small sprint closes both gaps.

### Files shipped

- **`src/lib/research.ts`** (new, ~95 lines) — `ResearchMemo` interface + `listMemos()` + `getMemo(slug)`. Parses the bold-key header block (`**Filed by:** …`, `**Trigger:** …`, `**Purpose:** …`) and extracts the first post-header paragraph as a summary. Newest-date-first sort from the `YYYY-MM-DD` prefix in the filename. Same `import.meta.glob` pattern as `src/lib/sprint-recap.ts` + `src/lib/rfcs.ts`.
- **`src/pages/rfc/index.astro`** (new) — human index for RFCs. CollectionPage JSON-LD, stats header (count + words total), item-list layout with version + status + date + word-count per RFC. Read + source links.
- **`src/pages/rfc.json.ts`** (new) — agent manifest for RFCs. Schema `pointcast-rfcs-v0`, CORS open, 5-min cache. Payload includes slug + title + version + status + filed_at + editors + license + contact + canonical_url + source_url + word_count + abstract per RFC.
- **`src/pages/research/[slug].astro`** (new) — dynamic route for a single memo. Mirrors `/rfc/[slug]` chrome; reuses `src/lib/rfc-render.ts` for Markdown→HTML (same dialect). ScholarlyArticle JSON-LD.
- **`src/pages/research/index.astro`** (new) — human index for research memos. Same layout family as `/rfc`, tuned for memo display (purpose + summary preview instead of abstract).
- **`src/pages/research.json.ts`** (new) — agent manifest for memos. Schema `pointcast-research-v0`, CORS open.
- **`src/lib/compute-ledger.ts`** — one entry prepended (this sprint, `modest` signature).

### Why this shape

Three reasons this is the neatest path:

1. **Zero new dependencies.** Everything reuses existing primitives: `import.meta.glob` (sprint-recap pattern), `rfc-render.ts` (already written for the RFC ship), BlockLayout chrome, JSON-LD discovery, CORS-open agent manifests. No new toolchain, no new schema, no new configuration.

2. **Completes half-done work without forking.** The `/rfc/[slug]` route already existed; it just didn't have a home page or a programmatic sibling. Adding those two files makes the surface coherent. Adding `/research` next door reuses the same three files (+lib), so both directories are symmetric.

3. **The pattern is now clear for any future `docs/{x}/` surface.** One lib (`src/lib/{x}.ts`), one dynamic route (`src/pages/{x}/[slug].astro`), one index (`src/pages/{x}/index.astro`), one manifest (`src/pages/{x}.json.ts`). If a `docs/rfc-v0-review/` or `docs/specs/` or `docs/briefs-public/` directory gets elevated later, the work is six files.

### What did NOT ship

- **Reference updates on blocks 0368, 0370, 0377.** Those blocks' `external` fields still point at the GitHub raw URLs. A follow-up sprint could swap them to the new canonical `/rfc/compute-ledger-v0` + `/research/2026-04-21-where-we-are` + `/research/2026-04-21-agent-games` URLs. Cheap + low-priority.
- **Navigation link-backs from the CoNav HUD NETWORK panel** to `/rfc` and `/research`. Same panel that's queued for `/decks` link-back. Batch when that ships.
- **`/compute` page footer update** to cite the RFC at its new native URL. The RFC ship noted this as a follow-up; still pending.
- **Commit or deploy.** Staged.

### Guardrail check

- **Schema changes?** No. Two new JSON-manifest schemas (`pointcast-rfcs-v0`, `pointcast-research-v0`) are *content* schemas, not runtime schemas. They mirror the existing `pointcast-decks-v0` pattern.
- **Brand claims?** None. Pure plumbing.
- **Mike-voice content?** None. The memo/RFC bodies are cc-authored; this sprint just gives them addresses.
- **Real money / DAO?** No.
- **Contract origination?** No.

Safe to commit.

## Deploy (pending)

Files on top of the agent-games-research commit:

- `src/lib/research.ts`
- `src/pages/rfc/index.astro`
- `src/pages/rfc.json.ts`
- `src/pages/research/[slug].astro`
- `src/pages/research/index.astro`
- `src/pages/research.json.ts`
- `src/lib/compute-ledger.ts` (modified)
- `docs/sprints/2026-04-21-reading-rooms.md` (this file)

Recommended commit message: `feat(reading-rooms): /rfc index + manifest + /research dynamic route + index + manifest`.

Post-deploy verification:
- `curl https://pointcast.xyz/rfc` → 200, HTML
- `curl https://pointcast.xyz/rfc.json | jq '.rfcs | length'` → `1`
- `curl https://pointcast.xyz/research` → 200, HTML
- `curl https://pointcast.xyz/research.json | jq '.memos | length'` → `2`
- Navigate to `/rfc/compute-ledger-v0` and `/research/2026-04-21-where-we-are` — both render the markdown cleanly

## Follow-ups

- (a) **Swap block 0368/0370/0377 external URLs** to their new canonical native URLs.
- (b) **CoNav HUD NETWORK panel** — add /rfc + /research + /decks in one pass.
- (c) **/compute footer** — cite the RFC at its native URL.
- (d) **Next research memo lands automatically.** Drop a markdown file in `docs/research/` and it appears on `/research` on next build. No code changes needed.

---

— filed by cc, 2026-04-21 16:55 PT, sprint `reading-rooms`. Six files, twenty minutes, zero new dependencies. The memos + the RFC now have addresses at pointcast.xyz.
