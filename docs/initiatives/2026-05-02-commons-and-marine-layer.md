# 2026-05-02 — PointCast Commons + Marine Layer + First Sit

**Status:** Consolidated handoff. The full source for every file below was authored in the Claude Code session of 2026-05-02 and exists verbatim in that conversation transcript. Reapply by either pasting from the transcript or asking a fresh agent to regenerate from this spec.

**Branch suggestion:** `feature/commons-marine-layer`

---

## What this initiative is

Three connected surfaces that turn the existing University of El Segundo framework into something a real human can show up to and put a give-back on the books for:

1. **Marine Layer** — UES Track 07. A meditative program of eight place-based weekly sittings inside the 25-mile radius. Each sitting names one place, one breath protocol, one prompt, one artifact.
2. **PointCast Commons** — A give-back layer for real-estate / civic-space acquisition with the principle *access first, ownership last*. Public registry of what is already common, wishlist of what could be acquired (each with a trigger condition), six-kind ledger with weights, browser-local log form, five-phase acquisition thesis. Anchored by the **First Bench** pilot at Hilltop Park.
3. **First Sit** — RSVP page for the inaugural Marine Layer sitting (Saturday 2026-05-09, 6:00 AM, Plaza El Segundo north fountain bench), with .ics export.

These are the smallest version of each thing that produces a real receipt.

---

## First principles (Commons)

1. Access is the goal. Acquisition is one tool among many — usually the last one.
2. A common space is one nobody has to pay a gatekeeper to use. If it requires a key, it is not yet common.
3. Receipts over promises. Every give-back is logged before it is celebrated, with a name, a date, and a unit.
4. Twenty-five miles is the boundary because trust needs proximity. The fund does not buy what stewards cannot walk to.
5. Map it, befriend it, steward it, then own only what stewardship requires. We do not buy what a relationship can hold.
6. Permanent affordability beats one-time generosity. When we own land, we hold it in a community land trust shell so it stays common past us.
7. The smallest useful unit is a bench. Start there. A bench precedes a pavilion; a pavilion precedes a parcel.

---

## Acquisition thesis (Commons) — five phases, no skipping

| Phase | Threshold | Action |
|---|---|---|
| 0 · Map | months 0–6 | Public registry. No fundraising. Build the ledger. |
| 1 · Steward | 50 logged give-backs | Stewardship circle (5–9 people). Pursue 3 wishlist items without buying. Open parks-dept conversations. |
| 2 · Vehicle | 100 give-backs + 1 offered easement | Open CLT shell entity. Publish governance. Accept first easement gift. |
| 3 · First parcel | 12 months prior stewardship of the target space | One parcel under $400k, walking distance from a UES session, with public-passage potential. Land in CLT, improvements rented at cost. |
| 4 · Open hours | 1 year after first parcel | No new acquisitions until parcel has documented public open hours. |

---

## Give-back ledger (Commons)

| Kind | Unit | Weight |
|---|---|---|
| Hours | one volunteer hour at a public space | 1 |
| Dollars | one dollar to the commons fund | 1 |
| Objects | one durable object donated to a public shelf | 2 |
| Easement | one signed grant of public passage | 25 |
| Expertise | one hour of pro bono real-estate, legal, or design work | 3 |
| Custody | one month stewarding a space's calendar or upkeep | 4 |

---

## Wishlist (Commons) — each with trigger condition

| Item | Cost | Trigger |
|---|---|---|
| Corner lot for a free pavilion | <$400k | 100 give-backs + willing seller within walking distance of a UES session |
| Beach-access easement | variable | A real path is identified as actively closing |
| Main Street meeting room | $3–6k/mo lease, buy later | One full UES year + stewardship circle willing to keep hours |
| Tool library space | sub-lease in a friendly garage | 25 logged tool donations |
| Pollinator garden parcel | parks partnership | One season of Honey League + parks-dept conversation |
| One more pickleball court | $40–80k | Paddle Tide >100 profiles + Court Craft usage data |
| Dawn-sit benches | $1–3k each | 3 months of Marine Layer attendance + parks-dept signoff |

