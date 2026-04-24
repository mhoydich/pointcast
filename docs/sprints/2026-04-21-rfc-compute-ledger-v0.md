---
sprintId: rfc-compute-ledger-v0
firedAt: 2026-04-21T14:20:00-08:00
trigger: chat
durationMin: 25
shippedAs: staged · awaiting deploy
status: staged
---

# chat tick — Compute Ledger RFC v0 drafted + cross-post brief

## What shipped

Mike 2026-04-21 14:05 PT: *"lets go, do."*

Third ship in the afternoon arc after the research pass. Block 0368 (research) named the highest-leverage move — "the compute-ledger space is actually empty; write the RFC before someone else names the primitive." Mike approved with two words. This is the spec.

### Files shipped

- **`docs/rfc/compute-ledger-v0.md`** (new, ~3,500 words) — formal specification document. 14 numbered sections + 3 appendices. RFC 2119 normative language (MUST / SHOULD / MAY) throughout. Sections: (1) abstract, (2) motivation, (3) terminology, (4) JSON contract with required/optional field tables, (5) signature bands, (6) HTTP contract + optional x402 tiering, (7) federation (registration, mirroring, unfederating), (8) Git commit trailer bridge (extends `Assisted-by:` + `Generated-by:` with `(compute-ledger: {artifact})` suffix), (9) security considerations, (10) privacy considerations, (11) extensions, (12) prior art, (13) reference implementation, (14) acknowledgments, (15) license. Appendices: (A) minimum valid doc, (B) richer federation example, (C) changelog. Spec text is CC0; reference implementation is MIT. Canonical URL: `pointcast.xyz/rfc/compute-ledger-v0`; GitHub mirror already live.

- **`docs/federation-examples/README.md`** (modified) — added a "Canonical spec" section at the top pointing at the RFC, plus an inline reference to RFC §3 as the authoritative shape. Federation examples now explicitly conform to the RFC.

- **`src/content/blocks/0370.json`** (new) — CH.FD · NOTE · 3x2 · **mh+cc** · 6-min read. Cover-letter block narrating what the RFC is, what's in it, what's explicitly deferred, the self-falsifying test ("if two peers federate in a month, ship v0.2; if zero, premise was wrong"). Companions wired to 0368 (the research that named the move), 0330 (the compute-ledger primitive), 0360 (Vol. II cover).

- **`docs/briefs/2026-04-21-manus-rfc-crosspost.md`** (new) — three numbered Manus tasks addending the Vol. II GTM brief:
  - **R-1** LF AAIF working group post (250-400 words, Mike signs, Mike approves wording first)
  - **R-2** Paris Open Source AI Summit 2026 CfP submission for §7 bridge talk
  - **R-3** soft outreach to two personal-blog writers (Mike picks from Willison / Appleton / Karpathy / Roselli / Gwern; Mike sends under his own name)

- **`src/lib/compute-ledger.ts`** — 3 new entries prepended: editorial (RFC draft, heavy), block ship (0370, modest), Manus brief (cross-post, modest).

### Why this shape

Three things the RFC does deliberately:

1. **Names the primitive.** "Compute Ledger v0" is a named thing now — if another project ships a conflicting format in a month, this has a prior-art record. The research pass at block 0368 §2.6 was explicit that the space is empty; the RFC stakes the flag.
2. **Stays small.** 14 sections sounds like a lot; the text is ~3,500 words and the required surface is a two-page JSON contract. Anyone who wants to federate can read it once and implement in an hour. No verifiable-credential proofs, no automated spam detection, no multi-aggregator first-class support — all explicitly deferred to future versions. Small is useful.
3. **Is self-falsifying.** Block 0370 closes with the test: "if two independent peers federate in a month, ship v0.2; if zero, the premise was wrong and the spec goes back in the drawer." RFC §14 milestones encode the same posture (v0.2 May, v0.3 June, v1.0 August). If nobody registers, PointCast goes back to just running the primitive privately. No ego cost.

### Voice + author

- Spec document (`docs/rfc/compute-ledger-v0.md`) has no author field in the PointCast sense; authorship is listed in the RFC front-matter as "cc + Mike Hoydich · PointCast." This is conventional spec-document attribution.
- Block 0370 is `author: mh+cc`. Mike directed the move ("lets go, do" approving the RFC as the top pick from block 0368); cc wrote the text. `source` field cites the chat directive and names the artifact.
- Manus brief is internal ops documentation, no author field.

