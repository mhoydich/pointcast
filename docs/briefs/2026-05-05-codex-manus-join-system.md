# Brief - Join System build queue

**Audience:** Codex, Manus, cc, and any human collaborator picking up a bounded PointCast task.

**Source:** Gmail idea overview from 2026-04-30, then Mike 2026-05-05 chat: "ok publish as part of a join system to build, via agent tasks, people tasks, etc".

**Route:** `/join` and `/join.json`.

This brief turns the old startup/product-idea archive into a working build queue. The goal is not to summarize the ideas again. The goal is to make each idea claimable by people and agents.

---

## Task J-1 - Cartography PRD v0

**Owner:** Codex or cc.

**Scope:** Draft the first proper PRD for Digital Identity Cartography.

Include:
- Input model: links, handles, uploads, self-claims, manual notes.
- Output model: identity map, source confidence, collaboration suggestions, public page.
- Privacy model: opt-in, claim flow, hidden fields, takedown.
- V0 demo flow: one person, 5-8 links, static generated profile page.
- Risks: platform access, same-person matching, public aggregation creep.

**Deliverable:** `docs/briefs/2026-05-05-cartography-prd-v0.md` or a dedicated `/projects/cartography` route if Mike asks for a public version.

---

## Task J-2 - Static profile-map demo

**Owner:** Codex.

**Scope:** Build one no-scraping demo using mock data. Do not call external APIs in v0.

Include:
- `src/lib/cartography-demo.ts` or equivalent data file.
- Human route showing a profile map, source links, confidence notes, and suggested collaborators.
- JSON route exposing the same shape for agents.
- Link back to `/join` and `/join.json`.

**Deliverable:** Astro route plus JSON sibling. Keep the page static and reviewable.

---

## Task J-3 - People candidate list

**Owner:** Mike or a human collaborator.

**Scope:** Name 10 people whose scattered identity would make a strong Cartography demo.

For each:
- Why their scattered identity is interesting.
- Which links are public.
- Whether asking permission is easy.
- What a better profile would help them do.

**Deliverable:** Private note or redacted PR-safe version. Do not publish names without permission.

---

## Task J-4 - BossList first vertical

**Owner:** Mike.

**Scope:** Pick one list vertical for a modern BossList wedge.

Good candidates have:
- Real search behavior.
- Clear professional upside for being listed.
- Enough public profiles to curate 25 entries.
- A PointCast reason to exist beyond generic directory spam.

**Deliverable:** `/ping` note naming the chosen vertical, why it wins, and what the first 25-entry list should include.

---

## Task J-5 - Contribution receipt schema

**Owner:** Codex.

**Scope:** Convert TrustCommons into a small PointCast contribution receipt format.

Avoid a trust score in v0. Focus on receipts:
- Who contributed.
- What task was claimed.
- What artifact shipped.
- Who reviewed or verified it.
- Where the artifact lives.
- What follow-up remains.

**Deliverable:** Schema note plus one sample JSON receipt. Candidate future surface: `/receipts.json`.

---

## Task J-6 - Manus outreach pass

**Owner:** Manus.

**Scope:** Find 12 specific people who might care about Cartography as a product, not PointCast as a website.

Target:
- Creative technologists.
- AI builders with scattered public work.
- Indie software people with many side projects.
- Music/visual creators with cross-platform identity.

**Deliverable:** `docs/outreach/2026-05-05-cartography-first-12.md` with contact shape, why they care, and one non-generic opener per person.

---

## Task J-7 - Share packet

**Owner:** Codex + Mike.

**Scope:** Draft compact invite copy for the join system.

Packets:
- Agent/coder version.
- Human creative version.
- Old BossList contact version.
- Local El Segundo version.

**Deliverable:** Short copy set and one recommended URL per packet. Default URL is `/join`; deeper URLs may point to `/join#cartography`, `/briefs`, or `/collabs`.

---

## Done when

- `/join` and `/join.json` are live.
- Block `0435` announces the join system.
- The first Cartography PRD task is claimed or parked with a clear blocker.
- At least one people task and one agent task have a named owner.

Filed by Codex - 2026-05-05.
