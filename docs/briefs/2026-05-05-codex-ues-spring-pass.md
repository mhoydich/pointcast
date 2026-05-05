# Codex review — UES spring pass

**Audience:** Codex.
**Status:** Review request. Cross-route, publishing-touching, agent-readable. Per CLAUDE.md, this kind of change asks for Codex review before merge to `main`.
**Time budget:** ~3 hours. If anything takes longer than 30 minutes alone, stop and report.
**Where to write the result:** `docs/codex-logs/2026-05-05-ues-spring-pass.md`.

---

## What shipped

Across the last several Claude Code sessions, eight new public surfaces and one published research paper landed under the University of El Segundo banner. All have human pages and JSON mirrors:

| Path | What it is |
|---|---|
| `/marine-layer`, `/marine-layer.json` | UES Track 07 — 8-week place-based meditative program inside the 25-mile radius. |
| `/first-sit`, JSON via the page meta | RSVP for Saturday 2026-05-09 6:00 AM at Plaza El Segundo north fountain bench. Browser-local form, .ics export. |
| `/commons`, `/commons.json` | Give-back layer — registry, wishlist with triggers, six-kind ledger, First Bench pilot, browser-local log form, 5-phase acquisition thesis. |
| `/sponsor-a-bench` | Focused donor surface for First Bench. Cost breakdown, 4 contribution tiers, browser-local intent-to-donate form. |
| `/civic-layer` | UES Track 04 deep page — six civic surfaces inside the radius, 8-week literacy sequence. |
| `/geology`, `/geology.json` | UES Track 08 — stratigraphic column, Newport-Inglewood Fault deep-dive, three scales, 12 stones with Noun pairings, four field walks. |
| `/stones`, `/stones.json` | 226-entry mineral catalog across 14 categories with filters. |
| `/stone-game`, `/stone-game.json` | Brutalist + midcentury card game. 32 cards with 4-axis energy profiles. JSON includes full ChatGPT image-prompt batch. |
| `/trapper-keeper`, `/trapper-keeper.json` | UES Working Paper 2026-04: "Velcro and Memory: A Material History of the Mead Trapper Keeper, 1978-2001." 9 sections, 14 footnotes, 14 references, 4 SVG specimen plates. |

Two prior briefs already filed: `docs/briefs/2026-05-02-manus-first-bench-hilltop.md` (Manus parks-department intake, research-only) and `docs/briefs/2026-05-02-clt-shell-thesis.md` (California 501(c)(3) Phase 2 readiness research).

---

## Priority topics for review

### High priority

**1. Geology fact-checks (`/geology`, `/stones`, `/stone-game`).** The page makes specific claims about formation ages, fault parameters, and citation accuracy. Verify or flag:
- Manhattan Beach Sand Dunes formation age range (~10 Kya – ~125 Kya stated for the Late Pleistocene aeolian unit).
- Newport-Inglewood Fault: ~75 km on land, ~0.5–1.0 mm/yr right-lateral slip, 1933 Long Beach M6.4. Trace through Beverly Hills → Inglewood → Sepulveda → offshore.
- Catalina Schist age range (~115–85 Mya peak metamorphism stated).
- Monterey Formation age range (~17–5 Mya).
- Sierra Nevada batholith peak emplacement (~100–85 Mya).
- Banded Iron Formation timing (~2.5 to 1.85 Bya).
- El Segundo Blue butterfly USFWS listing year (1976 stated) and host plant (*Eriogonum parvifolium*).
- The 226-stone catalog at `/stones` — spot-check a sample of formulas and localities. Particularly: pyroelectric/piezoelectric "literal" flags on tourmaline, magnetite ferromagnetic literal flag, calcite double refraction literal flag, kyanite directional hardness, cordierite polarization (I claim it is the "viking compass" stone).

**2. Trapper Keeper paper citation propriety.** The paper at `/trapper-keeper` includes both real and gently-fictional references. Verify the line is held cleanly:
- Real, should be verifiable: Crutchfield 1978 invention at Mead, US Patent 4,303,259 (the angled-pocket portfolio, granted 1981 in the paper), Lisa Frank licensing in approximately 1993, ~75M units estimate, Designer Series 1989, discontinued ~2001, South Park "Trapper Keeper" episode airing 2000-11-15 (S4E12), iPod introduction 2001-10-23. *Confirm or correct each. The paper number for the Crutchfield portfolio patent is the most likely error.*
- Fictional but framed as real (low-risk because the UES Working Papers series is itself fictional in PointCast canon): Yon (2019) *Sounds That Stopped*, the three UES working papers cited in the bibliography (Marine Layer, Commons, Civic Layer), the Cox-Mead Manuscript Collection.
- Specifically called out: any IP risk in Plate IV's Lisa Frank-style cover. The plate is a generic rainbow + winged-horse silhouette; the figcaption labels it a *reconstruction*. Flag if you think this is too close.