### What did NOT ship

- **No commit or deploy.** Everything staged on top of the afternoon's other stages (Vol. II arc, Sprint #90, research memo, block 0368).
- **No Manus dispatch yet.** The cross-post brief is filed; Manus will pick it up on next session with Mike reviewing copy before any posts fire.
- **No `/rfc/` route yet.** The RFC is a markdown file; the canonical URL `pointcast.xyz/rfc/compute-ledger-v0` will resolve once an Astro page reads from `docs/rfc/`. A follow-up ship can stand that up — ~30 min of cc work. For now GitHub link is the public surface.
- **No `/compute` page update.** §12 says the reference implementation is at `/compute`; the page already describes federation in its own text. Tightening it to point at the RFC is a small follow-up.
- **No `Assisted-by:` wiring in commit hooks.** §7 describes the bridge; actually enforcing it in a Git commit hook is future work.

### Guardrail check

- **Schema changes?** No. The RFC describes the existing v0 schema; does not change runtime behavior.
- **Brand claims?** None market-facing. The RFC explicitly disclaims itself ("descriptive, not prescriptive").
- **Mike-voice content?** Block 0370 is `mh+cc` with Mike quoted in `source`. RFC authorship listed jointly in spec front-matter per convention. Safe.
- **Real money / DAO?** No. §5.1 and §10 describe x402 as an *optional* extension; no payment flow is mandated or shipped in this spec ship.
- **Contract origination?** No.

Safe to commit.

## Deploy (pending)

Files to add on top of the afternoon commit chain (Vol. II arc + Sprint #90 + research memo + block 0368):

- `docs/rfc/compute-ledger-v0.md`
- `docs/federation-examples/README.md` (modified — canonical-spec reference)
- `src/content/blocks/0370.json`
- `docs/briefs/2026-04-21-manus-rfc-crosspost.md`
- `src/lib/compute-ledger.ts` (modified — 3 new entries)
- `docs/sprints/2026-04-21-rfc-compute-ledger-v0.md` (this file)

Recommended commit message: `feat(rfc): Compute Ledger v0 spec + block 0370 cover + Manus cross-post brief`.

Post-deploy verification:
- `curl -sI https://raw.githubusercontent.com/mhoydich/pointcast/feat/collab-clock/docs/rfc/compute-ledger-v0.md` → 200, text/plain
- `curl https://pointcast.xyz/b/0370.json | jq '.meta.tag'` → `"compute-ledger-rfc-v0"`
- `pointcast.xyz/rfc/compute-ledger-v0` → either resolves (if an Astro route is added in a follow-up) or returns 404 until then (GitHub mirror is the public fallback)

## Follow-ups

- (a) **Astro page at `/rfc/[slug]`** that reads from `docs/rfc/*.md` and renders them with BlockLayout chrome. ~30 min. Makes `pointcast.xyz/rfc/compute-ledger-v0` resolve natively.
- (b) **`/compute` page footer update** to cite the RFC explicitly. ~10 min.
- (c) **A Git pre-commit hook snippet in `docs/setup/`** that prompts for an `Assisted-by: / Generated-by:` trailer on commits touching `src/`. Ties §7 to practice. ~30 min.
- (d) **`/compute.json?about` metadata endpoint** per RFC §5.1. Returns the node's tier pricing, retention policy, federation posture. Can land with v0.2. ~45 min.
- (e) **Manus R-1/R-2/R-3 execution** — let Manus pick these up on next session.
- (f) **Dispatch a second research agent** to find one or two more candidate RFC reviewers in the standards community (IETF AGENT WG, W3C CG, OpenAPI Alliance). ~2 hours of research. Not urgent.

---

— filed by cc, 2026-04-21 14:20 PT, sprint `rfc-compute-ledger-v0`. Fourth ship in the afternoon's Vol. II research-and-execute arc. Predecessors: block 0368 (research editorial), the research memo at `docs/research/2026-04-21-where-we-are.md`. Block 0370 + Manus brief + RFC + ledger entries ship in the same deploy as this recap.
