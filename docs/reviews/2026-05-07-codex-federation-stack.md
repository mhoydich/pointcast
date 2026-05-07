# Codex review · federation stack

**Date:** 2026-05-07
**Author:** cc
**Owner ask:** codex
**Stage:** queued

## What landed

Eight surfaces shipped over two sessions, each as a self-contained
`src/lib/*.ts` + `src/pages/*.astro` + `src/pages/*.json.ts` triplet.
Every page has Schema.org JSON-LD (`CollectionPage` or `TechArticle`)
and JSON mirrors at predictable paths. No shared-file edits — the
work is purely additive.

| Sha | Surface | Class | LOC |
|---|---|---|---|
| `39a4010` | `/hermosa-beach` | UES-Fork-HB-02 (second fork instance) | ~321 |
| `88a3554` | `/strand-corridor` | UES-Federation-01 (federation seam, not an instance) | ~255 |
| `2b1a8aa` | `/forkable-template` | UES-Template-01 (developer fork-this-repo guide) | ~252 |
| `43915a7` | `/redondo-beach` | UES-Fork-RB-03 (corridor south anchor) | ~311 |
| `849e902` | `/giant-works` | UES-Federation-02 (8 element-coded Tier D works, 50-yr build queue) | ~631 |
| `2a05fc0` | `/corridor-strengths` | UES-Federation-03 (strengths overview, 11 cities profiled) | ~453 |
| `c01fded` | `/torrance` | UES-Fork-TR-04 (fifth instance, inland depth) | ~321 |
| `dcffec2` | `/giant-works-art` | UES-Federation-04 (8 audio/light/art Tier D works) | ~598 |

Each commit is on a different branch (parallel-agent branch-flipping
during the session). All eight commits are reachable on the remote
once pushed; cherry-pick onto a clean branch off `origin/main` for
review.

## What to review

### Priority 1 — agent-readable surface integrity
Eight new JSON endpoints. All eight follow the pattern of existing
JSON mirrors (`*.json.ts` sibling, `application/json; charset=utf-8`,
`max-age=300`, `Access-Control-Allow-Origin: *`, `$schema` field).
Run `npm run audit:agents` and confirm:

- All eight new routes appear in the agent-readable index
- `agents.json` lists them
- No regression in existing JSON mirrors

### Priority 2 — Schema.org JSON-LD coverage
Each of the eight pages includes `<BlockLayout jsonLd={...}>` with
either `@type: CollectionPage` or `@type: TechArticle`. Spot-check:

- `@id` matches the canonical URL
- `isPartOf` references `EducationalOrganization` (University of El Segundo)
- No duplicate `@id`s across the eight surfaces

### Priority 3 — cross-link integrity
The federation ladder cross-links extensively. Confirm no dead links:

- `/forkable-radius` → `/coordinate` → 4 forks → `/strand-corridor`
- `/giant-works` references `/manhattan-beach`, `/hermosa-beach`,
  `/redondo-beach`, `/torrance`, `/stones`, `/marine-layer`, `/fire`,
  `/geology`, `/ocean-wing`
- `/giant-works-art` references `/giant-works`, `/strand-corridor`,
  `/torrance`, `/stones`, `/marine-layer`
- `/corridor-strengths` references all 5 instance forks +
  `/strand-corridor` + `/giant-works`

### Priority 4 — build + bundle
Run `npm run build:bare`. Confirm:

- All 24 new files compile (8 lib + 8 page + 8 json route)
- No new TypeScript errors
- Bundle size delta is in line with other CollectionPage additions
  (~5-8KB gzipped per page, JSON routes negligible)

### Priority 5 — copyright + voice
The work is in cc-voice (NOT mh-voice; VOICE.md applies). Spot-check:

- No "I" / "we" claims of personal experience
- Inspirations section in each Tier D work cites real precedents
  (Rothko Chapel, Newark Art Lending 1929-2016, Whitechapel Bell
  Foundry, etc.) — verify factual accuracy on at least 3
- `signedBy: 'Michael Hoydich'` appears in commit messages where
  Mike explicitly requested it (giant-works, giant-works-art) — this
  is editorial signature, not authorship

## What NOT to review (out of scope for this PR)

- The dev-server / shipping path. Branches flip; commits land on
  whatever branch was last selected. This is a separate workstream
  Mike is tracking; cc is not blocked on it.
- The 16 Tier D works themselves (factual program detail, cost-band
  realism, fundraising-path feasibility). These are prospective
  catalog entries, not committed projects. Codex review is for code +
  schema integrity, not architectural-engineering review.
- The `corridor-strengths` city profiles (demographic claims, civic
  muscle inventories). These are intended to be revised by people who
  actually live in those cities — see the Invitation panel on each
  page.

## How to land

1. Cherry-pick the 8 commits onto a fresh branch `ship/federation-stack`
   off `origin/main`.
2. Run `npm run build:bare` and `npm run audit:agents`.
3. Open one PR titled `feat(ues): federation stack — 8 surfaces`.
4. Codex reviews per priorities above.
5. On approval, merge — the federation surfaces go live in one move.

## Followups (cc will own)

- LA28 Forcing Function Working Paper (UES-WP-2026-13) — three years out
- Federation Council Charter (UES-Federation-05)
- Per-Tier-D-work deep-dive Working Papers (Bath House first, then Concert Hall)
- Homepage JSON-LD `Organization` schema addition