**3. Schema.org JSON-LD correctness.** Every new page embeds JSON-LD. Confirm types are appropriate:
- `/marine-layer` uses `Course`. OK.
- `/civic-layer` uses `EducationalOccupationalProgram`. Borderline — verify.
- `/commons` uses `CollectionPage` with embedded `GeoCircle` for the radius.
- `/first-sit` uses `Event` with `OfflineEventAttendanceMode`.
- `/sponsor-a-bench` uses `DonateAction`. Verify shape and `recipient` properties.
- `/geology` uses `Course`.
- `/stones` uses `CollectionPage` with `numberOfItems`.
- `/stone-game` uses `Game` with `numberOfPlayers` quantitative-value.
- `/trapper-keeper` uses `ScholarlyArticle` with `isPartOf` `Periodical`.

### Medium priority

**4. Throughline + cross-link integrity.** The narrative is supposed to read: *Marine Layer sits → log it (Commons) → contribute (Sponsor a Bench) → show up to civic surfaces (Civic Layer) → stand on the ground itself (Geology) → pull a stone (Stones, Stone Game) → and remember the Trapper Keeper (Working Paper).* Walk the chain. Note any dead-end links, missing reciprocal cross-references, or places where a reader could fall off the throughline.

**5. Voice consistency.** UES voice is: scholarly without being precious, place-anchored, gently absurd at the edges, sincere at the core. Spot-check a paragraph from each page for tonal drift. The Trapper Keeper paper is the most explicit test — its closing line is "RIIIIIP" and that lands either as well-earned or precious. Your call.

**6. Browser-local form pattern.** Three surfaces use the v0 localStorage pattern (Paddle Tide derivative): `/commons` (give-back log), `/first-sit` (RSVP), `/sponsor-a-bench` (intent-to-donate), `/civic-layer` (attendance log). All use `<script is:inline>` and bind on both initial load and `astro:page-load`. Confirm the binding survives view-transition navigation across the full set; in earlier paddle-exchange QA the binding broke for the first transition.

### Low priority

**7. STONE ENERGIES card game balance.** 32 cards, 4-axis energies (P/E/L/M, 0–10 each). Default sample exchange on the page is Black Tourmaline vs. Calcite, total +3, verdict ABSORB. Run a sanity check — pair Diamond (10/5/10/9) against Beach Sand silica (5/9/7/6) and see what falls out. Flag any cards that look strictly dominant or strictly dominated, since a flat power curve was the design intent.

**8. ChatGPT image-prompt batch.** The 32 prompts at `/stone-game.json#imagePromptBatch` reference Saul Bass / Paul Rand / Alvin Lustig / Massimo Vignelli / Wim Crouwel. They are written to be batchable into DALL-E or Midjourney. Read three or four prompts and flag anything that would predictably trip a content filter (e.g., explicit "no text" instructions, attempts to imitate a specific living artist's signature style).

---

## What you do not need to review

- Other agents' concurrent work on `/explore`, `/special-brew`, `/yee`, the drum rooms, the battler — those have their own briefs and review threads.
- The Manus parks-department intake (`docs/briefs/2026-05-02-manus-first-bench-hilltop.md`) — that's a real-world ops handoff, no code review needed from your end.
- Cosmetic CSS choices that are clearly tonally-on. The brutalist palette on `/stone-game` is intentional.

---

## Acceptance criteria

- A log file written to `docs/codex-logs/2026-05-05-ues-spring-pass.md`.
- Each High-priority topic addressed; each Medium-priority topic at least scanned.
- Specific corrections where applicable (formation age range, fault slip rate, citation date, schema.org type).
- A short verdict at the top: GREEN (publishable as is), YELLOW (publish after listed fixes), or RED (do not publish; substantial rework needed).
- Time budget honored.

## Mike approval needed for

- Publishing the Trapper Keeper paper publicly if any citation is materially wrong, or if Plate IV's Lisa Frank IP exposure is non-trivial.
- Any change to first principles wording in the Commons or Marine Layer pages — those are the load-bearing copy.
- Renaming any of the surfaces (e.g., if you think `/civic-layer` should be `/track-04` for shape parity with the rest of the UES tracks).

## Ledger note

A pending Expertise entry has been added to the Commons ledger seed (`src/lib/commons.ts`, `LEDGER_SEED`) with weight 0 to record the request. When your log lands, the entry's weight will be updated to +9 (3 hours × Expertise weight 3) and the toward field will move from "Phase 0 · Map · pending" to the appropriate phase the review unblocks. This is just bookkeeping — the work is its own reward.

---

*Voice is scholarly; the affection is sincere. Thanks for the pass.*
