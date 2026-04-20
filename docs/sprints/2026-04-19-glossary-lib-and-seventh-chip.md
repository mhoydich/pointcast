---
sprintId: glossary-lib-and-seventh-chip
firedAt: 2026-04-19T19:11:00-08:00
trigger: cron
durationMin: 21
shippedAs: deploy:145e39d1
status: complete
---

# 19:11 tick — glossary extracted to lib + TodayStrip 7th chip (TERM)

## What shipped

Two compounding moves in one tick:

### 1. Glossary refactored — `src/lib/glossary.ts`

The 26-term definition set that lived inline in `src/pages/glossary.astro` (lines 22-228) extracted to a lib module. Exports:
- `Term` interface (same shape as before: slug, term, definition, seeAlso, canonicalUrl, category).
- `GLOSSARY: Term[]` — the full 26-entry array, unchanged.

`src/pages/glossary.astro` now reads `import { GLOSSARY } from '../lib/glossary'; const TERMS = GLOSSARY;` — ~190 lines shorter. Rendering unchanged. The inline TERMS alias preserves all existing references without downstream edits.

### 2. Seventh chip on TodayStrip — TERM

TodayStrip now cycles a glossary term as the 7th daily-rotating chip. Derivation: `GLOSSARY[(daySeed + 11) % GLOSSARY.length]` (prime offset +11 keeps it out of sync with the other six).

Chip renders:
- Eye: `TERM` in green (#0F6E56, matches Garden channel register)
- Main: the term itself (e.g. "FA2", "Card of the Day", "/manifesto")
- Sub: `{CATEGORY} · /GLOSSARY` (primitive / surface / chain / mechanic / channel / role)
- Target: `/glossary#{slug}` → deep-links to the anchor

Today's term (seed 2026109 + 11 = 2026120, mod 26 = 14): **Signed voucher** (category: chain).

## Why this over the pool

- **Mike named this** implicitly in the "clickable things for information share" directive. The six existing chips cover registers/content/geography/nouns — none do *editorial vocabulary*. Glossary does.
- **Rule-of-three** (or more honestly, rule-of-two): glossary.astro was the only consumer; TodayStrip now is the second; a future `/glossary.json` machine mirror and the TrackLab / VideoLens briefs all reference "glossary terms" as a natural data source. Four consumers within reach — lib extraction is overdue.
- **Safe**: verbatim copy of the data into lib, identical rendering on /glossary (verified 4 expected ids still present in dist HTML post-refactor).

## Design decisions worth recording

- **`const TERMS = GLOSSARY;` alias** in glossary.astro instead of refactoring all internal references. Minimizes diff; preserves every downstream line untouched.
- **Prime offset +11** for the TERM chip rotates at a different cadence than mood (+0), station (+3), namedrop (+5), channel (+7), noun (*7). Six adjacent days produce six different featured terms with low repeat.
- **Green eye color** for TERM chip (#0F6E56). Matches Garden channel tonally — terms are "quiet noticing" in the vocabulary sense. Distinguishes it from the other six chip colors (oxblood/blue/purple/burnt-orange/channel-var/mesh-purple).
- **No new `/glossary.json` yet**. The existing DefinedTermSet JSON-LD on /glossary already gives agents machine-readable access. A dedicated /glossary.json endpoint would duplicate. Deferred until an agent use case emerges.

## What didn't

- **Third consumer yet — `/glossary.json` endpoint**. Mentioned in the lib's header comment as queued. Not this tick.
- **Extract `pickTodayStrip(…)` into `src/lib/today-strip.ts`**. Noted in prior retros. Still not done; TodayStrip component + /today.json still duplicate the per-chip derivation inline. Will extract when a third consumer (likely a /tv Today slide) appears.
- **Mobile-responsive adjustment** for 7 chips instead of 6. At 220px-minimum column width, 7 wraps more eagerly than 6 at mid-breakpoints. Build looks OK; if Mike sees weird wrapping next check, I'll tighten.

## Notes

- Build: 205 pages (unchanged; pure component + lib refactor).
- Verified in dist HTML: all 7 `chip--*` classes present exactly once in `index.html`; glossary page shows 4 expected anchor ids still render post-refactor.
- Deploy: `https://145e39d1.pointcast.pages.dev` (two deploys this tick; second was cleanup of unused `type Term` import left over from the initial refactor, caught post-first-deploy).
- Mid-tick small snag: initial Edit call to remove `type Term` failed with "file modified since read" — sed had run between the Read and the Edit. Re-read and re-edited; deployed cleanly.
- Cumulative today: 27 shipped (17 cron + 10 chat).

— cc, 19:32 PT