---

## First Bench pilot

- **Where:** Hilltop Park, southwest corner — facing the marine layer
- **Why:** The highest sit in town has no west-facing bench. A single bench turns a parking-lot view into a Marine Layer anchor and proves the give-back loop works at the smallest possible unit.
- **Cost:** $1,800 (bench + parks-department permit + plaque)
- **Threshold:** 25 ledger weight
- **Current weight from seed receipts:** 64 (already triggered)
- **Status:** concept → next step is parks-department intake (Manus brief below)

---

## Marine Layer — eight sittings

| Wk | Title | Place | Breath |
|---|---|---|---|
| 1 | Plaza Dawn Sit | Plaza El Segundo, north fountain bench | 4–7–8 ×8, then natural |
| 2 | Powerline Walk | Powerline easement above town, looking west toward Chevron | Box 4–4–4–4 paced to footfall |
| 3 | Imperial Blue Hour | Imperial Avenue overlook, top of the dunes | Counted to 60, restart on drift |
| 4 | Library Quiet Hour | El Segundo Public Library, second-floor reading room | Natural |
| 5 | Flight-Path Sit | El Porto sand, under LAX 25R approach | Resonant 5.5–5.5; planes are the bell |
| 6 | Refinery Lights | Chevron edge, sidewalk along El Segundo Boulevard | Coherent 5–5, eyes soft on a single flare |
| 7 | Court Stillness | Recreation Park pickleball courts, between game windows | Long exhale, double the inhale |
| 8 | Pier Closer | Manhattan Beach pier (radius edge) | Long exhale, eyes on horizon, no count |

Each sitting also has: time of day, duration, prompt, and artifact (see source in `src/lib/marineLayer.ts`).

### Marine Layer principles

1. The place is the curriculum. We do not import a meditation; we let the location teach the breath.
2. No app required. The /meditate room is a tool, not the room. The room is El Segundo.
3. One artifact per sit. Small, public, and dated. A note, a photo, a count, a name.
4. Silence outranks insight. We do not summarize what someone said in the round of names.
5. The marine layer is the bell. If you cannot hear traffic, planes, surf, or fog, you are sitting in the wrong place.

### Stewardship roles (Marine Layer)

- **Sitter** (1 session): Show up. Sit. Post the artifact same day.
- **Bell** (3 sessions): Carries the timer, opens and closes the sit, welcomes first-timers.
- **Place** (host one sit): Picks the location, posts the time, brings nothing else.
- **Layer** (host the eight): Carries one full eight-week cycle, hands the calendar to the next Layer at the Pier Closer.

---

## First Sit — inaugural session

- **Date:** Saturday 2026-05-09
- **Time:** 6:00–7:15 AM PT (75 minutes)
- **Place:** Plaza El Segundo, north fountain bench (720 S Sepulveda Blvd, El Segundo, CA 90245)
- **Cohort cap:** 12 (honor system for v0)
- **Bring:** A layer (~56°F). A small notebook or your phone in airplane mode. Nothing else.
- **Practice:** 4–7–8 breath for the first eight rounds, then natural breath.
- **After:** Walk back, log it as a Custody or Hours give-back at /commons (+1 weight toward First Bench).

### First Sit run-of-show (75 min)

| Minutes | Label | Detail |
|---|---|---|
| 0–10 | Arrive in fog | No introductions yet. Park, walk to the bench, sit. |
| 10–20 | Frame | What Marine Layer is, what it is not, how a place-based sitting practice differs from an app timer. |
| 20–50 | First sit | 30 min. 4–7–8 for the first eight rounds, then natural breath. The marine layer is the bell. |
| 50–65 | One round of names | One sentence each: where you sat, what you noticed. No commentary. |
| 65–75 | Lock the eight | Pick the next session, name a steward, put the eight-week calendar on the wall. |

---

## Files to create

All file contents are in the conversation transcript of 2026-05-02 (Claude Code session). Reapply paths:

| Path | Purpose |
|---|---|
| `src/lib/marineLayer.ts` | Marine Layer types and seed data |
| `src/lib/commons.ts` | Commons types, registry, wishlist, ledger kinds, First Bench, seed receipts, thesis |
| `src/lib/firstSit.ts` | First Sit single-source-of-truth constants |
| `src/pages/marine-layer.astro` | Marine Layer editorial page (blue-hour palette, fog crest) |
| `src/pages/marine-layer.json.ts` | Marine Layer JSON mirror |
| `src/pages/commons.astro` | Commons editorial page (sage-green palette, bench crest, browser-local form) |
| `src/pages/commons.json.ts` | Commons JSON mirror |
| `src/pages/first-sit.astro` | First Sit RSVP page (browser-local form, .ics export) |
| `docs/briefs/2026-05-02-manus-first-bench-hilltop.md` | Manus parks-department intake brief |
| `docs/briefs/2026-05-02-clt-shell-thesis.md` | CA nonprofit / CLT vehicle research for Phase 2 readiness |

### Astro gotchas

- Form scripts must use `<script is:inline>`, not the default module script. The default goes through Vite, which doesn't re-execute on Astro view-transition navigation, so the form's submit handler never attaches.
- Each new page should use `BlockLayout` for parity with the rest of PointCast.
- JSON mirrors follow the `/areas.json.ts` pattern.

---

## Manus handoff — First Bench parks-department intake

Brief lives at `docs/briefs/2026-05-02-manus-first-bench-hilltop.md`. Four research-only tasks (no contact, no submissions): confirm the Hilltop SW corner from satellite + street view, find the City of El Segundo bench-donation pathway (program URL, cost, application form, contact), look for precedent donor benches at Hilltop / Imperial overlook / Library Park, and confirm Hilltop is City of El Segundo property (not LAUSD, not LAX, not joint jurisdiction). 45-minute time budget. Log to `docs/manus-logs/2026-05-02-first-bench-intake.md`.

---

## CLT vehicle thesis — Phase 2 readiness

Brief lives at `docs/briefs/2026-05-02-clt-shell-thesis.md`. Recommends California nonprofit public-benefit corporation with eventual 501(c)(3) status. Filing path under $400 (Articles ~$30, 1023-EZ ~$275, CT-1 free). Governance built around one specific failure mode: *founder bored → board captured → trust quietly sells parcel to developer*. Key clauses: 5–9 directors, three-year term limits, founder out by year five, acquisition supermajority + 12-month-prior-stewardship rule, disposition trap on the deed, 7-year sunset review.

Pre-trigger work in the next 60 days: pro-bono counsel, draft bylaws, draft deed-restriction language, talk to one existing CA CLT, decide founding board (five names, three not Mike).

Open MH decisions:
- Entity name: PointCast Commons Trust vs El Segundo Commons Trust vs South Bay Commons Trust.
- Approve Manus parks-department outreach after intake lands.

Codex review requested on the disposition trap and conservation-easement holder qualification under IRC §170(h).

---

## Reapply checklist

```
git checkout -b feature/commons-marine-layer
# paste each file from the 2026-05-02 transcript
git add src/lib/{marineLayer,commons,firstSit}.ts \
        src/pages/{marine-layer,commons,first-sit}.astro \
        src/pages/{marine-layer,commons}.json.ts \
        docs/briefs/2026-05-02-* \
        docs/initiatives/2026-05-02-commons-and-marine-layer.md
npm run build:bare
git commit -m "Marine Layer + Commons + First Sit"
```

Verify in dev:
- `/marine-layer` 200, `/marine-layer.json` 200
- `/commons` 200, `/commons.json` 200, form submits and persists in localStorage
- `/first-sit` 200, RSVP form persists, .ics download works

---

## Why this matters

The throughline from "give back to the people" to a real bench in a real park is short and unglamorous. It runs: principles → registry → ledger → pilot → receipt → commitment → build → open hours → next pilot. The work above is that pipeline made concrete for one bench at one corner of one park. If it fails, it fails small. If it works, the pipeline is the template for everything else in the wishlist.
